// src/services/aiService.js
const axios = require('axios');

async function getGoogleAiResponse(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    try {
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: prompt }] }],
        });

        // Trích xuất và trả về nội dung văn bản từ phản hồi của AI
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        // Ghi lại lỗi chi tiết nếu có vấn đề khi gọi API
        console.error("Error calling Google AI API:", error.response ? error.response.data : error.message);
        // Trả về một câu trả lời mặc định khi có lỗi
        return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    }
}

// Export hàm để các file khác có thể sử dụng
module.exports = { getGoogleAiResponse };