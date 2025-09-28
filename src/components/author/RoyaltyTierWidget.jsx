import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp } from 'lucide-react';
import { useTranslation } from '../i18n/SimpleI18n';

export default function RoyaltyTierWidget({ currentTier, qualifiedSales, isLoading }) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6 bg-gray-700" />
            <Skeleton className="h-6 w-48 bg-gray-700" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32 bg-gray-700" />
            <Skeleton className="h-6 w-24 bg-gray-700" />
          </div>
          <Skeleton className="h-2 w-full bg-gray-700" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24 bg-gray-700" />
            <Skeleton className="h-3 w-16 bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressToNext = currentTier?.next 
    ? ((qualifiedSales / (qualifiedSales + currentTier.needed)) * 100)
    : 100;

  const tierColors = {
    'Beginner': 'bg-gray-600',
    'Starter': 'bg-blue-600', 
    'Rising': 'bg-green-600',
    'Bronze': 'bg-amber-600',
    'Bronze Pro': 'bg-amber-700',
    'Silver': 'bg-gray-400',
    'Silver Pro': 'bg-gray-500',
    'Gold': 'bg-yellow-500',
    'Diamond': 'bg-blue-400',
    'Platinum': 'bg-purple-500',
    'Platinum Elite': 'bg-pink-500'
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <Trophy className="w-6 h-6 text-yellow-500" />
          {t('author.royalty.currentProgress', 'Текущий прогресс')}
        </CardTitle>
        <p className="text-gray-400">
          {qualifiedSales} {t('author.royalty.qualifiedSales', 'квалифицированных продаж')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{currentTier?.tier} ({currentTier?.percentage}%)</p>
            {currentTier?.next && (
              <p className="text-sm text-gray-400">
                {t('author.royalty.next', 'Следующий')}: {currentTier.next} ({currentTier.percentage + 1}%)
              </p>
            )}
          </div>
          <Badge 
            className={`${tierColors[currentTier?.tier] || 'bg-gray-600'} text-white`}
          >
            {currentTier?.percentage}% {t('author.royalty.royalty', 'роялти')}
          </Badge>
        </div>

        {currentTier?.next && (
          <>
            <Progress value={progressToNext} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {qualifiedSales} {t('author.royalty.salesUntilUpgrade', 'продаж до повышения')}
              </span>
              <span className="text-gray-400">
                {t('author.royalty.goal', 'Цель')}: {qualifiedSales + currentTier.needed} {t('author.royalty.sales', 'продаж')}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}