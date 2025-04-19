'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../../components/ui/toast';
import { authService } from '../services/authService';
import Link from 'next/link';
import { CheckCircle, XCircle, ChevronRight, Home } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { forceRefreshUser } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }
    
    const verifyEmail = async () => {
      try {
        const response = await authService.verifyEmail({ token });
        setStatus('success');
        setMessage(response.message || 'Your email has been successfully verified!');
        
        // Refresh user data to update the verification status
        await forceRefreshUser();
        
        // Auto-redirect to homepage after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
        
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may have expired.');
      }
    };
    
    verifyEmail();
  }, [searchParams, router, addToast, forceRefreshUser]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            {status === 'loading' && (
              <div className="mx-auto w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            )}
            
            {status === 'success' && (
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            )}
            
            {status === 'error' && (
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {status === 'loading' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>
          
          <p className="text-center text-gray-600 mb-6">
            {message}
          </p>
          
          {status === 'success' && (
            <div className="text-center text-sm text-gray-500">
              Redirecting you to the dashboard in a few seconds...
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            {status === 'success' && (
              <Link href="/dashboard">
                <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Go to Dashboard <ChevronRight className="ml-2 h-4 w-4" />
                </div>
              </Link>
            )}
            
            {status === 'error' && (
              <Link href="/">
                <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Go to Homepage <Home className="ml-2 h-4 w-4" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 