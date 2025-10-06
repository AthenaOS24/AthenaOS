// src/controllers/authController.js
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        console.log(`Demo registration for user: ${username}`);

        res.status(201).json({
            id: Date.now(),
            username: username,
            email: email,
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ msg: 'Invalid Credentials' }); 
        }

        console.log(`Demo login for user: ${email}`);

        const payload = {
            user: {
                id: Date.now(),
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'a-secret-key-for-demo',
            { expiresIn: '5h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: payload.user.id,
                        username: 'demo_user',
                        email: email,
                    }
                });
            }
        );
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

exports.getMe = async (req, res) => {
    res.json({
        id: 'dummy_user_id',
        username: 'demo_user',
        email: 'demo@example.com'
    });
};