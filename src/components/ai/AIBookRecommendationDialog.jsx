import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Send, Brain, Loader2, Book, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';
import { Book as BookEntity } from '@/api/entities';

const moodOptions = [
    { label: 'Веселое', emoji: '😄', value: 'cheerful, fun, humorous', color: 'bg-yellow-400 hover:bg-yellow-500' },
    { label: 'Загадочное', emoji: '🤔', value: 'mysterious, thrilling, suspenseful', color: 'bg-indigo-400 hover:bg-indigo-500' },
    { label: 'Вдохновляющее', emoji: '🚀', value: 'inspiring, motivational, uplifting', color: 'bg-green-400 hover:bg-green-500' },
    { label: 'Романтичное', emoji: '❤️', value: 'romantic, lovely, passionate', color: 'bg-pink-400 hover:bg-pink-500' },
    { label: 'Познавательное', emoji: '🧠', value: 'educational, insightful, informative', color: 'bg-blue-400 hover:bg-blue-500' },
    { label: 'Расслабляющее', emoji: '😌', value: 'calm, relaxing, peaceful', color: 'bg-teal-400 hover:bg-teal-500' },
];

const ResultCarousel = ({ results }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => setCurrentIndex(i => (i === 0 ? results.length - 1 : i - 1));
  const next = () => setCurrentIndex(i => (i === results.length - 1 ? 0 : i + 1));
  
  if (!results || results.length === 0) return null;

  return (
    <div className="relative overflow-hidden">
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {results.map((book, index) => (
          <div key={index} className="w-full flex-shrink-0 p-1">
             <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#4a3580] text-white flex flex-col justify-between shadow-lg">
              <div>
                <h4 className="font-bold text-lg mb-2">{book.title}</h4>
                <p className="text-sm text-gray-300 mb-1">by {book.author}</p>
                <p className="text-sm text-gray-400 italic mt-4">"{book.reason}"</p>
              </div>
              <Button size="sm" className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white">
                Подробнее
              </Button>
            </div>
          </div>
        ))}
      </div>
      {results.length > 1 && (
        <>
          <Button onClick={prev} size="icon" variant="ghost" className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full">
            <ChevronLeft />
          </Button>
          <Button onClick={next} size="icon" variant="ghost" className="absolute right-0 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full">
            <ChevronRight />
          </Button>
        </>
      )}
    </div>
  );
};


export default function AIBookRecommendationDialog({ isOpen, onOpenChange }) {
  const [query, setQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [bookContext, setBookContext] = useState('');

  useEffect(() => {
    const fetchBookContext = async () => {
      try {
        const books = await BookEntity.list('', 100);
        const context = books.map(b => `Title: ${b.title}, Author: ${b.author}, Genre: ${b.genre}, Description: ${b.description}`).join('\n---\n');
        setBookContext(context);
      } catch (error) {
        console.error('Failed to load book context:', error);
      }
    };
    if (isOpen) {
      fetchBookContext();
    }
  }, [isOpen]);

  const handleRecommendationRequest = async () => {
    if (!query && !selectedMood) {
      toast.info('Пожалуйста, введите запрос или выберите настроение.');
      return;
    }
    
    setIsLoading(true);
    setResults([]);

    try {
      const prompt = `
        Based on the following list of available books, recommend up to 5 books for a user.
        User's request: "${query}"
        User's desired mood: "${selectedMood || 'any'}"

        Available books context:
        ---
        ${bookContext}
        ---

        For each recommendation, explain concisely why it fits the user's request.
        Your final response must be a JSON array of objects, with each object having the following keys: "title", "author", "reason".
        Do not include any other text or explanation outside of the JSON array.
      `;

      const llmResponse = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              author: { type: "string" },
              reason: { type: "string" }
            },
            required: ["title", "author", "reason"]
          }
        }
      });
      
      setResults(llmResponse || []);

    } catch (error) {
      console.error("AI recommendation failed:", error);
      toast.error('Не удалось получить рекомендации. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="text-primary" />
            ИИ-подборка книг
          </DialogTitle>
          <DialogDescription>
            Опишите, что бы вы хотели почитать, или выберите настроение.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-wrap justify-center gap-2">
            {moodOptions.map(mood => (
                <motion.button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`px-4 py-2 text-sm font-semibold text-white rounded-full flex items-center gap-2 transition-all duration-200 ${mood.color} ${selectedMood === mood.value ? 'ring-2 ring-offset-2 ring-white' : ''}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span>{mood.emoji}</span>
                    {mood.label}
                </motion.button>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Например: 'легкий детектив в викторианском стиле'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRecommendationRequest()}
            />
            <Button onClick={handleRecommendationRequest} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8 flex flex-col items-center justify-center space-y-2">
                <Brain className="w-10 h-10 text-primary animate-pulse" />
                <p className="text-muted-foreground">Подбираем лучшие книги для вас...</p>
              </motion.div>
            )}
            
            {results.length > 0 && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-lg font-semibold my-4 text-center">Вот что мы нашли:</h3>
                <Suspense fallback={<p>Загрузка карусели...</p>}>
                  <ResultCarousel results={results} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}