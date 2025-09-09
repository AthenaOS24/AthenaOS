// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  // HÃY CHẮC CHẮN BẠN CÓ KHỐI `server` NÀY
  server: {
    host: '0.0.0.0' 
  }
})
