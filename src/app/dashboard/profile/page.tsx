'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Save, Percent, AlertCircle, X, Check, Info, PiggyBank, CreditCard, TrendingUp } from 'lucide-react';
import { useToast } from '../../../components/ui/toast';
import Link from 'next/link';

// Define types that match the UserData in AuthContext
type LeftoverActionType = 'savings' | 'expenses' | 'investments' | undefined;

interface ProfileForm {
  name: string;
}

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    name: '',
  });

  // Initialize form with user data when available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast('Name cannot be empty', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await updateUserProfile({
        name: formData.name
      });
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600 mt-1">Manage your display name</p>
        </div>
        
        {user && (
          <div className="flex items-center p-2 rounded-lg bg-indigo-50 border border-indigo-100">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium mr-3">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-gray-800">{user.name || 'User'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="max-w-xl mx-auto">
              <div className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Display Name
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Your name"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    This is the name that will be displayed to other users.
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mt-6">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-1">Account Settings</h4>
                      <p className="text-sm text-blue-700">
                        To change your password or manage other security settings, please visit the <Link href="/dashboard/settings" className="font-medium underline">Settings page</Link>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer with Submit Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Update Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 