# config.py
import os
from dotenv import load_dotenv

# Load all environment variables
load_dotenv()

# ==============================================================================
# API KEYS
# ==============================================================================
# Get the API key for Google Gemini from the environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


# ==============================================================================
# LOCAL MODEL CONFIGURATIONS
# ==============================================================================
# These models will run on Railway for analysis and preprocessing
MODERATION_MODEL_ID = "facebook/roberta-hate-speech-dynabench-r4-target"
SENTIMENT_MODEL_ID = "cardiffnlp/twitter-roberta-base-sentiment-latest"
EMOTION_MODEL_ID = "bhadresh-savani/distilbert-base-uncased-emotion"

# ==============================================================================
# CRISIS & CONCERN PATTERNS
# ==============================================================================
# Keep your crisis detection patterns
CRISIS_PATTERNS = [
    r"\bi (want to|wanna|'m going to|gonna|will|plan to|need to) (die|kill myself|k.m.s|end it all|end my life)\b",
    r"\bi can't (go on|live|take it) (like this )?anymore\b",
]
CONCERN_PATTERNS = [
    r"\bi feel (so )?(hopeless|trapped|worthless|empty|numb)\b",
    r"\b(what's|what is) the point of (living|anything)\b",
]

# ==============================================================================
# MENTAL HEALTH RESOURCES
# ==============================================================================
# Keep the health resources
MENTAL_HEALTH_RESOURCES = {
    'crisis': ["**National Suicide Prevention Lifeline (US)**: Call or text 988."],
    'concern': ["**SAMHSA National Helpline (US)**: 1-800-662-HELP (4357)."],
}

print("Configuration file for Hybrid Architecture loaded successfully.")
