import React from 'react';
import { ArrowLeft, BookText, Share2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import TTSControls from './TTSControls';

export default function ReaderV2Toolbar({ book, progress, content, onSettings, bookId }) {
  return (
    <header className="flex items-center justify-between p-2 md:p-4 border-b bg-background sticky top-0 z-10" role="toolbar">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Назад к деталям книги">
            <Link to={`/book/${bookId}`}>
                <ArrowLeft className="h-5 w-5" />
            </Link>
        </Button>
        <div className="flex items-center gap-2">
           <BookText className="h-5 w-5 hidden md:block" />
           <h1 className="font-semibold text-sm md:text-lg truncate max-w-xs">{book?.title || 'Читалка'}</h1>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 w-1/3 hidden md:block">
        <Progress value={progress} aria-label={`Прогресс чтения ${progress}%`} />
      </div>
      <div className="flex items-center gap-2">
        <TTSControls textToRead={content} />
        <Button variant="ghost" size="icon" aria-label="Поделиться">
          <Share2 className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSettings} aria-label="Настройки">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}