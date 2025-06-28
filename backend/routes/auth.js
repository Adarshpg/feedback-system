const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../validation');

const router = express.Router();

// Unified error response helper
const handleError = (res, status = 500, message = 'Something went wrong', error = null) => {
  console.error(`[${new Date().toISOString()}] ❌ ${message}`, error || '');
  return res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? message : error?.message || message
  });
};

// ✅ Register Route
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, rollNumber, collegeName, contactNo, course, semester, password } = req.body;

    console.log(`🔐 Registering user: ${email} | ${new Date().toISOString()}`);

    // Validate input
    console.log('Received registration data:', JSON.stringify(req.body, null, 2));

    // Validate input
    const { error } = registerValidation(req.body);
    if (error) {
      console.error('Validation failed:', JSON.stringify(error.details, null, 2));
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Check if email or phone number already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { contactNo }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ success: false, message: 'Email already exists. Please use a different email address.' });
      }
      if (existingUser.contactNo === contactNo) {
        return res.status(400).json({ success: false, message: 'Phone number already exists. Please use a different phone number.' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const user = new User({
      fullName,
      email,
      rollNumber,
      collegeName,
      contactNo,
      course,
      semester,
      password: hashedPassword
    });

    const savedUser = await user.save();

    // Create JWT Token
    const token = jwt.sign(
      { _id: savedUser._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = savedUser.toObject();

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userWithoutPassword,
      token
    });

  } catch (err) {
    // Handle duplicate key error (E11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      let message = 'An error occurred during registration.';
      
      if (field === 'email') {
        message = 'This email is already registered. Please use a different email address.';
      } else if (field === 'contactNo') {
        message = 'This phone number is already in use. Please use a different phone number.';
      } else if (field === 'rollNumber') {
        message = 'This roll number is already registered. Please check your details or contact support.';
      }
      
      console.error(`❌ Duplicate key error for ${field}:`, err.keyValue);
      return res.status(400).json({ 
        success: false, 
        message,
        field
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    // Handle other errors
    console.error('Registration error:', err);
    return handleError(res, 500, 'Registration failed. Please try again later.', err);
  }
});

// ✅ Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    // Verify password
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    // Generate JWT
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (err) {
    return handleError(res, 500, 'Login failed', err);
  }
});

module.exports = router;
