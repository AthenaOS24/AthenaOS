import os
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

# --- API Keys and Model ID Configuration ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

# IDs of the models on the Hugging Face Hub that we will use via API
SENTIMENT_MODEL_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
EMOTION_MODEL_ID = "SamLowe/roberta-base-go_emotions"

HF_API_URL = "https://api-inference.huggingface.co/models/"

# --- API Calling Functions ---

async def query_hf_api(model_id: str, payload: dict):
    if not HF_TOKEN:
        raise HTTPException(status_code=500, detail="HF_TOKEN is not set.")
    
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    api_url = f"{HF_API_URL}{model_id}"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(api_url, headers=headers, json=payload, timeout=45) # Tăng timeout của client
        response.raise_for_status()
        return response.json()

async def analyze_sentiment_api(text: str):
    payload = {"inputs": text}
    return await query_hf_api(SENTIMENT_MODEL_ID, payload)

async def analyze_emotion_api(text: str):
    payload = {"inputs": text}
    return await query_hf_api(EMOTION_MODEL_ID, payload)

async def generate_response_from_openrouter(user_input: str, history: list):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not set.")

    messages = [{"role": "system", "content": "You are Athena, a compassionate AI therapist."}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_input})

    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}"}
    json_data = {"model": "anthropic/claude-3.5-sonnet", "messages": messages}

    async with httpx.AsyncClient() as client:
        response = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=json_data, timeout=30)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']

# --- Initialize FastAPI App ---

app = FastAPI(title="Athena AI Therapist API")

class ChatRequest(BaseModel):
    user_input: str
    history: List[dict] = []

@app.get("/")
def read_root():
    return {"status": "Athena AI API is running"}

# ==============================================================================
# PHIÊN BẢN THỬ NGHIỆM - VÔ HIỆU HÓA HAI LỆNH GỌI API CHẬM
# ==============================================================================
@app.post("/chat")
async def handle_chat(request: ChatRequest):
    """Main endpoint to handle chat requests."""
    sanitized_input = request.user_input.strip()
    if not sanitized_input:
        raise HTTPException(status_code=400, detail="User input is empty.")

    # Get the response from the AI (LLM)
    ai_response = await generate_response_from_openrouter(sanitized_input, request.history)

    # Perform other analyses using APIs
    sentiment_data = await analyze_sentiment_api(sanitized_input)
    emotion_data = await analyze_emotion_api(sanitized_input)

    return {
        "response": ai_response,
        "sentiment_analysis": sentiment_data,
        "emotion_analysis": emotion_data,
    }
