// ДИАГНОСТИЧЕСКИЙ SQL - выполните в Supabase SQL Editor для отладки

/*
-- ШАГ 1: Создаем таблицу для логирования запросов
CREATE TABLE IF NOT EXISTS public.query_logs (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ШАГ 2: Функция для логирования
CREATE OR REPLACE FUNCTION log_table_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.query_logs (table_name, operation)
    VALUES (TG_TABLE_NAME, TG_OP);
    
    IF TG_OP = 'SELECT' THEN
        RETURN NULL; -- Для SELECT триггеры должны возвращать NULL
    ELSE
        RETURN COALESCE(NEW, OLD); -- Для других операций возвращаем соответствующую строку
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ШАГ 3: Создаем триггеры для отслеживания обращений к таблице books
DROP TRIGGER IF EXISTS log_books_access ON public.books;
CREATE TRIGGER log_books_access
    AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.books
    FOR EACH ROW EXECUTE FUNCTION log_table_access();

-- ШАГ 4: Диагностические запросы - выполните для проверки данных
SELECT 'Проверка содержимого таблицы books:' AS info;
SELECT COUNT(*) as total_books, 
       COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_books,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_books
FROM public.books;

-- Показать первые несколько одобренных книг
SELECT 'Примеры одобренных книг:' AS info;
SELECT id, title, author, status, created_at 
FROM public.books 
WHERE status = 'approved' 
ORDER BY created_at DESC 
LIMIT 5;

-- После запуска приложения можете проверить, были ли обращения:
-- SELECT * FROM public.query_logs WHERE table_name = 'books' ORDER BY created_at DESC LIMIT 10;
*/

// REACT-компонент для тестирования функций
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApprovedBooks, getBooksByGenre, getPublicBooks } from '../utils/supabase';

export default function TestSupabaseFunctions() {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testName, testFn) => {
    setIsLoading(true);
    try {
      console.log(`🧪 Запуск теста: ${testName}`);
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          data: result,
          count: Array.isArray(result) ? result.length : 'не массив'
        }
      }));
      console.log(`✅ Тест ${testName} успешен:`, result);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message
        }
      }));
      console.error(`❌ Тест ${testName} провалился:`, error);
    }
    setIsLoading(false);
  };

  const tests = [
    {
      name: 'getApprovedBooks',
      fn: () => getApprovedBooks(5),
      description: 'Загрузка одобренных книг'
    },
    {
      name: 'getPublicBooks',
      fn: () => getPublicBooks(5),
      description: 'Загрузка публичных книг'
    },
    {
      name: 'getBooksByGenre-fiction',
      fn: () => getBooksByGenre('fiction', 3),
      description: 'Загрузка книг жанра Fiction'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Тестирование функций Supabase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.map(test => (
            <div key={test.name} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h3 className="font-semibold">{test.name}</h3>
                <p className="text-sm text-muted-foreground">{test.description}</p>
                
                {testResults[test.name] && (
                  <div className={`mt-2 text-sm ${testResults[test.name].success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResults[test.name].success ? (
                      <span>✅ Успех: {testResults[test.name].count} записей</span>
                    ) : (
                      <span>❌ Ошибка: {testResults[test.name].error}</span>
                    )}
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => runTest(test.name, test.fn)}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? 'Тестируем...' : 'Тест'}
              </Button>
            </div>
          ))}
          
          <Button
            onClick={() => {
              setTestResults({});
              tests.forEach(test => runTest(test.name, test.fn));
            }}
            className="w-full"
            disabled={isLoading}
          >
            Запустить все тесты
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}