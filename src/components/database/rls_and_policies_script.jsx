import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RLSPoliciesScript() {
  const migrationScript = `
-- =================================================================
-- KASBOOK RLS MIGRATION: SECURITY DEFINER + AUTH.UID() FIX
-- =================================================================

-- Шаг 1: Добавляем author_id если не существует
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.users(id);

-- Шаг 2: Мигрируем существующие данные
UPDATE public.books SET author_id = (
  SELECT id FROM public.users WHERE email = author_email
) WHERE author_id IS NULL;

-- Шаг 3: Создаем SECURITY DEFINER функцию (обходит RLS рекурсию)
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$;

-- Шаг 4: Удаляем все старые политики для books
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'books' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.books';
    END LOOP;
END $$;

-- Шаг 5: Создаем новые политики с auth.uid()
CREATE POLICY "Authors insert" ON public.books 
FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Public read approved" ON public.books 
FOR SELECT USING (status = 'approved');

CREATE POLICY "Authors update own" ON public.books 
FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (true);

CREATE POLICY "Authors delete own" ON public.books 
FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "Moderators all" ON public.books 
FOR ALL USING (is_moderator()) WITH CHECK (true);

-- Шаг 6: Включаем RLS и создаем индексы
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_books_author_id ON public.books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);

-- Шаг 7: Аналогично для purchases
DO $$ 
DECLARE policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'purchases' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.purchases';
    END LOOP;
END $$;

CREATE POLICY "Users own purchases" ON public.purchases 
FOR ALL USING (auth.email() = buyer_email OR is_moderator());

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Шаг 8: Reviews
DO $$ 
DECLARE policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'reviews' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.reviews';
    END LOOP;
END $$;

CREATE POLICY "Reviews public read" ON public.reviews 
FOR SELECT USING (status = 'approved');

CREATE POLICY "Users own reviews" ON public.reviews 
FOR ALL USING (auth.email() = reviewer_email OR is_moderator());

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

SELECT 'KASBOOK RLS migration completed successfully!' as result;
  `;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(migrationScript).then(() => {
      toast.success('🎉 SQL скрипт скопирован в буфер обмена!', {
        description: 'Теперь вставьте его в Supabase SQL Editor и выполните.'
      });
    }).catch(err => {
      console.error('Ошибка копирования:', err);
      toast.error('Не удалось скопировать скрипт');
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          🔒 Миграция RLS Политик
        </h2>
        
        <div className="space-y-4 text-sm">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold mb-2 text-green-800">✅ Что исправляет этот скрипт:</h3>
            <ul className="list-disc list-inside space-y-1 text-green-700">
              <li><strong>403 Unauthorized:</strong> Добавляет author_id для корректного auth.uid()</li>
              <li><strong>Infinite Recursion:</strong> SECURITY DEFINER функция is_moderator()</li>
              <li><strong>RLS Безопасность:</strong> Политики только для авторизованных пользователей</li>
              <li><strong>Производительность:</strong> Индексы для быстрых запросов</li>
            </ul>
          </div>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-semibold text-amber-800">⚠️ Перед выполнением:</p>
            <ol className="list-decimal list-inside text-amber-700 mt-2 space-y-1">
              <li>Убедитесь, что таблица `users` имеет поле `id` (UUID)</li>
              <li>Выполните команду: <code className="bg-amber-100 px-1 rounded">npm install</code></li>
              <li>Затем выполните скрипт в Supabase SQL Editor</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button onClick={handleCopyToClipboard} className="w-full">
            📋 Скопировать SQL скрипт миграции
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            После выполнения скрипта перезагрузите приложение для применения изменений
          </div>
        </div>
      </div>
    </div>
  );
}