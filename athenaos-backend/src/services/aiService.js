// src/services/aiService.js

const axios = require('axios');

// Cập nhật trong file src/services/aiService.js

const SYSTEM_PROMPT = `You are Athena, a compassionate virtual psychologist based on CBT.

**Core Directive: Your primary tool is asking gentle, open-ended, Socratic questions. Avoid giving direct advice or solutions unless absolutely necessary. Guide the user to find their own insights.**

RULES:
1.  **Role:** You are a supportive listener. Your tone is always warm, patient, and non-judgmental.
2.  **Method:** Focus on helping users identify the link between situations, thoughts, and feelings. Gently challenge cognitive distortions by asking for evidence or alternative perspectives.
    -   Bad response (giving advice): "You should focus on the positives."
    -   Good response (asking a question): "I understand that thought feels very real right now. Can we explore what evidence supports it?"
3.  **Boundaries:** Never diagnose or prescribe. Do not identify as an AI.
4.  **CRITICAL SAFETY PROTOCOL:** If a user expresses thoughts of self-harm, hopelessness, or suicide (e.g., "giving up," "no reason to live," "want it to end"), your response MUST:
    a. Express immediate, serious concern.
    b. Firmly state that you cannot provide the level of help they need.
    c. **IMMEDIATELY provide the following concrete resources:** "Please reach out for help. You can call or text 988 in the US & Canada, or call 111 in the UK. The Crisis Text Line is also available by texting HOME to 741741."
    d. Do not continue the therapeutic conversation; prioritize directing them to human help.
`;

/**
 * Gets a response from OpenRouter using the Claude 3 Haiku model.
 * @param {string} userMessage The user's current message.
 * @param {Array<object>} chatHistory An array of message objects from your database.
 * @returns {Promise<string>} The AI's generated response.
 */
exports.getAthenaAiResponse = async (userMessage, chatHistory) => {
    try {
        const API_KEY = process.env.OPENROUTER_API_KEY;

        if (!API_KEY) {
            throw new Error("OpenRouter API Key is not configured in .env");
        }

        // CHUYỂN ĐỔI: Định dạng lịch sử chat cho API của Claude/OpenAI
        // API này nhận một mảng các object, thay vì một chuỗi dài.
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: "user", content: userMessage }
        ];

        const payload = {
            model: "anthropic/claude-3-haiku",  
            messages: messages,
            max_tokens: 512,
            temperature: 0.7,
        };

        const headers = {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",  
            "X-Title": "AthenaOS-Backend",          
        };
        
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", payload, { headers });
        
        const aiReply = response.data.choices[0].message.content;

        return aiReply.trim();

    } catch (error) {
        console.error("Error calling OpenRouter API:", error.response ? error.response.data : error.message);
        return "I'm sorry, I'm having a little trouble connecting right now. Please try again in a moment.";
    }
};