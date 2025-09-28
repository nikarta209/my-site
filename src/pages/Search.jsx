import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Filters Sidebar */}
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <h2 className="text-xl font-bold mb-4">Фильтры</h2>
        <div className="space-y-4">
          <Select>
            <SelectTrigger><SelectValue placeholder="Жанр" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fiction">Фантастика</SelectItem>
              <SelectItem value="non-fiction">Научная литература</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger><SelectValue placeholder="Цена" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Бесплатно</SelectItem>
              <SelectItem value="paid">Платно</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger><SelectValue placeholder="Рейтинг" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="4+">4+ звезд</SelectItem>
              <SelectItem value="3+">3+ звезд</SelectItem>
            </SelectContent>
          </Select>
          <Button className="w-full bg-[#4CAF50] hover:bg-[#45a049]">Применить</Button>
        </div>
      </aside>

      {/* Search Results */}
      <main className="w-full md:w-3/4 lg:w-4/5">
        <div className="flex gap-2 mb-6">
          <Input placeholder="Поиск..." className="flex-grow" />
          <Button size="icon" className="bg-[#4CAF50] hover:bg-[#45a049]"><SearchIcon className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Placeholder for search results */}
          {Array(8).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-48 bg-muted rounded-md mb-4"></div>
                <h3 className="font-semibold">Название книги</h3>
                <p className="text-sm text-muted-foreground">Автор</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}