'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, PiggyBank, CreditCard, Wallet, BarChart2, LineChart, ArrowUp } from 'lucide-react';
import { useToast } from '../../components/ui/toast';

// Financial icons to be animated
const FinanceIcons = [
  DollarSign, TrendingUp, PiggyBank, CreditCard, Wallet, BarChart2, LineChart, ArrowUp
];

// Coin component for the background
const Coin = ({ size, delay, x, y }: { size: number, delay: number, x: string, y: string }) => {
  return (
    <motion.div
      className="absolute rounded-full bg-yellow-400/20 flex items-center justify-center"
      style={{ 
        width: size, 
        height: size,
        x, 
        y 
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0.2, 0.5, 0.2],
        scale: 1,
        rotate: [0, 180]
      }}
      transition={{
        duration: 10,
        delay,
        repeat: Infinity,
        repeatType: "reverse"
      }}
    >
      <div className="w-4/5 h-4/5 rounded-full bg-yellow-500/30 flex items-center justify-center">
        <DollarSign className="w-1/2 h-1/2 text-yellow-200" strokeWidth={1.5} />
      </div>
    </motion.div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.register(formData);
      
      // Make sure the token is properly stored
      if (response?.data?.token) {
        // Store token first
        login(response.data.token);
        
        // Then redirect - add a longer delay to ensure user data is properly loaded
        // This gives time for the auth context to update with the user data
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-700">
      {/* Financial Animation Elements */}
      <div className="absolute inset-0 w-full h-full">
        {mounted && (
          <>
            {/* Animated coins */}
            {Array.from({ length: 8 }).map((_, index) => (
              <Coin 
                key={`coin-${index}`}
                size={80 + Math.random() * 60}
                delay={index * 0.5}
                x={`${Math.random() * 100}%`}
                y={`${Math.random() * 100}%`}
              />
            ))}
            
            {/* Animated finance icons */}
            {Array.from({ length: 12 }).map((_, index) => {
              const IconComponent = FinanceIcons[index % FinanceIcons.length];
              return (
                <motion.div
                  key={`icon-${index}`}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  initial={{ 
                    opacity: 0, 
                    scale: 0
                  }}
                  animate={{ 
                    opacity: [0.1, 0.3, 0.1],
                    scale: [1, 1.2, 1],
                    y: [0, -15, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 4 + Math.random() * 6,
                    delay: index * 0.3
                  }}
                >
                  <IconComponent className="text-white/20 w-12 h-12" />
                </motion.div>
              );
            })}

            {/* Rising values animation */}
            <div className="absolute left-[10%] bottom-0 h-[70%] w-16 overflow-hidden opacity-20">
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.div
                  key={`value-${index}`}
                  className="absolute left-0 flex items-center justify-center w-full text-white font-bold"
                  style={{
                    bottom: `${index * 20}%`
                  }}
                  initial={{ 
                    y: 100,
                    opacity: 0
                  }}
                  animate={{ 
                    y: [-50, -200],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 8,
                    delay: index * 1.6,
                    repeatDelay: 4
                  }}
                >
                  +${Math.floor(Math.random() * 900) + 100}
                </motion.div>
              ))}
            </div>

            {/* Stock chart line */}
            <svg className="absolute right-0 bottom-0 h-[30%] w-[40%] opacity-20" viewBox="0 0 100 50">
              <motion.path
                d="M0,40 C20,40 25,10 40,10 S60,30 70,5 C80,-10 90,20 100,20"
                fill="none"
                stroke="white"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "loop",
                  repeatDelay: 0.5
                }}
              />
              <motion.circle
                r="2"
                fill="white"
                initial={{ cx: 0, cy: 40 }}
                animate={{ 
                  cx: [0, 40, 70, 100],
                  cy: [40, 10, 5, 20]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "loop",
                  repeatDelay: 0.5,
                  times: [0, 0.4, 0.7, 1]
                }}
              />
            </svg>
          </>
        )}
      </div>

      {/* Floating text that explains the app */}
      {mounted && (
        <motion.div 
          className="absolute top-32 left-0 w-full text-center text-white/70 font-semibold text-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Smart Wealth Management
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center pt-8">
          <Link href="/">
            <div className="cursor-pointer">
              <Logo color="white" size="large" />
            </div>
          </Link>
        </div>

        <motion.div 
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white/90 backdrop-blur-lg py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Create your account</h2>
            <p className="text-center text-gray-500 mb-6">Start managing your wealth today</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Input
                  label="Full name"
                  type="text"
                  value={formData.name}
                  onChange={(value) => setFormData({ ...formData, name: value })}
                  required
                  icon={
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  }
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Input
                  label="Email address"
                  type="email"
                  value={formData.email}
                  onChange={(value) => setFormData({ ...formData, email: value })}
                  required
                  icon={
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  }
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(value) => setFormData({ ...formData, password: value })}
                  required
                  icon={
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  }
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button 
                  type="submit" 
                  fullWidth 
                  loading={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                >
                  Create account
                </Button>
              </motion.div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <motion.div 
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-all hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 