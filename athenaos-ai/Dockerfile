# Sử dụng một image Python 3.9 chính thức và gọn nhẹ
FROM python:3.9-slim

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Sao chép file requirements.txt vào trước để tận dụng cache
COPY requirements.txt .

# Cài đặt các thư viện Python cần thiết
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn còn lại
COPY . .

# Mở cổng 8001, đây là cổng mà server FastAPI sẽ chạy
EXPOSE 8001

# Lệnh để khởi chạy Uvicorn server
# --host 0.0.0.0 để server có thể được truy cập từ bên ngoài container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]