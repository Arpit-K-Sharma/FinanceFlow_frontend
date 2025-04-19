import axios from 'axios';

/**
 * Checks if the reports service is available
 * @returns Promise<boolean> True if reports service is available
 */
export const checkReportsService = async (): Promise<boolean> => {
  try {
    // Check specific reports endpoint instead of general health endpoint
    const response = await axios.get('/api/reports/status');
    return response.status === 200;
  } catch (error) {
    console.error('Reports service check failed:', error);
    return false;
  }
};

/**
 * Generate a report for a specific period
 * @param type 'month' or 'year'
 * @param period The period number (month number 1-12 or year)
 * @returns The report filename
 */
export const generateReport = async (type: 'month' | 'year', period: number): Promise<string> => {
  const response = await axios.get(`/api/reports/generate/${type}/${period}`);
  return response.data.filename;
};

/**
 * Download a report by filename
 * @param filename The report filename
 * @returns The report blob
 */
export const downloadReport = async (filename: string): Promise<Blob> => {
  const response = await axios.get(`/api/reports/download/${filename}`, {
    responseType: 'blob'
  });
  return response.data;
}; 