import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Users, Star } from 'lucide-react';

export default function AuthorRegistrationCard() {
  return (
    <Card className="author-gradient text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
      
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-white">Станьте автором</CardTitle>
        </div>
        <p className="text-white/90 text-sm">
          Публикуйте свои книги и получайте до 90% с продаж
        </p>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-white/80" />
            <span className="text-sm text-white/90">80-90% роялти</span>
          </div>
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-white/80" />
            <span className="text-sm text-white/90">5% с перепродаж</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-white/80" />
            <span className="text-sm text-white/90">Глобальная аудитория</span>
          </div>
        </div>
        
        <Link to={createPageUrl('RegisterAuthor')}>
          <Button 
            className="w-full bg-white text-blue-600 hover:bg-white/90 transition-colors font-semibold"
          >
            Подать заявку
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}