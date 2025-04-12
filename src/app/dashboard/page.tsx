'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PiggyBank, CreditCard, TrendingUp, ArrowLeftRight, DollarSign } from 'lucide-react';
import Link from 'next/link';
import api from '../utils/axios';
import { SetupModal } from '../components/SetupModal';
import { useToast } from '../../components/ui/toast';

export default function DashboardPage() {
  const { user, token, forceRefreshUser } = useAuth();
  const { addToast } = useToast();
  const [sectionData, setSectionData] = useState({
    savings: 0,
    expenses: 0,
    investments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Check if user needs to complete setup
  useEffect(() => {
     // Only proceed with the check if we have a user object
    if (user) {
      // Explicit null/undefined checks for each field
      const isSavingsPercentNull = user.savingsPercent === null || user.savingsPercent === undefined;
      const isExpensesPercentNull = user.expensesPercent === null || user.expensesPercent === undefined;
      const isInvestmentsPercentNull = user.investmentsPercent === null || user.investmentsPercent === undefined;
      const isLeftoverActionNull = user.leftoverAction === null || user.leftoverAction === undefined;
      
      // Check if ANY of the fields is null - if so, show the modal
      const needsSetup = isSavingsPercentNull || isExpensesPercentNull || isInvestmentsPercentNull || isLeftoverActionNull;
      
      // Set modal visibility based on whether setup is needed
      setShowSetupModal(needsSetup);
    } else {
      // Don't show modal if user is not loaded yet
      setShowSetupModal(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchSections = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        const response = await api.get('/sections');
        
        // Handle different possible response formats
        if (response.data) {
          setSectionData({
            savings: response.data.savings || 0,
            expenses: response.data.expenses || 0,
            investments: response.data.investments || 0
          });
        }
      } catch (err) {
        addToast('Error fetching financial data. Please try again later.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, [token, addToast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Dashboard cards for financial sections
  const sectionCards = [
    {
      title: 'Savings',
      amount: sectionData.savings,
      icon: <PiggyBank className="h-6 w-6 text-indigo-600" />,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-600',
      href: '/dashboard/savings',
      description: 'Current balance in your savings'
    },
    {
      title: 'Expenses',
      amount: sectionData.expenses,
      icon: <CreditCard className="h-6 w-6 text-purple-600" />,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      href: '/dashboard/expenses',
      description: 'Available for expenses'
    },
    {
      title: 'Investments',
      amount: sectionData.investments,
      icon: <TrendingUp className="h-6 w-6 text-emerald-600" />,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-600',
      href: '/dashboard/investments',
      description: 'Total investments value'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-6">Overview of your financial sections</p>

      {/* Setup Modal */}
      {showSetupModal && (
        <SetupModal 
          isOpen={showSetupModal} 
          onClose={() => {}} // Empty function to prevent closing
          onSetupComplete={async () => {
            // Force refresh user data after setup
            await forceRefreshUser();
            setShowSetupModal(false);
          }}
        />
      )}

      {/* Welcome card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome back, {user?.name || 'User'}!</h2>
        <p className="text-gray-600">
          {isLoading 
            ? 'Loading your financial summary...' 
            : `Here's an overview of your financial sections. Your total wealth is currently ${formatCurrency(sectionData.savings + sectionData.expenses + sectionData.investments)}.`
          }
        </p>
      </div>

      {/* Finance Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {sectionCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <div className={`rounded-xl border ${card.borderColor} ${card.bgColor} p-6 hover:shadow-md transition-shadow cursor-pointer h-full`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor} border ${card.borderColor}`}>
                  {card.icon}
                </div>
                <div className={`text-xl font-semibold ${card.textColor}`}>
                  {isLoading ? '...' : formatCurrency(card.amount)}
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-1">{card.title}</h3>
              <p className="text-gray-600 text-sm">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/income">
            <button className="flex items-center justify-center w-full p-3 border border-indigo-200 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
              <DollarSign className="w-5 h-5 mr-2" />
              <span>Add Income</span>
            </button>
          </Link>
          <Link href="/dashboard/expenses">
            <button className="flex items-center justify-center w-full p-3 border border-purple-200 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
              <CreditCard className="w-5 h-5 mr-2" />
              <span>Add Expense</span>
            </button>
          </Link>
          <Link href="/dashboard/investments">
            <button className="flex items-center justify-center w-full p-3 border border-emerald-200 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span>Add Investment</span>
            </button>
          </Link>
          <Link href="/dashboard/transactions">
            <button className="flex items-center justify-center w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
              <ArrowLeftRight className="w-5 h-5 mr-2" />
              <span>View Transactions</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 