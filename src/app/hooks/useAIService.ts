import { useState, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface FinancialAdviceType {
  insights: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    category: 'savings' | 'expenses' | 'investments';
    action: string;
    reasoning: string;
  }>;
  market_context: string;
  summary: string;
}

export function useAIService() {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [financialAdvice, setFinancialAdvice] = useState<FinancialAdviceType | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    try {
      setIsLoadingChat(true);
      // Add user message to chat history
      const newMessage: ChatMessage = { role: 'user', content: message };
      setChatHistory(prev => [...prev, newMessage]);

      // Call AI service API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI service');
      }

      const data = await response.json();
      
      // Add assistant message to chat history
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setChatHistory(prev => [...prev, assistantMessage]);
      
      return data.response;
    } catch (error) {
      console.error('Error sending message:', error);
      return 'Sorry, I encountered an error while processing your request.';
    } finally {
      setIsLoadingChat(false);
    }
  }, [user]);

  const fetchFinancialAdvice = useCallback(async () => {
    try {
      setIsLoadingAdvice(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/financial-advice`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get financial advice');
      }

      const data = await response.json();
      setFinancialAdvice(data);
      
      return data;
    } catch (error) {
      console.error('Error fetching financial advice:', error);
      return null;
    } finally {
      setIsLoadingAdvice(false);
    }
  }, []);

  return {
    chatHistory,
    sendMessage,
    financialAdvice,
    fetchFinancialAdvice,
    isLoadingChat,
    isLoadingAdvice
  };
} 