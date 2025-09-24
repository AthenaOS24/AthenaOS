# main.py
import uuid
import requests
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import logging

# Import components from other files
from config import HUGGINGFACE_API_TOKEN, MENTAL_HEALTH_RESOURCES, ANTI_REPETITION_STARTERS
from models import load_local_models
from processing import (
    sanitize_input, moderate_text, combined_sentiment_analysis,
    generate_anti_repetition_instruction
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Athena AI Therapist API (Llama 2 7B HF)",
    version="6.0.0",
    description="AI therapist using Llama 2 7B on Hugging Face with local CBT analysis"
)

# Simple in-memory conversation tracking
conversation_history = {}

@app.on_event("startup")
def startup_event():
    """Load all local models on startup"""
    try:
        load_local_models()
        logger.info("Athena API startup completed successfully")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

# --- Pydantic Models ---
class HistoryItem(BaseModel):
    role: str
    content: str

class SentimentAnalysis(BaseModel):
    label: str
    score: float

class EmotionAnalysis(BaseModel):
    label: str
    score: float

class CBTAnalysis(BaseModel):
    patterns: List[str]
    intervention: Optional[str]
    repetitive_patterns: List[str]

class AnalysisResult(BaseModel):
    sentiment: SentimentAnalysis
    emotions: List[EmotionAnalysis]
    cbt_analysis: CBTAnalysis
    urgency_level: Optional[str]
    resources: Optional[List[str]] = None

class ChatRequest(BaseModel):
    user_input: str
    history: List[HistoryItem] = Field(default_factory=list)
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    analysis: AnalysisResult
    conversation_id: str
    timestamp: str
    word_count: int

# ======================================================================
# HELPER FUNCTION TO CALL HUGGING FACE INFERENCE API
# ======================================================================
def query_huggingface_api(formatted_prompt: str) -> str:
    """
    Sends a request to the Hugging Face Inference API for Llama 2 7B Chat.
    """
    api_url = "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf"
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}

    payload = {
        "inputs": formatted_prompt,
        "parameters": {
            "max_new_tokens": 250,
            "temperature": 0.7,
            "top_p": 0.95,
            "do_sample": True,
            "return_full_text": False
        }
    }
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=45)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        result = response.json()
        
        # Clean up the response
        generated_text = result[0].get('generated_text', '').strip()
        # Remove any lingering instruction tags that the model might output
        if "[/INST]" in generated_text:
            generated_text = generated_text.split("[/INST]")[-1].strip()

        return generated_text
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error querying Hugging Face API: {e}")
        if e.response and e.response.status_code == 503:
            return "The model is currently loading, please try again in a moment."
        return "I'm sorry, I'm having trouble connecting to the AI model right now. Let's try again in a bit."

# --- API Endpoints ---
@app.get("/", tags=["Status"])
async def read_root():
    """Health check endpoint"""
    return {"status": "Athena AI API (Llama 2 HF) is running"}


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def handle_chat(request: ChatRequest):
    """
    Handles the main chat logic, including pre-processing, prompt formatting,
    and calling the Llama 2 model via Hugging Face API.
    """
    session_id = request.session_id or str(uuid.uuid4())
    logger.info(f"Processing request for session: {session_id}")

    if session_id not in conversation_history:
        conversation_history[session_id] = []
    
    current_history = request.history if request.history else conversation_history[session_id]

    # === STEP 1: PRE-PROCESSING & LOCAL ANALYSIS ===
    sanitized_input = sanitize_input(request.user_input)
    if not sanitized_input:
        raise HTTPException(status_code=400, detail="User input cannot be empty.")
        
    moderation_result = moderate_text(sanitized_input)
    if moderation_result['is_harmful']:
        raise HTTPException(status_code=400, detail="Input contains potentially harmful content.")

    analysis_results_dict = combined_sentiment_analysis(sanitized_input, current_history)
    
    # Convert dict to Pydantic model for structured access
    analysis_result_obj = AnalysisResult(
        sentiment=SentimentAnalysis(label=analysis_results_dict['sentiment'], score=analysis_results_dict['sentiment_score']),
        emotions=[EmotionAnalysis(**emo) for emo in analysis_results_dict['emotions']],
        cbt_analysis=CBTAnalysis(**analysis_results_dict['cbt_analysis']),
        urgency_level=analysis_results_dict['urgency_level']
    )

    # Early crisis intervention
    if analysis_result_obj.urgency_level == 'crisis':
        crisis_resources = MENTAL_HEALTH_RESOURCES['crisis']
        response_text = (
            "I hear the pain and urgency in your words, and I'm deeply concerned for your safety. "
            "Please know you're not alone.\n\n**IMMEDIATE HELP IS AVAILABLE:**\n" + 
            "\n".join([f"• {r}" for r in crisis_resources])
        )
        analysis_result_obj.resources = crisis_resources
        return ChatResponse(
            response=response_text,
            analysis=analysis_result_obj,
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=len(response_text.split())
        )

    # === STEP 2: DYNAMIC PROMPT ENGINEERING ===
    system_prompt = f"""
You are Athena, a compassionate AI therapist specializing in Cognitive Behavioral Therapy (CBT).
{generate_anti_repetition_instruction(analysis_result_obj.cbt_analysis.repetitive_patterns)}
Keep responses concise (around 100-150 words). Always validate emotions before offering techniques. End with an open-ended question.

CURRENT USER STATE:
- Sentiment: {analysis_result_obj.sentiment.label}
- Detected CBT Patterns: {', '.join(analysis_result_obj.cbt_analysis.patterns) or 'None'}
"""
    if analysis_result_obj.cbt_analysis.intervention:
        system_prompt += f"Gently suggest this technique: '{analysis_result_obj.cbt_analysis.intervention}'"


    # === STEP 3: FORMAT PROMPT FOR LLAMA 2 CHAT ===
    formatted_prompt = f"<s>[INST] <<SYS>>\n{system_prompt}\n<</SYS>>\n\n"
    history_for_prompt = current_history[-6:]
    if history_for_prompt:
        for i in range(0, len(history_for_prompt), 2):
            if i + 1 < len(history_for_prompt):
                user_msg = history_for_prompt[i].content if isinstance(history_for_prompt[i], HistoryItem) else history_for_prompt[i]['content']
                assistant_msg = history_for_prompt[i+1].content if isinstance(history_for_prompt[i+1], HistoryItem) else history_for_prompt[i+1]['content']
                formatted_prompt += f"{user_msg} [/INST] {assistant_msg} </s><s>[INST] "
    formatted_prompt += f"{sanitized_input} [/INST]"


    # === STEP 4: GENERATE RESPONSE ===
    logger.info(f"Generating Llama 2 (HF API) response...")
    ai_response = query_huggingface_api(formatted_prompt)

    # === STEP 5: POST-PROCESSING & RESPONSE PACKAGING ===
    final_response = ai_response
    word_count = len(final_response.split())

    # Update conversation history in memory
    conversation_history[session_id].append({'role': 'user', 'content': request.user_input})
    conversation_history[session_id].append({'role': 'assistant', 'content': final_response})
    
    if analysis_result_obj.urgency_level:
        analysis_result_obj.resources = MENTAL_HEALTH_RESOURCES.get(analysis_result_obj.urgency_level, [])

    return ChatResponse(
        response=final_response,
        analysis=analysis_result_obj,
        conversation_id=session_id,
        timestamp=datetime.now().isoformat(),
        word_count=word_count
    )

@app.delete("/session/{session_id}", tags=["Session"])
async def delete_session(session_id: str):
    """Delete a conversation session from memory"""
    if session_id in conversation_history:
        del conversation_history[session_id]
        logger.info(f"Session {session_id} deleted")
        return {"message": "Session deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")