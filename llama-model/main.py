# main.py

import traceback
import random
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
from groq import Groq, APIError, APIConnectionError  

# Import components from other files
from config import GROQ_API_KEY, GENERATIVE_MODEL_ID, MENTAL_HEALTH_RESOURCES, ANTI_REPETITION_STARTERS  
from models import load_local_models
from processing import (
    sanitize_input, moderate_text, combined_sentiment_analysis, 
    generate_anti_repetition_instruction
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration and Startup ---
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY not found in environment variables.")
    client = None
else:
    client = Groq(api_key=GROQ_API_KEY)
    logger.info(f"Groq client configured for model: {GENERATIVE_MODEL_ID}")

app = FastAPI(
    title="Athena AI Therapist API (CBT Enhanced Hybrid Architecture with Groq/Llama3)",  
    version="7.0.0",
    description="Advanced AI therapist with Cognitive Behavioral Therapy integration, powered by Llama-3 via Groq."  
)

# Simple in-memory conversation tracking  
conversation_history = {}

@app.on_event("startup")
def startup_event():
    """Load all local analysis models on startup"""
    try:
        load_local_models()
        logger.info("Athena API startup completed successfully")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

# --- Enhanced Pydantic Models (unchanged) ---
class HistoryItem(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")

class SentimentAnalysis(BaseModel):
    label: str = Field(..., description="Sentiment label")
    score: float = Field(..., description="Confidence score")

class EmotionAnalysis(BaseModel):
    label: str = Field(..., description="Emotion label")
    score: float = Field(..., description="Confidence score")

class CBTAnalysis(BaseModel):
    patterns: List[str] = Field(default=[], description="Detected cognitive distortions")
    intervention: Optional[str] = Field(None, description="Suggested CBT technique")
    repetitive_patterns: List[str] = Field(default=[], description="Patterns to avoid")

class AnalysisResult(BaseModel):
    sentiment: SentimentAnalysis = Field(..., description="Sentiment analysis")
    emotions: List[EmotionAnalysis] = Field(default=[], description="Detected emotions")
    cbt_analysis: CBTAnalysis = Field(..., description="CBT pattern analysis")
    urgency_level: Optional[str] = Field(None, description="Crisis/concern level")
    resources: Optional[List[str]] = Field(None, description="Recommended resources")

class ChatRequest(BaseModel):
    user_input: str = Field(..., description="User's message")
    history: List[HistoryItem] = Field(default_factory=list, description="Conversation history")
    session_id: Optional[str] = Field(None, description="Session identifier")

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI therapist response")
    analysis: AnalysisResult = Field(..., description="Detailed analysis")
    conversation_id: str = Field(..., description="Session identifier")
    timestamp: str = Field(..., description="Response timestamp")
    word_count: int = Field(..., description="Response word count")

# --- API Endpoints ---
@app.get("/", tags=["Status"])
async def read_root():
    """Health check endpoint"""
    return {
        "status": "Athena AI API (CBT Enhanced with Groq/Llama-3) is running", 
        "version": "7.0.0",
        "features": ["CBT Pattern Detection", "Enhanced Crisis Detection", "Dynamic Interventions", "Groq/Llama-3 Powered"]  
    }

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def handle_chat(request: ChatRequest):
    """Enhanced chat endpoint with comprehensive CBT analysis"""
    if not client:  
        raise HTTPException(status_code=500, detail="Groq API key is not configured.")

    # Generate or validate session ID
    session_id = request.session_id or str(uuid.uuid4())
    logger.info(f"Processing request for session: {session_id}")

    # Update conversation history
    if session_id not in conversation_history:
        conversation_history[session_id] = []
    conversation_history[session_id].extend(
        [{"role": item.role, "content": item.content} for item in request.history]
    )

    # === STEP 1: ENHANCED PRE-PROCESSING & ANALYSIS ===
    sanitized_input = sanitize_input(request.user_input)
    
    moderation_result = moderate_text(sanitized_input)
    if moderation_result['is_harmful']:
        logger.warning(f"Harmful content detected (score: {moderation_result['score']:.3f})")
        raise HTTPException(
            status_code=400, 
            detail="Input contains harmful content. Please focus on positive and constructive topics."
        )

    analysis_result_dict = combined_sentiment_analysis(sanitized_input, conversation_history[session_id])
    
    if analysis_result_dict['urgency_level'] == 'crisis':
        crisis_resources = MENTAL_HEALTH_RESOURCES['crisis'][:2]
        analysis_for_response = analysis_result_dict.copy()
        analysis_for_response['sentiment'] = {'label': analysis_result_dict['sentiment'], 'score': analysis_result_dict['sentiment_score']}
        analysis_for_response['cbt_analysis'] = {
            'patterns': analysis_result_dict.get('cbt_patterns', []),
            'intervention': analysis_result_dict.get('cbt_intervention'),
            'repetitive_patterns': analysis_result_dict.get('repetitive_patterns', [])
        }
        
        return ChatResponse(
            response=f"I hear the pain and urgency in your words, and I'm deeply concerned for your safety. "
                    f"Please know you're not alone right now.\n\n"
                    f"**IMMEDIATE HELP IS AVAILABLE:**\n" + 
                    "\n".join([f"• {r}" for r in crisis_resources]) +
                    "\n\nI'm here to listen, but please reach out to these services immediately.",
            analysis=AnalysisResult(**analysis_for_response),
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=len(sanitized_input.split())
        )

    # === STEP 2: ADVANCED PROMPT ENGINEERING ===
    repetitive_patterns = analysis_result_dict['cbt_analysis']['repetitive_patterns']
    anti_repetition_instruction = generate_anti_repetition_instruction(repetitive_patterns)
    cbt_instruction = ""
    detected_patterns = analysis_result_dict['cbt_analysis']['patterns']
    
    if detected_patterns:
        primary_pattern = detected_patterns[0]
        intervention = analysis_result_dict['cbt_analysis']['intervention']
        cbt_instruction = f"""
        The user exhibits {primary_pattern} cognitive distortion. Your response should:
        1. First validate their emotions and show understanding.
        2. Gently introduce the CBT concept without jargon.
        3. Suggest the specific technique: '{intervention}'.
        4. End with an open-ended question to continue the dialogue.
        """
    elif any(emo['label'].lower() in ['sadness', 'anger', 'fear'] and emo['score'] > 0.7 for emo in analysis_result_dict['emotions']):
        cbt_instruction = """
        The user expresses strong negative emotions. Prioritize:
        1. Deep empathy and validation of their feelings.
        2. A simple, immediate coping technique (like breathing or grounding).
        3. An invitation to explore the emotion further.
        4. Avoid problem-solving; focus on emotional containment.
        """
    primary_emotion = max(analysis_result_dict['emotions'], key=lambda x: x['score'])['label'] if analysis_result_dict['emotions'] else 'unclear'
    
    system_prompt = f"""
You are Athena, a compassionate AI therapist specializing in Cognitive Behavioral Therapy (CBT).

CRITICAL RESPONSE GUIDELINES:
{anti_repetition_instruction}
- Vary your opening phrases; avoid these: {', '.join(ANTI_REPETITION_STARTERS[:4])}.
- Keep responses concise (100-150 words).
- Always validate emotions before offering techniques.
- Use warm, professional language without clinical jargon.
- End with an open-ended question.

CURRENT USER STATE:
- Sentiment: {analysis_result_dict['sentiment']} (confidence: {analysis_result_dict['sentiment_score']:.2f})
- Primary Emotion: {primary_emotion}
- Detected CBT Patterns: {', '.join(detected_patterns) if detected_patterns else 'None'}
- Urgency Level: {analysis_result_dict['urgency_level'] or 'Routine'}

{cbt_instruction}

CBT INTEGRATION:
- If distortions are detected, gently challenge with curiosity, not confrontation.
- Frame interventions as collaborative experiments.
- Always tie techniques to the user's specific situation.
- Balance validation (70%) with gentle guidance (30%).

Your role is to create a safe, empathetic space where the user feels heard and empowered.
"""

    ## === STEP 3: BUILD GROQ-COMPATIBLE MESSAGE LIST ===
    
    messages_for_groq = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history (last 6 messages)
    for message in conversation_history[session_id][-6:]:
        messages_for_groq.append({"role": message['role'], "content": message['content']})
        
    # Add the new user message
    messages_for_groq.append({"role": "user", "content": sanitized_input})

    ## === STEP 4: GENERATE ENHANCED RESPONSE VIA GROQ API ===
    try:
        logger.info(f"Generating Llama-3 response via Groq for: {sanitized_input[:50]}...")
        
        chat_completion = client.chat.completions.create(
            messages=messages_for_groq,
            model=GENERATIVE_MODEL_ID,
            temperature=0.7,
            max_tokens=256,  
            top_p=0.9,
        )
        
        ai_response = chat_completion.choices[0].message.content.strip()

        # === STEP 5: ENHANCE RESPONSE WITH CBT ELEMENTS ===
        final_response = ai_response
        word_count = len(final_response.split())

        # Update conversation history
        conversation_history[session_id].append({'role': 'user', 'content': request.user_input})
        conversation_history[session_id].append({'role': 'assistant', 'content': final_response})

        # Prepare final analysis object for the response
        final_analysis = analysis_result_dict.copy()
        final_analysis['sentiment'] = {'label': final_analysis['sentiment'], 'score': final_analysis['sentiment_score']}
        final_analysis['cbt_analysis'] = {
            'patterns': final_analysis.pop('cbt_patterns', []),
            'intervention': final_analysis.pop('cbt_intervention', None),
            'repetitive_patterns': final_analysis.pop('repetitive_patterns', [])
        }
        if final_analysis['urgency_level']:
            final_analysis['resources'] = MENTAL_HEALTH_RESOURCES.get(final_analysis['urgency_level'], [])[:3]

        logger.info(f"Response generated successfully ({word_count} words)")

        return ChatResponse(
            response=final_response,
            analysis=AnalysisResult(**final_analysis),
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=word_count
        )

    except APIConnectionError as e:
        logger.error(f"Groq API Connection Error: Could not connect to the API. {e.__cause__}")
        raise HTTPException(status_code=503, detail="Service Unavailable: Could not connect to the generative AI service.")
    
    except APIError as e:
        logger.error(f"Groq API Status Error: {e.status_code} - {e.response}")
        raise HTTPException(status_code=500, detail=f"Failed to get a response from Groq API. Status: {e.status_code}")

    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        fallback_response = "I appreciate you sharing that. I'm having a little trouble processing my thoughts right now, but I'm still here to listen. Could you tell me a bit more?"
        
        # Prepare fallback analysis object
        analysis_for_response = analysis_result_dict.copy()
        analysis_for_response['sentiment'] = {'label': analysis_result_dict['sentiment'], 'score': analysis_result_dict['sentiment_score']}
        analysis_for_response['cbt_analysis'] = {
            'patterns': analysis_result_dict.get('cbt_patterns', []),
            'intervention': analysis_result_dict.get('cbt_intervention'),
            'repetitive_patterns': analysis_result_dict.get('repetitive_patterns', [])
        }
        
        return ChatResponse(
            response=fallback_response,
            analysis=AnalysisResult(**analysis_for_response),
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=len(fallback_response.split())
        )

# Update health check
@app.get("/health", tags=["Status"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "generative_model_configured": bool(client and GENERATIVE_MODEL_ID),  
        "active_sessions": len(conversation_history),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)