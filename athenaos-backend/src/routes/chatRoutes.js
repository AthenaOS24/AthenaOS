// src/routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getChatHistory, sendMessage } = require('../controllers/chatController');

// GET /api/chat/history - Get all messages for a conversation
router.get('/history', authMiddleware, getChatHistory);

// POST /api/chat/send-message - Send a new message
router.post('/send-message', authMiddleware, sendMessage);  

module.exports = router;