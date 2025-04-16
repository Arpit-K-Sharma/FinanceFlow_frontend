'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { ArrowRight, X } from 'lucide-react';
import api from '../utils/axios';
import { useToast } from '../../components/ui/toast';

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fromSection: string;
  availableAmount: number;
  onTransferComplete: () => void;
}

export const TransferDialog = ({
  isOpen,
  onClose,
  fromSection,
  availableAmount,
  onTransferComplete
}: TransferDialogProps) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferData, setTransferData] = useState({
    amount: '',
    toSection: '',
    description: ''
  });

  // Set an appropriate default toSection based on fromSection
  useEffect(() => {
    if (isOpen) {
      // Set default toSection that's different from fromSection
      let defaultToSection = '';
      
      if (fromSection === 'savings') {
        defaultToSection = 'expenses';
      } else if (fromSection === 'expenses') {
        defaultToSection = 'savings';
      } else if (fromSection === 'investments') {
        defaultToSection = 'savings';
      }
      
      setTransferData(prev => ({
        ...prev,
        toSection: defaultToSection
      }));
    }
  }, [isOpen, fromSection]);

  // Skip rendering if not open
  if (!isOpen) return null;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferData.amount || parseFloat(transferData.amount) <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }

    if (parseFloat(transferData.amount) > availableAmount) {
      addToast(`Transfer amount cannot exceed available ${fromSection} balance`, 'error');
      return;
    }

    if (transferData.toSection === fromSection) {
      addToast('Cannot transfer to the same section', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await api.post('/transactions', {
        type: 'manual',
        fromSection: fromSection,
        toSection: transferData.toSection,
        amount: parseFloat(transferData.amount),
        description: transferData.description || `Transfer from ${fromSection} to ${transferData.toSection}`
      });

      addToast(`Successfully transferred ${formatCurrency(parseFloat(transferData.amount))} to ${transferData.toSection}`, 'success');
      
      setTransferData({
        amount: '',
        toSection: '',
        description: ''
      });
      
      onTransferComplete();
      onClose();
    } catch (err) {
      addToast('Failed to transfer funds. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Transfer from {fromSection.charAt(0).toUpperCase() + fromSection.slice(1)}
        </h2>
        
        <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Available Balance:</span>
            <span className="text-lg font-semibold text-indigo-700">
              {formatCurrency(availableAmount)}
            </span>
          </div>
        </div>
        
        <form onSubmit={handleTransfer}>
          <div className="space-y-4">
            <Input
              label="Amount"
              type="number"
              value={transferData.amount}
              onChange={(value) => setTransferData({ ...transferData, amount: value })}
              required
              placeholder="0.00"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer To
              </label>
              <select
                value={transferData.toSection}
                onChange={(e) => setTransferData({ ...transferData, toSection: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
              >
                <option value="" disabled>Select a section</option>
                {fromSection !== 'savings' && <option value="savings">Savings</option>}
                {fromSection !== 'expenses' && <option value="expenses">Expenses</option>}
                {fromSection !== 'investments' && <option value="investments">Investments</option>}
              </select>
            </div>
            
            <Input
              label="Description (Optional)"
              type="text"
              value={transferData.description}
              onChange={(value) => setTransferData({ ...transferData, description: value })}
              placeholder="Reason for transfer"
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isSubmitting}
                className="flex items-center justify-center"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                Transfer Funds
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}; 