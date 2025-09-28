import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, BookOpen, User, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Mock data for the placeholder
const mockBook = {
  id: '1',
  title: 'Искусство мыслить ясно',
  author: 'Рольф Добелли',
  cover_url: 'https://images.unsplash.com/photo-1593382025255-340ee2d87186?q=80&w=400&auto=format&fit=crop',
  rating: 4.5,
  price: '120 KAS'
};

const mockNote = {
  text: "Мы не знаем, что приносит нам успех или счастье. Мы переоцениваем роль навыков и недооцениваем роль случая. Мы не рациональные существа, которыми себя считаем.",
  user_name: 'Анна Петрова',
  likes_count: 23,
  selected_text: "Успех - это сочетание подготовки и удачи",
  page_number: 45
};

export default function TopSharedNotesSection() {
  // В реальном приложении здесь будет запрос к API
  const hasNotes = false; // Поставить true когда будут реальные данные

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
              <h3 className="text-xl font-semibold text-foreground mb-2">Здесь пока пусто</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Когда читатели начнут делиться своими заметками из книг, самые популярные из них появятся в этом разделе.
              </p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Book Card - Left Side */}
              <div className="md:w-1/3 p-8 bg-muted/30 flex flex-col items-center justify-center">
                <div className="w-48 mb-4">
                  <img 
                    src={mockBook.cover_url} 
                    alt={mockBook.title} 
                    className="w-full aspect-[3/4] object-cover rounded-lg shadow-lg"
                  />
                </div>
                <h4 className="text-lg font-bold text-center text-foreground mb-2">
                  {mockBook.title}
                </h4>
                <p className="text-muted-foreground text-center mb-3">
                  {mockBook.author}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{mockBook.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm font-medium text-primary">{mockBook.price}</span>
                </div>
                <Button asChild className="w-full">
                  <Link to={createPageUrl(`BookDetails?id=${mockBook.id}`)}>
                    <BookOpen className="w-4 h-4 mr-2"/>
                    Подробнее
                  </Link>
                </Button>
              </div>

              {/* Note - Right Side */}
              <div className="md:w-2/3 p-8 flex flex-col justify-center">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-foreground">{mockNote.user_name}</h5>
                      <p className="text-sm text-muted-foreground">стр. {mockNote.page_number}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-100 border border-yellow-300 rounded-2xl p-4 mb-4">
                    {mockNote.selected_text && (
                      <blockquote className="border-l-2 border-primary/30 pl-3 mb-3 text-sm text-muted-foreground italic">
                        "{mockNote.selected_text}"
                      </blockquote>
                    )}
                    <p className="text-foreground leading-relaxed">
                      {mockNote.text}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                      <Heart className="w-4 h-4 mr-1 fill-current" />
                      {mockNote.likes_count}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      2 дня назад
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