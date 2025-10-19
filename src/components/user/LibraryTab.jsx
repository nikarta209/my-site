import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../auth/Auth';
import { SharedNote, UserBookData } from '@/api/entities';
import { getUserPurchases } from '../utils/supabase';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

export default function LibraryTab() {
  const { user } = useAuth();
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadLibrary = async () => {
      setLoading(true);
      try {
        const purchases = await getUserPurchases();
        const ownedBooks = purchases
          .map((purchase) => purchase.book)
          .filter(Boolean);

        if (!isMounted) return;

        if (ownedBooks.length === 0) {
          setLibraryBooks([]);
          return;
        }

        const bookIds = ownedBooks.map((book) => book.id).filter(Boolean);

        const [progressRecords, sharedNotes] = await Promise.all([
          bookIds.length
            ? UserBookData.filter({ user_email: user.email, book_id: { '$in': bookIds } })
            : [],
          bookIds.length
            ? SharedNote.filter({ user_email: user.email, book_id: { '$in': bookIds } }, '-created_at', 10)
            : []
        ]);

        if (!isMounted) return;

        const progressByBook = Array.isArray(progressRecords)
          ? progressRecords.reduce((acc, record) => {
              acc[record.book_id] = {
                progress: Number(record.reading_progress) || 0,
                totalPages: Number(record.total_pages) || Number(record.page_count) || 0
              };
              return acc;
            }, {})
          : {};

        const highlightsByBook = Array.isArray(sharedNotes)
          ? sharedNotes.reduce((acc, note) => {
              if (!note?.book_id) return acc;
              if (!acc[note.book_id]) acc[note.book_id] = [];
              acc[note.book_id].push(note.selected_text || note.text);
              return acc;
            }, {})
          : {};

        const booksWithMeta = ownedBooks.map((book) => {
          const progress = progressByBook[book.id] || {};
          const highlights = highlightsByBook[book.id] || [];
          return {
            ...book,
            progress: progress.progress,
            totalPages: progress.totalPages || book.page_count || 0,
            highlights: highlights.slice(0, 3)
          };
        });

        setLibraryBooks(booksWithMeta);
      } catch (error) {
        console.error('[LibraryTab] Failed to load library', error);
        toast.error('Не удалось загрузить библиотеку');
        setLibraryBooks([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLibrary();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const sortedBooks = useMemo(() => {
    const books = [...libraryBooks];
    if (sortBy === 'progress_desc') {
      return books.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    }
    if (sortBy === 'progress_asc') {
      return books.sort((a, b) => (a.progress || 0) - (b.progress || 0));
    }

    return books.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [libraryBooks, sortBy]);

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Ваша библиотека</h2>
            <Select onValueChange={setSortBy} defaultValue={sortBy}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Сортировать по" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="recent">Недавние</SelectItem>
                    <SelectItem value="progress_desc">Прогресс (убыв.)</SelectItem>
                    <SelectItem value="progress_asc">Прогресс (возр.)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {loading ? (
             <p>Загрузка...</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedBooks.map((book, index) => (
                    <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                    >
                        <Card className="h-full flex flex-col">
                            <CardContent className="p-4 flex-grow">
                                <div className="flex gap-4">
                                    <img src={getCoverOrPlaceholder(book, `https://picsum.photos/seed/${book.id}/240/360`)} alt={book.title} className="w-24 h-36 object-cover rounded-md" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">{book.title}</h3>
                                        <p className="text-sm text-muted-foreground">{book.author}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-muted-foreground">Прогресс</span>
                                        <span className="text-sm font-medium">{book.progress || 0}%</span>
                                    </div>
                                    <Progress value={book.progress || 0} className="w-full" />
                                </div>
                                <div className="mt-4 space-y-2">
                                    <h4 className="font-semibold text-sm">Последние цитаты:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(book.highlights || []).slice(0, 3).map((h, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <div className="p-4 border-t">
                                <Button className="w-full">Продолжить чтение</Button>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        )}
    </div>
  );
}