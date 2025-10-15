import { pdfjs } from 'react-pdf';
import ePub from 'epubjs';
import mammoth from 'mammoth';

if (pdfjs?.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

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

export const extractRawTextFromFileBlob = async (blob, type) => {
  try {
    if (type === 'html') {
      return await blob.text();
    }

    if (type === 'txt') {
      return await blob.text();
    }

    if (type === 'docx') {
      const arrayBuffer = await blob.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    if (type === 'epub') {
      const bookEpub = ePub(blob);
      await bookEpub.ready;
      let fullText = '';

      for (const item of bookEpub.spine.spineItems) {
        try {
          await item.load(bookEpub.load.bind(bookEpub));
          fullText += item.contents.textContent || '';
        } catch (error) {
          console.error('Error loading epub spine item:', error);
        } finally {
          item.unload();
        }
      }

      return fullText;
    }

    if (type === 'pdf') {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
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

