# main.py
import traceback
import random
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import google.generativeai as genai
import logging

# Import components from other files
from config import GOOGLE_API_KEY, MENTAL_HEALTH_RESOURCES, ANTI_REPETITION_STARTERS
from models import load_local_models
from processing import (
    sanitize_input, moderate_text, combined_sentiment_analysis, 
    generate_anti_repetition_instruction
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration and Startup ---
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-pro-latest')
    logger.info("Google Gemini client initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Google Gemini client: {e}")
    gemini_model = None

app = FastAPI(
    title="Athena AI Therapist API (CBT Enhanced Hybrid Architecture)",
    version="5.1.0",
    description="Advanced AI therapist with Cognitive Behavioral Therapy integration"
)

# Simple in-memory conversation tracking (for production, use Redis/PostgreSQL)
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

# --- Enhanced Pydantic Models ---
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
        "status": "Athena AI API (CBT Enhanced) is running",
        "version": "5.1.0",
        "features": ["CBT Pattern Detection", "Enhanced Crisis Detection", "Dynamic Interventions"]
    }

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def handle_chat(request: ChatRequest):
    """Enhanced chat endpoint with comprehensive CBT analysis"""
    if not gemini_model:
        raise HTTPException(status_code=500, detail="Gemini client not initialized.")

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
    
    # Content moderation
    moderation_result = moderate_text(sanitized_input)
    if moderation_result['is_harmful']:
        logger.warning(f"Harmful content detected (score: {moderation_result['score']:.3f})")
        raise HTTPException(
            status_code=400, 
            detail="Input contains harmful content. Please focus on positive and constructive topics."
        )

    # Comprehensive CBT-enhanced analysis
    analysis_result = combined_sentiment_analysis(sanitized_input, conversation_history[session_id])
    
    # Early crisis intervention
    if analysis_result['urgency_level'] == 'crisis':
        crisis_resources = MENTAL_HEALTH_RESOURCES['crisis'][:2]  # Top 2 for urgency
        return ChatResponse(
            response=f"I hear the pain and urgency in your words, and I'm deeply concerned for your safety. "
                    f"Please know you're not alone right now.\n\n"
                    f"**IMMEDIATE HELP IS AVAILABLE:**\n" + 
                    "\n".join([f"• {r}" for r in crisis_resources]) +
                    "\n\nI'm here to listen, but please reach out to these services immediately. "
                    f"What can I do to support you while you make that connection?",
            analysis=AnalysisResult(**analysis_result),
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=0  # Will be calculated below
        )

    # === STEP 2: ADVANCED PROMPT ENGINEERING ===
    # Analyze conversation for repetitive patterns
    repetitive_patterns = analysis_result['cbt_analysis']['repetitive_patterns']
    anti_repetition_instruction = generate_anti_repetition_instruction(repetitive_patterns)

    # Dynamic CBT instruction based on analysis
    cbt_instruction = ""
    detected_patterns = analysis_result['cbt_analysis']['patterns']
    
    if detected_patterns:
        primary_pattern = detected_patterns[0]
        intervention = analysis_result['cbt_analysis']['intervention']
        cbt_instruction = f"""
        The user exhibits {primary_pattern} cognitive distortion. Your response should:
        1. First validate their emotions and show understanding
        2. Gently introduce the CBT concept without jargon
        3. Suggest the specific technique: '{intervention}'
        4. End with an open-ended question to continue the dialogue
        """
        logger.info(f"CBT instruction generated for pattern: {primary_pattern}")
    elif any(
        emo['label'].lower() in ['sadness', 'anger', 'fear', 'disgust'] 
        and emo['score'] > 0.7 
        for emo in analysis_result['emotions']
    ):
        cbt_instruction = """
        The user expresses strong negative emotions. Prioritize:
        1. Deep empathy and validation of their feelings
        2. A simple, immediate coping technique (breathing, grounding)
        3. Invitation to explore the emotion further
        4. Avoid problem-solving; focus on emotional containment
        """

    # Get primary emotion for context
    primary_emotion = (
        max(analysis_result['emotions'], key=lambda x: x['score'])['label'] 
        if analysis_result['emotions'] else 'unclear'
    )

    # Enhanced system prompt with sophisticated CBT integration
    system_prompt = f"""
You are Athena, a compassionate AI therapist specializing in Cognitive Behavioral Therapy (CBT).

🎯 CRITICAL RESPONSE GUIDELINES:
{anti_repetition_instruction}

- Vary your opening phrases - avoid these common starters: {', '.join(ANTI_REPETITION_STARTERS[:4])}
- Keep responses concise (100-150 words) unless the user requests more depth
- Always validate emotions before offering techniques
- Use warm, professional language without clinical jargon
- End with an open-ended question to continue dialogue

📊 CURRENT USER STATE:
- Sentiment: {analysis_result['sentiment']} (confidence: {analysis_result['sentiment_score']:.2f})
- Primary Emotion: {primary_emotion} ({analysis_result['emotions'][0]['score']:.2f} if analysis_result['emotions'] else 0.0)
- Detected CBT Patterns: {', '.join(detected_patterns) if detected_patterns else 'None'}
- Urgency Level: {analysis_result['urgency_level'] or 'Routine conversation'}

{cbt_instruction}

💡 CBT INTEGRATION:
- If cognitive distortions detected, gently challenge with curiosity, not confrontation
- Frame interventions as collaborative experiments, not prescriptions
- Always tie techniques to the user's specific situation and words
- Balance validation (70%) with gentle guidance (30%)

Remember: Your role is to create a safe, empathetic space where the user feels heard and empowered.
"""

    # === STEP 3: BUILD ENHANCED CONVERSATION CONTEXT ===
    gemini_history = [
        {
            'role': 'user', 
            'parts': [{'text': system_prompt}]
        },
        {
            'role': 'model', 
            'parts': [{'text': "I understand your instructions. I'm ready to respond as Athena with compassion and CBT expertise."}]
        }
    ]

    # Add conversation history
    for message in conversation_history[session_id][-6:]:  # Last 6 messages for context
        role = 'model' if message['role'] == 'assistant' else 'user'
        gemini_history.append({
            'role': role, 
            'parts': [{'text': message['content']}]
        })

    # === STEP 4: GENERATE ENHANCED RESPONSE ===
    try:
        logger.info(f"Generating Gemini response for: {sanitized_input[:50]}...")
        chat_session = gemini_model.start_chat(history=gemini_history)
        response = chat_session.send_message(sanitized_input)
        ai_response = response.text.strip()

        # === STEP 5: ENHANCE RESPONSE WITH CBT ELEMENTS ===
        final_response = ai_response
        
        # Add CBT intervention if appropriate and not already included
        if (analysis_result['cbt_analysis']['intervention'] and 
            analysis_result['cbt_analysis']['intervention'] not in final_response):
            
            intervention_marker = "💡 CBT Suggestion: "
            final_response += f"\n\n{intervention_marker}{analysis_result['cbt_analysis']['intervention']}"

        # Add concern-level resources if appropriate
        if analysis_result['urgency_level'] == 'concern':
            concern_resources = MENTAL_HEALTH_RESOURCES['concern'][:1]  # One key resource
            resource_marker = "🟡 Helpful Resource: "
            final_response += f"\n\n{resource_marker}{concern_resources[0]}"

        # Calculate word count
        word_count = len(final_response.split())

        # Update conversation history
        conversation_history[session_id].append({
            'role': 'user', 
            'content': request.user_input,
            'timestamp': datetime.now().isoformat()
        })
        conversation_history[session_id].append({
            'role': 'assistant', 
            'content': final_response,
            'timestamp': datetime.now().isoformat()
        })

        # Prepare final analysis with resources
        final_analysis = analysis_result.copy()
        if analysis_result['urgency_level']:
            final_analysis['resources'] = MENTAL_HEALTH_RESOURCES.get(
                analysis_result['urgency_level'], MENTAL_HEALTH_RESOURCES['general']
            )[:3]  # Limit resources for API response size

        logger.info(f"Response generated successfully ({word_count} words)")

        return ChatResponse(
            response=final_response,
            analysis=AnalysisResult(**final_analysis),
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=word_count
        )

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error generating response: {error_msg}")
        
        if "response was blocked" in error_msg.lower():
            raise HTTPException(
                status_code=400, 
                detail="Response blocked by safety filters. Let's try a different approach."
            )
        
        # Fallback response for technical issues
        fallback_response = (
            "I appreciate you sharing that with me. Sometimes technical things get in the way, "
            "but I'm still here listening. Could you tell me a bit more about what you're feeling right now?"
        )
        
        return ChatResponse(
            response=fallback_response,
            analysis=AnalysisResult(**analysis_result),
            conversation_id=session_id,
            timestamp=datetime.now().isoformat(),
            word_count=len(fallback_response.split())
        )

@app.get("/stats/{session_id}", tags=["Analytics"])
async def get_conversation_stats(session_id: str):
    """Get conversation statistics and insights"""
    if session_id not in conversation_history:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = conversation_history[session_id]
    user_messages = [msg for msg in history if msg['role'] == 'user']
    assistant_messages = [msg for msg in history if msg['role'] == 'assistant']
    
    if not user_messages:
        return {"message": "No user messages in this session yet"}
    
    # Basic stats
    total_messages = len(user_messages)
    avg_user_words = sum(len(msg['content'].split()) for msg in user_messages) / total_messages
    avg_response_words = sum(len(msg['content'].split()) for msg in assistant_messages) / len(assistant_messages) if assistant_messages else 0
    
    # Last analysis (from most recent user message)
    recent_analysis = "No recent analysis available"
    if len(user_messages) >= 1:
        # Re-run analysis on last user message for current state
        last_message = user_messages[-1]['content']
        analysis = combined_sentiment_analysis(last_message, history)
        recent_analysis = (
            f"Sentiment: {analysis['sentiment']} | "
            f"Emotions: {', '.join([f'{e['label']}({e['score']:.1f})' for e in analysis['emotions'][:2]])} | "
            f"CBT Patterns: {', '.join(analysis['cbt_patterns']) or 'None'}"
        )
    
    # CBT interventions used (simple tracking)
    cbt_interventions_used = set()
    for msg in assistant_messages:
        if "💡 CBT Suggestion:" in msg['content']:
            # Extract intervention text
            start = msg['content'].find("💡 CBT Suggestion: ") + len("💡 CBT Suggestion: ")
            end = msg['content'].find("\n", start)
            if end == -1:
                end = len(msg['content'])
            intervention = msg['content'][start:end].strip()
            cbt_interventions_used.add(intervention[:50] + "..." if len(intervention) > 50 else intervention)
    
    return {
        "session_id": session_id,
        "total_user_messages": total_messages,
        "avg_user_message_length": round(avg_user_words, 1),
        "avg_response_length": round(avg_response_words, 1),
        "total_conversation_length": len(history),
        "recent_analysis": recent_analysis,
        "cbt_interventions_used": list(cbt_interventions_used),
        "conversation_duration": (
            datetime.now() - datetime.fromisoformat(history[0].get('timestamp', datetime.now().isoformat()))
        ).total_seconds() / 60 if history else 0  # Minutes
    }

@app.delete("/session/{session_id}", tags=["Session"])
async def delete_session(session_id: str):
    """Delete a conversation session"""
    if session_id in conversation_history:
        del conversation_history[session_id]
        logger.info(f"Session {session_id} deleted")
        return {"message": "Session deleted successfully", "session_id": session_id}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@app.get("/health", tags=["Status"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "gemini_available": gemini_model is not None,
        "active_sessions": len(conversation_history),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)