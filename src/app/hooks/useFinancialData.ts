import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalInvestments: number;
  netWorth: number;
}

export function useFinancialData() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch financial summary');
      }

      const data = await response.json();
      setSummary(data);
      return data;
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSummary();
    }
  }, [user, fetchSummary]);

  return {
    summary,
    isLoading,
    refreshData: fetchSummary
  };
} 