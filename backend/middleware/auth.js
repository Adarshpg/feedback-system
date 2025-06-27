const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET || 'your-secret-key');
        const user = await User.findById(verified._id);
        if (!user) return res.status(401).send('User not found');
        
        req.user = user;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};
