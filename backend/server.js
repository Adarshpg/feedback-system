require('dotenv').config({ path: '.env' });
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');
const uploadRoutes = require('./routes/upload'); // ✅ Merged route
const adminRoutes = require('./routes/admin'); // ✅ Admin routes

const app = express();
app.set('trust proxy', 1);

// ✅ Validate required environment variables
['MONGODB_URI', 'JWT_SECRET'].forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ Required environment variable ${env} is not set`);
    process.exit(1);
  }
});

// ✅ CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'https://feedback.medinitechnologies.in',
      'https://feedback-system-2af6.vercel.app',
      'https://feedback-system.vercel.app',
      'https://feedback-system-*.vercel.app',
      'https://*.vercel.app',
      'https://*.netlify.app',
    ];
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp(allowedOrigin.replace(/\*/g, '.*'));
        return regex.test(origin);
      }
      return origin === allowedOrigin;
    });

    if (!isAllowed) {
      console.warn(`⚠️  CORS blocked request from: ${origin}`);
      return callback(new Error(`CORS blocked request from: ${origin}`), false);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'auth-token'],
  exposedHeaders: ['x-auth-token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ Middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: [] }));
app.use(compression());

// ✅ Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ✅ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, try again later'
});
app.use('/api', limiter);

// ✅ Logging env
console.log('🚀 Starting server...');
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ NOT SET'}`);
console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ NOT SET'}`);

// ✅ MongoDB connection
const connectDB = async (retryCount = 0) => {
  const maxRetries = 5;
  const retryDelay = 5000;

  try {
    console.log(`🔌 Connecting to MongoDB (Attempt ${retryCount + 1}/${maxRetries})...`);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error(`❌ MongoDB error: ${err.message}`);
    if (retryCount < maxRetries - 1) {
      console.log(`⏳ Retrying in ${retryDelay / 1000}s...`);
      setTimeout(() => connectDB(retryCount + 1), retryDelay);
    } else {
      console.error('❌ Max retries reached');
      process.exit(1);
    }
  }
};

mongoose.connection.on('connected', () => console.log('✅ Mongoose connected'));
mongoose.connection.on('error', err => console.error(`❌ Mongoose error: ${err.message}`));
mongoose.connection.on('disconnected', () => console.log('ℹ️  Mongoose disconnected'));
connectDB();

// ✅ Routes
app.get('/api/test', (req, res) => res.status(200).json({ status: 'success', message: 'API is working!', timestamp: new Date().toISOString() }));

// ✅ Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ✅ Uploads route

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api', uploadRoutes); // ✅ Route registered
app.use('/api/admin', adminRoutes); // ✅ Admin routes registered

// ✅ OPTIONS preflight support
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-auth-token, Authorization');
  res.status(200).end();
});

// ✅ Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// ✅ 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ status: 'error', message: `Cannot ${req.method} ${req.originalUrl}` });
});

// ✅ Production static files
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'), err => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error loading the app');
      }
    });
  });
}

// ✅ Error handling
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err }),
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ✅ Exit & error signals
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', err => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated');
    process.exit(0);
  });
});

process.on('exit', code => {
  console.log(`👋 Process exiting with code ${code}`);
  mongoose.connection.close();
});

module.exports = app;
