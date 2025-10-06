const { Sequelize } = require('sequelize');

// Kiểm tra URL trước khi khởi tạo
const dbUrl = process.env.POSTGRES_URL;
if (!dbUrl) {
    // Nếu không có URL, Sequelize sẽ thất bại.
    // Chúng ta trả về một Sequelize instance tạm thời 
    // HOẶC dùng một logic đặc biệt cho Vercel/Serverless.
    console.error('FATAL ERROR: POSTGRES_URL is not defined when db.js is loaded.');
    // Tuy nhiên, để cho phép Models import Sequelize, chúng ta phải tạo một instance.
    // Cách an toàn hơn là thay đổi lại cấu trúc để Models không cần khởi tạo nó.
    // NHƯNG vì bạn đang ở Serverless, chúng ta phải chấp nhận rủi ro này.
    
    // Nếu bạn đang cố gắng chạy local và Vercel, hãy đảm bảo rằng .env của bạn đã tải.
    // Giả định bạn đã sửa dotenv trong server.js, chúng ta tiếp tục:
}

const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    logging: false,
});

async function connectDB() {
    try {
        if (!process.env.POSTGRES_URL) {
            // Đây là lỗi nếu bạn gọi connectDB mà chưa có URL
            throw new Error('POSTGRES_URL is missing.');
        }
        await sequelize.authenticate();
        console.log('PostgreSQL Connected Successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
}

function getSequelize() {
    return sequelize;
}

module.exports = { 
    connectDB, 
    getSequelize,
    sequelize
};