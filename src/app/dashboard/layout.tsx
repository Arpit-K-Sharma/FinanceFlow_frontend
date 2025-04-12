'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PiggyBank, 
  CreditCard, 
  TrendingUp, 
  ArrowLeftRight, 
  BarChart4, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  DollarSign
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Separate effect for auth check that runs after component is mounted
  useEffect(() => {
    if (mounted && !token) {
      router.push('/login');
    }
    
    // Handle responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    if (mounted) {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [mounted, router, token]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!mounted) return null;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Income', href: '/dashboard/income', icon: <DollarSign className="w-5 h-5" /> },
    { name: 'Expenses', href: '/dashboard/expenses', icon: <CreditCard className="w-5 h-5" /> },
    { name: 'Investments', href: '/dashboard/investments', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'Transactions', href: '/dashboard/transactions', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { name: 'Saving Goals', href: '/dashboard/saving-goals', icon: <PiggyBank className="w-5 h-5" /> },
    { name: 'Settings', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-white shadow-md text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-10 h-full bg-white w-64 shadow-lg border-r border-gray-200 transition-transform transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <Link href="/dashboard">
              <div className="cursor-pointer">
                <Logo size="small" />
              </div>
            </Link>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors group"
              >
                <span className="text-gray-500 group-hover:text-indigo-600 mr-3">
                  {item.icon}
                </span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            {user && (
              <Link href="/dashboard/profile">
                <div className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-700 font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium text-gray-800 truncate">{user.name || 'User'}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email || 'user@example.com'}</p>
                  </div>
                </div>
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : ''}`}>
        <div className="min-h-screen p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
} 