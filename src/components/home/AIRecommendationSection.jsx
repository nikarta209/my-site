import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { Book } from '@/api/entities';
import BookCarousel from './BookCarousel';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';

const AI_SECTIONS_FOR_HOME = [
  { 
    key: 'for-you', 
    label: 'Для вас',
    subtitle: 'Персональные рекомендации',
    filter: { status: 'approved' },
    sort: '-rating',
    size: 'portrait_large',
  },
  { 
    key: 'trending-ai', 
    label: 'Взлетает с ИИ',
    subtitle: 'Набирают популярность',
    filter: { status: 'approved' },
    sort: '-ai_rating',
    size: 'default',
  },
];

export default function AIRecommendationSection() {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAISections = useCallback(async () => {
    setIsLoading(true);
    try {
      const sectionPromises = AI_SECTIONS_FOR_HOME.map(async (section) => {
        const books = await Book.filter(section.filter, section.sort, 12);
        return { ...section, books: books || [] };
      });
      const loadedSections = await Promise.all(sectionPromises);
      setSections(loadedSections.filter(s => s.books.length > 0));
    } catch (error) {
      console.error("Error loading AI sections for home:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAISections();
  }, [loadAISections]);

  return (
    <motion.section 
      className="bg-muted/50 rounded-2xl p-6 md:p-10 border border-border"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              ИИ-подборки
            </h2>
            <p className="text-muted-foreground">Рекомендации от нашего искусственного интеллекта</p>
          </div>
        </div>
        <Button asChild variant="ghost" className="text-primary">
          <Link to={createPageUrl('AIRecommendations')}>
            Все подборки
          </Link>
        </Button>
      </div>

      <div className="space-y-12">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
             <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="space-y-2">
                            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            </div>
          ))
        ) : (
          sections.map(section => (
            <BookCarousel
              key={section.key}
              title={section.label}
              books={section.books}
              size={section.size}
              isLoading={false}
              showViewAll={false}
            />
          ))
        )}
      </div>
    </motion.section>
  );
}