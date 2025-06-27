const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../validation');

// Helper function to handle errors
const handleError = (res, status, message, error = null) => {
  console.error(`[${new Date().toISOString()}] ${message}`, error || '');
  return res.status(status).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' 
      ? message 
      : error?.message || message 
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { 
      email: req.body.email,
      time: new Date().toISOString() 
    });

    // Validate data
    const { error } = registerValidation(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    // Check if user already exists
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create user
    const user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      rollNumber: req.body.rollNumber,
      collegeName: req.body.collegeName,
      contactNo: req.body.contactNo,
      course: req.body.course,
      semester: req.body.semester,
      password: hashedPassword
    });

    const savedUser = await user.save();
    
    // Create token
    const token = jwt.sign(
      { _id: savedUser._id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Don't send password back
    const { password, ...userWithoutPassword } = savedUser.toObject();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userWithoutPassword,
      token
    });

  } catch (err) {
    return handleError(
      res, 
      500, 
      'Registration failed', 
      err
    );
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    // Validate data
    const { error } = loginValidation(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    // Check if email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' // Generic message for security
      });
    }

    // Check password
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' // Generic message for security
      });
    }

    // Create token
    const token = jwt.sign(
      { _id: user._id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Don't send password back
    const { password, ...userWithoutPassword } = user.toObject();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (err) {
    return handleError(
      res, 
      500, 
      'Login failed', 
      err
    );
  }
});

module.exports = router;