'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PiggyBank, DollarSign, Pencil, Trash2, Plus, X, Calendar, Target, Check, AlertTriangle, ArrowLeftRight, CreditCard, TrendingUp } from 'lucide-react';
import api from '../../utils/axios';
import { useToast } from '../../../components/ui/toast';
import { TransferDialog } from '../../components/TransferDialog';

interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  isCompleted: boolean;
  category: string;
  transferType?: 'EXPENSE' | 'INVESTMENT';
  purpose?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SavingGoalsPage() {
  const { user, forceRefreshUser } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [goalData, setGoalData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    category: '',
    transferType: 'expenses' as 'expenses' | 'investments',
    purpose: ''
  });
  
  // States for section balances
  const [availableSavingsBalance, setAvailableSavingsBalance] = useState(0);
  const [totalSavingsBalance, setTotalSavingsBalance] = useState(0);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  // Common goal categories
  const goalCategories = [
    'EMERGENCY', 'VACATION', 'VEHICLE', 'HOME', 'EDUCATION', 'OTHER'
  ];

  // Handle contribution to a goal
  const [showContributeDialog, setShowContributeDialog] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null);
  const [isContributing, setIsContributing] = useState(false);
  
  // Handle withdrawal from a goal
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawingGoalId, setWithdrawingGoalId] = useState<string | null>(null);
  const [withdrawingGoal, setWithdrawingGoal] = useState<SavingGoal | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Fetch saving goals and section balance
  useEffect(() => {
    fetchSavingGoals();
    fetchSectionBalance();
    fetchUserProfile();
  }, [currentPage]);
  
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data && response.data.data) {
        setTotalSavingsBalance(response.data.data.savingsBalance || 0);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      addToast('Error loading savings balance', 'error');
    }
  };

  const fetchSectionBalance = async () => {
    try {
      const response = await api.get('/sections');
      if (response.data && response.data.savings !== undefined) {
        setAvailableSavingsBalance(response.data.savings);
      }
    } catch (err) {
      console.error('Error fetching section balance:', err);
      addToast('Error loading savings balance', 'error');
    }
  };

  const fetchSavingGoals = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/saving-goals?page=${currentPage}&limit=10`);
      const data = response.data;
      
      setSavingGoals(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (err) {
      addToast('Error fetching saving goals. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle goal form submission
  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goalData.name) {
      addToast('Please enter a goal name', 'error');
      return;
    }

    if (!goalData.targetAmount || parseFloat(goalData.targetAmount) <= 0) {
      addToast('Please enter a valid target amount', 'error');
      return;
    }

    if (!goalData.category) {
      addToast('Please select a category', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert transferType to backend format
      const transferTypeFormatted = goalData.transferType === 'expenses' ? 'EXPENSE' : 'INVESTMENT';
      
      // Prepare the data to send
      const dataToSend = {
        ...goalData,
        targetAmount: parseFloat(goalData.targetAmount),
        currentAmount: parseFloat(goalData.currentAmount || '0'),
        transferType: transferTypeFormatted
      };
      
      // Log the exact data being sent to help with debugging
      console.log('Submitting goal data:', dataToSend);
      
      if (isEditing && editingId) {
        // Update existing goal
        await api.put(`/saving-goals/${editingId}`, dataToSend);
        addToast('Saving goal updated successfully!', 'success');
      } else {
        // Create new goal - let backend handle any balance checks
        await api.post('/saving-goals', dataToSend);
        addToast('Saving goal added successfully!', 'success');
      }
      
      // Reset form and refresh goals
      setGoalData({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        category: '',
        transferType: 'expenses' as 'expenses' | 'investments',
        purpose: ''
      });
      setIsEditing(false);
      setEditingId(null);
      setShowAddEditDialog(false);
      
      // Refresh all data
      await Promise.all([
        fetchSavingGoals(),
        fetchSectionBalance(),
        fetchUserProfile()
      ]);
    } catch (err: any) {
      console.error('Error in goal form submission:', err);
      
      // More detailed error logging
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
        
        // Log the request that was sent
        console.error('Request that caused error:', {
          method: err.config?.method,
          url: err.config?.url,
          data: err.config?.data
        });
      } else if (err.request) {
        console.error('Error request:', err.request);
      } else {
        console.error('Error message:', err.message);
      }
      
      // Check for specific error scenarios and provide helpful messages
      if (err.response) {
        if (err.response.status === 400 && err.response.data?.message) {
          addToast(err.response.data.message, 'error');
          return;
        }
        
        if (err.response.status === 401) {
          addToast('Authentication error. Please log in again.', 'error');
          return;
        }
        
        if (err.response.status === 403) {
          addToast('You do not have permission to perform this action.', 'error');
          return;
        }
        
        if (err.response.status === 404) {
          addToast('The requested resource was not found.', 'error');
          return;
        }
        
        if (err.response.status === 500) {
          addToast('Server error. Please try again later.', 'error');
          return;
        }
        
        // Specific application errors
        if (err.response.data && err.response.data.message) {
          if (err.response.data.message.includes('Insufficient funds')) {
            addToast('Saving goal cannot be created. Insufficient funds available.', 'warning');
            return;
          }
          
          addToast(err.response.data.message, 'error');
          return;
        }
      }
      
      // Network issues
      if (err.message && err.message.includes('Network Error')) {
        addToast('Network error. Please check your internet connection.', 'error');
        return;
      }
      
      // Default fallback
      addToast(`Failed to ${isEditing ? 'update' : 'add'} saving goal. Please try again.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle goal deletion
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      await api.delete(`/saving-goals/${goalToDelete}`);
      addToast('Saving goal deleted successfully!', 'success');
      setShowDeleteDialog(false);
      setGoalToDelete(null);
      
      // Refresh all data to ensure amounts are updated
      await Promise.all([
        fetchSavingGoals(),
        fetchSectionBalance(),
        fetchUserProfile()
      ]);
    } catch (err) {
      addToast('Failed to delete saving goal. Please try again.', 'error');
    }
  };

  // Handle goal edit
  const handleEditGoal = (goal: SavingGoal) => {
    console.log('Editing goal:', goal);
    
    // Convert backend format (EXPENSE/INVESTMENT) to frontend format (expenses/investments)
    const normalizedTransferType = goal.transferType === 'EXPENSE' ? 'expenses' : 'investments';
    
    console.log('Normalized transferType:', normalizedTransferType);
    
    setGoalData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      category: goal.category || '',
      transferType: normalizedTransferType as 'expenses' | 'investments',
      purpose: goal.purpose || ''
    });
    
    setIsEditing(true);
    setEditingId(goal.id);
    setShowAddEditDialog(true);
  };

  // Calculate goal progress percentage
  const calculateProgress = (currentAmount: number, targetAmount: number) => {
    if (targetAmount <= 0) return 0;
    const progress = (currentAmount / targetAmount) * 100;
    return Math.min(100, progress);
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

  // Handle contribution to a goal
  const handleContributeToGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contributingGoalId) return;
    
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      addToast('Please enter a valid contribution amount', 'error');
      return;
    }

    const amount = parseFloat(contributionAmount);
    
    // Check if there are enough funds
    if (amount > availableSavingsBalance) {
      addToast('Insufficient funds in savings balance', 'error');
      return;
    }

    try {
      setIsContributing(true);
      
      // Optimistically update the UI before API call
      setAvailableSavingsBalance(prev => prev - amount);
      
      await api.post(`/saving-goals/${contributingGoalId}/contribute`, {
        amount
      });
      
      addToast('Contribution made successfully!', 'success');
      setShowContributeDialog(false);
      setContributionAmount('');
      setContributingGoalId(null);
      
      // Refresh all data to ensure consistency
      await Promise.all([
        fetchSavingGoals(),
        fetchSectionBalance(),
        fetchUserProfile()
      ]);
    } catch (err: any) {
      // If there's an error, revert the optimistic update
      setAvailableSavingsBalance(prev => prev + amount);
      
      if (err.response?.data?.message) {
        addToast(err.response.data.message, 'error');
      } else {
        addToast('Failed to make contribution. Please try again.', 'error');
      }
    } finally {
      setIsContributing(false);
    }
  };

  // Open contribute dialog
  const openContributeDialog = (goalId: string) => {
    setContributingGoalId(goalId);
    setContributionAmount('');
    setShowContributeDialog(true);
  };
  
  // Handle transfer completion
  const handleTransferComplete = async () => {
    // Refresh section balance and user profile
    await Promise.all([
      fetchSectionBalance(),
      fetchUserProfile()
    ]);
  };

  // Handle withdrawal from a goal
  const handleWithdrawFromGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!withdrawingGoalId || !withdrawingGoal) return;
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      addToast('Please enter a valid withdrawal amount', 'error');
      return;
    }
    
    if (withdrawingGoal && parseFloat(withdrawAmount) > withdrawingGoal.currentAmount) {
      addToast('Withdrawal amount cannot exceed available goal balance', 'error');
      return;
    }

    const amount = parseFloat(withdrawAmount);

    try {
      setIsWithdrawing(true);
      
      // Optimistically update the UI before API call
      setAvailableSavingsBalance(prev => prev + amount);
      
      await api.post(`/saving-goals/${withdrawingGoalId}/transfer-to-savings`, {
        amount
      });
      
      addToast('Funds transferred to savings successfully!', 'success');
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setWithdrawingGoalId(null);
      setWithdrawingGoal(null);
      
      // Refresh all data to ensure consistency
      await Promise.all([
        fetchSavingGoals(),
        fetchSectionBalance(),
        fetchUserProfile()
      ]);
    } catch (err: any) {
      // If there's an error, revert the optimistic update
      setAvailableSavingsBalance(prev => prev - amount);
      
      if (err.response?.data?.message) {
        addToast(err.response.data.message, 'error');
      } else {
        addToast('Failed to transfer funds. Please try again.', 'error');
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Open withdraw dialog
  const openWithdrawDialog = (goal: SavingGoal) => {
    setWithdrawingGoalId(goal.id);
    setWithdrawingGoal(goal);
    setWithdrawAmount('');
    setShowWithdrawDialog(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header and Balance in a more compact layout */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-2 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Saving Goals</h1>
          <p className="text-gray-600 text-sm">Create and track progress toward your savings targets</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              setGoalData({
                name: '',
                targetAmount: '',
                currentAmount: '0',
                category: '',
                transferType: 'expenses',
                purpose: ''
              });
              setIsEditing(false);
              setEditingId(null);
              setShowAddEditDialog(true);
            }}
            variant="primary"
          >
            <div className="flex items-center">
              <Plus className="h-4 w-4 mr-1.5" />
              New Goal
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
            <div className="bg-indigo-50 p-2 rounded-lg mr-3">
              <PiggyBank className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Savings</p>
              <p className="text-xl font-bold text-indigo-600">{formatCurrency(totalSavingsBalance)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="bg-emerald-50 p-2 rounded-lg mr-3">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available for Goals</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(availableSavingsBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals List - Given more prominence */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Your Saving Goals</h2>
        
        {isLoading ? (
          <div className="p-6 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : savingGoals.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
            <PiggyBank className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No saving goals yet</h3>
            <p className="mb-6 max-w-md mx-auto">Start planning for your future by creating your first saving goal.</p>
            <Button onClick={() => setShowAddEditDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {savingGoals.map((goal) => {
              const progressPercent = calculateProgress(goal.currentAmount, goal.targetAmount);
              
              return (
                <div key={goal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{goal.name}</h3>
                      <div className="flex items-center mt-1">
                        {goal.isCompleted ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="font-medium mr-1">{progressPercent.toFixed(0)}%</span>
                            <span>complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-1">
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="p-1.5 rounded-full bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Edit goal"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setGoalToDelete(goal.id);
                          setShowDeleteDialog(true);
                        }}
                        className="p-1.5 rounded-full bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete goal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="px-4 pb-4">
                    {/* Progress Bar - More visible */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            progressPercent >= 100 
                              ? 'bg-green-500' 
                              : progressPercent > 50 
                                ? 'bg-indigo-500' 
                                : 'bg-indigo-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Amount display */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Current</div>
                        <div className="text-lg font-medium">{formatCurrency(goal.currentAmount)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Target</div>
                        <div className="text-lg font-medium">{formatCurrency(goal.targetAmount)}</div>
                      </div>
                    </div>
                    
                    {/* Purpose - highlighted for importance */}
                    {goal.purpose && (
                      <div className="p-3 bg-gray-50 rounded-md mb-3">
                        <p className="text-sm text-gray-700 italic line-clamp-2">
                          "{goal.purpose}"
                        </p>
                      </div>
                    )}
                    
                    {/* Destination after completion */}
                    <div className="flex items-center mb-3 text-sm">
                      <ArrowLeftRight className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-600">
                        When completed, funds will be transferred to{' '}
                        {goal.transferType === 'EXPENSE' ? (
                          <span className="font-medium text-purple-700">Expenses</span>
                        ) : (
                          <span className="font-medium text-emerald-700">Investments</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Categories */}
                    {(goal.category || goal.transferType) && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {goal.category && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            {goal.category}
                          </span>
                        )}
                        {goal.transferType === 'EXPENSE' && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                            <CreditCard className="h-3 w-3 mr-1" />
                            To Expenses
                          </span>
                        )}
                        {goal.transferType === 'INVESTMENT' && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            To Investments
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="mt-4 flex gap-2">
                      {!goal.isCompleted ? (
                        <>
                          <Button 
                            onClick={() => openContributeDialog(goal.id)}
                            variant="outline"
                            fullWidth
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                            Add Funds
                          </Button>
                          {goal.currentAmount > 0 && (
                            <Button 
                              onClick={() => openWithdrawDialog(goal)}
                              variant="outline"
                              fullWidth
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
                              Withdraw
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="w-full text-sm text-center p-2 bg-green-50 text-green-600 rounded-md flex items-center justify-center">
                          <Check className="h-4 w-4 mr-1.5" />
                          Goal completed!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Goal Dialog */}
      {showAddEditDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 w-full max-w-md md:max-w-xl bg-white rounded-xl shadow-lg">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-indigo-600" />
                  {isEditing ? 'Edit Saving Goal' : 'Add New Saving Goal'}
                </h3>
                <button 
                  onClick={() => setShowAddEditDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitGoal}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Goal Name"
                    type="text"
                    value={goalData.name}
                    onChange={(value) => setGoalData({ ...goalData, name: value })}
                    required
                    placeholder="e.g., Emergency Fund, Vacation"
                  />
                  
                  <Input
                    label="Target Amount"
                    type="number"
                    value={goalData.targetAmount}
                    onChange={(value) => setGoalData({ ...goalData, targetAmount: value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={goalData.category}
                      onChange={(e) => setGoalData({ ...goalData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {goalCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Destination
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGoalData({ ...goalData, transferType: 'expenses' })}
                        className={`p-2 rounded-md border ${
                          goalData.transferType === 'expenses'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <CreditCard className="h-5 w-5 mb-1" />
                          <span className="text-xs">Expenses</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalData({ ...goalData, transferType: 'investments' })}
                        className={`p-2 rounded-md border ${
                          goalData.transferType === 'investments'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <TrendingUp className="h-5 w-5 mb-1" />
                          <span className="text-xs">Investments</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="mb-4">
                    <Input
                      label="Current Amount Saved"
                      type="number"
                      value={goalData.currentAmount}
                      onChange={(value) => setGoalData({ ...goalData, currentAmount: value })}
                      placeholder="0.00"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <textarea
                    value={goalData.purpose}
                    onChange={(e) => setGoalData({ ...goalData, purpose: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Why this goal is important to you"
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
                    {isEditing ? 'Update Goal' : 'Create Goal'}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Saving Goal</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this saving goal? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setGoalToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDeleteGoal}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Dialog */}
      {showContributeDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 w-full max-w-md bg-white rounded-xl shadow-lg">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <PiggyBank className="h-5 w-5 mr-2 text-indigo-600" />
                  Contribute to Goal
                </h3>
                <button 
                  onClick={() => setShowContributeDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleContributeToGoal}>
                <div className="mb-4">
                  <Input
                    label="Contribution Amount"
                    type="number"
                    value={contributionAmount}
                    onChange={setContributionAmount}
                    required
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This amount will be taken from your savings balance.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContributeDialog(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    loading={isContributing}
                  >
                    Contribute
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Dialog */}
      {showWithdrawDialog && withdrawingGoal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 w-full max-w-md bg-white rounded-xl shadow-lg">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <ArrowLeftRight className="h-5 w-5 mr-2 text-indigo-600" />
                  Withdraw from Goal
                </h3>
                <button 
                  onClick={() => setShowWithdrawDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleWithdrawFromGoal}>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Withdrawing funds from: <span className="font-medium">{withdrawingGoal.name}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Available balance: <span className="font-medium">{formatCurrency(withdrawingGoal.currentAmount)}</span>
                  </p>
                  <Input
                    label="Withdrawal Amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(value) => {
                      const amount = parseFloat(value);
                      if (!isNaN(amount) && withdrawingGoal && amount > withdrawingGoal.currentAmount) {
                        setWithdrawAmount(withdrawingGoal.currentAmount.toString());
                      } else {
                        setWithdrawAmount(value);
                      }
                    }}
                    required
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This amount will be returned to your savings balance.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWithdrawDialog(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    loading={isWithdrawing}
                  >
                    Withdraw
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pagination - simplified */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 bg-white text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
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
        fromSection="savings"
        availableAmount={availableSavingsBalance}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  );
} 