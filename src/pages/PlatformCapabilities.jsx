import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Code, Server, Database, Users, Shield, Zap } from 'lucide-react';

const CapabilityItem = ({ title, description, isSupported = true }) => (
  <div className="flex items-start space-x-4 mb-4">
    <div>
      {isSupported ? (
        <CheckCircle className="h-6 w-6 text-green-500" />
      ) : (
        <XCircle className="h-6 w-6 text-red-500" />
      )}
    </div>
    <div>
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default function PlatformCapabilities() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Возможности и ограничения платформы Base44</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Что можно и чего нельзя делать в вашем приложении.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Frontend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-6 h-6" /> Фронтенд (Интерфейс)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CapabilityItem 
              title="React + Tailwind CSS"
              description="Создание современных и адаптивных интерфейсов с использованием готовых компонентов Shadcn/UI и иконок Lucide."
            />
            <CapabilityItem 
              title="Готовые компоненты"
              description="Доступна вся библиотека Shadcn/UI. Нет необходимости устанавливать — просто используйте."
            />
             <CapabilityItem 
              title="Ограниченный набор библиотек"
              description="Вы можете использовать только предустановленные пакеты (recharts, react-hook-form, framer-motion и др.). Установить свою npm-библиотеку нельзя."
              isSupported={false}
            />
            <CapabilityItem 
              title="Полная кастомизация"
              description="Вы можете изменять любой аспект CSS, добавлять анимации и создавать уникальный дизайн для вашего приложения."
            />
          </CardContent>
        </Card>

        {/* Backend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-6 h-6" /> Бэкенд (Серверная логика)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CapabilityItem 
              title="Серверные функции на Deno"
              description="Вы можете писать кастомную серверную логику на Deno (современный JavaScript/TypeScript) для интеграции со сторонними API."
            />
             <CapabilityItem 
              title="Интеграция с любыми API"
              description="Используйте fetch для подключения к любым внешним сервисам (Stripe, Telegram, Google API и т.д.)."
            />
            <CapabilityItem 
              title="Нет доступа к файловой системе"
              description="Серверные функции работают в изолированной среде. Прямой доступ к файловой системе сервера ограничен (можно использовать временную папку /tmp)."
              isSupported={false}
            />
            <CapabilityItem 
              title="Работа с секретными ключами"
              description="Безопасное хранение API-ключей и других секретов в переменных окружения."
            />
          </CardContent>
        </Card>

        {/* База данных */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6" /> База данных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CapabilityItem 
              title="Встроенная база данных (Supabase)"
              description="Мощная PostgreSQL база данных для хранения данных вашего приложения. Управляется через JSON-схемы (сущности)."
            />
            <CapabilityItem 
              title="Простое управление данными"
              description="Создавайте, читайте, обновляйте и удаляйте записи с помощью простого SDK (например, `Book.create()`, `Book.list()`)."
            />
            <CapabilityItem 
              title="Нет прямого SQL-доступа из фронтенда"
              description="Все запросы к базе данных строятся через SDK. Нельзя написать сырой SQL-запрос на странице."
              isSupported={false}
            />
             <CapabilityItem 
              title="Сложные запросы на бэкенде"
              description="Вы можете выполнять сложные SQL-запросы и триггеры, используя серверные функции и прямое подключение к Supabase."
            />
          </CardContent>
        </Card>

        {/* Аутентификация и пользователи */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6" /> Пользователи и доступы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CapabilityItem 
              title="Встроенная система аутентификации"
              description="Готовая система входа через Google. Не нужно создавать свои страницы логина и регистрации."
            />
            <CapabilityItem 
              title="Управление ролями"
              description="Каждому пользователю можно присвоить роль (например, 'admin', 'user', 'moderator') и разграничивать доступ к страницам."
            />
            <CapabilityItem 
              title="Нельзя добавить другие методы входа"
              description="На данный момент поддерживается только вход через Google. Добавить вход через Facebook, Email/пароль и др. нельзя."
              isSupported={false}
            />
             <CapabilityItem 
              title="Расширение данных пользователя"
              description="Вы можете добавлять любые кастомные поля к сущности User (например, баланс, настройки, биография)."
            />
          </CardContent>
        </Card>

        {/* Интеграции */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6" /> Готовые интеграции
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CapabilityItem 
              title="Интеграция с LLM (ИИ)"
              description="Встроенная функция для работы с большими языковыми моделями (как ChatGPT) для создания умных функций."
            />
            <CapabilityItem 
              title="Отправка Email"
              description="Простая отправка электронных писем вашим пользователям прямо из кода."
            />
            <CapabilityItem 
              title="Загрузка файлов"
              description="Готовая функция для загрузки файлов в облачное хранилище."
            />
             <CapabilityItem 
              title="Генерация изображений (AI)"
              description="Создание уникальных изображений по текстовому описанию с помощью ИИ."
            />
          </CardContent>
        </Card>

        {/* Безопасность и развертывание */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6" /> Развертывание и безопасность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CapabilityItem 
              title="Автоматическое развертывание"
              description="Все изменения автоматически публикуются и становятся доступны пользователям. Не нужно настраивать серверы."
            />
            <CapabilityItem 
              title="Безопасность на уровне строк (RLS)"
              description="Вы можете настроить правила, чтобы пользователи видели только свои данные (например, свои заказы, свои заметки)."
            />
            <CapabilityItem 
              title="Нельзя использовать свой домен"
              description="Приложение работает на поддомене Base44. Привязать собственный домен (например, my-app.com) пока нельзя."
              isSupported={false}
            />
             <CapabilityItem 
              title="SSL-сертификат включен"
              description="Все приложения защищены HTTPS по умолчанию."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}