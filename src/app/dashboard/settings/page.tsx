'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Percent, PiggyBank, CreditCard, TrendingUp, AlertCircle, X, Check, Info, Wallet, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { useToast } from '../../../components/ui/toast';

// Define types that match the UserData in AuthContext
type LeftoverActionType = 'savings' | 'expenses' | 'investments' | undefined;

interface SettingsForm {
  savingsPercent: number | undefined;
  expensesPercent: number | undefined;
  investmentsPercent: number | undefined;
  leftoverAction: LeftoverActionType;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user, updateUserProfile, forceRefreshUser, updateEmail, deleteAccount } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showMinimumDialog, setShowMinimumDialog] = useState(false);
  const [showMaximumDialog, setShowMaximumDialog] = useState(false);
  const [showIncomeDistributionDialog, setShowIncomeDistributionDialog] = useState(false);
  const [showLeftoverDialog, setShowLeftoverDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [attemptedField, setAttemptedField] = useState<string>('');
  const [attemptedValue, setAttemptedValue] = useState<number>(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<SettingsForm>({
    savingsPercent: undefined,
    expensesPercent: undefined,
    investmentsPercent: undefined,
    leftoverAction: undefined,
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Add state for email change
  const [newEmailForm, setNewEmailForm] = useState({
    email: '',
    isSubmitting: false
  });

  // Add state for account deletion
  const [deleteAccountModal, setDeleteAccountModal] = useState({
    isOpen: false,
    password: '',
    isSubmitting: false,
    error: ''
  });

  // Initialize form with user data when available
  useEffect(() => {
    if (user) {
      // Ensure each category has at least 10%
      let savingsPercent = user.savingsPercent || 0;
      let expensesPercent = user.expensesPercent || 0;
      let investmentsPercent = user.investmentsPercent || 0;
      
      // If any values are below 10%, set defaults
      if (savingsPercent < 10 || expensesPercent < 10 || investmentsPercent < 10) {
        // Set default balanced allocation
        savingsPercent = 30;
        expensesPercent = 40;
        investmentsPercent = 30;
      }
      
      setFormData({
        savingsPercent: savingsPercent,
        expensesPercent: expensesPercent,
        investmentsPercent: investmentsPercent,
        leftoverAction: user.leftoverAction,
      });
    } else {
      // Initialize with default values for new users
      setFormData({
        savingsPercent: 30,
        expensesPercent: 40,
        investmentsPercent: 30,
        leftoverAction: 'savings',
      });
    }
  }, [user]);

  // Add handler functions for email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEmailForm({
      ...newEmailForm,
      email: e.target.value
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmailForm.email) {
      addToast('Email cannot be empty', 'error');
      return;
    }
    
    setNewEmailForm({ ...newEmailForm, isSubmitting: true });
    
    try {
      await updateEmail(newEmailForm.email);
      // Force refresh user data to show the updated email
      await forceRefreshUser();
      addToast('Email updated. Please check your new email address to verify it.', 'success');
      setNewEmailForm({ email: '', isSubmitting: false });
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update email', 'error');
      setNewEmailForm({ ...newEmailForm, isSubmitting: false });
    }
  };

  // Add handler functions for account deletion
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deleteAccountModal.password) {
      setDeleteAccountModal({
        ...deleteAccountModal,
        error: 'Password is required to delete your account'
      });
      return;
    }
    
    setDeleteAccountModal({ ...deleteAccountModal, isSubmitting: true, error: '' });
    
    try {
      await deleteAccount(deleteAccountModal.password);
      // Will redirect automatically due to logout in authContext
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      setDeleteAccountModal({
        ...deleteAccountModal,
        isSubmitting: false,
        error: errorMessage
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'number' || type === 'range') {
      const numValue = value === '' ? 0 : Number(value);
      
      // Handle distribution percentages
      if (name === 'savingsPercent' || name === 'expensesPercent' || name === 'investmentsPercent') {
        // If trying to set to less than 10%, show dialog
        if (numValue < 10) {
          setAttemptedField(name);
          setAttemptedValue(numValue);
          setShowMinimumDialog(true);
          return;
        }
        
        // If trying to set above 80%, prevent it and show dialog
        if (numValue > 80) {
          setAttemptedField(name);
          setAttemptedValue(numValue);
          setShowMaximumDialog(true);
          return;
        }
        
        // Create a copy of the current form data
        const updatedFormData = { ...formData };
        
        // Determine active fields (fields with values > 0)
        const allFields = ['savingsPercent', 'expensesPercent', 'investmentsPercent'] as const;
        
        // Set the value for the current field
        if (name === 'savingsPercent') {
          updatedFormData.savingsPercent = numValue;
        } else if (name === 'expensesPercent') {
          updatedFormData.expensesPercent = numValue;
        } else if (name === 'investmentsPercent') {
          updatedFormData.investmentsPercent = numValue;
        }
        
        // Get all other fields that are not the current one being changed
        const otherFields = allFields.filter(field => field !== name);
        
        // Calculate remaining percentage after ensuring other fields have minimum 10%
        const otherFieldsMinimum = otherFields.length * 10;
        const maxForCurrentField = 100 - otherFieldsMinimum;
        
        // If user tries to set current field higher than possible while maintaining minimums
        if (numValue > maxForCurrentField) {
          setAttemptedField(name);
          setAttemptedValue(numValue);
          setShowMaximumDialog(true);
          return;
        }
        
        // Calculate how much is left to distribute beyond the minimum 10% for other fields
        const remainingToDistribute = 100 - numValue - otherFieldsMinimum;
        
        // Calculate the current proportions of other fields (beyond their minimum 10%)
        const otherFieldsCurrentValues = otherFields.map(field => Math.max((updatedFormData[field] || 0) - 10, 0));
        const otherFieldsCurrentTotal = otherFieldsCurrentValues.reduce((sum, val) => sum + val, 0);
        
        // Distribute the remaining percentage proportionally
        if (otherFieldsCurrentTotal > 0) {
          // Distribute proportionally
          otherFields.forEach((field, index) => {
            const proportion = otherFieldsCurrentValues[index] / otherFieldsCurrentTotal;
            const additionalValue = Math.round(remainingToDistribute * proportion);
            (updatedFormData[field] as number) = 10 + additionalValue;
          });
        } else {
          // If other fields are at minimum, distribute evenly
          const evenShare = Math.floor(remainingToDistribute / otherFields.length);
          otherFields.forEach((field, index) => {
            const isLast = index === otherFields.length - 1;
            const leftover = remainingToDistribute - (evenShare * otherFields.length);
            
            if (isLast) {
              (updatedFormData[field] as number) = 10 + evenShare + leftover;
            } else {
              (updatedFormData[field] as number) = 10 + evenShare;
            }
          });
        }
        
        // Final check to ensure total is exactly 100%
        const finalTotal = allFields.reduce((sum, field) => sum + (updatedFormData[field] || 0), 0);
        
        if (finalTotal !== 100) {
          const diff = 100 - finalTotal;
          // Find the field with the largest value that isn't the current field
          let largestOtherField = otherFields[0];
          let largestValue = updatedFormData[largestOtherField] || 0;
          
          for (const field of otherFields) {
            if ((updatedFormData[field] || 0) > largestValue) {
              largestOtherField = field;
              largestValue = updatedFormData[field] || 0;
            }
          }
          
          // Add the difference to the largest other field
          (updatedFormData[largestOtherField] as number) = (updatedFormData[largestOtherField] || 0) + diff;
        }
        
        setFormData(updatedFormData);
        return;
      }
      
      setFormData({
        ...formData,
        [name]: numValue,
      });
    } else if (name === 'leftoverAction') {
      setFormData({
        ...formData,
        leftoverAction: value === '' ? undefined : value as LeftoverActionType,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateForm = () => {
    // Validate percentages
    const savingsPercent = formData.savingsPercent ?? 0;
    const expensesPercent = formData.expensesPercent ?? 0;
    const investmentsPercent = formData.investmentsPercent ?? 0;
    
    // Check minimum values if any of them are non-zero
    if ((savingsPercent > 0 && savingsPercent < 10) || 
        (expensesPercent > 0 && expensesPercent < 10) || 
        (investmentsPercent > 0 && investmentsPercent < 10)) {
      addToast('Each distribution section must be at least 10% if specified', 'error');
      return false;
    }
    
    if (savingsPercent > 80 || expensesPercent > 80 || investmentsPercent > 80) {
      addToast('No category can exceed 80%', 'error');
      return false;
    }

    // Check if total percentages exceed 100%
    const total = savingsPercent + expensesPercent + investmentsPercent;
    if (total > 100) {
      addToast('Total percentages cannot exceed 100%', 'error');
      return false;
    }

    return true;
  };

  // Calculate total percentage for the progress bar
  const totalPercentage = ((formData.savingsPercent ?? 0) + 
                          (formData.expensesPercent ?? 0) + 
                          (formData.investmentsPercent ?? 0));

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
      {/* Income Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Income Distribution Setting Block */}
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => setShowIncomeDistributionDialog(true)}
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 flex items-center justify-center mr-3 shadow-sm">
                <Percent className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Income Distribution</h3>
                <p className="text-sm text-gray-500">Configure how your income is allocated</p>
              </div>
            </div>
            
            {/* Preview of current distribution */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Current Allocation</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  totalPercentage === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {totalPercentage}%
                </span>
              </div>
              
              {/* Mini progress bar */}
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden mb-3">
                <div className="flex h-full">
                  {formData.savingsPercent && formData.savingsPercent > 0 && (
                    <div 
                      className="bg-indigo-500 h-full" 
                      style={{ width: `${formData.savingsPercent}%` }}
                    ></div>
                  )}
                  {formData.expensesPercent && formData.expensesPercent > 0 && (
                    <div 
                      className="bg-purple-500 h-full" 
                      style={{ width: `${formData.expensesPercent}%` }}
                    ></div>
                  )}
                  {formData.investmentsPercent && formData.investmentsPercent > 0 && (
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={{ width: `${formData.investmentsPercent}%` }}
                    ></div>
                  )}
                </div>
              </div>
              
              {/* Mini legend for Income Distribution */}
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-sm bg-indigo-500 mr-1"></div>
                  <span className="text-gray-600">Savings: {formData.savingsPercent || 0}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-sm bg-purple-500 mr-1"></div>
                  <span className="text-gray-600">Expenses: {formData.expensesPercent || 0}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-sm bg-emerald-500 mr-1"></div>
                  <span className="text-gray-600">Investments: {formData.investmentsPercent || 0}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center mt-4 text-indigo-600 text-sm font-medium group-hover:underline">
              <span>Adjust Distribution</span>
              <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Leftover Action Setting Block */}
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => setShowLeftoverDialog(true)}
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 flex items-center justify-center mr-3 shadow-sm">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Leftover Allocation</h3>
                <p className="text-sm text-gray-500">Where to allocate remaining funds</p>
              </div>
            </div>
            
            {/* Preview of current leftover action */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Current Allocation</span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  formData.leftoverAction ? (
                    formData.leftoverAction === 'savings' ? 'bg-indigo-100 text-indigo-800' : 
                    formData.leftoverAction === 'expenses' ? 'bg-purple-100 text-purple-800' : 
                    'bg-emerald-100 text-emerald-800'
                  ) : 'bg-gray-100 text-gray-800'
                }`}>
                  {formData.leftoverAction ? 
                    formData.leftoverAction.charAt(0).toUpperCase() + formData.leftoverAction.slice(1) : 
                    'Not Set'}
                </div>
              </div>
              
              {/* Mock progress bar to visually match income distribution */}
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full ${
                    formData.leftoverAction === 'savings' ? 'bg-indigo-500' : 
                    formData.leftoverAction === 'expenses' ? 'bg-purple-500' : 
                    formData.leftoverAction === 'investments' ? 'bg-emerald-500' : 
                    'bg-gray-300'
                  }`} 
                  style={{ width: formData.leftoverAction ? '100%' : '0%' }}
                ></div>
              </div>
              
              {/* Mini legend for Leftover Action */}
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-sm ${
                    formData.leftoverAction === 'savings' ? 'bg-indigo-500' : 
                    formData.leftoverAction === 'expenses' ? 'bg-purple-500' : 
                    formData.leftoverAction === 'investments' ? 'bg-emerald-500' : 
                    'bg-gray-400'
                  } mr-1`}></div>
                  <span className="text-gray-600">
                    {formData.leftoverAction ? 
                      `Sending leftovers to ${formData.leftoverAction}` : 
                      'No allocation set'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center mt-4 text-blue-600 text-sm font-medium group-hover:underline">
              <span>Change Leftover Action</span>
              <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Password Change Block */}
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => setShowPasswordDialog(true)}
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mr-3 shadow-sm">
                <Lock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Security</h3>
                <p className="text-sm text-gray-500">Change your account password</p>
              </div>
            </div>
            
            {/* Preview of password security */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Password Status</span>
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Secured
                </div>
              </div>
              
              {/* Mock progress bar for visual consistency */}
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-purple-500 w-full"></div>
              </div>
              
              {/* Information */}
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-sm bg-purple-500 mr-1"></div>
                  <span className="text-gray-600">
                    Last updated: Never
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center mt-4 text-purple-600 text-sm font-medium group-hover:underline">
              <span>Change Password</span>
              <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Account Management Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-800">Account Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your account email and deletion options</p>
        </div>

        <div className="p-6 divide-y divide-gray-200">
          {/* Email Change Section */}
          <div className="pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Address</h3>
            
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changing your email will require verification of the new address. Your account will be marked as unverified until you complete this process.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 flex items-center p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-700">Current Email</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
              <div className="ml-auto">
                {user?.isEmailVerified ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unverified
                  </span>
                )}
              </div>
            </div>
            
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-4">
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-900">
                  New Email Address
                </label>
                <input
                  type="email"
                  name="newEmail"
                  id="newEmail"
                  value={newEmailForm.email}
                  onChange={handleEmailChange}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="new-email@example.com"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={newEmailForm.isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {newEmailForm.isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Email'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Deletion Section */}
          <div className="pt-6">
            <h3 className="text-lg font-medium text-red-600 mb-4">Delete Account</h3>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-100 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Danger Zone</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Deleting your account is permanent. All your data will be wiped from our system and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setDeleteAccountModal({ ...deleteAccountModal, isOpen: true })}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteAccountModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setDeleteAccountModal({ ...deleteAccountModal, isOpen: false, password: '', error: '' })}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Confirm Account Deletion</h3>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone. All of your data will be permanently deleted.
              </p>
            </div>
            
            <form onSubmit={handleDeleteAccount}>
              <div className="mb-4">
                <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700">
                  Enter your password to confirm
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input 
                    type={showCurrentPassword ? "text" : "password"}
                    name="deletePassword" 
                    id="deletePassword"
                    value={deleteAccountModal.password}
                    onChange={(e) => setDeleteAccountModal({ ...deleteAccountModal, password: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Your current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {deleteAccountModal.error && (
                  <p className="mt-2 text-sm text-red-600">{deleteAccountModal.error}</p>
                )}
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteAccountModal({ ...deleteAccountModal, isOpen: false, password: '', error: '' })}
                  className="inline-flex justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteAccountModal.isSubmitting}
                  className="inline-flex justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleteAccountModal.isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alerts/Dialogs */}
      {showIncomeDistributionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 flex items-center justify-center mr-3 shadow-sm">
                    <Percent className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Income Distribution</h3>
                </div>
                <button 
                  onClick={() => setShowIncomeDistributionDialog(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Set how your income is distributed across different financial categories.
                This configuration will be used for automatic allocation of your income.
              </p>
              
              {/* Distribution Progress Bar */}
              <div className="mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 flex items-center justify-center mr-3 shadow-sm">
                        <Percent className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Distribution Total</h3>
                        <p className="text-xs text-gray-500">Your financial allocation breakdown</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={`px-3 py-1 rounded-full flex items-center ${
                        totalPercentage > 100 
                          ? 'bg-red-100 text-red-800' 
                          : totalPercentage === 100 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        <span className="text-sm font-medium mr-1">
                          {totalPercentage}%
                        </span>
                        {totalPercentage > 100 && <AlertCircle className="h-3.5 w-3.5" />}
                        {totalPercentage === 100 && <Check className="h-3.5 w-3.5" />}
                        {totalPercentage < 100 && totalPercentage > 0 && <Info className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="relative">
                    <div className="h-8 w-full bg-gray-100 rounded-lg overflow-hidden shadow-inner mb-2 relative">
                      <div 
                        className="absolute inset-0 flex"
                        style={{ 
                          boxShadow: totalPercentage > 100 ? 'inset 0 0 0 2px rgba(220, 38, 38, 0.4)' : 
                                    totalPercentage === 100 ? 'inset 0 0 0 2px rgba(16, 185, 129, 0.4)' : 'none' 
                        }}
                      >
                        {formData.savingsPercent && formData.savingsPercent > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 relative group flex items-center justify-center transition-all duration-300"
                            style={{ width: `${Math.min(formData.savingsPercent, 100)}%` }}
                          >
                            {formData.savingsPercent >= 10 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20">
                                <div className="text-xs font-bold text-white flex items-center">
                                  <PiggyBank className="h-3 w-3 mr-1" />
                                  {formData.savingsPercent}%
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {formData.expensesPercent && formData.expensesPercent > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 relative group flex items-center justify-center transition-all duration-300"
                            style={{ width: `${Math.min(formData.expensesPercent, 100)}%` }}
                          >
                            {formData.expensesPercent >= 10 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20">
                                <div className="text-xs font-bold text-white flex items-center">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {formData.expensesPercent}%
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {formData.investmentsPercent && formData.investmentsPercent > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 relative group flex items-center justify-center transition-all duration-300"
                            style={{ width: `${Math.min(formData.investmentsPercent, 100)}%` }}
                          >
                            {formData.investmentsPercent >= 10 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20">
                                <div className="text-xs font-bold text-white flex items-center">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {formData.investmentsPercent}%
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Mark at 100% */}
                      {totalPercentage != 100 && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-300 right-0 flex items-center justify-center">
                          <div className="absolute right-0 transform translate-x-1/2 bg-white text-[10px] text-gray-500 px-1 rounded border border-gray-200 shadow-sm">
                            100%
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Category Legend */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      {formData.savingsPercent && formData.savingsPercent > 0 && (
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-500 to-indigo-500 mr-1"></div>
                          <span className="text-xs text-gray-600">Savings: {formData.savingsPercent}%</span>
                        </div>
                      )}
                      {formData.expensesPercent && formData.expensesPercent > 0 && (
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-purple-500 to-pink-500 mr-1"></div>
                          <span className="text-xs text-gray-600">Expenses: {formData.expensesPercent}%</span>
                        </div>
                      )}
                      {formData.investmentsPercent && formData.investmentsPercent > 0 && (
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-500 to-teal-500 mr-1"></div>
                          <span className="text-xs text-gray-600">Investments: {formData.investmentsPercent}%</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status message */}
                    {totalPercentage > 100 ? (
                      <div className="flex items-center text-red-600 text-xs mt-1">
                        <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                        <span>Total exceeds 100%. Please adjust your allocation.</span>
                      </div>
                    ) : totalPercentage === 100 ? (
                      <div className="flex items-center text-emerald-600 text-xs mt-1">
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        <span>Perfect! Your allocation is balanced at exactly 100%.</span>
                      </div>
                    ) : totalPercentage > 0 ? (
                      <div className="flex items-center text-amber-600 text-xs mt-1">
                        <Info className="h-3.5 w-3.5 mr-1.5" />
                        <span>Your allocation will automatically adjust to reach 100%.</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-blue-600 text-xs mt-1">
                        <Info className="h-3.5 w-3.5 mr-1.5" />
                        <span>Set your desired allocation percentages using the sliders below.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Distribution Presets */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Distribution Presets</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        savingsPercent: 30,
                        expensesPercent: 50,
                        investmentsPercent: 20
                      });
                    }}
                    className="py-3 px-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-sm font-medium text-indigo-700 rounded-lg border border-indigo-100 transition-colors shadow-sm flex flex-col items-center"
                  >
                    <span className="font-bold">Balanced</span>
                    <span className="text-xs mt-1 text-gray-600">30/50/20</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        savingsPercent: 40,
                        expensesPercent: 45,
                        investmentsPercent: 15
                      });
                    }}
                    className="py-3 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-sm font-medium text-blue-700 rounded-lg border border-blue-100 transition-colors shadow-sm flex flex-col items-center"
                  >
                    <span className="font-bold">Savings</span>
                    <span className="text-xs mt-1 text-gray-600">40/45/15</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        savingsPercent: 20,
                        expensesPercent: 45,
                        investmentsPercent: 35
                      });
                    }}
                    className="py-3 px-4 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-sm font-medium text-emerald-700 rounded-lg border border-emerald-100 transition-colors shadow-sm flex flex-col items-center"
                  >
                    <span className="font-bold">Growth</span>
                    <span className="text-xs mt-1 text-gray-600">20/45/35</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        savingsPercent: 20,
                        expensesPercent: 65,
                        investmentsPercent: 15
                      });
                    }}
                    className="py-3 px-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-sm font-medium text-purple-700 rounded-lg border border-purple-100 transition-colors shadow-sm flex flex-col items-center"
                  >
                    <span className="font-bold">Expenses</span>
                    <span className="text-xs mt-1 text-gray-600">20/65/15</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-8">
                {/* Savings Percent Field */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <PiggyBank className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <label htmlFor="savingsPercent" className="block text-sm font-medium text-gray-700">
                          Savings
                        </label>
                        <p className="text-xs text-gray-500">Long-term emergency fund</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button 
                        type="button"
                        onClick={() => {
                          const newValue = Math.max(0, (formData.savingsPercent || 0) - 5);
                          if (newValue < 10) {
                            setAttemptedField('savingsPercent');
                            setAttemptedValue(newValue);
                            setShowMinimumDialog(true);
                          } else {
                            setFormData({...formData, savingsPercent: newValue});
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        <span className="text-lg font-bold">-</span>
                      </button>
                      <span className="text-2xl font-bold text-indigo-700 w-16 text-center">{formData.savingsPercent ?? 0}%</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const newValue = Math.min(100, (formData.savingsPercent || 0) + 5);
                          if (newValue > 80) {
                            setAttemptedField('savingsPercent');
                            setAttemptedValue(newValue);
                            setShowMaximumDialog(true);
                          } else {
                            setFormData({...formData, savingsPercent: newValue});
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-indigo-100 rounded-full text-indigo-500 hover:bg-indigo-200 transition-colors"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    name="savingsPercent"
                    id="savingsPercent"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.savingsPercent ?? 0}
                    onChange={handleChange}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-indigo-200"
                    style={{
                      backgroundImage: `linear-gradient(to right, #6366f1 0%, #6366f1 ${formData.savingsPercent ?? 0}%, #cbd5e1 ${formData.savingsPercent ?? 0}%)`,
                    }}
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                {/* Expenses Percent Field */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <label htmlFor="expensesPercent" className="block text-sm font-medium text-gray-700">
                          Expenses
                        </label>
                        <p className="text-xs text-gray-500">Regular monthly spending</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button 
                        type="button"
                        onClick={() => {
                          const newValue = Math.max(0, (formData.expensesPercent || 0) - 5);
                          if (newValue < 10) {
                            setAttemptedField('expensesPercent');
                            setAttemptedValue(newValue);
                            setShowMinimumDialog(true);
                          } else {
                            setFormData({...formData, expensesPercent: newValue});
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        <span className="text-lg font-bold">-</span>
                      </button>
                      <span className="text-2xl font-bold text-purple-700 w-16 text-center">{formData.expensesPercent ?? 0}%</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const newValue = Math.min(100, (formData.expensesPercent || 0) + 5);
                          if (newValue > 80) {
                            setAttemptedField('expensesPercent');
                            setAttemptedValue(newValue);
                            setShowMaximumDialog(true);
                          } else {
                            setFormData({...formData, expensesPercent: newValue});
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full text-purple-500 hover:bg-purple-200 transition-colors"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    name="expensesPercent"
                    id="expensesPercent"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.expensesPercent ?? 0}
                    onChange={handleChange}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-purple-200"
                    style={{
                      backgroundImage: `linear-gradient(to right, #9333ea 0%, #9333ea ${formData.expensesPercent ?? 0}%, #cbd5e1 ${formData.expensesPercent ?? 0}%)`,
                    }}
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                {/* Investments Percent Field */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-lg border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <label htmlFor="investmentsPercent" className="block text-sm font-medium text-gray-700">
                          Investments
                        </label>
                        <p className="text-xs text-gray-500">Future growth portfolio</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button 
                        type="button"
                        onClick={() => {
                          const newValue = Math.max(0, (formData.investmentsPercent || 0) - 5);
                          if (newValue < 10) {
                            setAttemptedField('investmentsPercent');
                            setAttemptedValue(newValue);
                            setShowMinimumDialog(true);
                          } else {
                            setFormData({...formData, investmentsPercent: newValue});
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        <span className="text-lg font-bold">-</span>
                      </button>
                      <span className="text-2xl font-bold text-emerald-700 w-16 text-center">{formData.investmentsPercent ?? 0}%</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const newValue = Math.min(100, (formData.investmentsPercent || 0) + 5);
                          if (newValue > 80) {
                            setAttemptedField('investmentsPercent');
                            setAttemptedValue(newValue);
                            setShowMaximumDialog(true);
                          } else {
                            setFormData({...formData, investmentsPercent: newValue});
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-emerald-100 rounded-full text-emerald-500 hover:bg-emerald-200 transition-colors"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    name="investmentsPercent"
                    id="investmentsPercent"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.investmentsPercent ?? 0}
                    onChange={handleChange}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-emerald-200"
                    style={{
                      backgroundImage: `linear-gradient(to right, #10b981 0%, #10b981 ${formData.investmentsPercent ?? 0}%, #cbd5e1 ${formData.investmentsPercent ?? 0}%)`,
                    }}
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
              <button
                onClick={() => setShowIncomeDistributionDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  if (!validateForm()) {
                    return;
                  }
                  
                  setIsLoading(true);
                  
                  try {
                    // Prepare update data for percentages only
                    const updateData = {
                      savingsPercent: formData.savingsPercent ?? 30,
                      expensesPercent: formData.expensesPercent ?? 40,
                      investmentsPercent: formData.investmentsPercent ?? 30
                    };
                    
                    await updateUserProfile(updateData);
                    addToast('Income distribution updated successfully', 'success');
                    setShowIncomeDistributionDialog(false);
                  } catch (err) {
                    addToast(err instanceof Error ? err.message : 'Failed to update income distribution', 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leftover Action Dialog */}
      {showLeftoverDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 flex items-center justify-center mr-3 shadow-sm">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Leftover Allocation</h3>
                </div>
                <button 
                  onClick={() => setShowLeftoverDialog(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Choose where to allocate leftover money when you have extra income beyond your specified allocations.
              </p>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 flex items-center justify-center mr-3 shadow-sm">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Leftover Destination</h3>
                      <p className="text-xs text-gray-500">Where your extra funds will go</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full flex items-center ${
                      formData.leftoverAction === 'savings' ? 'bg-indigo-100 text-indigo-800' : 
                      formData.leftoverAction === 'expenses' ? 'bg-purple-100 text-purple-800' : 
                      formData.leftoverAction === 'investments' ? 'bg-emerald-100 text-emerald-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.leftoverAction === 'savings' && <PiggyBank className="h-3.5 w-3.5 mr-1" />}
                      {formData.leftoverAction === 'expenses' && <CreditCard className="h-3.5 w-3.5 mr-1" />}
                      {formData.leftoverAction === 'investments' && <TrendingUp className="h-3.5 w-3.5 mr-1" />}
                      <span className="text-sm font-medium">
                        {formData.leftoverAction ? 
                          formData.leftoverAction.charAt(0).toUpperCase() + formData.leftoverAction.slice(1) : 
                          'Not Set'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 shadow-sm">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      When your income exceeds your planned allocations, 
                      the excess funds will be allocated to your chosen category.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  type="button"
                  className={`relative flex flex-col items-center p-5 rounded-lg border ${formData.leftoverAction === 'savings' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'} transition-colors h-full`}
                  onClick={() => setFormData({...formData, leftoverAction: 'savings'})}
                >
                  <div className="absolute top-3 right-3">
                    <div className={`w-5 h-5 rounded-full ${formData.leftoverAction === 'savings' ? 'bg-indigo-500' : 'bg-gray-200'} flex items-center justify-center`}>
                      {formData.leftoverAction === 'savings' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${formData.leftoverAction === 'savings' ? 'bg-indigo-100' : 'bg-gray-100'} flex items-center justify-center mb-3`}>
                    <PiggyBank className={`h-6 w-6 ${formData.leftoverAction === 'savings' ? 'text-indigo-600' : 'text-gray-500'}`} />
                  </div>
                  <h4 className={`text-base font-medium ${formData.leftoverAction === 'savings' ? 'text-indigo-900' : 'text-gray-900'} mb-1`}>
                    Savings
                  </h4>
                  <p className={`text-xs text-center ${formData.leftoverAction === 'savings' ? 'text-indigo-700' : 'text-gray-500'}`}>
                    Add leftover funds to your savings for emergencies
                  </p>
                </button>
                
                <button
                  type="button"
                  className={`relative flex flex-col items-center p-5 rounded-lg border ${formData.leftoverAction === 'expenses' ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-500' : 'bg-white border-gray-200 hover:bg-gray-50'} transition-colors h-full`}
                  onClick={() => setFormData({...formData, leftoverAction: 'expenses'})}
                >
                  <div className="absolute top-3 right-3">
                    <div className={`w-5 h-5 rounded-full ${formData.leftoverAction === 'expenses' ? 'bg-purple-500' : 'bg-gray-200'} flex items-center justify-center`}>
                      {formData.leftoverAction === 'expenses' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${formData.leftoverAction === 'expenses' ? 'bg-purple-100' : 'bg-gray-100'} flex items-center justify-center mb-3`}>
                    <CreditCard className={`h-6 w-6 ${formData.leftoverAction === 'expenses' ? 'text-purple-600' : 'text-gray-500'}`} />
                  </div>
                  <h4 className={`text-base font-medium ${formData.leftoverAction === 'expenses' ? 'text-purple-900' : 'text-gray-900'} mb-1`}>
                    Expenses
                  </h4>
                  <p className={`text-xs text-center ${formData.leftoverAction === 'expenses' ? 'text-purple-700' : 'text-gray-500'}`}>
                    Allocate leftovers to your monthly expenses
                  </p>
                </button>
                
                <button
                  type="button"
                  className={`relative flex flex-col items-center p-5 rounded-lg border ${formData.leftoverAction === 'investments' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500' : 'bg-white border-gray-200 hover:bg-gray-50'} transition-colors h-full`}
                  onClick={() => setFormData({...formData, leftoverAction: 'investments'})}
                >
                  <div className="absolute top-3 right-3">
                    <div className={`w-5 h-5 rounded-full ${formData.leftoverAction === 'investments' ? 'bg-emerald-500' : 'bg-gray-200'} flex items-center justify-center`}>
                      {formData.leftoverAction === 'investments' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${formData.leftoverAction === 'investments' ? 'bg-emerald-100' : 'bg-gray-100'} flex items-center justify-center mb-3`}>
                    <TrendingUp className={`h-6 w-6 ${formData.leftoverAction === 'investments' ? 'text-emerald-600' : 'text-gray-500'}`} />
                  </div>
                  <h4 className={`text-base font-medium ${formData.leftoverAction === 'investments' ? 'text-emerald-900' : 'text-gray-900'} mb-1`}>
                    Investments
                  </h4>
                  <p className={`text-xs text-center ${formData.leftoverAction === 'investments' ? 'text-emerald-700' : 'text-gray-500'}`}>
                    Direct leftovers to investments for growth
                  </p>
                </button>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
              <button
                onClick={() => setShowLeftoverDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!formData.leftoverAction) {
                    addToast('Please select a leftover action', 'error');
                    return;
                  }
                  
                  setIsLoading(true);
                  
                  try {
                    await updateUserProfile({
                      leftoverAction: formData.leftoverAction
                    });
                    addToast('Leftover allocation updated successfully', 'success');
                    setShowLeftoverDialog(false);
                  } catch (err) {
                    addToast(err instanceof Error ? err.message : 'Failed to update leftover allocation', 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimum Percentage Dialog */}
      {showMinimumDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-amber-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Minimum Value Required</h3>
              </div>
              <button 
                onClick={() => setShowMinimumDialog(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-5">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200 mb-4 shadow-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3 shadow-sm">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      You tried to set {attemptedField.replace('Percent', '')} to {attemptedValue}%
                    </p>
                    <p className="text-xs text-amber-700 mt-1">Active categories must be at least 10%</p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                For effective financial planning, each active category requires a minimum allocation of 10%.
              </p>
              
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 mb-4 shadow-sm">
                <h4 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-indigo-600" />
                  Why the 10% minimum matters:
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Meaningful impact:</strong> Allocations below 10% often don't make a significant difference to your financial goals</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Balanced approach:</strong> The 10% rule ensures a meaningful distribution across your financial priorities</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Total remains 100%:</strong> Your total allocation will always equal exactly 100%</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 shadow-sm">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-600" />
                  What are your options?
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  You can either set this category to the minimum 10% (recommended) or deactivate it completely by setting other categories.
                </p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setShowMinimumDialog(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Create a copy of current form data
                  const updatedFormData = { ...formData };
                  
                  // Set the attempted field to 10% minimum
                  (updatedFormData[attemptedField as keyof SettingsForm] as number) = 10;
                  
                  // Get all fields
                  const allFields = ['savingsPercent', 'expensesPercent', 'investmentsPercent'] as const;
                  
                  // Get other fields that need to be adjusted
                  const otherFields = allFields.filter(field => field !== attemptedField);
                  
                  // We need to distribute the remaining 90% between the other two fields
                  
                  // Calculate the current values of the other fields
                  const otherFieldsCurrentValues = otherFields.map(field => 
                    Math.max((updatedFormData[field] || 0), 10)
                  );
                  
                  // Calculate the current proportions of the other fields
                  const otherFieldsTotal = otherFieldsCurrentValues.reduce((sum, val) => sum + val, 0);
                  
                  // If the other fields have the same value
                  if (otherFieldsCurrentValues[0] === otherFieldsCurrentValues[1]) {
                    // Distribute the remaining 90% equally
                    otherFields.forEach(field => {
                      (updatedFormData[field] as number) = 45; // 90% ÷ 2 = 45%
                    });
                  } else {
                    // Distribute proportionally
                    const remainingPercentage = 90; // 100% - 10% set for the main field
                    const proportions = otherFieldsCurrentValues.map(val => val / otherFieldsTotal);
                    
                    otherFields.forEach((field, index) => {
                      const newValue = Math.round(remainingPercentage * proportions[index]);
                      (updatedFormData[field] as number) = newValue;
                    });
                    
                    // Ensure total is exactly 100%
                    const totalAfterAdjustment = allFields.reduce((sum, field) => 
                      sum + (updatedFormData[field] || 0), 0
                    );
                    
                    if (totalAfterAdjustment !== 100) {
                      const diff = 100 - totalAfterAdjustment;
                      // Apply the difference to the field with larger allocation
                      const fieldToAdjust = otherFieldsCurrentValues[0] > otherFieldsCurrentValues[1] ? 
                        otherFields[0] : otherFields[1];
                      (updatedFormData[fieldToAdjust] as number) = 
                        (updatedFormData[fieldToAdjust] as number) + diff;
                    }
                  }
                  
                  setFormData(updatedFormData);
                  setShowMinimumDialog(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm font-medium flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Set to 10% minimum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maximum Percentage Dialog */}
      {showMaximumDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-purple-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Maximum Value Limit</h3>
              </div>
              <button 
                onClick={() => setShowMaximumDialog(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-5">
              <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg p-4 border border-purple-200 mb-4 shadow-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 shadow-sm">
                    <AlertCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">
                      You tried to set {attemptedField.replace('Percent', '')} to {attemptedValue}%
                    </p>
                    <p className="text-xs text-purple-700 mt-1">Categories cannot exceed 80%</p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                To maintain balance in your financial allocation, no single category can exceed 80%.
              </p>
              
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 mb-4 shadow-sm">
                <h4 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-indigo-600" />
                  Why the 80% maximum matters:
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Balanced approach:</strong> Diversifying your allocation promotes financial stability</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Minimum thresholds:</strong> Other categories must maintain at least 10% each</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Total always 100%:</strong> Your allocation will automatically adjust to maintain a 100% total</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setShowMaximumDialog(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Create a copy of current form data
                  const updatedFormData = { ...formData };
                  
                  // Set the attempted field to 80%
                  (updatedFormData[attemptedField as keyof SettingsForm] as number) = 80;
                  
                  // Get all fields
                  const allFields = ['savingsPercent', 'expensesPercent', 'investmentsPercent'] as const;
                  
                  // Get other fields that need to be adjusted
                  const otherFields = allFields.filter(field => field !== attemptedField);
                  
                  // Since we set one field to 80%, the remaining 20% must be divided between the other two fields
                  // Each must have at least 10%, which totals to exactly 20% minimum
                  
                  // Calculate the current values of the other fields
                  const otherFieldsCurrentValues = otherFields.map(field => 
                    Math.max((updatedFormData[field] || 0), 10)
                  );
                  
                  // Calculate the current proportions of the other fields
                  const otherFieldsTotal = otherFieldsCurrentValues.reduce((sum, val) => sum + val, 0);
                  
                  // If the other fields have the same value or are both at minimum
                  if (otherFieldsCurrentValues[0] === otherFieldsCurrentValues[1] || otherFieldsTotal <= 20) {
                    // Distribute the remaining 20% equally
                    otherFields.forEach(field => {
                      (updatedFormData[field] as number) = 10;
                    });
                  } else {
                    // Distribute proportionally while respecting the 10% minimum
                    const remainingPercentage = 20; // 100% - 80% set for the main field
                    const proportions = otherFieldsCurrentValues.map(val => val / otherFieldsTotal);
                    
                    otherFields.forEach((field, index) => {
                      let newValue = Math.round(remainingPercentage * proportions[index]);
                      // Ensure minimum 10%
                      newValue = Math.max(10, newValue);
                      (updatedFormData[field] as number) = newValue;
                    });
                    
                    // Ensure total is exactly 100%
                    const totalAfterAdjustment = allFields.reduce((sum, field) => 
                      sum + (updatedFormData[field] || 0), 0
                    );
                    
                    if (totalAfterAdjustment !== 100) {
                      const diff = 100 - totalAfterAdjustment;
                      // Apply the difference to the field with larger allocation
                      const fieldToAdjust = otherFieldsCurrentValues[0] > otherFieldsCurrentValues[1] ? 
                        otherFields[0] : otherFields[1];
                      (updatedFormData[fieldToAdjust] as number) = 
                        (updatedFormData[fieldToAdjust] as number) + diff;
                    }
                  }
                  
                  setFormData(updatedFormData);
                  setShowMaximumDialog(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Set to 80% maximum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mr-3 shadow-sm">
                    <Lock className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Change Password</h3>
                </div>
                <button 
                  onClick={() => setShowPasswordDialog(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Update your password to keep your account secure. A strong password helps protect your personal and financial information.
              </p>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mr-3 shadow-sm">
                      <Lock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Password Security</h3>
                      <p className="text-xs text-gray-500">Strong passwords are essential for account protection</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 shadow-sm">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-purple-700">
                      Use a mix of letters, numbers, and symbols. Avoid using personal information or common passwords.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Current Password Field */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="block w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                {/* New Password Field */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="block w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Create a new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="block w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
              <button
                onClick={() => setShowPasswordDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Validate passwords
                  if (!passwordForm.currentPassword) {
                    addToast('Current password is required', 'error');
                    return;
                  }
                  
                  if (!passwordForm.newPassword) {
                    addToast('New password is required', 'error');
                    return;
                  }
                  
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    addToast('New passwords do not match', 'error');
                    return;
                  }
                  
                  setIsLoading(true);
                  
                  try {
                    await updateUserProfile({
                      currentPassword: passwordForm.currentPassword,
                      password: passwordForm.newPassword
                    } as any); // Use type assertion to bypass type checking
                    
                    // Reset the form
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    
                    addToast('Password updated successfully', 'success');
                    setShowPasswordDialog(false);
                  } catch (err) {
                    addToast(err instanceof Error ? err.message : 'Failed to update password', 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 