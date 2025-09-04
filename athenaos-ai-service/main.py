import os
import httpx  
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

MODEL_BASE_PATH = "models"

# Model 1: Moderation
moderation_path = os.path.join(MODEL_BASE_PATH, "moderation")
moderation_tokenizer = AutoTokenizer.from_pretrained(moderation_path)
moderation_model = AutoModelForSequenceClassification.from_pretrained(moderation_path)

# Model 2: Sentiment Analysis
sentiment_path = os.path.join(MODEL_BASE_PATH, "sentiment")
sentiment_analyzer = pipeline("sentiment-analysis", model=sentiment_path, tokenizer=sentiment_path)

# Model 3: Emotion Analysis
emotion_path = os.path.join(MODEL_BASE_PATH, "emotion")
emotion_analyzer = pipeline("text-classification", model=emotion_path, tokenizer=emotion_path, top_k=None)
def sanitize_input(text):
    return text.strip()

def combined_sentiment_analysis(text):
    try:
        sentiment = sentiment_analyzer(text)[0]
        emotions = emotion_analyzer(text)[0]
        return {"sentiment": sentiment, "emotions": emotions}
    except Exception:
        return {"sentiment": "unknown", "emotions": []}

async def generate_response_from_openrouter(user_input: str, history: list):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not set.")

    messages = [{"role": "system", "content": "You are Athena, a compassionate AI therapist."}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_input})
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    json_data = {
        "model": "anthropic/claude-3.5-sonnet", 
        "messages": messages
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=json_data,
                timeout=30  
            )
            response.raise_for_status() 
            data = response.json()
            return data['choices'][0]['message']['content']
        except httpx.HTTPStatusError as e:
            print(f"Lỗi API từ OpenRouter: {e.response.text}")
            raise HTTPException(status_code=502, detail="Error response from AI service.")
        except Exception as e:
            print(f"Lỗi không xác định khi gọi API: {e}")
            raise HTTPException(status_code=500, detail="An internal error occurred.")

app = FastAPI(title="Athena AI Therapist API")

class ChatRequest(BaseModel):
    user_input: str
    history: list = []

@app.get("/")
def read_root():
    return {"status": "Athena AI API is running"}

@app.post("/chat")
async def handle_chat(request: ChatRequest):
    sanitized_input = sanitize_input(request.user_input)
    if not sanitized_input:
        raise HTTPException(status_code=400, detail="User input is empty after sanitization.")
    ai_response = await generate_response_from_openrouter(sanitized_input, request.history)

    sentiment_data = combined_sentiment_analysis(sanitized_input)

    return {
        "response": ai_response,
        "sentiment_analysis": sentiment_data
    }