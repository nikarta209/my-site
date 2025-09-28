import React, { useCallback, useState } from 'react';
import AddNoteModal from './AddNoteModal';

export default function TextSelectionHandler({ 
  onAddNote, 
  currentPage, 
  isAuthenticated, 
  children,
  book 
}) {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });

  const handleSelection = useCallback(() => {
    if (!isAuthenticated) return;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 5) {
      console.log('Выделен текст для заметки:', selectedText);
      
      // Получаем позицию выделения
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(selectedText);
      setSelectionPosition({ 
        x: rect.left + rect.width / 2, 
        y: rect.top 
      });
      
      // Показываем модальное окно для создания заметки
      setIsNoteModalOpen(true);
      
      // Очищаем выделение после небольшой задержки
      setTimeout(() => {
        selection.removeAllRanges();
      }, 100);
    }
  }, [isAuthenticated]);

  const handleSaveNote = async (noteData) => {
    // ИСПРАВЛЕНО: Передаем правильную структуру данных с обязательными полями
    const completeNoteData = {
      selectedText: noteData.selectedText || selectedText,
      highlightColor: noteData.highlightColor || 'yellow',
      noteText: noteData.noteText || '',
      pageNumber: noteData.pageNumber || currentPage
    };
    
    console.log('Отправляем данные заметки:', completeNoteData); // Для отладки
    
    if (onAddNote) {
      await onAddNote(completeNoteData);
    }
    setIsNoteModalOpen(false);
    setSelectedText('');
  };

  const handleCloseModal = () => {
    setIsNoteModalOpen(false);
    setSelectedText('');
  };

  return (
    <>
      <div onMouseUp={handleSelection} onTouchEnd={handleSelection}>
        {children}
      </div>

      <AddNoteModal
        isOpen={isNoteModalOpen}
        onClose={handleCloseModal}
        selectedText={selectedText}
        pageNumber={currentPage}
        onSave={handleSaveNote}
        book={book}
      />
    </>
  );
}