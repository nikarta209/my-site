import React, { useState, useEffect } from 'react';
import { getBooks } from '../utils/localStorage';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from 'framer-motion';

// Mock purchased book IDs for the current user
const mockPurchasedBookIds = ['1', '3', '5'];
// Mock reading progress
const mockProgress = {
    '1': { progress: 75, totalPages: 400, highlights: ['"Все счастливые семьи похожи друг на друга..."', '"Анна бросила веер..."'] },
    '3': { progress: 20, totalPages: 350, highlights: ['"...рукописи не горят."', '"Понтий Пилат"'] },
    '5': { progress: 95, totalPages: 250, highlights: ['"Когда чего-нибудь сильно захочешь..."'] },
};

export default function LibraryTab({ user }) {
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allBooks = getBooks();
    const userBooks = allBooks.filter(book => mockPurchasedBookIds.includes(book.id));
    
    // Add progress data to each book
    const booksWithProgress = userBooks.map(book => ({
        ...book,
        ...mockProgress[book.id],
    }));

    setLibraryBooks(booksWithProgress);
    setLoading(false);
  }, []);

  const sortedBooks = [...libraryBooks].sort((a, b) => {
    if (sortBy === 'progress_desc') {
      return (b.progress || 0) - (a.progress || 0);
    }
     if (sortBy === 'progress_asc') {
      return (a.progress || 0) - (b.progress || 0);
    }
    // Default to recent (assuming higher ID is more recent)
    return parseInt(b.id) - parseInt(a.id);
  });

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
                                    <img src={book.cover_url} alt={book.title} className="w-24 h-36 object-cover rounded-md" />
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