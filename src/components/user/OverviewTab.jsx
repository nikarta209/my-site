import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import HorizontalCarousel from '../home/HorizontalCarousel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Star } from 'lucide-react';
import { Book, Review, User } from '@/api/entities';

export default function OverviewTab() {
    const [authors, setAuthors] = useState([]);
    const [popularBooks, setPopularBooks] = useState([]);
    const [newBooks, setNewBooks] = useState([]);
    const [topReviews, setTopReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadOverview = async () => {
            setIsLoading(true);
            try {
                const [authorsData, popularBooksData, newBooksData, reviewsData] = await Promise.all([
                    User.filter({ role: { '$in': ['author', 'AUTHOR'] } }, ['-total_sales', '-created_at'], 10)
                        .catch(() => []),
                    Book.filter({ status: { '$in': ['approved', 'public_domain'] } }, ['-likes_count', '-sales_count'], 10)
                        .catch(() => []),
                    Book.filter({ status: { '$in': ['approved', 'public_domain'] } }, '-created_at', 10)
                        .catch(() => []),
                    Review.filter({}, ['-likes_count', '-rating'], 10)
                        .catch(() => [])
                ]);

                if (!isMounted) return;

                const normalizedAuthors = (authorsData || []).map((author) => ({
                    id: author.id,
                    name: author.display_name || author.full_name || author.username || author.email,
                    avatar: author.avatar_url || author.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(author.email || author.id)}`,
                    bio: author.bio || author.tagline || 'Автор Supabase',
                    totalSales: author.total_sales || author.sales_count || 0
                }));

                const normalizedPopularBooks = (popularBooksData || []).map((book) => ({
                    id: book.id,
                    title: book.title,
                    author: book.author || book.author_name || 'Неизвестный автор',
                    cover_url: book.cover_url || `https://picsum.photos/200/300?random=${book.id}`,
                    price_kas: book.price_kas || 0,
                    likes: book.likes_count || 0,
                    rating: book.rating || 0
                }));

                const normalizedNewBooks = (newBooksData || []).map((book) => ({
                    id: book.id,
                    title: book.title,
                    author: book.author || book.author_name || 'Неизвестный автор',
                    cover_url: book.cover_url || `https://picsum.photos/200/300?random=new-${book.id}`,
                    price_kas: book.price_kas || 0,
                    likes: book.likes_count || 0,
                    rating: book.rating || 0
                }));

                const normalizedReviews = (reviewsData || []).map((review) => ({
                    id: review.id,
                    bookTitle: review.book_title || review.book_name || review.title || 'Обзор книги',
                    user: review.user_name || review.reviewer || review.user_email || 'Читатель',
                    rating: review.rating || 0,
                    comment: review.comment || review.text || '',
                    likes: review.likes_count || review.votes || 0,
                    userAvatar: review.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(review.user_name || review.user_email || 'reader')}`
                })).filter((review) => review.likes > 0 || review.comment);

                setAuthors(normalizedAuthors);
                setPopularBooks(normalizedPopularBooks);
                setNewBooks(normalizedNewBooks);
                setTopReviews(normalizedReviews);
            } catch (error) {
                console.error('[OverviewTab] Failed to load overview data', error);
                toast.error('Не удалось загрузить данные Supabase');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadOverview();

        return () => {
            isMounted = false;
        };
    }, []);

    const reviewsToDisplay = useMemo(() => topReviews.slice(0, 10), [topReviews]);

    return (
        <div className="space-y-12">
            <section>
                <HorizontalCarousel
                    title="Авторы недели"
                    subtitle="Самые продаваемые авторы"
                    items={authors}
                    type="authors"
                    loading={isLoading}
                />
            </section>
            <section>
                <HorizontalCarousel
                    title="Популярные книги"
                    subtitle="Лидеры продаж и лайков"
                    items={popularBooks}
                    type="books"
                    loading={isLoading}
                />
            </section>
             <section>
                <HorizontalCarousel
                    title="Новинки"
                    subtitle="Недавно добавленные книги"
                    items={newBooks}
                    type="books"
                    loading={isLoading}
                />
            </section>
            <section>
                <h2 className="text-2xl font-bold mb-4">Популярные обзоры</h2>
                <Accordion type="single" collapsible className="w-full">
                    {reviewsToDisplay.length === 0 && !isLoading ? (
                        <p className="text-muted-foreground">Пока нет обзоров, попробуйте позже.</p>
                    ) : (
                        reviewsToDisplay.map(review => (
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
                        ))
                    )}
                </Accordion>
            </section>
        </div>
    );
}