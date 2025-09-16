// src/config/db.js
const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

// Kiểm tra xem có đang chạy trên môi trường Google Cloud không
if (process.env.NODE_ENV === 'production' && process.env.INSTANCE_CONNECTION_NAME) {
    // Cấu hình cho Cloud SQL (MySQL hoặc PostgreSQL)
    const dbUser = process.env.DB_USER; // vd: 'root'
    const dbPass = process.env.DB_PASSWORD; // Lấy từ Secret Manager
    const dbName = process.env.DB_NAME; // vd: 'athena-db'
    const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME; // vd: 'project:region:instance'
    const dbSocketPath = `/cloudsql/${instanceConnectionName}`;

    sequelize = new Sequelize(dbName, dbUser, dbPass, {
        dialect: 'postgres', // Hoặc 'mysql' tùy vào database của bạn
        host: dbSocketPath,
        dialectOptions: {
            socketPath: dbSocketPath,
        },
        logging: false,
    });
} else {
    // Cấu hình cho SQLite khi chạy ở máy local để test
    console.log('Running in development mode, using SQLite.');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '..', '..', 'database.sqlite')
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1); // Thoát nếu không kết nối được DB
    }
};

module.exports = { connectDB, sequelize };