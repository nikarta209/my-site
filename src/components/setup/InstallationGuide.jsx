import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Terminal } from 'lucide-react';

export default function InstallationGuide() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Руководство по установке KASBOOK</h1>
        <p className="text-muted-foreground">Следуйте этим шагам для настройки проекта</p>
      </div>

      {/* Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            1. Установка зависимостей
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <code>npm install idb-keyval localforage framer-motion</code>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">idb-keyval</Badge> - IndexedDB для оффлайн кэширования
            <br />
            <Badge variant="secondary">localforage</Badge> - Локальное хранилище с fallback
            <br />
            <Badge variant="secondary">framer-motion</Badge> - Анимации для UI
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            2. Переменные окружения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Создайте файл <code>.env.local</code> в корне проекта:</p>
          <div className="bg-gray-900 text-white p-4 rounded-lg text-sm">
            <pre>{`# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_service_role_key

# Base44 Configuration  
BASE44_APP_ID=your_app_id

# OpenAI для AI функций (опционально)
OPENAI_API_KEY=your_openai_key

# Для разработки
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Database Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            3. Настройка базы данных
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Выполните SQL скрипт в Supabase SQL Editor:</p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p>Скопируйте код из компонента <code>DatabaseRLSIndexesTriggers.js</code> и выполните в Supabase.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Этот скрипт создаст все необходимые таблицы, индексы, RLS политики и триггеры.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Package.json Scripts */}
      <Card>
        <CardHeader>
          <CardTitle>4. Добавить скрипты в package.json</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-white p-4 rounded-lg text-sm">
            <pre>{`"scripts": {
  "dev": "next dev",
  "build": "next build", 
  "start": "next start",
  "postinstall": "npm run check-deps",
  "check-deps": "node -e \\"try { require('idb-keyval'); require('localforage'); console.log('✅ Deps OK'); } catch(e) { console.error('❌ Missing deps:', e.message); }\\""
}`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Testing */}
      <Card>
        <CardHeader>
          <CardTitle>5. Тестирование</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <code>npm run dev</code>
          </div>
          <div className="space-y-2">
            <p>✅ Проверьте, что приложение запускается без ошибок</p>
            <p>✅ Откройте DevTools и убедитесь в отсутствии ошибок импорта</p>
            <p>✅ Проверьте работу оффлайн синхронизации</p>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">Решение проблем</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Module not found: 'idb-keyval'</h4>
            <p className="text-sm text-muted-foreground">
              Убедитесь, что выполнили <code>npm install idb-keyval localforage</code>
            </p>
          </div>
          <div>
            <h4 className="font-semibold">HTML error page (405)</h4>
            <p className="text-sm text-muted-foreground">
              Проверьте, что в GET-запросах не передается body, только query parameters
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Function timeout</h4>
            <p className="text-sm text-muted-foreground">
              Упрощенная версия функции должна работать быстрее, избегая сложных операций
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center pt-6">
        <p className="text-green-600 font-semibold">
          🎉 После выполнения всех шагов ваше приложение KASBOOK будет готово к работе!
        </p>
      </div>
    </div>
  );
}