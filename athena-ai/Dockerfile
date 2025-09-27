# Dockerfile (Đã cập nhật)

# 1. Chọn Image Gốc
FROM python:3.10-slim

# 2. Thiết lập Môi trường
WORKDIR /app

# 3. Cài đặt các Thư viện
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Tải và "Nướng" Model vào Image
COPY download_models.py .
RUN python download_models.py

# 5. Sao chép Mã nguồn Ứng dụng
COPY . .

# 6. TẠO THƯ MỤC STATIC (*** DÒNG MỚI ĐƯỢC THÊM VÀO ***)
# Tạo thư mục rỗng 'static' để FastAPI có thể mount khi khởi động.
RUN mkdir static

# 7. Lệnh Khởi động
# Lệnh sẽ được thực thi khi container bắt đầu chạy.
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}