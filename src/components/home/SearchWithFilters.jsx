import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useTranslation } from '../i18n/SimpleI18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SearchWithFilters({ onFilterChange }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    genre: 'all',
    language: 'all',
    rating: 'all',
    mood: 'all',
    priceMin: '',
    priceMax: ''
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Передаем все фильтры включая поиск
    onFilterChange({ ...newFilters, search: searchTerm });
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    onFilterChange({ ...filters, search: value });
  };

  const handleSearch = () => {
    onFilterChange({ ...filters, search: searchTerm });
  };

  return (
    <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg -mt-24 mb-12 relative z-20 border">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder={t('header.searchPlaceholder', 'Поиск по названию, автору или жанру...')}
            className="pl-12 pr-4 py-3 h-12 text-lg w-full"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Button 
          size="lg" 
          className="w-full md:w-auto kasbook-gradient text-white h-12"
          onClick={handleSearch}
        >
          {t('common.search', 'Найти книгу')}
        </Button>
      </div>
      
      {/* Активные фильтры */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Select value={filters.genre} onValueChange={(value) => handleFilterChange('genre', value)}>
          <SelectTrigger className="w-auto min-w-32">
            <SelectValue placeholder={t('filters.allGenres', 'Все жанры')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allGenres', 'Все жанры')}</SelectItem>
            <SelectItem value="fiction">{t('genres.fiction', 'Художественная литература')}</SelectItem>
            <SelectItem value="non-fiction">{t('genres.non-fiction', 'Нон-фикшн')}</SelectItem>
            <SelectItem value="science">{t('genres.science', 'Наука')}</SelectItem>
            <SelectItem value="history">{t('genres.history', 'История')}</SelectItem>
            <SelectItem value="business">{t('genres.business', 'Бизнес')}</SelectItem>
            <SelectItem value="romance">{t('genres.romance', 'Романтика')}</SelectItem>
            <SelectItem value="mystery">{t('genres.mystery', 'Детектив')}</SelectItem>
            <SelectItem value="fantasy">{t('genres.fantasy', 'Фэнтези')}</SelectItem>
            <SelectItem value="biography">{t('genres.biography', 'Биография')}</SelectItem>
            <SelectItem value="self-help">{t('genres.self-help', 'Саморазвитие')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.language} onValueChange={(value) => handleFilterChange('language', value)}>
          <SelectTrigger className="w-auto min-w-32">
            <SelectValue placeholder={t('filters.allLanguages', 'Все языки')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allLanguages', 'Все языки')}</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="es">Español</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.rating} onValueChange={(value) => handleFilterChange('rating', value)}>
          <SelectTrigger className="w-auto min-w-32">
            <SelectValue placeholder={t('filters.anyRating', 'Любой рейтинг')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.anyRating', 'Любой рейтинг')}</SelectItem>
            <SelectItem value="4">{t('filters.rating4Plus', '4 звезды и выше')}</SelectItem>
            <SelectItem value="3">{t('filters.rating3Plus', '3 звезды и выше')}</SelectItem>
            <SelectItem value="2">{t('filters.rating2Plus', '2 звезды и выше')}</SelectItem>
            <SelectItem value="1">{t('filters.rating1Plus', '1 звезда и выше')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.mood} onValueChange={(value) => handleFilterChange('mood', value)}>
          <SelectTrigger className="w-auto min-w-32">
            <SelectValue placeholder="Любое настроение" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любое настроение</SelectItem>
            <SelectItem value="inspiring">Вдохновляющее</SelectItem>
            <SelectItem value="relaxing">Расслабляющее</SelectItem>
            <SelectItem value="exciting">Захватывающее</SelectItem>
            <SelectItem value="educational">Познавательное</SelectItem>
            <SelectItem value="emotional">Эмоциональное</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={t('filters.minPrice', 'Цена от')}
            className="w-24"
            value={filters.priceMin}
            onChange={(e) => handleFilterChange('priceMin', e.target.value)}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder={t('filters.maxPrice', 'Цена до')}
            className="w-24"
            value={filters.priceMax}
            onChange={(e) => handleFilterChange('priceMax', e.target.value)}
          />
          <span className="text-xs text-muted-foreground">KAS</span>
        </div>
      </div>
    </div>
  );
}