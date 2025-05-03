import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage } from '@/types';
import { FinancialAdvice, ChatResponse } from '@/app/services/aiService';

interface ChatState {
  // UI state
  isWidgetOpen: boolean;
  isChatMode: boolean;
  isFloatingMode: boolean;
  activePage: 'chat' | 'advice';
  
  // Chat data
  chatHistory: ChatMessage[];
  financialAdvice: FinancialAdvice | null;
  isLoadingChat: boolean;
  isLoadingAdvice: boolean;
  
  // Actions
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  setChatMode: (isChat: boolean) => void;
  setActivePage: (page: 'chat' | 'advice') => void;
  setFloatingMode: (isFloating: boolean) => void;
  
  // Chat actions
  addMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setFinancialAdvice: (advice: FinancialAdvice | null) => void;
  setIsLoadingChat: (isLoading: boolean) => void;
  setIsLoadingAdvice: (isLoading: boolean) => void;
  updateChatHistory: (messages: ChatMessage[]) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      // Initial UI state
      isWidgetOpen: false,
      isChatMode: true,
      isFloatingMode: true,
      activePage: 'chat',
      
      // Initial chat data
      chatHistory: [],
      financialAdvice: null,
      isLoadingChat: false,
      isLoadingAdvice: false,
      
      // UI actions
      openWidget: () => set({ isWidgetOpen: true }),
      closeWidget: () => set({ isWidgetOpen: false }),
      toggleWidget: () => set((state) => ({ isWidgetOpen: !state.isWidgetOpen })),
      setChatMode: (isChat) => set({ isChatMode: isChat }),
      setActivePage: (page) => set({ activePage: page }),
      setFloatingMode: (isFloating) => set({ isFloatingMode: isFloating }),
      
      // Chat actions
      addMessage: (message) => set((state) => ({ 
        chatHistory: [...state.chatHistory, message] 
      })),
      clearChat: () => set({ chatHistory: [] }),
      setFinancialAdvice: (advice) => set({ financialAdvice: advice }),
      setIsLoadingChat: (isLoading) => set({ isLoadingChat: isLoading }),
      setIsLoadingAdvice: (isLoading) => set({ isLoadingAdvice: isLoading }),
      updateChatHistory: (messages) => set({ chatHistory: messages }),
    }),
    {
      name: 'finance-chat-storage',
      partialize: (state) => ({ 
        chatHistory: state.chatHistory,
        financialAdvice: state.financialAdvice
      }),
    }
  )
); 