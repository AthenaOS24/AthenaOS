# processing.py
import re
import torch
import random
import logging
from models import get_moderation_model, get_sentiment_analyzer, get_emotion_analyzer
from config import (
    CRISIS_PATTERNS, CONCERN_PATTERNS, MENTAL_HEALTH_RESOURCES, 
    CBT_PATTERNS, CBT_INTERVENTIONS, GENERAL_CBT_TECHNIQUES, ANTI_REPETITION_STARTERS
)

logger = logging.getLogger(__name__)

def sanitize_input(text):
    """Enhanced sanitization with PII redaction and improved cleaning."""
    if not text:
        return ""
    
    # V2-style PII anonymization
    text = re.sub(r'\S+@\S+', '[EMAIL]', text)
    text = re.sub(r'(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})', '[PHONE]', text)
    text = re.sub(r'\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}', '[CREDIT_CARD]', text)
    text = re.sub(r'\d{3}-\d{2}-\d{4}', '[SSN]', text)
    
    # Remove HTML/script tags
    text = re.sub(r'<script.*?>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean special characters but preserve punctuation
    text = re.sub(r'[^\w\s.,!?\'"-]', '', text)
    
    # Truncate if too long
    max_length = 1000
    if len(text) > max_length:
        text = text[:max_length] + "... [truncated]"
    
    return text.strip()

def moderate_text(text):
    """Enhanced moderation with lower threshold and better logging."""
    try:
        mod_model, mod_tokenizer = get_moderation_model()
        inputs = mod_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = mod_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        # Assuming label 1 is 'harmful'
        harmful_score = probs[0, 1].item()
        
        logger.info(f"Moderation score: {harmful_score:.3f}")
        return {'is_harmful': harmful_score > 0.7, 'score': harmful_score}  # Lowered from 0.8
    except Exception as e:
        logger.error(f"Moderation error: {e}")
        return {'is_harmful': False, 'score': 0.0}

def enhanced_crisis_detection(text):
    """Enhanced crisis detection with V2's expanded patterns."""
    if not text:
        return None
        
    text_lower = text.lower()
    
    # Check for crisis patterns first (more urgent)
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, text_lower):
            logger.warning(f"Crisis pattern detected: {pattern}")
            return "crisis"
    
    # Check for concern patterns
    for pattern in CONCERN_PATTERNS:
        if re.search(pattern, text_lower):
            logger.info(f"Concern pattern detected: {pattern}")
            return "concern"
    
    return None

def detect_cbt_patterns(text):
    """Detect cognitive distortions using CBT patterns."""
    if not text:
        return []
        
    text_lower = text.lower()
    detected_patterns = []
    
    for pattern_name, regex in CBT_PATTERNS.items():
        if re.search(regex, text_lower):
            detected_patterns.append(pattern_name)
            logger.info(f"CBT pattern detected: {pattern_name}")
    
    return detected_patterns

def generate_cbt_intervention(detected_patterns, emotions):
    """Generate targeted CBT intervention based on detected patterns and emotions."""
    if not detected_patterns and not emotions:
        return None
    
    # Prioritize pattern-based interventions
    if detected_patterns:
        primary_pattern = detected_patterns[0]  # Use most prominent
        interventions = CBT_INTERVENTIONS.get(primary_pattern, [])
        if interventions:
            return random.choice(interventions)
    
    # Fallback to emotion-based interventions
    if emotions:
        # Check for strong negative emotions
        strong_negative = [
            emo for emo in emotions 
            if emo['label'].lower() in ['sadness', 'anger', 'fear', 'disgust'] 
            and emo['score'] > 0.7
        ]
        
        if strong_negative:
            logger.info(f"Strong negative emotion detected: {strong_negative[0]['label']}")
            return random.choice(GENERAL_CBT_TECHNIQUES)
    
    # General fallback
    return random.choice(GENERAL_CBT_TECHNIQUES[:2])  # Shorter options for general use

def analyze_conversation_patterns(history):
    """Analyze conversation history for repetitive patterns (simple version)."""
    if not history:
        return []
    
    assistant_responses = [msg['content'] for msg in history if msg['role'] == 'assistant']
    repetitive_phrases = []
    
    for phrase in ANTI_REPETITION_STARTERS:
        phrase_lower = phrase.lower()
        count = sum(1 for response in assistant_responses if phrase_lower in response.lower())
        if count > len(assistant_responses) * 0.3:  # Appears in >30% of responses
            repetitive_phrases.append(phrase)
    
    return repetitive_phrases

def combined_sentiment_analysis(text, history=None):
    """Enhanced analysis combining sentiment, emotions, CBT patterns, and crisis detection."""
    try:
        logger.info(f"Analyzing text: {text[:50]}...")
        
        # Sentiment analysis
        sentiment_analyzer = get_sentiment_analyzer()
        sentiment_result = sentiment_analyzer(text)[0]
        sentiment_label = sentiment_result['label'].lower()
        sentiment_score = sentiment_result['score']
        
        logger.info(f"Sentiment: {sentiment_label} (score: {sentiment_score:.2f})")

        # Emotion analysis
        emotion_analyzer = get_emotion_analyzer()
        emotion_results = emotion_analyzer(text)[0]
        emotions = [
            {'label': result['label'], 'score': result['score']} 
            for result in emotion_results 
            if result['score'] > 0.1  # Filter low-confidence emotions
        ]
        
        logger.info(f"Emotions: {[f'{e['label']}({e['score']:.2f})' for e in emotions[:3]]}")

        # CBT pattern detection
        detected_patterns = detect_cbt_patterns(text)
        
        # Generate CBT intervention
        cbt_intervention = generate_cbt_intervention(detected_patterns, emotions)
        
        # Crisis/concern detection
        urgency_level = enhanced_crisis_detection(text)
        
        # Override sentiment for urgency
        if urgency_level:
            sentiment_label = 'crisis' if urgency_level == 'crisis' else 'concern'
            sentiment_score = 1.0
            logger.warning(f"Urgency override: {urgency_level}")

        # Analyze conversation patterns if history provided
        repetitive_patterns = analyze_conversation_patterns(history) if history else []

        result = {
            'sentiment': sentiment_label,
            'sentiment_score': sentiment_score,
            'emotions': emotions,
            'cbt_patterns': detected_patterns,
            'cbt_intervention': cbt_intervention,
            'urgency_level': urgency_level,
            'repetitive_patterns': repetitive_patterns
        }
        
        logger.info(f"Analysis complete: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error in combined_sentiment_analysis: {e}")
        return {
            'sentiment': 'unknown',
            'sentiment_score': 0.0,
            'emotions': [],
            'cbt_patterns': [],
            'cbt_intervention': None,
            'urgency_level': None,
            'repetitive_patterns': []
        }

def generate_anti_repetition_instruction(repetitive_patterns):
    """Generate instruction to avoid repetitive patterns."""
    if not repetitive_patterns:
        return ""
    
    patterns_text = ', '.join([f"'{p}'" for p in repetitive_patterns[:3]])
    return f"Avoid these repetitive starters from history: {patterns_text}. Use varied openings."