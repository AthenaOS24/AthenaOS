// src/config/db.js
const { Sequelize } = require('sequelize');

let sequelize;

if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL environment variable is required for PostgreSQL connection.');
    process.exit(1);
}

console.log('Running with PostgreSQL (Neon).');

// <<<< SỬA ĐỔI QUAN TRỌNG: Sử dụng đối tượng cấu hình thay vì truyền chuỗi URL trực tiếp >>>>
sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    // Cấu hình SSL là bắt buộc cho Neon
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false,
});
// <<<< KẾT THÚC SỬA ĐỔI >>>>

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);  
    }
};

module.exports = { connectDB, sequelize };