import React from 'react';

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function HighlightedText({ text = '', query = '', className }) {
  if (!text) {
    return <span className={className}></span>;
  }

  if (!query) {
    return <span className={className}>{text}</span>;
  }

  const escaped = escapeRegExp(query);

  try {
    const regex = new RegExp(`(${escaped})`, 'ig');
    const parts = text.split(regex);
    const lowerQuery = query.toLowerCase();

    return (
      <span className={className}>
        {parts.map((part, index) => {
          if (!part) {
            return null;
          }

          if (part.toLowerCase() === lowerQuery) {
            return (
              <mark
                key={`highlight-${index}`}
                className="bg-yellow-200/70 dark:bg-yellow-600/40 text-foreground rounded px-0.5"
              >
                {part}
              </mark>
            );
          }

          return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
        })}
      </span>
    );
  } catch (error) {
    console.warn('[HighlightedText] Failed to highlight text', error);
    return <span className={className}>{text}</span>;
  }
}
