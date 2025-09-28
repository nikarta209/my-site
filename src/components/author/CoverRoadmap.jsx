
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, Trophy, ImageIcon, Newspaper, Library, Tv } from 'lucide-react';

const TIERS = [
  { sales: 0, label: "Стандарт", icon: ImageIcon, desc: "Обычная обложка", color: 'text-gray-500' },
  { sales: 5, label: "Заметки", icon: Newspaper, desc: "Обложка в ленте заметок", color: 'text-teal-500' },
  { sales: 15, label: "Библиотека", icon: Library, desc: "Обложка в 'Читаю сейчас'", color: 'text-blue-500' },
  { sales: 25, label: "Заметки+", icon: Newspaper, desc: "Вторая обложка для заметок", color: 'text-teal-600' },
  { sales: 50, label: "Квадрат", icon: ImageIcon, desc: "Квадратная обложка", color: 'text-indigo-500' },
  { sales: 350, label: "Разделы", icon: Tv, desc: "Широкий баннер в разделах", color: 'text-purple-500' },
  { sales: 1000, label: "Популярное", icon: ImageIcon, desc: "Высокая обложка", color: 'text-pink-500' },
  { sales: 10000, label: "Главная", icon: Trophy, desc: "Баннер на главной", color: 'text-amber-500' }
];

export default function CoverRoadmap({ monthlySales }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="w-6 h-6 text-amber-500" />
          Дорожная карта обложек
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Открывайте новые форматы обложек, увеличивая продажи за последние 30 дней.
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress Bar */}
          <div className="absolute left-4 top-4 h-full w-0.5 bg-border -z-10" />
          
          <div className="space-y-6">
            {TIERS.map((tier, index) => {
              const isUnlocked = monthlySales >= tier.sales;
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.sales}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-4 relative"
                >
                  {/* Status Icon */}
                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUnlocked ? 'bg-green-500 text-white' : 'bg-muted border-2 border-border text-muted-foreground'
                  }`}>
                    {isUnlocked ? <CheckCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  
                  {/* Tier Info */}
                  <div className={`flex-1 flex items-center justify-between p-3 rounded-lg border ${isUnlocked ? 'border-green-200 bg-green-50' : 'border-border bg-card'}`}>
                    <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 flex-shrink-0 ${tier.color}`} />
                        <div>
                            <p className="font-semibold text-foreground">{tier.label}</p>
                            <p className="text-xs text-muted-foreground">{tier.desc}</p>
                        </div>
                    </div>
                    <Badge variant={isUnlocked ? 'default' : 'outline'} className={isUnlocked ? 'bg-green-600' : ''}>
                      {tier.sales} продаж
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
