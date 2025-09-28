import React from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from '@/lib/jsPDFStub';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, Notebook, Palette } from 'lucide-react';

const highlightColors = {
  yellow: 'bg-yellow-200/70 text-yellow-800',
  green: 'bg-green-200/70 text-green-800',
  red: 'bg-red-200/70 text-red-800',
};

const ReaderSidebar = ({
  progress,
  highlights,
  notes,
  onNoteChange,
  onHighlightDelete,
  bookTitle,
}) => {

  const handleExport = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(18);
    doc.text(`Заметки из книги: ${bookTitle}`, 10, 20);
    
    let y = 30;
    highlights.forEach((highlight, index) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Подсветка #${index + 1} (Цвет: ${highlight.color})`, 10, y);
      y += 5;
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      const splitText = doc.splitTextToSize(highlight.text, 180);
      doc.text(splitText, 15, y);
      y += (splitText.length * 5) + 5;

      const note = notes[highlight.id];
      if (note) {
          doc.setFontSize(11);
          doc.setTextColor(70, 70, 200);
          const splitNote = doc.splitTextToSize(`Заметка: ${note}`, 175);
          doc.text(splitNote, 20, y);
          y += (splitNote.length * 5) + 5;
      }
      y += 5;
    });

    doc.save(`${bookTitle}-notes.pdf`);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg z-40 pt-16 flex flex-col"
    >
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold">Прогресс и заметки</h2>
        <div className="mt-2 space-y-1">
          <label className="text-sm">Прочитано: {Math.round(progress)}%</label>
          <Progress value={progress} />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <Accordion type="single" collapsible className="w-full">
          {highlights.length > 0 ? (
            highlights.map((highlight) => (
              <AccordionItem value={highlight.id} key={highlight.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2 truncate">
                    <div className={`w-3 h-3 rounded-full ${highlightColors[highlight.color].split(' ')[0]}`}></div>
                    <p className="truncate text-sm">{highlight.text}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Ваша заметка к подсветке..."
                      value={notes[highlight.id] || ''}
                      onChange={(e) => onNoteChange(highlight.id, e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onHighlightDelete(highlight.id)}
                    >
                      Удалить подсветку
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <Notebook className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Выделите текст в книге, чтобы создать подсветку и оставить заметку.</p>
            </div>
          )}
        </Accordion>
      </div>

      <div className="p-4 border-t dark:border-gray-700">
        <Button onClick={handleExport} className="w-full" disabled={highlights.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Экспорт в PDF
        </Button>
      </div>
    </motion.div>
  );
};

export default ReaderSidebar;