'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { TrendingUp, DollarSign, Pencil, Trash2, Plus, X, CheckCircle, AlertTriangle, Search, Filter, Calendar, ChevronDown, ArrowLeftRight } from 'lucide-react';
import api from '../../utils/axios';
import { useToast } from '../../../components/ui/toast';
import { formatCurrency, formatDate } from "@/lib/utils";
import { checkSectionBalance } from '../../utils/balanceCheck';
import { TransferDialog } from '../../components/TransferDialog';

interface Investment {
  id: string;
  assetName: string;
  amount: number;
  investmentType: string;
  totalReturn: number;
  isClosed: boolean;
  notes?: string;
  createdAt: string;
}

// Define common investment types
const investmentTypes = [
  'Stocks',
  'Bonds',
  'ETFs',
  'Mutual Funds',
  'Real Estate',
  'Cryptocurrency',
  'Commodities',
  'Retirement Accounts',
  'Certificates of Deposit',
  'Savings Accounts',
  'Treasury Securities',
  'Peer-to-Peer Lending',
  'Business Ventures',
  'Others'
];

export default function InvestmentsPage() {
  const { user, forceRefreshUser } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [filteredInvestments, setFilteredInvestments] = useState<Investment[]>([]);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [activeInvestmentsTotal, setActiveInvestmentsTotal] = useState(0);
  const [closedInvestmentsTotal, setClosedInvestmentsTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [investmentData, setInvestmentData] = useState({
    assetName: '',
    amount: '',
    investmentType: '',
    totalReturn: '0',
    isClosed: false,
    notes: ''
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null);
  
  // New states for section balance and transfers
  const [sectionBalance, setSectionBalance] = useState(0);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  // Fetch investments and section balance
  useEffect(() => {
    fetchInvestments();
    fetchSectionBalance();
  }, [currentPage]);

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [investments, searchTerm, dateFilter, typeFilter, statusFilter]);
  
  const fetchSectionBalance = async () => {
    try {
      const response = await api.get('/sections');
      if (response.data && response.data.investments !== undefined) {
        setSectionBalance(response.data.investments);
      }
    } catch (err) {
      console.error('Error fetching section balance:', err);
      addToast('Error loading investments balance', 'error');
    }
  };

  const fetchInvestments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/investments?page=${currentPage}&limit=10`);
      const data = response.data;
      
      const allInvestments = data.data || [];
      setInvestments(allInvestments);
      setFilteredInvestments(allInvestments);
      setTotalInvestments(data.meta?.total || 0);
      
      // Calculate active and closed investment counts
      const activeInvestments = allInvestments.filter((inv: Investment) => !inv.isClosed);
      const closedInvestments = allInvestments.filter((inv: Investment) => inv.isClosed);
      
      // Set counts instead of totals
      setActiveInvestmentsTotal(activeInvestments.length);
      setClosedInvestmentsTotal(closedInvestments.length);
      
      setTotalPages(data.meta?.totalPages || 1);
    } catch (err) {
      addToast('Error fetching investments. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to the investments
  const applyFilters = () => {
    if (!investments.length) return;
    
    let result = [...investments];
    
    // Apply search term filter
    if (searchTerm) {
      result = result.filter(investment => 
        investment.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investment.investmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply date range filter
    if (dateFilter.startDate) {
      const startDate = new Date(dateFilter.startDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(investment => new Date(investment.createdAt) >= startDate);
    }
    
    if (dateFilter.endDate) {
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(investment => new Date(investment.createdAt) <= endDate);
    }
    
    // Apply type filter
    if (typeFilter) {
      result = result.filter(investment => investment.investmentType === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
      const isClosed = statusFilter === 'closed';
      result = result.filter(investment => investment.isClosed === isClosed);
    }
    
    setFilteredInvestments(result);
    setIsFiltering(!!searchTerm || !!dateFilter.startDate || !!dateFilter.endDate || !!typeFilter || !!statusFilter);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({
      startDate: '',
      endDate: ''
    });
    setTypeFilter('');
    setStatusFilter('');
    setFilteredInvestments(investments);
    setShowFilterDialog(false);
    setIsFiltering(false);
  };

  // Handle investment form submission
  const handleSubmitInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!investmentData.assetName) {
      addToast('Please enter an asset name', 'error');
      return;
    }

    if (!investmentData.amount || parseFloat(investmentData.amount) <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const amountValue = parseFloat(investmentData.amount);
      
      if (isEditing && editingId) {
        // Update existing investment - don't check balance as backend will handle this
        await api.put(`/investments/${editingId}`, {
          ...investmentData,
          amount: amountValue,
          totalReturn: parseFloat(investmentData.totalReturn || '0')
        });
        addToast('Investment updated successfully!', 'success');
      } else {
        // Create new investment - let backend handle balance check
        await api.post('/investments', {
          ...investmentData,
          amount: amountValue,
          totalReturn: parseFloat(investmentData.totalReturn || '0')
        });
        addToast('Investment added successfully!', 'success');
      }
      
      // Reset form and refresh investments
      setInvestmentData({
        assetName: '',
        amount: '',
        investmentType: '',
        totalReturn: '0',
        isClosed: false,
        notes: ''
      });
      setIsEditing(false);
      setEditingId(null);
      setShowAddEditDialog(false);
      fetchInvestments();
    } catch (err: any) {
      console.error('Error in investment form submission:', err);
      
      // Check for insufficient funds error from backend
      if (err.response && err.response.data && err.response.data.message) {
        if (err.response.data.message.includes('Insufficient funds')) {
          addToast('Investment cannot be added. Insufficient funds in your investments section.', 'warning');
        } else {
          addToast(err.response.data.message, 'error');
        }
      } else {
        addToast(`Failed to ${isEditing ? 'update' : 'add'} investment. Please try again.`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle investment deletion
  const handleDeleteInvestment = async () => {
    if (!investmentToDelete) return;

    try {
      await api.delete(`/investments/${investmentToDelete}`);
      addToast('Investment deleted successfully!', 'success');
      setShowDeleteDialog(false);
      setInvestmentToDelete(null);
      fetchInvestments();
    } catch (err) {
      addToast('Failed to delete investment. Please try again.', 'error');
    }
  };

  // Handle investment edit
  const handleEditInvestment = (investment: Investment) => {
    setInvestmentData({
      assetName: investment.assetName,
      amount: investment.amount.toString(),
      investmentType: investment.investmentType || '',
      totalReturn: investment.totalReturn?.toString() || '0',
      isClosed: investment.isClosed || false,
      notes: investment.notes || ''
    });
    setIsEditing(true);
    setEditingId(investment.id);
    setShowAddEditDialog(true);
  };

  // Calculate ROI
  const calculateROI = (investment: Investment) => {
    if (investment.amount <= 0) return 0;
    const roi = (investment.totalReturn / investment.amount) * 100;
    return parseFloat(roi.toFixed(2));
  };
  
  // Handle transfer completion
  const handleTransferComplete = async () => {
    // Refresh section balance
    await fetchSectionBalance();
    
    // Refresh user data to update all balances
    await forceRefreshUser();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header and Actions in a more compact layout */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-2 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
          <p className="text-gray-600 text-sm">Manage your investment portfolio</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              setInvestmentData({
                assetName: '',
                amount: '',
                investmentType: '',
                totalReturn: '0',
                isClosed: false,
                notes: ''
              });
              setIsEditing(false);
              setEditingId(null);
              setShowAddEditDialog(true);
            }}
            variant="primary"
          >
            <div className="flex items-center">
              <Plus className="h-4 w-4 mr-1.5" />
              New Investment
            </div>
          </Button>
          
          <Button
            onClick={() => setShowTransferDialog(true)}
            variant="outline"
          >
            <div className="flex items-center">
              <ArrowLeftRight className="h-4 w-4 mr-1.5" />
              Transfer
            </div>
          </Button>
        </div>
      </div>
      
      {/* Compact Balance Summary */}
      <div className="mb-5 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="bg-emerald-50 p-2 rounded-lg mr-3">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available for Investing</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(sectionBalance)}</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center">
              <div className="bg-emerald-50 p-2 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <div className="flex items-baseline">
                  <p className="text-xl font-bold text-emerald-600">{isLoading ? '...' : activeInvestmentsTotal}</p>
                  <p className="ml-1.5 text-xs text-gray-500">investments</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-lg mr-3">
                <CheckCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Closed</p>
                <div className="flex items-baseline">
                  <p className="text-xl font-bold text-gray-600">{isLoading ? '...' : closedInvestmentsTotal}</p>
                  <p className="ml-1.5 text-xs text-gray-500">investments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-3">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search investments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        
        <Button 
          onClick={() => setShowFilterDialog(true)}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters {isFiltering && <span className="ml-1 text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Active</span>}
          </div>
        </Button>
      </div>

      {/* Investments List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-emerald-600" />
          Your Investments
          <span className="ml-2 text-sm font-normal text-gray-500">
            {filteredInvestments.length} {isFiltering ? 'filtered' : ''} of {totalInvestments} total
          </span>
        </h2>
        
        {isLoading ? (
          <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : filteredInvestments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">
              {isFiltering ? 'No investments match your filters' : 'No investments recorded yet'}
            </h3>
            <p className="mb-6 max-w-md mx-auto">
              {isFiltering ? 
                'Try adjusting your search or filters' : 
                'Start building your portfolio by adding your first investment'
              }
            </p>
            {isFiltering ? (
              <Button 
                variant="outline"
                onClick={resetFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  setInvestmentData({
                    assetName: '',
                    amount: '',
                    investmentType: '',
                    totalReturn: '0',
                    isClosed: false,
                    notes: ''
                  });
                  setIsEditing(false);
                  setEditingId(null);
                  setShowAddEditDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Investment
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredInvestments.map((investment) => {
              const roi = calculateROI(investment);
              
              return (
                <div key={investment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{investment.assetName}</h3>
                      <div className="flex items-center mt-1">
                        {investment.isClosed ? (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Closed
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-1">
                      <button
                        onClick={() => handleEditInvestment(investment)}
                        className="p-1.5 rounded-full bg-gray-50 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                        title="Edit investment"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setInvestmentToDelete(investment.id);
                          setShowDeleteDialog(true);
                        }}
                        className="p-1.5 rounded-full bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete investment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="px-4 pb-4">
                    {/* Amount and Return */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Investment Amount</div>
                        <div className="text-lg font-medium">{formatCurrency(investment.amount)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Return</div>
                        <div className={`text-lg font-medium ${investment.totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(investment.totalReturn)}
                        </div>
                      </div>
                    </div>
                    
                    {/* ROI */}
                    <div className="mb-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-700">ROI</div>
                        <div className={`text-base font-semibold ${roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {roi}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Type */}
                    {investment.investmentType && (
                      <div className="mb-3">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                          {investment.investmentType}
                        </span>
                      </div>
                    )}
                    
                    {/* Notes */}
                    {investment.notes && (
                      <div className="p-3 bg-gray-50 rounded-md mb-3">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {investment.notes}
                        </p>
                      </div>
                    )}
                    
                    {/* Date */}
                    <div className="mt-3 text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      <span>Created: {formatDate(investment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Simplified Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 bg-white text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      <TransferDialog
        isOpen={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
        fromSection="investments"
        availableAmount={sectionBalance}
        onTransferComplete={handleTransferComplete}
      />
      
      {/* Keep existing dialogs (Filter, Add/Edit, Delete) */}
      {showFilterDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 w-full max-w-md bg-white rounded-xl shadow-lg">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-emerald-600" />
                  Filter Investments
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Start Date</div>
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">End Date</div>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investment Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">All Types</option>
                    {investmentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                  >
                    Reset
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

      {/* Add/Edit Investment Dialog */}
      {showAddEditDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 w-full max-w-md md:max-w-xl bg-white rounded-xl shadow-lg">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-emerald-600" />
                  {isEditing ? 'Edit Investment' : 'Add New Investment'}
                </h3>
                <button 
                  onClick={() => setShowAddEditDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitInvestment}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                    <input
                      type="text"
                      value={investmentData.assetName}
                      onChange={(e) => setInvestmentData({ ...investmentData, assetName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      required
                      placeholder="Stock name, ETF symbol, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Investment Type</label>
                    <select
                      value={investmentData.investmentType}
                      onChange={(e) => setInvestmentData({ ...investmentData, investmentType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Select an investment type</option>
                      {investmentTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  

                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  
                <Input
                    label="Amount Invested"
                    type="number"
                    value={investmentData.amount}
                    onChange={(value) => setInvestmentData({ ...investmentData, amount: value })}
                    required
                    placeholder="0.00"
                  />

                  <Input
                    label="Total Return"
                    type="number"
                    value={investmentData.totalReturn}
                    onChange={(value) => setInvestmentData({ ...investmentData, totalReturn: value })}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isClosed"
                      checked={investmentData.isClosed}
                      onChange={(e) => setInvestmentData({ ...investmentData, isClosed: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isClosed" className="block text-sm font-medium text-gray-700">
                      Investment Closed/Sold
                    </label>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={investmentData.notes}
                    onChange={(e) => setInvestmentData({ ...investmentData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Additional details about this investment"
                  ></textarea>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddEditDialog(false);
                      setIsEditing(false);
                      setEditingId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    loading={isSubmitting}
                  >
                    {isEditing ? 'Update Investment' : 'Add Investment'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 w-full max-w-sm bg-white rounded-xl shadow-lg">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Investment</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this investment? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setInvestmentToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDeleteInvestment}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 