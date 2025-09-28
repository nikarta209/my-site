
import React, { useState, useEffect } from 'react';
import { useAuth, ProtectedRoute } from '../components/auth/Auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  BookOpen,
  TrendingUp,
  DollarSign,
  Star,
  Eye,
  Upload,
  MessageSquare,
  BarChart3,
  Settings,
  Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Import author components
import OverviewTab from '../components/author/OverviewTab';
import MyBooksTab from '../components/author/MyBooksTab';
import ReviewsTab from '../components/author/ReviewsTab';
import UploadTab from '../components/author/UploadTab';

export default function AuthorPanel() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabsData = [
    {
      value: 'overview',
      label: 'Обзор',
      icon: BarChart3,
      component: OverviewTab
    },
    {
      value: 'books',
      label: 'Мои книги',
      icon: BookOpen,
      component: MyBooksTab
    },
    {
      value: 'reviews',
      label: 'Отзывы',
      icon: MessageSquare,
      component: ReviewsTab
    },
    {
      value: 'upload',
      label: 'Загрузка',
      icon: Upload,
      component: UploadTab
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Crown className="w-16 h-16 mx-auto text-purple-600 mb-4" />
            <CardTitle className="text-2xl">Панель автора</CardTitle>
            <p className="text-muted-foreground">
              Войдите в систему, чтобы получить доступ к панели автора
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild className="w-full kasbook-btn-primary">
                <a href="https://author.kasbook.io" target="_blank" rel="noopener noreferrer">
                  Перейти на портал автора
                </a>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Или используйте существующий аккаунт для доступа к функциям автора
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedRoute requireRole="author">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Панель автора
                </h1>
                <p className="text-muted-foreground">
                  Добро пожаловать, {user?.full_name || user?.email}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="border-purple-200 text-purple-700">
                  <Crown className="w-4 h-4 mr-1" />
                  Автор
                </Badge>
                <Button asChild variant="outline">
                  <Link
                    to={createPageUrl('AuthorPanel')}
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Расширенная панель
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted/50 p-1 mb-8">
              {tabsData.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {tabsData.map(tab => {
              const Component = tab.component;
              return (
                <TabsContent key={tab.value} value={tab.value}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Component />
                  </motion.div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
