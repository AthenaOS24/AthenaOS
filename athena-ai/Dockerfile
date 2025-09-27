# Dockerfile

# 1. Chọn Image Gốc
# Bắt đầu với một image Python 3.10 gọn nhẹ.
FROM python:3.10-slim

# 2. Thiết lập Môi trường
# Đặt thư mục làm việc bên trong container là /app.
WORKDIR /app

# 3. Cài đặt các Thư viện
# Sao chép file requirements.txt vào trước và cài đặt.
# Docker sẽ cache bước này, giúp build nhanh hơn nếu file không thay đổi.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Tải và "Nướng" Model vào Image (Bước quan trọng nhất)
# Sao chép và chạy script download_models.py.
# Các model AI sẽ được tải và lưu trực tiếp vào image tại bước này.
COPY download_models.py .
RUN python download_models.py

# 5. Sao chép Mã nguồn Ứng dụng
# Sao chép tất cả các file còn lại (.py, Procfile, etc.) vào container.
COPY . .

# 6. Lệnh Khởi động
# Lệnh sẽ được thực thi khi container bắt đầu chạy.
# Nó sử dụng biến môi trường PORT do Cloud Run cung cấp (mặc định là 8080).
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}