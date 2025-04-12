'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PiggyBank, DollarSign, ArrowRight, CheckCircle, XCircle, ArrowDownLeft, Percent } from 'lucide-react';
import api from '../../utils/axios';
import { useToast } from '../../../components/ui/toast';

export default function IncomePage() {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const [availableIncome, setAvailableIncome] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [incomeData, setIncomeData] = useState({
    amount: '',
    description: '',
    type: 'regular',
    investmentId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [calculatedDistribution, setCalculatedDistribution] = useState({
    savings: 0,
    expenses: 0,
    investments: 0
  });
  const [transferData, setTransferData] = useState({
    amount: '',
    toSection: 'savings'
  });

  // Add state for investments
  const [activeInvestments, setActiveInvestments] = useState<Array<{id: string, assetName: string, amount: number}>>([]);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);

  // Fetch available income
  useEffect(() => {
    const fetchAvailableIncome = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        const response = await api.get('/income/available');
        const data = response.data;
        setAvailableIncome(data.data);
      } catch (err) {
        addToast('Error fetching available income. Please try again later.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableIncome();
  }, [token, user, addToast]);

  // Add a function to fetch active investments
  const fetchActiveInvestments = async () => {
    try {
      setIsLoadingInvestments(true);
      const response = await api.get('/investments?isClosed=false');
      const data = response.data;
      setActiveInvestments(data.data || []);
    } catch (err) {
      console.error('Error fetching active investments:', err);
      addToast('Error loading investment options', 'error');
    } finally {
      setIsLoadingInvestments(false);
    }
  };

  // Update the income type change handler
  const handleIncomeTypeChange = (type: string) => {
    setIncomeData({ ...incomeData, type, investmentId: '' });
    
    if (type === 'investment_return') {
      fetchActiveInvestments();
    }
  };

  // Handle income form submission
  const handleSubmitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!incomeData.amount || parseFloat(incomeData.amount) <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }

    if (incomeData.type === 'investment_return' && !incomeData.investmentId) {
      addToast('Please select an investment', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/income', {
        amount: parseFloat(incomeData.amount),
        description: incomeData.description,
        type: incomeData.type,
        investmentId: incomeData.type === 'investment_return' ? incomeData.investmentId : null
      });

      addToast('Income added successfully!', 'success');
      setIncomeData({
        amount: '',
        description: '',
        type: 'regular',
        investmentId: ''
      });
      
      // Refresh available income
      const incomeResponse = await api.get('/income/available');
      const data = incomeResponse.data;
      setAvailableIncome(data.data);
    } catch (err) {
      addToast('Failed to add income. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate distribution based on user preferences
  const calculateDistribution = () => {
    if (!user || availableIncome <= 0) return;

    const savingsPercent = user.savingsPercent ?? 0;
    const expensesPercent = user.expensesPercent ?? 0;
    const investmentsPercent = user.investmentsPercent ?? 0;

    const savingsAmount = availableIncome * (savingsPercent / 100);
    const expensesAmount = availableIncome * (expensesPercent / 100);
    const investmentsAmount = availableIncome * (investmentsPercent / 100);

    setCalculatedDistribution({
      savings: parseFloat(savingsAmount.toFixed(2)),
      expenses: parseFloat(expensesAmount.toFixed(2)),
      investments: parseFloat(investmentsAmount.toFixed(2))
    });

    setShowDistributeDialog(true);
  };

  // Handle distributing income
  const handleDistributeIncome = async () => {
    if (availableIncome <= 0) {
      addToast('No income available to distribute', 'error');
      return;
    }

    try {
      setIsDistributing(true);
      
      await api.post('/sections/distribute');

      addToast('Income distributed successfully!', 'success');
      setAvailableIncome(0);
      setShowDistributeDialog(false);
    } catch (err) {
      addToast('Failed to distribute income. Please try again.', 'error');
    } finally {
      setIsDistributing(false);
    }
  };

  // Handle transferring income to a specific section
  const handleTransferIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferData.amount || parseFloat(transferData.amount) <= 0) {
      addToast('Please enter a valid transfer amount', 'error');
      return;
    }

    if (parseFloat(transferData.amount) > availableIncome) {
      addToast('Transfer amount cannot exceed available income', 'error');
      return;
    }

    try {
      setIsTransferring(true);
      
      await api.post('/transactions/transfer-income', {
        amount: parseFloat(transferData.amount),
        toSection: transferData.toSection
      });

      addToast(`Successfully transferred ${formatCurrency(parseFloat(transferData.amount))} to ${transferData.toSection}`, 'success');
      
      // Refresh available income
      const incomeResponse = await api.get('/income/available');
      setAvailableIncome(incomeResponse.data.data);
      
      // Reset transfer form
      setTransferData({
        amount: '',
        toSection: 'savings'
      });
    } catch (err) {
      addToast('Failed to transfer income. Please try again.', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Income Management</h1>
      <p className="text-gray-600 mb-6">Manage your income and distribute funds to different sections</p>

      <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Available Income:</span>
          <span className="text-lg font-semibold text-indigo-700">
            {isLoading ? '...' : formatCurrency(availableIncome)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Add Income Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
            Add New Income
          </h2>
          
          <form onSubmit={handleSubmitIncome}>
            <div className="space-y-4">
              <Input
                label="Amount"
                type="number"
                value={incomeData.amount}
                onChange={(value) => setIncomeData({ ...incomeData, amount: value })}
                required
                placeholder="0.00"
              />
              
              <Input
                label="Description"
                type="text"
                value={incomeData.description}
                onChange={(value) => setIncomeData({ ...incomeData, description: value })}
                placeholder="Salary, Bonus, etc."
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Income Type</label>
                <select
                  value={incomeData.type}
                  onChange={(e) => handleIncomeTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="regular">Regular Income</option>
                  <option value="investment_return">Investment Return</option>
                </select>
              </div>
              
              {incomeData.type === 'investment_return' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Investment</label>
                  {isLoadingInvestments ? (
                    <div className="text-sm text-gray-500">Loading investments...</div>
                  ) : activeInvestments.length === 0 ? (
                    <div className="text-sm text-gray-500">No active investments found</div>
                  ) : (
                    <select
                      value={incomeData.investmentId}
                      onChange={(e) => setIncomeData({ ...incomeData, investmentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select an investment</option>
                      {activeInvestments.map((investment) => (
                        <option key={investment.id} value={investment.id}>
                          {investment.assetName} ({formatCurrency(investment.amount)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              <Button
                type="submit"
                fullWidth
                loading={isSubmitting}
              >
                Add Income
              </Button>
            </div>
          </form>
        </div>

        {/* Transfer to Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ArrowDownLeft className="h-5 w-5 mr-2 text-purple-600" />
            Transfer to Section
          </h2>
          
          {availableIncome > 0 ? (
            <form onSubmit={handleTransferIncome}>
              <div className="space-y-4">
                <Input
                  label="Amount to Transfer"
                  type="number"
                  value={transferData.amount}
                  onChange={(value) => setTransferData({ ...transferData, amount: value })}
                  required
                  placeholder="0.00"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Section</label>
                  <select
                    value={transferData.toSection}
                    onChange={(e) => setTransferData({ ...transferData, toSection: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="savings">Savings</option>
                    <option value="expenses">Expenses</option>
                    <option value="investments">Investments</option>
                  </select>
                </div>
                
                <Button
                  type="submit"
                  fullWidth
                  loading={isTransferring}
                  variant="secondary"
                >
                  <div className="flex items-center justify-center">
                    Transfer to {transferData.toSection.charAt(0).toUpperCase() + transferData.toSection.slice(1)}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600">No income available for transfer.</p>
              <p className="text-gray-500 text-sm mt-2">Add income first to transfer it to a section.</p>
            </div>
          )}
        </div>

        {/* Distribute Income Panel - Simplified */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Percent className="h-5 w-5 mr-2 text-indigo-600" />
            Auto-Distribute Income
          </h2>
          
          {availableIncome > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700 mb-2">
                  This will distribute your available income according to your preset percentages:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-blue-600 font-medium">Savings</p>
                    <p className="text-sm text-blue-800 font-semibold">{user?.savingsPercent || 0}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-blue-600 font-medium">Expenses</p>
                    <p className="text-sm text-blue-800 font-semibold">{user?.expensesPercent || 0}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-blue-600 font-medium">Investments</p>
                    <p className="text-sm text-blue-800 font-semibold">{user?.investmentsPercent || 0}%</p>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={calculateDistribution}
                fullWidth
              >
                <div className="flex items-center justify-center">
                  Distribute Income
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600">No income available for distribution.</p>
              <p className="text-gray-500 text-sm mt-2">Add income first to distribute it to your sections.</p>
            </div>
          )}
        </div>
      </div>

      {/* Distribution Confirmation Dialog */}
      {showDistributeDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg max-w-lg w-full mx-4 shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Distribution</h3>
              
              <p className="text-gray-700 mb-4">
                Your available income of {formatCurrency(availableIncome)} will be distributed as follows:
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="font-medium text-gray-700">Savings ({user?.savingsPercent || 0}%):</span>
                  <span className="font-semibold text-indigo-700">{formatCurrency(calculatedDistribution.savings)}</span>
                </div>
                <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium text-gray-700">Expenses ({user?.expensesPercent || 0}%):</span>
                  <span className="font-semibold text-purple-700">{formatCurrency(calculatedDistribution.expenses)}</span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="font-medium text-gray-700">Investments ({user?.investmentsPercent || 0}%):</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(calculatedDistribution.investments)}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowDistributeDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleDistributeIncome}
                  loading={isDistributing}
                >
                  Confirm Distribution
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 