import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from '../i18n/SimpleI18n';

export default function SearchFilters({ filters, onFilterChange, genreOptions, languageOptions }) {
  const { t } = useTranslation();

  const ratingOptions = [
    { value: 'all', label: t('filters.anyRating', 'Любой рейтинг') },
    { value: '4', label: t('filters.rating4Plus', '4 звезды и выше') },
    { value: '3', label: t('filters.rating3Plus', '3 звезды и выше') },
    { value: '2', label: t('filters.rating2Plus', '2 звезды и выше') },
    { value: '1', label: t('filters.rating1Plus', '1 звезда и выше') }
  ];

  return (
    <Card className="bg-card border shadow-sm">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          {/* Genre Filter */}
          <div className="space-y-1">
            <Label htmlFor="genre" className="text-xs font-medium">{t('filters.genre', 'Жанр')}</Label>
            <Select value={filters.genre} onValueChange={(value) => onFilterChange('genre', value)}>
              <SelectTrigger id="genre"><SelectValue /></SelectTrigger>
              <SelectContent>
                {genreOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Language Filter */}
          <div className="space-y-1">
            <Label htmlFor="language" className="text-xs font-medium">{t('filters.language', 'Язык')}</Label>
            <Select value={filters.language} onValueChange={(value) => onFilterChange('language', value)}>
              <SelectTrigger id="language"><SelectValue /></SelectTrigger>
              <SelectContent>
                {languageOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">{t('filters.price', 'Цена')} (KAS)</Label>
            <div className="flex items-center gap-2">
              <Input type="number" placeholder={t('filters.minPrice', 'Min')} value={filters.priceMin} onChange={(e) => onFilterChange('priceMin', e.target.value)} />
              <span className="text-muted-foreground">-</span>
              <Input type="number" placeholder={t('filters.maxPrice', 'Max')} value={filters.priceMax} onChange={(e) => onFilterChange('priceMax', e.target.value)} />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-1">
            <Label htmlFor="rating" className="text-xs font-medium">{t('filters.rating', 'Рейтинг')}</Label>
            <Select value={filters.rating} onValueChange={(value) => onFilterChange('rating', value)}>
              <SelectTrigger id="rating"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ratingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}