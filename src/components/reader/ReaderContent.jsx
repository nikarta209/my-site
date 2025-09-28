import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ReaderContent({ content, isLoading, error }) {
  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Загрузка контента...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Ошибка: {error}</div>;
  }

  return (
    <div 
      className="prose dark:prose-invert max-w-full lg:max-w-4xl mx-auto p-4 md:p-8"
      role="main"
      aria-live="polite"
    >
      <ReactMarkdown>{content || 'Контент недоступен.'}</ReactMarkdown>
    </div>
  );
}