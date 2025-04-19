'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { FileText, Download, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import moment from 'moment';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useToast } from '../../../components/ui/toast';
import { download as downloadUtils } from '../../../utils/download';
import { getApiUrl } from '../../utils/apiConfig';
import { checkReportsService } from '../../utils/apiCheck';

export default function ReportsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [reportType, setReportType] = useState<'month' | 'year'>('month');
  const [value, setValue] = useState<number>(new Date().getMonth() + 1); // Current month by default
  const [loading, setLoading] = useState({ generate: false, download: false });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const { addToast } = useToast();

  // Generate month options for the dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthName = moment().month(i).format('MMMM');
    return { value: i + 1, label: monthName };
  });

  // Generate year options for the dropdown (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return { value: year, label: year.toString() };
  });

  const handleGenerateReport = async () => {
    if (!token) return;
    
    try {
      setLoading((prev) => ({ ...prev, generate: true }));
      
      // Check if reports service is available
      const isAvailable = await checkReportsService();
      setServiceAvailable(isAvailable);
      
      if (!isAvailable) {
        addToast('The report generation service is currently unavailable. Please try again later.', 'error');
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/reports/generate/${reportType}/${value}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setGeneratedReport(data.filename);
      addToast('Your financial report has been generated successfully.', 'success');
    } catch (error) {
      console.error('Error generating report:', error);
      addToast('An error occurred while generating the report. Please try again.', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, generate: false }));
    }
  };

  const handleDownloadReport = async () => {
    if (!token || !generatedReport) return;

    try {
      setLoading((prev) => ({ ...prev, download: true }));
      
      if (!serviceAvailable) {
        addToast('The report download service is currently unavailable. Please try again later.', 'error');
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/reports/download/${generatedReport}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      downloadUtils(blob, generatedReport);
      addToast('Your financial report has been downloaded successfully.', 'success');
    } catch (error) {
      console.error('Error downloading report:', error);
      addToast('An error occurred while downloading the report. Please try again.', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };

  const getPeriodLabel = () => {
    if (reportType === 'month') {
      const month = monthOptions.find(m => m.value === value)?.label;
      return `${month} ${currentYear}`;
    }
    return `Year ${value}`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">Generate and download financial reports</p>
      </div>

      <div className="grid gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Generate a financial report for a specific period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Monthly Reports</h3>
                <div className="flex flex-wrap gap-2">
                  {[...Array(12)].map((_, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      disabled={loading.generate}
                      onClick={() => {
                        setReportType('month');
                        setValue(i + 1);
                      }}
                    >
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Annual Reports</h3>
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <Button
                        key={year}
                        variant="outline"
                        disabled={loading.generate}
                        onClick={() => {
                          setReportType('year');
                          setValue(year);
                        }}
                      >
                        {year}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={loading.generate}
                >
                  {loading.generate ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>

              {generatedReport && (
                <div className="mt-4">
                  <Button 
                    onClick={handleDownloadReport} 
                    disabled={loading.download || !generatedReport}
                  >
                    {loading.download ? 'Downloading...' : 'Download Report'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 