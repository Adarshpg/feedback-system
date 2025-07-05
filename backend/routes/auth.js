const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const twilio = require('twilio');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../validation');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilio(accountSid, authToken);

// In-memory store for OTPs (in production, use Redis or similar)
const otpStore = new Map();

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

// Generate and send OTP for password reset
router.post('/request-password-reset', async (req, res) => {
  try {
    const { contactNo } = req.body;

    // Validate phone number
    if (!contactNo || !/^\d{10}$/.test(contactNo)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ contactNo });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this phone number' 
      });
    }

    // Generate OTP (6 digits, numbers only)
    const otp = otpGenerator.generate(6, { 
      digits: true,
      lowerCaseAlphabets: false, 
      upperCaseAlphabets: false, 
      specialChars: false 
    });

    // Store OTP with expiration (5 minutes)
    otpStore.set(contactNo, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // In production, uncomment this to send OTP via SMS
    /*
    try {
      await twilioClient.messages.create({
        body: `Your OTP for password reset is: ${otp}. Valid for 5 minutes.`,
        from: twilioPhoneNumber,
        to: `+91${contactNo}` // Assuming Indian numbers, adjust as needed
      });
    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      return handleError(res, 500, 'Failed to send OTP. Please try again later.');
    }
    */

    // For development, return OTP in response
    console.log(`OTP for ${contactNo}: ${otp}`);

    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // Remove in production
      otp
    });

  } catch (err) {
    return handleError(res, 500, 'Failed to process request', err);
  }
});

// Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { contactNo, otp, newPassword } = req.body;

    // Validate input
    if (!contactNo || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number, OTP, and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if OTP exists and is valid
    const otpData = otpStore.get(contactNo);
    if (!otpData) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP not found or expired. Please request a new OTP.' 
      });
    }

    // Check if OTP is expired
    if (otpData.expiresAt < Date.now()) {
      otpStore.delete(contactNo);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP. Please try again.' 
      });
    }

    // Find user
    const user = await User.findOne({ contactNo });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Clear OTP after successful password reset
    otpStore.delete(contactNo);

    res.json({ 
      success: true, 
      message: 'Password reset successful. You can now login with your new password.' 
    });

  } catch (err) {
    return handleError(res, 500, 'Failed to reset password', err);
  }
});

module.exports = router;
