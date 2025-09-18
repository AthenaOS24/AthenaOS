import os
import argparse
import joblib
import logging
from itertools import chain

from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from google.cloud import storage

# Thiết lập logging cơ bản để theo dõi tiến trình
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def load_and_process_datasets(limit_per_dataset=2000):
    """
    Tải và xử lý các bộ dữ liệu từ Hugging Face Hub.
    Hàm này được giữ nguyên từ mã nguồn gốc của bạn.
    """
    datasets = []
    logging.info("Loading Empathetic Dialogues dataset...")
    empathetic = load_dataset("Estwld/empathetic_dialogues_llm", split=f"train[:{limit_per_dataset}]")
    processed_empathetic = []
    for example in empathetic:
        content = f"Emotion: {example['emotion']}. Situation: {example['situation']}. "
        for conv in example['conversations']:
            if conv['role'] == 'assistant':
                content += f"Response: {conv['content']}"
                break
        processed_empathetic.append({"content": content})
    datasets.append(processed_empathetic)

    logging.info("Loading Mental Health Counseling dataset...")
    mental_health = load_dataset("Amod/mental_health_counseling_conversations", split=f"train[:{limit_per_dataset}]")
    processed_mental_health = []
    for example in mental_health:
        content = f"Context: {example['Context']}. Response: {example['Response']}"
        processed_mental_health.append({"content": content})
    datasets.append(processed_mental_health)

    logging.info("Loading HeliosBrahma dataset...")
    helios = load_dataset("heliosbrahma/mental_health_chatbot_dataset", split=f"train[:{limit_per_dataset}]")
    processed_helios = []
    for example in helios:
        if "HUMAN" in example and "ASSISTANT" in example:
            content = f"User: {example['HUMAN'].strip()}. Response: {example['ASSISTANT'].strip()}"
            processed_helios.append({"content": content})
    datasets.append(processed_helios)

    logging.info("Loading PHR Mental Therapy dataset...")
    try:
        phr = load_dataset("vibhorag101/phr_mental_therapy_dataset")
        available_splits = list(phr.keys())
        split_to_use = "train" if "train" in available_splits else available_splits[0]
        phr_data = list(phr[split_to_use])[:limit_per_dataset]
        processed_phr = []
        for example in phr_data:
            if "text" in example:
                text = example["text"]
                turns = text.split("<s>[INST]")
                for turn in turns[1:]:
                    if "[/INST]" in turn:
                        parts = turn.split("[/INST]", 1)
                        if len(parts) == 2:
                            user_input = parts[0].strip()
                            if "<<SYS>>" in user_input and "<</SYS>>" in user_input:
                                sys_parts = user_input.split("<</SYS>>", 1)
                                user_input = sys_parts[1].strip() if len(sys_parts) > 1 else user_input
                            assistant_response = parts[1].strip().replace("</s>", "").replace("<s>", "").strip()
                            content = f"User: {user_input}. Response: {assistant_response}"
                            processed_phr.append({"content": content})
        datasets.append(processed_phr)
    except Exception as e:
        logging.error(f"Error loading PHR dataset: {e}")

    combined_data = list(chain(*datasets))
    logging.info(f"Total documents loaded: {len(combined_data)}")
    return combined_data

def main(args):
    """
    Hàm chính thực hiện việc tạo và tải retriever lên GCS.
    """
    logging.info("Starting retriever build process...")

    # 1. Tải và xử lý dữ liệu
    documents = load_and_process_datasets(limit_per_dataset=2000)
    texts = [doc["content"] for doc in documents]

    # 2. Tạo vectorizer và ma trận TF-IDF
    logging.info("Creating TF-IDF vectorizer and matrix...")
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(texts)

    # 3. Lưu các đối tượng vào file cục bộ tạm thời
    local_vectorizer_path = 'vectorizer.joblib'
    local_matrix_path = 'tfidf_matrix.joblib'
    local_texts_path = 'texts.joblib'

    joblib.dump(vectorizer, local_vectorizer_path)
    joblib.dump(tfidf_matrix, local_matrix_path)
    joblib.dump(texts, local_texts_path)
    logging.info("Artifacts saved locally to temporary files.")

    # 4. Tải các file đã lưu lên Google Cloud Storage
    logging.info(f"Uploading artifacts to GCS bucket: {args.bucket_name}")
    storage_client = storage.Client()
    bucket = storage_client.bucket(args.bucket_name)

    for local_path in [local_vectorizer_path, local_matrix_path, local_texts_path]:
        blob = bucket.blob(f'retriever_artifacts/{os.path.basename(local_path)}')
        blob.upload_from_filename(local_path)
        logging.info(f"Uploaded {local_path} to GCS.")

    logging.info("Successfully uploaded all artifacts to GCS.")

if __name__ == '__main__':
    # Thiết lập parser để nhận tham số dòng lệnh
    parser = argparse.ArgumentParser(description="Build and upload a TF-IDF retriever for Athena model.")
    parser.add_argument(
        '--bucket-name',
        type=str,
        required=True,
        help='The Google Cloud Storage bucket name to save retriever artifacts.'
    )
    args = parser.parse_args()
    main(args)