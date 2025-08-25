// src/services/aiService.js
const axios = require('axios');

async function getGoogleAiResponse(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    try {
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: prompt }] }],
        });

        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error calling Google AI API:", error.response ? error.response.data : error.message);
        return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    }
}

module.exports = { getGoogleAiResponse };