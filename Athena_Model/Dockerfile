# Sử dụng một image nền có sẵn Python
FROM python:3.10-slim

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép file requirements trước
COPY requirements-api.txt .

# Cài đặt thư viện Python
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements-api.txt

# Sao chép mã nguồn của ứng dụng
COPY scripts/main.py .

# Cung cấp port 8080 mà Vertex AI Endpoint sẽ lắng nghe
EXPOSE 8080

# Lệnh để chạy API server khi container khởi động
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]