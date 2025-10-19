#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { chromium, devices, Page, CDPSession } from 'playwright';

let cachedLighthouse: unknown;
let cachedChromeLauncher: unknown;

async function loadOptionalDependency<T = unknown>(specifier: string): Promise<T> {
  try {
    return (await import(specifier)) as T;
  } catch (error) {
    const installHint = 'npm install -D lighthouse chrome-launcher';
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `The performance audit CLI requires the optional dependency "${specifier}". ` +
        `Install it locally before running the tool:\n  ${installHint}\n\nOriginal error: ${reason}`,
    );
  }
}

async function getLighthouse(): Promise<unknown> {
  if (!cachedLighthouse) {
    const module = await loadOptionalDependency<unknown>('lighthouse');
    if (typeof module === 'object' && module && 'default' in module) {
      cachedLighthouse = (module as { default: unknown }).default;
    } else {
      cachedLighthouse = module;
    }
  }
  return cachedLighthouse;
}

async function getChromeLauncher(): Promise<unknown> {
  if (!cachedChromeLauncher) {
    cachedChromeLauncher = await loadOptionalDependency('chrome-launcher');
  }
  return cachedChromeLauncher;
}

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

interface BundleCoverageBreakdown {
  totalBytes: number;
  usedBytes: number;
  unusedBytes: number;
  unusedPercent: number;
}

interface BundleSizeSummary {
  totalBytes: number;
  scripts: number;
  styles: number;
  images: number;
  fonts: number;
  other: number;
  coverage?: {
    scripts: BundleCoverageBreakdown;
    styles: BundleCoverageBreakdown;
  };
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

interface CoverageSummaryWithPercentages extends CoverageSummary {
  usedPercent: number;
  unusedPercent: number;
}

interface NetworkDomainSummary {
  domain: string;
  requestCount: number;
  transferBytes: number;
  isThirdParty: boolean;
}

interface NetworkRequestInsight {
  url: string;
  method: string;
  status: number | undefined;
  domain: string;
  transferBytes: number;
  durationMs: number;
  isThirdParty: boolean;
}

interface NetworkSection {
  summary: {
    totalRequests: number;
    totalTransferBytes: number;
    firstPartyRequests: number;
    thirdPartyRequests: number;
  };
  byDomain: NetworkDomainSummary[];
  slowest: NetworkRequestInsight[];
  largest: NetworkRequestInsight[];
  requests: NetworkLogEntry[];
}

interface BundlesSection {
  summary: BundleSizeSummary;
  coverage: {
    js: CoverageSummaryWithPercentages;
    css: CoverageSummaryWithPercentages;
  };
}

interface MetricsSection {
  lighthouse: LighthouseCoreMetrics & { rawReport: unknown };
  dom: DOMStatistics;
  performance: {
    navigationTimings: unknown[];
    paintTimings: unknown[];
    longTasks: LongTaskEntry[];
    layoutShifts: unknown[];
    repaintCount: number;
    lcpAfterNavigation: number | null;
  };
}

interface AnimationsSection {
  total: number;
  longest: AnimationMetadata[];
  details: AnimationMetadata[];
}

interface ImagesSection {
  total: number;
  responsive: number;
  lazy: number;
  largestByBytes: ImageDiagnostic[];
  diagnostics: ImageDiagnostic[];
}

interface CriticalPathSection {
  lcp: {
    lighthouse: number | null;
    observed: number | null;
    screenshotPath: string;
  };
  longTasks: LongTaskEntry[];
  layoutShifts: unknown[];
  paints: unknown[];
}

interface NavigationSection {
  finalUrl: string;
  history: RouteChangeTiming[];
  timings: unknown[];
  paints: unknown[];
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
  sequence: number;
  artifacts: {
    metricsPath: string;
    harPath: string;
    lcpScreenshot: string;
  };
  metrics: MetricsSection;
  network: NetworkSection;
  bundles: BundlesSection;
  animations: AnimationsSection;
  images: ImagesSection;
  criticalPath: CriticalPathSection;
  navigation: NavigationSection;
  cdpLogs: Record<string, unknown[]>;
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
    const identifier = entry.url || (entry as any).scriptId || '';
    const source = sources.get(identifier) ?? '';
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
      url: entry.url || identifier,
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

function addCoveragePercentages(summary: CoverageSummary): CoverageSummaryWithPercentages {
  const usedPercent = summary.totalBytes ? (summary.usedBytes / summary.totalBytes) * 100 : 0;
  const unusedPercent = summary.totalBytes ? (summary.unusedBytes / summary.totalBytes) * 100 : 0;
  return {
    ...summary,
    usedPercent: Number.isFinite(usedPercent) ? Number(usedPercent.toFixed(2)) : 0,
    unusedPercent: Number.isFinite(unusedPercent) ? Number(unusedPercent.toFixed(2)) : 0,
  };
}

function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return null;
  }
}

function isThirdParty(url: string, firstPartyOrigin: string): boolean {
  try {
    return new URL(url).origin !== firstPartyOrigin;
  } catch (error) {
    return false;
  }
}

function toNetworkInsight(
  entry: NetworkLogEntry,
  firstPartyOrigin: string,
): NetworkRequestInsight {
  const end = entry.endTime ?? entry.startTime ?? 0;
  const start = entry.startTime ?? 0;
  const durationMs = (end - start) * 1000;
  const domain = getDomainFromUrl(entry.url) ?? 'unknown';
  return {
    url: entry.url,
    method: entry.method,
    status: entry.responseStatus,
    domain,
    transferBytes: entry.encodedDataLength ?? 0,
    durationMs: Number.isFinite(durationMs) ? Number(durationMs.toFixed(2)) : 0,
    isThirdParty: isThirdParty(entry.url, firstPartyOrigin),
  };
}

function buildNetworkSection(
  networkLogs: NetworkLogEntry[],
  firstPartyOrigin: string,
): NetworkSection {
  const insights = networkLogs.map((entry) => toNetworkInsight(entry, firstPartyOrigin));
  const summary = insights.reduce(
    (acc, insight) => {
      acc.totalRequests += 1;
      acc.totalTransferBytes += insight.transferBytes;
      if (insight.isThirdParty) {
        acc.thirdPartyRequests += 1;
      } else {
        acc.firstPartyRequests += 1;
      }
      return acc;
    },
    {
      totalRequests: 0,
      totalTransferBytes: 0,
      firstPartyRequests: 0,
      thirdPartyRequests: 0,
    },
  );

  const byDomainMap = new Map<string, NetworkDomainSummary>();
  for (const insight of insights) {
    const existing = byDomainMap.get(insight.domain);
    if (existing) {
      existing.requestCount += 1;
      existing.transferBytes += insight.transferBytes;
    } else {
      byDomainMap.set(insight.domain, {
        domain: insight.domain,
        requestCount: 1,
        transferBytes: insight.transferBytes,
        isThirdParty: insight.isThirdParty,
      });
    }
  }

  const byDomain = Array.from(byDomainMap.values()).sort((a, b) => b.transferBytes - a.transferBytes);

  const slowest = [...insights]
    .filter((item) => item.durationMs > 0)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 5);

  const largest = [...insights]
    .sort((a, b) => b.transferBytes - a.transferBytes)
    .slice(0, 5);

  return {
    summary,
    byDomain,
    slowest,
    largest,
    requests: networkLogs,
  };
}

function buildAnimationsSection(animations: AnimationMetadata[]): AnimationsSection {
  const longest = [...animations]
    .sort((a, b) => (typeof b.duration === 'number' ? b.duration : 0) - (typeof a.duration === 'number' ? a.duration : 0))
    .slice(0, 5);

  return {
    total: animations.length,
    longest,
    details: animations,
  };
}

function buildImagesSection(images: ImageDiagnostic[]): ImagesSection {
  const largestByBytes = [...images]
    .filter((image) => (image.byteSize ?? 0) > 0)
    .sort((a, b) => (b.byteSize ?? 0) - (a.byteSize ?? 0))
    .slice(0, 5);

  return {
    total: images.length,
    responsive: images.filter((image) => image.isResponsive).length,
    lazy: images.filter((image) => image.isLazy).length,
    largestByBytes,
    diagnostics: images,
  };
}

function buildCriticalPathSection(
  navigation: NavigationMetrics,
  lighthouse: LighthouseCoreMetrics,
  lcpAfterNavigation: number | null,
  lcpScreenshot: string,
): CriticalPathSection {
  return {
    lcp: {
      lighthouse: lighthouse.lcp ?? null,
      observed: lcpAfterNavigation,
      screenshotPath: lcpScreenshot,
    },
    longTasks: navigation.longTasks,
    layoutShifts: navigation.layoutShifts,
    paints: navigation.paintTimings,
  };
}

function buildNavigationSection(
  routeChanges: RouteChangeTiming[],
  navigation: NavigationMetrics,
  finalUrl: string,
): NavigationSection {
  return {
    finalUrl,
    history: routeChanges,
    timings: navigation.navigationTimings,
    paints: navigation.paintTimings,
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

async function resetCoverageTracking(session: CDPSession): Promise<void> {
  await session.send('CSS.stopRuleUsageTracking').catch(() => {});
  await session.send('Profiler.stopPreciseCoverage').catch(() => {});
}

async function startCoverageTracking(session: CDPSession): Promise<void> {
  await resetCoverageTracking(session);
  await session.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
  await session.send('CSS.startRuleUsageTracking');
}

async function gatherCoverage(session: CDPSession): Promise<{ js: CoverageSummary; css: CoverageSummary }> {
  let jsCoverage: any = { result: [] };
  let cssCoverage: any = { ruleUsage: [] };
  try {
    const [jsResult, cssResult] = await Promise.all([
      session.send('Profiler.takePreciseCoverage'),
      session.send('CSS.stopRuleUsageTracking'),
    ]);
    jsCoverage = jsResult;
    cssCoverage = cssResult;
  } finally {
    await session.send('Profiler.stopPreciseCoverage').catch(() => {});
  }

  const jsEntries: Array<any> = (jsCoverage as any).result ?? [];
  const cssUsage: Array<any> = (cssCoverage as any).ruleUsage ?? [];

  const jsSources = new Map<string, string>();
  await Promise.all(
    jsEntries
      .filter((entry) => entry?.scriptId)
      .map(async (entry) => {
        const key = entry.url || entry.scriptId;
        if (!key || jsSources.has(key)) {
          return;
        }
        try {
          const { scriptSource } = await session.send('Debugger.getScriptSource', {
            scriptId: entry.scriptId,
          });
          jsSources.set(key, scriptSource ?? '');
        } catch (error) {
          jsSources.set(key, '');
        }
      }),
  );

  const cssSources = new Map<string, string>();
  await Promise.all(
    Array.from(new Set(cssUsage.map((rule) => rule?.styleSheetId).filter(Boolean))).map(async (styleSheetId) => {
      if (!styleSheetId || cssSources.has(styleSheetId)) {
        return;
      }
      try {
        const { text } = await session.send('CSS.getStyleSheetText', { styleSheetId });
        cssSources.set(styleSheetId, text ?? '');
      } catch (error) {
        cssSources.set(styleSheetId, '');
      }
    }),
  );

  const jsSummary = summariseCoverage(jsEntries, jsSources);
  const cssSummary = summariseCoverage(
    cssUsage.map((rule: any) => ({
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
    cssSources,
  );

  return { js: jsSummary, css: cssSummary };
}

async function runLighthouseAudit(url: string, profile: ThrottlingProfileConfig): Promise<LighthouseCoreMetrics & { rawReport: unknown }> {
  const launcher = (await getChromeLauncher()) as {
    launch(options: unknown): Promise<{ port: number; kill(): Promise<void> }>;
  };
  const lighthouse = (await getLighthouse()) as (
    url: string,
    options: Record<string, unknown>,
  ) => Promise<{ lhr: Record<string, unknown> }>;

  const chrome = await launcher.launch({
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
      const { lighthouse } = page.metrics;
      const { performance } = page.metrics;
      if ((lighthouse.lcp ?? 0) > 2500) {
        recommendations.add('Improve Largest Contentful Paint by optimizing hero media and critical rendering path.');
      }
      if ((lighthouse.cls ?? 0) > 0.1) {
        recommendations.add('Reduce layout shifts by reserving space for dynamic content and fonts.');
      }
      if ((performance.longTasks ?? []).some((task) => task.duration > 200)) {
        recommendations.add('Break up long tasks to keep main thread responsive and lower INP.');
      }
      if (page.bundles.coverage.js.unusedBytes > page.bundles.coverage.js.totalBytes * 0.3) {
        recommendations.add('Ship less JavaScript by code-splitting and removing unused modules.');
      }
      if (page.bundles.coverage.css.unusedBytes > page.bundles.coverage.css.totalBytes * 0.5) {
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

function slugifyForFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function normalizeUrl(input: string): string {
  try {
    const { origin, pathname, search } = new URL(input);
    return `${origin}${pathname}${search}`;
  } catch (error) {
    return input;
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
}

function formatMs(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'n/a';
  }
  return `${value.toFixed(0)} ms`;
}

async function auditProfile(options: CLIOptions, profile: ThrottlingProfileConfig): Promise<ProfileReport> {
  console.log(`▶️ Starting profile: ${profile.name}`);
  const pages: PageRunResult[] = [];
  const { targetUrl } = options;
  const normalizedTarget = normalizeUrl(targetUrl);
  const targetOrigin = new URL(targetUrl).origin;
  const discovered = new Set<string>([normalizedTarget]);
  const visited = new Set<string>();
  const urlQueue: string[] = [normalizedTarget];

  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  try {
    const contextOptions: Parameters<typeof browser.newContext>[0] = {
      ...(profile.device ? devices[profile.device] : {}),
      locale: 'en-US',
    };
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    const session = await context.newCDPSession(page);

    await enableDomains(session, ['Performance', 'Network', 'Page', 'Runtime', 'Profiler', 'Debugger', 'CSS']);
    await applyThrottling(session, profile);

    interface ActiveRun {
      id: number;
      url: string;
      routeChanges: RouteChangeTiming[];
      networkRequests: Map<string, NetworkLogEntry>;
      cdpLogs: Record<string, unknown[]>;
    }

    let activeRun: ActiveRun | null = null;
    let navigationSequence = 0;
    let totalNavigations = 0;
    let processedPages = 0;

    const profileOutputDir = path.join(options.outputDir, profile.id);
    ensureDir(profileOutputDir);

    const createRun = (url: string): ActiveRun => {
      navigationSequence += 1;
      const run: ActiveRun = {
        id: navigationSequence,
        url,
        routeChanges: [{ url, timestamp: Date.now() }],
        networkRequests: new Map<string, NetworkLogEntry>(),
        cdpLogs: {
          Performance: [],
          Network: [],
          Page: [],
          Runtime: [],
        },
      };
      activeRun = run;
      return run;
    };

    const clearRun = () => {
      activeRun = null;
    };

    session.on('Performance.metrics', (event) => {
      if (activeRun) {
        activeRun.cdpLogs.Performance.push(event);
      }
    });
    session.on('Network.requestWillBeSent', (event: any) => {
      if (!activeRun) return;
      const request: NetworkLogEntry = {
        requestId: event.requestId,
        url: event.request?.url ?? '',
        method: event.request?.method ?? 'GET',
        requestHeaders: event.request?.headers ?? {},
        startTime: event.timestamp ?? Date.now() / 1000,
      };
      activeRun.networkRequests.set(event.requestId, request);
      activeRun.cdpLogs.Network.push(event);
    });
    session.on('Network.responseReceived', (event: any) => {
      if (!activeRun) return;
      const request = activeRun.networkRequests.get(event.requestId);
      if (request) {
        request.responseStatus = event.response?.status;
        request.responseHeaders = event.response?.headers ?? {};
        request.mimeType = event.response?.mimeType;
      }
      activeRun.cdpLogs.Network.push(event);
    });
    session.on('Network.loadingFinished', (event: any) => {
      if (!activeRun) return;
      const request = activeRun.networkRequests.get(event.requestId);
      if (request) {
        request.endTime = event.timestamp ?? request.startTime;
        request.encodedDataLength = event.encodedDataLength ?? 0;
      }
      activeRun.cdpLogs.Network.push(event);
    });
    session.on('Page.loadEventFired', (event) => {
      if (activeRun) {
        activeRun.cdpLogs.Page.push(event);
      }
    });
    session.on('Runtime.consoleAPICalled', (event) => {
      if (activeRun) {
        activeRun.cdpLogs.Runtime.push(event);
      }
    });

    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame() && activeRun) {
        activeRun.routeChanges.push({ url: frame.url(), timestamp: Date.now() });
      }
    });

    const collectSameOriginLinks = async (): Promise<string[]> => {
      try {
        const urls = await page.$$eval('a[href]', (anchors: HTMLAnchorElement[]) => anchors.map((anchor) => anchor.href));
        const seen = new Set<string>();
        const results: string[] = [];
        for (const href of urls) {
          if (!href) continue;
          try {
            const candidate = new URL(href);
            if (candidate.origin !== targetOrigin) continue;
            if (seen.has(candidate.href)) continue;
            seen.add(candidate.href);
            results.push(candidate.href);
          } catch (error) {
            // ignore malformed URLs
          }
        }
        return results;
      } catch (error) {
        return [];
      }
    };

    const enqueueDiscoveredLinks = (urls: string[]) => {
      for (const link of urls) {
        const normalized = normalizeUrl(link);
        if (!discovered.has(normalized)) {
          discovered.add(normalized);
          urlQueue.push(normalized);
        }
      }
    };

    const captureLcp = async (): Promise<number | null> => {
      try {
        return await page.evaluate(() => {
          const entries = performance.getEntriesByType('largest-contentful-paint') as PerformanceEntry[];
          if (!entries.length) return null;
          const last = entries[entries.length - 1] as any;
          return last.renderTime ?? last.loadTime ?? last.startTime ?? null;
        });
      } catch (error) {
        return null;
      }
    };

    const finalizeRun = async (run: ActiveRun): Promise<PageRunResult | null> => {
      try {
        const navigationMetrics = await collectNavigationMetrics(page);
        navigationMetrics.imageDiagnostics = mergeImageDiagnostics(
          navigationMetrics.imageDiagnostics,
          run.networkRequests,
        );
        const coverage = await gatherCoverage(session);
        const bundle = computeBundleSummary(run.networkRequests);
        const coverageWithPercent = {
          js: addCoveragePercentages(coverage.js),
          css: addCoveragePercentages(coverage.css),
        };
        const bundleWithCoverage: BundleSizeSummary = {
          ...bundle,
          coverage: {
            scripts: {
              totalBytes: coverageWithPercent.js.totalBytes,
              usedBytes: coverageWithPercent.js.usedBytes,
              unusedBytes: coverageWithPercent.js.unusedBytes,
              unusedPercent: coverageWithPercent.js.unusedPercent,
            },
            styles: {
              totalBytes: coverageWithPercent.css.totalBytes,
              usedBytes: coverageWithPercent.css.usedBytes,
              unusedBytes: coverageWithPercent.css.unusedBytes,
              unusedPercent: coverageWithPercent.css.unusedPercent,
            },
          },
        };
        const networkLogs = Array.from(run.networkRequests.values());
        const routeChanges = [...run.routeChanges];
        const lcpAfterNavigation = await captureLcp();
        const lighthouse = await runLighthouseAudit(run.url, profile);

        const slug = slugifyForFilename(`${run.id}-${normalizeUrl(run.url)}`) || `nav-${run.id}`;
        const baseName = `${profile.id}-${slug}`;
        const harPath = path.join(profileOutputDir, `${baseName}.har`);
        const screenshotPath = path.join(profileOutputDir, `${baseName}-lcp.png`);
        const metricsPath = path.join(profileOutputDir, `${baseName}-metrics.json`);

        const harContent = buildHar(routeChanges, run.networkRequests, run.url);
        fs.writeFileSync(harPath, JSON.stringify(harContent, null, 2), 'utf-8');
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const bundles: BundlesSection = {
          summary: bundleWithCoverage,
          coverage: coverageWithPercent,
        };

        const metrics: MetricsSection = {
          lighthouse,
          dom: navigationMetrics.domStats,
          performance: {
            navigationTimings: navigationMetrics.navigationTimings,
            paintTimings: navigationMetrics.paintTimings,
            longTasks: navigationMetrics.longTasks,
            layoutShifts: navigationMetrics.layoutShifts,
            repaintCount: navigationMetrics.repaintCount,
            lcpAfterNavigation,
          },
        };

        const networkSection = buildNetworkSection(networkLogs, targetOrigin);
        const animationsSection = buildAnimationsSection(navigationMetrics.animationDetails);
        const imagesSection = buildImagesSection(navigationMetrics.imageDiagnostics);
        const criticalPathSection = buildCriticalPathSection(
          navigationMetrics,
          lighthouse,
          lcpAfterNavigation,
          screenshotPath,
        );
        const navigationSection = buildNavigationSection(routeChanges, navigationMetrics, page.url());

        const pageResult: PageRunResult = {
          url: run.url,
          profileId: profile.id,
          sequence: run.id,
          artifacts: {
            metricsPath,
            harPath,
            lcpScreenshot: screenshotPath,
          },
          metrics,
          network: networkSection,
          bundles,
          animations: animationsSection,
          images: imagesSection,
          criticalPath: criticalPathSection,
          navigation: navigationSection,
          cdpLogs: run.cdpLogs,
        };

        const metricsPayload = {
          url: pageResult.url,
          profileId: pageResult.profileId,
          sequence: pageResult.sequence,
          artifacts: pageResult.artifacts,
          metrics: pageResult.metrics,
          network: pageResult.network,
          bundles: pageResult.bundles,
          animations: pageResult.animations,
          images: pageResult.images,
          criticalPath: pageResult.criticalPath,
          navigation: pageResult.navigation,
          cdpLogs: pageResult.cdpLogs,
        };
        fs.writeFileSync(metricsPath, JSON.stringify(metricsPayload, null, 2), 'utf-8');
        pages.push(pageResult);

        return pageResult;
      } catch (error) {
        console.warn(`Failed to finalize navigation for ${run.url}:`, error);
        await resetCoverageTracking(session);
        return null;
      } finally {
        clearRun();
      }
    };

    const runNavigation = async (url: string, action: () => Promise<void>): Promise<PageRunResult | null> => {
      if (totalNavigations >= options.maxNavigations) {
        return null;
      }
      const run = createRun(url);
      const normalized = normalizeUrl(url);
      if (!visited.has(normalized)) {
        visited.add(normalized);
      }
      totalNavigations += 1;
      try {
        await startCoverageTracking(session);
        await action();
        await page.waitForLoadState('networkidle', { timeout: options.timeoutMs }).catch(() => {});
        await page.waitForTimeout(1000);
        const result = await finalizeRun(run);
        if (result) {
          const links = await collectSameOriginLinks();
          enqueueDiscoveredLinks(links);
        }
        return result;
      } catch (error) {
        console.warn(`Navigation error for ${url}:`, error);
        await resetCoverageTracking(session);
        clearRun();
        return null;
      }
    };

    while (
      urlQueue.length > 0 &&
      processedPages < options.maxPages &&
      totalNavigations < options.maxNavigations
    ) {
      const nextUrl = urlQueue.shift();
      if (!nextUrl || visited.has(nextUrl)) {
        continue;
      }
      processedPages += 1;

      const gotoResult = await runNavigation(nextUrl, async () => {
        let attempts = 0;
        while (attempts <= options.retries) {
          try {
            await page.goto(nextUrl, { waitUntil: 'networkidle', timeout: options.timeoutMs });
            break;
          } catch (error) {
            attempts += 1;
            console.warn(`Navigation error (${attempts}/${options.retries}):`, error);
            if (attempts > options.retries) {
              throw error;
            }
          }
        }
      });

      if (!gotoResult) {
        continue;
      }

      if (totalNavigations >= options.maxNavigations) {
        break;
      }

      const spaCandidates = await page.$$eval(
        'a[href]',
        (anchors: HTMLAnchorElement[], origin: string) => {
          const seen = new Set<string>();
          const results: Array<{ index: number; href: string }> = [];
          anchors.forEach((anchor, index) => {
            const href = anchor.href;
            if (!href) return;
            try {
              const url = new URL(href);
              if (url.origin !== origin) return;
              if (seen.has(url.href)) return;
              seen.add(url.href);
              results.push({ index, href: url.href });
            } catch (error) {
              // ignore malformed URLs
            }
          });
          return results;
        },
        targetOrigin,
      );

      for (const candidate of spaCandidates) {
        if (totalNavigations >= options.maxNavigations) {
          break;
        }
        const normalizedCandidate = normalizeUrl(candidate.href);
        if (visited.has(normalizedCandidate)) {
          continue;
        }
        await page.waitForTimeout(500);
        await runNavigation(candidate.href, async () => {
          const locator = page.locator('a[href]').nth(candidate.index);
          const waitTimeout = Math.min(options.timeoutMs, 15000);
          await Promise.all([
            page
              .waitForURL(
                (url) => normalizeUrl(url.toString()) === normalizedCandidate,
                { timeout: waitTimeout },
              )
              .catch(() => null),
            locator.click({ timeout: options.timeoutMs }),
          ]);
        });

        if (totalNavigations >= options.maxNavigations) {
          break;
        }

        if (normalizeUrl(page.url()) !== nextUrl) {
          await page.goto(nextUrl, { waitUntil: 'networkidle', timeout: options.timeoutMs }).catch(() => {});
          await page.waitForTimeout(500);
        }
      }
    }

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
      lines.push('#### Core Web Metrics');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('| --- | ---: |');
      lines.push(`| TTFB | ${formatMs(page.metrics.lighthouse.ttfb)} |`);
      lines.push(`| FCP | ${formatMs(page.metrics.lighthouse.fcp)} |`);
      lines.push(`| LCP | ${formatMs(page.metrics.lighthouse.lcp)} |`);
      lines.push(`| CLS | ${page.metrics.lighthouse.cls?.toFixed?.(3) ?? 'n/a'} |`);
      lines.push(`| INP/FID | ${formatMs(page.metrics.lighthouse.inp ?? page.metrics.lighthouse.fid ?? null)} |`);
      lines.push(`| TTI | ${formatMs(page.metrics.lighthouse.tti)} |`);
      lines.push(`| Speed Index | ${formatMs(page.metrics.lighthouse.speedIndex)} |`);
      lines.push(`| TBT | ${formatMs(page.metrics.lighthouse.tbt)} |`);
      lines.push('');

      lines.push('#### Performance & Critical Path');
      lines.push('');
      lines.push('| Detail | Value |');
      lines.push('| --- | --- |');
      lines.push(`| LCP (Lighthouse) | ${formatMs(page.criticalPath.lcp.lighthouse)} |`);
      lines.push(`| LCP (Observed) | ${formatMs(page.criticalPath.lcp.observed)} |`);
      lines.push(`| Repaint Count | ${page.metrics.performance.repaintCount} |`);
      const longTasksOver200 = page.metrics.performance.longTasks.filter((task) => task.duration > 200).length;
      lines.push(`| Long Tasks >200ms | ${longTasksOver200} |`);
      lines.push('');
      if (page.metrics.performance.longTasks.length) {
        lines.push('Top Long Tasks');
        lines.push('');
        lines.push('| Start (ms) | Duration (ms) |');
        lines.push('| ---: | ---: |');
        for (const task of page.metrics.performance.longTasks.slice(0, 5)) {
          lines.push(`| ${task.startTime.toFixed(1)} | ${task.duration.toFixed(1)} |`);
        }
        lines.push('');
      }

      lines.push('#### DOM Overview');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('| --- | ---: |');
      lines.push(`| Nodes | ${page.metrics.dom.nodeCount} |`);
      lines.push(`| Elements | ${page.metrics.dom.elementCount} |`);
      lines.push(`| Text Nodes | ${page.metrics.dom.textNodeCount} |`);
      lines.push(`| Max Depth | ${page.metrics.dom.depth} |`);
      lines.push(`| Interactive Elements | ${page.metrics.dom.interactiveElements} |`);
      lines.push(`| Forms | ${page.metrics.dom.forms} |`);
      lines.push(`| Scripts | ${page.metrics.dom.scripts} |`);
      lines.push(`| Stylesheets | ${page.metrics.dom.stylesheets} |`);
      lines.push(`| Images | ${page.metrics.dom.images} |`);
      lines.push(`| Iframes | ${page.metrics.dom.iframes} |`);
      lines.push('');

      lines.push('#### Bundles & Coverage');
      lines.push('');
      lines.push('| Type | Bytes |');
      lines.push('| --- | ---: |');
      lines.push(`| Total | ${formatBytes(page.bundles.summary.totalBytes)} |`);
      lines.push(`| Scripts | ${formatBytes(page.bundles.summary.scripts)} |`);
      lines.push(`| Styles | ${formatBytes(page.bundles.summary.styles)} |`);
      lines.push(`| Images | ${formatBytes(page.bundles.summary.images)} |`);
      lines.push(`| Fonts | ${formatBytes(page.bundles.summary.fonts)} |`);
      lines.push(`| Other | ${formatBytes(page.bundles.summary.other)} |`);
      lines.push('');
      lines.push('| Coverage | Used % | Unused % | Total Bytes |');
      lines.push('| --- | ---: | ---: | ---: |');
      lines.push(
        `| JavaScript | ${page.bundles.coverage.js.usedPercent}% | ${page.bundles.coverage.js.unusedPercent}% | ${formatBytes(page.bundles.coverage.js.totalBytes)} |`,
      );
      lines.push(
        `| CSS | ${page.bundles.coverage.css.usedPercent}% | ${page.bundles.coverage.css.unusedPercent}% | ${formatBytes(page.bundles.coverage.css.totalBytes)} |`,
      );
      lines.push('');

      lines.push('#### Network Overview');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('| --- | ---: |');
      lines.push(`| Total Requests | ${page.network.summary.totalRequests} |`);
      lines.push(`| Transfer Size | ${formatBytes(page.network.summary.totalTransferBytes)} |`);
      lines.push(`| First-party Requests | ${page.network.summary.firstPartyRequests} |`);
      lines.push(`| Third-party Requests | ${page.network.summary.thirdPartyRequests} |`);
      lines.push('');

      if (page.network.byDomain.length) {
        lines.push('##### Requests by Domain');
        lines.push('');
        lines.push('| Domain | Requests | Transfer | Party |');
        lines.push('| --- | ---: | ---: | --- |');
        for (const domain of page.network.byDomain) {
          lines.push(
            `| ${domain.domain} | ${domain.requestCount} | ${formatBytes(domain.transferBytes)} | ${domain.isThirdParty ? '3P' : '1P'} |`,
          );
        }
        lines.push('');
      }

      if (page.network.slowest.length) {
        lines.push('##### Slowest Requests');
        lines.push('');
        lines.push('| URL | Duration | Size |');
        lines.push('| --- | ---: | ---: |');
        for (const request of page.network.slowest) {
          lines.push(`| ${request.url} | ${formatMs(request.durationMs)} | ${formatBytes(request.transferBytes)} |`);
        }
        lines.push('');
      }

      if (page.network.largest.length) {
        lines.push('##### Largest Requests');
        lines.push('');
        lines.push('| URL | Duration | Size |');
        lines.push('| --- | ---: | ---: |');
        for (const request of page.network.largest) {
          lines.push(`| ${request.url} | ${formatMs(request.durationMs)} | ${formatBytes(request.transferBytes)} |`);
        }
        lines.push('');
      }

      lines.push('#### Images');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('| --- | ---: |');
      lines.push(`| Total Images | ${page.images.total} |`);
      lines.push(`| Responsive Sources | ${page.images.responsive} |`);
      lines.push(`| Lazy-loaded | ${page.images.lazy} |`);
      lines.push('');
      if (page.images.largestByBytes.length) {
        lines.push('Largest Images');
        lines.push('');
        lines.push('| Src | Bytes | Displayed Size | Natural Size |');
        lines.push('| --- | ---: | --- | --- |');
        for (const image of page.images.largestByBytes) {
          lines.push(
            `| ${image.src} | ${formatBytes(image.byteSize ?? 0)} | ${image.displayedWidth}×${image.displayedHeight} | ${image.naturalWidth}×${image.naturalHeight} |`,
          );
        }
        lines.push('');
      }

      lines.push('#### Animations');
      lines.push('');
      lines.push(`- Total animations: ${page.animations.total}`);
      if (page.animations.longest.length) {
        lines.push('');
        lines.push('| Name | Duration (ms) | Delay (ms) | Iterations | State |');
        lines.push('| --- | ---: | ---: | --- | --- |');
        for (const animation of page.animations.longest) {
          const duration = typeof animation.duration === 'number' ? animation.duration : 0;
          const delay = typeof animation.delay === 'number' ? animation.delay : 0;
          lines.push(
            `| ${animation.name ?? '(anonymous)'} | ${duration.toFixed(1)} | ${delay.toFixed(1)} | ${animation.iterationCount} | ${animation.playState} |`,
          );
        }
        lines.push('');
      }

      lines.push('#### Navigation');
      lines.push('');
      lines.push(`- Final URL: ${page.navigation.finalUrl}`);
      if (page.navigation.history.length > 1) {
        lines.push('- Route changes:');
        for (const change of page.navigation.history) {
          lines.push(`  - ${new Date(change.timestamp).toISOString()}: ${change.url}`);
        }
      }
      lines.push('');

      lines.push('#### Artifacts');
      lines.push('');
      lines.push(`- HAR: \`${page.artifacts.harPath}\``);
      lines.push(`- LCP Screenshot: \`${page.artifacts.lcpScreenshot}\``);
      lines.push(`- Metrics JSON: \`${page.artifacts.metricsPath}\``);
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
      if (page.metrics.lighthouse.lcp) {
        summary.slowestLcp = summary.slowestLcp
          ? Math.max(summary.slowestLcp, page.metrics.lighthouse.lcp)
          : page.metrics.lighthouse.lcp;
      }
      if (page.bundles.summary.totalBytes) {
        summary.heaviestPage = summary.heaviestPage
          ? Math.max(summary.heaviestPage, page.bundles.summary.totalBytes)
          : page.bundles.summary.totalBytes;
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
