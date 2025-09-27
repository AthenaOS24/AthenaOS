# download_models.py

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os
import logging

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Danh sách các model cần tải và nơi lưu trữ chúng
MODELS_TO_DOWNLOAD = {
    "moderation": "facebook/roberta-hate-speech-dynabench-r4-target",
    "sentiment": "cardiffnlp/twitter-roberta-base-sentiment-latest",
    "emotion": "bhadresh-savani/distilbert-base-uncased-emotion"
}

SAVE_DIRECTORY_ROOT = "local_models"

def download_and_save_model(model_name, model_id):
    """Tải tokenizer và model từ Hugging Face và lưu vào thư mục cục bộ."""
    save_path = os.path.join(SAVE_DIRECTORY_ROOT, model_name)
    
    if os.path.exists(save_path):
        logger.info(f"Model '{model_name}' already exists at {save_path}. Skipping download.")
        return

    logger.info(f"--- Downloading model '{model_name}' ({model_id})... ---")
    
    try:
        # Tải tokenizer và model
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = AutoModelForSequenceClassification.from_pretrained(model_id)
        
        # Lưu vào thư mục con
        tokenizer.save_pretrained(save_path)
        model.save_pretrained(save_path)
        
        logger.info(f"--- Successfully saved '{model_name}' to {save_path} ---")
    except Exception as e:
        logger.error(f"Failed to download model '{model_name}'. Error: {e}")
        raise

if __name__ == "__main__":
    logger.info("--- Starting pre-download of all local models ---")
    
    if not os.path.exists(SAVE_DIRECTORY_ROOT):
        os.makedirs(SAVE_DIRECTORY_ROOT)
        
    for name, model_id in MODELS_TO_DOWNLOAD.items():
        download_and_save_model(name, model_id)
        
    logger.info("--- All models have been successfully downloaded and saved. ---")