import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

const DockerfileContent = `
# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application's code
COPY . .

# Build the app for production
# The platform handles this, but for a standard Vite app it would be:
RUN npm run build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
# The platform provides a production-ready server.
# For a standard Vite/Express app, it might be:
CMD [ "npm", "start" ]
`;

export default function DeployGuide() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Terminal className="w-6 h-6" />
            Руководство по развертыванию
          </CardTitle>
          <CardDescription>
            Информация о сборке и развертывании вашего приложения KASBOOK.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Сборка проекта (Vite)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Платформа base44 автоматически обрабатывает процесс сборки. Вам не нужно запускать команду
              <code>vite build</code> вручную. Каждый раз, когда вы вносите изменения, платформа пересобирает
              приложение в оптимизированном для продакшена виде.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Развертывание на Fly.io (Пример)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Хотя base44 управляет хостингом, вот пример <code>Dockerfile</code>, который можно было бы использовать
              для развертывания подобного Vite-приложения на сервисе типа Fly.io.
            </p>
            <div className="bg-gray-900 text-white rounded-lg p-4 font-mono">
              <pre className="text-sm whitespace-pre-wrap">
                <code>
                  {DockerfileContent}
                </code>
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Этот файл демонстрирует стандартные шаги: установка зависимостей, сборка проекта и запуск сервера.
              Платформа base44 выполняет аналогичные шаги в своей защищенной и оптимизированной среде.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}