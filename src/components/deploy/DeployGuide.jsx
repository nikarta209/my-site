import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ExternalLink, Globe, Zap, Shield } from 'lucide-react';
import { toast } from 'sonner';

const copyToClipboard = (text, label) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} скопировано в буфер обмена`);
};

export default function DeployGuide() {
  const [copiedItems, setCopiedItems] = useState({});

  const handleCopy = (text, key) => {
    copyToClipboard(text, key);
    setCopiedItems(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedItems(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const vercelConfig = `{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "env": {
    "KAS_NODE_URL": "@kas_node_url",
    "COINGECKO_API_KEY": "@coingecko_api_key"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  const netlifyConfig = `[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  KAS_NODE_URL = "https://api.kaspa.org"
  COINGECKO_API_KEY = ""

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  NODE_ENV = "production"`;

  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://kasbook.vercel.app/sitemap.xml

# Crawl-delay for politeness
Crawl-delay: 1

# Block admin areas
Disallow: /admin-dashboard
Disallow: /api/admin

# Allow important pages
Allow: /
Allow: /book/*
Allow: /author/*
Allow: /catalog
Allow: /library`;

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kasbook.vercel.app/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://kasbook.vercel.app/catalog</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://kasbook.vercel.app/library</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🚀 KASBOOK Deploy Guide</h1>
          <p className="text-lg text-gray-600">
            Полное руководство по развертыванию вашего приложения KASBOOK
          </p>
        </div>

        <Tabs defaultValue="vercel" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vercel">
              <Zap className="w-4 h-4 mr-2" />
              Vercel
            </TabsTrigger>
            <TabsTrigger value="netlify">
              <Globe className="w-4 h-4 mr-2" />
              Netlify
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Shield className="w-4 h-4 mr-2" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="testing">
              <Check className="w-4 h-4 mr-2" />
              Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vercel" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Развертывание на Vercel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Badge className="bg-green-100 text-green-800 p-3">
                    ⚡ Мгновенный деплой
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 p-3">
                    🌐 Global CDN
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 p-3">
                    📈 Аналитика
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">1. Создайте файл vercel.json</h3>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{vercelConfig}</code>
                    </pre>
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(vercelConfig, 'Vercel config')}
                    >
                      {copiedItems['Vercel config'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2. Настройте переменные окружения</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
                      <code>KAS_NODE_URL</code>
                      <span className="text-sm text-gray-600">https://api.kaspa.org</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
                      <code>COINGECKO_API_KEY</code>
                      <span className="text-sm text-gray-600">Ваш API ключ CoinGecko</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3. Команды деплоя</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-900 text-gray-100 p-3 rounded">
                      <code>npm install -g vercel</code>
                      <Button size="sm" onClick={() => handleCopy('npm install -g vercel', 'Vercel install')}>
                        {copiedItems['Vercel install'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900 text-gray-100 p-3 rounded">
                      <code>vercel --prod</code>
                      <Button size="sm" onClick={() => handleCopy('vercel --prod', 'Vercel deploy')}>
                        {copiedItems['Vercel deploy'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="netlify" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Развертывание на Netlify
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Badge className="bg-teal-100 text-teal-800 p-3">
                    🔄 CI/CD Integration
                  </Badge>
                  <Badge className="bg-orange-100 text-orange-800 p-3">
                    📱 Form Handling
                  </Badge>
                  <Badge className="bg-indigo-100 text-indigo-800 p-3">
                    🔒 HTTPS по умолчанию
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">1. Создайте файл netlify.toml</h3>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{netlifyConfig}</code>
                    </pre>
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(netlifyConfig, 'Netlify config')}
                    >
                      {copiedItems['Netlify config'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2. Drag & Drop деплой</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Соберите проект: <code className="bg-gray-100 px-2 py-1 rounded">npm run build</code></li>
                    <li>Перетащите папку <code className="bg-gray-100 px-2 py-1 rounded">dist</code> на Netlify</li>
                    <li>Настройте переменные окружения в панели управления</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  SEO и безопасность
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">robots.txt</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Создайте файл в папке public/:
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{robotsTxt}</code>
                    </pre>
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(robotsTxt, 'robots.txt')}
                    >
                      {copiedItems['robots.txt'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">sitemap.xml</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Создайте файл в папке public/:
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{sitemapXml}</code>
                    </pre>
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(sitemapXml, 'sitemap.xml')}
                    >
                      {copiedItems['sitemap.xml'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">🔒 Security Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border p-4 rounded">
                      <h4 className="font-medium">XSS Protection</h4>
                      <p className="text-sm text-gray-600">X-XSS-Protection заголовки</p>
                    </div>
                    <div className="border p-4 rounded">
                      <h4 className="font-medium">Content Security</h4>
                      <p className="text-sm text-gray-600">X-Content-Type-Options</p>
                    </div>
                    <div className="border p-4 rounded">
                      <h4 className="font-medium">Frame Protection</h4>
                      <p className="text-sm text-gray-600">X-Frame-Options: DENY</p>
                    </div>
                    <div className="border p-4 rounded">
                      <h4 className="font-medium">File Validation</h4>
                      <p className="text-sm text-gray-600">Max 50MB, type checking</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Тестирование функций
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">✅ Проверенные функции</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Многоязычность (RU/EN)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Темная тема</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Адаптивный дизайн</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>A/B тестирование</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Аутентификация</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Роли пользователей</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">📱 Протестированные разрешения</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between">
                        <span>📱 Mobile</span>
                        <Badge variant="outline">320px+</Badge>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>📱 Tablet</span>
                        <Badge variant="outline">768px+</Badge>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>💻 Desktop</span>
                        <Badge variant="outline">1024px+</Badge>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>🖥️ Large Desktop</span>
                        <Badge variant="outline">1920px+</Badge>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">🧪 Встроенные тесты</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Запустите встроенный набор тестов для проверки всех функций:
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/test-suite'}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Запустить тесты
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}