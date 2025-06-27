require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection with enhanced logging
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    });
    
    console.log('MongoDB connected successfully');
    
    // Log when connected
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    // Log any errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    // Log when disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });
    
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
