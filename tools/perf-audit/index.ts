#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { chromium, devices, Page, CDPSession } from 'playwright';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

interface CLIOptions {
  targetUrl: string;
  maxPages: number;
  maxNavigations: number;
  outputDir: string;
  retries: number;
  timeoutMs: number;
}

interface ThrottlingProfileConfig {
  id: 'mobile' | 'desktop';
  name: string;
  device?: keyof typeof devices;
  cpuSlowdownMultiplier: number;
  network: {
    offline: boolean;
    downloadThroughput: number;
    uploadThroughput: number;
    latency: number;
  } | null;
  lighthouse: Record<string, unknown>;
}

interface LighthouseCoreMetrics {
  ttfb: number | null;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  fid: number | null;
  tti: number | null;
  speedIndex: number | null;
  tbt: number | null;
  score: number | null;
}

interface DOMStatistics {
  nodeCount: number;
  elementCount: number;
  textNodeCount: number;
  depth: number;
  interactiveElements: number;
  forms: number;
  scripts: number;
  stylesheets: number;
  images: number;
  iframes: number;
}

interface AnimationMetadata {
  name: string | null;
  duration: number;
  delay: number;
  iterationCount: number | 'infinite';
  playState: string;
}

interface LongTaskEntry {
  name: string;
  startTime: number;
  duration: number;
}

interface RouteChangeTiming {
  url: string;
  timestamp: number;
}

interface BundleSizeSummary {
  totalBytes: number;
  scripts: number;
  styles: number;
  images: number;
  fonts: number;
  other: number;
}

interface CoverageSummary {
  totalBytes: number;
  usedBytes: number;
  unusedBytes: number;
  files: Array<{
    url: string;
    totalBytes: number;
    usedBytes: number;
    unusedBytes: number;
  }>;
}

interface ImageDiagnostic {
  src: string;
  alt: string | null;
  naturalWidth: number;
  naturalHeight: number;
  displayedWidth: number;
  displayedHeight: number;
  byteSize: number | null;
  isResponsive: boolean;
  isLazy: boolean;
}

interface NavigationMetrics {
  navigationTimings: unknown[];
  paintTimings: unknown[];
  longTasks: LongTaskEntry[];
  animationDetails: AnimationMetadata[];
  layoutShifts: unknown[];
  repaintCount: number;
  domStats: DOMStatistics;
  imageDiagnostics: ImageDiagnostic[];
}

interface NetworkLogEntry {
  requestId: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  startTime: number;
  endTime?: number;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  mimeType?: string;
  encodedDataLength?: number;
}

interface PageRunResult {
  url: string;
  profileId: string;
  lighthouse: LighthouseCoreMetrics & { rawReport: unknown };
  navigation: NavigationMetrics;
  bundle: BundleSizeSummary;
  coverage: {
    js: CoverageSummary;
    css: CoverageSummary;
  };
  cdpLogs: Record<string, unknown[]>;
  routeChanges: RouteChangeTiming[];
  harPath: string;
  lcpScreenshot: string;
}

interface ProfileReport {
  profile: ThrottlingProfileConfig;
  pages: PageRunResult[];
}

interface AuditReport {
  targetUrl: string;
  generatedAt: string;
  options: CLIOptions;
  profiles: ProfileReport[];
  summary: {
    slowestLcp: number | null;
    heaviestPage: number | null;
    recommendations: string[];
  };
}

const DEFAULT_OPTIONS: CLIOptions = {
  targetUrl: '',
  maxPages: 1,
  maxNavigations: 10,
  outputDir: path.resolve(process.cwd(), 'tools/perf-audit/output'),
  retries: 2,
  timeoutMs: 60000,
};

const PROFILES: ThrottlingProfileConfig[] = [
  {
    id: 'mobile',
    name: 'Mobile - Fast 3G / CPU×4',
    device: 'Pixel 5',
    cpuSlowdownMultiplier: 4,
    network: {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      latency: 150,
    },
    lighthouse: {
      throttling: {
        rttMs: 150,
        throughputKbps: 1.6 * 1024,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 150,
        downloadThroughputKbps: 1.6 * 1024,
        uploadThroughputKbps: 750,
      },
      emulatedFormFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 393,
        height: 851,
        deviceScaleFactor: 2.75,
        disabled: false,
      },
    },
  },
  {
    id: 'desktop',
    name: 'Desktop - Unthrottled',
    cpuSlowdownMultiplier: 1,
    network: null,
    lighthouse: {
      throttling: {
        rttMs: 0,
        throughputKbps: 0,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      emulatedFormFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        disabled: false,
      },
    },
  },
];

function parseArgs(argv: string[]): CLIOptions {
  const options: CLIOptions = { ...DEFAULT_OPTIONS };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const parts = arg.includes('=') ? arg.split('=') : [arg, argv[i + 1]];
    const key = parts[0];
    const value = parts[1] ?? '';
    switch (key) {
      case '--target':
      case '--url':
      case '--TARGET_URL':
        options.targetUrl = value;
        break;
      case '--max-pages':
        options.maxPages = Number.parseInt(value, 10) || options.maxPages;
        break;
      case '--max-navigations':
        options.maxNavigations = Math.min(10, Number.parseInt(value, 10) || options.maxNavigations);
        break;
      case '--output':
        options.outputDir = path.resolve(value);
        break;
      case '--retries':
        options.retries = Math.max(0, Number.parseInt(value, 10) || options.retries);
        break;
      case '--timeout':
        options.timeoutMs = Number.parseInt(value, 10) || options.timeoutMs;
        break;
      default:
        break;
    }
  }

  const envTarget = process.env.TARGET_URL;
  if (!options.targetUrl && envTarget) {
    options.targetUrl = envTarget;
  }
  if (!options.targetUrl) {
    console.error('❌ TARGET_URL is required.');
    process.exit(1);
  }
  return options;
}

async function enableDomains(session: CDPSession, domains: string[]): Promise<void> {
  for (const domain of domains) {
    await session.send(`${domain}.enable`);
  }
}

async function applyThrottling(session: CDPSession, profile: ThrottlingProfileConfig): Promise<void> {
  await session.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuSlowdownMultiplier });
  if (profile.network) {
    await session.send('Network.emulateNetworkConditions', profile.network);
  }
}

async function collectNavigationMetrics(page: Page): Promise<NavigationMetrics> {
  return page.evaluate(() => {
    const navigationTimings = performance.getEntriesByType('navigation').map((entry) => ({
      name: entry.name,
      type: (entry as PerformanceNavigationTiming).type,
      startTime: entry.startTime,
      duration: entry.duration,
      domContentLoadedEventEnd: (entry as PerformanceNavigationTiming).domContentLoadedEventEnd,
      loadEventEnd: (entry as PerformanceNavigationTiming).loadEventEnd,
      transferSize: (entry as PerformanceNavigationTiming).transferSize,
    }));

    const paintTimings = performance.getEntriesByType('paint').map((entry) => ({
      name: entry.name,
      startTime: entry.startTime,
    }));

    const layoutShifts = (performance.getEntriesByType('layout-shift') as PerformanceEntry[]).map((entry) => ({
      name: entry.name,
      startTime: entry.startTime,
      value: (entry as any).value ?? null,
      hadRecentInput: (entry as any).hadRecentInput ?? null,
    }));

    const longTasks = (performance.getEntriesByType('longtask') as PerformanceEntry[]).map((entry) => ({
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
    }));

    const animationDetails = (document.getAnimations?.() || []).map((animation) => ({
      name: animation.id || (animation as any).animationName || null,
      duration: animation.effect?.getTiming()?.duration ?? 0,
      delay: animation.effect?.getTiming()?.delay ?? 0,
      iterationCount: animation.effect?.getTiming()?.iterations ?? 1,
      playState: animation.playState,
    }));

    const allNodes = Array.from(document.querySelectorAll('*'));
    const domStats = {
      nodeCount: document.getElementsByTagName('*').length,
      elementCount: allNodes.length,
      textNodeCount: (() => {
        let count = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        while (walker.nextNode()) count += 1;
        return count;
      })(),
      depth: (() => {
        let max = 0;
        const stack: Array<{ element: Element; depth: number }> = allNodes.map((element) => ({ element, depth: 1 }));
        while (stack.length) {
          const { element, depth } = stack.pop()!;
          max = Math.max(max, depth);
          stack.push(...Array.from(element.children).map((child) => ({ element: child, depth: depth + 1 })));
        }
        return max;
      })(),
      interactiveElements: document.querySelectorAll('a, button, input, textarea, select, details, summary').length,
      forms: document.querySelectorAll('form').length,
      scripts: document.querySelectorAll('script').length,
      stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
      images: document.querySelectorAll('img').length,
      iframes: document.querySelectorAll('iframe').length,
    };

    const images = Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.currentSrc || img.src,
      alt: img.alt || null,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayedWidth: img.clientWidth,
      displayedHeight: img.clientHeight,
      isResponsive: img.sizes !== '' || img.srcset !== '',
      isLazy: img.loading === 'lazy',
    }));

    return {
      navigationTimings,
      paintTimings,
      longTasks,
      animationDetails,
      layoutShifts,
      repaintCount: paintTimings.length,
      domStats,
      imageDiagnostics: images,
    };
  });
}

function summariseCoverage(entries: Array<{ url: string; functions: Array<{ ranges: Array<{ startOffset: number; endOffset: number; count: number }> }> }>, sources: Map<string, string>): CoverageSummary {
  const files: CoverageSummary['files'] = [];
  let totalBytes = 0;
  let usedBytes = 0;

  for (const entry of entries) {
    const source = sources.get(entry.url) ?? '';
    const fileBytes = Buffer.byteLength(source, 'utf8');
    let fileUsed = 0;
    for (const fn of entry.functions ?? []) {
      for (const range of fn.ranges ?? []) {
        fileUsed += range.endOffset - range.startOffset;
      }
    }
    totalBytes += fileBytes;
    usedBytes += fileUsed;
    files.push({
      url: entry.url,
      totalBytes: fileBytes,
      usedBytes: fileUsed,
      unusedBytes: Math.max(fileBytes - fileUsed, 0),
    });
  }

  return {
    totalBytes,
    usedBytes,
    unusedBytes: Math.max(totalBytes - usedBytes, 0),
    files,
  };
}

function buildHar(pages: RouteChangeTiming[], requests: Map<string, NetworkLogEntry>, targetUrl: string): unknown {
  const startedDateTime = new Date().toISOString();
  const harPages = pages.map((page, index) => ({
    startedDateTime,
    id: `${index + 1}`,
    title: page.url,
    pageTimings: {
      onContentLoad: -1,
      onLoad: -1,
    },
  }));

  const entries = Array.from(requests.values()).map((request) => ({
    startedDateTime,
    time: request.endTime && request.startTime ? (request.endTime - request.startTime) * 1000 : 0,
    request: {
      method: request.method,
      url: request.url,
      httpVersion: 'HTTP/1.1',
      headers: Object.entries(request.requestHeaders || {}).map(([name, value]) => ({ name, value })),
      queryString: [],
      headersSize: -1,
      bodySize: -1,
    },
    response: {
      status: request.responseStatus ?? 0,
      statusText: '',
      httpVersion: 'HTTP/1.1',
      headers: Object.entries(request.responseHeaders || {}).map(([name, value]) => ({ name, value })),
      headersSize: -1,
      bodySize: request.encodedDataLength ?? 0,
      content: {
        size: request.encodedDataLength ?? 0,
        mimeType: request.mimeType || 'application/octet-stream',
        text: '',
      },
      redirectURL: '',
    },
    cache: {},
    timings: {
      send: 0,
      wait: 0,
      receive: 0,
    },
    pageref: harPages[0]?.id ?? '1',
  }));

  return {
    log: {
      version: '1.2',
      creator: {
        name: 'perf-audit-cli',
        version: '1.0.0',
      },
      pages: harPages.length
        ? harPages
        : [
            {
              startedDateTime,
              id: '1',
              title: targetUrl,
              pageTimings: { onContentLoad: -1, onLoad: -1 },
            },
          ],
      entries,
    },
  };
}

function extractLighthouseMetrics(lhr: any): LighthouseCoreMetrics {
  const audits = lhr?.audits ?? {};
  const metrics = lhr?.categories?.performance?.score ?? null;
  const pick = (id: string): number | null => (audits[id]?.numericValue ?? audits[id]?.score ?? null);

  return {
    ttfb: pick('server-response-time'),
    fcp: pick('first-contentful-paint'),
    lcp: pick('largest-contentful-paint'),
    cls: pick('cumulative-layout-shift'),
    inp: pick('interaction-to-next-paint') ?? pick('total-blocking-time'),
    fid: pick('max-potential-fid') ?? pick('total-blocking-time'),
    tti: pick('interactive'),
    speedIndex: pick('speed-index'),
    tbt: pick('total-blocking-time'),
    score: metrics,
  };
}

function computeBundleSummary(requests: Map<string, NetworkLogEntry>): BundleSizeSummary {
  const summary: BundleSizeSummary = {
    totalBytes: 0,
    scripts: 0,
    styles: 0,
    images: 0,
    fonts: 0,
    other: 0,
  };

  for (const request of requests.values()) {
    const bytes = request.encodedDataLength ?? 0;
    summary.totalBytes += bytes;
    const mime = request.mimeType || '';
    if (mime.includes('javascript')) {
      summary.scripts += bytes;
    } else if (mime.includes('css')) {
      summary.styles += bytes;
    } else if (mime.startsWith('image/')) {
      summary.images += bytes;
    } else if (mime.includes('font')) {
      summary.fonts += bytes;
    } else {
      summary.other += bytes;
    }
  }

  return summary;
}

function mergeImageDiagnostics(images: ImageDiagnostic[], requests: Map<string, NetworkLogEntry>): ImageDiagnostic[] {
  const byUrl = new Map<string, NetworkLogEntry>();
  for (const request of requests.values()) {
    byUrl.set(request.url, request);
  }

  return images.map((image) => {
    const request = byUrl.get(image.src);
    return {
      ...image,
      byteSize: request?.encodedDataLength ?? null,
    };
  });
}

async function gatherCoverage(session: CDPSession): Promise<{ js: CoverageSummary; css: CoverageSummary }> {
  await session.send('Profiler.enable');
  await session.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
  await session.send('CSS.enable');
  await session.send('CSS.startRuleUsageTracking');

  const sources = new Map<string, string>();
  session.on('Debugger.scriptParsed', (event) => {
    if (event.url && event.scriptSource) {
      sources.set(event.url, event.scriptSource);
    }
  });

  const jsCoveragePromise = session.send('Profiler.takePreciseCoverage');
  const cssCoveragePromise = session.send('CSS.stopRuleUsageTracking');

  const [jsCoverage, cssCoverage] = await Promise.all([jsCoveragePromise, cssCoveragePromise]);
  await session.send('Profiler.stopPreciseCoverage');

  const jsSummary = summariseCoverage((jsCoverage as any).result ?? [], sources);
  const cssSummary = summariseCoverage(
    ((cssCoverage as any).ruleUsage ?? []).map((rule: any) => ({
      url: rule.styleSheetId,
      functions: [
        {
          ranges: [
            {
              startOffset: Math.floor(rule.startOffset ?? 0),
              endOffset: Math.floor(rule.endOffset ?? 0),
              count: rule.used ? 1 : 0,
            },
          ],
        },
      ],
    })),
    sources,
  );

  return { js: jsSummary, css: cssSummary };
}

async function runLighthouseAudit(url: string, profile: ThrottlingProfileConfig): Promise<LighthouseCoreMetrics & { rawReport: unknown }> {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });

  try {
    const { lhr } = await lighthouse(url, {
      port: chrome.port,
      logLevel: 'error',
      throttling: profile.lighthouse.throttling,
      screenEmulation: profile.lighthouse.screenEmulation,
      formFactor: profile.id,
      disableStorageReset: true,
    });

    const coreMetrics = extractLighthouseMetrics(lhr);
    return {
      ...coreMetrics,
      rawReport: lhr,
    };
  } finally {
    await chrome.kill();
  }
}

function computeRecommendations(profiles: ProfileReport[]): string[] {
  const recommendations = new Set<string>();
  for (const profile of profiles) {
    for (const page of profile.pages) {
      const { lighthouse, navigation } = page;
      if ((lighthouse.lcp ?? 0) > 2500) {
        recommendations.add('Improve Largest Contentful Paint by optimizing hero media and critical rendering path.');
      }
      if ((lighthouse.cls ?? 0) > 0.1) {
        recommendations.add('Reduce layout shifts by reserving space for dynamic content and fonts.');
      }
      if ((navigation.longTasks ?? []).some((task) => task.duration > 200)) {
        recommendations.add('Break up long tasks to keep main thread responsive and lower INP.');
      }
      if (page.coverage.js.unusedBytes > page.coverage.js.totalBytes * 0.3) {
        recommendations.add('Ship less JavaScript by code-splitting and removing unused modules.');
      }
      if (page.coverage.css.unusedBytes > page.coverage.css.totalBytes * 0.5) {
        recommendations.add('Eliminate unused CSS and prefer critical CSS inlining.');
      }
    }
  }
  return Array.from(recommendations);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function auditProfile(options: CLIOptions, profile: ThrottlingProfileConfig): Promise<ProfileReport> {
  console.log(`▶️ Starting profile: ${profile.name}`);
  const pages: PageRunResult[] = [];
  const { targetUrl } = options;

  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  try {
    const contextOptions: Parameters<typeof browser.newContext>[0] = {
      ...(profile.device ? devices[profile.device] : {}),
      locale: 'en-US',
    };
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    const session = await context.newCDPSession(page);

    const cdpLogs: Record<string, unknown[]> = {
      Performance: [],
      Network: [],
      Page: [],
      Runtime: [],
    };
    const routeChanges: RouteChangeTiming[] = [];
    const networkRequests = new Map<string, NetworkLogEntry>();

    await enableDomains(session, ['Performance', 'Network', 'Page', 'Runtime', 'Profiler', 'Debugger', 'CSS']);
    await applyThrottling(session, profile);

    session.on('Performance.metrics', (event) => {
      cdpLogs.Performance.push(event);
    });
    session.on('Network.requestWillBeSent', (event: any) => {
      const request: NetworkLogEntry = {
        requestId: event.requestId,
        url: event.request?.url ?? '',
        method: event.request?.method ?? 'GET',
        requestHeaders: event.request?.headers ?? {},
        startTime: event.timestamp ?? Date.now() / 1000,
      };
      networkRequests.set(event.requestId, request);
      cdpLogs.Network.push(event);
    });
    session.on('Network.responseReceived', (event: any) => {
      const request = networkRequests.get(event.requestId);
      if (request) {
        request.responseStatus = event.response?.status;
        request.responseHeaders = event.response?.headers ?? {};
        request.mimeType = event.response?.mimeType;
      }
      cdpLogs.Network.push(event);
    });
    session.on('Network.loadingFinished', (event: any) => {
      const request = networkRequests.get(event.requestId);
      if (request) {
        request.endTime = event.timestamp ?? request.startTime;
        request.encodedDataLength = event.encodedDataLength ?? 0;
      }
      cdpLogs.Network.push(event);
    });
    session.on('Page.loadEventFired', (event) => {
      cdpLogs.Page.push(event);
    });
    session.on('Runtime.consoleAPICalled', (event) => {
      cdpLogs.Runtime.push(event);
    });

    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        routeChanges.push({ url: frame.url(), timestamp: Date.now() });
      }
    });

    let attempts = 0;
    while (attempts <= options.retries) {
      try {
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: options.timeoutMs });
        break;
      } catch (error) {
        attempts += 1;
        console.warn(`Navigation error (${attempts}/${options.retries}):`, error);
        if (attempts > options.retries) {
          throw error;
        }
      }
    }

    await page.waitForTimeout(2000);

    const navigation = await collectNavigationMetrics(page);
    navigation.imageDiagnostics = mergeImageDiagnostics(navigation.imageDiagnostics, networkRequests);

    const coverage = await gatherCoverage(session);
    const bundle = computeBundleSummary(networkRequests);

    ensureDir(options.outputDir);
    const safeProfile = profile.id;
    const harPath = path.join(options.outputDir, `${safeProfile}.har`);
    const screenshotPath = path.join(options.outputDir, `${safeProfile}-lcp.png`);

    const harContent = buildHar(routeChanges, networkRequests, targetUrl);
    fs.writeFileSync(harPath, JSON.stringify(harContent, null, 2), 'utf-8');

    await page.screenshot({ path: screenshotPath, fullPage: true });

    const lighthouse = await runLighthouseAudit(targetUrl, profile);

    const pageResult: PageRunResult = {
      url: targetUrl,
      profileId: profile.id,
      lighthouse,
      navigation,
      bundle,
      coverage,
      cdpLogs,
      routeChanges,
      harPath,
      lcpScreenshot: screenshotPath,
    };

    pages.push(pageResult);

    await context.close();
  } finally {
    await browser.close();
  }

  return { profile, pages };
}

function generateMarkdownReport(report: AuditReport): string {
  const lines: string[] = [];
  lines.push('# Performance Audit Report');
  lines.push('');
  lines.push(`- **Target URL:** ${report.targetUrl}`);
  lines.push(`- **Generated:** ${report.generatedAt}`);
  lines.push('');

  for (const profile of report.profiles) {
    lines.push(`## ${profile.profile.name}`);
    lines.push('');
    for (const page of profile.pages) {
      lines.push(`### ${page.url}`);
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('| --- | ---: |');
      lines.push(`| TTFB | ${page.lighthouse.ttfb?.toFixed?.(0) ?? 'n/a'} ms |`);
      lines.push(`| FCP | ${page.lighthouse.fcp?.toFixed?.(0) ?? 'n/a'} ms |`);
      lines.push(`| LCP | ${page.lighthouse.lcp?.toFixed?.(0) ?? 'n/a'} ms |`);
      lines.push(`| CLS | ${page.lighthouse.cls?.toFixed?.(3) ?? 'n/a'} |`);
      lines.push(`| INP/FID | ${page.lighthouse.inp?.toFixed?.(0) ?? 'n/a'} ms |`);
      lines.push(`| TTI | ${page.lighthouse.tti?.toFixed?.(0) ?? 'n/a'} ms |`);
      lines.push(`| Speed Index | ${page.lighthouse.speedIndex?.toFixed?.(0) ?? 'n/a'} ms |`);
      lines.push(`| TBT | ${page.lighthouse.tbt?.toFixed?.(0) ?? 'n/a'} ms |`);
      lines.push('');
      lines.push('#### Bundle Summary');
      lines.push('');
      lines.push('| Type | Bytes |');
      lines.push('| --- | ---: |');
      lines.push(`| Total | ${page.bundle.totalBytes} |`);
      lines.push(`| Scripts | ${page.bundle.scripts} |`);
      lines.push(`| Styles | ${page.bundle.styles} |`);
      lines.push(`| Images | ${page.bundle.images} |`);
      lines.push(`| Fonts | ${page.bundle.fonts} |`);
      lines.push(`| Other | ${page.bundle.other} |`);
      lines.push('');
      lines.push(`- HAR: \`${page.harPath}\``);
      lines.push(`- LCP Screenshot: \`${page.lcpScreenshot}\``);
      lines.push('');
    }
  }

  if (report.summary.recommendations.length) {
    lines.push('## Recommendations');
    lines.push('');
    for (const recommendation of report.summary.recommendations) {
      lines.push(`- ${recommendation}`);
    }
  }

  return lines.join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(options.outputDir);

  const profileReports: ProfileReport[] = [];

  for (const profile of PROFILES) {
    try {
      const report = await auditProfile(options, profile);
      profileReports.push(report);
    } catch (error) {
      console.error(`Failed profile ${profile.name}:`, error);
    }
  }

  const summary = {
    slowestLcp: null as number | null,
    heaviestPage: null as number | null,
    recommendations: computeRecommendations(profileReports),
  };

  for (const profile of profileReports) {
    for (const page of profile.pages) {
      if (page.lighthouse.lcp) {
        summary.slowestLcp = summary.slowestLcp ? Math.max(summary.slowestLcp, page.lighthouse.lcp) : page.lighthouse.lcp;
      }
      if (page.bundle.totalBytes) {
        summary.heaviestPage = summary.heaviestPage ? Math.max(summary.heaviestPage, page.bundle.totalBytes) : page.bundle.totalBytes;
      }
    }
  }

  const report: AuditReport = {
    targetUrl: options.targetUrl,
    generatedAt: new Date().toISOString(),
    options,
    profiles: profileReports,
    summary,
  };

  const reportJsonPath = path.join(options.outputDir, 'report.json');
  fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2), 'utf-8');

  const reportMarkdownPath = path.join(options.outputDir, 'report.md');
  fs.writeFileSync(reportMarkdownPath, generateMarkdownReport(report), 'utf-8');

  console.log(`✅ Report written to ${reportJsonPath}`);
  console.log(`✅ Markdown summary written to ${reportMarkdownPath}`);
  process.exit(0);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
