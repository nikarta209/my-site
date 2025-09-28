// СКОПИРУЙТЕ ЭТОТ КОД В ФАЙЛ: supabase/functions/supabase/index.ts
// Готовая функция для развертывания в Supabase Edge Functions

/*
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_KEY')
);

const supabaseAnon = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_ANON_KEY')
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Метод не разрешен' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { action, params = {} } = await req.json();
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    const {
      data: { user }
    } = await supabaseUser.auth.getUser();

    let result;
    
    switch (action) {
      // ПУБЛИЧНЫЕ ДЕЙСТВИЯ ЧТЕНИЯ - используем anon клиент
      case 'getApprovedBooks':
        const { data: books, error: booksError } = await supabaseAnon
          .from('books')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(params.limit || 12);
        if (booksError) throw booksError;
        result = books || [];
        break;

      case 'getBooksByGenre':
        const { data: genreBooks, error: genreError } = await supabaseAnon
          .from('books')
          .select('*')
          .eq('status', 'approved')
          .contains('genres', [params.genre])
          .limit(params.limit || 10);
        if (genreError) throw genreError;
        result = genreBooks || [];
        break;

      case 'getBookById':
        const { data: book, error: bookError } = await supabaseAnon
          .from('books')
          .select('*')
          .eq('id', params.id)
          .single();
        if (bookError) throw bookError;
        result = book;
        break;

      case 'getPublicBooks':
        const { data: publicBooks, error: publicBooksError } = await supabaseAnon
          .from('books')
          .select('*')
          .in('status', ['approved', 'public_domain'])
          .order('created_at', { ascending: false })
          .limit(params.limit || 50);
        if (publicBooksError) throw publicBooksError;
        result = publicBooks || [];
        break;

      // АУТЕНТИФИЦИРОВАННЫЕ ДЕЙСТВИЯ ЧТЕНИЯ
      case 'getAuthorBooks':
        if (!user) throw new Error('Требуется аутентификация');
        const { data: authorBooks, error: authorError } = await supabaseAdmin
          .from('books')
          .select('*')
          .eq('author_email', user.email)
          .order('created_at', { ascending: false });
        if (authorError) throw authorError;
        result = authorBooks || [];
        break;

      case 'getUserPurchases':
        if (!user) throw new Error('Требуется аутентификация');
        const { data: purchases, error: purchaseError } = await supabaseAdmin
          .from('purchases')
          .select('*')
          .eq('buyer_email', user.email)
          .order('created_at', { ascending: false });
        if (purchaseError) throw purchaseError;
        result = purchases || [];
        break;
      
      case 'getPendingBooks':
        if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
          throw new Error('Требуется доступ администратора/модератора');
        }
        const { data: pendingBooks, error: pendingError } = await supabaseAdmin
          .from('books')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(params.limit || 50);
        if (pendingError) throw pendingError;
        result = pendingBooks || [];
        break;

      // ОПЕРАЦИИ ЗАПИСИ - используем service role
      case 'createBook':
        if (!user) throw new Error('Требуется аутентификация');
        const bookData = params.bookData;
        
        // Валидация
        if (!bookData.title || !bookData.author || !Array.isArray(bookData.genres) || bookData.genres.length === 0) {
          throw new Error('Название, автор и как минимум один жанр обязательны');
        }
        
        if (!Array.isArray(bookData.languages)) {
          bookData.languages = [];
        }
        
        const validGenres = ['fiction', 'non-fiction', 'science', 'history', 'business', 'romance', 'mystery', 'fantasy', 'biography', 'self-help', 'philosophy'];
        const invalidGenres = bookData.genres.filter(g => !validGenres.includes(g));
        if (invalidGenres.length > 0) {
          throw new Error(`Недопустимые жанры: ${invalidGenres.join(', ')}`);
        }
        
        const { data: newBook, error: createError } = await supabaseAdmin
          .from('books')
          .insert([{
            ...bookData,
            author_email: user.email,
            author_id: user.id,
            genre: bookData.genres[0]
          }])
          .select()
          .single();
        if (createError) throw createError;
        result = newBook;
        break;

      case 'updateBook':
        if (!user) throw new Error('Требуется аутентификация');
        
        const updateData = params.updateData;
        let query = supabaseAdmin.from('books').update(updateData).eq('id', params.bookId);
        
        if (user.role !== 'admin' && user.role !== 'moderator') {
          query = query.eq('author_email', user.email);
        }
        
        const { data: updatedBook, error: updateError } = await query.select().single();
        if (updateError) throw updateError;
        result = updatedBook;
        break;
      
      case 'updateExchangeRate':
        if (!user || user.role !== 'admin') throw new Error('Требуется доступ администратора');
        const { data: rateData, error: rateError } = await supabaseAdmin
          .from('exchange_rates')
          .upsert({ 
            currency_pair: 'KAS/USD', 
            rate: params.rate 
          }, { 
            onConflict: 'currency_pair' 
          })
          .select()
          .single();
        if (rateError) throw rateError;
        result = rateData;
        break;
      
      case 'getSignedUrl':
        if (!user) throw new Error('Требуется аутентификация');
        const { data: { signedUrl }, error: signedError } = await supabaseAdmin.storage
          .from('books')
          .createSignedUrl(params.filePath, params.expiresIn || 3600);
        if (signedError) throw signedError;
        result = { signedUrl };
        break;
      
      default:
        throw new Error(`Неизвестное действие: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Ошибка Supabase API:', error);
    const status = error.message.includes('Требуется аутентификация') ? 401 :
                  error.message.includes('доступ') ? 403 : 
                  error.message.includes('Неизвестное действие') ? 404 : 400;
    
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
*/

export default function SupabaseFunctionTemplate() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">📁 Файлы Supabase Functions для KasBook</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📄 supabase/functions/supabase/index.ts</h2>
          <p className="text-gray-600 mb-4">
            Основная API функция с всеми обработчиками действий. Скопируйте код из комментариев выше.
          </p>
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <p className="text-green-700 font-medium">✅ Включает все необходимые actions для исправления 405 ошибок</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Инструкции по развертыванию</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Создайте папку <code className="bg-gray-100 px-2 py-1 rounded">supabase/functions/supabase/</code></li>
            <li>Сохраните код как <code className="bg-gray-100 px-2 py-1 rounded">index.ts</code></li>
            <li>Выполните: <code className="bg-blue-100 px-2 py-1 rounded">supabase functions deploy supabase</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}