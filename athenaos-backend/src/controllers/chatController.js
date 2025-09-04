// src/controllers/chatController.js

const { Conversation, Message } = require('../models');
const { getAthenaAiResponse } = require('../services/aiService');

// **THAY ĐỔI LỚN BẮT ĐẦU TỪ ĐÂY**
// Hàm này bây giờ sẽ trả về tất cả các cuộc hội thoại của người dùng,
// mỗi cuộc hội thoại đi kèm với danh sách tin nhắn của nó.
exports.getChatHistory = async (req, res) => {
    try {
        const conversations = await Conversation.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Message,
                as: 'messages', // Đảm bảo alias này khớp với định nghĩa trong models/index.js
            }],
            // Sắp xếp để cuộc trò chuyện mới nhất nằm ở đầu danh sách
            order: [['updatedAt', 'DESC']]
        });

        res.json(conversations); // Trả về một mảng các object Conversation

    } catch (error) {
        console.error("Error fetching chat history:", error.message);
        res.status(500).send('Server Error');
    }
};
// **THAY ĐỔI LỚN KẾT THÚC TẠI ĐÂY**


// Hàm sendMessage đã đúng, nhưng cần một thay đổi nhỏ để xử lý history
function formatChatHistoryForAI(messages) {
    return messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
    }));
}

exports.sendMessage = async (req, res) => {
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim() === '') {
        return res.status(400).json({ msg: 'Message text cannot be empty' });
    }

    try {
        const [conversation, created] = await Conversation.findOrCreate({
            where: { userId: userId },
            // Sắp xếp để luôn tìm thấy cuộc trò chuyện gần nhất nếu có nhiều
            order: [['updatedAt', 'DESC']], 
        });

        const existingMessages = await Message.findAll({
            where: { conversationId: conversation.id },
            order: [['createdAt', 'ASC']],
            limit: 10,
            attributes: ['sender', 'text'],
            raw: true,
        });
        
        await Message.create({
            sender: 'user',
            text: text,
            conversationId: conversation.id,
        });
        
        // Cập nhật lại updatedAt để cuộc trò chuyện này nổi lên đầu
        await conversation.save();

        const botResponseText = await getAthenaAiResponse(text, existingMessages);

        const botMessage = await Message.create({
            sender: 'bot',
            text: botResponseText,
            conversationId: conversation.id,
        });

        res.json(botMessage);

    } catch (error) {
        console.error("Error in sendMessage:", error.message);
        res.status(500).send('Server Error');
    }
};