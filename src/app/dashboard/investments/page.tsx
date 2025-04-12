'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { TrendingUp, DollarSign, Pencil, Trash2, Plus, X, CheckCircle, AlertTriangle, Search, Filter, Calendar, ChevronDown } from 'lucide-react';
import api from '../../utils/axios';
import { useToast } from '../../../components/ui/toast';
import { formatCurrency, formatDate } from "@/lib/utils";
import { checkSectionBalance } from '../../utils/balanceCheck';

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
  const { user } = useAuth();
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

  // Fetch investments
  useEffect(() => {
    fetchInvestments();
  }, [currentPage]);

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [investments, searchTerm, dateFilter, typeFilter, statusFilter]);

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Investments Management</h1>
      <p className="text-gray-600 mb-6">Track and manage your investment portfolio</p>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-xl shadow-sm border border-emerald-100 flex items-center space-x-4">
          <div className="rounded-full bg-emerald-100 p-3">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Investments</p>
            <div className="flex items-baseline space-x-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : activeInvestmentsTotal}
              </h3>
              <p className="text-sm text-gray-500">investments</p>
            </div>
          </div>
        </div>
        
        <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="rounded-full bg-gray-100 p-3">
            <CheckCircle className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Closed Investments</p>
            <div className="flex items-baseline space-x-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : closedInvestmentsTotal}
              </h3>
              <p className="text-sm text-gray-500">investments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        {/* Search bar */}
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
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setShowFilterDialog(true)}
            variant="outline"
          >
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters {isFiltering && <span className="ml-1 text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Active</span>}
            </div>
          </Button>
          
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
              <Plus className="h-4 w-4 mr-2" />
              Add Investment
            </div>
          </Button>
        </div>
      </div>

      {/* Filter Dialog */}
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

      {/* Investments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-emerald-600" />
            Your Investments
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-1" />
            <span>{filteredInvestments.length} {isFiltering ? 'filtered' : ''} of {totalInvestments} Investments</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredInvestments.length === 0 ? (
          <div className="text-center py-10">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-gray-600 font-medium">
              {isFiltering ? 'No investments match your filters' : 'No investments recorded yet'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {isFiltering ? 
                'Try adjusting your search or filters' : 
                'Add your first investment to start tracking'
              }
            </p>
            {isFiltering ? (
              <Button 
                className="mt-4"
                variant="outline"
                onClick={resetFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            ) : (
              <Button 
                className="mt-4"
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
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Return
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvestments.map((investment) => (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{investment.assetName}</div>
                            {investment.investmentType && (
                              <div className="text-xs text-gray-500">Type: {investment.investmentType}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(investment.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(investment.totalReturn)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${investment.totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600'} font-medium`}>
                          {calculateROI(investment)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {investment.isClosed ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Closed
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(investment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditInvestment(investment)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setInvestmentToDelete(investment.id);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        &larr;
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === i + 1
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        &rarr;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 