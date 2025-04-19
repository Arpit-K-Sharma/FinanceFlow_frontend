'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  PiggyBank, 
  CreditCard, 
  TrendingUp, 
  ArrowLeftRight, 
  DollarSign,
  BarChart4,
  LayoutDashboard,
  AlertCircle,
  ChevronRight,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  FilterIcon,
  Calendar,
  ShieldCheck,
  Activity,
  Wallet,
  Shield,
  TrendingDown,
  Info
} from 'lucide-react';
import Link from 'next/link';
import api from '../utils/axios';
import { SetupModal } from '../components/SetupModal';
import { useToast } from '../../components/ui/toast';
import { Button } from '../components/Button';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar, Tooltip as RechartsTooltip } from 'recharts';

// Define interface for SavingGoal
interface SavingGoal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  transferType: string;
  createdAt: string;
  updatedAt: string;
}

// Update the Transaction interface to include fromSection and toSection
interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  fromSection?: string;
  toSection?: string;
}

// Update the SectionData interface to include total and income
interface SectionData {
  savings: number;
  expenses: number;
  investments: number;
  total: number;
  income: number;
}

// Define the Insight interface to match our implementation
interface Insight {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

export default function DashboardPage() {
  const { user, token, forceRefreshUser } = useAuth();
  const { addToast } = useToast();
  const [sectionData, setSectionData] = useState<SectionData>({
    savings: 0,
    expenses: 0,
    investments: 0,
    total: 0,
    income: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [savingGoalsData, setSavingGoalsData] = useState<SavingGoal[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [savingGoalsLoading, setSavingGoalsLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [expenseTimeframe, setExpenseTimeframe] = useState<'month' | 'year'>('month');
  const [expenseChartData, setExpenseChartData] = useState<any[]>([]);
  const [showInsightDetails, setShowInsightDetails] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [hasExpensesForTimeframe, setHasExpensesForTimeframe] = useState(false);

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

  // Calculate total balance whenever section data changes
  useEffect(() => {
    const total = sectionData.savings + sectionData.expenses + sectionData.investments;
    setTotalBalance(total);
  }, [sectionData]);

  // Fetch sections data
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
            investments: response.data.investments || 0,
            total: response.data.total || 0,
            income: response.data.income || 0
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

  // Fetch recent transactions
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!token) return;
      
      try {
        setTransactionsLoading(true);
        const response = await api.get('/transactions?limit=5');
        
        if (response.data && response.data.data) {
          setRecentTransactions(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, [token]);

  // Fetch saving goals
  useEffect(() => {
    const fetchSavingGoals = async () => {
      if (!token) return;
      
      try {
        setSavingGoalsLoading(true);
        const response = await api.get('/saving-goals?limit=3');
        
        if (response.data && response.data.data) {
          setSavingGoalsData(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching saving goals:', err);
      } finally {
        setSavingGoalsLoading(false);
      }
    };

    fetchSavingGoals();
  }, [token]);

  // Fetch monthly income
  useEffect(() => {
    const fetchMonthlyIncome = async () => {
      if (!token) return;
      
      try {
        const response = await api.get('/income/available');
        
        if (response.data && response.data.data !== undefined) {
          setMonthlyIncome(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching monthly income:', err);
      }
    };

    fetchMonthlyIncome();
  }, [token]);

  // Add a new effect to fetch expense data
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!token) return;
      
      try {
        setExpensesLoading(true);
        const response = await api.get('/expenses');
        
        if (response.data && response.data.data) {
          setExpenses(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching expenses:', err);
      } finally {
        setExpensesLoading(false);
      }
    };

    fetchExpenses();
  }, [token]);

  // Update the expense data processing function to check if expenses exist
  useEffect(() => {
    const processExpenseData = () => {
      if (!expenses || expenses.length === 0) {
        setHasExpensesForTimeframe(false);
        return;
      }
      
      let hasDataForTimeframe = false;
      
      if (expenseTimeframe === 'month') {
        // Group by day for current month
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Create an array for all days in month with 0 amounts
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          amount: 0
        }));
        
        // Add actual expense amounts
        expenses.forEach((expense) => {
          const date = new Date(expense.createdAt);
          // Only include expenses from current month
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            hasDataForTimeframe = true;
            const day = date.getDate();
            const index = dailyData.findIndex(item => item.day === day);
            if (index !== -1) {
              dailyData[index].amount += expense.amount;
            }
          }
        });
        
        setExpenseChartData(dailyData);
      } else {
        // Group by month for current year
        const currentYear = new Date().getFullYear();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Create an array for all months with 0 amounts
        const monthlyData = months.map((month, index) => ({
          month,
          amount: 0
        }));
        
        // Add actual expense amounts
        expenses.forEach((expense) => {
          const date = new Date(expense.createdAt);
          // Only include expenses from current year
          if (date.getFullYear() === currentYear) {
            hasDataForTimeframe = true;
            const month = date.getMonth();
            monthlyData[month].amount += expense.amount;
          }
        });
        
        setExpenseChartData(monthlyData);
      }
      
      setHasExpensesForTimeframe(hasDataForTimeframe);
    };
    
    // Process data whenever expenses change or timeframe changes
    processExpenseData();
  }, [expenses, expenseTimeframe]);

  // Dummy data generation function - commented but kept for demo purposes
  // Uncomment this function and modify the useEffect above to use it when showing to clients
  /*
  const generateDummyExpenseData = (timeframe: string) => {
    let data = [];
    
    if (timeframe === 'month') {
      // Daily data for current month
      const daysInMonth = 30;
      for (let i = 1; i <= daysInMonth; i++) {
        data.push({
          day: i,
          amount: Math.floor(Math.random() * 200) + 20
        });
      }
    } else {
      // Monthly data for year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        data.push({
          month: months[i],
          amount: Math.floor(Math.random() * 2000) + 500
        });
      }
    }
    
    setExpenseChartData(data);
  };
  */

  // To use dummy data, update the useEffect block to:
  /*
  useEffect(() => {
    // For demo purposes - generate dummy data
    generateDummyExpenseData(expenseTimeframe);
  }, [expenseTimeframe]);
  */

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate allocation percentages
  const getAllocationPercentage = (amount: number) => {
    if (totalBalance === 0) return 0;
    return Math.round((amount / totalBalance) * 100);
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

  // Update getInsights function to generate relevant financial insights
  const getInsights = (): Insight[] => {
    if (isLoading) return [];
    
    const insights: Insight[] = [];

    // Budget utilization - more personalized with specific thresholds
    if (sectionData.expenses > 0 && sectionData.income > 0) {
      const budgetUtilization = (sectionData.expenses / sectionData.income) * 100;
      insights.push({
        title: "Budget Utilization",
        value: `${budgetUtilization.toFixed(0)}%`,
        description: budgetUtilization > 90 
          ? "Critical: Expenses exceeding safe budget limits" 
          : budgetUtilization > 80 
            ? "Warning: Consider reducing non-essential expenses" 
            : budgetUtilization > 60 
              ? "Good: You're managing your budget well" 
              : "Excellent: You have room to save or invest more",
        icon: <Wallet className="h-4 w-4 text-purple-600" />
      });
    }

    // Savings goals progress with actionable recommendations
    if (savingGoalsData.length > 0) {
      const totalCurrentAmount = savingGoalsData.reduce((sum, goal) => sum + goal.currentAmount, 0);
      const totalTargetAmount = savingGoalsData.reduce((sum, goal) => sum + goal.targetAmount, 0);
      const savingsProgress = (totalCurrentAmount / totalTargetAmount) * 100;
      
      insights.push({
        title: "Savings Goals Progress",
        value: `${savingsProgress.toFixed(0)}%`,
        description: savingsProgress < 30 
          ? `Early stages: Consider ${formatCurrency((totalTargetAmount - totalCurrentAmount) * 0.1)} monthly contributions` 
          : savingsProgress < 70 
            ? `On track: ${savingGoalsData.length} goals, ${formatCurrency(totalTargetAmount - totalCurrentAmount)} more to reach targets` 
            : `Almost there! ${formatCurrency(totalTargetAmount - totalCurrentAmount)} left to complete all goals`,
        icon: <Target className="h-4 w-4 text-indigo-600" />
      });
    }

    // Investment allocation with financial best practices
    if (sectionData.investments > 0 && sectionData.total > 0) {
      const investmentAllocation = (sectionData.investments / sectionData.total) * 100;
      insights.push({
        title: "Investment Allocation",
        value: `${investmentAllocation.toFixed(0)}%`,
        description: investmentAllocation < 10 
          ? "Low: Consider increasing to at least 15% for long-term growth" 
          : investmentAllocation < 20 
            ? "Moderate: Good balance, but potential to increase slightly" 
            : investmentAllocation < 30 
              ? "Optimal: Well-balanced for growth and security" 
              : "Aggressive: Ensure you have adequate emergency savings",
        icon: <TrendingUp className="h-4 w-4 text-emerald-600" />
      });
    }

    // Emergency fund health with clear financial planning advice
    if (sectionData.savings > 0 && sectionData.expenses > 0) {
      const monthsCovered = sectionData.savings / (sectionData.expenses / 30);
      insights.push({
        title: "Emergency Fund",
        value: `${monthsCovered.toFixed(1)} months`,
        description: monthsCovered < 1 
          ? "Critical: Prioritize building a 1-month safety net" 
          : monthsCovered < 3 
            ? "Building: Aim for 3-6 months of expenses (+" + formatCurrency((3 - monthsCovered) * (sectionData.expenses / 30)) + " needed)" 
            : monthsCovered < 6 
              ? "Good: You're well-prepared for minor emergencies" 
              : "Excellent: Your emergency fund is fully established",
        icon: <Shield className="h-4 w-4 text-amber-600" />
      });
    }

    // Income distribution with more detailed breakdown
    if (sectionData.income > 0 && sectionData.total > 0) {
      // Calculate the ideal distribution based on 50/30/20 rule (needs/wants/savings)
      const savingsPercent = ((sectionData.savings + sectionData.investments) / sectionData.total * 100).toFixed(0);
      const expensesPercent = ((sectionData.expenses) / sectionData.total * 100).toFixed(0);
      
      let distributionAdvice = '';
      if (parseInt(savingsPercent) < 20) {
        distributionAdvice = "Try to increase savings/investments to 20%+";
      } else if (parseInt(expensesPercent) > 60) {
        distributionAdvice = "Consider reducing expenses below 60% of income";
      } else {
        distributionAdvice = "Well-balanced distribution across categories";
      }
      
      insights.push({
        title: "Income Distribution",
        value: `${savingsPercent}% / ${expensesPercent}%`,
        description: `${distributionAdvice} (Save+Invest/Expenses)`,
        icon: <PieChart className="h-4 w-4 text-blue-600" />
      });
    }

    // Recent activity analysis with trend information
    if (recentTransactions && recentTransactions.length > 0) {
      // Analyze transaction trends
      const categories: Record<string, number> = {};
      let highestCategory = '';
      let highestAmount = 0;
      
      recentTransactions.forEach((transaction: Transaction) => {
        const category = transaction.category || 'Uncategorized';
        if (!categories[category]) categories[category] = 0;
        categories[category]++;
        
        if (categories[category] > highestAmount) {
          highestAmount = categories[category];
          highestCategory = category;
        }
      });
      
      insights.push({
        title: "Transaction Insights",
        value: `${recentTransactions.length} recent`,
        description: highestCategory 
          ? `Most frequent: ${highestCategory} (${highestAmount} transactions)` 
          : `You've had ${recentTransactions.length} transactions recently`,
        icon: <Activity className="h-4 w-4 text-red-600" />
      });
    }

    // Monthly spending velocity - new insight
    if (sectionData.expenses > 0 && recentTransactions && recentTransactions.length > 0) {
      // Calculate daily spend rate
      const dailySpendRate = sectionData.expenses / 30;
      const monthlyProjection = dailySpendRate * 30;
      const percentOfIncome = sectionData.income > 0 ? (monthlyProjection / sectionData.income * 100).toFixed(0) : '0';
      
      insights.push({
        title: "Monthly Spending Pace",
        value: `${formatCurrency(monthlyProjection)}`,
        description: sectionData.income > 0 
          ? `Projected to use ${percentOfIncome}% of your monthly income` 
          : `Average daily spending: ${formatCurrency(dailySpendRate)}`,
        icon: <TrendingUp className="h-4 w-4 text-orange-600" />
      });
    }

    // Fallback insight if nothing else available
    if (insights.length === 0) {
      insights.push({
        title: "Net Worth",
        value: formatCurrency(sectionData.total),
        description: "Your current total across all financial sections",
        icon: <DollarSign className="h-4 w-4 text-green-600" />
      });
    }

    // Limit to 6 most important insights to avoid overwhelming the dashboard
    return insights.slice(0, 6);
  };

  // Transaction type to icon mapping
  const getTransactionIcon = (type: string, fromSection: string, toSection: string) => {
    if (type === 'MANUAL' || type === 'AUTOMATIC') {
      if (fromSection === 'income' && toSection) {
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      } else if (fromSection && toSection) {
        return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
      } else if (fromSection && !toSection) {
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      } else {
        return <DollarSign className="h-4 w-4 text-gray-500" />;
      }
    }
    return <ArrowLeftRight className="h-4 w-4 text-gray-500" />;
  };

  // Format transaction description
  const formatTransactionDesc = (transaction: any) => {
    if (!transaction) return '';
    
    let desc = transaction.description || 'Transaction';
    
    if (transaction.fromSection && transaction.toSection) {
      return `${desc} (${transaction.fromSection} → ${transaction.toSection})`;
    } else if (transaction.fromSection) {
      return `${desc} (from ${transaction.fromSection})`;
    } else if (transaction.toSection) {
      return `${desc} (to ${transaction.toSection})`;
    }
    
    return desc;
  };

  // Calculate progress for saving goals
  const calculateProgress = (currentAmount: number, targetAmount: number) => {
    if (targetAmount <= 0) return 0;
    const progress = (currentAmount / targetAmount) * 100;
    return Math.min(100, progress);
  };

  // Add function for additional advanced insights
  const getAdvancedInsights = (): any[] => {
    if (isLoading) return [];
    
    const advancedInsights = [];
    
    // Expense Trend Analysis
    if (expenseChartData && expenseChartData.length > 0) {
      const trend = {
        title: "Expense Trends",
        icon: <TrendingDown className="h-4 w-4 text-purple-600" />,
        description: "Track your expense patterns over time",
        chart: true,
        chartType: "expenses"
      };
      advancedInsights.push(trend);
    }
    
    // Spending Categories Breakdown
    if (recentTransactions && recentTransactions.length > 0) {
      // Get categories and their totals
      const categories: Record<string, number> = {};
      recentTransactions.forEach((transaction: Transaction) => {
        const category = transaction.category || 'Uncategorized';
        if (!categories[category]) categories[category] = 0;
        categories[category] += transaction.amount;
      });
      
      // Transform for pie chart
      const categoryData = Object.keys(categories).map(cat => ({
        name: cat,
        value: categories[cat]
      }));
      
      const categoryBreakdown = {
        title: "Spending Breakdown",
        icon: <PieChart className="h-4 w-4 text-blue-600" />,
        description: "See where your money is going",
        chart: true,
        chartType: "categories",
        data: categoryData
      };
      advancedInsights.push(categoryBreakdown);
    }
    
    // Financial Health Score
    const healthScore = calculateFinancialHealthScore();
    advancedInsights.push({
      title: "Financial Health Score",
      icon: <Activity className="h-4 w-4 text-emerald-600" />,
      description: `${healthScore.score}/100 - ${healthScore.message}`,
      chart: false,
      details: healthScore.details,
      score: healthScore.score,
      scoreColor: healthScore.scoreColor
    });
    
    return advancedInsights;
  };

  // Calculate financial health score based on various metrics
  const calculateFinancialHealthScore = () => {
    let score = 0;
    let details = [];
    
    // Emergency Fund (0-25 points)
    if (sectionData.savings > 0 && sectionData.expenses > 0) {
      const monthsCovered = sectionData.savings / (sectionData.expenses / 30);
      if (monthsCovered >= 6) {
        score += 25;
        details.push("Strong emergency fund covering 6+ months");
      } else if (monthsCovered >= 3) {
        score += 20;
        details.push("Good emergency fund covering 3+ months");
      } else if (monthsCovered >= 1) {
        score += 10;
        details.push("Basic emergency fund covering 1+ month");
      } else {
        details.push("Limited emergency fund - work on building 3-6 months");
      }
    } else {
      details.push("No emergency fund detected");
    }
    
    // Budget Management (0-25 points)
    if (sectionData.expenses > 0 && sectionData.income > 0) {
      const budgetUtilization = (sectionData.expenses / sectionData.income) * 100;
      if (budgetUtilization < 60) {
        score += 25;
        details.push("Excellent budget management with low expense ratio");
      } else if (budgetUtilization < 80) {
        score += 20;
        details.push("Good budget management with reasonable expenses");
      } else if (budgetUtilization < 90) {
        score += 10;
        details.push("Budget management needs attention - expenses near income");
      } else {
        details.push("Budget at risk - expenses too close to income");
      }
    }
    
    // Savings Rate (0-25 points)
    if (sectionData.total > 0 && sectionData.income > 0) {
      const savingsRate = ((sectionData.savings + sectionData.investments) / sectionData.total) * 100;
      if (savingsRate >= 20) {
        score += 25;
        details.push("Strong savings rate of 20%+ of income");
      } else if (savingsRate >= 15) {
        score += 20;
        details.push("Good savings rate of 15%+ of income");
      } else if (savingsRate >= 10) {
        score += 10;
        details.push("Basic savings rate of 10%+ of income");
      } else {
        details.push("Low savings rate - aim for at least 15% of income");
      }
    }
    
    // Investment Allocation (0-25 points)
    if (sectionData.investments > 0 && sectionData.total > 0) {
      const investmentAllocation = (sectionData.investments / sectionData.total) * 100;
      if (investmentAllocation >= 25) {
        score += 25;
        details.push("Strong investment allocation for long-term growth");
      } else if (investmentAllocation >= 15) {
        score += 20;
        details.push("Good investment allocation for growth");
      } else if (investmentAllocation >= 10) {
        score += 10;
        details.push("Basic investment allocation - consider increasing");
      } else {
        details.push("Limited investment allocation - increase for future growth");
      }
    } else {
      details.push("No investments detected - start investing for growth");
    }
    
    // Determine message and color based on score
    let message = "";
    let scoreColor = "";
    
    if (score >= 90) {
      message = "Excellent";
      scoreColor = "text-emerald-600";
    } else if (score >= 70) {
      message = "Good";
      scoreColor = "text-green-600";
    } else if (score >= 50) {
      message = "Fair";
      scoreColor = "text-yellow-600";
    } else if (score >= 30) {
      message = "Needs Attention";
      scoreColor = "text-orange-600";
    } else {
      message = "At Risk";
      scoreColor = "text-red-600";
    }
    
    return { score, message, details, scoreColor };
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name || 'User'}! Here's your financial overview.</p>
      </header>

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

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Balance Card - Larger and More Prominent */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white lg:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Total Balance</p>
              <h2 className="text-3xl font-bold">{isLoading ? '...' : formatCurrency(totalBalance)}</h2>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            {sectionCards.map((card) => (
              <div key={card.title} className="bg-white/10 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <span className="text-xs font-medium text-indigo-100">{card.title}</span>
                </div>
                <p className="text-white font-semibold truncate">{formatCurrency(card.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Income Overview Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-gray-500 text-sm font-medium">Available Income</p>
              <h2 className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyIncome)}</h2>
            </div>
            <div className="bg-green-50 p-2 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="space-y-4">
            {user && (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Distribution Plan</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="bg-indigo-500" 
                        style={{ width: `${user.savingsPercent || 0}%` }}
                        title="Savings"
                      ></div>
                      <div 
                        className="bg-purple-500" 
                        style={{ width: `${user.expensesPercent || 0}%` }}
                        title="Expenses"
                      ></div>
                      <div 
                        className="bg-emerald-500" 
                        style={{ width: `${user.investmentsPercent || 0}%` }}
                        title="Investments"
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-indigo-600">Savings</span>
                    <span className="text-purple-600">Expenses</span>
                    <span className="text-emerald-600">Investments</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-100">
                  <Link href="/dashboard/income">
                    <button className="w-full flex items-center justify-center space-x-2 rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      <DollarSign className="h-4 w-4" />
                      <span>Add New Income</span>
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section - Expense Charts */}
      <div className="mt-8 mb-10">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Expense Analysis</h3>
            
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
              <button 
                onClick={() => setExpenseTimeframe('month')} 
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  expenseTimeframe === 'month' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setExpenseTimeframe('year')} 
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  expenseTimeframe === 'year' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          {!hasExpensesForTimeframe ? (
            <div className="h-64 md:h-80 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
              <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-2">No expenses found for {expenseTimeframe === 'month' ? 'this month' : 'this year'}</p>
              <p className="text-sm text-gray-500 mb-4">Add some expenses to see your spending analysis</p>
              <Link href="/dashboard/expenses">
                <Button className="text-sm">
                  Add New Expense
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expenseChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                    <XAxis 
                      dataKey={expenseTimeframe === 'month' ? 'day' : 'month'} 
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <RechartsTooltip
                      formatter={(value: number) => [`$${value}`, 'Expenses']}
                      labelFormatter={(label: string | number) => {
                        if (expenseTimeframe === 'month') return `Day ${label}`;
                        return label;
                      }}
                    />
                    <Bar dataKey="amount" name="Expenses" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm text-gray-600 mb-2">Total Expenses</h4>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCurrency(expenseChartData.reduce((sum, item) => sum + item.amount, 0))}
                  </p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm text-gray-600 mb-2">Average Per {expenseTimeframe === 'month' ? 'Day' : 'Month'}</h4>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCurrency(expenseChartData.reduce((sum, item) => sum + item.amount, 0) / expenseChartData.length)}
                  </p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm text-gray-600 mb-2">Highest Expense</h4>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCurrency(Math.max(...expenseChartData.map(item => item.amount)))}
                  </p>
                </div>
              </div>
            </>
          )}
          
          <div className="mt-6 flex justify-center">
            <Link href="/dashboard/expenses">
              <Button variant="outline" className="text-sm">
                {hasExpensesForTimeframe ? 'View Detailed Expense Report' : 'Manage Expenses'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Bottom Section - Recent Activity and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
            <Link href="/dashboard/transactions">
              <span className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            </Link>
          </div>
          
          <div className="space-y-4">
            {transactionsLoading ? (
              <div className="py-8 text-center text-gray-500">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 mb-1">No transactions yet</p>
                <p className="text-sm text-gray-400">Your recent transactions will appear here</p>
              </div>
            ) : (
              recentTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 rounded-full bg-gray-50">
                      {getTransactionIcon(transaction.type, transaction.fromSection, transaction.toSection)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                        {formatTransactionDesc(transaction)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${transaction.fromSection && !transaction.toSection ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.fromSection && !transaction.toSection ? '-' : ''}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Saving Goals Progress */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-800">Saving Goals Progress</h2>
            <Link href="/dashboard/saving-goals">
              <span className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            </Link>
          </div>
          
          <div className="space-y-4">
            {savingGoalsLoading ? (
              <div className="py-8 text-center text-gray-500">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ) : savingGoalsData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 mb-1">No saving goals yet</p>
                <p className="text-sm text-gray-400">Create a goal to start saving for your future</p>
                <div className="mt-4">
                  <Link href="/dashboard/saving-goals">
                    <Button variant="outline">
                      Create a Goal
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              savingGoalsData.map((goal: any) => {
                const progressPercent = calculateProgress(goal.currentAmount, goal.targetAmount);
                
                return (
                  <div key={goal.id} className="p-4 border border-gray-100 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">{goal.name}</h3>
                        <p className="text-xs text-gray-500">{goal.category}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm font-medium text-gray-800">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
                        <p className="text-xs text-gray-500">{progressPercent.toFixed(0)}% complete</p>
                      </div>
                    </div>
                    
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div 
                        className={`h-full rounded-full ${
                          progressPercent >= 100 
                            ? 'bg-green-500' 
                            : progressPercent > 50 
                              ? 'bg-indigo-500' 
                              : 'bg-indigo-400'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        {goal.transferType === 'EXPENSE' ? (
                          <>
                            <CreditCard className="h-3 w-3 mr-1 text-purple-500" />
                            <span>For expenses when completed</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                            <span>For investments when completed</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 