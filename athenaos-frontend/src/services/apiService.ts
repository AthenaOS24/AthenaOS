// src/services/apiService.ts
import axios from 'axios';
// Fix 1: Use 'import type' for type-only imports
import type { AuthResponse } from '../types';

// The base URL of your backend API
export const API_URL = 'https://athenabackend-825605376128.australia-southeast2.run.app/api';

// A function to handle user login
// Fix 2: Add string types to the function parameters
export const loginUser = async (email: string, password: string) => {
  // We send a POST request to the /auth/login endpoint
  const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
    email,
    password,
  });
  // We return the data from the response (which includes the token)
  return response.data;
};

// A function to handle user registration
export const registerUser = async (username: string, password: string, email: string) => {   
  // We send a POST request to the /auth/register endpoint
  const response = await axios.post(`${API_URL}/auth/register`, {
    username,
    password,
    email,
  });
  // We return the data from the response
  return response.data;
};
