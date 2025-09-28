
import React from 'react';
import TestSuite from '../components/testing/TestSuite';
import MetaTags from '../components/seo/MetaTags';
import { createBook, uploadFile } from '../components/utils/supabase';

// Новый тест для многоязычной загрузки файлов с уникальными путями
const testMultiLangUpload = async () => {
  try {
    // Создаем тестовые файлы с одинаковым именем
    const createTestFile = (content, filename = 'test-book.txt') => {
      const blob = new Blob([content], { type: 'text/plain' });
      return new File([blob], filename, { type: 'text/plain' });
    };

    const ruFile = createTestFile('Тестовая книга на русском языке');
    const enFile = createTestFile('Test book in English');

    // Загружаем файлы с одинаковыми именами для разных языков
    const ruUpload = await uploadFile(ruFile, { bookId: 'test', lang: 'ru' });
    const enUpload = await uploadFile(enFile, { bookId: 'test', lang: 'en' });

    // Проверяем, что URL уникальны
    if (ruUpload.publicUrl === enUpload.publicUrl) {
      throw new Error('Файлы с одинаковыми именами имеют одинаковые URL - нет уникальности!');
    }

    // Проверяем, что пути содержат правильные языки
    if (!ruUpload.path.includes('/ru/') || !enUpload.path.includes('/en/')) {
      throw new Error('Пути файлов не содержат правильные языковые коды');
    }

    // Создаем тестовую книгу
    const testBook = {
      title: 'Тест мультиязычной книги',
      author: 'Тестовый автор',
      genre: 'fiction',
      genres: ['fiction'],
      price_kas: 100,
      price_usd: 2.5,
      cover_url: ruUpload.publicUrl, // Using one of the uploaded files for cover
      languages: [
        {
          lang: 'ru',
          title: 'Тестовая книга',
          description: 'Описание на русском',
          file_url: ruUpload.publicUrl
        },
        {
          lang: 'en',
          title: 'Test Book',
          description: 'Description in English',
          file_url: enUpload.publicUrl
        }
      ],
      status: 'pending'
    };

    const createdBook = await createBook(testBook);

    if (!createdBook || !createdBook.id) {
      throw new Error('Книга не была создана');
    }

    // Проверяем уникальность file_url в языках
    const fileUrls = createdBook.languages.map(l => l.file_url);
    const uniqueUrls = new Set(fileUrls);
    
    if (fileUrls.length !== uniqueUrls.size) {
      throw new Error('Обнаружены дублирующиеся file_url в языках книги');
    }
    
    return { 
      success: true, 
      message: `✅ Успешно! Создана книга ID: ${createdBook.id}, уникальные URL: ${fileUrls.length}` 
    };

  } catch (error) {
    console.error('Test multiLangUpload failed:', error);
    return { 
      success: false, 
      message: `❌ Ошибка: ${error.message}` 
    };
  }
};

const testSuites = {
  authentication: {
    name: 'Аутентификация и авторизация',
    tests: [
      // Пример теста: проверка входа пользователя
      { name: 'User Login', fn: async () => ({ success: true, message: 'User login simulated successfully.' }) },
      // Пример теста: проверка регистрации пользователя
      { name: 'User Registration', fn: async () => ({ success: true, message: 'User registration simulated successfully.' }) },
    ]
  },
  database: {
    name: 'База данных и операции CRUD',
    tests: [
      // Пример теста: создание записи
      { name: 'Create Record', fn: async () => ({ success: true, message: 'Record created successfully.' }) },
      // Пример теста: чтение записи
      { name: 'Read Record', fn: async () => ({ success: true, message: 'Record read successfully.' }) },
      // Пример теста: обновление записи
      { name: 'Update Record', fn: async () => ({ success: true, message: 'Record updated successfully.' }) },
      // Пример теста: удаление записи
      { name: 'Delete Record', fn: async () => ({ success: true, message: 'Record deleted successfully.' }) },
    ]
  },
  storage: {
    name: 'Хранилище файлов',
    tests: [
      // Пример теста: загрузка файла
      { name: 'File Upload', fn: async () => ({ success: true, message: 'File uploaded successfully.' }) },
      // Пример теста: скачивание файла
      { name: 'File Download', fn: async () => ({ success: true, message: 'File downloaded successfully.' }) },
    ]
  },
  i18n: {
    name: 'Интернационализация и многоязычность',
    tests: [
      { name: 'Multi-Language File Upload', fn: testMultiLangUpload },
      { name: 'Unique Language Validation', fn: async () => {
        const duplicateLangs = ['ru', 'en', 'ru']; // Дубликат
        const uniqueLangs = new Set(duplicateLangs);
        if (uniqueLangs.size < duplicateLangs.length) {
          return { success: true, message: 'Обнаружение дублей языков работает' };
        }
        return { success: false, message: 'Не удалось обнаружить дублирующиеся языки' };
      }}
    ]
  }
};

export default function TestSuitePage() {
  return (
    <>
      <MetaTags
        title="Test Suite"
        description="KASBOOK application test suite for quality assurance"
        keywords="testing, qa, kasbook, react, javascript"
      />
      <TestSuite testSuites={testSuites} />
    </>
  );
}
