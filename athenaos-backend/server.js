const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB, getSequelize } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const ttsRoutes = require('./src/routes/ttsRoutes');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();

const allowedOrigins = [

  'https://athenafrontend-nine.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tts', ttsRoutes);

app.get('/', (req, res) => {
  res.send('API is running successfully!');
});

const startServer = async () => {
  try {
    await connectDB();
    
    const sequelize = getSequelize();
    await sequelize.sync();
    console.log("All models were synchronized successfully.");

    const PORT = process.env.PORT || 8888;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error("FATAL: Failed to start the server due to an error:", error);
    process.exit(1);
  }
};

startServer();