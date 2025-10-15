import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth, ProtectedRoute } from '../components/auth/Auth';
import { Book } from '@/api/entities';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, BookOpen, ChevronDown, ChevronUp, Save, Loader2, AlertCircle } from 'lucide-react';
import { updateSubscriptionBooks } from '@/api/functions';
import { isSubscriptionEnabled } from '@/lib/config/flags';
import { useTranslation } from '@/components/i18n/SimpleI18n';

const AuthorSection = ({ author, books, selectedBooks, onBookToggle, onAuthorToggle, expanded, onExpandToggle }) => {
  const isAllSelected = books.every(book => selectedBooks.has(book.id));
  const isPartiallySelected = !isAllSelected && books.some(book => selectedBooks.has(book.id));

  return (
    <Card className="mb-4">
      <CardHeader 
        className="flex flex-row items-center justify-between cursor-pointer p-4"
        onClick={() => onExpandToggle(author)}
      >
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={() => onAuthorToggle(author)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Выбрать все книги автора ${author}`}
            className={isPartiallySelected ? "data-[state=checked]:bg-primary/50" : ""}
          />
          <CardTitle className="text-lg">{author}</CardTitle>
          <span className="text-sm text-muted-foreground">({books.length} книг)</span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </CardHeader>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="p-4 pt-0">
              <div className="space-y-2 pl-8 border-l ml-2">
                {books.map(book => (
                  <div key={book.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedBooks.has(book.id)}
                      onCheckedChange={() => onBookToggle(book.id)}
                    />
                    <label className="text-sm">{book.title}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default function SubscriptionManagement() {
  const { t } = useTranslation();
  if (!isSubscriptionEnabled()) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-10">
          <Card className="mx-auto max-w-2xl text-center">
            <CardHeader>
              <CardTitle>{t('subscription.managementDisabled', 'Управление подпиской временно недоступно')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                {t(
                  'subscription.managementDisabledDescription',
                  'Мы обновляем каталог подписки. Пожалуйста, загляните позже — ничего из ваших настроек не пропадёт.'
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const allBooks = await Book.filter({ status: 'approved' });
        setBooks(allBooks);
        const initialSelected = new Set(allBooks.filter(b => b.is_in_subscription).map(b => b.id));
        setSelectedBooks(initialSelected);
      } catch (error) {
        toast.error('Не удалось загрузить книги');
        console.error(error);
      }
      setIsLoading(false);
    };
    fetchBooks();
  }, []);

  const groupedBooks = useMemo(() => {
    const byAuthor = {};
    const publicDomain = [];
    books.forEach(book => {
      if (book.is_public_domain) {
        publicDomain.push(book);
      } else {
        const author = book.author || 'Без автора';
        if (!byAuthor[author]) {
          byAuthor[author] = [];
        }
        byAuthor[author].push(book);
      }
    });
    return { byAuthor, publicDomain };
  }, [books]);

  const handleBookToggle = useCallback((bookId) => {
    setSelectedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  }, []);

  const handleAuthorToggle = useCallback((author) => {
    const authorBookIds = groupedBooks.byAuthor[author]?.map(b => b.id) || [];
    const allSelected = authorBookIds.every(id => selectedBooks.has(id));
    
    setSelectedBooks(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        authorBookIds.forEach(id => newSet.delete(id));
      } else {
        authorBookIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, [groupedBooks.byAuthor, selectedBooks]);

  const handlePublicDomainToggle = useCallback(() => {
    const publicDomainBookIds = groupedBooks.publicDomain.map(b => b.id);
    const allSelected = publicDomainBookIds.every(id => selectedBooks.has(id));
    
    setSelectedBooks(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        publicDomainBookIds.forEach(id => newSet.delete(id));
      } else {
        publicDomainBookIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, [groupedBooks.publicDomain, selectedBooks]);

  const handleExpandToggle = useCallback((sectionKey) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  }, []);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const bookIds = Array.from(selectedBooks);
      await updateSubscriptionBooks({ bookIds });
      toast.success('Каталог подписки успешно обновлен!');
    } catch (error) {
      toast.error('Ошибка при сохранении изменений.');
      console.error(error);
    }
    setIsSaving(false);
  };

  return (
    <ProtectedRoute requireRole="admin">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Управление подпиской</h1>
              <p className="text-muted-foreground">Выберите книги, которые будут доступны по подписке.</p>
            </div>
          </div>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Сохранить изменения
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div>
            <Card className="mb-4 bg-amber-50 border-amber-200">
              <CardHeader 
                className="flex flex-row items-center justify-between cursor-pointer p-4"
                onClick={() => handleExpandToggle('publicDomain')}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={groupedBooks.publicDomain.every(b => selectedBooks.has(b.id))}
                    onCheckedChange={handlePublicDomainToggle}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Выбрать все книги общественного достояния"
                  />
                  <CardTitle className="text-lg text-amber-900">Общественное достояние</CardTitle>
                  <span className="text-sm text-amber-700">({groupedBooks.publicDomain.length} книг)</span>
                </div>
                {expandedSections['publicDomain'] ? <ChevronUp className="w-5 h-5 text-amber-900" /> : <ChevronDown className="w-5 h-5 text-amber-900" />}
              </CardHeader>
              <AnimatePresence>
                {expandedSections['publicDomain'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="p-4 pt-0">
                       <div className="space-y-2 pl-8 border-l-2 border-amber-200 ml-2">
                        {groupedBooks.publicDomain.map(book => (
                          <div key={book.id} className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedBooks.has(book.id)}
                              onCheckedChange={() => handleBookToggle(book.id)}
                            />
                            <label className="text-sm text-amber-800">{book.title}</label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {Object.entries(groupedBooks.byAuthor).map(([author, authorBooks]) => (
              <AuthorSection
                key={author}
                author={author}
                books={authorBooks}
                selectedBooks={selectedBooks}
                onBookToggle={handleBookToggle}
                onAuthorToggle={handleAuthorToggle}
                expanded={!!expandedSections[author]}
                onExpandToggle={handleExpandToggle}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}