import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Book,
  User,
  Copy,
  CheckCircle,
  KeyRound,
  UploadCloud,
  Search,
  Repeat,
  BarChart2,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

const CodeBlock = ({ code }) => {
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
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function BackendControllersGuide() {

  const authControllerCode = `// ... (imports: User, jwt, etc.)

// @desc    Register a new user
exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, walletAddress, role } = req.body;
    // ... (validation logic) ...
    
    // 1. Validate Kaspa wallet (mock)
    if (!validateKaspaAddress(walletAddress)) {
      return res.status(400).json({ msg: 'Invalid Kaspa wallet address' });
    }

    // 2. Create user (password is hashed in pre-save hook)
    const user = await User.create({ email, password, fullName, walletAddress, role });

    // 3. Sign JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token });
  } catch (err) { next(err); }
};

// @desc    Login user
exports.login = async (req, res, next) => {
  // ... (login logic as before, including 2FA mock) ...
};

// @desc    Get user profile
exports.getProfile = async (req, res, next) => {
  // req.user is populated from auth middleware
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};`;

  const bookControllerCode = `// ... (imports: Book, multer, mock services)

// @desc    Upload a new book
exports.uploadBook = async (req, res, next) => {
  try {
    const { languages, genre, mood, priceKAS } = JSON.parse(req.body.metadata);
    
    // 1. Plagiarism check (mock API call)
    const plagiarismResult = await checkPlagiarism(req.files['book_ru'][0].path);
    if (plagiarismResult.isPlagiarized) {
      return res.status(400).json({ msg: 'Plagiarism detected.', report: plagiarismResult.reportUrl });
    }

    // 2. Pin files to IPFS and gather hashes
    const coverUrl = await addToIpfs(req.files['cover'][0].path);
    for (const lang of languages) {
      const fileKey = \`book_\${lang.lang}\`;
      lang.fileHash = await addToIpfs(req.files[fileKey][0].path);
    }
    
    // 3. Create book instance (price validation happens in pre-save hook)
    const newBook = new Book({
      authorId: req.user.id,
      genre, mood, priceKAS, languages, coverUrl,
      status: 'pending' // Add to moderation queue
    });
    
    await newBook.save();
    res.status(201).json({ msg: 'Book uploaded successfully, awaiting moderation.', book: newBook });

  } catch (err) { next(err); }
};

// @desc    Search and filter books
exports.searchBooks = async (req, res, next) => {
  try {
    const { q, genre, lang, minPrice, maxPrice, rating, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let pipeline = [];
    
    // Match stage for filtering
    const matchStage = {};
    if (q) matchStage['languages.title'] = { $regex: q, $options: 'i' };
    if (genre) matchStage.genre = genre;
    if (lang) matchStage['languages.lang'] = lang;
    if (minPrice) matchStage.priceKAS = { ...matchStage.priceKAS, $gte: Number(minPrice) };
    if (maxPrice) matchStage.priceKAS = { ...matchStage.priceKAS, $lte: Number(maxPrice) };
    if (rating) matchStage.rating = { $gte: Number(rating) };
    
    if (Object.keys(matchStage).length > 0) pipeline.push({ $match: matchStage });

    // AddFields stage for dynamic score calculation
    pipeline.push({
      $addFields: {
        score: {
          $add: [
            { $multiply: ['$salesCount', 0.4] },
            { $multiply: ['$likesCount', 0.3] },
            { $multiply: ['$rating', 0.3] }
          ]
        }
      }
    });

    // Sort, Skip, Limit stages
    pipeline.push({ $sort: { score: -1, createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    const books = await Book.aggregate(pipeline);
    res.json({ books });

  } catch (err) { next(err); }
};`;

  const transactionControllerCode = `// ... (imports: Transaction, User, Book, mock services)

// @desc    Buy a book
exports.buyBook = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    
    // 1. Create payment with NOWPayments (mock)
    const payment = await createNowPaymentsInvoice(book.priceKAS, req.user.id);
    // ... (logic to handle payment confirmation via webhook) ...
    
    // Assuming payment is successful:
    // 2. Mint NFT on Kaspa (mock)
    const nftData = await mintNftOnKaspa(req.user.walletAddress, bookId, book.coverUrl);
    
    // 3. Create transaction record and update ownership
    await Transaction.create({ ... });
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { ownedBooks: bookId } });
    await Book.findByIdAndUpdate(bookId, { $inc: { salesCount: 1 } });
    
    res.json({ msg: 'Purchase successful!', txId: nftData.txId });
  } catch (err) { next(err); }
};

// @desc    Resell a book
exports.resellBook = async (req, res, next) => {
  try {
    const { bookId, price } = req.body;
    
    // 1. Verify ownership (check user.ownedBooks)
    // 2. Execute smart contract mock for transfer and royalty split
    const royaltyAmount = price * 0.05; // 5% royalty
    const sellerGets = price - royaltyAmount;
    await executeResale(req.user.walletAddress, book.author.walletAddress, royaltyAmount, sellerGets);

    res.json({ msg: 'Resale successful!' });
  } catch (err) { next(err); }
};

// @desc    Withdraw funds
exports.withdrawFunds = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const amount = user.balanceKAS;
    const fee = amount * 0.03; // 3% fee
    const withdrawAmount = amount - fee;

    // ... (logic to execute withdrawal via Kaspa RPC mock) ...
    res.json({ msg: 'Withdrawal processed.' });
  } catch(err) { next(err); }
};`;
    
  const analyticsControllerCode = `// ... (imports)

// @desc    Get author sales and royalty data
exports.getAuthorAnalytics = async (req, res, next) => {
  try {
    // 1. Aggregate sales data for charts
    const salesData = await Transaction.aggregate([
      { $match: { sellerId: req.user.id, type: 'purchase' } },
      // ... (group by date logic) ...
    ]);

    // 2. Calculate qualified sales (>= $5) and determine tier
    const qualifiedSalesCount = await Transaction.countDocuments({ sellerId: req.user.id, priceUSD: { $gte: 5 } });
    const tierInfo = calculateAuthorTier(qualifiedSalesCount); // 80-90%

    res.json({ salesDataForRecharts: salesData, tierInfo });
  } catch(err) { next(err); }
};

// @desc    Get author comparison data
exports.getPeerComparison = async (req, res, next) => {
  // This is a mock implementation for demonstration
  const authorStats = await getAuthorStats(req.user.id);
  const mockPeers = generateMockPeers(authorStats.genre, authorStats.salesCount);
  res.json({ authorStats, peerData: mockPeers });
};`;
    
  const rewardsControllerCode = `// ... (imports)

// @desc    Claim reward for an activity
exports.claimReward = async (req, res, next) => {
  try {
    const { activityType } = req.body; // e.g., 'wrote_review'
    const REWARD_AMOUNT = 0.1; // +0.1 KAS

    // 1. Verify if activity is valid and not already claimed
    
    // 2. Update user balance
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { balanceKAS: REWARD_AMOUNT } },
      { new: true }
    );
    
    // 3. Log the reward transaction
    await Transaction.create({ type: 'reward', userId: req.user.id, amountKAS: REWARD_AMOUNT });

    res.json({ msg: 'Reward claimed!', newBalance: user.balanceKAS });
  } catch(err) { next(err); }
};`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>KASBOOK: Backend Controllers Logic</CardTitle>
          <CardDescription>
            Реализация бизнес-логики сервера в Express.js контроллерах.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="auth" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="auth"><KeyRound className="w-4 h-4 mr-2"/>Auth</TabsTrigger>
          <TabsTrigger value="books"><Book className="w-4 h-4 mr-2"/>Books</TabsTrigger>
          <TabsTrigger value="transactions"><Repeat className="w-4 h-4 mr-2"/>Transactions</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart2 className="w-4 h-4 mr-2"/>Analytics</TabsTrigger>
          <TabsTrigger value="rewards"><Award className="w-4 h-4 mr-2"/>Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Auth Controller</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={authControllerCode} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="books">
           <Card>
            <CardHeader>
              <CardTitle>Book Controller</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={bookControllerCode} />
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Ключевые процессы:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><Badge variant="secondary">Загрузка</Badge>: Проверка на плагиат (mock Copyleaks), пиннинг в IPFS, добавление в очередь модерации.</li>
                  <li><Badge variant="secondary">Поиск</Badge>: Агрегационный запрос с динамической фильтрацией и расчетом очков релевантности (<code>0.4*sales + 0.3*likes + 0.3*rating</code>) для сортировки.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
           <Card>
            <CardHeader>
              <CardTitle>Transaction Controller</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={transactionControllerCode} />
               <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Ключевые процессы:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><Badge variant="secondary">Покупка</Badge>: Интеграция с NOWPayments, минтинг NFT на Kaspa (mock), обновление записей о владении.</li>
                  <li><Badge variant="secondary">Перепродажа</Badge>: Мок смарт-контракта для перевода NFT и распределения роялти (5% автору).</li>
                   <li><Badge variant="secondary">Вывод</Badge>: Расчет и удержание комиссии платформы (3%).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Controller (для авторов)</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={analyticsControllerCode} />
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Ключевые процессы:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><Badge variant="secondary">Статистика</Badge>: Агрегация данных о продажах и доходе для графиков Recharts на фронтенде.</li>
                  <li><Badge variant="secondary">Уровни роялти</Badge>: Расчет тира (80-90%) на основе "квалифицированных продаж" (те, что &gt;= $5).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Rewards Controller</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={rewardsControllerCode} />
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Ключевые процессы:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><Badge variant="secondary">Награды</Badge>: Начисление +0.1 KAS на баланс пользователя за определенные действия (отзыв, покупка) и запись транзакции.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}