import api from './axios';

/**
 * Checks if there are sufficient funds in a section before creating a transaction
 * Returns true if sufficient funds are available, false otherwise
 */
export const checkSectionBalance = async (
  sectionName: string, 
  requiredAmount: number
): Promise<{hasBalance: boolean; availableAmount: number}> => {
  try {
    // Get current section balances
    const response = await api.get('/sections');
    
    if (!response.data || !response.data.data) {
      return { hasBalance: false, availableAmount: 0 };
    }
    
    const sectionData = response.data.data;
    const availableAmount = sectionData[sectionName] || 0;
    
    // Check if the section exists and has sufficient funds
    if (!sectionData[sectionName] || sectionData[sectionName] < requiredAmount) {
      return { hasBalance: false, availableAmount };
    }
    
    return { hasBalance: true, availableAmount };
  } catch (error) {
    return { hasBalance: false, availableAmount: 0 };
  }
}; 