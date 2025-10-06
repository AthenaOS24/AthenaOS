// src/config/db.js
const { Sequelize } = require('sequelize');

let sequelize;

if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL environment variable is required for PostgreSQL connection.');
    process.exit(1);
}

console.log('Running with PostgreSQL (Neon).');

// SỬ DỤNG PHƯƠNG PHÁP KHỞI TẠO BẰNG CHUỖI VÀ OPTIONS CỤ THỂ
sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        // Cấu hình để buộc sử dụng SSL và chấp nhận tự ký (cho Neon)
        ssl: {
            require: true,
            rejectUnauthorized: false 
        }
    },
    logging: false,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        // THỬ LỖI NÀY CÓ PHẢI LÀ LỖI KẾT NỐI KHÔNG
        if (error.original && error.original.code === 'EENOTFOUND') {
            console.error("Connection failed. Check your DATABASE_URL and network access.");
        }
        process.exit(1);  
    }
};

module.exports = { connectDB, sequelize };