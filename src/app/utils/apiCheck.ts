import { getApiUrl } from './apiConfig';

/**
 * Check if the backend API is accessible
 * @param token Auth token
 * @returns A promise that resolves to a boolean indicating whether the API is accessible
 */
export const checkApiAccess = async (token?: string): Promise<boolean> => {
  try {
    // Instead of using a health endpoint, use the user endpoint which should exist
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      
      // Try to access an endpoint we know exists
      const response = await fetch(`${getApiUrl()}/api/user/profile`, {
        method: 'GET',
        headers
      });
      
      return response.ok;
    }
    
    // Without a token, just check if the server responds
    const response = await fetch(`${getApiUrl()}`, {
      method: 'HEAD'
    });
    
    return response.ok;
  } catch (error) {
    console.error('API access check failed:', error);
    return false;
  }
};

/**
 * Check if the reports service is available
 * Makes a request to the reports status endpoint, which does not require authentication
 * @returns A promise that resolves to a boolean indicating whether the reports service is available
 */
export const checkReportsService = async (): Promise<boolean> => {
  try {
    // Try to access the reports status endpoint
    // The status endpoint doesn't require authentication
    const response = await fetch(`${getApiUrl()}/api/reports/status`, {
      method: 'GET'
    });
    
    return response.ok;
  } catch (error) {
    console.error('Reports service check failed:', error);
    return false;
  }
}; 