// src/services/aiService.js
const axios = require('axios');

/**
 * @param {string} userInput  
 * @param {Array<object>} dbMessages  
 * @returns {Promise<object>}  
 */
exports.getAthenaAiResponse = async (userInput, dbMessages) => {

    const aiApiUrl = process.env.PYTHON_AI_API_URL;

    if (!aiApiUrl) {
        throw new Error("PYTHON_AI_API_URL is not configured in .env");
    }

    const history = dbMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
    }));

    const payload = {
        user_input: userInput,
        history: history
    };

    try {
        console.log("Sending request to Python AI service on Railway...");
        
        const response = await axios.post(aiApiUrl, payload, { timeout: 60000 }); 
        
        console.log("Received response from Python AI service.");

        return response.data;

    } catch (error) {
        console.error("Error calling Python AI service:", error.response ? error.response.data : error.message);
        
        return {
            response: "I'm sorry, I'm having trouble connecting to my core intelligence. Please try again in a moment.",
            sentiment_analysis: {},
            emotion_analysis: {}
        };
    }
};
