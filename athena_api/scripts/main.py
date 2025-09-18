import os
import re
import logging
import torch
import joblib
import numpy as np
from google.cloud import storage
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline, AutoModelForSequenceClassification
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# --- 1. Cấu hình và Thiết lập ban đầu ---

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Khởi tạo ứng dụng FastAPI
app = FastAPI(title="Athena Therapist API", version="1.0")

# --- 2. Các hằng số và hàm tiện ích (từ code gốc) ---

CRISIS_PATTERNS = [
    r"\bi (want to|need to|am going to|will) (die|kill myself|end it all)\b", r"\bi'm going to (kill myself|end my life)\b",
    r"\bi can't go on (like this )?anymore\b", r"\b(i'm|i am) (seriously|really) thinking of suicide\b",
    r"\b(i'm|i am) cutting myself (right now|currently)\b", r"\b(i'm|i am) being (abused|raped|assaulted) (right now|currently)\b",
    r"\bplanning to end my life\b", r"\bgoing to hurt myself (tonight|today|now)\b",
    r"\b(i'm|i am) going to (jump|hang|overdose) (myself )?(tonight|today|now)\b",
    r"\b(i've|i have) taken (pills|medication) to end my life\b", r"\bi have a plan to kill myself\b",
    r"\bgoodbye (forever|world|everyone)\b", r"\bthis is my last (message|day)\b"
]
CONCERN_PATTERNS = [
    r"\bi've been feeling (really )?(depressed|suicidal)\b", r"\bi (sometimes|often) think about (dying|self-harm)\b",
    r"\b(i'm|i am) struggling with (suicidal thoughts|self-harm)\b", r"\bno reason to live\b", r"\bdon't want to be here anymore\b",
    r"\bi feel (hopeless|trapped|worthless)\b", r"\bno one (cares|would miss me)\b", r"\bcan't cope (anymore|with life)\b",
    r"\b(i'm|i am) a burden\b"
]
MENTAL_HEALTH_RESOURCES = {
    'crisis': ["National Suicide Prevention Lifeline (US): 988", "Crisis Text Line: Text HOME to 741741", "Emergency Services: 911 or your local emergency number"],
    'concern': ["SAMHSA Helpline (US): 1-800-662-HELP (4357)", "7 Cups (free online therapy): https://www.7cups.com"],
    'general': ["Anxiety and Depression Association of America: https://adaa.org", "Psychology Today Therapist Finder: https://www.psychologytoday.com"]
}

def sanitize_input(text):
    text = re.sub(r'<script.*?>.*?</script>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'[^\w\s.,!?\'-]', '', text)
    return text.strip()[:1000]

def enhanced_crisis_detection(text):
    text_lower = text.lower()
    if any(re.search(pattern, text_lower) for pattern in CRISIS_PATTERNS): return "crisis"
    if any(re.search(pattern, text_lower) for pattern in CONCERN_PATTERNS): return "concern"
    return None

def recommend_resources(urgency_level):
    resources = MENTAL_HEALTH_RESOURCES.get(urgency_level, [])
    resources.extend(MENTAL_HEALTH_RESOURCES['general'])
    return list(set(resources))

# --- 3. Tải các tài nguyên (Mô hình & Retriever) khi khởi động API ---

# Lấy các biến môi trường cần thiết
GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
HF_TOKEN = os.environ.get("HF_TOKEN")
if not GCS_BUCKET_NAME or not HF_TOKEN:
    raise RuntimeError("Các biến môi trường GCS_BUCKET_NAME và HF_TOKEN phải được thiết lập!")

def download_and_load_retriever(bucket_name):
    destination_dir = '/tmp/retriever'
    if not os.path.exists(destination_dir):
        os.makedirs(destination_dir)
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    paths = {}
    for artifact in ['vectorizer.joblib', 'tfidf_matrix.joblib', 'texts.joblib']:
        blob = bucket.blob(f'retriever_artifacts/{artifact}')
        destination_file_name = os.path.join(destination_dir, artifact)
        if not os.path.exists(destination_file_name):
            logging.info(f"Downloading {artifact} from GCS...")
            blob.download_to_filename(destination_file_name)
        paths[artifact.split('.')[0]] = destination_file_name
    
    logging.info("Loading retriever artifacts into memory...")
    vectorizer = joblib.load(paths['vectorizer'])
    tfidf_matrix = joblib.load(paths['tfidf_matrix'])
    texts = joblib.load(paths['texts'])

    def retrieve(query, k=3):
        query_vec = vectorizer.transform([query])
        scores = (query_vec * tfidf_matrix.T).toarray()[0]
        top_indices = np.argsort(scores)[::-1][:k]
        return [texts[i] for i in top_indices if scores[i] > 0]
    
    logging.info("TF-IDF retriever is ready.")
    return retrieve

# Tải tài nguyên vào global scope để chỉ thực hiện một lần
retriever = download_and_load_retriever(GCS_BUCKET_NAME)

logging.info("Loading Hugging Face models...")
moderation_tokenizer = AutoTokenizer.from_pretrained("facebook/roberta-hate-speech-dynabench-r4-target")
moderation_model = AutoModelForSequenceClassification.from_pretrained("facebook/roberta-hate-speech-dynabench-r4-target")

model_id = "meta-llama/Llama-2-7b-chat-hf"
tokenizer = AutoTokenizer.from_pretrained(model_id, token=HF_TOKEN)
model = AutoModelForCausalLM.from_pretrained(model_id, token=HF_TOKEN, device_map="auto", torch_dtype=torch.float16)

pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, do_sample=True, temperature=0.7, top_p=0.9, max_new_tokens=512)
sentiment_analyzer = pipeline("sentiment-analysis", device=0 if torch.cuda.is_available() else -1)
logging.info("All models loaded successfully and API is ready.")

# --- 4. Định nghĩa các hàm logic chính ---

def moderate_text(text):
    inputs = moderation_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = moderation_model(**inputs)
    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
    return {'is_harmful': probs[0, 1].item() > 0.7}

def format_prompt_with_context(user_input, conversation_history, retrieved_contexts, urgency_level):
    context_text = "RETRIEVED EXAMPLES:\n" + "\n".join(f"- {ctx}" for ctx in retrieved_contexts) if retrieved_contexts else ""
    urgency_alert = f"\n\nURGENCY: {urgency_level.upper()}. Handle with care." if urgency_level else ""
    sentiment_label, sentiment_score = sentiment_analyzer(user_input)[0]['label'], sentiment_analyzer(user_input)[0]['score']
    sentiment_text = f"\n\nUSER SENTIMENT: {sentiment_label} (confidence: {sentiment_score:.2f})."

    return f"""<s>[INST] <<SYS>>
You are Athena, a compassionate AI therapist. Your goal is to respond with empathy and helpful guidance.
Maintain a warm, supportive tone. Ask thoughtful follow-up questions.
Do NOT use asterisks or describe actions. Use emojis to convey emotion naturally (e.g., 😊, 😔).
{urgency_alert}{sentiment_text}
{context_text}
Previous conversation:
{conversation_history}
<</SYS>>
User: {user_input} [/INST]"""

# --- 5. Định nghĩa các API Endpoints ---

class ChatRequest(BaseModel):
    user_input: str
    conversation_history: str = "" # Back-end của bạn sẽ truyền lịch sử hội thoại vào đây

class ChatResponse(BaseModel):
    response: str
    urgency_level: str | None = None
    recommended_resources: list = []

@app.get('/health', status_code=200, tags=["Health"])
def health_check():
    """Endpoint để Vertex AI kiểm tra tình trạng hoạt động của container."""
    return {"status": "healthy"}

@app.post("/predict", response_model=ChatResponse, tags=["Chat"])
def predict(request: ChatRequest):
    """
    Endpoint chính nhận đầu vào từ người dùng và trả về phản hồi từ AI.
    """ 
    try:
        user_input = request.user_input
        history = request.conversation_history

        # 1. Vệ sinh và kiểm duyệt đầu vào
        sanitized_input = sanitize_input(user_input)
        if not sanitized_input:
            raise HTTPException(status_code=400, detail="Input is empty after sanitization.")
        if moderate_text(sanitized_input)['is_harmful']:
            raise HTTPException(status_code=400, detail="Input detected as harmful.")

        # 2. Phân tích và tạo prompt
        urgency_level = enhanced_crisis_detection(sanitized_input)
        retrieved_contexts = retriever(sanitized_input, k=3)
        formatted_prompt = format_prompt_with_context(sanitized_input, history, retrieved_contexts, urgency_level)

        # 3. Gọi mô hình
        output = pipe(formatted_prompt)
        raw_response = output[0]['generated_text']
        response_text = raw_response.split("[/INST]")[-1].strip()

        # 4. Kiểm duyệt đầu ra
        if moderate_text(response_text)['is_harmful']:
            response_text = "I apologize, but I am unable to provide a helpful response at this time. Could we discuss something else?"
        
        # 5. Đề xuất tài nguyên nếu cần
        resources = recommend_resources(urgency_level) if urgency_level else []

        return ChatResponse(
            response=response_text,
            urgency_level=urgency_level,
            recommended_resources=resources
        )
    except Exception as e:
        logging.error(f"Error during prediction: {str(e)}")
        # Che giấu lỗi chi tiết khỏi người dùng cuối
        raise HTTPException(status_code=500, detail="An internal server error occurred.")