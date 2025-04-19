export const getApiUrl = (): string => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  
  // Default production URL (adjust this based on your actual deployment setup)
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.wealthmanagement.com';
}; 