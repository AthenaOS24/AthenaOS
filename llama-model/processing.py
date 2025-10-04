# processing.py
import re
import torch
import random
import logging
from models import get_moderation_model, get_sentiment_analyzer, get_emotion_analyzer
from config import (
    CRISIS_PATTERNS, CONCERN_PATTERNS,
    CBT_PATTERNS, CBT_INTERVENTIONS, GENERAL_CBT_TECHNIQUES, ANTI_REPETITION_STARTERS
)

logger = logging.getLogger(__name__)

def sanitize_input(text):
    """Enhanced sanitization to clean input text."""
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Clean special characters but preserve punctuation
    text = re.sub(r'[^\w\s.,!?\'"-]', '', text)
    # Truncate if too long
    max_length = 1000
    if len(text) > max_length:
        text = text[:max_length] + "... [truncated]"
    return text.strip()

def moderate_text(text):
    """Enhanced moderation with lower threshold."""
    try:
        mod_model, mod_tokenizer = get_moderation_model()
        inputs = mod_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = mod_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        harmful_score = probs[0, 1].item()
        
        logger.info(f"Moderation score: {harmful_score:.3f}")
        return {'is_harmful': harmful_score > 0.7, 'score': harmful_score}
    except Exception as e:
        logger.error(f"Moderation error: {e}")
        return {'is_harmful': False, 'score': 0.0}

def enhanced_crisis_detection(text):
    """Enhanced crisis detection with expanded patterns."""
    if not text:
        return None
    text_lower = text.lower()
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, text_lower):
            logger.warning(f"Crisis pattern detected: {pattern}")
            return "crisis"
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
    return detected_patterns

def generate_cbt_intervention(detected_patterns, emotions):
    """Generate targeted CBT intervention."""
    if detected_patterns:
        primary_pattern = detected_patterns[0]
        interventions = CBT_INTERVENTIONS.get(primary_pattern, [])
        if interventions:
            return random.choice(interventions)
    if emotions:
        strong_negative = [e for e in emotions if e['label'].lower() in ['sadness', 'anger', 'fear'] and e['score'] > 0.95]
        if strong_negative:
            return random.choice(GENERAL_CBT_TECHNIQUES)
    return random.choice(GENERAL_CBT_TECHNIQUES[:2])

def analyze_conversation_patterns(history):
    """Analyze conversation history for repetitive patterns."""
    if not history:
        return []
    assistant_responses = [msg['content'] for msg in history if msg['role'] == 'assistant']
    repetitive_phrases = []
    for phrase in ANTI_REPETITION_STARTERS:
        count = sum(1 for response in assistant_responses if phrase.lower() in response.lower())
        if count > 1 and count > len(assistant_responses) * 0.3:
            repetitive_phrases.append(phrase)
    return repetitive_phrases

def combined_sentiment_analysis(text, history=None):
    """Combines all analysis steps into one function."""
    try:
        sentiment_analyzer = get_sentiment_analyzer()
        sentiment_result = sentiment_analyzer(text)[0]
        
        emotion_analyzer = get_emotion_analyzer()
        emotion_results = emotion_analyzer(text)[0]
        
        emotions = sorted([res for res in emotion_results if res['score'] > 0.1], key=lambda x: x['score'], reverse=True)
        detected_patterns = detect_cbt_patterns(text)
        cbt_intervention = generate_cbt_intervention(detected_patterns, emotions)
        urgency_level = enhanced_crisis_detection(text)
        
        sentiment_label = sentiment_result['label'].lower()
        if urgency_level:
            sentiment_label = 'crisis' if urgency_level == 'crisis' else 'concern'

        repetitive_patterns = analyze_conversation_patterns(history) if history else []

        result = {
            'sentiment': sentiment_label,
            'sentiment_score': sentiment_result['score'],
            'emotions': emotions,
            'cbt_analysis': {
                'patterns': detected_patterns,
                'intervention': cbt_intervention,
                'repetitive_patterns': repetitive_patterns
            },
            'urgency_level': urgency_level,
        }
        logger.info(f"Analysis complete: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error in combined_sentiment_analysis: {e}")
        return {
            'sentiment': 'unknown', 'sentiment_score': 0.0, 'emotions': [],
            'cbt_analysis': {'patterns': [], 'intervention': None, 'repetitive_patterns': []},
            'urgency_level': None
        }

def generate_anti_repetition_instruction(repetitive_patterns):
    """Generate instruction to avoid repetitive patterns."""
    if not repetitive_patterns:
        return ""
    patterns_text = ', '.join([f"'{p}'" for p in repetitive_patterns[:3]])
    return f"Avoid these repetitive starters from history: {patterns_text}. Use varied openings."