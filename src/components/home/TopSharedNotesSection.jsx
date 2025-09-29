import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Book, SharedNote, User as SupabaseUser } from '@/api/entities';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const createAvatarFallback = (value) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(value || 'reader')}`;

export default function TopSharedNotesSection() {
  const [topNote, setTopNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTopNote = async () => {
      setIsLoading(true);
      try {
        const notes = await SharedNote.filter({ is_public: true }, ['-likes_count', '-created_at'], 1);
        if (!isMounted) return;

        if (!notes || notes.length === 0) {
          setTopNote(null);
          return;
        }

        const note = notes[0];
        const [book, user] = await Promise.all([
          note.book_id ? Book.get(note.book_id) : null,
          note.user_id ? SupabaseUser.get(note.user_id) : null
        ]);

        if (!isMounted) return;

        setTopNote({
          note,
          book,
          user
        });
      } catch (error) {
        console.error('[TopSharedNotesSection] Failed to load notes', error);
        if (isMounted) {
          setTopNote(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTopNote();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasNotes = Boolean(topNote && topNote.note);
  const note = topNote?.note;
  const book = topNote?.book;
  const user = topNote?.user;

  return (
    <section className="my-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-foreground">Популярные заметки</h2>
        <Button variant="outline" asChild>
          <Link to={createPageUrl('NotesFeed')}>Смотреть все</Link>
        </Button>
      </div>

      <Card className="bg-card border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {!hasNotes ? (
            <div className="text-center py-16 px-8">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {isLoading ? 'Загружаем заметки...' : 'Здесь пока пусто'}
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {isLoading
                  ? 'Получаем лучшие заметки из Supabase.'
                  : 'Когда читатели начнут делиться своими заметками из книг, самые популярные из них появятся в этом разделе.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 p-8 bg-muted/30 flex flex-col items-center justify-center">
                <div className="w-48 mb-4">
                  <img
                    src={book?.cover_url || `https://picsum.photos/300/400?random=${book?.id || 'note'}`}
                    alt={book?.title || 'Книга'}
                    className="w-full aspect-[3/4] object-cover rounded-lg shadow-lg"
                  />
                </div>
                <h4 className="text-lg font-bold text-center text-foreground mb-2">
                  {book?.title || 'Неизвестная книга'}
                </h4>
                <p className="text-muted-foreground text-center mb-3">
                  {book?.author || book?.author_name || 'Автор не указан'}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{(book?.rating || 0).toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm font-medium text-primary">{book?.price_kas ? `${book.price_kas} KAS` : 'Бесплатно'}</span>
                </div>
                <Button asChild className="w-full">
                  <Link to={createPageUrl(`BookDetails?id=${book?.id || ''}`)}>
                    <BookOpen className="w-4 h-4 mr-2"/>
                    Подробнее
                  </Link>
                </Button>
              </div>

              <div className="md:w-2/3 p-8 flex flex-col justify-center">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                      {user?.avatar_url || user?.avatar ? (
                        <img
                          src={user.avatar_url || user.avatar}
                          alt={user.display_name || user.full_name || user.email || 'Читатель'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={createAvatarFallback(user?.display_name || user?.full_name || note.user_name || note.user_email)}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h5 className="font-semibold text-foreground">
                        {user?.display_name || user?.full_name || note.user_name || note.user_email || 'Читатель'}
                      </h5>
                      <p className="text-sm text-muted-foreground">стр. {note.page_number || note.page || '—'}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-100 border border-yellow-300 rounded-2xl p-4 mb-4">
                    {note.selected_text && (
                      <blockquote className="border-l-2 border-primary/30 pl-3 mb-3 text-sm text-muted-foreground italic">
                        "{note.selected_text}"
                      </blockquote>
                    )}
                    <p className="text-foreground leading-relaxed">
                      {note.text || note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                      <Heart className="w-4 h-4 mr-1 fill-current" />
                      {note.likes_count || 0}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {note.created_at
                        ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ru })
                        : 'Недавно'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
