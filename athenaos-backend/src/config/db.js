const { Sequelize } = require('sequelize');

let sequelize;

const connectDB = async () => {
  const dbUrl = process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.error('FATAL ERROR: POSTGRES_URL is not defined.');
    process.exit(1);
  }

  try {
    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    });

    await sequelize.authenticate();
    console.log('PostgreSQL Connected...');

  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

const getSequelize = () => sequelize;

module.exports = { connectDB, getSequelize };