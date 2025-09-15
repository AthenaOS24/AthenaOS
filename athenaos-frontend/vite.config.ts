import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Thêm đoạn code này vào
  preview: {
    port: parseInt(process.env.PORT) || 8080, // Dùng port của Cloud Run
    host: '0.0.0.0' // Chấp nhận kết nối từ mọi địa chỉ IP
  }
})
