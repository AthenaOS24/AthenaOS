// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Lấy token từ header của yêu cầu
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Kiểm tra nếu không có token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Giải mã token để lấy payload (chứa id của user)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tìm user trong DB từ id trong token và gán vào request
        // loại trừ trường password
        req.user = await User.findByPk(decoded.user.id, {
            attributes: { exclude: ['password'] }
        });

        // Nếu user không còn tồn tại
        if (!req.user) {
            return res.status(401).json({ msg: 'User not found, authorization denied' });
        }

        next(); // Chuyển sang bước tiếp theo (hàm controller)
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};