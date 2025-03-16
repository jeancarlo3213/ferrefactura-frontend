// src/api/auth.js
import axios from 'axios';
const API_URL = 'http://127.0.0.1:8000/api-token-auth/';

export const login = async (username, password) => {
  try {
    const response = await axios.post(API_URL, { username, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error en la autenticación' };
  }
};

export const getToken = () => localStorage.getItem('token');

export const isAuthenticated = () => !!localStorage.getItem('token');

export const logout = () => {
  localStorage.removeItem('token');
};