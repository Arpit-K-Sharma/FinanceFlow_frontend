import api from '../utils/axios';
import axios, { AxiosError } from 'axios';

// Define interfaces for API requests and responses
export interface FinancialAdviceRequest {
  message?: string;
}

export interface AIInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIRecommendation {
  category: 'savings' | 'expenses' | 'investments';
  action: string;
  reasoning: string;
}

export interface FinancialAdvice {
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  market_context: string;
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  content: string;
  chat_history: ChatMessage[];
}

export interface ChatResponse {
  response: string;
}

// The API URL for the AI service
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';

// Create a new api instance specifically for AI service
const aiApi = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
aiApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const aiService = {
  async getFinancialAdvice(request: FinancialAdviceRequest = {}): Promise<FinancialAdvice> {
    try {
      const response = await aiApi.post('/financial/advice', request);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{message?: string}>;
        throw new Error(axiosError.response?.data?.message || 'Failed to get financial advice');
      }
      throw new Error('Failed to get financial advice');
    }
  },

  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await aiApi.post('/financial/chat', request);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{message?: string}>;
        throw new Error(axiosError.response?.data?.message || 'Failed to send message');
      }
      throw new Error('Failed to send message');
    }
  },

  async checkAIHealth(): Promise<boolean> {
    try {
      const response = await aiApi.get('/financial/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
}; 