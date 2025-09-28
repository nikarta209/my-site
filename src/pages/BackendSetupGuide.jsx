import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  Database, 
  Code, 
  Download, 
  Play, 
  Settings, 
  Shield, 
  Cloud,
  Copy,
  CheckCircle
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
    <div className="relative bg-gray-900 rounded-lg p-4 overflow-x-auto">
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={copyToClipboard}
      >
        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="text-sm text-gray-100 whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function BackendSetupGuide() {
  const packageJsonCode = `{
  "name": "kasbook-backend",
  "version": "1.0.0",
  "description": "KASBOOK - Backend API for blockchain-based book marketplace",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint .",
    "seed": "node scripts/seedData.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1",
    "axios": "^1.5.1",
    "ipfs-http-client": "^60.0.1",
    "validator": "^13.11.0",
    "express-validator": "^7.0.1",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "nodemailer": "^6.9.7",
    "sharp": "^0.32.6",
    "pdf-parse": "^1.1.1",
    "epub-parser": "^0.2.6"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.51.0"
  }
}`;

  const serverJsCode = `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/kasbook', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://kasbook.fly.dev']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/users', require('./routes/users'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;

  const envCode = `# Database
DB_URI=mongodb://localhost:27017/kasbook

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Kaspa Blockchain
KAS_NODE_URL=https://api.kaspa.org
KAS_NETWORK=mainnet

# Features
ENABLE_REWARDS_SYSTEM=true
REWARDS_MINT_AMOUNT=0.1
PLATFORM_FEE_PERCENTAGE=5`;

  const dockerfileCode = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN addgroup -g 1001 -S kasbook && \\
    adduser -S kasbook -u 1001

USER kasbook

EXPOSE 5000

CMD ["node", "server.js"]`;

  const flyTomlCode = `app = "kasbook-backend"
primary_region = "fra"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "5000"

[[services]]
  internal_port = 5000
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443`;

  const userModelCode = `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['reader', 'author', 'admin'], 
    default: 'reader' 
  },
  balance_kas: { type: Number, default: 1000 },
  qualified_sales: { type: Number, default: 0 },
  author_tier: { 
    type: String, 
    default: 'Beginner' 
  },
  royalty_percentage: { 
    type: Number, 
    default: 80,
    min: 80,
    max: 90 
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);`;

  const authRouteCode = `const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, full_name, role });
    await user.save();

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;`;

  const setupSteps = [
    {
      title: "Создание проекта",
      commands: [
        "mkdir kasbook-backend",
        "cd kasbook-backend",
        "npm init -y"
      ]
    },
    {
      title: "Установка зависимостей",
      commands: [
        "npm install express mongoose jsonwebtoken bcryptjs dotenv cors helmet express-rate-limit multer axios validator express-validator compression morgan nodemailer sharp pdf-parse epub-parser",
        "npm install -D nodemon jest supertest eslint"
      ]
    },
    {
      title: "Настройка MongoDB",
      commands: [
        "# Локально:",
        "brew install mongodb/brew/mongodb-community",
        "brew services start mongodb/brew/mongodb-community",
        "",
        "# Или используйте MongoDB Atlas (облачная версия)"
      ]
    },
    {
      title: "Запуск сервера",
      commands: [
        "npm run dev  # для разработки",
        "npm start    # для продакшена"
      ]
    }
  ];

  const deploySteps = [
    {
      title: "Подготовка к деплою",
      description: "Установите Fly.io CLI и создайте аккаунт",
      commands: [
        "curl -L https://fly.io/install.sh | sh",
        "fly auth signup  # или fly auth login"
      ]
    },
    {
      title: "Инициализация проекта",
      description: "Создайте новое приложение на Fly.io",
      commands: [
        "fly launch",
        "# Выберите имя приложения и регион"
      ]
    },
    {
      title: "Настройка секретов",
      description: "Добавьте переменные окружения",
      commands: [
        "fly secrets set JWT_SECRET=your-secret-key",
        "fly secrets set DB_URI=mongodb://your-mongodb-uri",
        "fly secrets set NODE_ENV=production"
      ]
    },
    {
      title: "Деплой",
      description: "Разверните приложение",
      commands: [
        "fly deploy",
        "fly status  # проверить статус",
        "fly logs   # посмотреть логи"
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Server className="w-10 h-10 text-blue-600" />
          KASBOOK Backend Setup
        </h1>
        <p className="text-xl text-muted-foreground">
          Полное руководство по настройке Node.js backend для KASBOOK с MongoDB и развертыванием на Fly.io
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="setup">Настройка</TabsTrigger>
          <TabsTrigger value="code">Код</TabsTrigger>
          <TabsTrigger value="models">Модели</TabsTrigger>
          <TabsTrigger value="deploy">Деплой</TabsTrigger>
          <TabsTrigger value="docker">Docker</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Технологии
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="secondary">Node.js + Express</Badge>
                <Badge variant="secondary">MongoDB + Mongoose</Badge>
                <Badge variant="secondary">JWT Authentication</Badge>
                <Badge variant="secondary">File Upload (Multer)</Badge>
                <Badge variant="secondary">Rate Limiting</Badge>
                <Badge variant="secondary">Security (Helmet)</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Функции
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">✅ Регистрация/Авторизация</Badge>
                <Badge variant="outline">✅ Управление книгами</Badge>
                <Badge variant="outline">✅ Файловая система</Badge>
                <Badge variant="outline">✅ Tiered монетизация</Badge>
                <Badge variant="outline">✅ Система отзывов</Badge>
                <Badge variant="outline">✅ Аналитика</Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Архитектура API</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Endpoints:</h4>
                    <ul className="space-y-1 text-sm">
                      <li><code>/api/auth</code> - Аутентификация</li>
                      <li><code>/api/books</code> - Управление книгами</li>
                      <li><code>/api/users</code> - Пользователи</li>
                      <li><code>/api/purchases</code> - Покупки</li>
                      <li><code>/api/reviews</code> - Отзывы</li>
                      <li><code>/api/uploads</code> - Загрузка файлов</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Middlewares:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>✅ CORS configuration</li>
                      <li>✅ Rate limiting (100 req/min)</li>
                      <li>✅ Helmet security</li>
                      <li>✅ JSON body parsing</li>
                      <li>✅ JWT authentication</li>
                      <li>✅ Error handling</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Пошаговая настройка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {setupSteps.map((step, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-medium text-lg mb-2">
                      {index + 1}. {step.title}
                    </h3>
                    <CodeBlock code={step.commands.join('\n')} language="bash" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>package.json</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={packageJsonCode} language="json" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>.env настройки</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={envCode} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>server.js - Основной файл сервера</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={serverJsCode} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>routes/auth.js - Аутентификация</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={authRouteCode} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>models/User.js - Модель пользователя</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={userModelCode} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiered система роялти</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Система автоматически рассчитывает процент роялти на основе квалифицированных продаж:
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Уровни авторов:</h4>
                    <ul className="text-sm space-y-1">
                      <li>🥉 Beginner: 0-7 продаж → 80%</li>
                      <li>🥈 Starter: 8-19 продаж → 81%</li>
                      <li>🚀 Rising: 20-49 продаж → 82%</li>
                      <li>🥇 Bronze: 50-99 продаж → 83%</li>
                      <li>🏆 Bronze Pro: 100-499 продаж → 84%</li>
                      <li>⭐ Silver: 500-1499 продаж → 85%</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Высшие уровни:</h4>
                    <ul className="text-sm space-y-1">
                      <li>🌟 Silver Pro: 1500-4999 продаж → 86%</li>
                      <li>👑 Gold: 5000-19999 продаж → 87%</li>
                      <li>💎 Diamond: 20000-49999 продаж → 88%</li>
                      <li>🔥 Platinum: 50000-99999 продаж → 89%</li>
                      <li>🎯 Platinum Elite: 100000+ продаж → 90%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Развертывание на Fly.io
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {deploySteps.map((step, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-medium text-lg mb-1">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.description}
                    </p>
                    <CodeBlock code={step.commands.join('\n')} language="bash" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>fly.toml - Конфигурация Fly.io</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={flyTomlCode} language="toml" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docker" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dockerfile</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={dockerfileCode} language="dockerfile" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Docker команды</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={`# Сборка образа
docker build -t kasbook-backend .

# Запуск контейнера
docker run -p 5000:5000 --env-file .env kasbook-backend

# Запуск с MongoDB
docker run -d --name kasbook-mongo -p 27017:27017 mongo:latest
docker run -p 5000:5000 --link kasbook-mongo:mongo --env-file .env kasbook-backend`} language="bash" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Быстрый старт
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Для быстрого запуска выполните следующие команды:
            </p>
            <CodeBlock code={`# Создание проекта
mkdir kasbook-backend && cd kasbook-backend

# Инициализация npm
npm init -y

# Установка зависимостей
npm install express mongoose jsonwebtoken bcryptjs dotenv cors helmet express-rate-limit

# Создание основных файлов
touch server.js .env

# Запуск в режиме разработки
npm install -D nodemon
npm run dev`} language="bash" />
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm">
                💡 <strong>Совет:</strong> Используйте этот гайд как reference при создании backend. 
                Все необходимые файлы и настройки описаны выше.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}