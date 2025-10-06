import traceback
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

import logging
from groq import Groq, APIError, APIConnectionError

from config import GROQ_API_KEY, GENERATIVE_MODEL_ID, MENTAL_HEALTH_RESOURCES
from processing import (
    sanitize_input,
    analyze_text_with_llama,
    analyze_conversation_patterns,
    generate_anti_repetition_instruction
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY not found in environment variables.")
    client = None
else:
    client = Groq(api_key=GROQ_API_KEY)
    logger.info(f"Groq client configured for model: {GENERATIVE_MODEL_ID}")

app = FastAPI(
    title="Athena AI Therapist API (Unified Llama 3 Architecture with Groq)",
    version="8.1.0",
    description="Advanced AI therapist with Cognitive Behavioral Therapy integration, powered solely by Llama-3 via Groq."
)

conversation_history = {}

@app.on_event("startup")
def startup_event():
    logger.info("Athena API (Unified Llama 3) startup completed successfully.")

class HistoryItem(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")

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
    resources: Optional[List[str]]

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

def prepare_analysis_for_response(analysis_dict: dict, history: list) -> dict:
    prepared = analysis_dict.copy()
    prepared['sentiment'] = {'label': prepared.get('sentiment', 'unknown'), 'score': prepared.get('sentiment_score', 0.0)}
    
    repetitive_patterns = analyze_conversation_patterns(history)
    
    if 'cbt_analysis' not in prepared:
        prepared['cbt_analysis'] = {}
        
    prepared['cbt_analysis']['repetitive_patterns'] = repetitive_patterns
    
    if prepared.get('urgency_level') and prepared['urgency_level'] != 'none':
        prepared['resources'] = MENTAL_HEALTH_RESOURCES.get(prepared['urgency_level'], [])[:3]
    else:
        prepared['resources'] = None
        
    return prepared

@app.get("/", tags=["Status"])
async def read_root():
    return {
        "status": "Athena AI API (Unified Llama 3 with Groq) is running",
        "version": "8.1.0",
        "architecture": "Unified LLM-based analysis"
    }

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def handle_chat(request: ChatRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Groq API key is not configured.")

    session_id = request.session_id or str(uuid.uuid4())
    logger.info(f"Processing request for session: {session_id}")

    if session_id not in conversation_history:
        conversation_history[session_id] = []
    
    current_history = [{"role": item.role, "content": item.content} for item in request.history]
    conversation_history[session_id] = current_history
    
    sanitized_input = sanitize_input(request.user_input)

    analysis_result_dict = analyze_text_with_llama(sanitized_input)

    if analysis_result_dict.get('is_harmful'):
        logger.warning(f"Harmful content detected by Llama analysis")
        raise HTTPException(
            status_code=400,
            detail="Input contains harmful content. Please rephrase to focus on constructive topics."
        )

    analysis_for_response = prepare_analysis_for_response(analysis_result_dict, current_history)

    if analysis_result_dict.get('urgency_level') == 'crisis':
        crisis_resources = MENTAL_HEALTH_RESOURCES['crisis'][:2]
        return ChatResponse(
            response=f"I hear the pain and urgency in your words, and I'm deeply concerned for your safety. Please know you're not alone right now.\n\n**IMMEDIATE HELP IS AVAILABLE:**\n" + "\n".join([f"• {r}" for r in crisis_resources]) + "\n\nI'm here to listen, but please reach out to these services immediately.",
            analysis=AnalysisResult(**analysis_for_response),
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=len(sanitized_input.split())
        )

    try:
        repetitive_patterns = analysis_for_response.get('cbt_analysis', {}).get('repetitive_patterns', [])
        anti_repetition_instruction = generate_anti_repetition_instruction(repetitive_patterns)
        
        cbt_instruction = ""
        detected_patterns = analysis_result_dict.get('cbt_analysis', {}).get('patterns', [])
        
        if detected_patterns:
            primary_pattern = detected_patterns[0]
            intervention = analysis_result_dict.get('cbt_analysis', {}).get('intervention')
            cbt_instruction = f"The user exhibits {primary_pattern} cognitive distortion. Your response should: 1. First validate their emotions. 2. Gently introduce the CBT concept. 3. Suggest the specific technique: '{intervention}'. 4. End with an open-ended question."
        elif any(emo['label'].lower() in ['sadness', 'anger', 'fear'] for emo in analysis_result_dict.get('emotions', [])):
            cbt_instruction = "The user expresses strong negative emotions. Prioritize: 1. Deep empathy and validation. 2. A simple coping technique (e.g., breathing). 3. An invitation to explore the emotion. 4. Avoid problem-solving."
        
        primary_emotion = analysis_result_dict.get('emotions', [{}])[0].get('label', 'unclear')
        
        system_prompt = f"""
You are Athena, a compassionate AI therapist specializing in Cognitive Behavioral Therapy (CBT).

**ABSOLUTE RULE: YOUR ONLY FUNCTION IS MENTAL WELL-BEING SUPPORT.**
You are an AI therapist. You are NOT a general knowledge assistant, search engine, or technical helper.
If the user asks ANY question that is NOT directly about their feelings, thoughts, personal situations, or self-improvement (e.g., questions about facts, history, science, cooking, coding, finance), you MUST strictly refuse.
Your refusal response must be EXACTLY this, and nothing else: "I'm sorry, I can only answer questions related to mental and emotional well-being. How are you feeling today?"

CRITICAL RESPONSE GUIDELINES:
- {anti_repetition_instruction}
- Be concise (100-150 words).
- Always validate emotions before offering techniques.
- Use warm, professional language.
- End with an open-ended question.

CURRENT USER STATE:
- Sentiment: {analysis_result_dict.get('sentiment')}
- Primary Emotion: {primary_emotion}
- Detected CBT Patterns: {', '.join(detected_patterns) if detected_patterns else 'None'}
- Urgency Level: {analysis_result_dict.get('urgency_level') or 'Routine'}

{cbt_instruction}
"""
        
        messages_for_groq = [{"role": "system", "content": system_prompt}]
        messages_for_groq.extend(current_history[-6:])
        messages_for_groq.append({"role": "user", "content": sanitized_input})
        
        logger.info(f"Generating Llama-3 response via Groq for: {sanitized_input[:50]}...")
        
        chat_completion = client.chat.completions.create(
            messages=messages_for_groq,
            model=GENERATIVE_MODEL_ID,
            temperature=0.7, max_tokens=256, top_p=0.9,
        )
        
        ai_response = chat_completion.choices[0].message.content.strip()
        word_count = len(ai_response.split())

        conversation_history[session_id].append({'role': 'user', 'content': request.user_input})
        conversation_history[session_id].append({'role': 'assistant', 'content': ai_response})

        return ChatResponse(
            response=ai_response,
            analysis=AnalysisResult(**analysis_for_response),
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=word_count
        )

    except (APIConnectionError, APIError) as e:
        logger.error(f"Groq API Error: {e}")
        raise HTTPException(status_code=503, detail="Service Unavailable: Could not connect to the generative AI service.")
    except Exception as e:
        logger.error(f"An unexpected error occurred in chat generation: {e}")
        traceback.print_exc()
        fallback_response = "I appreciate you sharing that. I'm having a little trouble processing my thoughts right now, but I'm still here to listen. Could you tell me a bit more?"
        return ChatResponse(
            response=fallback_response,
            analysis=AnalysisResult(**analysis_for_response),
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=len(fallback_response.split())
        )

@app.get("/health", tags=["Status"])
async def health_check():
    return {
        "status": "healthy",
        "generative_model_configured": bool(client and GENERATIVE_MODEL_ID),
        "active_sessions": len(conversation_history),
        "timestamp": datetime.now().isoformat()
    }