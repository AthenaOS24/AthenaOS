# models.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from config import MODERATION_MODEL_ID, SENTIMENT_MODEL_ID, EMOTION_MODEL_ID
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize local models
moderation_model = None
moderation_tokenizer = None
sentiment_analyzer = None
emotion_analyzer = None

def load_local_models():
    """Load all necessary auxiliary models when the server starts up."""
    logger.info("--- Loading enhanced models for CBT analysis... ---")
    get_moderation_model()
    get_sentiment_analyzer()
    get_emotion_analyzer()
    logger.info("--- All CBT-enhanced models loaded successfully. ---")

def get_moderation_model():
    """Load the content moderation model."""
    global moderation_model, moderation_tokenizer
    if moderation_model is None:
        logger.info(f"--- Loading Moderation model ({MODERATION_MODEL_ID})... ---")
        try:
            moderation_tokenizer = AutoTokenizer.from_pretrained(MODERATION_MODEL_ID)
            moderation_model = AutoModelForSequenceClassification.from_pretrained(MODERATION_MODEL_ID)
            logger.info("Moderation model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load moderation model: {e}")
            raise
    return moderation_model, moderation_tokenizer

def get_sentiment_analyzer():
    """Load the sentiment analysis model."""
    global sentiment_analyzer
    if sentiment_analyzer is None:
        logger.info(f"--- Loading Sentiment model ({SENTIMENT_MODEL_ID})... ---")
        try:
            sentiment_analyzer = pipeline(
                "sentiment-analysis", 
                model=SENTIMENT_MODEL_ID,
                device=-1   
            )
            logger.info("Sentiment analyzer loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load sentiment analyzer: {e}")
            raise
    return sentiment_analyzer

def get_emotion_analyzer():
    """Load the detailed emotion analysis model."""
    global emotion_analyzer
    if emotion_analyzer is None:
        logger.info(f"--- Loading Emotion model ({EMOTION_MODEL_ID})... ---")
        try:
            emotion_analyzer = pipeline(
                "text-classification", 
                model=EMOTION_MODEL_ID, 
                top_k=None,
                device=-1 # Use CPU
            )
            logger.info("Emotion analyzer loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load emotion analyzer: {e}")
            raise
    return emotion_analyzer