import React from 'react';
import { useAuth } from '../components/auth/Auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Heart, 
  Play, 
  Bookmark, 
  Download, 
  BookMarked,
  ChevronRight,
  Shield,
  Bell,
  Star,
  Book,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Separator } from '@/components/ui/separator';

const StatCard = ({ icon, title, count, color, linkTo }) => {
  const Icon = icon;
  return (
    <Link to={linkTo}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className={`bg-card p-4 rounded-lg flex items-center gap-4 border-l-4 ${color} transition-all`}
      >
        <Icon className="w-8 h-8 text-muted-foreground flex-shrink-0" />
        <div className="flex-grow">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{count} шт.</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </motion.div>
    </Link>
  );
};

export default function UserDashboard() {
  const { user, loading, logout } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p>Пожалуйста, войдите в систему.</p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').toUpperCase();
  };

  const dashboardItems = [
    { title: 'Читаю и слушаю', count: 5, icon: BookOpen, color: 'border-blue-500', link: 'Library' },
    { title: 'Отложено', count: 12, icon: Heart, color: 'border-purple-500', link: 'Library' },
    { title: 'Я слежу', count: 3, icon: Star, color: 'border-yellow-500', link: 'Library' },
    { title: 'Мои полки', count: 4, icon: Book, color: 'border-green-500', link: 'Library' },
  ];
  
  const shelves = [
    { title: 'Куплено', count: 28, icon: BookMarked, color: 'border-blue-500', link: 'Library' },
    { title: 'Скачано', count: 15, icon: Download, color: 'border-purple-500', link: 'Library' },
    { title: 'Прочитано', count: 20, icon: Bookmark, color: 'border-orange-500', link: 'Library' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <motion.div 
        className="max-w-4xl mx-auto space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile Header */}
        <Card className="kasbook-card overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-3xl bg-secondary">{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-foreground">{user.full_name || 'Пользователь'}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                  <Link to={createPageUrl('Profile')}>
                    <Button variant="outline">Управлять профилем</Button>
                  </Link>
                  <Button variant="destructive" onClick={logout}>Выйти</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts and Status */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-lg p-4 flex items-center gap-3">
            <Bell className="w-5 h-5"/>
            <p className="text-sm">У вас 2 новых уведомления</p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-lg p-4 flex items-center gap-3">
            <Shield className="w-5 h-5"/>
            <p className="text-sm">Ваша подписка активна до 25.12.2024</p>
          </div>
        </div>
        
        {/* Become an Author */}
        <Card className="bg-gradient-to-r from-primary/80 to-purple-600 text-primary-foreground">
           <CardContent className="p-6 flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-bold">Станьте автором на KASBOOK</h2>
                 <p className="opacity-80">Публикуйте свои произведения и зарабатывайте.</p>
              </div>
              <a href="https://author.kasbook.io" target="_blank" rel="noopener noreferrer">
                 <Button variant="secondary" className="bg-white/90 text-primary hover:bg-white">
                    Перейти на портал автора
                 </Button>
              </a>
           </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Мои книги</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardItems.map((item, index) => (
              <StatCard key={index} {...item} linkTo={createPageUrl(item.link)} />
            ))}
          </div>
        </div>

        <Separator />

        {/* Shelves */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Мои полки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shelves.map((item, index) => (
              <StatCard key={index} {...item} linkTo={createPageUrl(item.link)} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}