'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { 
  XCircle, 
  Plus, 
  Minus, 
  Scale, 
  PiggyBank, 
  TrendingUp, 
  CreditCard,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

export const SetupModal = ({ isOpen, onClose, onSetupComplete }: SetupModalProps) => {
  const { updateUserProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    savingsPercent: 30,
    expensesPercent: 50,
    investmentsPercent: 20,
    leftoverAction: 'savings' as 'savings' | 'expenses' | 'investments'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalPercent = formData.savingsPercent + formData.expensesPercent + formData.investmentsPercent;

  // Apply preset allocation
  const applyPreset = (preset: 'balanced' | 'savings' | 'growth' | 'expenses') => {
    switch (preset) {
      case 'balanced':
        setFormData({
          ...formData,
          savingsPercent: 30,
          expensesPercent: 50,
          investmentsPercent: 20
        });
        break;
      case 'savings':
        setFormData({
          ...formData,
          savingsPercent: 40,
          expensesPercent: 45,
          investmentsPercent: 15
        });
        break;
      case 'growth':
        setFormData({
          ...formData,
          savingsPercent: 20,
          expensesPercent: 45,
          investmentsPercent: 35
        });
        break;
      case 'expenses':
        setFormData({
          ...formData,
          savingsPercent: 20,
          expensesPercent: 65,
          investmentsPercent: 15
        });
        break;
    }
  };

  // Handle increment/decrement of percentages
  const handlePercentChange = (field: 'savingsPercent' | 'expensesPercent' | 'investmentsPercent', amount: number) => {
    const updatedFormData = { ...formData };
    
    // Ensure we don't go below 0 or above 100
    const newValue = Math.max(0, Math.min(100, formData[field] + amount));
    
    // Calculate the difference that needs to be distributed
    const diff = newValue - formData[field];
    
    // If no change needed, exit early
    if (diff === 0) return;
    
    updatedFormData[field] = newValue;
    
    // Determine which fields to adjust to maintain 100% total
    const fieldsToAdjust = ['savingsPercent', 'expensesPercent', 'investmentsPercent']
      .filter(f => f !== field) as Array<'savingsPercent' | 'expensesPercent' | 'investmentsPercent'>;
    
    // If we're increasing one percentage, decrease others proportionally
    if (diff > 0) {
      const totalOthers = fieldsToAdjust.reduce((sum, f) => sum + updatedFormData[f], 0);
      
      if (totalOthers <= 0) return; // Can't adjust if other fields are 0
      
      // Distribute the reduction proportionally
      let remaining = diff;
      fieldsToAdjust.forEach((f, index) => {
        const isLastField = index === fieldsToAdjust.length - 1;
        const proportion = updatedFormData[f] / totalOthers;
        
        if (isLastField) {
          // For the last field, just subtract the remaining difference
          updatedFormData[f] = Math.max(0, updatedFormData[f] - remaining);
        } else {
          const reduction = Math.min(updatedFormData[f], Math.round(diff * proportion));
          updatedFormData[f] -= reduction;
          remaining -= reduction;
        }
      });
    } 
    // If we're decreasing one percentage, increase others proportionally
    else if (diff < 0) {
      const totalOthers = fieldsToAdjust.reduce((sum, f) => sum + updatedFormData[f], 0);
      
      // Distribute the increase proportionally
      let remaining = -diff;
      fieldsToAdjust.forEach((f, index) => {
        const isLastField = index === fieldsToAdjust.length - 1;
        const proportion = totalOthers > 0 ? updatedFormData[f] / totalOthers : 1 / fieldsToAdjust.length;
        
        if (isLastField) {
          // For the last field, just add the remaining difference
          updatedFormData[f] = Math.min(100, updatedFormData[f] + remaining);
        } else {
          const increase = Math.round(-diff * proportion);
          updatedFormData[f] += increase;
          remaining -= increase;
        }
      });
    }
    
    // Ensure total is exactly 100%
    const newTotal = updatedFormData.savingsPercent + updatedFormData.expensesPercent + updatedFormData.investmentsPercent;
    if (newTotal !== 100) {
      // Adjust the first non-modified field to make total exactly 100%
      updatedFormData[fieldsToAdjust[0]] += (100 - newTotal);
    }
    
    setFormData(updatedFormData);
  };

  // Handle direct input of percentages
  const handleInputChange = (field: 'savingsPercent' | 'expensesPercent' | 'investmentsPercent', value: string) => {
    const numValue = parseInt(value) || 0;
    // Use the increment/decrement function for maintaining the total
    const diff = numValue - formData[field];
    handlePercentChange(field, diff);
  };

  const handleSave = async () => {
    if (totalPercent !== 100) {
      setError('Total percentage must equal 100%');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      await updateUserProfile(formData);
      setSuccess(true);
      
      // Call onSetupComplete after a brief delay to show success message
      setTimeout(() => {
        onSetupComplete();
      }, 1500);
    } catch (err) {
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Force the modal to be visible if isOpen is true
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className="bg-white px-6 pb-6 pt-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900">Welcome to Your Financial Journey!</h3>
              <div className="mt-2 h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-100 shadow-sm">
                <div className="flex">
                  <div className="shrink-0">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Success message */}
            {success && (
              <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-100 shadow-sm">
                <div className="flex">
                  <div className="shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Your preferences have been saved successfully!</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Content */}
            <div className="mt-4">
              {step === 1 && (
                <div className="space-y-6">
                  <p className="text-gray-700 text-center text-lg">
                    Let's set up your financial profile to help you manage your money more effectively.
                  </p>
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border border-blue-100 shadow-sm">
                    <p className="text-blue-700 font-medium mb-4">
                      This app helps you distribute your income across three financial categories:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                        <div className="flex items-center mb-2">
                          <PiggyBank className="text-indigo-500 mr-2 h-5 w-5" />
                          <h4 className="font-medium text-indigo-700">Savings</h4>
                        </div>
                        <p className="text-sm text-gray-600">Money you're setting aside for future needs</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                        <div className="flex items-center mb-2">
                          <CreditCard className="text-purple-500 mr-2 h-5 w-5" />
                          <h4 className="font-medium text-purple-700">Expenses</h4>
                        </div>
                        <p className="text-sm text-gray-600">Money for your daily and monthly expenses</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                        <div className="flex items-center mb-2">
                          <TrendingUp className="text-emerald-500 mr-2 h-5 w-5" />
                          <h4 className="font-medium text-emerald-700">Investments</h4>
                        </div>
                        <p className="text-sm text-gray-600">Money you're investing for growth</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 mt-4 border border-blue-100">
                      <p className="text-sm text-blue-700 font-medium">
                        Note: You must complete this setup to continue using the app.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => setStep(2)}
                      className="px-8 py-3 text-base rounded-lg transition-transform hover:scale-105"
                    >
                      Let's get started
                    </Button>
                  </div>
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-6">
                  <p className="mb-6 text-gray-700 text-center text-lg">
                    Choose how to distribute your income across your financial categories.
                  </p>
                  
                  {/* Preset buttons */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                      <Scale className="h-5 w-5 mr-2 text-indigo-600" />
                      Quick Presets
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => applyPreset('balanced')}
                        className="bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border border-indigo-200 text-indigo-700 py-4 px-4 rounded-lg text-base font-medium flex items-center transition-all hover:shadow-md"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center mr-3 flex-shrink-0">
                          <Scale className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Balanced</div>
                          <div className="text-sm opacity-80">30% Savings / 50% Expenses / 20% Investments</div>
                        </div>
                      </button>
                      <button
                        onClick={() => applyPreset('savings')}
                        className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 text-blue-700 py-4 px-4 rounded-lg text-base font-medium flex items-center transition-all hover:shadow-md"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-3 flex-shrink-0">
                          <PiggyBank className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Savings Focus</div>
                          <div className="text-sm opacity-80">40% Savings / 45% Expenses / 15% Investments</div>
                        </div>
                      </button>
                      <button
                        onClick={() => applyPreset('growth')}
                        className="bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border border-emerald-200 text-emerald-700 py-4 px-4 rounded-lg text-base font-medium flex items-center transition-all hover:shadow-md"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center mr-3 flex-shrink-0">
                          <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Growth Focus</div>
                          <div className="text-sm opacity-80">20% Savings / 45% Expenses / 35% Investments</div>
                        </div>
                      </button>
                      <button
                        onClick={() => applyPreset('expenses')}
                        className="bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 text-purple-700 py-4 px-4 rounded-lg text-base font-medium flex items-center transition-all hover:shadow-md"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center mr-3 flex-shrink-0">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Expenses Focus</div>
                          <div className="text-sm opacity-80">20% Savings / 65% Expenses / 15% Investments</div>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Fine-tune adjustments */}
                  <div className="space-y-5 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                      <Percent className="h-5 w-5 mr-2 text-gray-600" />
                      Fine-tune Your Allocations
                    </h4>
                    
                    {/* Savings Input */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <div className="mb-3 sm:mb-0 sm:w-32 sm:mr-5 flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                            <PiggyBank className="h-4 w-4 text-indigo-600" />
                          </div>
                          <label className="text-base font-medium text-gray-700">Savings</label>
                        </div>
                        
                        <div className="flex-1 flex items-center">
                          <button 
                            onClick={() => handlePercentChange('savingsPercent', -5)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 h-10 w-10 rounded-l-md flex items-center justify-center"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <input
                            type="number"
                            value={formData.savingsPercent}
                            onChange={(e) => handleInputChange('savingsPercent', e.target.value)}
                            className="h-10 w-20 text-center border-y border-gray-300 p-0 font-medium"
                            min="0"
                            max="100"
                          />
                          
                          <button 
                            onClick={() => handlePercentChange('savingsPercent', 5)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 h-10 w-10 rounded-r-md flex items-center justify-center"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          
                          <div className="ml-4 text-base font-medium text-indigo-700 w-12">
                            {formData.savingsPercent}%
                          </div>
                          
                          <div 
                            className="ml-4 flex-1 h-4 bg-gray-200 rounded-full overflow-hidden"
                          >
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                              style={{ width: `${formData.savingsPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expenses Input */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <div className="mb-3 sm:mb-0 sm:w-32 sm:mr-5 flex items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                            <CreditCard className="h-4 w-4 text-purple-600" />
                          </div>
                          <label className="text-base font-medium text-gray-700">Expenses</label>
                        </div>
                        
                        <div className="flex-1 flex items-center">
                          <button 
                            onClick={() => handlePercentChange('expensesPercent', -5)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 h-10 w-10 rounded-l-md flex items-center justify-center"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <input
                            type="number"
                            value={formData.expensesPercent}
                            onChange={(e) => handleInputChange('expensesPercent', e.target.value)}
                            className="h-10 w-20 text-center border-y border-gray-300 p-0 font-medium"
                            min="0"
                            max="100"
                          />
                          
                          <button 
                            onClick={() => handlePercentChange('expensesPercent', 5)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 h-10 w-10 rounded-r-md flex items-center justify-center"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          
                          <div className="ml-4 text-base font-medium text-purple-700 w-12">
                            {formData.expensesPercent}%
                          </div>
                          
                          <div 
                            className="ml-4 flex-1 h-4 bg-gray-200 rounded-full overflow-hidden"
                          >
                            <div 
                              className="h-full bg-purple-500 rounded-full transition-all duration-300"
                              style={{ width: `${formData.expensesPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Investments Input */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <div className="mb-3 sm:mb-0 sm:w-32 sm:mr-5 flex items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                          </div>
                          <label className="text-base font-medium text-gray-700">Investments</label>
                        </div>
                        
                        <div className="flex-1 flex items-center">
                          <button 
                            onClick={() => handlePercentChange('investmentsPercent', -5)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 h-10 w-10 rounded-l-md flex items-center justify-center"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <input
                            type="number"
                            value={formData.investmentsPercent}
                            onChange={(e) => handleInputChange('investmentsPercent', e.target.value)}
                            className="h-10 w-20 text-center border-y border-gray-300 p-0 font-medium"
                            min="0"
                            max="100"
                          />
                          
                          <button 
                            onClick={() => handlePercentChange('investmentsPercent', 5)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 h-10 w-10 rounded-r-md flex items-center justify-center"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          
                          <div className="ml-4 text-base font-medium text-emerald-700 w-12">
                            {formData.investmentsPercent}%
                          </div>
                          
                          <div 
                            className="ml-4 flex-1 h-4 bg-gray-200 rounded-full overflow-hidden"
                          >
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${formData.investmentsPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Percentage allocation visualization */}
                  <div className="mt-6">
                    <h4 className="text-base font-medium text-gray-800 mb-3">Distribution Visualization</h4>
                    <div className="h-14 w-full rounded-xl overflow-hidden flex shadow-sm border border-gray-200">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-500 flex items-center justify-center" 
                        style={{ width: `${formData.savingsPercent}%` }}
                      >
                        {formData.savingsPercent >= 10 && (
                          <div className="text-white font-medium text-sm flex items-center">
                            <PiggyBank className="h-3 w-3 mr-1" /> {formData.savingsPercent}%
                          </div>
                        )}
                      </div>
                      <div 
                        className="h-full bg-purple-500 transition-all duration-500 flex items-center justify-center" 
                        style={{ width: `${formData.expensesPercent}%` }}
                      >
                        {formData.expensesPercent >= 10 && (
                          <div className="text-white font-medium text-sm flex items-center">
                            <CreditCard className="h-3 w-3 mr-1" /> {formData.expensesPercent}%
                          </div>
                        )}
                      </div>
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500 flex items-center justify-center" 
                        style={{ width: `${formData.investmentsPercent}%` }}
                      >
                        {formData.investmentsPercent >= 10 && (
                          <div className="text-white font-medium text-sm flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" /> {formData.investmentsPercent}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <div>Savings</div>
                      <div>Expenses</div>
                      <div>Investments</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => setStep(3)} 
                      disabled={totalPercent !== 100}
                      className={totalPercent === 100 ? "bg-indigo-600 hover:bg-indigo-700 transition-all" : ""}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-6">
                  <p className="mb-6 text-gray-700 text-center text-lg">
                    What would you like to do with any leftover money after your main income distribution?
                  </p>
                  
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <label htmlFor="leftoverAction" className="mb-3 block text-base font-medium text-gray-700">
                      Leftover Money Allocation
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <div 
                        className={`p-4 rounded-lg border ${formData.leftoverAction === 'savings' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'} cursor-pointer transition-all`}
                        onClick={() => setFormData({ ...formData, leftoverAction: 'savings' })}
                      >
                        <div className="flex items-center mb-2">
                          <div className={`w-5 h-5 rounded-full ${formData.leftoverAction === 'savings' ? 'bg-indigo-500' : 'bg-gray-200'} mr-2 flex items-center justify-center`}>
                            {formData.leftoverAction === 'savings' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className={`font-medium ${formData.leftoverAction === 'savings' ? 'text-indigo-700' : 'text-gray-700'}`}>Add to Savings</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <PiggyBank className={`h-8 w-8 ${formData.leftoverAction === 'savings' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 rounded-lg border ${formData.leftoverAction === 'expenses' ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-500' : 'bg-white border-gray-200 hover:bg-gray-50'} cursor-pointer transition-all`}
                        onClick={() => setFormData({ ...formData, leftoverAction: 'expenses' })}
                      >
                        <div className="flex items-center mb-2">
                          <div className={`w-5 h-5 rounded-full ${formData.leftoverAction === 'expenses' ? 'bg-purple-500' : 'bg-gray-200'} mr-2 flex items-center justify-center`}>
                            {formData.leftoverAction === 'expenses' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className={`font-medium ${formData.leftoverAction === 'expenses' ? 'text-purple-700' : 'text-gray-700'}`}>Add to Expenses</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <CreditCard className={`h-8 w-8 ${formData.leftoverAction === 'expenses' ? 'text-purple-600' : 'text-gray-400'}`} />
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 rounded-lg border ${formData.leftoverAction === 'investments' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500' : 'bg-white border-gray-200 hover:bg-gray-50'} cursor-pointer transition-all`}
                        onClick={() => setFormData({ ...formData, leftoverAction: 'investments' })}
                      >
                        <div className="flex items-center mb-2">
                          <div className={`w-5 h-5 rounded-full ${formData.leftoverAction === 'investments' ? 'bg-emerald-500' : 'bg-gray-200'} mr-2 flex items-center justify-center`}>
                            {formData.leftoverAction === 'investments' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className={`font-medium ${formData.leftoverAction === 'investments' ? 'text-emerald-700' : 'text-gray-700'}`}>Add to Investments</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <TrendingUp className={`h-8 w-8 ${formData.leftoverAction === 'investments' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 rounded-lg bg-yellow-50 p-4 border border-yellow-100">
                      <p className="text-sm text-yellow-700">
                        This setting determines where any remaining money goes after your income distribution. It's helpful when you have unexpected income or bonuses.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button 
                      onClick={handleSave}
                      loading={isSubmitting}
                      disabled={totalPercent !== 100 || isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700 transition-all"
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 