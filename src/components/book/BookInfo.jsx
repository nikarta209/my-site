import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

export default function BookInfo({ book }) {
    const genreLabels = {
        fiction: 'Художественная', 'non-fiction': 'Нон-фикшн', science: 'Наука',
        history: 'История', business: 'Бизнес', romance: 'Романтика', mystery: 'Детектив',
        fantasy: 'Фэнтези', biography: 'Биография', 'self-help': 'Саморазвитие'
    };

    return (
        <div className="space-y-4">
            <Badge variant="secondary">{genreLabels[book.genre] || book.genre}</Badge>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{book.title}</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
                от <span className="font-medium text-green-600">{book.author}</span>
            </p>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-bold text-lg">{book.rating ? book.rating.toFixed(1) : '—'}</span>
                </div>
                <span className="text-gray-500">({book.reviews_count || 0} отзывов)</span>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-2">Описание</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {book.description}
                </p>
            </div>

            {book.mood_tags && book.mood_tags.length > 0 && (
                <div>
                    <h3 className="font-semibold text-lg mb-2">Настроение</h3>
                    <div className="flex flex-wrap gap-2">
                        {book.mood_tags.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}