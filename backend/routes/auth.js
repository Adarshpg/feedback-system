const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../validation');

// Register
router.post('/register', async (req, res) => {
    // Validate data
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Check if user already exists
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).send('Email already exists');

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

    try {
        const savedUser = await user.save();
        res.send({ user: user._id });
    } catch (err) {
        res.status(400).send(err);
    }
});

// Login
router.post('/login', async (req, res) => {
    // Validate data
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Check if email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Email is not found');

    // Check password
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    // Create and assign token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET || 'your-secret-key');
    res.header('auth-token', token).send({ token, userId: user._id });
});

module.exports = router;
