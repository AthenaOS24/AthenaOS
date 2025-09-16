// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB, sequelize } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

// Khởi tạo dotenv để đọc các biến môi trường
dotenv.config();

const app = express();

// --- Middleware ---
// Cho phép tất cả các nguồn gốc truy cập (sử dụng để test)
app.use(cors());
// Cho phép server đọc định dạng JSON từ body của request
app.use(express.json());


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Route mặc định để kiểm tra xem server có hoạt động không
app.get('/', (req, res) => {
    res.send('API is running successfully!');
});


// --- Hàm khởi động Server ---
const startServer = async () => {
    try {
        // 1. Kết nối tới cơ sở dữ liệu
        await connectDB();

        // 2. Đồng bộ hóa models (bảng) với cơ sở dữ liệu
        await sequelize.sync();
        console.log("All models were synchronized successfully.");

        // 3. Lắng nghe trên cổng được Cloud Run cung cấp, hoặc cổng 8888 nếu chạy local
        const PORT = process.env.PORT || 8888;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        // Báo lỗi chi tiết nếu có bất kỳ lỗi nào trong quá trình khởi động
        console.error("FATAL: Failed to start the server due to an error:", error);
        process.exit(1); // Thoát tiến trình với mã lỗi
    }
};

// --- Gọi hàm để bắt đầu chạy server ---
startServer();