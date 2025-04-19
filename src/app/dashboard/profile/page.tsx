'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Mail, Lock, Save, Percent, AlertCircle, X, Check, Info, 
  PiggyBank, CreditCard, TrendingUp, Send, ShieldCheck, Phone, 
  MapPin, Calendar, Briefcase, UserCircle, Award, Star, 
  Heart, Gift, Settings, EyeOff, Sparkles, Shield
} from 'lucide-react';
import { useToast } from '../../../components/ui/toast';
import Link from 'next/link';
import api from '../../utils/axios';
import { useSearchParams } from 'next/navigation';

// Define types that match the UserData in AuthContext
type LeftoverActionType = 'savings' | 'expenses' | 'investments' | undefined;
type GenderType = 'male' | 'female' | 'other' | '';

interface ProfileForm {
  name: string;
  phoneNumber: string;
  address: string;
  age: string;
  gender: GenderType;
  occupation: string;
  dateOfBirth: string;
}

export default function ProfilePage() {
  const { user, updateUserProfile, forceRefreshUser, updateEmail, deleteAccount } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(false);
  const toastShownRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'personal'>('basic');
  const dataInitialized = useRef(false);
  
  const [formData, setFormData] = useState<ProfileForm>({
    name: '',
    phoneNumber: '',
    address: '',
    age: '',
    gender: '',
    occupation: '',
    dateOfBirth: '',
  });

  // Initialize form with user data when available
  useEffect(() => {
    // Only update the form data if user exists and we haven't initialized yet
    if (user && !dataInitialized.current) {
      dataInitialized.current = true;
      
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        age: user.age?.toString() || '',
        gender: (user.gender as GenderType) || '',
        occupation: user.occupation || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      });
      
      // Check if coming from setup
      const fromSetup = searchParams.get('fromSetup') === 'true';
      
      // Or if profile is incomplete
      const isProfileIncomplete = !user.phoneNumber || 
                                !user.address || 
                                !user.gender || 
                                !user.dateOfBirth;
      
      if (fromSetup || isProfileIncomplete) {
        setShowWelcomeAlert(true);
        
        // Only show toast once
        if (!toastShownRef.current) {
          addToast('Please complete your profile information', 'info');
          toastShownRef.current = true;
        }
      }
    }
  }, [user, searchParams, addToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
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
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        occupation: formData.occupation,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
      });
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!user) return;
    
    setIsSendingVerification(true);
    
    try {
      const response = await api.post('/users/send-verification');
      addToast(response.data.message || 'Verification email sent! Please check your inbox.', 'success');
      // Refresh user data to update UI
      await forceRefreshUser();
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to send verification email', 'error');
    } finally {
      setIsSendingVerification(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Memoize the profile completion calculation to avoid recalculating on every render
  const profileCompletion = useMemo(() => {
    let filled = 0;
    let total = 6;
    
    if (formData.name) filled++;
    if (formData.phoneNumber) filled++;
    if (formData.address) filled++;
    if (formData.age) filled++;
    if (formData.gender) filled++;
    if (formData.dateOfBirth) filled++;
    
    return Math.round((filled / total) * 100);
  }, [formData]);

  return (
    <div className="relative">
      {/* Floating completion indicator */}
      <div className="fixed bottom-5 right-5 z-10 bg-white rounded-full shadow-lg p-1 border border-indigo-100">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={profileCompletion < 30 ? '#f87171' : profileCompletion < 70 ? '#6366f1' : '#10b981'}
              strokeWidth="3"
              strokeDasharray={`${profileCompletion}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{profileCompletion}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top banner - lighter weight */}
        {showWelcomeAlert && (
          <div className="rounded-xl bg-gradient-to-r from-violet-50 to-sky-50 p-4 shadow-sm border border-indigo-100 animate-fadeIn">
            <div className="flex items-center">
              <div className="hidden sm:flex shrink-0 items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400 text-white">
                <Award className="h-6 w-6" />
              </div>
              <div className="ml-0 sm:ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-900">Complete your profile to unlock all features</p>
                  <button
                    type="button"
                    onClick={() => setShowWelcomeAlert(false)}
                    className="inline-flex bg-white/50 rounded-full p-1 text-indigo-400 hover:bg-white hover:text-indigo-600 focus:outline-none transition-all duration-150"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-1 w-full bg-white/30 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
              {/* Profile header with gradient */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-2xl border-4 border-white/20 shadow-xl">
                      {getInitials(user?.name || '')}
                    </div>
                    {user?.isEmailVerified && (
                      <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{user?.name || 'Welcome!'}</h2>
                  <div className="flex items-center text-white/80 mt-1 text-sm">
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    <p>{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Profile status cards */}
              <div className="p-5 space-y-4">
                {/* Verification Status */}
                <div className={`rounded-lg p-4 ${user?.isEmailVerified ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.isEmailVerified ? 'bg-green-100' : 'bg-amber-100'}`}>
                      {user?.isEmailVerified ? (
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className={`text-sm font-medium ${user?.isEmailVerified ? 'text-green-800' : 'text-amber-800'}`}>
                        {user?.isEmailVerified ? 'Email Verified' : 'Email Verification Required'}
                      </h3>
                      <p className={`text-xs mt-1 ${user?.isEmailVerified ? 'text-green-600' : 'text-amber-600'}`}>
                        {user?.isEmailVerified 
                          ? 'You have full access to all features' 
                          : 'Verify your email to unlock all features'}
                      </p>
                    </div>
                    {!user?.isEmailVerified && (
                      <button
                        onClick={handleSendVerificationEmail}
                        disabled={isSendingVerification}
                        className="ml-2 bg-white text-amber-600 hover:bg-amber-50 font-medium rounded-md py-1.5 px-3 text-xs shadow-sm border border-amber-200 transition-colors duration-150"
                      >
                        {isSendingVerification ? 'Sending...' : 'Verify'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Account stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                        <UserCircle className="h-5 w-5 text-indigo-600" />
                      </div>
                      <p className="text-xs font-medium text-indigo-800 text-center">Account Status</p>
                      <p className="text-sm font-bold text-indigo-700 mt-1">Active</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                        <Star className="h-5 w-5 text-purple-600" />
                      </div>
                      <p className="text-xs font-medium text-purple-800 text-center">Profile Level</p>
                      <p className="text-sm font-bold text-purple-700 mt-1">
                        {profileCompletion < 50 ? 'Beginner' : profileCompletion < 80 ? 'Advanced' : 'Complete'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account settings link */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link 
                    href="/dashboard/settings" 
                    className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-150"
                  >
                    <Settings className="h-4 w-4 mr-2 text-gray-500" />
                    Account Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
              {/* Tab navigation */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                  className={`px-4 py-3 font-medium text-sm flex-1 ${
                    activeTab === 'basic' 
                      ? 'text-indigo-700 border-b-2 border-indigo-500 bg-white' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('basic')}
                >
                  <div className="flex items-center justify-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>Basic Info</span>
                  </div>
                </button>
                <button
                  className={`px-4 py-3 font-medium text-sm flex-1 ${
                    activeTab === 'contact' 
                      ? 'text-indigo-700 border-b-2 border-indigo-500 bg-white' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('contact')}
                >
                  <div className="flex items-center justify-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>Contact</span>
                  </div>
                </button>
                <button
                  className={`px-4 py-3 font-medium text-sm flex-1 ${
                    activeTab === 'personal' 
                      ? 'text-indigo-700 border-b-2 border-indigo-500 bg-white' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('personal')}
                >
                  <div className="flex items-center justify-center">
                    <Heart className="h-4 w-4 mr-2" />
                    <span>Personal</span>
                  </div>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <div className="animate-fadeIn">
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
                        <p className="text-sm text-gray-600">
                          Your basic information is used throughout the platform
                        </p>
                      </div>

                      {/* Name field with card style */}
                      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-8 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4 flex-1">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                              Display Name
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                              This is how you'll appear on the platform
                            </p>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              value={formData.name}
                              onChange={handleChange}
                              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Your name"
                            />
                          </div>
                        </div>
                        
                        {formData.name && (
                          <div className="mt-4 pt-4 border-t border-gray-100 text-sm flex items-center justify-end">
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">Looks good!</span>
                          </div>
                        )}
                      </div>

                      {/* Quick tip card */}
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-2 flex">
                        <div className="flex-shrink-0">
                          <Info className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            Add more information to unlock personalized features.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Tab */}
                  {activeTab === 'contact' && (
                    <div className="animate-fadeIn">
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
                        <p className="text-sm text-gray-600">
                          Update your contact details
                        </p>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Phone Number field */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                              <Phone className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900">
                                Phone Number
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                For account security and notifications
                              </p>
                              <input
                                type="tel"
                                name="phoneNumber"
                                id="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Address field */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                              <label htmlFor="address" className="block text-sm font-medium text-gray-900">
                                Address
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Your mailing address
                              </p>
                              <input
                                type="text"
                                name="address"
                                id="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="123 Main St, City, State, Zip"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Personal Tab */}
                  {activeTab === 'personal' && (
                    <div className="animate-fadeIn">
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Details</h3>
                        <p className="text-sm text-gray-600">
                          Add your personal information for a tailored experience
                        </p>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Date of Birth field */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900">
                                Date of Birth
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Used for age verification and personalized services
                              </p>
                              <input
                                type="date"
                                name="dateOfBirth"
                                id="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Gender field */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                              <label htmlFor="gender" className="block text-sm font-medium text-gray-900">
                                Gender
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                For demographic information
                              </p>
                              <select
                                name="gender"
                                id="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Age field */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <UserCircle className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                              <label htmlFor="age" className="block text-sm font-medium text-gray-900">
                                Age
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Your current age
                              </p>
                              <input
                                type="number"
                                name="age"
                                id="age"
                                min="0"
                                max="120"
                                value={formData.age}
                                onChange={handleChange}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Your age"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Occupation field */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
                              <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                              <label htmlFor="occupation" className="block text-sm font-medium text-gray-900">
                                Occupation
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Your current job or profession
                              </p>
                              <input
                                type="text"
                                name="occupation"
                                id="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Your occupation"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Personalization benefits card */}
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-indigo-100 mt-4">
                        <div className="flex items-center">
                          <div className="shrink-0">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-indigo-800">Personalized Experience</p>
                            <p className="text-xs text-indigo-600 mt-1">
                              Complete your personal details to receive tailored recommendations and insights.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form footer with completion status and submit button */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center w-full sm:w-auto">
                      <div className="w-full sm:w-auto flex items-center bg-white rounded-full p-1.5 pr-4 shadow-sm border border-gray-200">
                        <div 
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 ${
                            profileCompletion < 30 ? 'bg-red-500' : 
                            profileCompletion < 70 ? 'bg-indigo-500' : 'bg-emerald-500'
                          }`}
                        >
                          {Math.floor(profileCompletion / 10)}
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="text-xs text-gray-500">Profile Completion</div>
                          <div className="flex items-center">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full w-24 sm:w-32">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  profileCompletion < 30 ? 'bg-red-500' : 
                                  profileCompletion < 70 ? 'bg-indigo-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${profileCompletion}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 ml-2">{profileCompletion}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end w-full sm:w-auto">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 hover:scale-105"
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
                            <Save className="h-4 w-4 mr-2" />
                            Save Profile
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 