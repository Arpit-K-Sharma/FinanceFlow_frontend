'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FileText, Download, CheckCircle, AlertCircle, 
  Loader2, Info, Calendar, ChevronRight, BarChart, 
  PieChart, DollarSign, Wallet, Clock, List, Trash2, Eye
} from 'lucide-react';
import moment from 'moment';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { useToast } from '../../../components/ui/toast';
import { download as downloadUtils } from '../../../utils/download';
import { getApiUrl } from '../../utils/apiConfig';
import { checkReportsService } from '../../utils/apiCheck';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";

export default function ReportsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [reportType, setReportType] = useState<'month' | 'year'>('month');
  const [value, setValue] = useState<number>(new Date().getMonth() + 1); // Current month by default
  const [loading, setLoading] = useState({ 
    generate: false, 
    download: false, 
    fetchReports: false,
    delete: false 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [availableReports, setAvailableReports] = useState<string[]>([]);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const { addToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Reset report when changing report type or value
  useEffect(() => {
    setGeneratedReport(null);
  }, [reportType, value]);
  
  // Set value based on report type
  useEffect(() => {
    if (reportType === 'month') {
      setValue(new Date().getMonth() + 1); // Current month
    } else if (reportType === 'year') {
      setValue(new Date().getFullYear()); // Current year
    }
  }, [reportType]);
  
  // Fetch available reports when component mounts
  useEffect(() => {
    fetchAvailableReports();
  }, [token]);
  
  // Function to fetch all available reports for the user
  const fetchAvailableReports = async () => {
    if (!token) return;
    
    try {
      setLoading(prev => ({ ...prev, fetchReports: true }));
      
      const response = await fetch(`${getApiUrl()}/api/reports/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error("Failed to fetch reports:", response.status);
        return;
      }
      
      const data = await response.json();
      console.log("Available reports:", data);
      
      if (data.reports && Array.isArray(data.reports)) {
        setAvailableReports(data.reports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(prev => ({ ...prev, fetchReports: false }));
    }
  };

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
    if (!token) {
      addToast('Please log in to generate reports', 'error');
      return;
    }
    
    try {
      // Clear any previous report
      setGeneratedReport(null);
      
      setLoading((prev) => ({ ...prev, generate: true }));
      
      // Check if reports service is available
      const isAvailable = await checkReportsService();
      setServiceAvailable(isAvailable);
      
      if (!isAvailable) {
        addToast('The report generation service is currently unavailable. Please try again later.', 'error');
        return;
      }
      
      const requestUrl = `${getApiUrl()}/api/reports/generate/${reportType}/${value}`;
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", response.status, errorText);
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Store the generated report filename
      setGeneratedReport(data.filename);
      
      // Show a success message to the user
      addToast('Your financial report has been generated successfully!', 'success');
      
      // Refresh the reports list
      fetchAvailableReports();
    } catch (error: any) {
      console.error('Error generating report:', error);
      addToast(`An error occurred while generating the report: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading((prev) => ({ ...prev, generate: false }));
    }
  };

  const handleDownloadReport = async (reportFilename: string) => {
    if (!token) {
      addToast('Please log in to download reports', 'error');
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, download: true }));
      
      if (!serviceAvailable) {
        addToast('The report download service is currently unavailable. Please try again later.', 'error');
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/reports/download/${reportFilename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Download error:', response.status, response.statusText);
        throw new Error(`Failed to download report: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Force download using the utility function
      downloadUtils(blob, reportFilename);
      
      // Show a success message
      addToast('Your financial report has been downloaded successfully', 'success');
    } catch (error: any) {
      console.error('Error downloading report:', error);
      addToast(`An error occurred while downloading the report: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };

  const handleViewReport = async (reportFilename: string) => {
    if (!token) {
      addToast('Please log in to view reports', 'error');
      return;
    }
    
    try {
      setLoading((prev) => ({ ...prev, download: true }));
      
      if (!serviceAvailable) {
        addToast('The report viewing service is currently unavailable. Please try again later.', 'error');
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/reports/download/${reportFilename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to view report');
      }

      const blob = await response.blob();
      
      // Create a URL for the blob and open it in a new tab
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Revoke the URL after a delay to free up memory
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      addToast('Opening your financial report for viewing', 'success');
    } catch (error: any) {
      console.error('Error viewing report:', error);
      addToast(`An error occurred while opening the report: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };

  const handleDeleteReport = async (reportFilename: string) => {
    if (!token) {
      addToast('Please log in to delete reports', 'error');
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, delete: true }));
      
      const response = await fetch(`${getApiUrl()}/api/reports/delete/${reportFilename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete error:", response.status, errorText);
        throw new Error(`Failed to delete report: ${response.statusText}`);
      }

      // Remove from current list without refetching
      setAvailableReports(prev => prev.filter(report => report !== reportFilename));
      
      // If this was the currently generated report, clear it
      if (generatedReport === reportFilename) {
        setGeneratedReport(null);
      }
      
      // Show a success message
      addToast('Report deleted successfully', 'success');
    } catch (error: any) {
      console.error('Error deleting report:', error);
      addToast(`Failed to delete report: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
      setConfirmDelete(null);
    }
  };

  const getPeriodLabel = (periodType: string, periodValue: string) => {
    if (periodType === 'month') {
      const monthName = moment().month(parseInt(periodValue) - 1).format('MMMM');
      return `${monthName} ${currentYear}`;
    }
    return `Year ${periodValue}`;
  };

  const formatReportName = (filename: string) => {
    // Extract parts from filename: report-userId-period-value-timestamp.pdf
    const parts = filename.split('-');
    if (parts.length < 5) return filename;
    
    const period = parts[2];
    const value = parts[3];
    
    return getPeriodLabel(period, value);
  };

  return (
    <div className="container mx-auto py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">Generate and manage your detailed financial reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Column - Generate Reports */}
        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>
                      Create financial snapshots
                    </CardDescription>
                  </div>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      What's Inside
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Report Contents</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Income
                          </Badge>
                          <span className="text-sm">Income sources and trends</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <Wallet className="h-3 w-3 mr-1" />
                            Expenses
                          </Badge>
                          <span className="text-sm">Categorized expenses</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <BarChart className="h-3 w-3 mr-1" />
                            Investments
                          </Badge>
                          <span className="text-sm">Investment performance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <PieChart className="h-3 w-3 mr-1" />
                            Distribution
                          </Badge>
                          <span className="text-sm">Account allocations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Goals
                          </Badge>
                          <span className="text-sm">Savings goals progress</span>
                        </li>
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="month" onValueChange={(val) => setReportType(val as 'month' | 'year')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="month" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger value="year" className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    Annual
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="month">
                  <div className="space-y-4">
                    <div className="font-medium text-sm">Select Month</div>
                    <div className="grid grid-cols-3 gap-2">
                      {monthOptions.map((month) => (
                        <Button
                          key={month.value}
                          variant={value === month.value ? "default" : "outline"}
                          size="sm"
                          className={value === month.value ? "border-2 border-blue-500" : ""}
                          onClick={() => setValue(month.value)}
                        >
                          {month.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="year">
                  <div className="space-y-4">
                    <div className="font-medium text-sm">Select Year</div>
                    <div className="grid grid-cols-3 gap-2">
                      {yearOptions.map((year) => (
                        <Button
                          key={year.value}
                          variant={value === year.value ? "default" : "outline"}
                          size="sm"
                          className={value === year.value ? "border-2 border-blue-500" : ""}
                          onClick={() => setValue(year.value)}
                        >
                          {year.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-4">
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={loading.generate}
                  className="w-full h-10"
                >
                  {loading.generate ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate {reportType === 'month' ? 'Monthly' : 'Annual'} Report
                    </>
                  )}
                </Button>
              </div>

              {generatedReport && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm font-medium">Report generated successfully</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Available Reports */}
        <div className="lg:col-span-3">
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950 dark:to-gray-950">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-900">
                    <List className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <CardTitle>Available Reports</CardTitle>
                    <CardDescription>
                      All your generated reports
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAvailableReports}
                  disabled={loading.fetchReports}
                >
                  {loading.fetchReports ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading.fetchReports ? (
                <div className="flex justify-center items-center p-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : availableReports.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  {availableReports.map((report, index) => {
                    // Extract parts from filename: report-userId-period-value-timestamp.pdf
                    const parts = report.split('-');
                    const period = parts[2] || 'unknown';
                    const periodValue = parts[3] || '';
                    const timestamp = parts[parts.length - 1].replace('.pdf', '');
                    const date = new Date(parseInt(timestamp));
                    const formattedDate = moment(date).format('MMM DD, YYYY [at] h:mm A');
                    
                    return (
                      <div key={index} className={`border-b p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${generatedReport === report ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                {formatReportName(report)}
                              </h4>
                              {generatedReport === report && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Generated on {formattedDate}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewReport(report)}
                              title="View Report"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDownloadReport(report)}
                              title="Download Report"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setConfirmDelete(report)}
                              title="Delete Report"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Generate your first financial report by selecting a period and clicking "Generate Report"
                  </p>
                </div>
              )}
            </CardContent>
            {availableReports.length > 0 && (
              <CardFooter className="bg-slate-50 dark:bg-slate-900 p-3 border-t text-xs text-muted-foreground">
                {availableReports.length} {availableReports.length === 1 ? 'report' : 'reports'} available
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 p-3 bg-slate-50 rounded border text-sm">
            {confirmDelete && formatReportName(confirmDelete)}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDelete(null)}
              disabled={loading.delete}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDelete && handleDeleteReport(confirmDelete)}
              disabled={loading.delete}
            >
              {loading.delete ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 