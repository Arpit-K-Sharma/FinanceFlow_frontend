'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CreditCard, DollarSign, Pencil, Trash2, Plus, Calendar, Filter, X, AlertTriangle, Search, ChevronDown, ArrowLeftRight } from 'lucide-react';
import api from '../../utils/axios';
import { useToast } from '../../../components/ui/toast';
import { checkSectionBalance } from '../../utils/balanceCheck';
import { TransferDialog } from '../../components/TransferDialog';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: string;
}

export default function ExpensesPage() {
  const { user, forceRefreshUser } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  
  // New states for section balance and transfers
  const [sectionBalance, setSectionBalance] = useState(0);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  // Common expense categories
  const expenseCategories = [
    'Food', 'Rent', 'Utilities', 'Transportation', 
    'Entertainment', 'Healthcare', 'Education', 'Shopping',
    'Travel', 'Subscriptions', 'Other'
  ];

  // Fetch expenses and section balance
  useEffect(() => {
    fetchExpenses();
    fetchSectionBalance();
  }, [currentPage]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [expenses, searchTerm, dateFilter, categoryFilter]);

  // Calculate daily and monthly totals
  useEffect(() => {
    calculateTotals();
  }, [filteredExpenses]);

  const fetchSectionBalance = async () => {
    try {
      const response = await api.get('/sections');
      if (response.data && response.data.expenses !== undefined) {
        setSectionBalance(response.data.expenses);
      }
    } catch (err) {
      console.error('Error fetching section balance:', err);
      addToast('Error loading expenses balance', 'error');
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/expenses?page=${currentPage}&limit=10`);
      const data = response.data;
      
      setExpenses(data.data || []);
      setFilteredExpenses(data.data || []);
      setTotalExpenses(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (err) {
      addToast('Error fetching expenses. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to expenses
  const applyFilters = () => {
    if (!expenses.length) return;
    
    let result = [...expenses];
    
    // Apply search term filter
    if (searchTerm) {
      result = result.filter(expense => 
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply date range filter
    if (dateFilter.startDate) {
      const startDate = new Date(dateFilter.startDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(expense => new Date(expense.createdAt) >= startDate);
    }
    
    if (dateFilter.endDate) {
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(expense => new Date(expense.createdAt) <= endDate);
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(expense => expense.category === categoryFilter);
    }
    
    setFilteredExpenses(result);
    setIsFiltering(!!searchTerm || !!dateFilter.startDate || !!dateFilter.endDate || !!categoryFilter);
  };

  // Calculate daily and monthly totals
  const calculateTotals = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Calculate daily total
    const todayExpenses = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.createdAt);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === today.getTime();
    });
    
    const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate monthly total
    const monthExpenses = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate >= firstDayOfMonth;
    });
    
    const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    setDailyTotal(todayTotal);
    setMonthlyTotal(monthTotal);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({
      startDate: '',
      endDate: ''
    });
    setCategoryFilter('');
    setFilteredExpenses(expenses);
    setShowFilterDialog(false);
  };

  // Handle expense form submission
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }

    if (!expenseData.category) {
      addToast('Please select a category', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEditing && editingId) {
        // Update existing expense
        await api.put(`/expenses/${editingId}`, {
          ...expenseData,
          amount: parseFloat(expenseData.amount)
        });
        addToast('Expense updated successfully!', 'success');
      } else {
        // Create new expense - let backend handle balance check
        await api.post('/expenses', {
          ...expenseData,
          amount: parseFloat(expenseData.amount)
        });
        addToast('Expense added successfully!', 'success');
      }
      
      // Reset form and refresh expenses
      setExpenseData({
        amount: '',
        category: '',
        description: ''
      });
      setIsEditing(false);
      setEditingId(null);
      setShowAddEditDialog(false);
      fetchExpenses();
    } catch (err: any) {
      console.error('Error in expense form submission:', err);
      
      // Check for insufficient funds error from backend
      if (err.response && err.response.data && err.response.data.message) {
        if (err.response.data.message.includes('Insufficient funds')) {
          addToast('Expense cannot be added. Insufficient funds in your expenses section.', 'warning');
        } else {
          addToast(err.response.data.message, 'error');
        }
      } else {
        addToast(`Failed to ${isEditing ? 'update' : 'add'} expense. Please try again.`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle expense deletion
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      await api.delete(`/expenses/${expenseToDelete}`);
      addToast('Expense deleted successfully!', 'success');
      setShowDeleteDialog(false);
      setExpenseToDelete(null);
      fetchExpenses();
    } catch (err) {
      addToast('Failed to delete expense. Please try again.', 'error');
    }
  };

  // Handle expense edit
  const handleEditExpense = (expense: Expense) => {
    setExpenseData({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || ''
    });
    setIsEditing(true);
    setEditingId(expense.id);
    setShowAddEditDialog(true);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
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
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 text-sm">Manage your daily expenses and spending</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              setExpenseData({
                amount: '',
                category: '',
                description: ''
              });
              setIsEditing(false);
              setEditingId(null);
              setShowAddEditDialog(true);
            }}
            variant="primary"
          >
            <div className="flex items-center">
              <Plus className="h-4 w-4 mr-1.5" />
              New Expense
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
      
      {/* Compact Balance and Summary Cards */}
      <div className="mb-5 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="bg-purple-50 p-2 rounded-lg mr-3">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available for Expenses</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(sectionBalance)}</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center">
              <div className="bg-blue-50 p-2 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-xl font-bold text-blue-600">{isLoading ? '...' : formatCurrency(dailyTotal)}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-indigo-50 p-2 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-xl font-bold text-indigo-600">{isLoading ? '...' : formatCurrency(monthlyTotal)}</p>
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
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        
        <Button 
          onClick={() => setShowFilterDialog(true)}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters {isFiltering && <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">Active</span>}
          </div>
        </Button>
      </div>

      {/* Expenses List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
          Your Expenses
          <span className="ml-2 text-sm font-normal text-gray-500">
            {filteredExpenses.length} {isFiltering ? 'filtered' : ''} of {totalExpenses} total
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
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">
              {isFiltering ? 'No expenses match your filters' : 'No expenses recorded yet'}
            </h3>
            <p className="mb-6 max-w-md mx-auto">
              {isFiltering ? 
                'Try adjusting your search or filters' : 
                'Start tracking your spending by adding your first expense'
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
                  setExpenseData({
                    amount: '',
                    category: '',
                    description: ''
                  });
                  setIsEditing(false);
                  setEditingId(null);
                  setShowAddEditDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Expense
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(expense.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => handleEditExpense(expense)}
                            className="p-1.5 rounded-full bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Edit expense"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setExpenseToDelete(expense.id);
                              setShowDeleteDialog(true);
                            }}
                            className="p-1.5 rounded-full bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Simplified Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex justify-center border-t border-gray-200">
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
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      <TransferDialog
        isOpen={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
        fromSection="expenses"
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
                  <Filter className="h-5 w-5 mr-2 text-indigo-600" />
                  Filter Expenses
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">End Date</div>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {expenseCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
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

      {/* Add/Edit Expense Dialog */}
      {showAddEditDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 w-full max-w-md md:max-w-xl bg-white rounded-xl shadow-lg">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                  {isEditing ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button 
                  onClick={() => setShowAddEditDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitExpense}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Amount"
                    type="number"
                    value={expenseData.amount}
                    onChange={(value) => setExpenseData({ ...expenseData, amount: value })}
                    required
                    placeholder="0.00"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={expenseData.category}
                      onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {expenseCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Input
                    label="Description"
                    type="text"
                    value={expenseData.description}
                    onChange={(value) => setExpenseData({ ...expenseData, description: value })}
                    placeholder="What was this expense for?"
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddEditDialog(false);
                      setIsEditing(false);
                      setEditingId(null);
                      setExpenseData({
                        amount: '',
                        category: '',
                        description: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                  >
                    {isEditing ? 'Update Expense' : 'Add Expense'}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Expense</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setExpenseToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDeleteExpense}
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