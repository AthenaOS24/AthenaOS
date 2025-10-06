// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { models: { User } } = require('../config/demoDB');

module.exports = async function (req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findByPk(decoded.user.id);

        if (!req.user) {
            return res.status(401).json({ msg: 'User not found, authorization denied' });
        }

        next(); 
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};