// src/controllers/chatController.js
const { Conversation, Message } = require('../models/Conversation');

// Lấy toàn bộ lịch sử hội thoại của một user
exports.getChatHistory = async (req, res) => {
    try {
        // req.user.id được cung cấp bởi authMiddleware
        const conversations = await Conversation.findAll({
            where: { userId: req.user.id },
            // Include để lấy tất cả các tin nhắn liên quan
            include: [{
                model: Message,
                order: [['createdAt', 'ASC']] // Sắp xếp tin nhắn theo thời gian tăng dần
            }],
            order: [['createdAt', 'DESC']] // Sắp xếp các cuộc hội thoại, mới nhất lên đầu
        });

        res.json(conversations);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// Gửi một tin nhắn mới và nhận phản hồi
// Thay thế toàn bộ hàm cũ bằng hàm này
exports.sendMessage = async (req, res) => {
    // =================================================================
    // DẤU HIỆU NHẬN BIẾT ĐỂ KIỂM TRA
    console.log("--- RUNNING VERSION 2 OF sendMessage FUNCTION! ---");
    // =================================================================

    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
        return res.status(400).json({ msg: 'Message text cannot be empty' });
    }

    try {
        const [conversation] = await Conversation.findOrCreate({
            where: { userId: userId },
        });

        await Message.create({
            sender: 'user',
            text: text,
            conversationId: conversation.id,
        });
        
        // Đoạn này vẫn giữ nguyên để gọi AI
        const { getGoogleAiResponse } = require('../services/aiService');
        const botResponseText = await getGoogleAiResponse(text);

        const botMessage = await Message.create({
            sender: 'bot',
            text: botResponseText,
            conversationId: conversation.id,
        });

        res.json(botMessage);

    } catch (error) {
        console.error("--- ERROR FROM VERSION 2 ---", error.message);
        res.status(500).send('Server Error');
    }
};