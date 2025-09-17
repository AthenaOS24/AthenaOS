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

const corsOptions = {
  origin: 'https://athena-825605376128.australia-southeast2.run.app',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
    res.send('API is running successfully!');
});


// --- Hàm khởi động Server ---
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