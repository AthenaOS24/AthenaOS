import os
import httpx
<<<<<<< HEAD
from fastapi import FastAPI, HTTPException, Request
=======
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
>>>>>>> bedd0c9e5da5c5b45f374247e464d676e0550a32
from pydantic import BaseModel
from typing import List, Dict

# --- Cấu hình API Keys và Model IDs ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

<<<<<<< HEAD
# Root path to the directory containing local models
MODEL_BASE_PATH = "models"

# Model 1: Moderation  
# moderation_path = os.path.join(MODEL_BASE_PATH, "moderation")
# moderation_tokenizer = AutoTokenizer.from_pretrained(moderation_path)
# moderation_model = AutoModelForSequenceClassification.from_pretrained(moderation_path)
=======
# Cấu hình Gemini API client
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ID của các mô hình trên Hugging Face Hub
SENTIMENT_MODEL_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
EMOTION_MODEL_ID = "SamLowe/roberta-base-go_emotions"
>>>>>>> bedd0c9e5da5c5b45f374247e464d676e0550a32

HF_API_URL = "https://api-inference.huggingface.co/models/"

<<<<<<< HEAD
# Model 3: Emotion Analysis (Detailed emotion analysis)
emotion_path = os.path.join(MODEL_BASE_PATH, "emotion")
emotion_analyzer = pipeline("text-classification", model=emotion_path, tokenizer=emotion_path, top_k=None)

def sanitize_input(text):
    """Function to clean user input"""
    return text.strip()

def combined_sentiment_analysis(text):
    """Function to combine sentiment and detailed emotion analysis"""
=======
# --- Các hàm gọi API ---

def convert_history_to_gemini_format(history: List[Dict]) -> List[Dict]:
    """Chuyển đổi lịch sử từ dạng {"role": "assistant", ...} sang {"role": "model", ...}."""
    gemini_history = []
    for message in history:
        role = "model" if message["role"] == "assistant" else message["role"]
        gemini_history.append({
            "role": role,
            "parts": [message["content"]]
        })
    return gemini_history

async def generate_response_from_gemini(user_input: str, history: List[Dict]):
    """Lấy phản hồi từ Google Gemini API."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set.")
    
>>>>>>> bedd0c9e5da5c5b45f374247e464d676e0550a32
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        # Chuyển đổi định dạng lịch sử và bắt đầu phiên chat
        gemini_history = convert_history_to_gemini_format(history)
        chat = model.start_chat(history=gemini_history)
        
        # Gửi tin nhắn mới và nhận phản hồi
        response = await chat.send_message_async(user_input)
        return response.text
    except Exception as e:
        print(f"Error from Gemini API: {e}")
        raise HTTPException(status_code=502, detail=f"An error occurred with the Gemini API: {e}")

<<<<<<< HEAD
async def generate_response_from_openrouter(user_input: str, history: list):
    """Function to call the OpenRouter API to get a response from the LLM"""
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
            print(f"API Error from OpenRouter: {e.response.text}")
            raise HTTPException(status_code=502, detail="Error response from AI service.")
        except Exception as e:
            print(f"Unknown error when calling API: {e}")
            raise HTTPException(status_code=500, detail="An internal error occurred.")
=======
async def query_hf_api(model_id: str, payload: dict):
    """Hàm chung để gọi Hugging Face Inference API."""
    if not HF_TOKEN:
        raise HTTPException(status_code=500, detail="HF_TOKEN is not set.")
    
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    api_url = f"{HF_API_URL}{model_id}"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(api_url, headers=headers, json=payload, timeout=90)
        response.raise_for_status()
        return response.json()

async def analyze_sentiment_api(text: str):
    """Phân tích cảm xúc bằng API."""
    payload = {"inputs": text}
    return await query_hf_api(SENTIMENT_MODEL_ID, payload)

async def analyze_emotion_api(text: str):
    """Phân tích cảm xúc chi tiết bằng API."""
    payload = {"inputs": text}
    return await query_hf_api(EMOTION_MODEL_ID, payload)

# --- Khởi tạo ứng dụng FastAPI ---
>>>>>>> bedd0c9e5da5c5b45f374247e464d676e0550a32

# Initialize the FastAPI application
app = FastAPI(title="Athena AI Therapist API")

class ChatRequest(BaseModel):
    user_input: str
    history: List[dict] = []

@app.get("/")
def read_root():
    """Root endpoint to check if the API is running"""
    return {"status": "Athena AI API is running"}

@app.post("/chat")
async def handle_chat(request: ChatRequest):
<<<<<<< HEAD
    """Main endpoint to handle chat requests"""
    sanitized_input = sanitize_input(request.user_input)
    if not sanitized_input:
        raise HTTPException(status_code=400, detail="User input is empty after sanitization.")

    # Get the response from the AI
    ai_response = await generate_response_from_openrouter(sanitized_input, request.history)

    # Perform sentiment analysis on the user's input
    sentiment_data = combined_sentiment_analysis(sanitized_input)

    return {
        "response": ai_response,
        "sentiment_analysis": sentiment_data
=======
    """Endpoint chính để xử lý yêu cầu chat."""
    sanitized_input = request.user_input.strip()
    if not sanitized_input:
        raise HTTPException(status_code=400, detail="User input is empty.")

    # Lấy phản hồi từ AI (Gemini)
    ai_response = await generate_response_from_gemini(sanitized_input, request.history)

    # Thực hiện các phân tích khác bằng APIs
    sentiment_data = await analyze_sentiment_api(sanitized_input)
    emotion_data = await analyze_emotion_api(sanitized_input)

    return {
        "response": ai_response,
        "sentiment_analysis": sentiment_data,
        "emotion_analysis": emotion_data,
>>>>>>> bedd0c9e5da5c5b45f374247e464d676e0550a32
    }
