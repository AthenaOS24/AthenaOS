# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Mở cổng 8080 để Cloud Run có thể gửi request vào
EXPOSE 8080

# Lệnh để khởi động FastAPI server bằng uvicorn
# Cloud Run sẽ tự động cung cấp biến $PORT
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]