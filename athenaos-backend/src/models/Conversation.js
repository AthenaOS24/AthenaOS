// src/models/Conversation.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User'); // Import User model

const Conversation = sequelize.define('Conversation', {
}, {
    timestamps: true
});

const Message = sequelize.define('Message', {
    sender: {
        type: DataTypes.ENUM('user', 'bot'),
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT, 
        allowNull: false
    }
}, {
    timestamps: true
});

User.hasMany(Conversation, { foreignKey: 'userId' });
Conversation.belongsTo(User, { foreignKey: 'userId' });

Conversation.hasMany(Message, { foreignKey: 'conversationId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

module.exports = { Conversation, Message };