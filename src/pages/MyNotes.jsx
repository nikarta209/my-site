import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  Filter,
  Heart,
  Loader2,
  RefreshCw,
  Search,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/components/auth/Auth';
import LibraryMenu from '@/components/library/LibraryMenu';
import NoteCard from '@/components/notes/NoteCard';
import { UserBookData, SharedNote, Book, NoteLike } from '@/api/entities';
import { getBookCoverUrl } from '@/lib/books/coverImages';
import { isSupabaseConfigured } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PAGE_SIZE = 6;

const PAGE_RANGE_OPTIONS = [
  { value: 'all', label: 'Все страницы' },
  { value: '1-50', label: 'Страницы 1–50' },
  { value: '51-100', label: 'Страницы 51–100' },
  { value: '101-200', label: 'Страницы 101–200' },
  { value: '200+', label: 'Страницы 200+' },
  { value: 'no-page', label: 'Без указания страницы' }
];

const PERSONAL_GRADIENTS = [
  'from-sky-500/80 via-cyan-500/70 to-emerald-400/70',
  'from-indigo-500/80 via-violet-500/70 to-fuchsia-400/70',
  'from-amber-500/80 via-orange-500/70 to-rose-400/70',
  'from-emerald-500/80 via-teal-500/70 to-cyan-400/70',
  'from-rose-500/80 via-pink-500/70 to-purple-500/70'
];

const resolveCoverImage = (source = {}, book = {}) => {
  if (source.coverUrl || source.cover) {
    return source.coverUrl || source.cover;
  }

  const noteSpecific = book?.notes_cover_url || book?.notesCoverUrl;
  if (noteSpecific) return noteSpecific;

  return getBookCoverUrl(book, { variant: 'notes', fallback: null }) || null;
};

const computeAccent = (identifier = '') => {
  if (!identifier) return PERSONAL_GRADIENTS[0];
  const normalized = identifier.toString();
  const hash = Array.from(normalized).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PERSONAL_GRADIENTS[hash % PERSONAL_GRADIENTS.length];
};

const formatPersonalNote = (record, rawNote, index, bookLookup, accentGradient) => {
  const lookup = bookLookup || {};
  const book = lookup[record.book_id] || {};
  const createdAt = rawNote?.created_at || record?.created_at || null;
  const updatedAt = rawNote?.updated_at || rawNote?.created_at || record?.updated_at || createdAt;
  const noteText = rawNote?.note_text || rawNote?.text || '';
  const selectedText = rawNote?.selected_text || rawNote?.highlight_text || '';
  const rawTitle =
    rawNote?.title ||
    noteText?.split('\n')[0] ||
    selectedText?.slice(0, 80) ||
    `Заметка ${index + 1}`;

  return {
    id: rawNote?.id || `${record.id}:${index}`,
    originalNoteId: rawNote?.id || null,
    noteIndex: index,
    userBookDataId: record.id,
    bookId: record.book_id,
    bookTitle: rawNote?.book_title || book?.title || 'Без названия',
    bookAuthor: rawNote?.book_author || book?.author || '',
    coverUrl: resolveCoverImage(rawNote, book),
    pageNumber: rawNote?.page_number || rawNote?.page || null,
    createdAt,
    updatedAt,
    noteText,
    selectedText,
    highlightColor: rawNote?.highlight_color || 'amber',
    tags: rawNote?.tags || [],
    accentColor: accentGradient,
    allowComments: rawNote?.allow_comments ?? true,
    isDraft: rawNote?.is_draft ?? rawNote?.status === 'draft',
    title: rawTitle?.slice(0, 90)
  };
};

const formatPublishedNote = (rawNote, bookLookup) => {
  const lookup = bookLookup || {};
  const book = lookup[rawNote.book_id] || {};
  const noteText = rawNote?.note_text || '';
  const selectedText = rawNote?.selected_text || '';
  const rawTitle =
    rawNote?.title ||
    noteText?.split('\n')[0] ||
    selectedText?.slice(0, 80) ||
    'Опубликованная заметка';

  return {
    id: rawNote.id,
    bookId: rawNote.book_id,
    bookTitle: rawNote.book_title || book?.title || 'Без названия',
    bookAuthor: rawNote.book_author || book?.author || '',
    coverUrl: resolveCoverImage(rawNote, book),
    pageNumber: rawNote.page_number || null,
    createdAt: rawNote.created_at,
    updatedAt: rawNote.updated_at,
    noteText,
    selectedText,
    highlightColor: rawNote.highlight_color || 'amber',
    tags: rawNote.tags || [],
    likesCount: rawNote.likes_count ?? 0,
    allowComments: rawNote.metadata?.allow_comments ?? rawNote.allow_comments ?? true,
    title: rawTitle?.slice(0, 90)
  };
};

const matchesPageFilter = (pageNumber, range) => {
  if (range === 'all') return true;
  if (range === 'no-page') {
    return pageNumber == null || pageNumber === '';
  }

  if (pageNumber == null || pageNumber === '') {
    return false;
  }

  const numeric = Number(pageNumber);
  if (Number.isNaN(numeric)) {
    return false;
  }

  if (range === '1-50') return numeric >= 1 && numeric <= 50;
  if (range === '51-100') return numeric >= 51 && numeric <= 100;
  if (range === '101-200') return numeric >= 101 && numeric <= 200;
  if (range === '200+') return numeric >= 200;

  return true;
};

const buildMockData = (user) => {
  const gradient = computeAccent(user?.email || user?.id || 'demo');
  const now = new Date();
  const minusDays = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const mockBooks = [
    {
      id: 'demo-book-1',
      title: 'Дюна',
      author: 'Фрэнк Герберт',
      cover_images: { default: 'https://images.unsplash.com/photo-1544937950-fa07a98d237f?w=300&h=420&fit=crop' }
    },
    {
      id: 'demo-book-2',
      title: 'Три товарища',
      author: 'Эрих Мария Ремарк',
      cover_images: { default: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&h=420&fit=crop' }
    }
  ];

  const bookMap = Object.fromEntries(mockBooks.map((book) => [book.id, book]));

  const personalRecords = [
    {
      id: 'demo-record-1',
      book_id: mockBooks[0].id,
      notes: [
        {
          id: 'demo-note-1',
          note_text:
            'Страх убивает разум. Делала заметку, чтобы вспомнить, что даже в самых сложных ситуациях важно дышать и идти дальше.',
          selected_text: 'Страх — это убийца разума. Страх — это малая смерть, которая приносит полное забвение.',
          page_number: 42,
          created_at: minusDays(2),
          updated_at: minusDays(1),
          tags: ['цитата', 'мотивация']
        },
        {
          id: 'demo-note-2',
          note_text: 'Интересная мысль о роли воды в политике Арракиса. Надо вернуться к этой главе позже.',
          page_number: 87,
          created_at: minusDays(6),
          updated_at: minusDays(5),
          tags: ['сюжет']
        }
      ]
    },
    {
      id: 'demo-record-2',
      book_id: mockBooks[1].id,
      notes: [
        {
          id: 'demo-note-3',
          note_text:
            'Этот эпизод с кофе потрясающе показывает теплоту дружбы. Пусть останется здесь как напоминание провести вечер с друзьями.',
          page_number: 154,
          created_at: minusDays(12),
          updated_at: minusDays(10),
          tags: ['дружба']
        }
      ]
    }
  ];

  const personalNotes = personalRecords.flatMap((record) => {
    const book = bookMap[record.book_id];
    return (record.notes || []).map((note, index) => ({
      id: note.id || `${record.id}:${index}`,
      originalNoteId: note.id || null,
      noteIndex: index,
      userBookDataId: record.id,
      bookId: record.book_id,
      bookTitle: book?.title || 'Без названия',
      bookAuthor: book?.author || '',
      coverUrl: resolveCoverImage(note, book),
      pageNumber: note.page_number || null,
      createdAt: note.created_at,
      updatedAt: note.updated_at || note.created_at,
      noteText: note.note_text || '',
      selectedText: note.selected_text || '',
      tags: note.tags || [],
      accentColor: gradient,
      allowComments: true,
      isDraft: false,
      title:
        note.note_text?.split('\n')[0]?.slice(0, 80) ||
        note.selected_text?.slice(0, 80) ||
        `Заметка ${index + 1}`
    }));
  });

  const publishedNotes = [
    {
      id: 'demo-shared-1',
      bookId: mockBooks[0].id,
      bookTitle: mockBooks[0].title,
      bookAuthor: mockBooks[0].author,
      coverUrl: getBookCoverUrl(mockBooks[0], { variant: 'portrait', fallback: null }),
      pageNumber: 42,
      createdAt: minusDays(1),
      updatedAt: minusDays(1),
      noteText:
        'Страх убивает разум. Даже спустя пару дней фраза продолжает звучать в голове. Кажется, стоит распечатать и повесить над столом.',
      selectedText: 'Страх — это убийца разума. Страх — это малая смерть, которая приносит полное забвение.',
      tags: ['цитата', 'мотивация'],
      likesCount: 24,
      allowComments: true,
      title: 'Страх убивает разум'
    },
    {
      id: 'demo-shared-2',
      bookId: mockBooks[1].id,
      bookTitle: mockBooks[1].title,
      bookAuthor: mockBooks[1].author,
      coverUrl: getBookCoverUrl(mockBooks[1], { variant: 'portrait', fallback: null }),
      pageNumber: 150,
      createdAt: minusDays(4),
      updatedAt: minusDays(3),
      noteText:
        'Редко встречаешь в книгах такую искреннюю дружбу. Хочется перечитывать именно ради этих моментов.',
      selectedText: '',
      tags: ['дружба'],
      likesCount: 11,
      allowComments: false,
      title: 'Сцена с кофе'
    }
  ];

  const recordMap = Object.fromEntries(personalRecords.map((record) => [record.id, record]));

  return {
    personalNotes,
    publishedNotes,
    recordMap,
    bookMap
  };
};

const MyNotes = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(() =>
    searchParams.get('scope') === 'published' ? 'published' : 'personal'
  );
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [pageRange, setPageRange] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState({ personal: 'newest', published: 'newest' });
  const [pagination, setPagination] = useState({ personal: 1, published: 1 });
  const [personalNotes, setPersonalNotes] = useState([]);
  const [publishedNotes, setPublishedNotes] = useState([]);
  const [likedNotes, setLikedNotes] = useState(new Set());
  const [bookMap, setBookMap] = useState({});
  const [userBookRecords, setUserBookRecords] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [publishDialogNote, setPublishDialogNote] = useState(null);
  const [allowComments, setAllowComments] = useState(true);
  const [editDialogNote, setEditDialogNote] = useState(null);
  const [editText, setEditText] = useState('');
  const [loadingStates, setLoadingStates] = useState({
    publish: new Set(),
    delete: new Set(),
    edit: new Set(),
    like: new Set(),
    unpublish: new Set()
  });
  const scopeParam = searchParams.get('scope');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm((prev) => (prev === searchInput ? prev : searchInput));
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    const nextTab = scopeParam === 'published' ? 'published' : 'personal';
    if (nextTab !== activeTab) {
      setActiveTabState(nextTab);
    }
  }, [scopeParam, activeTab]);

  useEffect(() => {
    const desiredScope = activeTab === 'published' ? 'published' : 'private';
    if (scopeParam !== desiredScope) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('scope', desiredScope);
        return next;
      }, { replace: true });
    }
  }, [activeTab, scopeParam, setSearchParams]);

  const handleTabChange = useCallback((value) => {
    setActiveTabState(value === 'published' ? 'published' : 'personal');
  }, []);

  const handleLibraryMenuSelect = useCallback(
    (key) => {
      const basePath = createPageUrl('Library');
      const params = new URLSearchParams();

      if (key && key !== 'dashboard') {
        params.set('section', key);
      }

      const target = params.toString() ? `${basePath}?${params.toString()}` : basePath;
      navigate(target);
    },
    [navigate]
  );

  const accentGradient = useMemo(() => computeAccent(user?.email || user?.id || ''), [user?.email, user?.id]);

  const updateLoadingState = useCallback((action, noteId, enabled) => {
    setLoadingStates((prev) => {
      const nextSet = new Set(prev[action] || []);
      if (enabled) {
        nextSet.add(noteId);
      } else {
        nextSet.delete(noteId);
      }
      return { ...prev, [action]: nextSet };
    });
  }, []);

  const loadNotes = useCallback(async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setLoadError(null);

    if (!isSupabaseConfigured) {
      const demoData = buildMockData(user);
      setPersonalNotes(demoData.personalNotes);
      setPublishedNotes(demoData.publishedNotes);
      setUserBookRecords(demoData.recordMap);
      setBookMap(demoData.bookMap);
      setLikedNotes(new Set(['demo-shared-1']));
      setIsDemoMode(true);
      setIsLoading(false);
      return;
    }

    try {
      const [userDataRecords, sharedNotes] = await Promise.all([
        UserBookData.filter({ user_email: user.email }, '-updated_at'),
        SharedNote.filter({ user_email: user.email, is_public: true }, '-updated_at')
      ]);

      const recordMap = Object.fromEntries(userDataRecords.map((record) => [record.id, record]));
      setUserBookRecords(recordMap);

      const bookIds = new Set();
      userDataRecords.forEach((record) => record?.book_id && bookIds.add(record.book_id));
      sharedNotes.forEach((note) => note?.book_id && bookIds.add(note.book_id));

      let fetchedBooks = [];
      if (bookIds.size > 0) {
        fetchedBooks = await Book.filter({ id: { '$in': Array.from(bookIds) } });
      }
      const fetchedBookMap = Object.fromEntries(fetchedBooks.map((book) => [book.id, book]));
      setBookMap(fetchedBookMap);

      const personal = userDataRecords.flatMap((record) => {
        const notesArray = Array.isArray(record?.notes) ? record.notes : [];
        return notesArray.map((note, index) =>
          formatPersonalNote(record, note, index, fetchedBookMap, accentGradient)
        );
      });

      personal.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

      const published = sharedNotes
        .filter((note) => note?.is_public !== false)
        .map((note) => formatPublishedNote(note, fetchedBookMap));

      setPersonalNotes(personal);
      setPublishedNotes(published);
      setIsDemoMode(false);

      if (sharedNotes.length > 0) {
        try {
          const noteIds = sharedNotes.map((note) => note.id);
          const existingLikes = await NoteLike.filter({
            user_email: user.email,
            shared_note_id: { '$in': noteIds }
          });
          setLikedNotes(new Set(existingLikes.map((like) => like.shared_note_id)));
        } catch (likeError) {
          console.warn('[MyNotes] Failed to load likes', likeError);
          setLikedNotes(new Set());
        }
      } else {
        setLikedNotes(new Set());
      }
    } catch (error) {
      console.error('[MyNotes] Failed to load notes', error);
      setLoadError(error);
      toast.error('Не удалось загрузить заметки. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  }, [user, accentGradient]);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      loadNotes();
    }
  }, [isAuthenticated, user?.email, loadNotes]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, [activeTab]: 1 }));
  }, [
    activeTab,
    searchTerm,
    selectedBook,
    dateRange,
    pageRange,
    selectedTag,
    sortBy.personal,
    sortBy.published
  ]);

  const filteredPersonalNotes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = personalNotes.filter((note) => {
      const matchesSearch =
        !search ||
        [note.noteText, note.selectedText, note.bookTitle, note.bookAuthor]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search));

      if (!matchesSearch) return false;

      if (selectedBook !== 'all' && note.bookId !== selectedBook) {
        return false;
      }

      if (dateRange !== 'all') {
        const days = parseInt(dateRange, 10);
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - days);
        const date = new Date(note.updatedAt || note.createdAt || Date.now());
        if (date < threshold) {
          return false;
        }
      }

      if (pageRange !== 'all') {
        if (!matchesPageFilter(note.pageNumber, pageRange)) {
          return false;
        }
      }

      if (selectedTag !== 'all') {
        const tags = Array.isArray(note.tags) ? note.tags : [];
        if (!tags.some((tag) => tag?.toLowerCase() === selectedTag.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    const sortKey = sortBy.personal;
    return filtered.sort((a, b) => {
      if (sortKey === 'newest') {
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      }
      if (sortKey === 'oldest') {
        return new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt);
      }
      if (sortKey === 'book') {
        return (a.bookTitle || '').localeCompare(b.bookTitle || '', 'ru');
      }
      if (sortKey === 'length') {
        return (b.noteText || '').length - (a.noteText || '').length;
      }
      return 0;
    });
  }, [personalNotes, searchTerm, selectedBook, dateRange, pageRange, selectedTag, sortBy.personal]);

  const filteredPublishedNotes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = publishedNotes.filter((note) => {
      const matchesSearch =
        !search ||
        [note.noteText, note.selectedText, note.bookTitle, note.bookAuthor]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search));

      if (!matchesSearch) return false;

      if (selectedBook !== 'all' && note.bookId !== selectedBook) {
        return false;
      }

      if (dateRange !== 'all') {
        const days = parseInt(dateRange, 10);
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - days);
        const date = new Date(note.updatedAt || note.createdAt || Date.now());
        if (date < threshold) {
          return false;
        }
      }

      if (pageRange !== 'all') {
        if (!matchesPageFilter(note.pageNumber, pageRange)) {
          return false;
        }
      }

      if (selectedTag !== 'all') {
        const tags = Array.isArray(note.tags) ? note.tags : [];
        if (!tags.some((tag) => tag?.toLowerCase() === selectedTag.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    const sortKey = sortBy.published;
    return filtered.sort((a, b) => {
      if (sortKey === 'newest') {
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      }
      if (sortKey === 'oldest') {
        return new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt);
      }
      if (sortKey === 'book') {
        return (a.bookTitle || '').localeCompare(b.bookTitle || '', 'ru');
      }
      if (sortKey === 'likes') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      return 0;
    });
  }, [publishedNotes, searchTerm, selectedBook, dateRange, pageRange, selectedTag, sortBy.published]);

  const paginatedPersonalNotes = useMemo(() => {
    const start = (pagination.personal - 1) * PAGE_SIZE;
    return filteredPersonalNotes.slice(start, start + PAGE_SIZE);
  }, [filteredPersonalNotes, pagination.personal]);

  const paginatedPublishedNotes = useMemo(() => {
    const start = (pagination.published - 1) * PAGE_SIZE;
    return filteredPublishedNotes.slice(start, start + PAGE_SIZE);
  }, [filteredPublishedNotes, pagination.published]);

  const totalPersonalPages = Math.max(1, Math.ceil(filteredPersonalNotes.length / PAGE_SIZE));
  const totalPublishedPages = Math.max(1, Math.ceil(filteredPublishedNotes.length / PAGE_SIZE));

  const availableBooks = useMemo(() => {
    const map = new Map();
    [...personalNotes, ...publishedNotes].forEach((note) => {
      if (note.bookId) {
        map.set(note.bookId, note.bookTitle || 'Без названия');
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], 'ru'));
  }, [personalNotes, publishedNotes]);

  const availableTags = useMemo(() => {
    const tags = new Set();
    [...personalNotes, ...publishedNotes].forEach((note) => {
      (note.tags || []).forEach((tag) => {
        if (tag) {
          tags.add(tag);
        }
      });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [personalNotes, publishedNotes]);

  const totalNotesCount = personalNotes.length + publishedNotes.length;
  const notesMenuCounts = useMemo(
    () => ({
      notes: totalNotesCount
    }),
    [totalNotesCount]
  );

  const resetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedBook('all');
    setDateRange('all');
    setPageRange('all');
    setSelectedTag('all');
    setSortBy({ personal: 'newest', published: 'newest' });
    setPagination({ personal: 1, published: 1 });
  };

  const handleDelete = async (note) => {
    if (!note?.userBookDataId) return;
    if (!window.confirm('Удалить заметку без возможности восстановления?')) {
      return;
    }

    updateLoadingState('delete', note.id, true);

    try {
      const record = userBookRecords[note.userBookDataId];
      if (!record) throw new Error('Запись заметок не найдена');

      const notesArray = Array.isArray(record.notes) ? [...record.notes] : [];
      notesArray.splice(note.noteIndex, 1);

      if (!isDemoMode && isSupabaseConfigured) {
        await UserBookData.update(record.id, { notes: notesArray });
      }

      setUserBookRecords((prev) => ({
        ...prev,
        [record.id]: { ...record, notes: notesArray }
      }));

      setPersonalNotes((prev) => prev.filter((item) => item.id !== note.id));
      toast.success('Заметка удалена');
    } catch (error) {
      console.error('[MyNotes] Failed to delete note', error);
      toast.error('Не удалось удалить заметку');
    } finally {
      updateLoadingState('delete', note.id, false);
    }
  };

  const handleEdit = (note) => {
    setEditDialogNote(note);
    setEditText(note.noteText || '');
  };

  const handleSaveEdit = async () => {
    if (!editDialogNote) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      toast.error('Текст заметки не может быть пустым');
      return;
    }

    updateLoadingState('edit', editDialogNote.id, true);

    try {
      const record = userBookRecords[editDialogNote.userBookDataId];
      if (!record) throw new Error('Запись заметок не найдена');

      const notesArray = Array.isArray(record.notes) ? [...record.notes] : [];
      if (!notesArray[editDialogNote.noteIndex]) {
        throw new Error('Не удалось найти заметку в записи');
      }

      const updatedNote = {
        ...notesArray[editDialogNote.noteIndex],
        note_text: trimmed,
        updated_at: new Date().toISOString()
      };
      notesArray.splice(editDialogNote.noteIndex, 1, updatedNote);

      if (!isDemoMode && isSupabaseConfigured) {
        await UserBookData.update(record.id, { notes: notesArray });
      }

      setUserBookRecords((prev) => ({
        ...prev,
        [record.id]: { ...record, notes: notesArray }
      }));

      setPersonalNotes((prev) =>
        prev.map((item) =>
          item.id === editDialogNote.id
            ? { ...item, noteText: trimmed, updatedAt: updatedNote.updated_at }
            : item
        )
      );

      toast.success('Заметка обновлена');
      setEditDialogNote(null);
    } catch (error) {
      console.error('[MyNotes] Failed to edit note', error);
      toast.error('Не удалось обновить заметку');
    } finally {
      updateLoadingState('edit', editDialogNote.id, false);
    }
  };

  const openPublishDialog = (note) => {
    setPublishDialogNote(note);
    setAllowComments(true);
  };

  const handlePublish = async () => {
    if (!publishDialogNote) return;
    const textToCheck = (publishDialogNote.noteText || publishDialogNote.selectedText || '').trim();
    if (textToCheck.length < 10) {
      toast.error('Для публикации заметка должна содержать минимум 10 символов.');
      return;
    }

    updateLoadingState('publish', publishDialogNote.id, true);

    try {
      const payload = {
        user_email: user.email,
        user_id: user.id,
        user_name: user.full_name || user.email,
        book_id: publishDialogNote.bookId,
        book_title: publishDialogNote.bookTitle,
        book_author: publishDialogNote.bookAuthor,
        note_text: publishDialogNote.noteText,
        selected_text: publishDialogNote.selectedText,
        highlight_color: publishDialogNote.highlightColor,
        page_number: publishDialogNote.pageNumber,
        is_public: true,
        likes_count: 0,
        metadata: {
          source: 'user_book_data',
          user_book_data_id: publishDialogNote.userBookDataId,
          private_note_id: publishDialogNote.originalNoteId || publishDialogNote.id,
          allow_comments: allowComments
        }
      };

      let createdNote = null;

      if (!isDemoMode && isSupabaseConfigured) {
        createdNote = await SharedNote.create(payload);
      } else {
        createdNote = {
          id: `demo-shared-${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: payload.metadata,
          tags: publishDialogNote.tags || []
        };
      }

      const mapped = formatPublishedNote(
        {
          ...createdNote,
          tags: publishDialogNote.tags || [],
          likes_count: createdNote?.likes_count ?? 0
        },
        bookMap
      );

      setPublishedNotes((prev) => [mapped, ...prev]);
      toast.success('Заметка опубликована');
      setPublishDialogNote(null);
    } catch (error) {
      console.error('[MyNotes] Failed to publish note', error);
      toast.error('Не удалось опубликовать заметку');
    } finally {
      updateLoadingState('publish', publishDialogNote.id, false);
    }
  };

  const handleUnpublish = async (note) => {
    if (!window.confirm('Снять заметку с публикации?')) {
      return;
    }

    updateLoadingState('unpublish', note.id, true);

    try {
      if (!isDemoMode && isSupabaseConfigured) {
        await SharedNote.update(note.id, { is_public: false });
      }

      setPublishedNotes((prev) => prev.filter((item) => item.id !== note.id));
      setLikedNotes((prev) => {
        const next = new Set(prev);
        next.delete(note.id);
        return next;
      });
      toast.success('Заметка скрыта');
    } catch (error) {
      console.error('[MyNotes] Failed to unpublish note', error);
      toast.error('Не удалось снять заметку с публикации');
    } finally {
      updateLoadingState('unpublish', note.id, false);
    }
  };

  const handleToggleLike = async (note) => {
    if (!isAuthenticated) {
      toast.info('Войдите, чтобы ставить лайки.');
      return;
    }

    const alreadyLiked = likedNotes.has(note.id);
    updateLoadingState('like', note.id, true);

    try {
      if (!isDemoMode && isSupabaseConfigured) {
        if (alreadyLiked) {
          const existing = await NoteLike.filter({
            user_email: user.email,
            shared_note_id: note.id
          });
          if (existing.length > 0) {
            await NoteLike.delete(existing[0].id);
          }
        } else {
          await NoteLike.create({
            user_email: user.email,
            shared_note_id: note.id
          });
        }
      }

      setLikedNotes((prev) => {
        const next = new Set(prev);
        if (alreadyLiked) {
          next.delete(note.id);
        } else {
          next.add(note.id);
        }
        return next;
      });

      setPublishedNotes((prev) =>
        prev.map((item) =>
          item.id === note.id
            ? {
                ...item,
                likesCount: Math.max(0, (item.likesCount || 0) + (alreadyLiked ? -1 : 1))
              }
            : item
        )
      );
    } catch (error) {
      console.error('[MyNotes] Failed to toggle like', error);
      toast.error('Не удалось изменить лайк');
    } finally {
      updateLoadingState('like', note.id, false);
    }
  };

  if (authLoading || (isAuthenticated && isLoading && personalNotes.length === 0 && publishedNotes.length === 0)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border/80 py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="mb-2 h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4">
          <LibraryMenu activeKey="notes" counts={notesMenuCounts} onSelect={handleLibraryMenuSelect} />
        </div>
        <div className="container mx-auto px-4 py-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-border/60">
                <CardContent className="space-y-4 p-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-10 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border/80 py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold text-foreground">Мои заметки</h1>
            <p className="mt-1 text-muted-foreground">
              Собирайте мысли по книгам и делитесь ими с другими читателями.
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4">
          <LibraryMenu activeKey="notes" counts={notesMenuCounts} onSelect={handleLibraryMenuSelect} />
        </div>
        <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-16 text-center">
          <Heart className="h-12 w-12 text-muted-foreground" />
          <div className="max-w-lg space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Войдите, чтобы увидеть свои заметки</h2>
            <p className="text-muted-foreground">
              В личном кабинете будут храниться все ваши заметки: личные черновики и опубликованные записи с лайками.
            </p>
          </div>
          <Button size="lg" onClick={() => (window.location.href = createPageUrl('Profile'))}>
            Войти
          </Button>
        </div>
      </div>
    );
  }

  const renderPagination = (currentPage, totalPages, key) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault();
                setPagination((prev) => ({ ...prev, [key]: Math.max(1, currentPage - 1) }));
              }}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(event) => {
                  event.preventDefault();
                  setPagination((prev) => ({ ...prev, [key]: page }));
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
                setPagination((prev) => ({ ...prev, [key]: Math.min(totalPages, currentPage + 1) }));
              }}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border/80 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Мои заметки</h1>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Управляйте личными заметками, публикуйте лучшие и следите за реакцией читателей.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isDemoMode && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-100/60 dark:text-amber-200">
                  Демо-данные без подключения к базе
                </Badge>
              )}
              <Button
                variant="ghost"
                className="gap-2"
                onClick={loadNotes}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Обновить
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <LibraryMenu
          activeKey="notes"
          onSelect={handleLibraryMenuSelect}
          counts={notesMenuCounts}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full max-w-xl justify-start bg-muted/40">
            <TabsTrigger value="personal" className="flex flex-1 items-center justify-center gap-2">
              <span className="font-semibold">Личные</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {personalNotes.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="published" className="flex flex-1 items-center justify-center gap-2">
              <span className="font-semibold">Опубликованные</span>
              <Badge variant="secondary" className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200">
                {publishedNotes.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative flex-1 md:col-span-2 lg:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Поиск по тексту и книгам"
                  className="pl-9"
                  aria-label="Поиск по заметкам"
                />
              </div>

              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger className="w-full" aria-label="Фильтр по книге">
                  <SelectValue placeholder="Все книги" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все книги</SelectItem>
                  {availableBooks.map(([id, title]) => (
                    <SelectItem key={id} value={id}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full" aria-label="Фильтр по дате">
                  <SelectValue placeholder="За всё время" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">За всё время</SelectItem>
                  <SelectItem value="7">Последние 7 дней</SelectItem>
                  <SelectItem value="30">Последние 30 дней</SelectItem>
                  <SelectItem value="90">Последние 90 дней</SelectItem>
                </SelectContent>
              </Select>

              <Select value={pageRange} onValueChange={setPageRange}>
                <SelectTrigger className="w-full" aria-label="Фильтр по страницам">
                  <SelectValue placeholder="Все страницы" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-full" aria-label="Фильтр по тегам">
                  <SelectValue placeholder="Все теги" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все теги</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>
                  Найдено{' '}
                  <span className="font-semibold text-foreground">
                    {activeTab === 'personal' ? filteredPersonalNotes.length : filteredPublishedNotes.length}
                  </span>{' '}
                  заметок
                </span>
                {(searchTerm || selectedBook !== 'all' || dateRange !== 'all' || pageRange !== 'all' || selectedTag !== 'all') && (
                  <Button variant="link" className="text-xs" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={sortBy[activeTab]}
                  onValueChange={(value) => setSortBy((prev) => ({ ...prev, [activeTab]: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Сначала новые</SelectItem>
                    <SelectItem value="oldest">Сначала старые</SelectItem>
                    <SelectItem value="book">По книге</SelectItem>
                    {activeTab === 'personal' ? (
                      <SelectItem value="length">По длине</SelectItem>
                    ) : (
                      <SelectItem value="likes">По лайкам</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <TabsContent value="personal" forceMount className="mt-6 space-y-8">
            {loadError && (
              <Card className="border-destructive/40 bg-destructive/10">
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex items-center gap-3 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-semibold">Не удалось загрузить заметки.</p>
                  </div>
                  <Button variant="outline" onClick={loadNotes} className="self-start">
                    Повторить
                  </Button>
                </CardContent>
              </Card>
            )}

            {paginatedPersonalNotes.length === 0 && !isLoading ? (
              <Card className="border-dashed border-border/70 bg-card/70">
                <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">У вас пока нет заметок.</h3>
                    <p className="text-sm text-muted-foreground">
                      Начните читать книгу и добавляйте мысли по ходу чтения.
                    </p>
                  </div>
                  <Button onClick={() => (window.location.href = createPageUrl('Library'))}>
                    Перейти в Мои книги
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedPersonalNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      variant="personal"
                      onPublish={openPublishDialog}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      highlightTerm={searchTerm}
                      isPublishing={loadingStates.publish.has(note.id)}
                      isEditing={loadingStates.edit.has(note.id)}
                      isDeleting={loadingStates.delete.has(note.id)}
                    />
                  ))}
                </div>
                {renderPagination(pagination.personal, totalPersonalPages, 'personal')}
              </>
            )}
          </TabsContent>

          <TabsContent value="published" forceMount className="mt-6 space-y-8">
            {paginatedPublishedNotes.length === 0 && !isLoading ? (
              <Card className="border-dashed border-border/70 bg-card/70">
                <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">Вы ещё не публиковали заметки</h3>
                    <p className="text-sm text-muted-foreground">
                      Публикуйте лучшие мысли — они появятся в общей ленте и смогут собрать лайки.
                    </p>
                  </div>
                  <Button onClick={() => handleTabChange('personal')}>Открыть личные заметки</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedPublishedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      variant="published"
                      onLikeToggle={handleToggleLike}
                      onUnpublish={handleUnpublish}
                      highlightTerm={searchTerm}
                      isLiked={likedNotes.has(note.id)}
                      isLiking={loadingStates.like.has(note.id)}
                      isUnpublishing={loadingStates.unpublish.has(note.id)}
                    />
                  ))}
                </div>
                {renderPagination(pagination.published, totalPublishedPages, 'published')}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(publishDialogNote)} onOpenChange={(open) => !open && setPublishDialogNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Публикация заметки</DialogTitle>
            <DialogDescription>
              Заметка станет доступна всем читателям. Проверьте текст и решите, разрешить ли комментарии.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-muted/40 p-4 text-sm text-muted-foreground">
              {publishDialogNote?.noteText || publishDialogNote?.selectedText}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card/70 p-4">
              <div>
                <Label htmlFor="allow-comments" className="font-semibold text-foreground">
                  Разрешить комментарии
                </Label>
                <p className="text-xs text-muted-foreground">Другие читатели смогут обсуждать заметку.</p>
              </div>
              <Switch
                id="allow-comments"
                checked={allowComments}
                onCheckedChange={setAllowComments}
                aria-label="Разрешить комментарии"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPublishDialogNote(null)}>
              Отмена
            </Button>
            <Button
              onClick={handlePublish}
              disabled={loadingStates.publish.has(publishDialogNote?.id)}
            >
              {loadingStates.publish.has(publishDialogNote?.id) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Опубликовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editDialogNote)} onOpenChange={(open) => !open && setEditDialogNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование заметки</DialogTitle>
            <DialogDescription>
              Обновите текст заметки. Изменения сохранятся только в личном разделе.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            rows={6}
            className="text-sm"
            aria-label="Текст заметки"
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogNote(null)}>
              Отмена
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={loadingStates.edit.has(editDialogNote?.id)}
            >
              {loadingStates.edit.has(editDialogNote?.id) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyNotes;

