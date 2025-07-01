const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
    console.log('Auth Middleware - Request Headers:', req.headers);
    
    // Get token from Authorization header (Bearer scheme) or fallback to auth-token header
    const authHeader = req.header('Authorization');
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('Token from Authorization header:', token ? '***' + token.slice(-8) : 'Not found');
    } else {
        token = req.header('auth-token');
        console.log('Token from auth-token header:', token ? '***' + token.slice(-8) : 'Not found');
    }
    
    if (!token) {
        console.error('No token provided in request');
        return res.status(401).json({ 
            error: 'Access Denied', 
            details: 'No token provided' 
        });
    }

    try {
        console.log('Verifying token with secret:', process.env.JWT_SECRET ? '***' + process.env.JWT_SECRET.slice(-4) : 'Using default secret');
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Token verified successfully, user ID:', verified._id);
        
        const user = await User.findById(verified._id);
        if (!user) {
            console.error('User not found for ID:', verified._id);
            return res.status(401).json({ 
                error: 'Authentication Failed', 
                details: 'User not found' 
            });
        }
        
        console.log('User authenticated successfully:', user.email);
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Authentication Failed', 
                details: 'Token has expired' 
            });
        }
        res.status(400).json({ 
            error: 'Invalid Token',
            details: 'The authentication token is invalid or malformed'
        });
    }
};
