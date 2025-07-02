const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
    console.log('Auth middleware running...');
    
    // Check for token in headers
    const token = req.header('x-auth-token') || req.header('auth-token');
    
    console.log('Received token:', token ? 'Token exists' : 'No token found');
    
    if (!token) {
        console.log('Access denied - No token provided');
        return res.status(401).json({ 
            success: false, 
            error: 'Access Denied - No token provided' 
        });
    }

    try {
        console.log('Verifying token...');
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        console.log('Using JWT secret:', jwtSecret ? 'Set' : 'Not set');
        const verified = jwt.verify(token, jwtSecret);
        console.log('Token verified for user ID:', verified._id);
        
        const user = await User.findById(verified._id);
        if (!user) {
            console.log('User not found in database');
            return res.status(401).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        req.user = user;
        console.log('User authenticated successfully:', user.email);
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(400).json({ 
            success: false, 
            error: 'Invalid Token',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};
