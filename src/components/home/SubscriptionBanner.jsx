import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Globe, Brain, ImageIcon, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth, useSubscription } from '../auth/Auth';
import { useExchangeRate } from '../utils/ExchangeRateContext';

export default function SubscriptionBanner() {
  const { isAuthenticated } = useAuth();
  const subscription = useSubscription();
  const { kasRate, isLoading: isRateLoading } = useExchangeRate();
  
  const subscriptionPriceUSD = 10;
  const subscriptionPriceKAS = kasRate ? (subscriptionPriceUSD / kasRate).toFixed(2) : '...';

  // Не показываем баннер если подписка уже активна
  if (subscription.isActive) {
    return null;
  }

  const features = [
    {
      icon: Globe,
      title: "5 переводов книг",
      description: "Переводите любую книгу на нужный язык за месяц",
      color: "text-blue-500"
    },
    {
      icon: Brain,
      title: "ИИ-анализ профиля",
      description: "Персональные рекомендации на основе ваших предпочтений",
      color: "text-purple-500"
    },
    {
      icon: ImageIcon,
      title: "Кастомные фоны заметок",
      description: "Используйте свои изображения для оформления заметок",
      color: "text-green-500"
    },
    {
      icon: BookOpen,
      title: "Эксклюзивная библиотека",
      description: "Доступ к библиотеке книг только для подписчиков",
      color: "text-orange-500"
    }
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="my-8"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 border-0 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Левая часть - основная информация */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <Crown className="w-8 h-8 text-yellow-400" />
                <Badge className="bg-yellow-400 text-purple-900 font-semibold px-3 py-1">
                  ПРЕМИУМ
                </Badge>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                KASBOOK Premium
              </h2>
              
              <p className="text-lg text-purple-100 mb-6 max-w-2xl">
                Откройте полный потенциал чтения с эксклюзивными возможностями и персональными рекомендациями от ИИ
              </p>
              
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">${subscriptionPriceUSD}</div>
                  <div className="text-sm text-purple-200">≈ {subscriptionPriceKAS} KAS</div>
                </div>
                <div className="text-purple-200">
                  <div className="text-sm">на 30 дней</div>
                  <div className="text-xs">полный доступ</div>
                </div>
              </div>
              
              <Button 
                asChild
                size="lg"
                className="bg-yellow-400 text-purple-900 hover:bg-yellow-300 font-semibold px-8 py-3 text-lg shadow-xl"
              >
                <Link to={createPageUrl('SubscriptionPage')}>
                  {isAuthenticated ? 'Оформить подписку' : 'Войти и подписаться'}
                </Link>
              </Button>
            </div>
            
            {/* Правая часть - особенности */}
            <div className="flex-1 w-full">
              <h3 className="text-xl font-semibold text-center mb-6 text-purple-100">
                Что включено:
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                  >
                    <div className={`flex-shrink-0 p-2 rounded-full bg-white/20`}>
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                      <p className="text-xs text-purple-200 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}