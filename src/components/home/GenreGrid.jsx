import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

const genreConfig = {
  'fiction': { title: 'Художественная литература', color: 'bg-purple-100 text-purple-800' },
  'science': { title: 'Наука', color: 'bg-blue-100 text-blue-800' },
  'business': { title: 'Бизнес', color: 'bg-green-100 text-green-800' },
  'romance': { title: 'Романтика', color: 'bg-pink-100 text-pink-800' },
  'history': { title: 'История', color: 'bg-amber-100 text-amber-800' },
  'self-help': { title: 'Саморазвитие', color: 'bg-indigo-100 text-indigo-800' },
};

const BookCard = ({ book, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    whileHover={{ scale: 1.02 }}
    className="group cursor-pointer"
  >
    <Card className="overflow-hidden h-full shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800">
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <motion.img
            src={getCoverOrPlaceholder(book, `https://picsum.photos/seed/${book.id}/320/480`)}
            alt={book.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {book.rating}
            </Badge>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{book.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{book.author}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {book.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg text-[#4CAF50]">{book.price_kas} KAS</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Heart className="w-4 h-4" />
              {book.likes}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const SkeletonCard = () => (
  <Card className="overflow-hidden h-full">
    <CardContent className="p-0">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function GenreGrid({ genreData, loading }) {
  if (loading) {
    return (
      <div className="space-y-12">
        {Object.keys(genreConfig).map(genre => (
          <div key={genre}>
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.entries(genreData).map(([genre, books]) => (
        <motion.section
          key={genre}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold">{genreConfig[genre]?.title}</h2>
            <Badge className={genreConfig[genre]?.color}>
              {books.length} книг
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {books.map((book, index) => (
              <BookCard key={book.id} book={book} index={index} />
            ))}
          </div>
        </motion.section>
      ))}
    </div>
  );
}