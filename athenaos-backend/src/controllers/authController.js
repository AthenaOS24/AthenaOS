// src/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Kiểm tra xem email đã tồn tại chưa
        let emailExists = await User.findOne({ where: { email } });
        if (emailExists) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // 2. (Cải tiến) Kiểm tra xem username đã tồn tại chưa
        let usernameExists = await User.findOne({ where: { username } });
        if (usernameExists) {
            return res.status(400).json({ msg: 'User with this username already exists' });
        }

        // 3. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Tạo user mới trong database
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        // 5. Trả về thông báo thành công
        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};


// ... (hàm 'register' của bạn ở trên)
// Hàm đăng nhập
exports.login = async (req, res) => {
    
    const { email, password } = req.body;

    try {
        // 1. Tìm user bằng email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' }); // Không tìm thấy user
        }

        // 2. So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' }); // Sai mật khẩu
        }

        // 3. Tạo và trả về JWT
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' }, // Token có hạn trong 5 giờ
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Thêm hàm này vào cuối file authController.js
exports.getMe = async (req, res) => {
    // req.user được tạo ra từ authMiddleware
    res.json(req.user);
};