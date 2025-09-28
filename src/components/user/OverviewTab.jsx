import React from 'react';
import HorizontalCarousel from '../home/HorizontalCarousel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getBooks } from '../utils/localStorage';
import { authorsData } from '../data/authorsData';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Star } from 'lucide-react';

// Mock reviews data
const mockReviews = [
    { id: 1, bookTitle: "Война и мир", user: "Читатель 1", rating: 5, comment: "Великолепная книга! Обязательно к прочтению.", likes: 25, userAvatar: "https://randomuser.me/api/portraits/men/75.jpg" },
    { id: 2, bookTitle: "1984", user: "Критик", rating: 4, comment: "Очень актуально и заставляет задуматься. Слог Оруэлла как всегда на высоте.", likes: 42, userAvatar: "https://randomuser.me/api/portraits/women/75.jpg" },
    { id: 3, bookTitle: "Мастер и Маргарита", user: "Фан-клуб Булгакова", rating: 5, comment: "Перечитываю каждый год и всегда нахожу что-то новое. Гениально!", likes: 15, userAvatar: "https://randomuser.me/api/portraits/men/76.jpg" }
];

export default function OverviewTab() {
    const books = getBooks();
    const authors = authorsData;

    const getTopAuthors = () => authors.sort((a, b) => b.totalSales - a.totalSales).slice(0, 10);
    const getPopularBooks = () => books.sort((a, b) => (b.likes + (b.sales || 0)) - (a.likes + (a.sales || 0))).slice(0, 10);
    const getNewBooks = () => [...books].sort((a, b) => new Date(b.publishedDate || 0) - new Date(a.publishedDate || 0)).slice(0, 10); // needs publishedDate
    const getTopReviews = () => mockReviews.filter(r => r.likes > 10);

    return (
        <div className="space-y-12">
            <section>
                <HorizontalCarousel 
                    title="Авторы недели"
                    subtitle="Самые продаваемые авторы"
                    items={getTopAuthors()}
                    type="authors"
                    loading={false}
                />
            </section>
            <section>
                <HorizontalCarousel 
                    title="Популярные книги"
                    subtitle="Лидеры продаж и лайков"
                    items={getPopularBooks()}
                    type="books"
                    loading={false}
                />
            </section>
             <section>
                <HorizontalCarousel 
                    title="Новинки"
                    subtitle="Недавно добавленные книги"
                    items={getNewBooks()}
                    type="books"
                    loading={false}
                />
            </section>
            <section>
                <h2 className="text-2xl font-bold mb-4">Популярные обзоры</h2>
                <Accordion type="single" collapsible className="w-full">
                    {getTopReviews().map(review => (
                        <AccordionItem value={`item-${review.id}`} key={review.id}>
                            <AccordionTrigger>{review.bookTitle}</AccordionTrigger>
                            <AccordionContent>
                                <div className="flex items-start gap-4">
                                    <Avatar>
                                        <AvatarImage src={review.userAvatar} />
                                        <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-semibold">{review.user}</p>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span>{review.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <ThumbsUp className="w-4 h-4" />
                                            <span>{review.likes}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>
        </div>
    );
}