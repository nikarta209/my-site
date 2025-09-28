import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { 
  Train, 
  GitBranch, 
  Settings, 
  Zap, 
  CheckCircle2,
  Copy,
  ExternalLink,
  AlertCircle,
  Code,
  FileText,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export default function RailwayDeployGuide() {
  const [copiedContent, setCopiedContent] = useState('');

  const copyToClipboard = (content, label) => {
    navigator.clipboard.writeText(content);
    setCopiedContent(label);
    toast.success(`${label} скопировано в буфер обмена`);
    setTimeout(() => setCopiedContent(''), 2000);
  };

  const railwayConfig = `{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "command": "npm run build",
    "watchPatterns": [
      "**/*.js",
      "**/*.jsx",
      "**/*.ts",
      "**/*.tsx",
      "package.json",
      "vite.config.js"
    ]
  },
  "deploy": {
    "startCommand": "serve -s dist -l $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 3
  },
  "variables": {
    "NODE_ENV": "production",
    "VITE_APP_ID": "$APP_ID",
    "VITE_N8N_URL": "$N8N_URL",
    "VITE_THEME_DEFAULT": "$THEME_DEFAULT"
  }
}`;

  const packageJsonScripts = `{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:analyze": "ANALYZE=true vite build", 
    "preview": "vite preview",
    "serve": "serve -s dist -l $PORT",
    "start": "npm run serve"
  },
  "devDependencies": {
    "serve": "^14.2.0",
    "rollup-plugin-visualizer": "^5.9.0"
  }
}`;

  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
  
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-charts': ['recharts']
        }
      }
    },
    
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    chunkSizeWarningLimit: 1000
  },
  
  preview: {
    port: process.env.PORT || 4173,
    host: '0.0.0.0'
  }
})`;

  const healthEndpoint = `// Health check endpoint
export const healthCheck = async () => {
  try {
    const { Book } = await import('@/api/entities');
    await Book.list('-created_date', 1);
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    };
  } catch (error) {
    throw new Error(\`Health check failed: \${error.message}\`);
  }
};`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Train className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Railway Deploy Guide</h1>
            <p className="text-muted-foreground">
              Полное руководство по деплою KASBOOK на Railway
            </p>
          </div>
        </motion.div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="config">Конфигурация</TabsTrigger>
          <TabsTrigger value="env">Переменные</TabsTrigger>
          <TabsTrigger value="optimize">Оптимизация</TabsTrigger>
          <TabsTrigger value="health">Health Check</TabsTrigger>
          <TabsTrigger value="deploy">Деплой</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                railway.json
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Создайте этот файл в корне проекта для конфигурации Railway
                </AlertDescription>
              </Alert>
              
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{railwayConfig}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(railwayConfig, 'railway.json')}
                >
                  {copiedContent === 'railway.json' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                package.json scripts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{packageJsonScripts}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(packageJsonScripts, 'package.json')}
                >
                  {copiedContent === 'package.json' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="env" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Переменные окружения Railway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Установите эти переменные в Railway Dashboard → Settings → Variables
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <code className="font-mono text-sm">APP_ID</code>
                    <p className="text-xs text-muted-foreground">Идентификатор приложения</p>
                  </div>
                  <Badge>Required</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <code className="font-mono text-sm">N8N_URL</code>
                    <p className="text-xs text-muted-foreground">URL для N8N webhook интеграций</p>
                  </div>
                  <Badge variant="outline">Optional</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <code className="font-mono text-sm">THEME_DEFAULT</code>
                    <p className="text-xs text-muted-foreground">Тема по умолчанию (dark/light)</p>
                  </div>
                  <Badge variant="outline">Optional</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                vite.config.js
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{viteConfig}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(viteConfig, 'vite.config.js')}
                >
                  {copiedContent === 'vite.config.js' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Health Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Уже реализован в components/base44Client.js
              </p>
              
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{healthEndpoint}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(healthEndpoint, 'Health Check')}
                >
                  {copiedContent === 'Health Check' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Шаги деплоя
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Подготовка репозитория</h3>
                    <p className="text-sm text-muted-foreground">
                      Убедитесь что все файлы конфигурации созданы и код загружен в GitHub
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Создание проекта в Railway</h3>
                    <p className="text-sm text-muted-foreground">
                      Зайдите на railway.app, подключите GitHub репозиторий
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Настройка переменных</h3>
                    <p className="text-sm text-muted-foreground">
                      Добавьте переменные окружения в Settings → Variables
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold">Автоматический деплой</h3>
                    <p className="text-sm text-muted-foreground">
                      Railway автоматически соберет и развернет приложение
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Готово к деплою!
                  </h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Ваше приложение KASBOOK готово к развертыванию на Railway с полной оптимизацией и мониторингом.
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <Button asChild>
                  <a href="https://railway.app" target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Открыть Railway
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}