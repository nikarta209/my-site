
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  Database, 
  Code, 
  ShieldCheck,
  Container,
  Copy,
  CheckCircle,
  FileJson,
  KeyRound,
  FileText,
  Settings,
  AlertTriangle,
  Route,
  Cog, // Added Cog icon
  Wrench, // Added Wrench icon
  FlaskConical // New icon for testing
} from 'lucide-react';
import { toast } from 'sonner';

const CodeBlock = ({ code, language = 'javascript', filename = '' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Код скопирован в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gray-900 rounded-lg p-4 my-4 overflow-x-auto">
      {filename && (
        <div className="text-sm text-gray-400 mb-2 border-b border-gray-700 pb-2">
          📁 {filename}
        </div>
      )}
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

export default function BackendInfrastructureGuide() {

  const packageJsonCode = `{
  "name": "kasbook-backend",
  "version": "1.0.0",
  "description": "Decentralized Book Platform Backend - KASBOOK",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --runInBand --detectOpenHandles --forceExit",
    "docker:build": "docker build -t kasbook-backend .",
    "docker:run": "docker run -p 5000:5000 kasbook-backend"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "csurf": "^1.11.0",
    "cookie-parser": "^1.4.6",
    "express-validator": "^7.0.1",
    "axios": "^1.6.0",
    "ipfs-http-client": "^60.0.1",
    "nowpayments-js": "^1.0.4",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "redis": "^4.6.12",
    "ioredis": "^5.3.2" 
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@shelf/jest-mongodb": "^4.2.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "jest": {
    "preset": "@shelf/jest-mongodb"
  }
}`;

  const envCode = `# =================================
# KASBOOK Backend Configuration
# =================================

# Server Configuration
PORT=5000
NODE_ENV=development
HOST=localhost

# Database
DB_URI=mongodb://localhost:27017/kasbook
DB_TEST_URI=mongodb://localhost:27017/kasbook_test

# Security & Authentication
JWT_SECRET=your_super_secret_jwt_string_minimum_32_characters_long
JWT_EXPIRE=7d
CSRF_SECRET=your_secret_for_csrf_protection_here

# Blockchain & Decentralization
KASPA_API_KEY=your_kaspa_rpc_api_key_here
KASPA_RPC_URL=https://api.kaspa.org
IPFS_NODE_URL=http://127.0.0.1:5001/api/v0
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Payment Processing
NOWPAYMENTS_KEY=your_nowpayments_api_key_here
NOWPAYMENTS_SANDBOX=true

# File Storage
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/kasbook.log

# Email Service (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis Cache
REDIS_URL=redis://127.0.0.1:6379

# Services API Keys
COPYLEAKS_API_KEY=your_copyleaks_api_key_here
`;

  const serverJsCode = `const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');

// Load environment variables
dotenv.config();

// Import custom modules
const connectDB = require('./config/db');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const marketRoutes = require('./routes/market');
const userRoutes = require('./routes/user');
const authorRoutes = require('./routes/author');
const adminRoutes = require('./routes/admin');
const rewardRoutes = require('./routes/rewards');
const uploadRoutes = require('./routes/uploads'); // Keep existing upload routes
const purchaseRoutes = require('./routes/purchases'); // Keep existing purchase routes
const paymentRoutes = require('./routes/payments'); // Keep existing payment routes

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy if behind reverse proxy (for accurate IP addresses)
app.set('trust proxy', 1);

// Compression middleware
app.use(compression());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.kaspa.org", "https://ipfs.io"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://kasbook.fly.dev', 'https://kasbook.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(\`Rate limit exceeded for IP: \${req.ip}\`);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: '15 minutes'
    });
  }
});
app.use('/api', limiter);

// CSRF Protection
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }
});
app.use(csrfProtection);

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Request logging
if (process.env.NODE_ENV !== 'test') {
  const morgan = require('morgan');
  app.use(morgan('combined', { 
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('./package.json').version
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/users', userRoutes); // Changed to users to maintain plural consistency
app.use('/api/authors', authorRoutes); // Changed to authors to maintain plural consistency
app.use('/api/admin', adminRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/uploads', uploadRoutes); // Keep existing
app.use('/api/purchases', purchaseRoutes); // Keep existing
app.use('/api/payments', paymentRoutes); // Keep existing

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(\`KASBOOK Server running in \${process.env.NODE_ENV} mode on port \${PORT}\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app;`;

  const dbCode = `const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    logger.info(\`✅ MongoDB Connected: \${conn.connection.host}\`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful close on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;`;

  const loggerCode = `const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return \`\${timestamp} [\${level.toUpperCase()}]: \${stack || message}\`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'kasbook-backend' },
  transports: [
    // Write errors to error.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || path.join(__dirname, '../logs/kasbook.g'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;`;

  const errorHandlerCode = `const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(\`\${err.message} - \${req.method} \${req.originalUrl} - \${req.ip}\`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    const message = 'Invalid CSRF token';
    error = { message, statusCode: 403 };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;`;

  const dockerfileCode = `# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache \\
    dumb-init \\
    && addgroup -g 1001 -S kasbook \\
    && adduser -S kasbook -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs && chown -R kasbook:kasbook /usr/src/app

# Switch to non-root user
USER kasbook

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node healthcheck.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]`;

  const multerConfigCode = `const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'misc';
    
    if (file.fieldname === 'cover') subfolder = 'covers';
    else if (file.fieldname.startsWith('book_')) subfolder = 'books';
    
    const fullPath = path.join(uploadDir, subfolder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, \`\${file.fieldname}-\${uniqueSuffix}\${path.extname(file.originalname)}\`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'cover') {
    // Only allow images for covers
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Cover must be an image file'), false);
    }
  } else if (file.fieldname.startsWith('book_')) {
    // Only allow PDF and EPUB for books
    const allowedMimes = ['application/pdf', 'application/epub+zip'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Book files must be PDF or EPUB'), false);
    }
  }
  cb(null, true);
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    files: 21 // Max 20 language files + 1 cover
  }
});

module.exports = upload;`;

  const authMiddlewareCode = `const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming you have a User model
const logger = require('../config/logger'); // Assuming you have a logger config

// Protect routes - checks for JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token, return 401 Unauthorized
  if (!token) {
    logger.warn('Access denied: No token provided');
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to the request object
    req.user = await User.findById(decoded.id).select('-password');

    // If user not found, return 401 Unauthorized
    if (!req.user) {
        logger.warn(\`Access denied: User with ID \${decoded.id} not found\`);
        return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (err) {
    logger.error('JWT verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      logger.warn(\`Access denied: User '\${req.user.id}' with role '\${req.user.role}' attempted to access restricted route\`);
      return res.status(403).json({ 
        success: false, 
        message: \`User role '\${req.user.role}' is not authorized to access this route\`
      });
    }
    next();
  };
};`;
  
  const authRoutesCode = `// routes/auth.js
const express = require('express');
const { register, login, getProfile } = require('../controllers/authController'); // Assuming authController exists
const { protect } = require('../middleware/auth'); // Auth middleware for JWT protection

const router = express.Router();

router.post('/register', register); // Public route for user registration
router.post('/login', login);       // Public route for user login
router.get('/profile', protect, getProfile); // Protected route to get user profile

module.exports = router;`;
  
  const bookRoutesCode = `// routes/books.js
const express = require('express');
const { searchBooks, uploadBook, getBookById } = require('../controllers/bookController'); // Assuming bookController
const { protect, authorize } = require('../middleware/auth'); // Auth middleware
const { upload } = require('../config/multer'); // Assuming multer setup is in config/multer.js

const router = express.Router();

router.get('/', searchBooks); // Public route: search all available books
router.get('/:id', getBookById); // Public route: get a specific book by ID

// Protected route for uploading a new book, only authors can do this
router.post(
  '/upload', 
  protect, 
  authorize('author'), 
  upload.fields([
    { name: 'cover', maxCount: 1 }, // Book cover image
    { name: 'book_en', maxCount: 1 }, // English version of the book file
    { name: 'book_es', maxCount: 1 }, // Spanish version, etc.
    { name: 'book_de', maxCount: 1 }
  ]), 
  uploadBook
);

module.exports = router;`;

  const marketRoutesCode = `// routes/market.js
const express = require('express');
const { listBookForResale, buyBookBatch } = require('../controllers/marketController'); // Assuming marketController
const { protect } = require('../middleware/auth'); // Auth middleware for JWT protection
const router = express.Router();

// Protected route to list a purchased book for resale on the secondary market
router.post('/list', protect, listBookForResale);

// Protected route to buy a batch of books (e.g., from an author or another user)
router.post('/buy', protect, buyBookBatch);

module.exports = router;`;
  
  const userRoutesCode = `// routes/user.js
const express = require('express');
const { getLibrary, addHighlight, getRecommendations } = require('../controllers/userController'); // Assuming userController
const { protect } = require('../middleware/auth'); // Auth middleware for JWT protection
const router = express.Router();

// Protected route to get the current user's book library
router.get('/library', protect, getLibrary);

// Protected route to add a highlight or note to a book
router.post('/highlights', protect, addHighlight);

// Protected route to get personalized book recommendations for the user
router.get('/recommendations', protect, getRecommendations);

module.exports = router;`;

  const authorRoutesCode = `// routes/author.js
const express = require('express');
const { getAnalytics, withdrawFunds } = require('../controllers/authorController'); // Assuming authorController
const { protect, authorize } = require('../middleware/auth'); // Auth middleware for JWT protection and role authorization
const router = express.Router();

// Protected route for authors to view their book sales analytics
router.get('/analytics', protect, authorize('author'), getAnalytics);

// Protected route for authors to withdraw their earnings
router.post('/withdraw', protect, authorize('author'), withdrawFunds);

module.exports = router;`;

  const adminRoutesCode = `// routes/admin.js
const express = require('express');
const { moderateBook, exportAnalytics } = require('../controllers/adminController'); // Assuming adminController
const { protect, authorize } = require('../middleware/auth'); // Auth middleware for JWT protection and role authorization
const router = express.Router();

// Protected route for administrators to moderate book content (e.g., approve, reject)
router.post('/moderate', protect, authorize('admin'), moderateBook);

// Protected route for administrators to export system-wide analytics data
router.get('/analytics/export', protect, authorize('admin'), exportAnalytics);

module.exports = router;`;

  const rewardsRoutesCode = `// routes/rewards.js
const express = require('express');
const { claimReward } = require('../controllers/rewardsController'); // Assuming rewardsController
const { protect } = require('../middleware/auth'); // Auth middleware for JWT protection
const router = express.Router();

// Protected route for users to claim their earned rewards
router.post('/claim', protect, claimReward);

module.exports = router;`;

  const redisConfigCode = `// config/redis.js
const { createClient } = require('redis');
const logger = require('./logger'); // Assuming a logger is available

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => logger.error('Redis Client Error', err));

(async () => {
  await client.connect();
  logger.info('✅ Redis Connected...');
})();

module.exports = client;`;

  const kaspaServiceCode = `// services/kaspaService.js
// Mock service using RPC calls

exports.validateWallet = async (address) => {
  // Mock: In reality, call Kaspa RPC to check if address is valid
  console.log(\`Validating KAS address: \${address}\`);
  return address.startsWith('kaspa:');
};

exports.mintNFTForBook = async (bookId, ownerAddress) => {
  // Mock: Simulate minting an NFT for a book purchase
  const nftId = \`kas-nft-\${bookId}-\${Date.now()}\`;
  console.log(\`Minted NFT \${nftId} for book \${bookId} to \${ownerAddress}\`);
  return { success: true, nftId };
};

exports.transferRoyalties = async (transaction) => {
  // Mock: "Smart contract" logic for royalty split
  console.log(\`Transferring \${transaction.royaltySplit.author} KAS to author and \${transaction.royaltySplit.platform} KAS to platform.\`);
  return { success: true, txHash: \`kas_tx_royalties_\${Date.now()}\` };
};`;
  
  const ipfsServiceCode = `// services/ipfsService.js
const { create } = require('ipfs-http-client');
const fs = require('fs'); // Added fs import

const client = create({ url: process.env.IPFS_NODE_URL });

exports.addFileToIpfs = async (filePath) => {
  const file = fs.readFileSync(filePath);
  const { cid } = await client.add(file);
  return cid.toString();
};

exports.getFileFromIpfs = async (cid) => {
  const stream = client.cat(cid);
  // ... logic to handle stream (e.g., pipe to file or process chunks) ...
  // Example: return new Promise((resolve, reject) => {
  //   const chunks = [];
  //   stream.on('data', (chunk) => chunks.push(chunk));
  //   stream.on('end', () => resolve(Buffer.concat(chunks)));
  //   stream.on('error', reject);
  // });
  return stream;
};`;

  const paymentServiceCode = `// services/paymentService.js
const NOWPaymentsApi = require('nowpayments-js');

const np = new NOWPaymentsApi({ apiKey: process.env.NOWPAYMENTS_KEY });

exports.createKasPayment = async (amount, orderId) => {
  return await np.createPayment({
    price_amount: amount,
    price_currency: 'usd', // Or calculate from KAS
    pay_currency: 'kas',
    order_id: orderId
  });
};

exports.processWithdrawal = async (amountKAS, toAddress) => {
  const fee = amountKAS * 0.03; // 3% fee
  const netAmount = amountKAS - fee;
  // ... logic to initiate payout via NOWPayments (e.g., using np.createPayout) ...
  // For example:
  // await np.createPayout({
  //   address: toAddress,
  //   amount: netAmount,
  //   currency: 'kas'
  // });
  return { success: true, netAmount, fee };
};`;
  
  const ratesServiceCode = `// services/ratesService.js
const axios = require('axios');
const redisClient = require('../config/redis'); // Assuming redis config exports a client

const CACHE_EXPIRATION = 3600; // 1 hour in seconds

exports.getKasUsdRate = async () => {
  const cacheKey = 'kas_usd_rate';

  // 1. Check cache first
  const cachedRate = await redisClient.get(cacheKey);
  if (cachedRate) {
    return JSON.parse(cachedRate);
  }

  // 2. If not in cache, fetch from backend API
  const response = await axios.get('/api/rate');
  const rate = response.data.rate ?? response.data?.kaspa?.usd;

  // 3. Store in cache with expiration
  await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(rate));

  return rate;
};`;
  
  const utilsCode = `// utils/royaltyUtils.js
const { getKasUsdRate } = require('../services/ratesService');

exports.isQualifiedSale = async (priceKAS) => {
  const rate = await getKasUsdRate();
  return (priceKAS * rate) >= 5; // Check if sale is >= $5 USD
};

exports.calculateRoyaltySplit = (book, salePrice, qualifiedSalesCount) => {
  let authorPercentage;
  
  // Tiered system for primary sales
  if (qualifiedSalesCount >= 100001) authorPercentage = 90;
  else if (qualifiedSalesCount >= 50001) authorPercentage = 89;
  else if (qualifiedSalesCount >= 10001) authorPercentage = 88;
  else if (qualifiedSalesCount >= 5001) authorPercentage = 87;
  else if (qualifiedSalesCount >= 1001) authorPercentage = 85;
  else if (qualifiedSalesCount >= 101) authorPercentage = 82;
  else authorPercentage = 80;

  const authorCut = (salePrice * authorPercentage) / 100;
  const platformCut = salePrice - authorCut;
  
  return { author: authorCut, platform: platformCut };
};

exports.calculateResaleSplit = (salePrice) => {
  const originalAuthorCut = salePrice * 0.05; // 5% to original author
  const sellerCut = salePrice * 0.92; // 92% to reseller
  const platformCut = salePrice * 0.03; // 3% to platform
  return { originalAuthor: originalAuthorCut, seller: sellerCut, platform: platformCut };
};`;

  const jestConfigCode = `// jest.config.js
module.exports = {
  testEnvironment: 'node',
  preset: '@shelf/jest-mongodb',
  watchPathIgnorePatterns: ['globalConfig'], // Required by jest-mongodb preset
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 10000,
};`;

  const testSetupCode = `// tests/setup.js
const mongoose = require('mongoose');

// Silence console logs during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Disconnect from Mongoose after all tests
afterAll(async () => {
  await mongoose.disconnect();
});`;

  const unitTestCode = `// tests/unit/royaltyUtils.test.js
const { calculateRoyaltySplit } = require('../../utils/royaltyUtils');
const ratesService = require('../../services/ratesService');

// Mock the rates service to isolate the utility function
jest.mock('../../services/ratesService');

describe('Royalty Calculation Utility', () => {
  it('should calculate correct royalty for beginner tier', () => {
    const salePrice = 100; // KAS
    const qualifiedSalesCount = 5;
    const split = calculateRoyaltySplit({}, salePrice, qualifiedSalesCount);
    
    expect(split.author).toBe(80); // 80% for beginner
    expect(split.platform).toBe(20);
  });

  it('should calculate correct royalty for top tier', () => {
    const salePrice = 100; // KAS
    const qualifiedSalesCount = 150000;
    const split = calculateRoyaltySplit({}, salePrice, qualifiedSalesCount);

    expect(split.author).toBe(90); // 90% for platinum elite
    expect(split.platform).toBe(10);
  });
});`;

  const integrationTestCode = `// tests/integration/auth.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User'); // Assuming you have this model

// Setup a minimal express app for testing
// NOTE: For full integration tests, you'd typically import the main 'app' from server.js
// For this example, we're simulating a small part of it for clarity.
const app = express();
app.use(express.json());
// Mock a simple auth controller and route for testing purposes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, walletAddress } = req.body;
    // Basic validation (replace with actual validation in a real app)
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    // Create new user (password hashing omitted for brevity in mock)
    const newUser = await User.create({ email, password, fullName, walletAddress });
    // Simulate JWT token generation
    const token = 'mock_jwt_token_for_' + newUser._id;
    res.status(201).json({ success: true, token, user: { id: newUser._id, email: newUser.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


describe('Auth API Routes', () => {

  beforeEach(async () => {
    // Clear the User collection before each test
    await User.deleteMany({});
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        walletAddress: 'kaspa:testwalletaddress123'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.success).toBe(true);
  });

  it('should fail to register with a duplicate email', async () => {
    // First, create a user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        walletAddress: 'kaspa:testwalletaddress123'
      });

    // Then, try to register again with the same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Another User',
        walletAddress: 'kaspa:anotherwallet'
      });

    expect(res.statusCode).toEqual(400); // Or whatever status code your controller returns for duplicates
    expect(res.body.message).toContain('User already exists');
  });
});`;
  
  const bookUploadTestCode = `// tests/integration/books.test.js
const request = require('supertest');
const app = require('../../server'); // Assuming you export your app from server.js
const plagiarismService = require('../../services/plagiarismService'); // Make sure this path is correct
const ipfsService = require('../../services/ipfsService'); // Make sure this path is correct
const path = require('path');
const User = require('../../models/User'); // Assuming a User model
const jwt = require('jsonwebtoken'); // To create a mock token

// Mock external services
jest.mock('../../services/plagiarismService');
jest.mock('../../services/ipfsService');

describe('Book Upload Flow', () => {
  let adminToken;
  let authorToken;
  let userId;

  // Setup mock user and tokens for tests
  beforeAll(async () => {
    // Ensure the User model exists and DB is connected if running standalone
    // This is a minimal setup for illustration, in real tests you'd manage DB state more robustly
    await User.deleteMany({}); // Clear users before tests
    const authorUser = await User.create({
      email: 'author@example.com',
      password: 'password123', // In real app, hash this
      fullName: 'Test Author',
      role: 'author',
      walletAddress: 'kaspa:mockauthoraddress'
    });
    authorToken = jwt.sign({ id: authorUser._id, role: authorUser.role }, process.env.JWT_SECRET || 'your_super_secret_jwt_string_minimum_32_characters_long', { expiresIn: '1h' });
    userId = authorUser._id;
  });

  // Clean up after tests if necessary
  afterAll(async () => {
    await User.deleteMany({});
  });

  it('should reject upload if plagiarism is detected', async () => {
    // Mock the plagiarism check to return true
    plagiarismService.checkPlagiarism.mockResolvedValue({
      isPlagiarized: true,
      reportUrl: 'http://example.com/report/123'
    });
    // Ensure IPFS service is not called if plagiarism is detected
    ipfsService.addFileToIpfs.mockClear();

    const res = await request(app)
      .post('/api/books/upload')
      .set('Authorization', \`Bearer \${authorToken}\`)
      .field('title', 'Plagiarized Book')
      .field('authorId', userId.toString()) // Assuming authorId is sent from frontend
      .field('description', 'This is a plagiarized book.')
      .attach('cover', path.resolve(__dirname, '../fixtures/cover.png')) // Use path.resolve for fixture
      .attach('book_en', path.resolve(__dirname, '../fixtures/dummy.pdf')); // Use path.resolve for fixture

    expect(res.statusCode).toEqual(400); // Or specific plagiarism error code
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Plagiarism detected');
    expect(ipfsService.addFileToIpfs).not.toHaveBeenCalled(); // Ensure IPFS was not called
  });

  it('should successfully upload a book if no plagiarism is detected', async () => {
    // Mock the plagiarism check to return false
    plagiarismService.checkPlagiarism.mockResolvedValue({
      isPlagiarized: false,
      reportUrl: null
    });
    // Mock IPFS upload
    ipfsService.addFileToIpfs.mockResolvedValue('mock_ipfs_cid');

    const res = await request(app)
      .post('/api/books/upload')
      .set('Authorization', \`Bearer \${authorToken}\`)
      .field('title', 'Original Book')
      .field('authorId', userId.toString())
      .field('description', 'This is an original book.')
      .attach('cover', path.resolve(__dirname, '../fixtures/cover.png'))
      .attach('book_en', path.resolve(__dirname, '../fixtures/dummy.pdf'));

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Book uploaded successfully');
    expect(ipfsService.addFileToIpfs).toHaveBeenCalledTimes(2); // Once for cover, once for book file
    expect(res.body.book).toHaveProperty('title', 'Original Book');
  });
});`;


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-6 h-6" />
            Гайд по Backend: Тестирование с Jest и Supertest
          </CardTitle>
          <CardDescription>
            Полная настройка производственного Node.js/Express сервера с безопасностью, логированием и поддержкой Docker
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Важно:</strong> Перед запуском создайте директории <code>config/</code>, <code>middleware/</code>, <code>routes/</code>, <code>logs/</code> и <code>uploads/</code> в корне проекта.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="services" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="server"><Server className="w-4 h-4 mr-2"/>Server</TabsTrigger>
          <TabsTrigger value="env"><KeyRound className="w-4 h-4 mr-2"/>.env</TabsTrigger>
          <TabsTrigger value="routes"><Route className="w-4 h-4 mr-2"/>API Routes</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck className="w-4 h-4 mr-2"/>Middleware</TabsTrigger>
          <TabsTrigger value="services"><Cog className="w-4 h-4 mr-2"/>Services & Utils</TabsTrigger>
          <TabsTrigger value="testing"><FlaskConical className="w-4 h-4 mr-2"/>Тесты</TabsTrigger>
        </TabsList>

        <TabsContent value="server">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Основной сервер
              </CardTitle>
              <CardDescription>
                Точка входа с полной настройкой middleware, безопасности, CORS, rate limiting и CSRF защиты.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={serverJsCode} filename="server.js" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="env">
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Переменные окружения
              </CardTitle>
               <CardDescription>Файл с переменными окружения для конфигурации и безопасности. <strong>Никогда не коммитьте файл .env!</strong></CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={envCode} language="shell" filename=".env" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Структура API маршрутов
              </CardTitle>
              <CardDescription>Определение эндпоинтов API и их привязка к контроллерам. Роуты защищены с помощью middleware.</CardDescription>
            </CardHeader>
            <CardContent>
                <CodeBlock code={authRoutesCode} filename="routes/auth.js" />
                <CodeBlock code={bookRoutesCode} filename="routes/books.js" />
                <CodeBlock code={marketRoutesCode} filename="routes/market.js" />
                <CodeBlock code={userRoutesCode} filename="routes/user.js" />
                <CodeBlock code={authorRoutesCode} filename="routes/author.js" />
                <CodeBlock code={adminRoutesCode} filename="routes/admin.js" />
                <CodeBlock code={rewardsRoutesCode} filename="routes/rewards.js" />
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>GraphQL:</strong> Для сложных запросов, таких как система рекомендаций, можно опционально добавить эндпоинт <code>/graphql</code>, используя <code>apollo-server-express</code>. Это позволит фронтенду запрашивать только необходимые данные одним запросом.
                  </AlertDescription>
                </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Защитные Middleware
              </CardTitle>
              <CardDescription>Функции для проверки JWT токена и прав доступа на основе ролей пользователей.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={authMiddlewareCode} filename="middleware/auth.js" />
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Дополнительно создайте:</h4>
                <CodeBlock code={multerConfigCode} filename="config/multer.js" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cog className="w-5 h-5" />
                        Сервисы и Утилиты
                    </CardTitle>
                    <CardDescription>
                        Абстрактные модули для работы с внешними API и для выполнения бизнес-логики.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold text-lg mb-2 flex items-center"><Cog className="w-5 h-5 mr-2 text-primary"/>Сервисы</h3>
                    <CodeBlock code={redisConfigCode} filename="config/redis.js" />
                    <CodeBlock code={ratesServiceCode} filename="services/ratesService.js" />
                    <CodeBlock code={kaspaServiceCode} filename="services/kaspaService.js" />
                    <CodeBlock code={ipfsServiceCode} filename="services/ipfsService.js" />
                    <CodeBlock code={paymentServiceCode} filename="services/paymentService.js" />
                    
                    <h3 className="font-semibold text-lg mt-6 mb-2 flex items-center"><Wrench className="w-5 h-5 mr-2 text-primary"/>Утилиты</h3>
                    <CodeBlock code={utilsCode} filename="utils/royaltyUtils.js" />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="testing">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FlaskConical className="w-5 h-5" />
                        Тестирование с Jest и Supertest
                    </CardTitle>
                    <CardDescription>
                        Обеспечение надежности и стабильности бэкенда через unit- и integration-тесты.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold text-lg mb-2">Настройка окружения</h3>
                    <CodeBlock code={packageJsonCode} filename="package.json" />
                    <CodeBlock code={jestConfigCode} filename="jest.config.js" />
                    <CodeBlock code={testSetupCode} filename="tests/setup.js" />

                    <h3 className="font-semibold text-lg mt-6 mb-2">Unit-тесты</h3>
                    <CodeBlock code={unitTestCode} filename="tests/unit/royaltyUtils.test.js" />

                    <h3 className="font-semibold text-lg mt-6 mb-2">Integration-тесты</h3>
                    <CodeBlock code={integrationTestCode} filename="tests/integration/auth.test.js" />
                    <CodeBlock code={bookUploadTestCode} filename="tests/integration/books.test.js" />
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
