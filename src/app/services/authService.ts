import api from '../utils/axios';
import axios, { AxiosError } from 'axios';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterData) {
    try {
      const response = await api.post('/users/register', data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{message?: string}>;
        throw new Error(axiosError.response?.data?.message || 'Registration failed');
      }
      throw new Error('Registration failed');
    }
  },

  async login(data: LoginData) {
    try {
      const response = await api.post('/users/login', data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{message?: string}>;
        throw new Error(axiosError.response?.data?.message || 'Login failed');
      }
      throw new Error('Login failed');
    }
  },
}; 