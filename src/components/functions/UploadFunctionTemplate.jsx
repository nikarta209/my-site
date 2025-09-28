// СКОПИРУЙТЕ ЭТОТ КОД В ФАЙЛ: supabase/functions/upload/index.ts
// Готовая функция загрузки файлов для развертывания в Supabase Edge Functions

/*
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_KEY')
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Метод не разрешен' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' }
        }
      }
    );

    const {
      data: { user }
    } = await supabaseUser.auth.getUser();
    if (!user) throw new Error('Требуется аутентификация');

    const formData = await req.formData();
    const file = formData.get('file');
    const bookId = formData.get('bookId');
    const lang = formData.get('lang') || 'default';
    const type = formData.get('type') || 'book';

    if (!file || !bookId || !type) {
      throw new Error('Отсутствуют обязательные поля: file, bookId, type');
    }

    // Создаем уникальный, очищенный путь файла
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const sanitizedBaseName = file.name
      .replace(/\.[^/.]+$/, '') // Удаляем расширение
      .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Очищаем символы
      .substring(0, 50); // Ограничиваем длину
    
    const uniqueFileName = `${timestamp}_${sanitizedBaseName}.${fileExtension}`;
    
    // ТОЛЬКО SUPABASE STORAGE - организованная структура папок
    const filePath = type === 'cover' 
      ? `covers/${bookId}/${uniqueFileName}`
      : `books/${bookId}/${lang}/${uniqueFileName}`;

    // Валидируем тип файла
    const allowedTypes = {
      cover: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      book: ['application/pdf']
    };
    
    if (!allowedTypes[type]?.includes(file.type)) {
      throw new Error(`Недопустимый тип файла для ${type}. Ожидается: ${allowedTypes[type]?.join(', ')}`);
    }

    // Загружаем в Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('books')
      .upload(filePath, file, { 
        contentType: file.type, 
        upsert: false,
        duplex: 'half' 
      });

    if (error) throw error;

    // Получаем подходящий URL в зависимости от типа
    let fileUrl;
    if (type === 'cover') {
      // Публичный URL для обложек (будет отображаться на сайте)
      const { data: { publicUrl } } = supabaseAdmin.storage.from('books').getPublicUrl(filePath);
      fileUrl = publicUrl;
    } else {
      // Подписанный URL для файлов книг (приватный доступ с истечением)
      const { data: { signedUrl }, error: signedError } = await supabaseAdmin.storage
        .from('books')
        .createSignedUrl(filePath, 3600); // Истекает через 1 час
      if (signedError) throw signedError;
      fileUrl = signedUrl;
    }

    return new Response(JSON.stringify({ 
      publicUrl: fileUrl,
      filePath: filePath,
      storageUrl: fileUrl,
      success: true,
      type: type 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Ошибка функции загрузки:', error);
    const status = error.message.includes('Требуется аутентификация') ? 401 :
                  error.message.includes('Отсутствуют обязательные') ? 400 :
                  error.message.includes('Недопустимый тип файла') ? 400 : 500;
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
*/

export default function UploadFunctionTemplate() {
  return (
    <div className="p-8 bg-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">📤 Upload Function для KasBook</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📄 supabase/functions/upload/index.ts</h2>
          <p className="text-gray-600 mb-4">
            Функция загрузки файлов с валидацией и правильной структурой путей. Скопируйте код из комментариев выше.
          </p>
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-blue-700 font-medium">✅ Исправляет все ошибки загрузки и 405 на upload</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔧 Настройка переменных окружения</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-gray-100 p-3 rounded">
              <strong>SUPABASE_URL:</strong> Ваш URL проекта Supabase
            </div>
            <div className="bg-gray-100 p-3 rounded">
              <strong>SUPABASE_SERVICE_KEY:</strong> Service role ключ (для записи)
            </div>
            <div className="bg-gray-100 p-3 rounded">
              <strong>VITE_SUPABASE_ANON_KEY:</strong> Anonymous ключ (для чтения)
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Команды развертывания</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
            <div># Создание функций</div>
            <div>mkdir -p supabase/functions/upload</div>
            <div># Сохранить код в index.ts</div>
            <div># Развертывание</div>
            <div>supabase functions deploy upload</div>
          </div>
        </div>
      </div>
    </div>
  );
}