// src/config/db.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Tạo một kết nối Sequelize, trỏ đến một file database.
// File 'database.sqlite' sẽ tự động được tạo trong thư mục gốc của dự án.
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', '..', 'database.sqlite') // Đường dẫn tới file db
});

const connectDB = async () => {
    try {
        await sequelize.authenticate(); // Kiểm tra kết nối
        console.log('SQLite Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

// Export cả hàm connect và instance của sequelize
module.exports = { connectDB, sequelize };