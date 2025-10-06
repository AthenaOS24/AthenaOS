// src/config/db.js
const { Sequelize } = require('sequelize');

let sequelize;

if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL environment variable is required for PostgreSQL connection.');
    process.exit(1);
}

console.log('Running with PostgreSQL (Neon).');

 
sequelize = new Sequelize({
    url: process.env.DATABASE_URL,  
    dialect: 'postgres',
    dialectOptions: {
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
        process.exit(1);  
    }
};

module.exports = { connectDB, sequelize };