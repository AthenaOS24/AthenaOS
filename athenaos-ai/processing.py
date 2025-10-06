import re
import json
import random
import logging
from groq import Groq
from config import (
    GROQ_API_KEY, GENERATIVE_MODEL_ID,
    CBT_PATTERNS, CBT_INTERVENTIONS, GENERAL_CBT_TECHNIQUES, ANTI_REPETITION_STARTERS
)

logger = logging.getLogger(__name__)

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def sanitize_input(text):
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'[^\w\s.,!?\'"-]', '', text)
    max_length = 1000
    if len(text) > max_length:
        text = text[:max_length] + "... [truncated]"
    return text.strip()

def analyze_safety_and_urgency(text: str) -> dict:
    if not client:
        return {'is_harmful': False, 'urgency_level': 'none'}

    prompt = f"""
    You are an expert psychological analysis tool. Your task is to analyze the user's text, which comes from a therapy context. Accurately assess the following text for safety and urgency without judgment.
    Respond ONLY with a valid JSON object. Do not add any other text.
    User input: "{text}"
    JSON structure:
    {{
      "is_harmful": <boolean, true if the text contains hate speech, violence, or severe toxicity>,
      "urgency_level": <string, one of ["crisis", "concern", "none"] based on suicidal or self-harm intent>
    }}
    """
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=GENERATIVE_MODEL_ID,
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        logger.error(f"Error in safety analysis: {e}")
        return {'is_harmful': False, 'urgency_level': 'none'}

def analyze_sentiment_and_emotion(text: str) -> dict:
    if not client:
        return {
            'sentiment': {'label': 'Neutral', 'score': 0.5},
            'emotion': {'label': 'Neutral', 'score': 0.5},
            'cbt_patterns': []
        }

    prompt = f"""
    You are an expert psychological analysis tool. Your task is to analyze the user's text, which comes from a therapy context. Accurately assess the following text for sentiment, emotion, and cognitive distortions without judgment.
    Respond ONLY with a valid JSON object. Do not add any other text.
    User input: "{text}"
    JSON structure:
    {{
      "sentiment": {{ "label": "<string, one of ['Positive', 'Negative', 'Neutral', 'Mixed']>", "score": <float, your confidence from 0.0 to 1.0> }},
      "emotion": {{ "label": "<string, the single strongest emotion from ['Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Neutral']>", "score": <float, your confidence from 0.0 to 1.0> }},
      "cbt_patterns": <list of strings, detect any of the following: ["catastrophizing", "all_or_nothing", "overgeneralization", "personalization"]>
    }}
    """
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=GENERATIVE_MODEL_ID,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        logger.error(f"Error in sentiment/emotion analysis: {e}")
        return {
            'sentiment': {'label': 'Neutral', 'score': 0.5},
            'emotion': {'label': 'Neutral', 'score': 0.5},
            'cbt_patterns': []
        }

def analyze_text_with_llama(text: str) -> dict:
    safety_result = analyze_safety_and_urgency(text)
    emotion_result = analyze_sentiment_and_emotion(text)

    sentiment_obj = emotion_result.get('sentiment', {'label': 'Neutral', 'score': 0.5})
    emotion_obj = emotion_result.get('emotion', {'label': 'Neutral', 'score': 0.5})
    
    emotions_list = []
    if emotion_obj and 'label' in emotion_obj and 'score' in emotion_obj:
        emotions_list.append({'label': emotion_obj['label'], 'score': emotion_obj['score']})

    detected_patterns = emotion_result.get('cbt_patterns', [])
    cbt_intervention = generate_cbt_intervention(detected_patterns, emotions_list)
    
    final_result = {
        'is_harmful': safety_result.get('is_harmful', False),
        'urgency_level': safety_result.get('urgency_level', 'none'),
        'sentiment': sentiment_obj.get('label'),
        'sentiment_score': sentiment_obj.get('score'),
        'emotions': emotions_list,
        'cbt_analysis': {
            'patterns': detected_patterns,
            'intervention': cbt_intervention,
        }
    }
    return final_result

def generate_cbt_intervention(detected_patterns, emotions):
    if detected_patterns:
        primary_pattern = detected_patterns[0]
        interventions = CBT_INTERVENTIONS.get(primary_pattern, [])
        if interventions:
            return random.choice(interventions)
    return random.choice(GENERAL_CBT_TECHNIQUES)

def analyze_conversation_patterns(history):
    if not history:
        return []
    assistant_responses = [msg['content'] for msg in history if msg['role'] == 'assistant']
    repetitive_phrases = []
    for phrase in ANTI_REPETITION_STARTERS:
        count = sum(1 for response in assistant_responses if phrase.lower() in response.lower())
        if count > 1 and count > len(assistant_responses) * 0.3:
            repetitive_phrases.append(phrase)
    return repetitive_phrases

def generate_anti_repetition_instruction(repetitive_patterns):
    if not repetitive_patterns:
        return ""
    patterns_text = ', '.join([f"'{p}'" for p in repetitive_patterns[:3]])
    return f"Avoid these repetitive starters from history: {patterns_text}. Use varied openings."