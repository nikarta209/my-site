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
          <p className="mb-4">
            Создайте файл <code>.env</code> (или <code>.env.local</code>) в корне проекта и
            добавьте необходимые переменные окружения:
          </p>
          <div className="bg-gray-900 text-white p-4 rounded-lg text-sm">
            <pre>{`# Supabase (обязательно для Vite-фронтенда)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase (для Edge Functions или серверных скриптов)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_service_role_key

# Дополнительные настройки (опционально)
VITE_SUPABASE_STORAGE_BUCKET=books
VITE_SUPABASE_EDGE_FUNCTION_URL=https://your-edge-function-url
VITE_SUPABASE_OAUTH_PROVIDER=google
VITE_SUPABASE_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback
VITE_N8N_URL=https://your-n8n-webhook
VITE_APP_ID=kasbook-local
VITE_THEME_DEFAULT=system`}</pre>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Переменные с префиксом <code>VITE_</code> доступны только на клиенте и необходимы
            для работы Vite-приложения. <code>SUPABASE_SERVICE_KEY</code> и другие значения без
            префикса следует использовать только в защищенных средах (например, при запуске
            Supabase Edge Functions или серверных скриптов).
          </p>
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
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "start": "vite preview --host 0.0.0.0 --port \${PORT:-4173}"
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