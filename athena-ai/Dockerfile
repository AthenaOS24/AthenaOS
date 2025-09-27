# Dockerfile (Phiên bản gỡ lỗi)

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

# 6. TẠO VÀ KIỂM TRA THƯ MỤC STATIC
# Tạo thư mục 'static'
RUN mkdir static
# Lệnh gỡ lỗi: Liệt kê tất cả file và thư mục để xác nhận 'static' đã được tạo
RUN ls -la

# 7. Lệnh Khởi động
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}