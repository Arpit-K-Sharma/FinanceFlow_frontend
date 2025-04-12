'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/axios';

interface UserData {
  id: number;
  name: string;
  email: string;
  savingsBalance?: number;
  savingsPercent?: number;
  expensesPercent?: number;
  investmentsPercent?: number;
  leftoverAction?: 'savings' | 'expenses' | 'investments';
}

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateUserProfile: (userData: Partial<UserData>) => Promise<void>;
  forceRefreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  // Fetch fresh user data directly from API
  const fetchUserData = async (currentToken = token) => {
    if (!currentToken) return null;
    
    try {
      const response = await api.get('/users/profile');
      return response.data.data;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      
      // Pass token directly to ensure it's available
      fetchUserData(storedToken).then(freshUserData => {
        if (freshUserData) {
          setUser(freshUserData);
        }
      });
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    
    // Pass token directly to ensure it's available
    fetchUserData(newToken).then(freshUserData => {
      if (freshUserData) {
        setUser(freshUserData);
      }
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserProfile = async (userData: Partial<UserData>) => {
    try {
      const response = await api.put('/users/profile', userData);
      const updatedUser = response.data.data;
      setUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };
  
  const forceRefreshUser = async () => {
    const freshUserData = await fetchUserData();
    if (freshUserData) {
      setUser(freshUserData);
    }
    return freshUserData;
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      isAuthenticated, 
      login, 
      logout, 
      updateUserProfile,
      forceRefreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 