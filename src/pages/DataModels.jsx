import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Book,
  User,
  List,
  MessageSquare,
  Repeat,
  Copy,
  CheckCircle,
  Database,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

const CodeBlock = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Код скопирован в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gray-900 rounded-lg p-4 my-4 overflow-x-auto">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-white hover:bg-gray-700"
        onClick={copyToClipboard}
      >
        {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="text-sm text-gray-100 whitespace-pre-wrap">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

export default function DataModelsGuide() {

  const bookModelCode = `const mongoose = require('mongoose');
const axios = require('axios');

const languageSchema = new mongoose.Schema({
  lang: { 
    type: String, 
    required: true, 
    enum: ['ru', 'en', 'de', 'fr', 'es'] 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [150, 'Title is too long']
  },
  description: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [5000, 'Description is too long']
  },
  fileHash: { 
    type: String, 
    required: true, 
    description: 'IPFS hash for the book file in this language' 
  }
}, { _id: false });

const bookSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  genre: { type: String, required: true, index: true },
  mood: { type: String, required: true },
  languages: {
    type: [languageSchema],
    validate: [v => Array.isArray(v) && v.length > 0, 'At least one language version is required.']
  },
  priceKAS: { 
    type: Number, 
    required: true,
    min: [44, 'Price must be at least 44 KAS'] 
  },
  coverUrl: { type: String, required: true },
  salesCount: { type: Number, default: 0, min: 0 },
  likesCount: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true }
}, { timestamps: true });

// Pre-save hook for price validation against USD value
bookSchema.pre('save', async function(next) {
  if (this.isModified('priceKAS') || this.isNew) {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd');
      const kasPriceUSD = response.data.kaspa.usd;
      const usdValue = this.priceKAS * kasPriceUSD;
      
      const MIN_USD_PRICE = 5; // Minimum price of $5
      if (usdValue < MIN_USD_PRICE) {
        const requiredKas = (MIN_USD_PRICE / kasPriceUSD).toFixed(2);
        const err = new Error(\`Book price in USD ($ \${usdValue.toFixed(2)}) is below the minimum required ($ \${MIN_USD_PRICE}). Current required KAS: ~ \${requiredKas}\`);
        return next(err);
      }
    } catch (error) {
      console.error('CoinGecko API error, skipping USD price validation:', error.message);
    }
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);`;

  const userModelCode = `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, select: false },
  fullName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['reader', 'author', 'admin'], default: 'reader' },
  walletAddress: { 
    type: String, 
    required: [true, 'KAS wallet address is required'], 
    unique: true 
  },
  balanceKAS: { type: Number, default: 1000, min: 0 },
  avatarUrl: { type: String, default: 'default_avatar_url' },
  
  // Author-specific fields
  qualifiedSales: { type: Number, default: 0 },
  authorTier: { type: String, default: 'Beginner' },
  royaltyPercentage: { type: Number, default: 80, min: 80, max: 90 }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);`;
  
  const transactionModelCode = `const mongoose = require('mongoose');

const royaltySplitSchema = new mongoose.Schema({
  author: { type: Number, required: true },
  platform: { type: Number, required: true },
  seller: { type: Number, default: 0 } // For resales
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['purchase', 'resale', 'payout', 'deposit'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], required: true, default: 'pending' },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amountKAS: { type: Number, required: true, min: 0 },
  royaltySplit: royaltySplitSchema,
  kaspaTxId: { type: String, index: true }, // Kaspa network transaction ID
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);`;

  const reviewModelCode = `const mongoose = require('mongoose');
const Book = require('./Book'); // Assuming Book model is in the same directory

const reviewSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 5000 },
  likes: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

// Prevent a user from reviewing the same book twice
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

// Static method to calculate average rating and update book
reviewSchema.statics.calculateAverageRating = async function(bookId) {
  const stats = await this.aggregate([
    { $match: { bookId: bookId, status: 'approved' } },
    {
      $group: {
        _id: '$bookId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await Book.findByIdAndUpdate(bookId, {
        rating: stats[0].avgRating.toFixed(2),
        reviewsCount: stats[0].nRating
      });
    } else {
      // If no reviews left, reset to 0
      await Book.findByIdAndUpdate(bookId, {
        rating: 0,
        reviewsCount: 0
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Post-save hook to update book's rating
reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.bookId);
});

// Post-remove hook for when a review is deleted
reviewSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.bookId);
});


module.exports = mongoose.model('Review', reviewSchema);`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            KASBOOK: Data Models (Mongoose Schemas)
          </CardTitle>
          <CardDescription>
            Структура данных для MongoDB, определяющая ядро платформы. Каждая схема включает валидацию, связи и поддержку децентрализованных функций.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="book" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="book"><Book className="w-4 h-4 mr-2" />Книга</TabsTrigger>
          <TabsTrigger value="user"><User className="w-4 h-4 mr-2" />Пользователь</TabsTrigger>
          <TabsTrigger value="transaction"><Repeat className="w-4 h-4 mr-2" />Транзакция</TabsTrigger>
          <TabsTrigger value="review"><MessageSquare className="w-4 h-4 mr-2" />Отзыв</TabsTrigger>
        </TabsList>

        <TabsContent value="book">
          <Card>
            <CardHeader>
              <CardTitle>Book Model</CardTitle>
              <CardDescription>Определяет структуру книги с поддержкой нескольких языков и IPFS.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={bookModelCode} />
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Ключевые особенности:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><Badge variant="secondary">Мультиязычность</Badge>: Поле <code>languages</code> — это массив, позволяющий хранить разные версии (заголовок, описание, файл) для каждого языка.</li>
                  <li><Badge variant="secondary">Децентрализация</Badge>: <code>fileHash</code> хранит хэш файла из IPFS.</li>
                  <li><Badge variant="secondary" className="bg-green-100 text-green-800">Валидация цены</Badge>: Pre-save hook, который перед сохранением проверяет через API CoinGecko, что цена в KAS эквивалентна как минимум $5.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>User Model</CardTitle>
              <CardDescription>Управляет данными пользователя, включая роли и баланс KAS.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={userModelCode} />
               <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Ключевые особенности:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><Badge variant="secondary">Ролевая модель</Badge>: Поле <code>role</code> (reader, author, admin) для разграничения доступа.</li>
                  <li><Badge variant="secondary">Безопасность</Badge>: Пароль никогда не хранится в открытом виде благодаря pre-save hook с <code>bcrypt</code>. Поле <code>password</code> исключено из стандартных запросов (<code>select: false</code>).</li>
                  <li><Badge variant="secondary">Экономика</Badge>: Поля <code>walletAddress</code> (уникальный) и <code>balanceKAS</code> являются основой для транзакций на платформе.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transaction">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Model</CardTitle>
              <CardDescription>Отслеживает все финансовые операции на платформе.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={transactionModelCode} />
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Ключевые особенности:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><Badge variant="secondary">Гибкость</Badge>: Поле <code>type</code> позволяет отслеживать покупки, перепродажи и выводы средств.</li>
                  <li><Badge variant="secondary">Прозрачность</Badge>: <code>royaltySplit</code> — это вложенный объект, который четко определяет долю автора, платформы и продавца (при перепродаже).</li>
                  <li><Badge variant="secondary">Интеграция</Badge>: Поле <code>kaspaTxId</code> для связи с реальной транзакцией в блокчейне Kaspa.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review Model</CardTitle>
              <CardDescription>Схема для отзывов с автоматическим обновлением рейтинга книги.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={reviewModelCode} />
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Ключевые особенности:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><Badge variant="secondary" className="bg-blue-100 text-blue-800">Автоматизация</Badge>: Post-save и post-remove хуки вызывают статический метод <code>calculateAverageRating</code>, который автоматически пересчитывает и обновляет средний рейтинг и количество отзывов у связанной книги.</li>
                  <li><Badge variant="secondary">Целостность данных</Badge>: Уникальный индекс по <code>bookId</code> и <code>userId</code> гарантирует, что один пользователь может оставить только один отзыв на одну книгу.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}