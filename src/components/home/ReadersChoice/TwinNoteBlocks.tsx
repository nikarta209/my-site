import React from 'react';
import type { PublicBook } from '@/api/books';

interface TwinNoteBlocksProps {
  book?: PublicBook;
}

const PLACEHOLDER_IMAGE = '/assets/cover-placeholder.png';

const TwinNoteBlocks: React.FC<TwinNoteBlocksProps> = ({ book }) => {
  if (!book) {
    return null;
  }

  const noteImage1 =
    book.cover_images?.notes_1 ||
    book.cover_images?.default ||
    PLACEHOLDER_IMAGE;
  const noteImage2 =
    book.cover_images?.notes_2 ||
    book.cover_images?.default ||
    PLACEHOLDER_IMAGE;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold">Выбор редакции</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <img
            src={noteImage1}
            alt={`${book.title} note image 1`}
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
          <img
            src={noteImage2}
            alt={`${book.title} note image 2`}
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
        </div>
        <div className="space-y-3 self-center">
          <h3 className="text-xl font-semibold">{book.title}</h3>
          <p className="text-muted-foreground">
            {book.author || book.author_name || 'Неизвестный автор'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default TwinNoteBlocks;
