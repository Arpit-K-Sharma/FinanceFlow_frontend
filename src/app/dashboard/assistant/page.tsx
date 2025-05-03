'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatInterface } from '@/components/ChatInterface';
import { FinancialAdvice } from '@/components/FinancialAdvice';
import { aiService, FinancialAdvice as FinancialAdviceType } from '@/app/services/aiService';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, RefreshCw, Bot, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'advice' ? 'advice' : 'chat');
  const [aiServiceStatus, setAiServiceStatus] = useState<boolean | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [financialAdvice, setFinancialAdvice] = useState<FinancialAdviceType | null>(null);
  
  // Check AI service status on component mount
  useEffect(() => {
    checkAiService();
  }, []);
  
  // Update activeTab when URL query param changes
  useEffect(() => {
    if (tabParam === 'advice') {
      setActiveTab('advice');
    } else if (tabParam === 'chat') {
      setActiveTab('chat');
    }
  }, [tabParam]);
  
  // Function to check AI service availability
  const checkAiService = async () => {
    try {
      const isAvailable = await aiService.checkAIHealth();
      setAiServiceStatus(isAvailable);
    } catch (error) {
      console.error('Error checking AI service:', error);
      setAiServiceStatus(false);
    }
  };
  
  // Function to get financial advice
  const getFinancialAdvice = async (question?: string) => {
    setIsLoadingAdvice(true);
    try {
      const advice = await aiService.getFinancialAdvice({
        message: question
      });
      setFinancialAdvice(advice);
    } catch (error) {
      console.error('Error getting financial advice:', error);
    } finally {
      setIsLoadingAdvice(false);
    }
  };
  
  // Handle getting specific advice based on user question
  const handleGetSpecificAdvice = () => {
    if (specificQuestion.trim()) {
      getFinancialAdvice(specificQuestion);
      setSpecificQuestion('');
    }
  };
  
  // Handle when the user presses Enter in the input field
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGetSpecificAdvice();
    }
  };
  
  return (
    <div className="container mx-auto p-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">AI Financial Assistant</h1>
        <p className="text-gray-600">
          Get personalized financial advice and chat with your AI assistant about your finances.
        </p>
      </div>
      
      {/* AI Service Status */}
      {aiServiceStatus === false && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200 text-red-800 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">AI Service Unavailable</p>
            <p className="text-sm">
              We're having trouble connecting to our AI service. Some features may be limited.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto"
            onClick={checkAiService}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Card>
      )}
      
      <Tabs 
        defaultValue="chat" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
          <TabsTrigger value="advice">Financial Advice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-250px)] max-h-[550px]">
            <ChatInterface 
              title="Financial Chat Assistant"
              placeholder="Ask about your finances, investments, or for financial advice..."
              aiServiceDown={aiServiceStatus === false}
              onMessageSent={() => {}}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="advice" className="space-y-4">
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-indigo-600" />
              <h3 className="font-medium">Get Personalized Financial Advice</h3>
            </div>
            
            <div className="mb-2 text-sm text-gray-600">
              Ask a specific financial question or get general advice based on your financial data.
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="What's the best way to save for retirement?"
                value={specificQuestion}
                onChange={(e) => setSpecificQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoadingAdvice || aiServiceStatus === false}
                className="flex-1"
              />
              <Button
                onClick={handleGetSpecificAdvice}
                disabled={!specificQuestion.trim() || isLoadingAdvice || aiServiceStatus === false}
              >
                <Send className="h-4 w-4 mr-2" />
                Get Advice
              </Button>
            </div>
          </Card>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            {!financialAdvice && !isLoadingAdvice ? (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 text-indigo-200 mx-auto mb-4" />
                <h3 className="font-medium text-gray-800 mb-2">No Advice Generated Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Get personalized financial advice based on your current financial data. Ask a specific question or get general advice.
                </p>
                <Button 
                  onClick={() => getFinancialAdvice()} 
                  disabled={aiServiceStatus === false}
                >
                  Get General Advice
                </Button>
              </div>
            ) : (
              <>
                {financialAdvice && (
                  <FinancialAdvice
                    advice={financialAdvice}
                    isLoading={isLoadingAdvice}
                    onAskForMore={() => setActiveTab('chat')}
                  />
                )}
                
                {isLoadingAdvice && !financialAdvice && (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Generating personalized financial advice...</p>
                    <p className="text-xs mt-2">This may take a moment as we analyze your financial data</p>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 