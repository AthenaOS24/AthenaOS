// src/services/apiService.ts
import axios from 'axios';
import type { AuthResponse } from '../types';

// SỬA ĐỔI CHÍNH: Lấy base URL từ biến môi trường của Vite.
// Khi build trên Google Cloud, nó sẽ tự động lấy giá trị bạn đã thiết lập.
export const API_URL = import.meta.env.VITE_API_BASE_URL;

// A function to handle user login
export const loginUser = async (email: string, password: string) => {
  const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
};

// A function to handle user registration
export const registerUser = async (username: string, password: string, email: string) => {
  const response = await axios.post(`${API_URL}/auth/register`, {
    username,
    password,
    email,
  });
  return response.data;
};

// BỔ SUNG: Thêm hàm sendMessage để quản lý tập trung
export const sendMessage = async (text: string, token: string) => {
  const response = await axios.post(
    `${API_URL}/chat/send-message`,
    { text },
    { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 }
  );
  return response.data;
};