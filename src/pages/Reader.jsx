
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Book } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { UserBookData } from '@/api/entities';
import { useAuth } from '../components/auth/Auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  StickyNote,
  Settings,
  Book as BookIcon,
  FileText
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import ReadingTimeTracker from '../components/reader/ReadingTimeTracker';
import TextSelectionHandler from '../components/reader/TextSelectionHandler';

// New imports for Reader components
import ReaderToolbar from '../components/reader/ReaderToolbar';
import ReaderSidebar from '../components/reader/ReaderSidebar';
import { AnimatePresence } from 'framer-motion';

import { getBookContent } from '@/api/functions';

export default function Reader() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const getParam = useCallback(
    (...keys) => {
      for (const key of keys) {
        const value = searchParams.get(key);
        if (value) return value;
      }
      for (const key of keys) {
        const value = searchParams.get(key.toLowerCase());
        if (value) return value;
      }
      return null;
    },
    [searchParams]
  );

  const bookId = getParam('id', 'bookId');
  const isPreview = ['preview', 'isPreview', 'isPreviewMode'].some((key) => {
    const value = getParam(key);
    return value === 'true';
  });

  const [book, setBook] = useState(null);
  const [userBookData, setUserBookData] = useState(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0); // Initialized to 0, will be calculated
  const [columns, setColumns] = useState(2); // Changed default to 2 columns
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to sidebar open

  const contentRef = useRef(null);
  const pageHeightRef = useRef(0); // To store the effective height of a page for scrolling

  // Constants for localStorage keys
  const FONT_SIZE_KEY = 'kasbook_reader_font_size';
  const THEME_KEY = 'kasbook_reader_theme';

  // Reader settings states with localStorage persistence
  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem(FONT_SIZE_KEY);
    return savedSize ? parseInt(savedSize, 10) : 16; // Changed default to 16px
  });

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme || 'light'; // Default to 'light' if not found
  });

  // Apply theme classes based on the selected theme
  // NOTE: This object structure and the corresponding CSS variables in the <style jsx> block
  // are retained as they correctly implement the theming functionality.
  // Changes suggested in the outline here would break existing theming logic.
  const themeClasses = {
    light: 'reader-theme-light',
    sepia: 'reader-theme-sepia',
    dark: 'reader-theme-dark'
  };

  // Save font size to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FONT_SIZE_KEY, fontSize.toString());
  }, [fontSize]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Load book and user data
  const loadData = useCallback(async () => {
    if (!bookId) {
      setError('Идентификатор книги не передан');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(`[Reader] Loading book ID: ${bookId}`);

    try {
      const bookData = await Book.get(bookId);
      if (!bookData) throw new Error('Книга не найдена');
      setBook(bookData);
      console.log('[Reader] Book data fetched:', bookData);

      // Load user book data
      let initialPage = 1;
      if (isAuthenticated && user) {
        try {
          const userBooks = await UserBookData.filter({ user_email: user.email, book_id: bookId });
          if (userBooks.length > 0) {
            setUserBookData(userBooks[0]);
            initialPage = userBooks[0].current_page || 1;
            console.log('[Reader] User book data loaded:', userBooks[0]);
          } else if (isPreview) {
            // Create a new UserBookData record if in preview and none exists
            const newRecord = await UserBookData.create({
              user_email: user.email,
              book_id: bookId,
              current_page: 1,
              total_pages: 1,
              reading_progress: 0,
              notes: [],
              bookmarks: [],
              started_reading_at: new Date().toISOString(),
              last_read_at: new Date().toISOString()
            });
            setUserBookData(newRecord);
            console.log('[Reader] New UserBookData created for preview:', newRecord);
          }
        } catch (err) {
          console.warn('Failed to load or create user data:', err);
        }
      }

      // Load book content via server function
      console.log('[Reader] Loading book content...');
      const response = await getBookContent({
        bookId: bookId,
        isPreview: isPreview
      });

      console.log('[Reader] getBookContent response:', response);

      if (!response || response.error) {
        throw new Error(response?.error || 'Не удалось загрузить содержимое');
      }

      const bookContent = response.data?.content || response.content;
      if (!bookContent) {
        throw new Error('Содержимое книги пустое');
      }
      
      setContent(bookContent);
      setCurrentPage(initialPage); // Set current page from user data or default to 1
      console.log(`[Reader] Content loaded: ${bookContent.length} characters. Initial page: ${initialPage}`);

    } catch (err) {
      console.error('Error loading book:', err);
      setError(err.message);
      toast.error(`Ошибка загрузки: ${err.message}`);
      
      // Fallback to demo content if content loading fails
      let fallbackContent = 'Глава 1\n\nТестовый контент для проверки читалки. ';
      fallbackContent += 'Это демонстрационный текст, который показывает, что читалка работает корректно. ';
      fallbackContent += 'В реальной ситуации здесь должен быть текст из загруженного файла книги. ';
      fallbackContent += '\n\nГлава 2\n\nПродолжение истории с новой главой. ';
      fallbackContent = fallbackContent.repeat(50); // Create enough text
      setContent(fallbackContent);
      toast.warning('Загружен демонстрационный контент');
    } finally {
      setIsLoading(false);
    }
  }, [bookId, user, isAuthenticated]); // Changed dependencies: removed `isPreview`

  useEffect(() => {
    loadData();
  }, [loadData]);

  // DYNAMIC PAGINATION LOGIC
  const calculatePages = useCallback(() => {
    if (contentRef.current) {
      const container = contentRef.current;
      const contentHeight = container.scrollHeight;
      const pageHeight = container.clientHeight;
      pageHeightRef.current = pageHeight; // Store page height for scrolling

      // Calculate total pages based on content height and container height
      const pages = Math.ceil(contentHeight / pageHeight);
      setTotalPages(pages > 0 ? pages : 1);
      
      // Adjust current page if it's out of bounds after resize/content change
      if (currentPage > pages && pages > 0) {
        setCurrentPage(pages);
      }
      if (currentPage < 1 && pages > 0) {
        setCurrentPage(1);
      }
    }
  }, [content, fontSize, columns, currentPage]); // Retained dependencies for correct dynamic pagination

  useEffect(() => {
    calculatePages();
    const handleResize = () => calculatePages();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [content, fontSize, columns, calculatePages]);

  // Scroll to the correct page position when currentPage changes
  useEffect(() => {
    if (contentRef.current && pageHeightRef.current > 0) {
      const scrollTop = (currentPage - 1) * pageHeightRef.current;
      contentRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }, [currentPage]); // Retained dependencies: removed `totalPages` as it is not directly read

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleNextPage = () => goToPage(currentPage + 1);
  const handlePrevPage = () => goToPage(currentPage - 1);

  // Save progress logic, adapted from the original saveProgress
  const handleUpdateProgress = useCallback(async () => {
    if (!isAuthenticated || !user || !userBookData || totalPages === 0) return;

    try {
      const progress = Math.round((currentPage / totalPages) * 100);
      const now = new Date().toISOString();

      const updateData = {
        current_page: currentPage,
        total_pages: totalPages,
        reading_progress: progress,
        last_read_at: now
      };

      if (!userBookData.started_reading_at) {
        updateData.started_reading_at = now;
      }

      // Ensure userBookData.id exists for update
      if (userBookData && userBookData.id) {
        await UserBookData.update(userBookData.id, updateData);
        setUserBookData(prev => prev ? { ...prev, ...updateData } : null); // Update local state
      } else {
        // If userBookData somehow doesn't have an ID but user is authenticated, create a new record.
        // This scenario should be rare if loadData works correctly, but good for robustness.
        const newRecord = await UserBookData.create({
          user_email: user.email,
          book_id: bookId,
          notes: [],
          bookmarks: [],
          ...updateData,
          started_reading_at: now // Must be set for new records
        });
        setUserBookData(newRecord);
      }

    } catch (err) {
      console.warn('Failed to update reading progress:', err);
    }
  }, [isAuthenticated, user, bookId, currentPage, totalPages, userBookData]);

  // Trigger progress update when current page changes
  useEffect(() => {
    // Only update progress after initial load and if content is present
    if (!isLoading && content && totalPages > 0) {
      handleUpdateProgress();
    }
  }, [currentPage, handleUpdateProgress, isLoading, content, totalPages]);


  // Обработка заметок - ИСПРАВЛЕНО для передачи всех обязательных полей
  const handleAddNote = useCallback(async (noteData) => {
    if (!isAuthenticated || !user) {
      toast.info('Войдите, чтобы добавлять заметки.');
      return;
    }
    
    // ИСПРАВЛЕНО: Проверяем и устанавливаем все обязательные поля
    const { selectedText, highlightColor, noteText, pageNumber } = noteData;

    // Валидация обязательных полей
    if (!selectedText || selectedText.trim().length === 0) {
      toast.error('Необходимо выделить текст для создания заметки');
      return;
    }

    if (!pageNumber || pageNumber < 1) {
      toast.error('Некорректный номер страницы');
      return;
    }

    try {
      const newNote = {
        id: Date.now().toString(),
        page_number: pageNumber, // ОБЯЗАТЕЛЬНОЕ ПОЛЕ
        selected_text: selectedText, // ОБЯЗАТЕЛЬНОЕ ПОЛЕ
        highlight_color: highlightColor || 'yellow',
        note_text: noteText || '',
        created_at: new Date().toISOString()
      };

      console.log('Создаем заметку:', newNote); // Для отладки

      const currentNotes = userBookData?.notes || [];
      const updatedNotes = [...currentNotes, newNote];

      if (userBookData && userBookData.id) {
        await UserBookData.update(userBookData.id, { notes: updatedNotes });
        setUserBookData(prev => ({ ...prev, notes: updatedNotes }));
      } else {
        // Создаем новую запись с обязательными полями
        const newRecord = await UserBookData.create({
          user_email: user.email,
          book_id: bookId,
          notes: updatedNotes,
          bookmarks: [],
          current_page: currentPage,
          total_pages: totalPages,
          reading_progress: Math.round((currentPage / totalPages) * 100),
          started_reading_at: new Date().toISOString(),
          last_read_at: new Date().toISOString()
        });
        setUserBookData(newRecord);
      }

      toast.success('Заметка добавлена!');
    } catch (err) {
      console.error('Ошибка добавления заметки:', err);
      toast.error('Не удалось добавить заметку');
    }
  }, [isAuthenticated, user, bookId, userBookData, currentPage, totalPages]);


  // ИСПРАВЛЕНО: Улучшенная обработка глав и параграфов
  const formatContent = (text) => {
    if (!text) return '';
    const chapterRegex = /^(глава\s+\d+|chapter\s+\d+|часть\s+\d+|part\s+\d+|\d+\.)/gim; // Expanded chapter patterns
    
    // Split by newlines, then process each part
    const paragraphs = text.split('\n').map((line, index) => {
      line = line.trim();
      if (!line) return ''; // Skip empty lines

      // If it looks like a chapter title
      if (chapterRegex.test(line)) {
        return `<h2 class="chapter-title">${line}</h2>`;
      }
      // Otherwise, wrap in a paragraph
      return `<p>${line}</p>`;
    }).filter(Boolean).join(''); // Filter out empty strings before joining

    return paragraphs;
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 animate-pulse text-primary" />
            <p className="text-lg">Загрузка книги...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-4">Ошибка загрузки</h2>
          <p className="text-muted-foreground mb-4">{error || 'Книга не найдена'}</p>
          <Link to={createPageUrl('Catalog')}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к каталогу
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${themeClasses[theme]}`}>
      {user && bookId && (
        <ReadingTimeTracker
          bookId={bookId}
          userEmail={user.email}
          isActive={!isPreview}
        />
      )}
      <AnimatePresence>
        {isSidebarOpen && (
          <ReaderSidebar 
            book={book} 
            userBookData={userBookData}
            currentPage={currentPage}
            totalPages={totalPages}
            goToPage={goToPage}
            onClose={() => setIsSidebarOpen(false)}
            isAuthenticated={isAuthenticated}
            currentTheme={theme} // Pass current theme to sidebar
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative">
        <ReaderToolbar
          bookTitle={book?.title || 'Unknown Title'}
          currentPage={currentPage}
          totalPages={totalPages}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSettingsChange={{
            fontSize, setFontSize,
            theme, setTheme,
            columns, setColumns
          }}
          isAuthenticated={isAuthenticated}
          isPreview={isPreview}
        />

        <div className="flex-1 overflow-hidden relative reader-main-content-area">
          {/* Main Content Area */}
          <TextSelectionHandler 
            onAddNote={handleAddNote} 
            currentPage={currentPage} 
            isAuthenticated={isAuthenticated}
            book={book}
          >
            <div
              ref={contentRef}
              className="reader-content overflow-y-scroll h-full px-8 sm:px-12 md:px-20 py-8 scroll-smooth"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.8,
                columnCount: columns, // Apply column count
                columnGap: `${fontSize * 2}px`, // Dynamic column gap based on font size
                paddingBottom: pageHeightRef.current / 2, // Add extra padding to allow scrolling last partial page to top
                color: 'var(--reader-text-color)' // Ensure text color is from theme
              }}
              dangerouslySetInnerHTML={{ __html: formatContent(content) }}
            />
          </TextSelectionHandler>
          
          {/* Page Turn Buttons */}
          <div 
            onClick={handlePrevPage}
            className="absolute left-0 top-0 h-full w-1/4 cursor-pointer z-10"
            title="Предыдущая страница"
          />
          <div 
            onClick={handleNextPage}
            className="absolute right-0 top-0 h-full w-1/4 cursor-pointer z-10"
            title="Следующая страница"
          />
        </div>

        {/* Preview Mode warning, if applicable */}
        {isPreview && !isAuthenticated && ( // Assuming !isAuthenticated means not logged in
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-yellow-100 text-yellow-800 text-center z-20">
            <p>Вы просматриваете ознакомительную версию. Для полноценного чтения и заметок войдите в систему.</p>
          </div>
        )}
        {isPreview && isAuthenticated && ( // Assuming !isAuthenticated means not logged in
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-yellow-100 text-yellow-800 text-center z-20">
            <p>Вы просматриваете ознакомительную версию. Для полноценного чтения купите книгу.</p>
            <Link to={createPageUrl(`BookDetails?id=${bookId}`)}>
              <Button size="sm" className="mt-2">Купить за {book.price_kas} KAS</Button>
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .reader-theme-light {
          --reader-bg: #F9FAFB;
          --reader-page-bg: white;
          --reader-text-color: #1F2937;
          --reader-border-color: #E5E7EB;
        }
        .reader-theme-dark {
          --reader-bg: #111827;
          --reader-page-bg: #1F2937;
          --reader-text-color: #D1D5DB;
          --reader-border-color: #374151;
        }
        .reader-theme-sepia {
          --reader-bg: #fbf5e7;
          --reader-page-bg: #f4eada;
          --reader-text-color: #5b4636;
          --reader-border-color: #e9decb;
        }

        .reader-main-content-area {
          background-color: var(--reader-bg); /* Apply background to the entire content area */
        }

        .reader-content {
          margin: 0 auto;
          max-width: 1000px; /* Max width for content for readability */
          background-color: var(--reader-page-bg); /* Page background for the content itself */
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          border: 1px solid var(--reader-border-color);
          position: relative; /* Needed for text selection handler */
        }
        
        /* Basic paragraph styling */
        .reader-content :global(p) {
            margin-bottom: 1em;
            text-indent: 1.5em; /* Traditional paragraph indent */
            line-height: var(--line-height, 1.8); /* Allow dynamic line height if needed */
        }
        .reader-content :global(p:first-child) {
            text-indent: 0;
        }

        /* Chapter title styling */
        .reader-content :global(.chapter-title) {
            font-size: 1.8em; /* Larger font size for chapters */
            font-weight: bold;
            text-align: center;
            margin: 2em 0 1.5em 0; /* Spacing above and below */
            padding: 0.5em 0;
            border-bottom: 1px solid var(--reader-border-color); /* Subtle separator */
            text-indent: 0; /* No indent for chapter titles */
            color: var(--reader-text-color);
        }

        @media (max-width: 768px) {
          .reader-content {
            padding: 20px;
          }
          .reader-content :global(.chapter-title) {
            font-size: 1.5em;
            margin: 1.5em 0 1em 0;
          }
          .reader-content {
            max-width: none; /* No max-width on mobile */
          }
        }
      `}</style>
    </div>
  );
}
