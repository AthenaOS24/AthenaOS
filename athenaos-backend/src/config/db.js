// src/config/db.js
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', '..', 'database.sqlite') 
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();  
        console.log('SQLite Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = { connectDB, sequelize };