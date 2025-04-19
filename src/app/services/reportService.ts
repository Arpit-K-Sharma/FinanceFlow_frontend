import { getApiUrl } from '@/app/utils/apiConfig';

// Response type for the generate report API
interface GenerateReportResponse {
  success: boolean;
  data: {
    filename: string;
    period: 'month' | 'year';
    value: number;
  };
  message: string;
}

// Generate a financial report for a specific time period
export const generateReport = async (
  token: string,
  period: 'month' | 'year',
  value: number
): Promise<GenerateReportResponse> => {
  const response = await fetch(
    `${getApiUrl()}/api/reports/generate/${period}/${value}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate report');
  }

  return response.json();
};

// Download a generated report
export const downloadReport = async (
  token: string,
  filename: string
): Promise<Blob> => {
  const response = await fetch(`${getApiUrl()}/api/reports/download/${filename}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Report not found. It may have been deleted or expired.');
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to access this report.');
    }
    throw new Error('Failed to download report');
  }

  return response.blob();
}; 