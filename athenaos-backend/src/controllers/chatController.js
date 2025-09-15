// src/controllers/chatController.js
const { Conversation, Message } = require('../models');
const { getAthenaAiResponse } = require('../services/aiService');
exports.getChatHistory = async (req, res) => {
try {
const conversations = await Conversation.findAll({
where: { userId: req.user.id },
include: [{
model: Message,
as: 'messages',
}],
order: [['updatedAt', 'DESC']]
});
res.json(conversations);
} catch (error) {
console.error("Error fetching chat history:", error.message);
res.status(500).send('Server Error');
}
};
exports.sendMessage = async (req, res) => {
const { text } = req.body;
const userId = req.user.id;
if (!text || text.trim() === '') {
return res.status(400).json({ msg: 'Message text cannot be empty' });
}
try {
const [conversation] = await Conversation.findOrCreate({
where: { userId: userId },
defaults: { userId: userId }
});
const existingMessages = await Message.findAll({
where: { conversationId: conversation.id },
order: [['createdAt', 'ASC']],
limit: 20,
});
await Message.create({
sender: 'user',
text: text,
conversationId: conversation.id,
});
await conversation.save();
// ============================
const aiResult = await getAthenaAiResponse(text, existingMessages);
if (aiResult && aiResult.response) {
await Message.create({
sender: 'bot',
text: aiResult.response,
conversationId: conversation.id,
});
}
res.status(200).json(aiResult);
} catch (error) {
console.error("Error in sendMessage:", error.message);
res.status(500).send('Server Error');
}
}