'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PiggyBank, DollarSign, Pencil, Trash2, Plus, X, Calendar, Target, Check, AlertTriangle } from 'lucide-react';
import api from '../../utils/axios';
import { useToast } from '../../../components/ui/toast';

interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  notes: string;
  createdAt: string;
}

export default function SavingGoalsPage() {
  const { user } = useAuth();
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
    deadline: '',
    category: '',
    notes: ''
  });

  // Common goal categories
  const goalCategories = [
    'Emergency Fund', 'Vacation', 'Home Purchase', 'Education', 
    'Retirement', 'Vehicle', 'Wedding', 'Other'
  ];

  // Fetch saving goals
  useEffect(() => {
    fetchSavingGoals();
  }, [currentPage]);

  const fetchSavingGoals = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/goals?page=${currentPage}&limit=10`);
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

    if (!goalData.deadline) {
      addToast('Please set a deadline', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEditing && editingId) {
        // Update existing goal
        await api.put(`/goals/${editingId}`, {
          ...goalData,
          targetAmount: parseFloat(goalData.targetAmount),
          currentAmount: parseFloat(goalData.currentAmount || '0')
        });
        addToast('Saving goal updated successfully!', 'success');
      } else {
        // Create new goal - let backend handle any balance checks
        await api.post('/goals', {
          ...goalData,
          targetAmount: parseFloat(goalData.targetAmount),
          currentAmount: parseFloat(goalData.currentAmount || '0')
        });
        addToast('Saving goal added successfully!', 'success');
      }
      
      // Reset form and refresh goals
      setGoalData({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        deadline: '',
        category: '',
        notes: ''
      });
      setIsEditing(false);
      setEditingId(null);
      setShowAddEditDialog(false);
      fetchSavingGoals();
    } catch (err: any) {
      console.error('Error in goal form submission:', err);
      
      // Check for insufficient funds error from backend
      if (err.response && err.response.data && err.response.data.message) {
        if (err.response.data.message.includes('Insufficient funds')) {
          addToast('Saving goal cannot be created. Insufficient funds available.', 'warning');
        } else {
          addToast(err.response.data.message, 'error');
        }
      } else {
        addToast(`Failed to ${isEditing ? 'update' : 'add'} saving goal. Please try again.`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle goal deletion
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      await api.delete(`/goals/${goalToDelete}`);
      addToast('Saving goal deleted successfully!', 'success');
      setShowDeleteDialog(false);
      setGoalToDelete(null);
      fetchSavingGoals();
    } catch (err) {
      addToast('Failed to delete saving goal. Please try again.', 'error');
    }
  };

  // Handle goal edit
  const handleEditGoal = (goal: SavingGoal) => {
    setGoalData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: new Date(goal.deadline).toISOString().split('T')[0],
      category: goal.category || '',
      notes: goal.notes || ''
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

  // Calculate days remaining
  const getDaysRemaining = (deadlineString: string) => {
    const today = new Date();
    const deadline = new Date(deadlineString);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Saving Goals</h1>
      <p className="text-gray-600 mb-6">Set and track your financial goals</p>

      <div className="mb-6 flex justify-end">
        <Button 
          onClick={() => {
            setGoalData({
              name: '',
              targetAmount: '',
              currentAmount: '0',
              deadline: '',
              category: '',
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
            Add New Goal
          </div>
        </Button>
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
                  
                  <Input
                    label="Target Date"
                    type="date"
                    value={goalData.deadline}
                    onChange={(value) => setGoalData({ ...goalData, deadline: value })}
                    required
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={goalData.notes}
                    onChange={(e) => setGoalData({ ...goalData, notes: e.target.value })}
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

      {/* Goals List */}
      {isLoading ? (
        <div className="p-6 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
          Loading saving goals...
        </div>
      ) : savingGoals.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
          <PiggyBank className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No saving goals yet</h3>
          <p className="mb-4">Start planning for your future by creating your first saving goal.</p>
          <Button onClick={() => setShowAddEditDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savingGoals.map((goal) => {
            const progressPercent = calculateProgress(goal.currentAmount, goal.targetAmount);
            const daysRemaining = getDaysRemaining(goal.deadline);
            
            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 truncate">{goal.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="p-1 text-indigo-600 hover:text-indigo-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setGoalToDelete(goal.id);
                        setShowDeleteDialog(true);
                      }}
                      className="p-1 text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-500">Progress</span>
                      <span className="text-sm font-medium text-gray-700">{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          progressPercent >= 100 
                            ? 'bg-green-600' 
                            : progressPercent > 50 
                              ? 'bg-indigo-600' 
                              : 'bg-indigo-400'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Current</div>
                      <div className="font-semibold text-gray-800">
                        {formatCurrency(goal.currentAmount)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Target</div>
                      <div className="font-semibold text-gray-800">
                        {formatCurrency(goal.targetAmount)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(goal.deadline)}
                    </div>
                    
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      daysRemaining < 0 
                        ? 'bg-red-100 text-red-800' 
                        : daysRemaining < 30 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {daysRemaining < 0 
                        ? 'Overdue' 
                        : daysRemaining === 0 
                          ? 'Due today' 
                          : `${daysRemaining} days left`}
                    </div>
                  </div>
                  
                  {goal.category && (
                    <div className="mb-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                        {goal.category}
                      </span>
                    </div>
                  )}
                  
                  {goal.notes && (
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {goal.notes}
                    </div>
                  )}
                </div>
                
                {/* Quick Action Button */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <Button 
                    onClick={() => handleEditGoal(goal)}
                    variant="outline"
                    fullWidth
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Update Progress
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
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
      )}
    </div>
  );
} 