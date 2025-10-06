const { Sequelize } = require('sequelize');

// Khởi tạo Sequelize Instance ngay lập tức
const sequelize = new Sequelize(process.env.POSTGRES_URL, {
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
            console.error('FATAL ERROR: POSTGRES_URL is not defined.');
            process.exit(1);
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