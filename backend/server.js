require('dotenv').config({ path: '.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');

// Import routes
const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');

// Initialize express app
const app = express();

// Trust proxy for production
app.set('trust proxy', 1);

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ Required environment variable ${env} is not set`);
    process.exit(1);
  }
});

// Enable CORS
const corsOptions = {
  origin: [
    'https://feedback.medinitechnologies.in', // Render backend URL
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 600
};

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [] // Add any parameters you want to whitelist
}));

// Compress all responses
app.use(compression());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Log environment info
console.log('🚀 Starting server...');
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ NOT SET'}`);
console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ NOT SET'}`);

// Database connection with enhanced error handling
const connectDB = async (retryCount = 0) => {
  const maxRetries = 5;
  const retryDelay = 5000;

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log(`🔌 Attempting to connect to MongoDB (Attempt ${retryCount + 1}/${maxRetries})...`);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    
    if (retryCount < maxRetries - 1) {
      console.log(`⏳ Retrying connection in ${retryDelay / 1000} seconds...`);
      setTimeout(() => connectDB(retryCount + 1), retryDelay);
    } else {
      console.error('❌ Max retries reached. Could not connect to MongoDB.');
      process.exit(1);
    }
  }
};

// MongoDB event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('ℹ️  Mongoose disconnected from MongoDB');
});

// Initial connection
connectDB();

// Test route
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const status = dbStatus === 'connected' ? 'healthy' : 'unhealthy';
  
  res.status(200).json({
    status,
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(staticPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error loading the application');
      }
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Server URL: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated!');
    process.exit(0);
  });
});

// Handle process exit
process.on('exit', (code) => {
  console.log(`Process exiting with code ${code}`);
  mongoose.connection.close();
});

module.exports = app;