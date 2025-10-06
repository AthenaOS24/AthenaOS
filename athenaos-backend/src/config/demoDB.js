// src/config/demoDB.js
const bcrypt = require('bcryptjs');
let userIdCounter = 1;
let conversationIdCounter = 1;
let messageIdCounter = 1;

const USERS = [];
const CONVERSATIONS = [];
const MESSAGES = [];

const User = {
    findOne: ({ where }) => {
        if (where.email) {
            return USERS.find(u => u.email === where.email);
        }
        if (where.username) {
            return USERS.find(u => u.username === where.username);
        }
        return null;
    },

    findByPk: (id) => {
        const user = USERS.find(u => u.id === id);
        if (user) {
            const { password, ...userWithoutPass } = user;
            return userWithoutPass;
        }
        return null;
    },

    create: ({ username, email, password }) => {
        const newUser = {
            id: userIdCounter++,
            username,
            email,
            password,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        USERS.push(newUser);
        return newUser;
    },
};

const Conversation = {
    findOrCreate: ({ where, defaults }) => {
        let conversation;
        if (where.id) {
            conversation = CONVERSATIONS.find(c => c.id == where.id && c.userId === defaults.userId);
        }
        
        if (!conversation) {
            conversation = {
                id: conversationIdCounter++,
                userId: defaults.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            CONVERSATIONS.push(conversation);
        }
        return [conversation]; 
    },

    findAll: ({ where, include, order }) => {
        if (where.userId) {
            let userConversations = CONVERSATIONS.filter(c => c.userId === where.userId);
            
            if (include && include[0]?.model === 'Message') {
                userConversations = userConversations.map(c => ({
                    ...c,
                    messages: MESSAGES.filter(m => m.conversationId === c.id),
                }));
            }

            if (order && order[0][0] === 'updatedAt' && order[0][1] === 'DESC') {
                userConversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            }

            return userConversations;
        }
        return [];
    },

    changed: (field, value) => { },
    save: () => { },
};

const Message = {
    create: ({ sender, text, conversationId, emotionData }) => {
        const newMessage = {
            id: messageIdCounter++,
            sender,
            text,
            conversationId,
            emotionData,
            createdAt: new Date(),
        };
        MESSAGES.push(newMessage);
        const convo = CONVERSATIONS.find(c => c.id === conversationId);
        if (convo) convo.updatedAt = new Date();
        return newMessage;
    },

    findAll: ({ where, order, limit, attributes }) => {
        let filteredMessages = MESSAGES.filter(m => {
            let match = true;
            if (where.conversationId) match = match && m.conversationId == where.conversationId;
            if (where.sender) match = match && m.sender === where.sender;
            return match;
        });

        filteredMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        if (limit) filteredMessages = filteredMessages.slice(-limit);

        if (attributes) {
             filteredMessages = filteredMessages.map(m => {
                const result = {};
                attributes.forEach(attr => {
                    result[attr] = m[attr];
                });
                return result;
             });
        }
        
        return filteredMessages;
    },
};

const connectDB = async () => {
    if (USERS.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        User.create({
            username: 'demo_user',
            email: 'demo@example.com',
            password: hashedPassword,
        });
        console.log('INFO: Created a temporary DEMO user: demo@example.com / 123456');
    }

    console.log('Database connection (In-Memory Array) has been established successfully.');
};

module.exports = { 
    connectDB, 
    models: { 
        User, 
        Conversation, 
        Message 
    } 
};