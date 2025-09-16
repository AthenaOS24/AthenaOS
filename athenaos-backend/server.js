// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB, sequelize } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

dotenv.config();

const app = express();

// // SỬA ĐỔI CHÍNH: Tạm thời comment đoạn này lại
// const corsOptions = {
//   origin: 'https://athena-825605376128.australia-southeast2.run.app',
//   optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

// THAY BẰNG DÒNG NÀY: Cho phép TẤT CẢ các request để kiểm tra
app.use(cors()); 

app.use(express.json());

startServer();
