"use client"

import { useState } from "react"
import { Button } from "./Button"
import { 
  XCircle, 
  Plus, 
  Minus, 
  Scale, 
  PiggyBank, 
  TrendingUp, 
  CreditCard,
  Percent,
  CheckCircle2,
  Check,
  AlertCircle,
  Info,
  Wallet,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"

interface SetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSetupComplete: () => void
}

export const SetupModal = ({ isOpen, onClose, onSetupComplete }: SetupModalProps) => {
  const { updateUserProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    savingsPercent: 30,
    expensesPercent: 50,
    investmentsPercent: 20,
    leftoverAction: "savings" as "savings" | "expenses" | "investments",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showMinimumDialog, setShowMinimumDialog] = useState(false)
  const [showMaximumDialog, setShowMaximumDialog] = useState(false)
  const [attemptedField, setAttemptedField] = useState<string>("")
  const [attemptedValue, setAttemptedValue] = useState<number>(0)

  const totalPercent = formData.savingsPercent + formData.expensesPercent + formData.investmentsPercent

  // Apply preset allocation
  const applyPreset = (preset: "balanced" | "savings" | "growth" | "expenses") => {
    switch (preset) {
      case "balanced":
        setFormData({
          ...formData,
          savingsPercent: 30,
          expensesPercent: 50,
          investmentsPercent: 20,
        })
        break
      case "savings":
        setFormData({
          ...formData,
          savingsPercent: 40,
          expensesPercent: 45,
          investmentsPercent: 15,
        })
        break
      case "growth":
        setFormData({
          ...formData,
          savingsPercent: 20,
          expensesPercent: 45,
          investmentsPercent: 35,
        })
        break
      case "expenses":
        setFormData({
          ...formData,
          savingsPercent: 20,
          expensesPercent: 65,
          investmentsPercent: 15,
        })
        break
    }
  }

  // Handle increment/decrement of percentages
  const handlePercentChange = (field: "savingsPercent" | "expensesPercent" | "investmentsPercent", amount: number) => {
    const updatedFormData = { ...formData }
    
    // Ensure we don't go below 0 or above 100
    const newValue = Math.max(0, Math.min(100, formData[field] + amount))

    // If trying to set to less than 10%, show dialog
    if (newValue < 10 && newValue > 0) {
      setAttemptedField(field)
      setAttemptedValue(newValue)
      setShowMinimumDialog(true)
      return
    }

    // If trying to set above 80%, prevent it and show dialog
    if (newValue > 80) {
      setAttemptedField(field)
      setAttemptedValue(newValue)
      setShowMaximumDialog(true)
      return
    }
    
    // Calculate the difference that needs to be distributed
    const diff = newValue - formData[field]
    
    // If no change needed, exit early
    if (diff === 0) return
    
    updatedFormData[field] = newValue
    
    // Determine which fields to adjust to maintain 100% total
    const fieldsToAdjust = ["savingsPercent", "expensesPercent", "investmentsPercent"].filter(
      (f) => f !== field,
    ) as Array<"savingsPercent" | "expensesPercent" | "investmentsPercent">
    
    // If we're increasing one percentage, decrease others proportionally
    if (diff > 0) {
      const totalOthers = fieldsToAdjust.reduce((sum, f) => sum + updatedFormData[f], 0)
      
      if (totalOthers <= 0) return // Can't adjust if other fields are 0
      
      // Distribute the reduction proportionally
      let remaining = diff
      fieldsToAdjust.forEach((f, index) => {
        const isLastField = index === fieldsToAdjust.length - 1
        const proportion = updatedFormData[f] / totalOthers
        
        if (isLastField) {
          // For the last field, just subtract the remaining difference
          updatedFormData[f] = Math.max(0, updatedFormData[f] - remaining)
        } else {
          const reduction = Math.min(updatedFormData[f], Math.round(diff * proportion))
          updatedFormData[f] -= reduction
          remaining -= reduction
        }
      })
    } 
    // If we're decreasing one percentage, increase others proportionally
    else if (diff < 0) {
      const totalOthers = fieldsToAdjust.reduce((sum, f) => sum + updatedFormData[f], 0)
      
      // Distribute the increase proportionally
      let remaining = -diff
      fieldsToAdjust.forEach((f, index) => {
        const isLastField = index === fieldsToAdjust.length - 1
        const proportion = totalOthers > 0 ? updatedFormData[f] / totalOthers : 1 / fieldsToAdjust.length
        
        if (isLastField) {
          // For the last field, just add the remaining difference
          updatedFormData[f] = Math.min(100, updatedFormData[f] + remaining)
        } else {
          const increase = Math.round(-diff * proportion)
          updatedFormData[f] += increase
          remaining -= increase
        }
      })
    }
    
    // Ensure total is exactly 100%
    const newTotal =
      updatedFormData.savingsPercent + updatedFormData.expensesPercent + updatedFormData.investmentsPercent
    if (newTotal !== 100) {
      // Adjust the first non-modified field to make total exactly 100%
      updatedFormData[fieldsToAdjust[0]] += 100 - newTotal
    }
    
    setFormData(updatedFormData)
  }

  // Handle direct input of percentages
  const handleInputChange = (field: "savingsPercent" | "expensesPercent" | "investmentsPercent", value: string) => {
    const numValue = Number.parseInt(value) || 0

    // If trying to set to less than 10%, show dialog
    if (numValue < 10 && numValue > 0) {
      setAttemptedField(field)
      setAttemptedValue(numValue)
      setShowMinimumDialog(true)
      return
    }

    // If trying to set above 80%, prevent it and show dialog
    if (numValue > 80) {
      setAttemptedField(field)
      setAttemptedValue(numValue)
      setShowMaximumDialog(true)
      return
    }

    // Use the increment/decrement function for maintaining the total
    const diff = numValue - formData[field]
    handlePercentChange(field, diff)
  }

  const handleSave = async () => {
    if (totalPercent !== 100) {
      setError("Total percentage must equal 100%")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")
      
      await updateUserProfile(formData)
      setSuccess(true)
      
      // Call onSetupComplete after a brief delay to show success message
      setTimeout(() => {
        onSetupComplete()
      }, 1500)
    } catch (err) {
      setError("Failed to save your preferences. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Force the modal to be visible if isOpen is true
  if (!isOpen) {
    return null
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
                    
                    {/* Distribution Summary */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                            <Percent className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Distribution Total</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`px-3 py-1 rounded-full flex items-center ${
                            totalPercent > 100 
                              ? 'bg-red-100 text-red-800' 
                              : totalPercent === 100 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            <span className="text-sm font-medium mr-1">
                              {totalPercent}%
                            </span>
                            {totalPercent > 100 && <AlertCircle className="h-3.5 w-3.5" />}
                            {totalPercent === 100 && <Check className="h-3.5 w-3.5" />}
                            {totalPercent < 100 && totalPercent > 0 && <Info className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </div>
                      
                        <div className="h-8 w-full bg-gray-100 rounded-lg overflow-hidden shadow-inner mb-2 relative">
                          <div 
                            className="absolute inset-0 flex"
                            style={{ 
                              boxShadow: totalPercent > 100 ? 'inset 0 0 0 2px rgba(220, 38, 38, 0.4)' : 
                                        totalPercent === 100 ? 'inset 0 0 0 2px rgba(16, 185, 129, 0.4)' : 'none' 
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
                          {totalPercent != 100 && (
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
                        {totalPercent > 100 ? (
                          <div className="flex items-center text-red-600 text-xs mt-1">
                          <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                            <span>Total exceeds 100%. Please adjust your allocation.</span>
                          </div>
                        ) : totalPercent === 100 ? (
                          <div className="flex items-center text-emerald-600 text-xs mt-1">
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                            <span>Perfect! Your allocation is balanced at exactly 100%.</span>
                          </div>
                      ) : totalPercent > 0 ? (
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
                  
                    {/* Savings Input */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                          <PiggyBank className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                          <label className="block text-sm font-medium text-gray-700">Savings</label>
                          <p className="text-xs text-gray-500">Money you're setting aside for future needs</p>
                          </div>
                        <div className="ml-auto">
                          <span className="text-xl font-bold text-indigo-700">{formData.savingsPercent}%</span>
                        </div>
                        </div>
                      
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.savingsPercent}
                        onChange={(e) => handleInputChange('savingsPercent', e.target.value)}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-indigo-200"
                        style={{
                          backgroundImage: `linear-gradient(to right, #6366f1 0%, #6366f1 ${formData.savingsPercent}%, #cbd5e1 ${formData.savingsPercent}%)`,
                        }}
                      />
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    {/* Expenses Input */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                          <label className="block text-sm font-medium text-gray-700">Expenses</label>
                          <p className="text-xs text-gray-500">Money for your daily and monthly expenses</p>
                          </div>
                        <div className="ml-auto">
                          <span className="text-xl font-bold text-purple-700">{formData.expensesPercent}%</span>
                        </div>
                        </div>
                      
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.expensesPercent}
                        onChange={(e) => handleInputChange('expensesPercent', e.target.value)}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-purple-200"
                        style={{
                          backgroundImage: `linear-gradient(to right, #9333ea 0%, #9333ea ${formData.expensesPercent}%, #cbd5e1 ${formData.expensesPercent}%)`,
                        }}
                      />
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    {/* Investments Input */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                          <label className="block text-sm font-medium text-gray-700">Investments</label>
                          <p className="text-xs text-gray-500">Money you're investing for growth</p>
                          </div>
                        <div className="ml-auto">
                          <span className="text-xl font-bold text-emerald-700">{formData.investmentsPercent}%</span>
                        </div>
                        </div>
                      
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.investmentsPercent}
                        onChange={(e) => handleInputChange('investmentsPercent', e.target.value)}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-emerald-200"
                        style={{
                          backgroundImage: `linear-gradient(to right, #10b981 0%, #10b981 ${formData.investmentsPercent}%, #cbd5e1 ${formData.investmentsPercent}%)`,
                        }}
                      />
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
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
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <Wallet className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700">Leftover Money Allocation</label>
                        <p className="text-xs text-gray-500">Choose where to add any extra income</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div 
                        className={`relative p-5 rounded-lg border ${formData.leftoverAction === 'savings' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'} cursor-pointer transition-all flex flex-col items-center`}
                        onClick={() => setFormData({ ...formData, leftoverAction: 'savings' })}
                      >
                        <div className="absolute top-3 right-3">
                          <div className={`w-5 h-5 rounded-full ${formData.leftoverAction === 'savings' ? 'bg-indigo-500' : 'bg-gray-200'} flex items-center justify-center`}>
                            {formData.leftoverAction === 'savings' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                      </div>
                    </div>
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                        <PiggyBank className={`h-6 w-6 ${formData.leftoverAction === 'savings' ? 'text-indigo-600' : 'text-gray-500'}`} />
                      </div>
                        <p className={`text-center font-medium ${formData.leftoverAction === 'savings' ? 'text-indigo-700' : 'text-gray-700'}`}>
                          Add to Savings
                        </p>
                        </div>
                      
                      <div 
                        className={`relative p-5 rounded-lg border ${formData.leftoverAction === 'expenses' ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-500' : 'bg-white border-gray-200 hover:bg-gray-50'} cursor-pointer transition-all flex flex-col items-center`}
                        onClick={() => setFormData({ ...formData, leftoverAction: 'expenses' })}
                      >
                        <div className="absolute top-3 right-3">
                          <div className={`w-5 h-5 rounded-full ${formData.leftoverAction === 'expenses' ? 'bg-purple-500' : 'bg-gray-200'} flex items-center justify-center`}>
                            {formData.leftoverAction === 'expenses' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                        <CreditCard className={`h-6 w-6 ${formData.leftoverAction === 'expenses' ? 'text-purple-600' : 'text-gray-500'}`} />
                      </div>
                        <p className={`text-center font-medium ${formData.leftoverAction === 'expenses' ? 'text-purple-700' : 'text-gray-700'}`}>
                          Add to Expenses
                        </p>
                        </div>
                      
                      <div 
                        className={`relative p-5 rounded-lg border ${formData.leftoverAction === 'investments' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500' : 'bg-white border-gray-200 hover:bg-gray-50'} cursor-pointer transition-all flex flex-col items-center`}
                        onClick={() => setFormData({ ...formData, leftoverAction: 'investments' })}
                      >
                        <div className="absolute top-3 right-3">
                          <div className={`w-5 h-5 rounded-full ${formData.leftoverAction === 'investments' ? 'bg-emerald-500' : 'bg-gray-200'} flex items-center justify-center`}>
                            {formData.leftoverAction === 'investments' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                        <TrendingUp className={`h-6 w-6 ${formData.leftoverAction === 'investments' ? 'text-emerald-600' : 'text-gray-500'}`} />
                      </div>
                        <p className={`text-center font-medium ${formData.leftoverAction === 'investments' ? 'text-emerald-700' : 'text-gray-700'}`}>
                          Add to Investments
                        </p>
                        </div>
                    </div>
                    
                    <div className="mt-4 rounded-lg bg-yellow-50 p-4 border border-yellow-100">
                      <div className="flex items-start">
                        <Info className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-yellow-700">
                          This setting determines where any remaining money goes after your income distribution. It's helpful when you have unexpected income or bonuses.
                        </p>
                      </div>
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

      {/* Minimum value dialog */}
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
                <XCircle className="h-5 w-5" />
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
                      You tried to set {attemptedField.replace("Percent", "")} to {attemptedValue}%
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
                    <span>
                      <strong>Meaningful impact:</strong> Allocations below 10% often don't make a significant difference to
                      your financial goals
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Balanced approach:</strong> The 10% rule ensures a meaningful distribution across your
                      financial priorities
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Total remains 100%:</strong> Your total allocation will always equal exactly 100%
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 shadow-sm">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-600" />
                  What are your options?
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  You can either set this category to the minimum 10% (recommended) or deactivate it completely by setting
                  other categories.
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
                  const updatedFormData = { ...formData }

                  // Set the attempted field to 10% minimum
                  ;(updatedFormData[attemptedField as keyof typeof formData] as number) = 10

                  // Get all fields
                  const allFields = ["savingsPercent", "expensesPercent", "investmentsPercent"] as const

                  // Get other fields that need to be adjusted
                  const otherFields = allFields.filter((field) => field !== attemptedField)

                  // We need to distribute the remaining 90% between the other two fields

                  // Calculate the current values of the other fields
                  const otherFieldsCurrentValues = otherFields.map((field) => Math.max(updatedFormData[field] || 0, 10))

                  // Calculate the current proportions of the other fields
                  const otherFieldsTotal = otherFieldsCurrentValues.reduce((sum, val) => sum + val, 0)

                  // If the other fields have the same value
                  if (otherFieldsCurrentValues[0] === otherFieldsCurrentValues[1]) {
                    // Distribute the remaining 90% equally
                    otherFields.forEach((field) => {
                      ;(updatedFormData[field] as number) = 45 // 90% ÷ 2 = 45%
                    })
                  } else {
                    // Distribute proportionally
                    const remainingPercentage = 90 // 100% - 10% set for the main field
                    const proportions = otherFieldsCurrentValues.map((val) => val / otherFieldsTotal)

                    otherFields.forEach((field, index) => {
                      const newValue = Math.round(remainingPercentage * proportions[index])
                      ;(updatedFormData[field] as number) = newValue
                    })

                    // Ensure total is exactly 100%
                    const totalAfterAdjustment = allFields.reduce((sum, field) => sum + (updatedFormData[field] || 0), 0)

                    if (totalAfterAdjustment !== 100) {
                      const diff = 100 - totalAfterAdjustment
                      // Apply the difference to the field with larger allocation
                      const fieldToAdjust =
                        otherFieldsCurrentValues[0] > otherFieldsCurrentValues[1] ? otherFields[0] : otherFields[1]
                      ;(updatedFormData[fieldToAdjust] as number) = (updatedFormData[fieldToAdjust] as number) + diff
                    }
                  }

                  setFormData(updatedFormData)
                  setShowMinimumDialog(false)
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

      {/* Maximum value dialog */}
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
                <XCircle className="h-5 w-5" />
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
                      You tried to set {attemptedField.replace("Percent", "")} to {attemptedValue}%
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
                    <span>
                      <strong>Balanced approach:</strong> Diversifying your allocation promotes financial stability
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Minimum thresholds:</strong> Other categories must maintain at least 10% each
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Total always 100%:</strong> Your allocation will automatically adjust to maintain a 100% total
                    </span>
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
                  const updatedFormData = { ...formData }

                  // Set the attempted field to 80%
                  ;(updatedFormData[attemptedField as keyof typeof formData] as number) = 80

                  // Get all fields
                  const allFields = ["savingsPercent", "expensesPercent", "investmentsPercent"] as const

                  // Get other fields that need to be adjusted
                  const otherFields = allFields.filter((field) => field !== attemptedField)

                  // Since we set one field to 80%, the remaining 20% must be divided between the other two fields
                  // Each must have at least 10%, which totals to exactly 20% minimum

                  // Calculate the current values of the other fields
                  const otherFieldsCurrentValues = otherFields.map((field) => Math.max(updatedFormData[field] || 0, 10))

                  // Calculate the current proportions of the other fields
                  const otherFieldsTotal = otherFieldsCurrentValues.reduce((sum, val) => sum + val, 0)

                  // If the other fields have the same value or are both at minimum
                  if (otherFieldsCurrentValues[0] === otherFieldsCurrentValues[1] || otherFieldsTotal <= 20) {
                    // Distribute the remaining 20% equally
                    otherFields.forEach((field) => {
                      ;(updatedFormData[field] as number) = 10
                    })
                  } else {
                    // Distribute proportionally while respecting the 10% minimum
                    const remainingPercentage = 20 // 100% - 80% set for the main field
                    const proportions = otherFieldsCurrentValues.map((val) => val / otherFieldsTotal)

                    otherFields.forEach((field, index) => {
                      let newValue = Math.round(remainingPercentage * proportions[index])
                      // Ensure minimum 10%
                      newValue = Math.max(10, newValue)
                      ;(updatedFormData[field] as number) = newValue
                    })

                    // Ensure total is exactly 100%
                    const totalAfterAdjustment = allFields.reduce((sum, field) => sum + (updatedFormData[field] || 0), 0)

                    if (totalAfterAdjustment !== 100) {
                      const diff = 100 - totalAfterAdjustment
                      // Apply the difference to the field with larger allocation
                      const fieldToAdjust =
                        otherFieldsCurrentValues[0] > otherFieldsCurrentValues[1] ? otherFields[0] : otherFields[1]
                      ;(updatedFormData[fieldToAdjust] as number) = (updatedFormData[fieldToAdjust] as number) + diff
                    }
                  }

                  setFormData(updatedFormData)
                  setShowMaximumDialog(false)
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
    </div>
  )
}
