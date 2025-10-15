
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';
import { Book, UserBookData } from '@/api/entities';
import { useAuth } from '../auth/Auth';
import ReaderV2Toolbar from './ReaderV2Toolbar';
import ReaderV2Sidebar from './ReaderV2Sidebar';
import Watermark from './Watermark';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';
import {
  cacheBookData,
  getCachedBookData,
  queueMutation,
  syncOfflineData
} from '../utils/OfflineManager';
import ReactMarkdown from 'react-markdown'; // Still imported for potential future use or if markdown is generated
import { motion } from 'framer-motion';
import { determineFileType, extractRawTextFromFileBlob, looksLikeHtmlContent } from '@/utils/bookContent';

// Функция для безопасной очистки HTML (перенесена наружу для оптимизации)
const sanitizeHTML = (html) => {
  // В продакшене рекомендуется использовать более надежные библиотеки, например DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
};

// Функция для конвертации простого текста с маркерами в HTML
const convertPlainTextToHtml = (plainText) => {
  return plainText.split('\n\n').map((paragraph) => { // Разделяем по двойным переводам строки для параграфов
    const trimmed = paragraph.trim();
    if (!trimmed) return '';

    // Проверяем наличие маркеров глав и применяем соответствующие стили
    if (trimmed.startsWith('_CHAPTER_TITLE_TYPE1_') && trimmed.endsWith('_CHAPTER_TITLE_TYPE1_')) {
      const content = trimmed.substring('_CHAPTER_TITLE_TYPE1_'.length, trimmed.length - '_CHAPTER_TITLE_TYPE1_'.length);
      return `<h2 class="chapter-title">${content}</h2>`;
    } else if (trimmed.startsWith('_CHAPTER_TITLE_TYPE2_') && trimmed.endsWith('_CHAPTER_TITLE_TYPE2_')) {
      const content = trimmed.substring('_CHAPTER_TITLE_TYPE2_'.length, trimmed.length - '_CHAPTER_TITLE_TYPE2_'.length);
      return `<h2 class="numbered-title">${content}</h2>`;
    } else if (trimmed.startsWith('_CHAPTER_TITLE_TYPE3_') && trimmed.endsWith('_CHAPTER_TITLE_TYPE3_')) {
      const content = trimmed.substring('_CHAPTER_TITLE_TYPE3_'.length, trimmed.length - '_CHAPTER_TITLE_TYPE3_'.length);
      return `<h2 class="caps-title">${content}</h2>`;
    }
    // Простые правила для определения заголовков и цитат из обычного текста (существующие)
    else if (trimmed.startsWith('# ')) {
      return `<h1 class="text-center text-3xl font-bold mb-6 mt-8 text-primary">${trimmed.substring(2)}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      return `<h2 class="text-center text-2xl font-semibold mb-4 mt-6 text-primary">${trimmed.substring(3)}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      return `<h3 class="text-xl font-medium mb-3 mt-5 text-primary">${trimmed.substring(4)}</h3>`;
    } else if (trimmed.toUpperCase() === trimmed && trimmed.length < 100 && trimmed.split(' ').length < 10) { // All caps, short string
      return `<h2 class="text-center text-xl font-bold mb-4 mt-6 text-primary uppercase tracking-wide">${trimmed}</h2>`;
    } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return `<blockquote class="border-l-4 border-primary/30 pl-4 py-2 my-4 italic bg-muted/30"><p>${trimmed.substring(1, trimmed.length - 1)}</p></blockquote>`;
    } else {
      // Обычные параграфы
      return `<p class="mb-4 text-justify first-letter:text-2xl first-letter:font-bold first-letter:mr-1 first-letter:float-left">${trimmed}</p>`;
    }
  }).join(''); // Объединяем все параграфы в одну HTML-строку
};


export default function ReaderV2() {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('bookId');
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [fileBlob, setFileBlob] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [error, setError] = useState(null);

  // Новое состояние для текстового ридера
  const [loading, setLoading] = useState(true); // Main loading state
  const [allContent, setAllContent] = useState(''); // Entire book content as HTML string
  const [pages, setPages] = useState([]); // Array of HTML strings, each representing a page
  const [currentPage, setCurrentPage] = useState(1); // Current page index (1-based)
  const [totalPages, setTotalPages] = useState(0); // Total number of text pages
  const [currentPageContent, setCurrentPageContent] = useState(''); // Content of the current page

  // Заглушка для TOC
  const [toc, setToc] = useState([]);

  // Настройки ридера
  const [settings, setSettings] = useState({
    fontFamily: 'Georgia, serif',
    fontSize: 18,
    lineHeight: 1.6,
    textColor: 'inherit', // Handled by Tailwind dark/light mode
    backgroundColor: 'inherit', // Handled by Tailwind dark/light mode
  });

  // Состояние поиска
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1); // Fixed syntax error here

  // TTS состояние
  const [selectedText, setSelectedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsVoices, setTtsVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(localStorage.getItem('tts_voice_uri') || 'default');
  const [ttsRate, setTtsRate] = useState(1);
  const [ttsPitch, setTtsPitch] = useState(1);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Refs adapted for new reader structure
  const contentRef = useRef(null); // Ref for the main text content container
  const containerRef = useRef(null); // Ref for the main content container (for Watermark)

  // Состояние для меню выделения
  const [selectionMenuVisible, setSelectionMenuVisible] = useState(false);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      toast.info('Вы снова в сети! Синхронизируем данные...');
      syncOfflineData().then(result => {
        if (result.success) {
          toast.success(result.message);
        } else if (result.message !== 'Offline') { // Only show error if it's not simply "offline"
          toast.error(`Ошибка синхронизации: ${result.message}`);
        }
      });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Функция для обработки содержимого книги и выделения заголовков (пре-процессор)
  const formatBookContent = useCallback((content) => {
    if (!content) return '';
    
    // Паттерны для определения заголовков
    const chapterPatterns = [
      // Explicit "Глава/Chapter N" or "Часть/Part N"
      { regex: /^(?:Глава|Chapter|ГЛАВА|CHAPTER)\s+(\d+|[IVXLC]+)[\.\:]?\s*(.*)$/gim, marker: '_CHAPTER_TITLE_TYPE1_' },
      { regex: /^(?:Часть|Part|ЧАСТЬ|PART)\s+(\d+|[IVXLC]+)[\.\:]?\s*(.*)$/gim, marker: '_CHAPTER_TITLE_TYPE1_' },
      // Numbered headings like "1. Введение"
      { regex: /^(\d+\.\s+.+)$/gm, marker: '_CHAPTER_TITLE_TYPE2_' },
      // All caps, reasonably short
      { regex: /^([А-ЯЁA-Z][А-ЯЁA-Z\s]{5,70})$/gm, marker: '_CHAPTER_TITLE_TYPE3_' } // Adjusted length for better accuracy
    ];
    
    let preprocessedText = content;
    
    // Применяем маркеры для специфических паттернов глав
    chapterPatterns.forEach(pattern => {
      preprocessedText = preprocessedText.replace(pattern.regex, (match) => {
        // Заменяем на уникальный маркер, который convertPlainTextToHtml сможет распознать
        return `${pattern.marker}${match}${pattern.marker}`;
      });
    });
    
    // Нормализуем множественные переводы строк для разделения параграфов
    preprocessedText = preprocessedText.replace(/\n\s*\n/g, '\n\n'); // Гарантируем двойной перевод строки для параграфов
    preprocessedText = preprocessedText.replace(/\n\s*([^\n])/g, '\n$1'); // Обрезаем пробелы в начале новых строк

    return preprocessedText;
  }, []);


  // Pagination logic
  const paginateContent = useCallback(() => {
    if (!allContent) {
      setPages([]);
      setTotalPages(0);
      setCurrentPage(1);
      setCurrentPageContent('');
      return;
    }

    // This is a simplistic HTML-aware pagination. A more robust solution
    // would parse HTML into a DOM and then measure content height or word count.
    // For now, we'll split by words as before, assuming the HTML is simple enough.
    // A better approach for HTML content would be to render it to a hidden element
    // and measure actual page breaks.
    const wordsPerPage = 300; 
    const parser = new DOMParser();
    const doc = parser.parseFromString(allContent, 'text/html');
    const allTextNodes = [];

    // Helper to get all text nodes, preserving HTML structure loosely
    const getTextNodes = (node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
            allTextNodes.push(node.textContent.trim());
        } else {
            // Keep track of block elements to ensure they don't break across pages awkwardly
            if (node.nodeType === Node.ELEMENT_NODE && ['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE'].includes(node.tagName)) {
                allTextNodes.push(`START_BLOCK_${node.tagName}`); // Marker for block start
                for (const child of node.childNodes) {
                    getTextNodes(child);
                }
                allTextNodes.push(`END_BLOCK_${node.tagName}`); // Marker for block end
            } else {
                for (const child of node.childNodes) {
                    getTextNodes(child);
                }
            }
        }
    };
    getTextNodes(doc.body);

    const fullWordsArray = allTextNodes.join(' ').split(/\s+/).filter(word => word.length > 0);
    const newPages = [];
    let currentPageHtml = '';
    let currentWordCount = 0;

    for (let i = 0; i < fullWordsArray.length; i++) {
        const word = fullWordsArray[i];

        if (word.startsWith('START_BLOCK_')) {
            const tagName = word.split('_')[2].toLowerCase();
            currentPageHtml += `<${tagName}>`;
        } else if (word.startsWith('END_BLOCK_')) {
            const tagName = word.split('_')[2].toLowerCase();
            currentPageHtml += `</${tagName}>`;
        } else {
            currentPageHtml += (currentWordCount === 0 ? '' : ' ') + word;
            currentWordCount++;
        }

        if (currentWordCount >= wordsPerPage || i === fullWordsArray.length - 1) {
            newPages.push(currentPageHtml);
            currentPageHtml = '';
            currentWordCount = 0;
        }
    }

    setPages(newPages);
    setTotalPages(newPages.length);
    setCurrentPage(1); // Reset to first page
    setCurrentPageContent(newPages[0] || '');
  }, [allContent]);

  useEffect(() => {
    paginateContent();
  }, [allContent, paginateContent]);

  const loadBook = useCallback(async () => {
    if (!bookId) {
      setError('Book ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
        abortController.abort();
        setError('Загрузка книги заняла слишком много времени.');
        toast.error('Тайм-аут загрузки');
        setLoading(false);
    }, 30000);

    try {
        const cachedData = await getCachedBookData(bookId);
        if (cachedData?.fileBlob && cachedData?.details) {
            console.log('Loading book from IndexedDB cache.');
            setFileBlob(cachedData.fileBlob);
            setBook(cachedData.details);
            const type = determineFileType(cachedData.details.languages?.[0]?.file_url || '', cachedData.fileBlob.type);
            setFileType(type);
            const rawText = await extractRawTextFromFileBlob(cachedData.fileBlob, type);
            const finalHtml = looksLikeHtmlContent(rawText)
              ? sanitizeHTML(rawText)
              : sanitizeHTML(convertPlainTextToHtml(formatBookContent(rawText)));
            setAllContent(finalHtml);
            toast.success("Книга загружена из кеша");
            return;
        }
        
        console.log('Book not in cache, fetching from network.');
        const bookDetails = await Book.get(bookId);
        if (!bookDetails) throw new Error("Книга не найдена");
        setBook(bookDetails);

        const primaryFileUrl = bookDetails.languages.find(l => l.file_url)?.file_url;
        if (!primaryFileUrl) throw new Error("Файл книги отсутствует");

        const response = await fetch(primaryFileUrl, { signal: abortController.signal });
        if (!response.ok) throw new Error(`Ошибка при загрузке файла: ${response.statusText}`);

        const blob = await response.blob();
        setFileBlob(blob);
        const type = determineFileType(primaryFileUrl, blob.type);
        setFileType(type);

        const rawText = await extractRawTextFromFileBlob(blob, type);
        const finalHtml = looksLikeHtmlContent(rawText)
          ? sanitizeHTML(rawText)
          : sanitizeHTML(convertPlainTextToHtml(formatBookContent(rawText)));
        setAllContent(finalHtml);

        await cacheBookData(bookId, blob, bookDetails);
        toast.success("Книга загружена из сети и сохранена в кеше");

    } catch (e) {
      if (e.name === 'AbortError') {
        console.warn('Fetch aborted due to timeout or unmount.');
        setError('Загрузка книги отменена.');
      } else {
        console.error("Load book error:", e);
        setError(e.message || 'Не удалось загрузить книгу.');
        toast.error('Ошибка загрузки', { description: e.message });
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [bookId, formatBookContent]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  // Handle text selection for TTS and custom menu
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    setSelectedText(text);

    if (text && contentRef.current && contentRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionMenuPosition({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 40, // Position above selected text
      });
      setSelectedRange(range);
      setSelectionMenuVisible(true);
    } else {
      setSelectionMenuVisible(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
      speechSynthesis.cancel();
    };
  }, [handleTextSelection]);

  // Load TTS voices
  const loadVoices = useCallback(() => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      setTtsVoices(voices);
      const savedVoiceURI = localStorage.getItem('tts_voice_uri');
      const defaultVoice = voices.find(v => v.lang.startsWith(user?.preferred_languages?.[0] || 'ru')) || voices.find(v => v.default);
      if (savedVoiceURI && voices.some(v => v.voiceURI === savedVoiceURI)) {
        setSelectedVoiceURI(savedVoiceURI);
      } else if (defaultVoice) {
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    }
  }, [user]);

  useEffect(() => {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [loadVoices]);

  const handleTocSelect = useCallback((href) => {
    // Current TOC is not dynamically generated for text reader, so this is a placeholder.
    // Ideally, TOC for text would be based on recognized headings.
    toast.info(`Переход к "${href}" не реализован для текущего формата.`);
  }, []);

  // Search Logic adapted for text content
  const clearSearch = useCallback(() => {
    // For text content, simply clear results
    setSearchResults([]);
    setCurrentResultIndex(-1);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery) {
      clearSearch();
      return;
    }
    clearSearch();

    const results = [];
    // Simple text search, can be optimized for large texts
    for (let i = 0; i < pages.length; i++) {
        // We search in the raw text content of the page, not the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(pages[i], 'text/html');
        const pageText = doc.body.textContent || '';

        if (pageText.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({ page: i + 1, text: pageText }); // Store page number and text for context
        }
    }
    
    setSearchResults(results);
    if (results.length > 0) {
        setCurrentResultIndex(0);
        setCurrentPage(results[0].page);
        toast.success(`Найдено совпадений: ${results.length}`);
    } else {
        toast.info('Текст не найден.');
    }
  }, [searchQuery, pages, clearSearch]);

  const navigateResults = useCallback((direction) => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex + direction;
    if (newIndex < 0 || newIndex >= searchResults.length) return;

    setCurrentResultIndex(newIndex);
    setCurrentPage(searchResults[newIndex].page);
    // Optionally, could highlight the text within the page if implementing more advanced search
  }, [currentResultIndex, searchResults]);

  // TTS Logic
  const speak = useCallback((text) => {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = ttsVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
      utterance.rate = ttsRate;
      utterance.pitch = ttsPitch;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
  }, [selectedVoiceURI, ttsRate, ttsPitch, ttsVoices]);

  const handleTTSPlay = useCallback(() => {
    if (isSpeaking) {
      speechSynthesis.pause();
      setIsSpeaking(false);
      return;
    }
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsSpeaking(true);
      return;
    }

    if (selectedText) {
      speak(selectedText);
    } else {
      // Logic to get current page text for TTS (from currentPageContent's plain text)
      if (currentPageContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(currentPageContent, 'text/html');
        const plainText = doc.body.textContent || '';
        speak(plainText);
      } else {
        toast.info('Пожалуйста, выделите текст для озвучивания или убедитесь, что есть контент.');
      }
    }
  }, [isSpeaking, selectedText, speak, currentPageContent]);

  const handleTTSStop = useCallback(() => {
      speechSynthesis.cancel();
      setIsSpeaking(false);
  }, []);

  const handleTTSSummarize = useCallback(async () => {
      if (!selectedText) {
          toast.error('Нет текста для анализа.');
          return;
      }
      setIsSummarizing(true);
      try {
          const summary = await InvokeLLM({
              prompt: `Пожалуйста, сделай краткое содержание следующего отрывка на русском языке: "${selectedText}"`
          });
          speak(`Вот краткое содержание: ${summary}`);
      } catch (err) {
          console.error("Summarization error:", err);
          toast.error('Не удалось создать содержание.');
      } finally {
          setIsSummarizing(false);
      }
  }, [selectedText, speak]);

  const handleVoiceChange = useCallback((uri) => {
    setSelectedVoiceURI(uri);
    localStorage.setItem('tts_voice_uri', uri);
  }, []);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setCurrentPageContent(pages[page - 1]);
      if (bookId && totalPages > 0) {
        const progress = (page / totalPages) * 100;
        queueMutation({
          bookId,
          type: 'progress',
          payload: { page, progress: parseFloat(progress.toFixed(2)) }
        });
      }
    }
  }, [bookId, totalPages, pages]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-serif">
      <ReaderV2Toolbar
        currentPage={currentPage}
        numPages={totalPages} // Updated to totalPages
        onPageChange={handlePageChange}
        onZoom={() => {}} // Existing prop, no change
        onToggleTheme={() => {}} // Existing prop, no change
        // Search Props
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        searchResultsCount={searchResults.length}
        currentResultIndex={currentResultIndex}
        navigateResults={navigateResults}
        // TTS Props
        selectedText={selectedText}
        isSpeaking={isSpeaking}
        isSummarizing={isSummarizing}
        handleTTSPlay={handleTTSPlay}
        handleTTSStop={handleTTSStop}
        handleTTSSummarize={handleTTSSummarize}
        ttsVoices={ttsVoices}
        selectedVoiceURI={selectedVoiceURI}
        onVoiceChange={handleVoiceChange}
        ttsRate={ttsRate}
        setTtsRate={setTtsRate}
        ttsPitch={ttsPitch}
        setTtsPitch={setTtsPitch}
      />

      <div className="flex flex-1">
        <ReaderV2Sidebar toc={toc} onTocSelect={handleTocSelect} />

        {/* Main content area */}
        <div className="flex-1 relative">
          <div className="h-full overflow-hidden">
            <div 
              ref={contentRef}
              className="h-full reader-content"
              style={{ 
                backgroundColor: settings.backgroundColor,
              }}
              onMouseUp={handleTextSelection}
              onTouchEnd={handleTextSelection}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Загрузка книги...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col justify-center items-center h-full text-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                  <p>{error}</p>
                </div>
              ) : currentPageContent ? (
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-full"
                >
                  {/* Заголовок страницы */}
                  <div className="text-center mb-8 pb-4 border-b border-border/20">
                    <h1 className="text-2xl font-bold text-primary mb-2">
                      {book?.title}
                    </h1>
                    <p className="text-muted-foreground">
                      {book?.author} • Страница {currentPage} из {totalPages}
                    </p>
                  </div>

                  {/* Отформатированный контент */}
                  <div 
                    className="formatted-content"
                    style={{
                      fontFamily: settings.fontFamily,
                      fontSize: `${settings.fontSize}px`,
                      lineHeight: settings.lineHeight,
                      color: settings.textColor,
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: currentPageContent 
                    }}
                  />

                  {/* Разделитель между страницами */}
                  {currentPage < totalPages && (
                    <div className="flex justify-center mt-12 pt-8 border-t border-border/20">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-8 h-px bg-border"></div>
                        <span className="text-sm">Страница {currentPage + 1}</span>
                        <div className="w-8 h-px bg-border"></div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Контент не найден или не может быть отображен.</p>
                </div>
              )}

              {/* Watermark */}
              {book?.drm_watermark && user?.email && containerRef.current && (
                <Watermark text={user.email} containerRef={containerRef} />
              )}

              {/* Selection Menu */}
              {selectionMenuVisible && selectedText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg flex space-x-2 border border-gray-200 dark:border-gray-600"
                  style={{
                    left: selectionMenuPosition.x,
                    top: selectionMenuPosition.y,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <button
                    onClick={handleTTSPlay}
                    className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                  >
                    {isSpeaking ? 'Пауза' : 'Озвучить'}
                  </button>
                  <button
                    onClick={handleTTSSummarize}
                    disabled={isSummarizing}
                    className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                  >
                    {isSummarizing ? 'Суммирование...' : 'Суммировать'}
                  </button>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Inline styles for prose and scrollbar */}
      <style>{`
        .reader-content {
          line-height: 1.8;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
          word-wrap: break-word;
          hyphens: auto;
          overflow-wrap: break-word; /* Переносить длинные слова целиком */
          overflow-y: auto; /* Existing scrollbar */
          font-feature-settings: 'liga', 'kern';
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Prevent word breaks across page boundaries in a print-like context */
        .reader-content * {
          word-break: keep-all; /* Do not break words */
        }

        /* Стили для заголовков глав */
        .chapter-title {
          font-size: 2.5rem;
          font-weight: bold;
          text-align: center;
          margin: 3rem 0 2rem 0;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 3px solid var(--primary);
          padding-bottom: 1rem;
          page-break-before: always; /* Начинать главу с новой страницы (для печати) */
          break-before: page; /* Для CSS Paged Media */
        }

        .numbered-title {
          font-size: 2rem;
          font-weight: bold;
          margin: 2rem 0 1.5rem 0;
          color: var(--primary);
          border-left: 4px solid var(--primary);
          padding-left: 1rem;
        }

        .caps-title {
          font-size: 1.8rem;
          font-weight: bold;
          text-align: center;
          margin: 2rem 0 1rem 0;
          color: var(--foreground);
          text-transform: capitalize;
        }

        /* Стили для абзацев */
        .formatted-content p {
          margin-bottom: 1.5rem;
          text-align: justify;
          text-indent: 2em; /* Красная строка */
          widows: 2; /* Минимум строк внизу страницы */
          orphans: 2; /* Минимум строк вверху страницы */
        }
        
        /* General formatted-content styling (existing) */
        .formatted-content h1,
        .formatted-content h2,
        .formatted-content h3,
        .formatted-content h4 {
          scroll-margin-top: 2rem;
          text-align: center;
          color: var(--primary);
          font-weight: bold;
          margin: 1.5rem 0 1rem;
        }

        .formatted-content h1 {
          font-size: 2rem;
        }

        .formatted-content h2 {
          font-size: 1.5rem;
        }

        .formatted-content h3 {
          font-size: 1.25rem;
        }

        .formatted-content p:first-letter {
          font-size: 2rem;
          font-weight: bold;
          float: left;
          margin-right: 0.25rem;
        }

        .reader-content::-webkit-scrollbar {
          width: 8px;
        }

        .reader-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .reader-content::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }

        .reader-content::-webkit-scrollbar-thumb:hover {
          background: var(--muted-foreground);
        }

        /* Define CSS variables based on your theme */
        :root {
          --primary: #007bff; /* Example primary color */
          --foreground: #333; /* Example text color */
          --muted-foreground: #666; /* Example muted text color */
          --background: #f0f2f5; /* Example background */
          --border: #ddd; /* Example border color */
          --muted: #e9ecef; /* Example muted background */
        }
        .dark {
          --primary: #66b3ff;
          --foreground: #e0e0e0;
          --muted-foreground: #b0b0b0;
          --background: #1a202c;
          --border: #444;
          --muted: #2d3748;
        }
        /* Темная тема */
        .dark .chapter-title,
        .dark .numbered-title {
          color: var(--primary);
          border-color: var(--primary);
        }

        /* Сепия тема */
        .sepia .reader-content {
          background-color: hsl(43 84% 95%);
          color: hsl(30 83% 9%);
        }

        .sepia .chapter-title,
        .sepia .numbered-title {
          color: hsl(142 85% 25%);
          border-color: hsl(142 85% 25%);
        }

        /* Адаптивность */
        @media (max-width: 768px) {
          .reader-content {
            padding: 1rem;
            font-size: 16px;
          }
          
          .chapter-title {
            font-size: 1.8rem;
            margin: 2rem 0 1rem 0;
          }
          
          .numbered-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
