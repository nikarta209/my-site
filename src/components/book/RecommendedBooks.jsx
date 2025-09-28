import React, { useState, useEffect } from 'react';
import { Book } from '@/api/entities';
import BookCarousel from '../home/BookCarousel';
import { ThumbsUp } from 'lucide-react';

export default function RecommendedBooks({ currentBook }) {
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setIsLoading(true);
            try {
                // Fetch books of the same genre, excluding the current one
                const recommended = await Book.filter(
                    { genre: currentBook.genre, status: 'approved' },
                    '-rating',
                    10
                );
                setBooks(recommended.filter(b => b.id !== currentBook.id));
            } catch (error) {
                console.error("Failed to fetch recommended books:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentBook) {
            fetchRecommendations();
        }
    }, [currentBook]);

    return (
        <section>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-8">
                <ThumbsUp className="w-8 h-8 text-green-500" />
                Похожие книги
            </h2>
            <BookCarousel books={books} isLoading={isLoading} />
        </section>
    );
}