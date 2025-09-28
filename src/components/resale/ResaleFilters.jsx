import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

export default function ResaleFilters({ filters, onFilterChange }) {
  const handleFilterUpdate = (key, value) => {
    onFilterChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const genreOptions = [
    { value: 'all', label: 'Все жанры' },
    { value: 'fiction', label: 'Художественная' },
    { value: 'non-fiction', label: 'Нон-фикшн' },
    { value: 'science', label: 'Наука' },
    { value: 'business', label: 'Бизнес' },
    { value: 'fantasy', label: 'Фэнтези' },
    { value: 'romance', label: 'Романтика' },
    { value: 'mystery', label: 'Детектив' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Новые объявления' },
    { value: 'oldest', label: 'Старые объявления' },
    { value: 'price_low', label: 'Цена: по возрастанию' },
    { value: 'price_high', label: 'Цена: по убыванию' }
  ];

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Фильтры рынка
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label>Поиск</Label>
          <Input
            placeholder="Название или автор..."
            value={filters.search}
            onChange={(e) => handleFilterUpdate('search', e.target.value)}
          />
        </div>

        {/* Genre */}
        <div className="space-y-2">
          <Label>Жанр</Label>
          <Select
            value={filters.genre}
            onValueChange={(value) => handleFilterUpdate('genre', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {genreOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label>Цена (KAS)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.priceMin}
              onChange={(e) => handleFilterUpdate('priceMin', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.priceMax}
              onChange={(e) => handleFilterUpdate('priceMax', e.target.value)}
            />
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <Label>Сортировка</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterUpdate('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Market Stats */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-semibold">Статистика рынка</Label>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Floor цена:</span>
              <span className="font-medium">от 45 KAS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Роялти:</span>
              <span className="font-medium">5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Активных NFT:</span>
              <span className="font-medium">127</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}