// src/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Import instance sequelize từ config

const User = sequelize.define('User', {
    // Định nghĩa các thuộc tính của model
    username: {
        type: DataTypes.STRING,
        allowNull: false, // Tương đương với required: true
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    // Các tùy chọn khác
    timestamps: true // Tự động thêm createdAt và updatedAt
});

module.exports = User;