import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/Auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink
} from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SharedNote, NoteLike, UserBookData, Book } from '@/api/entities';
import PersonalNoteCard from '@/components/notes/PersonalNoteCard';
import PublishedNoteCard from '@/components/notes/PublishedNoteCard';
import { toast } from 'sonner';
import { Filter, Loader2, NotebookPen, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const PAGE_SIZE = 6;

const dateThreshold = (range) => {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '365d':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

const getTextLengthBucket = (length) => {
  if (length < 120) return 'short';
  if (length < 320) return 'medium';
  return 'long';
};

const PlaceholderCover = 'https://placehold.co/80x120/EEE/312244?text=Book';

export default function MyNotes() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [activeTab, setActiveTab] = useState('personal');
  const [searchQuery, setSearchQuery] = useState('');

  const [personalFilters, setPersonalFilters] = useState({
    book: 'all',
    date: 'all',
    length: 'all',
    sort: 'newest'
  });
  const [publishedFilters, setPublishedFilters] = useState({
    book: 'all',
    date: 'all',
    length: 'all',
    sort: 'newest'
  });

  const [personalState, setPersonalState] = useState({ data: [], loading: true, error: null });
  const [publishedState, setPublishedState] = useState({ data: [], loading: true, error: null });
  const [userBookNotesMap, setUserBookNotesMap] = useState({});
  const [likedNotes, setLikedNotes] = useState(new Set());

  const [personalPage, setPersonalPage] = useState(1);
  const [publishedPage, setPublishedPage] = useState(1);

  const [publishDialogNote, setPublishDialogNote] = useState(null);
  const [publishSettings, setPublishSettings] = useState({ visibility: 'public', allowComments: true });
  const [isPublishing, setIsPublishing] = useState(false);

  const [editDialogNote, setEditDialogNote] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [noteToUnpublish, setNoteToUnpublish] = useState(null);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const loadPersonalNotes = useCallback(async () => {
    if (!user?.email) return;

    setPersonalState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const userBookData = await UserBookData.filter({ user_email: user.email });
      if (!Array.isArray(userBookData) || userBookData.length === 0) {
        setPersonalState({ data: [], loading: false, error: null });
        setUserBookNotesMap({});
        return;
      }

      const bookIds = [...new Set(userBookData.map(record => record.book_id).filter(Boolean))];
      let books = [];
      if (bookIds.length > 0) {
        try {
          books = await Book.filter({ id: { '$in': bookIds } });
        } catch (error) {
          console.warn('[MyNotes] Failed to load books for notes', error);
        }
      }
      const bookMap = new Map((books || []).map(book => [book.id, book]));

      const flattened = [];
      const map = {};

      userBookData.forEach(record => {
        const notes = Array.isArray(record.notes) ? record.notes : [];
        map[record.id] = { ...record, notes };

        const book = bookMap.get(record.book_id) || null;
        const bookTitle = book?.title || record.book_title || 'Без названия';
        const bookAuthor = book?.author || record.book_author || '';
        const bookCover = book?.cover_url || record.book_cover || PlaceholderCover;

        notes.forEach(note => {
          flattened.push({
            id: note.id,
            noteText: note.note_text || '',
            selectedText: note.selected_text || '',
            pageNumber: note.page_number,
            highlightColor: note.highlight_color || 'yellow',
            createdAt: note.created_at || record.created_at,
            updatedAt: note.updated_at || record.updated_at,
            userBookDataId: record.id,
            bookId: record.book_id || book?.id || bookTitle,
            bookTitle,
            bookAuthor,
            bookCover
          });
        });
      });

      flattened.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setPersonalState({ data: flattened, loading: false, error: null });
      setUserBookNotesMap(map);
    } catch (error) {
      console.error('[MyNotes] Failed to load personal notes', error);
      setPersonalState({ data: [], loading: false, error: error.message || 'Не удалось загрузить заметки' });
    }
  }, [user?.email]);

  const loadPublishedNotes = useCallback(async () => {
    if (!user?.email) return;

    setPublishedState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const sharedNotes = await SharedNote.filter({ user_email: user.email }, '-created_at');
      setPublishedState({ data: sharedNotes, loading: false, error: null });

      if (sharedNotes.length > 0) {
        try {
          const likeRecords = await NoteLike.filter({
            user_email: user.email,
            shared_note_id: { '$in': sharedNotes.map(note => note.id) }
          });
          setLikedNotes(new Set(likeRecords.map(item => item.shared_note_id)));
        } catch (error) {
          console.warn('[MyNotes] Failed to load liked notes', error);
          setLikedNotes(new Set());
        }
      } else {
        setLikedNotes(new Set());
      }
    } catch (error) {
      console.error('[MyNotes] Failed to load published notes', error);
      setPublishedState({ data: [], loading: false, error: error.message || 'Не удалось загрузить опубликованные заметки' });
    }
  }, [user?.email]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPersonalNotes();
      loadPublishedNotes();
    }
  }, [isAuthenticated, loadPersonalNotes, loadPublishedNotes]);

  useEffect(() => {
    setPersonalPage(1);
  }, [personalFilters, searchQuery, personalState.data.length]);

  useEffect(() => {
    setPublishedPage(1);
  }, [publishedFilters, searchQuery, publishedState.data.length]);

  const filteredPersonalNotes = useMemo(() => {
    const { book, date, length, sort } = personalFilters;
    let notes = [...personalState.data];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      notes = notes.filter(note =>
        (note.noteText && note.noteText.toLowerCase().includes(query)) ||
        (note.selectedText && note.selectedText.toLowerCase().includes(query)) ||
        (note.bookTitle && note.bookTitle.toLowerCase().includes(query))
      );
    }

    if (book !== 'all') {
      notes = notes.filter(note => `${note.bookId}` === `${book}`);
    }

    const threshold = dateThreshold(date);
    if (threshold) {
      notes = notes.filter(note => new Date(note.createdAt || 0) >= threshold);
    }

    if (length !== 'all') {
      notes = notes.filter(note => {
        const textLength = (note.noteText || note.selectedText || '').length;
        return getTextLengthBucket(textLength) === length;
      });
    }

    switch (sort) {
      case 'oldest':
        notes.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'book':
        notes.sort((a, b) => (a.bookTitle || '').localeCompare(b.bookTitle || ''));
        break;
      default:
        notes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return notes;
  }, [personalFilters, personalState.data, searchQuery]);

  const filteredPublishedNotes = useMemo(() => {
    const { book, date, length, sort } = publishedFilters;
    let notes = [...publishedState.data];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      notes = notes.filter(note =>
        (note.note_text && note.note_text.toLowerCase().includes(query)) ||
        (note.selected_text && note.selected_text.toLowerCase().includes(query)) ||
        (note.book_title && note.book_title.toLowerCase().includes(query))
      );
    }

    if (book !== 'all') {
      notes = notes.filter(note => `${note.book_id || note.book_title}` === `${book}`);
    }

    const threshold = dateThreshold(date);
    if (threshold) {
      notes = notes.filter(note => new Date(note.created_at || 0) >= threshold);
    }

    if (length !== 'all') {
      notes = notes.filter(note => {
        const textLength = (note.note_text || note.selected_text || '').length;
        return getTextLengthBucket(textLength) === length;
      });
    }

    switch (sort) {
      case 'oldest':
        notes.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        break;
      case 'book':
        notes.sort((a, b) => (a.book_title || '').localeCompare(b.book_title || ''));
        break;
      case 'likes':
        notes.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      default:
        notes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return notes;
  }, [publishedFilters, publishedState.data, searchQuery]);

  const personalPageCount = Math.max(1, Math.ceil(filteredPersonalNotes.length / PAGE_SIZE));
  const publishedPageCount = Math.max(1, Math.ceil(filteredPublishedNotes.length / PAGE_SIZE));

  const personalPageItems = filteredPersonalNotes.slice((personalPage - 1) * PAGE_SIZE, personalPage * PAGE_SIZE);
  const publishedPageItems = filteredPublishedNotes.slice((publishedPage - 1) * PAGE_SIZE, publishedPage * PAGE_SIZE);

  const personalBookOptions = useMemo(() => {
    const map = new Map();
    personalState.data.forEach(note => {
      if (!map.has(note.bookId)) {
        map.set(note.bookId, note.bookTitle || 'Без названия');
      }
    });
    return Array.from(map.entries());
  }, [personalState.data]);

  const publishedBookOptions = useMemo(() => {
    const map = new Map();
    publishedState.data.forEach(note => {
      const key = note.book_id || note.book_title;
      if (!map.has(key)) {
        map.set(key, note.book_title || 'Без названия');
      }
    });
    return Array.from(map.entries());
  }, [publishedState.data]);

  const handleOpenPublishDialog = (note) => {
    setPublishDialogNote(note);
    setPublishSettings({ visibility: 'public', allowComments: true });
  };

  const handleConfirmPublish = async () => {
    if (!publishDialogNote || !user?.email) return;

    const text = (publishDialogNote.noteText || publishDialogNote.selectedText || '').trim();
    if (!text || text.length < 10) {
      toast.error('Заметка слишком короткая для публикации (минимум 10 символов).');
      return;
    }

    setIsPublishing(true);
    try {
      const payload = {
        user_email: user.email,
        user_name: user.full_name || user.email,
        book_id: publishDialogNote.bookId,
        book_title: publishDialogNote.bookTitle,
        book_author: publishDialogNote.bookAuthor,
        book_cover: publishDialogNote.bookCover,
        note_text: publishDialogNote.noteText,
        selected_text: publishDialogNote.selectedText,
        highlight_color: publishDialogNote.highlightColor,
        page_number: publishDialogNote.pageNumber,
        likes_count: 0,
        visibility: publishSettings.visibility,
        allow_comments: publishSettings.allowComments
      };

      const created = await SharedNote.create(payload);
      if (created) {
        setPublishedState(prev => ({ ...prev, data: [created, ...prev.data] }));
        toast.success('Заметка опубликована!');
        setPublishDialogNote(null);
        setActiveTab('published');
      }
    } catch (error) {
      console.error('[MyNotes] Failed to publish note', error);
      toast.error('Не удалось опубликовать заметку.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStartEdit = (note) => {
    setEditDialogNote(note);
    setEditText(note.noteText || '');
  };

  const handleSaveEdit = async () => {
    if (!editDialogNote) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      toast.error('Текст заметки не может быть пустым.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const mapEntry = userBookNotesMap[editDialogNote.userBookDataId];
      if (!mapEntry) {
        throw new Error('Не удалось найти исходную запись заметки.');
      }

      const now = new Date().toISOString();
      const updatedNotes = (mapEntry.notes || []).map(item =>
        item.id === editDialogNote.id
          ? { ...item, note_text: trimmed, updated_at: now }
          : item
      );

      await UserBookData.update(mapEntry.id || editDialogNote.userBookDataId, { notes: updatedNotes });

      setUserBookNotesMap(prev => ({
        ...prev,
        [editDialogNote.userBookDataId]: { ...mapEntry, notes: updatedNotes }
      }));

      setPersonalState(prev => ({
        ...prev,
        data: prev.data.map(item =>
          item.id === editDialogNote.id
            ? { ...item, noteText: trimmed, updatedAt: now }
            : item
        )
      }));

      toast.success('Заметка обновлена');
      setEditDialogNote(null);
    } catch (error) {
      console.error('[MyNotes] Failed to update note', error);
      toast.error('Не удалось сохранить изменения.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      const mapEntry = userBookNotesMap[noteToDelete.userBookDataId];
      if (!mapEntry) {
        throw new Error('Исходная запись не найдена');
      }

      const updatedNotes = (mapEntry.notes || []).filter(item => item.id !== noteToDelete.id);
      await UserBookData.update(mapEntry.id || noteToDelete.userBookDataId, { notes: updatedNotes });

      setUserBookNotesMap(prev => ({
        ...prev,
        [noteToDelete.userBookDataId]: { ...mapEntry, notes: updatedNotes }
      }));

      setPersonalState(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== noteToDelete.id)
      }));

      toast.success('Заметка удалена');
      setNoteToDelete(null);
    } catch (error) {
      console.error('[MyNotes] Failed to delete note', error);
      toast.error('Не удалось удалить заметку.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleLike = async (note) => {
    if (!isAuthenticated || !user?.email) {
      toast.error('Войдите, чтобы поставить лайк.');
      return;
    }

    const noteId = note.id;
    const currentlyLiked = likedNotes.has(noteId);

    try {
      if (currentlyLiked) {
        setLikedNotes(prev => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
        setPublishedState(prev => ({
          ...prev,
          data: prev.data.map(item =>
            item.id === noteId
              ? { ...item, likes_count: Math.max(0, (item.likes_count || 0) - 1) }
              : item
          )
        }));

        const existingLike = await NoteLike.filter({
          user_email: user.email,
          shared_note_id: noteId
        });
        if (existingLike.length > 0) {
          await NoteLike.delete(existingLike[0].id);
        }
      } else {
        setLikedNotes(prev => {
          const next = new Set(prev);
          next.add(noteId);
          return next;
        });
        setPublishedState(prev => ({
          ...prev,
          data: prev.data.map(item =>
            item.id === noteId
              ? { ...item, likes_count: (item.likes_count || 0) + 1 }
              : item
          )
        }));
        await NoteLike.create({ user_email: user.email, shared_note_id: noteId });
      }
    } catch (error) {
      console.error('[MyNotes] Failed to toggle like', error);
      toast.error('Не удалось обновить лайк.');
      loadPublishedNotes();
    }
  };

  const handleShareNote = async (note) => {
    const shareUrl = `${window.location.origin}${createPageUrl('NotesFeed')}?note=${note.id}`;
    const shareText = note.note_text || note.selected_text || '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: note.book_title || 'Заметка читателя',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('[MyNotes] Failed to share note', error);
          toast.error('Не удалось поделиться заметкой.');
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Ссылка на заметку скопирована.');
    } catch (error) {
      console.error('[MyNotes] Failed to copy note link', error);
      toast.error('Не удалось скопировать ссылку.');
    }
  };

  const handleConfirmUnpublish = async () => {
    if (!noteToUnpublish) return;
    setIsUnpublishing(true);
    try {
      await SharedNote.delete(noteToUnpublish.id);
      setPublishedState(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== noteToUnpublish.id)
      }));
      setLikedNotes(prev => {
        const next = new Set(prev);
        next.delete(noteToUnpublish.id);
        return next;
      });
      toast.success('Заметка снята с публикации.');
      setNoteToUnpublish(null);
    } catch (error) {
      console.error('[MyNotes] Failed to unpublish note', error);
      toast.error('Не удалось снять заметку с публикации.');
    } finally {
      setIsUnpublishing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">Мои заметки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Войдите в аккаунт, чтобы просматривать и управлять своими заметками.
            </p>
            <Button asChild>
              <Link to={createPageUrl('Profile')}>Войти в профиль</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderSkeletons = () => (
    <div className="grid gap-6 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={`skeleton-${index}`} className="overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="w-14 h-20 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = (type) => (
    <Card className="border-dashed">
      <CardContent className="py-16 flex flex-col items-center justify-center gap-4 text-center">
        <Sparkles className="w-12 h-12 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">
            {type === 'personal' ? 'Вы ещё не создавали заметки' : 'Нет опубликованных заметок'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {type === 'personal'
              ? 'Оставляйте заметки в книгах, чтобы они появились здесь.'
              : 'Опубликуйте личные заметки, чтобы делиться ими с другими читателями.'}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="secondary">
            <Link to={createPageUrl('Library')}>Открыть библиотеку</Link>
          </Button>
          {type === 'personal' && (
            <Button asChild>
              <Link to={createPageUrl('Reader')}>Продолжить чтение</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderPagination = (page, pageCount, onChange) => {
    if (pageCount <= 1) return null;

    const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          {pages.map(number => (
            <PaginationItem key={`page-${number}`}>
              <PaginationLink
                href="#"
                isActive={number === page}
                onClick={(event) => {
                  event.preventDefault();
                  onChange(number);
                }}
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          ))}
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1 text-sm font-medium">
                <NotebookPen className="w-4 h-4" />
                Личный архив читателя
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Мои заметки</h1>
                <p className="text-muted-foreground max-w-2xl">
                  Управляйте личными заметками, публикуйте лучшие мысли и следите за реакцией читателей.
                </p>
              </div>
            </div>
            <div className="w-full lg:w-96">
              <label className="sr-only" htmlFor="notes-search">Поиск по заметкам</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="notes-search"
                  placeholder="Поиск по тексту заметки или названию книги"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full lg:w-auto">
              <TabsTrigger value="personal" className="gap-2">
                <span className="font-medium">Личные</span>
                <Badge variant="secondary" className="ml-1">
                  {personalState.data.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="published" className="gap-2">
                <span className="font-medium">Опубликованные</span>
                <Badge variant="secondary" className="ml-1">
                  {publishedState.data.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <section className="mt-6 grid gap-6">
              <Card className="border-border/60">
                <CardContent className="p-4 lg:p-6">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs uppercase text-muted-foreground">Книга</Label>
                      <Select
                        value={activeTab === 'personal' ? personalFilters.book : publishedFilters.book}
                        onValueChange={(value) => {
                          if (activeTab === 'personal') {
                            setPersonalFilters(prev => ({ ...prev, book: value }));
                          } else {
                            setPublishedFilters(prev => ({ ...prev, book: value }));
                          }
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Все книги" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все книги</SelectItem>
                          {(activeTab === 'personal' ? personalBookOptions : publishedBookOptions).map(([value, label]) => (
                            <SelectItem key={value} value={`${value}`}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs uppercase text-muted-foreground">Период</Label>
                      <Select
                        value={activeTab === 'personal' ? personalFilters.date : publishedFilters.date}
                        onValueChange={(value) => {
                          if (activeTab === 'personal') {
                            setPersonalFilters(prev => ({ ...prev, date: value }));
                          } else {
                            setPublishedFilters(prev => ({ ...prev, date: value }));
                          }
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="За всё время" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">За всё время</SelectItem>
                          <SelectItem value="7d">За неделю</SelectItem>
                          <SelectItem value="30d">За месяц</SelectItem>
                          <SelectItem value="365d">За год</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs uppercase text-muted-foreground">Объём</Label>
                      <Select
                        value={activeTab === 'personal' ? personalFilters.length : publishedFilters.length}
                        onValueChange={(value) => {
                          if (activeTab === 'personal') {
                            setPersonalFilters(prev => ({ ...prev, length: value }));
                          } else {
                            setPublishedFilters(prev => ({ ...prev, length: value }));
                          }
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Любая длина" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Любая длина</SelectItem>
                          <SelectItem value="short">Короткие</SelectItem>
                          <SelectItem value="medium">Средние</SelectItem>
                          <SelectItem value="long">Длинные</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs uppercase text-muted-foreground">Сортировка</Label>
                      <Select
                        value={activeTab === 'personal' ? personalFilters.sort : publishedFilters.sort}
                        onValueChange={(value) => {
                          if (activeTab === 'personal') {
                            setPersonalFilters(prev => ({ ...prev, sort: value }));
                          } else {
                            setPublishedFilters(prev => ({ ...prev, sort: value }));
                          }
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="По новизне" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Сначала новые</SelectItem>
                          <SelectItem value="oldest">Сначала старые</SelectItem>
                          <SelectItem value="book">По книге</SelectItem>
                          {activeTab === 'published' && <SelectItem value="likes">По лайкам</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {activeTab === 'personal' && personalState.error && (
                <Alert variant="destructive">
                  <Filter className="w-4 h-4" />
                  <AlertTitle>Ошибка загрузки заметок</AlertTitle>
                  <AlertDescription>{personalState.error}</AlertDescription>
                </Alert>
              )}

              {activeTab === 'published' && publishedState.error && (
                <Alert variant="destructive">
                  <Filter className="w-4 h-4" />
                  <AlertTitle>Ошибка загрузки публикаций</AlertTitle>
                  <AlertDescription>{publishedState.error}</AlertDescription>
                </Alert>
              )}

              {activeTab === 'personal' ? (
                <div>
                  {personalState.loading ? (
                    renderSkeletons()
                  ) : personalPageItems.length === 0 ? (
                    renderEmptyState('personal')
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {personalPageItems.map(note => (
                        <PersonalNoteCard
                          key={note.id}
                          note={note}
                          searchQuery={searchQuery}
                          onPublish={handleOpenPublishDialog}
                          onEdit={handleStartEdit}
                          onDelete={setNoteToDelete}
                        />
                      ))}
                    </div>
                  )}
                  {renderPagination(personalPage, personalPageCount, setPersonalPage)}
                </div>
              ) : (
                <div>
                  {publishedState.loading ? (
                    renderSkeletons()
                  ) : publishedPageItems.length === 0 ? (
                    renderEmptyState('published')
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {publishedPageItems.map(note => (
                        <PublishedNoteCard
                          key={note.id}
                          note={note}
                          searchQuery={searchQuery}
                          isLiked={likedNotes.has(note.id)}
                          onToggleLike={handleToggleLike}
                          onShare={handleShareNote}
                          onUnpublish={setNoteToUnpublish}
                        />
                      ))}
                    </div>
                  )}
                  {renderPagination(publishedPage, publishedPageCount, setPublishedPage)}
                </div>
              )}
            </section>
          </Tabs>
        </div>
      </div>

      <Dialog open={Boolean(publishDialogNote)} onOpenChange={(open) => !open && setPublishDialogNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Опубликовать заметку</DialogTitle>
            <DialogDescription>
              Выберите параметры публикации. После подтверждения заметка появится в ленте читателей.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold">{publishDialogNote?.bookTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {(publishDialogNote?.noteText || publishDialogNote?.selectedText || '').slice(0, 160)}
                  {(publishDialogNote?.noteText || publishDialogNote?.selectedText || '').length > 160 && '…'}
                </p>
              </CardContent>
            </Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="note-visibility">Видимость</Label>
                <Select
                  value={publishSettings.visibility}
                  onValueChange={(value) => setPublishSettings(prev => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger id="note-visibility" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Опубликовано для всех</SelectItem>
                    <SelectItem value="followers">Только подписчики</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium">Разрешить комментарии</Label>
                  <p className="text-xs text-muted-foreground">Читатели смогут оставить отклик на заметку.</p>
                </div>
                <Switch
                  checked={publishSettings.allowComments}
                  onCheckedChange={(checked) => setPublishSettings(prev => ({ ...prev, allowComments: checked }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogNote(null)} disabled={isPublishing}>
              Отмена
            </Button>
            <Button onClick={handleConfirmPublish} disabled={isPublishing}>
              {isPublishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Опубликовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editDialogNote)} onOpenChange={(open) => !open && setEditDialogNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование заметки</DialogTitle>
            <DialogDescription>Измените текст заметки и сохраните обновления.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            rows={6}
            placeholder="Введите обновлённый текст заметки"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogNote(null)} disabled={isSavingEdit}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(noteToDelete)} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заметку?</AlertDialogTitle>
            <AlertDialogDescription>
              Заметка будет удалена из вашего личного архива. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(noteToUnpublish)} onOpenChange={(open) => !open && setNoteToUnpublish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Снять заметку с публикации?</AlertDialogTitle>
            <AlertDialogDescription>
              Она исчезнет из ленты читателей, но сохранится в ваших личных заметках.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnpublishing}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUnpublish} disabled={isUnpublishing} className="bg-destructive hover:bg-destructive/90">
              {isUnpublishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Снять с публикации
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
