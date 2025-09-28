import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Book } from '@/api/entities';
import { SharedNote } from '@/api/entities';
import { AlertCircle, Heart, User, Book as BookIcon, NotebookText } from 'lucide-react';
import { motion } from 'framer-motion';

const NoteCard = ({ note }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-background rounded-lg border p-4 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow"
    >
      <div>
        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4 bg-muted/50 p-2 rounded-r-lg">
          "{note.selected_text}"
        </blockquote>
        <p className="text-foreground mb-4">{note.note_text}</p>
      </div>
      <CardFooter className="p-0 pt-4 flex flex-col items-start gap-2 border-t mt-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookIcon className="w-4 h-4" />
          <span>{note.book_title}</span>
        </div>
        <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{note.user_name}</span>
          </div>
          <div className="flex items-center gap-1 text-red-500">
            <Heart className="w-4 h-4" />
            <span>{note.likes_count || 0}</span>
          </div>
        </div>
      </CardFooter>
    </motion.div>
  );
};

export default function SharedNotesTab({ user }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotes = useCallback(async () => {
    if (!user?.email) {
      setError("Автор не найден.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authorBooks = await Book.filter({ author_email: user.email });
      if (!authorBooks || authorBooks.length === 0) {
        setNotes([]);
        setIsLoading(false);
        return;
      }
      
      const bookIds = authorBooks.map(book => book.id);
      
      const sharedNotes = await SharedNote.filter({ book_id: { '$in': bookIds } }, '-created_at');
      setNotes(sharedNotes);

    } catch (err) {
      console.error("Ошибка загрузки заметок:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <div className="flex justify-between pt-4 border-t">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>Не удалось загрузить заметки: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Общие заметки читателей</CardTitle>
        <p className="text-muted-foreground">
          Здесь показаны цитаты и заметки, которыми поделились читатели ваших книг.
        </p>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-16">
            <NotebookText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-muted-foreground">По вашим книгам еще нет общих заметок.</p>
            <p className="text-sm text-muted-foreground/80">Когда читатели поделятся заметками, они появятся здесь.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}