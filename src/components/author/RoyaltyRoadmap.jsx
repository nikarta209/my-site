
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Gem, Rocket, Crown } from 'lucide-react';
import { useAuth } from '../auth/Auth';
import { Purchase } from '@/api/entities';

const TIERS = [
  { level: 'Beginner', sales: 0, royalty: 80, icon: Star, color: 'text-gray-500' },
  { level: 'Starter', sales: 50, royalty: 82, icon: Rocket, color: 'text-blue-500' },
  { level: 'Bronze', sales: 100, royalty: 85, icon: TrendingUp, color: 'text-orange-500' },
  { level: 'Silver', sales: 500, royalty: 88, icon: Gem, color: 'text-gray-400' },
  { level: 'Gold', sales: 1000, royalty: 90, icon: Crown, color: 'text-yellow-500' }
];

export default function RoyaltyRoadmap({ currentSales = 0 }) { // currentSales prop is kept for compatibility but qualifiedSales is primary
  const { user } = useAuth();
  const [qualifiedSales, setQualifiedSales] = useState(0);

  const [authorTier, setAuthorTier] = useState(TIERS[0]);
  const [nextTier, setNextTier] = useState(TIERS[1]);
  const [progress, setProgress] = useState(0);

  const loadQualifiedSales = useCallback(async () => {
    if (!user?.email) return;

    try {
      // ИСПРАВЛЕНИЕ: Загружаем только квалифицированные продажи
      const sales = await Purchase.filter({ 
        seller_email: user.email,
        is_qualified_sale: true 
      });
      setQualifiedSales(sales.length);
    } catch (error) {
      console.error("Ошибка загрузки квалифицированных продаж:", error);
    }
  }, [user?.email]);

  useEffect(() => {
    loadQualifiedSales();
  }, [loadQualifiedSales]);

  // Передаем qualifiedSales в `currentSales` для расчета
  useEffect(() => {
    const currentTierIndex = TIERS.slice().reverse().findIndex(tier => qualifiedSales >= tier.sales);
    const currentTier = TIERS[TIERS.length - 1 - currentTierIndex];
    setAuthorTier(currentTier);

    const nextTierObj = TIERS.find(tier => tier.sales > qualifiedSales);
    setNextTier(nextTierObj);

    if (nextTierObj) {
      const progressToNext = ((qualifiedSales - currentTier.sales) / (nextTierObj.sales - currentTier.sales)) * 100;
      setProgress(progressToNext);
    } else {
      setProgress(100);
    }
  }, [qualifiedSales]);

  return (
    <Card className="bg-card border h-full">
      <CardHeader>
        <CardTitle className="text-foreground">Ваша дорожная карта роялти</CardTitle>
        <p className="text-sm text-muted-foreground">
          Как увеличить ваш доход с каждой продажи.
        </p>
        <p className="text-xs text-muted-foreground">
          Квалифицированная продажа - книга от 5 USD.
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground">
            Ваш уровень: <span className="font-bold text-primary">{authorTier.level}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Текущее роялти: {authorTier.royalty}%
          </p>
        </div>
        
        {nextTier ? (
          <>
            <Progress value={progress} className="w-full mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{authorTier.sales} продаж</span>
              <span>{nextTier.sales} продаж</span>
            </div>
            <p className="text-sm text-center mt-3">
              Еще {nextTier.sales - qualifiedSales} продаж до уровня <span className="font-bold">{nextTier.level}</span> ({nextTier.royalty}% роялти)
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="font-bold text-lg text-yellow-500">Поздравляем! Вы достигли максимального уровня!</p>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const isAchieved = qualifiedSales >= tier.sales;
            return (
              <div key={tier.level} className={`flex items-center justify-between p-2 rounded-md ${isAchieved ? 'bg-primary/10' : 'bg-muted/50'}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${tier.color} ${!isAchieved && 'opacity-50'}`} />
                  <span className={`font-medium ${isAchieved ? 'text-foreground' : 'text-muted-foreground'}`}>{tier.level}</span>
                </div>
                <Badge variant={isAchieved ? 'default' : 'secondary'}>
                  {tier.sales}+ продаж
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
