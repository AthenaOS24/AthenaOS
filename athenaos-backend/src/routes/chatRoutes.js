// src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getChatHistory, sendMessage } = require('../controllers/chatController');

// @route   GET /api/chat/history
// @desc    Get all conversations for a user
// @access  Private
router.get('/history', authMiddleware, getChatHistory);

router.post('/send', authMiddleware, sendMessage); 

module.exports = router;