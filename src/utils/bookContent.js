const normalizeSource = (source) => {
  if (typeof source !== 'string') return '';
  return source.split('?')[0].trim().toLowerCase();
};

export const determineFileType = (source, blobType) => {
  const normalizedSource = normalizeSource(source);
  const extension = normalizedSource.split('.').pop();

  if (['pdf'].includes(extension)) return 'pdf';
  if (['epub'].includes(extension)) return 'epub';
  if (['docx'].includes(extension)) return 'docx';
  if (['html', 'htm'].includes(extension)) return 'html';
  if (['txt'].includes(extension)) return 'txt';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';

  if (blobType) {
    const lowerBlobType = blobType.toLowerCase();
    if (lowerBlobType.includes('pdf')) return 'pdf';
    if (lowerBlobType.includes('epub')) return 'epub';
    if (lowerBlobType.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'docx';
    if (lowerBlobType.includes('html')) return 'html';
    if (lowerBlobType.startsWith('image/')) return 'image';
    if (lowerBlobType.includes('text/plain')) return 'txt';
  }

  return 'txt';
};

const isBrowser = typeof window !== 'undefined';
const scriptPromises = new Map();

const loadScript = async (url, globalName) => {
  if (!isBrowser) {
    throw new Error('Script loading is only available in the browser environment');
  }

  if (!scriptPromises.has(url)) {
    scriptPromises.set(url, new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[data-external="${url}"]`);
      if (existingScript) {
        if (existingScript.dataset.loaded === 'true') {
          resolve();
          return;
        }
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener(
          'error',
          (event) => reject(event?.error || new Error(`Failed to load ${url}`)),
          { once: true }
        );
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.defer = true;
      script.dataset.external = url;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = (event) => reject(event?.error || new Error(`Failed to load ${url}`));
      document.head.appendChild(script);
    }));
  }

  await scriptPromises.get(url);
  return globalName ? window[globalName] : undefined;
};

const CDN_SOURCES = {
  mammoth: {
    url: 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/dist/mammoth.browser.min.js',
    global: 'mammoth'
  },
  epubjs: {
    url: 'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.js',
    global: 'ePub'
  },
  pdfjs: {
    url: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    global: 'pdfjsLib',
    workerSrc: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
  }
};

const loadMammoth = async () => {
  const { url, global } = CDN_SOURCES.mammoth;
  const mammoth = await loadScript(url, global);
  if (!mammoth) {
    throw new Error('Mammoth library failed to load');
  }
  return mammoth;
};

const loadEpub = async () => {
  const { url, global } = CDN_SOURCES.epubjs;
  const ePub = await loadScript(url, global);
  if (typeof ePub !== 'function') {
    throw new Error('ePub.js library failed to load');
  }
  return ePub;
};

const loadPdfjs = async () => {
  const { url, global, workerSrc } = CDN_SOURCES.pdfjs;
  const pdfjsLib = await loadScript(url, global);
  if (!pdfjsLib) {
    throw new Error('pdf.js library failed to load');
  }

  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }

  return pdfjsLib;
};

export const extractRawTextFromFileBlob = async (blob, explicitType) => {
  if (!blob) return '';

  const type = explicitType || determineFileType(blob.name, blob.type);

  try {
    if (type === 'html' || type === 'txt') {
      return await blob.text();
    }

    if (type === 'docx') {
      const mammoth = await loadMammoth();
      const arrayBuffer = await blob.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    if (type === 'epub') {
      const ePub = await loadEpub();
      const bookEpub = ePub(blob);
      await bookEpub.ready;
      let fullText = '';

      for (const item of bookEpub.spine.spineItems) {
        try {
          await item.load(bookEpub.load.bind(bookEpub));
          fullText += item.contents?.textContent || '';
        } catch (error) {
          console.error('Error loading epub spine item:', error);
        } finally {
          item.unload();
        }
      }

      return fullText;
    }

    if (type === 'pdf') {
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item) => item.str).join(' ') + '\n';
      }

      return fullText;
    }

    if (type === 'image') {
      return '--- Изображение ---';
    }
  } catch (error) {
    console.error('Error extracting raw text:', error);
    return `Ошибка при извлечении текста: ${error.message}`;
  }

  return '';
};

export const looksLikeHtmlContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  return /<\s*(?:!doctype|html|head|body|p|div|section|article|h[1-6]|span|br)\b/i.test(trimmed);
};

export const isHtmlExtension = (value) => {
  if (!value) return false;
  return /\.(html?|xhtml)$/i.test(typeof value === 'string' ? value : value.name || '');
};
