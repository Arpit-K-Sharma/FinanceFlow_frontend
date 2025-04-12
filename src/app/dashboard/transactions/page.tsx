'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeftRight, Filter, Search, ChevronLeft, ChevronRight, Calendar, ArrowUpRight, ArrowDownLeft, ArrowRight, DollarSign, X, AlertTriangle } from 'lucide-react';
import api from '../../utils/axios';
import { useToast } from '../../../components/ui/toast';
import { Button } from '../../components/Button';

interface Transaction {
  id: number;
  type: string;
  fromSection?: string;
  toSection?: string;
  amount: number;
  description?: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterFromSection, setFilterFromSection] = useState('all');
  const [filterToSection, setFilterToSection] = useState('all');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [uniqueSections, setUniqueSections] = useState<string[]>([]);
  const [allSections, setAllSections] = useState<string[]>([]);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  
  const pageSize = 10;

  // Add a function to fetch all available sections
  const fetchAllSections = async () => {
    if (!token) return;
    
    try {
      // First get all transactions without filtering
      const response = await api.get('/transactions?limit=100');
      
      let allTransactions: Transaction[] = [];
      
      if (response.data?.data) {
        if (Array.isArray(response.data.data)) {
          allTransactions = response.data.data;
        } else if (response.data.data.transactions && Array.isArray(response.data.data.transactions)) {
          allTransactions = response.data.data.transactions;
        }
      }
      
      // Extract all unique sections
      const sections = new Set<string>();
      
      allTransactions.forEach(transaction => {
        if (transaction.fromSection) sections.add(transaction.fromSection);
        if (transaction.toSection) sections.add(transaction.toSection);
      });
      
      // Add standard sections in case they're not in transactions yet
      ['savings', 'expenses', 'investments', 'income'].forEach(section => sections.add(section));
      
      setAllSections(Array.from(sections).sort());
    } catch (err) {
      console.error('Error fetching all sections:', err);
    }
  };

  // Fetch all sections on initial load
  useEffect(() => {
    if (token) {
      fetchAllSections();
    }
  }, [token]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        
        // Determine whether to use client-side or server-side pagination
        const useClientSidePagination = 
          filterFromSection !== 'all' || 
          filterToSection !== 'all' || 
          filterFromDate || 
          filterToDate || 
          searchTerm !== '';
          
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        // Only use server pagination when not using client-side filters
        if (!useClientSidePagination) {
          queryParams.append('page', currentPage.toString());
          queryParams.append('limit', pageSize.toString());
        } else {
          // When using client-side filtering, request more data
          queryParams.append('limit', '500'); // Request more to handle client filtering
        }
        
        // Add type filter (this is supported by backend)
        if (filterType !== 'all') {
          queryParams.append('type', filterType);
        }
        
        const response = await api.get(`/transactions?${queryParams.toString()}`);
        
        // Extract data and metadata from response
        let transactions = [];
        let totalCount = 0;
        let totalPages = 1;
        
        if (response.data && response.data.data) {
          // Backend returns { data: [...transactions], meta: { total, page, limit, totalPages } }
          transactions = response.data.data;
          
          if (response.data.meta) {
            totalCount = response.data.meta.total || 0;
            totalPages = response.data.meta.totalPages || 1;
          }
        }
        
        // Apply any client-side filters that aren't supported by the backend
        let filteredTransactions = transactions;
        
        // Filter by section
        if (filterFromSection !== 'all' || filterToSection !== 'all') {
          filteredTransactions = filteredTransactions.filter((transaction: Transaction) => {
            const fromMatch = filterFromSection === 'all' || transaction.fromSection === filterFromSection;
            const toMatch = filterToSection === 'all' || transaction.toSection === filterToSection;
            return fromMatch && toMatch;
          });
        }
        
        // Filter by date range
        if (filterFromDate || filterToDate) {
          filteredTransactions = filteredTransactions.filter((transaction: Transaction) => {
            const transactionDate = new Date(transaction.createdAt).getTime();
            const fromDateMatch = !filterFromDate || transactionDate >= new Date(filterFromDate).getTime();
            const toDateMatch = !filterToDate || transactionDate <= new Date(filterToDate + 'T23:59:59').getTime();
            return fromDateMatch && toDateMatch;
          });
        }
        
        // Apply search filter if present
        if (searchTerm) {
          const lowercaseSearch = searchTerm.toLowerCase();
          filteredTransactions = filteredTransactions.filter((transaction: Transaction) => {
            return (
              transaction.description?.toLowerCase().includes(lowercaseSearch) ||
              transaction.type.toLowerCase().includes(lowercaseSearch) ||
              transaction.fromSection?.toLowerCase().includes(lowercaseSearch) ||
              transaction.toSection?.toLowerCase().includes(lowercaseSearch) ||
              formatCurrency(transaction.amount).toLowerCase().includes(lowercaseSearch)
            );
          });
        }
        
        // Store all transactions
        setTransactions(filteredTransactions);
        
        // If using client-side pagination, calculate pages and apply pagination
        if (useClientSidePagination) {
          const calculatedTotalPages = Math.max(Math.ceil(filteredTransactions.length / pageSize), 1);
          setTotalPages(calculatedTotalPages);
          
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          setFilteredTransactions(filteredTransactions.slice(startIndex, endIndex));
        } else {
          // When using server pagination, use metadata directly
          setTotalPages(totalPages);
          setFilteredTransactions(filteredTransactions);
        }
        
        // Set filtering status
        setIsFiltering(filterType !== 'all' || filterFromSection !== 'all' || 
                      filterToSection !== 'all' || filterFromDate !== '' || 
                      filterToDate !== '' || searchTerm !== '');
        
      } catch (err) {
        console.error('Error fetching transactions:', err);
        addToast('Error loading transactions. Please try again.', 'error');
        setTransactions([]);
        setFilteredTransactions([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [token, currentPage, filterType, filterFromSection, filterToSection, filterFromDate, filterToDate, searchTerm, addToast]);

  // Update the useEffect for filtered transactions to only update uniqueSections
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const sections = new Set<string>();
      
      transactions.forEach(transaction => {
        if (transaction.fromSection) sections.add(transaction.fromSection);
        if (transaction.toSection) sections.add(transaction.toSection);
      });
      
      setUniqueSections(Array.from(sections).sort());
    }
  }, [transactions]);

  // Remove debug console logs
  useEffect(() => {
    // This is just to verify that transactions are loading correctly
    console.log('Current filtered transactions:', filteredTransactions);
    console.log('Current page:', currentPage, 'of', totalPages);
    console.log('Total transactions in state:', transactions.length);
  }, [filteredTransactions, currentPage, totalPages, transactions.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getTransactionTypeIcon = (type: string, fromSection?: string, toSection?: string) => {
    switch (type) {
      case 'automatic':
      case 'manual':
        return (
          <div className="bg-indigo-100 p-2 rounded-full">
            <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
          </div>
        );
      case 'leftover':
        return (
          <div className="bg-purple-100 p-2 rounded-full">
            <ArrowUpRight className="h-5 w-5 text-purple-600" />
          </div>
        );
      case 'goal-transfer':
        return (
          <div className="bg-emerald-100 p-2 rounded-full">
            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
          </div>
        );
      case 'refund':
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <ArrowLeftRight className="h-5 w-5 text-gray-600" />
          </div>
        );
    }
  };

  const getTransactionLabel = (transaction: Transaction) => {
    const { type, fromSection, toSection, description } = transaction;
    
    if (description) return description;
    
    switch (type) {
      case 'automatic':
        return 'Automatic Transfer';
      case 'manual':
        return 'Manual Transfer';
      case 'leftover':
        return 'Leftover Distribution';
      case 'goal-transfer':
        return 'Goal Transfer';
      case 'refund':
        return 'Refund';
      default:
        return 'Transaction';
    }
  };

  const getTransactionFlow = (transaction: Transaction) => {
    const { type, fromSection, toSection } = transaction;
    
    switch (type) {
      case 'automatic':
      case 'manual':
      case 'goal-transfer':
        if (fromSection && toSection) {
          return (
            <>
              {fromSection} <ArrowRight className="inline h-3 w-3 mx-1" /> {toSection}
            </>
          );
        } else if (fromSection) {
          return <>From: {fromSection}</>;
        } else if (toSection) {
          return <>To: {toSection}</>;
        }
        return null;
      case 'leftover':
        return (
          <>
            Leftover Funds <ArrowRight className="inline h-3 w-3 mx-1" /> {toSection || 'Savings'}
          </>
        );
      case 'refund':
        return toSection ? (
          <>To: {toSection}</>
        ) : null;
      default:
        return fromSection || toSection ? (
          <>
            {fromSection ? `From: ${fromSection}` : ''} 
            {fromSection && toSection ? <ArrowRight className="inline h-3 w-3 mx-1" /> : ''} 
            {toSection ? `To: ${toSection}` : ''}
          </>
        ) : null;
    }
  };

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Helper function to get date from 30 days ago in YYYY-MM-DD format
  const getDefaultFromDate = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo.toISOString().split('T')[0];
  };

  const resetFilters = () => {
    setFilterType('all');
    setFilterFromSection('all');
    setFilterToSection('all');
    setFilterFromDate('');
    setFilterToDate('');
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilterDialog(false);
  };

  const getTransactionTypeDisplay = (type: string) => {
    // Format transaction types consistently
    switch (type) {
      case 'automatic':
        return 'Automatic';
      case 'manual':
        return 'Manual';
      case 'leftover':
        return 'Leftover';
      case 'goal-transfer':
        return 'Goal Transfer';
      case 'refund':
        return 'Refund';
      default:
        // Capitalize first letter for any other types
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterFromSection, filterToSection, filterFromDate, filterToDate, searchTerm]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Transactions</h1>
      <p className="text-gray-600 mb-6">View and manage your financial transactions</p>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        {/* Search bar */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex w-full sm:w-auto">
          <Button 
            onClick={() => setShowFilterDialog(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters {isFiltering && <span className="ml-1 text-xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full">Active</span>}
            </div>
          </Button>
        </div>
      </div>
      
      {/* Filter Dialog */}
      {showFilterDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 w-full max-w-lg bg-white rounded-xl shadow-lg">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-indigo-600" />
                  Filter Transactions
                </h3>
                <button 
                  onClick={() => setShowFilterDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Types</option>
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="leftover">Leftover</option>
                    <option value="goal-transfer">Goal Transfer</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Section</label>
                    <select
                      value={filterFromSection}
                      onChange={(e) => setFilterFromSection(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">All Sections</option>
                      {allSections.map((section) => (
                        <option key={`from-${section}`} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Section</label>
                    <select
                      value={filterToSection}
                      onChange={(e) => setFilterToSection(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">All Sections</option>
                      {allSections.map((section) => (
                        <option key={`to-${section}`} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">From Date</div>
                      <input
                        type="date"
                        value={filterFromDate}
                        onChange={(e) => setFilterFromDate(e.target.value)}
                        max={filterToDate || getTodayDate()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">To Date</div>
                      <input
                        type="date"
                        value={filterToDate}
                        onChange={(e) => setFilterToDate(e.target.value)}
                        min={filterFromDate}
                        max={getTodayDate()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowFilterDialog(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <ArrowLeftRight className="h-5 w-5 mr-2 text-indigo-600" />
            Transaction History
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-1" />
            <span>{filteredTransactions.length} {isFiltering || searchTerm ? 'filtered' : ''} transactions</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
              <ArrowLeftRight className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-gray-600 font-medium">
              {isFiltering || searchTerm ? 'No transactions match your filters' : 'No transactions found'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {isFiltering || searchTerm ? 'Try adjusting your search or filters' : 'Transactions will appear here when you make them'}
            </p>
            {(isFiltering || searchTerm) && (
              <Button 
                className="mt-4"
                variant="outline"
                onClick={resetFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        {getTransactionTypeIcon(transaction.type, transaction.fromSection, transaction.toSection)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getTransactionLabel(transaction)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {getTransactionFlow(transaction)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24 text-center">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {getTransactionTypeDisplay(transaction.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
            <div className="sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex mt-2 sm:mt-0">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 