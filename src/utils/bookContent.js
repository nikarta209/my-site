const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const normalizeName = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    if (typeof value.name === 'string') return value.name;
    if (typeof value.filename === 'string') return value.filename;
  }
  return '';
};

const getExtension = (value) => {
  const name = normalizeName(value).toLowerCase();
  if (!name) return '';
  const cleanName = name.split('?')[0].split('#')[0];
  const parts = cleanName.split('.');
  if (parts.length < 2) return '';
  return parts.pop() || '';
};

const getMimeType = (value) => {
  if (value && typeof value === 'object' && 'type' in value) {
    return (value.type || '').toLowerCase();
  }
  return '';
};

export function determineFileType(fileOrName) {
  const extension = getExtension(fileOrName);
  const mimeType = getMimeType(fileOrName);

  if (extension === 'pdf' || mimeType.includes('pdf')) return 'pdf';
  if (extension === 'epub' || mimeType.includes('epub')) return 'epub';
  if (extension === 'docx' || mimeType.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'docx';
  if (extension === 'html' || extension === 'htm' || mimeType.includes('html')) return 'html';
  if (extension === 'txt' || mimeType.includes('text/plain')) return 'txt';

  return 'unknown';
}

async function extractPdfText(file) {
  if (!isBrowser) return '';

  try {
    const [{ getDocument, GlobalWorkerOptions }, workerUrl] = await Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
      import('pdfjs-dist/build/pdf.worker.mjs?url'),
    ]);

    GlobalWorkerOptions.workerSrc = (workerUrl && workerUrl.default) || workerUrl;
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await getDocument({ data }).promise;
    let out = '';

    for (let p = 1; p <= doc.numPages; p += 1) {
      const page = await doc.getPage(p);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item?.str || '').join(' ').trim();
      if (pageText) {
        out += `${pageText}\n`;
      }
    }

    return out.trim();
  } catch (error) {
    console.warn('[bookContent] Failed to extract PDF text', error);
    return '';
  }
}

async function extractDocxText(file) {
  if (!isBrowser) return '';

  try {
    const mammoth = await import('mammoth/mammoth.browser.js');
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || '';
  } catch (error) {
    console.warn('[bookContent] Failed to extract DOCX text', error);
    return '';
  }
}

async function extractEpubText(file) {
  if (!isBrowser) return '';

  try {
    const ePubModule = await import('epubjs');
    const ePub = ePubModule.default || ePubModule;
    const book = ePub(file);
    await book.ready;
    const spine = await book.loaded.spine;
    let out = '';

    for (const item of spine) {
      try {
        const doc = await item.load(book.load.bind(book));
        const text = doc?.documentElement?.textContent || '';
        if (text) {
          out += `${text}\n`;
        }
      } finally {
        if (typeof item.unload === 'function') {
          item.unload();
        }
      }
    }

    return out.trim();
  } catch (error) {
    console.warn('[bookContent] Failed to extract EPUB text', error);
    return '';
  }
}

export async function extractRawTextFromFileBlob(file) {
  if (!file) return '';

  const type = determineFileType(file);

  try {
    if (type === 'html') {
      return typeof file.text === 'function' ? await file.text() : '';
    }

    if (type === 'txt' || type === 'unknown') {
      return typeof file.text === 'function' ? await file.text() : '';
    }

    if (type === 'pdf') {
      return await extractPdfText(file);
    }

    if (type === 'docx') {
      return await extractDocxText(file);
    }

    if (type === 'epub') {
      return await extractEpubText(file);
    }
  } catch (error) {
    console.error('[bookContent] Error extracting raw text', error);
    return '';
  }

  return '';
}

const escapeHtml = (input = '') =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const looksLikeChapterTitle = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return false;

  if (/^(?:глава|chapter|часть|part)\b/i.test(trimmed)) return true;
  if (/^#+\s+/.test(trimmed)) return true;
  const noPunctuation = trimmed.replace(/[^A-Za-zА-Яа-яЁё0-9\s]/g, '').trim();
  if (noPunctuation.length >= 6 && noPunctuation === noPunctuation.toUpperCase()) return true;

  return false;
};

export function htmlFromRawText(text = '') {
  if (!text) return '';

  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) return '';

  const lines = normalized.split('\n');
  const blocks = [];
  let buffer = [];

  const flushBuffer = () => {
    if (!buffer.length) return;
    const paragraph = buffer.join(' ').replace(/\s+/g, ' ').trim();
    buffer = [];
    if (paragraph) {
      blocks.push(`<p>${escapeHtml(paragraph)}</p>`);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushBuffer();
      continue;
    }

    if (looksLikeChapterTitle(line)) {
      flushBuffer();
      const title = line.replace(/^#+\s*/, '').trim();
      blocks.push(`<h2 class="chapter-title">${escapeHtml(title)}</h2>`);
    } else {
      buffer.push(line);
    }
  }

  flushBuffer();
  return blocks.join('\n');
}

export const looksLikeHtmlContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  return /<\s*(?:!doctype|html|head|body|p|div|section|article|h[1-6]|span|br)\b/i.test(trimmed);
};

export const isHtmlExtension = (value) => {
  if (!value) return false;
  const name = typeof value === 'string' ? value : value?.name || '';
  return /\.(html?|xhtml)$/i.test(name);
};
