// src/models/Conversation.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User'); // Import User model

const Conversation = sequelize.define('Conversation', {
    // Chúng ta không cần định nghĩa message ở đây,
    // mà sẽ tạo một Model riêng cho Message để có mối quan hệ rõ ràng hơn.
}, {
    timestamps: true
});

const Message = sequelize.define('Message', {
    sender: {
        type: DataTypes.ENUM('user', 'bot'),
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT, // Dùng TEXT để lưu được tin nhắn dài
        allowNull: false
    }
}, {
    timestamps: true
});

// Thiết lập mối quan hệ giữa các Model
// Một User có thể có nhiều Conversation
User.hasMany(Conversation, { foreignKey: 'userId' });
Conversation.belongsTo(User, { foreignKey: 'userId' });

// Một Conversation có thể có nhiều Message
Conversation.hasMany(Message, { foreignKey: 'conversationId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

// Export cả hai model
module.exports = { Conversation, Message };