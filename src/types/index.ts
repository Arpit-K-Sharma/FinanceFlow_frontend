// Chat Types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
}

// Financial Data Types
export interface Section {
  id: string;
  name: string;
  balance: number;
  type: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  fromSection?: string;
  toSection?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingGoal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  transferType: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  savingsPercent?: number;
  expensesPercent?: number;
  investmentsPercent?: number;
  leftoverAction?: string;
  emailVerified: boolean;
} 