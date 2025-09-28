import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, User, BookOpen, MessageSquare, Share, TrendingUp, Clock, Tag } from 'lucide-react';
import { SharedNote } from '@/api/entities';
import { NoteLike } from '@/api/entities';
import { useAuth } from '../components/auth/Auth';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function NotesFeed() {
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [availableGenres, setAvailableGenres] = useState([]);
  const [likedNotes, setLikedNotes] = useState(new Set());
  
  const containerRef = useRef(null);
  const BATCH_SIZE = 10;

  const emotionalBadges = {
    inspirational: { label: 'Вдохновляющее', color: 'bg-purple-500' },
    motivational: { label: 'Мотивирующее', color: 'bg-orange-500' },
    philosophical: { label: 'Философское', color: 'bg-blue-500' },
    funny: { label: 'Юмор', color: 'bg-green-500' },
    emotional: { label: 'Трогательное', color: 'bg-pink-500' },
    wisdom: { label: 'Мудрость', color: 'bg-amber-500' }
  };

  const getEmotionalBadge = (text) => {
    const lowercaseText = text.toLowerCase();
    
    if (lowercaseText.includes('мотивац') || lowercaseText.includes('цел') || lowercaseText.includes('достиж')) {
      return emotionalBadges.motivational;
    }
    if (lowercaseText.includes('вдохнов') || lowercaseText.includes('мечт') || lowercaseText.includes('надежд')) {
      return emotionalBadges.inspirational;
    }
    if (lowercaseText.includes('жизн') || lowercaseText.includes('смысл') || lowercaseText.includes('судьб')) {
      return emotionalBadges.philosophical;
    }
    if (lowercaseText.includes('смех') || lowercaseText.includes('юмор') || lowercaseText.includes('забавн')) {
      return emotionalBadges.funny;
    }
    if (lowercaseText.includes('любов') || lowercaseText.includes('сердц') || lowercaseText.includes('душ')) {
      return emotionalBadges.emotional;
    }
    if (lowercaseText.includes('мудр') || lowercaseText.includes('опыт') || lowercaseText.includes('урок')) {
      return emotionalBadges.wisdom;
    }
    
    return null;
  };

  const fetchNotes = useCallback(async (currentOffset, reset = false) => {
    setLoading(true);
    try {
      const filters = {};
      
      if (selectedGenre !== 'all') {
        filters.book_genre = selectedGenre;
      }
      
      const orderBy = sortBy === 'popularity' ? '-likes_count' : '-created_at';
      const newNotes = await SharedNote.filter(filters, orderBy, BATCH_SIZE, currentOffset);
      
      if (reset) {
        setNotes(newNotes);
        setOffset(BATCH_SIZE);
      } else {
        setNotes(prev => [...prev, ...newNotes]);
        setOffset(prev => prev + BATCH_SIZE);
      }
      
      setHasMore(newNotes.length === BATCH_SIZE);
      
      if (isAuthenticated && newNotes.length > 0) {
        const noteIds = newNotes.map(note => note.id);
        const userLikes = await NoteLike.filter({
          user_email: user.email,
          shared_note_id: { '$in': noteIds }
        });
        
        const likedSet = new Set(userLikes.map(like => like.shared_note_id));
        if (reset) {
          setLikedNotes(likedSet);
        } else {
          setLikedNotes(prev => new Set([...prev, ...likedSet]));
        }
      }
      
    } catch (error) {
      console.error('Ошибка загрузки заметок:', error);
      toast.error('Не удалось загрузить заметки');
    } finally {
      setLoading(false);
    }
  }, [sortBy, selectedGenre, isAuthenticated, user?.email]);

  const loadGenres = useCallback(async () => {
    try {
      const allNotes = await SharedNote.list();
      const genres = [...new Set(allNotes.map(note => note.book_genre).filter(Boolean))];
      setAvailableGenres(genres);
    } catch (error) {
      console.error('Ошибка загрузки жанров:', error);
    }
  }, []);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  useEffect(() => {
    fetchNotes(0, true);
  }, [fetchNotes]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 200) {
      fetchNotes(offset, false);
    }
  }, [fetchNotes, loading, hasMore, offset]);

  useEffect(() => {
    const scrollElement = containerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const toggleLike = async (noteId) => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы ставить лайки');
      return;
    }

    try {
      const isLiked = likedNotes.has(noteId);
      
      if (isLiked) {
        const existingLike = await NoteLike.filter({
          user_email: user.email,
          shared_note_id: noteId
        });
        
        if (existingLike.length > 0) {
          await NoteLike.delete(existingLike[0].id);
        }
        
        setLikedNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(noteId);
          return newSet;
        });
        
        setNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { ...note, likes_count: Math.max(0, (note.likes_count || 0) - 1) }
            : note
        ));
        
      } else {
        await NoteLike.create({
          user_email: user.email,
          shared_note_id: noteId
        });
        
        setLikedNotes(prev => new Set([...prev, noteId]));
        
        setNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { ...note, likes_count: (note.likes_count || 0) + 1 }
            : note
        ));
      }
    } catch (error) {
      console.error('Ошибка при лайке:', error);
      toast.error('Не удалось поставить лайк');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Лента заметок</h2>
            <p className="text-muted-foreground mb-6">
              Войдите, чтобы видеть заметки других читателей
            </p>
            <Button onClick={() => {/* login logic */}}>
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header with Filters */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Tabs value={sortBy} onValueChange={setSortBy} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="popularity" className="data-[state=active]:text-orange-500">
                <TrendingUp className="w-4 h-4 mr-2" />
                Популярные
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:text-orange-500">
                <Clock className="w-4 h-4 mr-2" />
                Новые
              </TabsTrigger>
              <TabsTrigger value="genre" className="data-[state=active]:text-orange-500">
                <Tag className="w-4 h-4 mr-2" />
                По жанрам
              </TabsTrigger>
            </TabsList>
            
            {sortBy === 'genre' && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Button
                  variant={selectedGenre === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGenre('all')}
                  className="kasbook-rounded-full"
                >
                  Все жанры
                </Button>
                {availableGenres.slice(0, 6).map(genre => (
                  <Button
                    key={genre}
                    variant={selectedGenre === genre ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGenre(genre)}
                    className="kasbook-rounded-full"
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            )}
          </Tabs>
        </div>
      </div>

      {/* Notes Feed */}
      <div 
        ref={containerRef}
        className="h-[calc(100vh-140px)] overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <AnimatePresence>
              {notes.map((note, index) => {
                const isLiked = likedNotes.has(note.id);
                const emotionalBadge = getEmotionalBadge(note.note_text + ' ' + (note.selected_text || ''));
                
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                    className="break-inside-avoid mb-6"
                  >
                    <Card className="kasbook-card group cursor-pointer overflow-hidden bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300">
                      {/* Book Cover Background */}
                      <div 
                        className="h-48 bg-cover bg-center relative"
                        style={{ 
                          backgroundImage: `url(https://picsum.photos/400/300?random=${note.book_id})` 
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        
                        {/* Emotional Badge */}
                        {emotionalBadge && (
                          <Badge 
                            className={`absolute top-4 right-4 ${emotionalBadge.color} text-white border-0`}
                          >
                            {emotionalBadge.label}
                          </Badge>
                        )}

                        {/* Quote Content */}
                        <div className="absolute inset-0 flex items-center justify-center p-6">
                          <div className="text-center">
                            {note.selected_text && (
                              <blockquote className="text-white/90 italic text-lg font-medium leading-relaxed mb-4 line-clamp-4">
                                "{note.selected_text}"
                              </blockquote>
                            )}
                            <p className="text-white text-base leading-relaxed line-clamp-3">
                              {note.note_text}
                            </p>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        {/* Book Info */}
                        <Link 
                          to={createPageUrl(`BookDetails?id=${note.book_id}`)}
                          className="block mb-3 hover:text-primary transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm line-clamp-1">
                                {note.book_title}
                              </h3>
                              <p className="text-muted-foreground text-xs">
                                {note.book_author}
                              </p>
                            </div>
                          </div>
                        </Link>

                        {/* User Info */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{note.user_name}</span>
                          </div>
                          {note.created_at && (
                            <span className="text-xs">
                              {new Date(note.created_at).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleLike(note.id)}
                            className={`flex items-center gap-2 text-sm transition-all duration-200 ${
                              isLiked 
                                ? 'text-blue-500' 
                                : 'text-muted-foreground hover:text-blue-500'
                            }`}
                          >
                            <motion.div
                              animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            </motion.div>
                            <span>{note.likes_count || 0}</span>
                          </motion.button>

                          <div className="flex items-center gap-4 text-muted-foreground">
                            <button className="flex items-center gap-2 text-sm hover:text-blue-500 transition-colors">
                              <MessageSquare className="w-4 h-4" />
                              <span>0</span>
                            </button>
                            <button className="text-sm hover:text-blue-500 transition-colors">
                              <Share className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          )}

          {/* End message */}
          {!hasMore && notes.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Вы просмотрели все заметки</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && notes.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Пока нет заметок</h3>
              <p className="text-muted-foreground">
                Заметки появятся, когда читатели начнут делиться ими из купленных книг
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}