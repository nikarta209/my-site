import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Award, BarChart } from 'lucide-react';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

export default function TopBooksCarousel({ books, title, metric, metricLabel, isLoading }) {
  if (isLoading) {
      return (
          <Card>
              <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
              <CardContent>
                  <div className="flex space-x-4">
                      {Array(4).fill(0).map((_, i) => (
                          <div key={i} className="min-w-[180px] space-y-2">
                              <Skeleton className="h-48 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500" />
            {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {books && books.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              loop: books.length > 5,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {books.map((book) => (
                <CarouselItem key={book.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <Link to={createPageUrl(`BookDetails?id=${book.id}`)} className="group">
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src={getCoverOrPlaceholder(book, `https://picsum.photos/seed/${book.id}/300/450`)}
                        alt={book.title}
                        className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <h3 className="mt-2 text-sm font-semibold truncate group-hover:text-blue-600">{book.title}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <BarChart className="w-3 h-3"/>
                      {book[metric]?.toFixed(metric === 'totalEarnings' ? 2 : 0)} {metricLabel}
                    </p>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        ) : (
            <p className="text-center text-gray-500 py-8">Нет данных для отображения.</p>
        )}
      </CardContent>
    </Card>
  );
}