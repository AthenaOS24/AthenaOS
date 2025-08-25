// src/controllers/chatController.js
const { Conversation, Message } = require('../models/Conversation');

exports.getChatHistory = async (req, res) => {
    try {
        const conversations = await Conversation.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Message,
                order: [['createdAt', 'ASC']]  
            }],
            order: [['createdAt', 'DESC']] 
        });

        res.json(conversations);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.sendMessage = async (req, res) => {
    // =================================================================
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