import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/Auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Shield, BarChart2, Users, AlertTriangle, BookOpen, TrendingUp, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PlatformStats from '../components/admin/PlatformStats';
import UserManagementTab from '../components/admin/UserManagementTab';
import SalesAnalytics from '../components/admin/SalesAnalytics';
import GenreAnalytics from '../components/admin/GenreAnalytics';
import AuthorAnalytics from '../components/admin/AuthorAnalytics';
import SiteAnalytics from '../components/admin/SiteAnalytics';

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();

  const isAllowed = hasRole('admin');

  if (isLoading) {
    return (
      <div className="w-full bg-background flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAllowed) {
    return (
      <div className="w-full bg-background flex items-center justify-center min-h-screen">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              Доступ ограничен
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Эта страница доступна только для пользователей с ролью "Администратор".
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Панель администратора
              </h1>
              <p className="text-muted-foreground">
                Полная аналитика и управление платформой KASBOOK
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to={createPageUrl('ModerationPage')}>
                <Shield className="w-4 h-4 mr-2" />
                К модерации книг
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Общая статистика */}
        <PlatformStats />

        <Tabs defaultValue="site-analytics" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="site-analytics">
              <Eye className="w-4 h-4 mr-2" />
              Аналитика сайта
            </TabsTrigger>
            <TabsTrigger value="sales-analytics">
              <BarChart2 className="w-4 h-4 mr-2" />
              Продажи
            </TabsTrigger>
            <TabsTrigger value="genre-analytics">
              <BookOpen className="w-4 h-4 mr-2" />
              Жанры
            </TabsTrigger>
            <TabsTrigger value="author-analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Авторы
            </TabsTrigger>
            <TabsTrigger value="user-management">
              <Users className="w-4 h-4 mr-2" />
              Пользователи
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="site-analytics" className="mt-6">
            <SiteAnalytics />
          </TabsContent>
          
          <TabsContent value="sales-analytics" className="mt-6">
            <SalesAnalytics />
          </TabsContent>
          
          <TabsContent value="genre-analytics" className="mt-6">
            <GenreAnalytics />
          </TabsContent>
          
          <TabsContent value="author-analytics" className="mt-6">
            <AuthorAnalytics />
          </TabsContent>
          
          <TabsContent value="user-management" className="mt-6">
            <UserManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}