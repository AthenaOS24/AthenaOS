// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB, sequelize } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

dotenv.config();

const app = express();

// --- Middleware ---

const allowedOrigins = [
  'https://athena-825605376128.australia-southeast2.run.app', // Your deployed frontend
  'http://localhost:5173'                                   // Your local development
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};

app.use(cors(corsOptions));

app.use(express.json());


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
    res.send('API is running successfully!');
});


const startServer = async () => {
    try {
        await connectDB();

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