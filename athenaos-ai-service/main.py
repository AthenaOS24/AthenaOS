import os
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

# --- Cấu hình API Keys và Model IDs ---
HF_TOKEN = os.getenv("HF_TOKEN")

# ID của các mô hình trên Hugging Face Hub mà chúng ta sẽ sử dụng qua API
LLM_MODEL_ID = "meta-llama/Llama-2-7b-chat-hf" # Mô hình chính Llama 2
SENTIMENT_MODEL_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
EMOTION_MODEL_ID = "SamLowe/roberta-base-go_emotions"

HF_API_URL = "https://api-inference.huggingface.co/models/"

# --- Các hàm gọi API ---

async def query_hf_api(model_id: str, payload: dict):
    """General function to query the Hugging Face Inference API."""
    if not HF_TOKEN:
        raise HTTPException(status_code=500, detail="HF_TOKEN is not set.")
    
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    api_url = f"{HF_API_URL}{model_id}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(api_url, headers=headers, json=payload, timeout=45)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"API Error from Hugging Face for model {model_id}: {e.response.text}")
            raise HTTPException(status_code=502, detail=f"Error from HF API for {model_id}: {e.response.text}")
        except Exception as e:
            print(f"Unknown error when calling Hugging Face API: {e}")
            raise HTTPException(status_code=500, detail="An internal error occurred with Hugging Face API.")

async def generate_response_from_hf_llm(user_input: str, history: list):
    """Function to get a response from a Hugging Face LLM."""
    # Note: Formatting the prompt is important for chat models. This is a simple example.
    # You might need a more complex prompt template for better results.
    prompt = f"User: {user_input}\nAssistant:"
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 250,
            "return_full_text": False
        }
    }
    response = await query_hf_api(LLM_MODEL_ID, payload)
    return response[0]['generated_text']

async def analyze_sentiment_api(text: str):
    """Analyze sentiment using the API."""
    payload = {"inputs": text}
    return await query_hf_api(SENTIMENT_MODEL_ID, payload)

async def analyze_emotion_api(text: str):
    """Analyze detailed emotions using the API."""
    payload = {"inputs": text}
    return await query_hf_api(EMOTION_MODEL_ID, payload)

# --- Initialize FastAPI App ---

app = FastAPI(title="Athena AI Therapist API")

class ChatRequest(BaseModel):
    user_input: str
    history: List[dict] = []

@app.get("/")
def read_root():
    return {"status": "Athena AI API is running"}

@app.post("/chat")
async def handle_chat(request: ChatRequest):
    """Main endpoint to handle chat requests."""
    sanitized_input = request.user_input.strip()
    if not sanitized_input:
        raise HTTPException(status_code=400, detail="User input is empty.")

    # Get the response from the AI (LLM on Hugging Face)
    ai_response = await generate_response_from_hf_llm(sanitized_input, request.history)

    # Perform other analyses using APIs
    sentiment_data = await analyze_sentiment_api(sanitized_input)
    emotion_data = await analyze_emotion_api(sanitized_input)

    return {
        "response": ai_response,
        "sentiment_analysis": sentiment_data,
        "emotion_analysis": emotion_data,
    }
