const { Sequelize } = require('sequelize');

const dbUrl = process.env.POSTGRES_URL;

if (!dbUrl) {
  throw new Error(`FATAL_ERROR: POSTGRES_URL environment variable is NOT DEFINED! The value received was: ${dbUrl}`);
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected...');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };