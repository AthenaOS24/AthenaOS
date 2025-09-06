import os
import httpx
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict

# --- Cấu hình API Keys và Model IDs ---
# Lấy API keys từ biến môi trường để bảo mật
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

# Cấu hình Gemini API client
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ID của các mô hình trên Hugging Face Hub
SENTIMENT_MODEL_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
EMOTION_MODEL_ID = "SamLowe/roberta-base-go_emotions"

# URL cơ sở cho Hugging Face Inference API
HF_API_URL = "https://api-inference.huggingface.co/models/"


# --- Các hàm gọi API ---

def convert_history_to_gemini_format(history: List[Dict]) -> List[Dict]:
    """
    Chuyển đổi lịch sử trò chuyện từ định dạng của chúng ta
    sang định dạng yêu cầu của Gemini.
    Vai trò 'assistant' được đổi thành 'model'.
    """
    gemini_history = []
    for message in history:
        # Gemini sử dụng 'model' cho các phản hồi của AI thay vì 'assistant'
        role = "model" if message["role"] == "assistant" else message["role"]
        gemini_history.append({
            "role": role,
            "parts": [{"text": message["content"]}]
        })
    return gemini_history

async def generate_response_from_gemini(user_input: str, history: List[Dict]):
    """
    Gửi yêu cầu đến Google Gemini API để nhận phản hồi trò chuyện.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set.")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        # Chuyển đổi định dạng lịch sử và bắt đầu phiên chat
        gemini_history = convert_history_to_gemini_format(history)
        chat = model.start_chat(history=gemini_history)
        
        # Gửi tin nhắn mới và nhận phản hồi không đồng bộ
        response = await chat.send_message_async(user_input)
        return response.text
    except Exception as e:
        print(f"Error from Gemini API: {e}")
        raise HTTPException(status_code=502, detail=f"An error occurred with the Gemini API: {e}")

async def query_hf_api(model_id: str, payload: dict):
    """
    Hàm chung để gửi yêu cầu đến Hugging Face Inference API.
    """
    if not HF_TOKEN:
        raise HTTPException(status_code=500, detail="HF_TOKEN is not set.")
    
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    api_url = f"{HF_API_URL}{model_id}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(api_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()  # Báo lỗi nếu mã trạng thái là 4xx hoặc 5xx
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"API Error from Hugging Face ({model_id}): {e.response.text}")
            raise HTTPException(status_code=502, detail=f"Error response from Hugging Face service for {model_id}.")
        except Exception as e:
            print(f"Unknown error when calling Hugging Face API ({model_id}): {e}")
            raise HTTPException(status_code=500, detail="An internal error occurred while contacting Hugging Face.")


async def analyze_sentiment_api(text: str):
    """Phân tích tình cảm bằng cách gọi API của Hugging Face."""
    payload = {"inputs": text}
    return await query_hf_api(SENTIMENT_MODEL_ID, payload)

async def analyze_emotion_api(text: str):
    """Phân tích cảm xúc chi tiết bằng cách gọi API của Hugging Face."""
    payload = {"inputs": text}
    return await query_hf_api(EMOTION_MODEL_ID, payload)

# --- Khởi tạo ứng dụng FastAPI ---

app = FastAPI(
    title="Athena AI Therapist API",
    description="An API that uses Gemini for chat responses and Hugging Face for text analysis."
)

class ChatRequest(BaseModel):
    user_input: str
    history: List[Dict] = []

@app.get("/", summary="Check API Status")
def read_root():
    """Endpoint gốc để kiểm tra xem API có đang hoạt động không."""
    return {"status": "Athena AI API is running"}

@app.post("/chat", summary="Handle Chat and Analysis")
async def handle_chat(request: ChatRequest):
    """
    Endpoint chính để xử lý yêu cầu chat.
    Nó nhận đầu vào của người dùng, lấy phản hồi từ Gemini,
    và thực hiện phân tích tình cảm và cảm xúc trên đầu vào đó.
    """
    sanitized_input = request.user_input.strip()
    if not sanitized_input:
        raise HTTPException(status_code=400, detail="User input cannot be empty.")

    # Lấy phản hồi từ AI (Gemini)
    ai_response = await generate_response_from_gemini(sanitized_input, request.history)

    # Thực hiện các phân tích khác trên đầu vào của người dùng
    sentiment_data = await analyze_sentiment_api(sanitized_input)
    emotion_data = await analyze_emotion_api(sanitized_input)

    return {
        "response": ai_response,
        "sentiment_analysis": sentiment_data,
        "emotion_analysis": emotion_data,
    }
