'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CreditCard, DollarSign, Pencil, Trash2, Plus, Calendar, Filter, X, AlertTriangle, Search, ChevronDown } from 'lucide-react';
import api from '../../utils/axios';
import { useToast } from '../../../components/ui/toast';
import { checkSectionBalance } from '../../utils/balanceCheck';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: string;
}

export default function ExpensesPage() {
  const { user } = useAuth();
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

  // Common expense categories
  const expenseCategories = [
    'Food', 'Rent', 'Utilities', 'Transportation', 
    'Entertainment', 'Healthcare', 'Education', 'Shopping',
    'Travel', 'Subscriptions', 'Other'
  ];

  // Fetch expenses
  useEffect(() => {
    fetchExpenses();
  }, [currentPage]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [expenses, searchTerm, dateFilter, categoryFilter]);

  // Calculate daily and monthly totals
  useEffect(() => {
    calculateTotals();
  }, [filteredExpenses]);

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
      day: 'numeric'
    }).format(date);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Expenses Management</h1>
      <p className="text-gray-600 mb-6">Track and manage your expenses easily</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Today's Expenses:</span>
            <span className="text-lg font-semibold text-blue-700">
              {isLoading ? '...' : formatCurrency(dailyTotal)}
            </span>
          </div>
        </div>
        
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">This Month:</span>
            <span className="text-lg font-semibold text-indigo-700">
              {isLoading ? '...' : formatCurrency(monthlyTotal)}
            </span>
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
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setShowFilterDialog(true)}
            variant="outline"
          >
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters {isFiltering && <span className="ml-1 text-xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full">Active</span>}
            </div>
          </Button>
          
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
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
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

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
            Your Expenses
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-1" />
            <span>{filteredExpenses.length} {isFiltering ? 'filtered' : ''} of {totalExpenses} Expenses</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-10">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-gray-600 font-medium">
              {isFiltering ? 'No expenses match your filters' : 'No expenses recorded yet'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {isFiltering ? 
                'Try adjusting your search or filters' : 
                'Add your first expense to start tracking'
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
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditExpense(expense)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setExpenseToDelete(expense.id);
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
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === i + 1
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        Next
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