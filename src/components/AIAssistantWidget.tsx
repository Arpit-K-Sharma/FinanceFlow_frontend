import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Bot, Sparkles, Send, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Textarea } from './ui/textarea';
import { useAIService } from '@/app/hooks/useAIService';

interface AIAssistantWidgetProps {
  className?: string;
}

export function AIAssistantWidget({ className = '' }: AIAssistantWidgetProps) {
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickResponse, setQuickResponse] = useState('');
  const router = useRouter();
  const { sendMessage } = useAIService();
  
  const suggestedPrompts = [
    "How can I reduce my monthly expenses?",
    "What's a good savings strategy for emergencies?",
    "How much should I invest each month?",
    "Tips for paying off debt faster",
  ];
  
  const handleQuickPrompt = async () => {
    if (!quickPrompt.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await sendMessage(quickPrompt);
      setQuickResponse(response);
    } catch (error) {
      console.error("Error sending quick prompt:", error);
      setQuickResponse("Sorry, I couldn't process your request at this time.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectSuggestion = (prompt: string) => {
    setQuickPrompt(prompt);
  };
  
  const handleFullAssistant = () => {
    router.push('/dashboard/assistant');
  };
  
  return (
    <Card className={`p-4 border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 w-full ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Header and Description - Left Column */}
        <div className="flex items-start gap-3 md:w-1/4">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Bot className="h-6 w-6 text-indigo-600" />
          </div>
          
          <div>
            <div className="flex items-center mb-1">
              <h3 className="font-medium text-indigo-900">AI Financial Assistant</h3>
              <Sparkles className="h-4 w-4 text-yellow-500 ml-2" />
            </div>
            
            <p className="text-sm text-indigo-700">
              Get personalized financial advice tailored to your situation.
            </p>
          </div>
        </div>
        
        {/* Interaction Area - Center/Right Column */}
        <div className="md:w-3/4">
          {/* Quick Prompt Input or Response */}
          {!quickResponse ? (
            <div className="flex flex-col">
              <div className="mb-3 flex">
                <Textarea
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  placeholder="Ask a quick financial question..."
                  className="resize-none min-h-[40px] text-sm bg-white"
                  disabled={isLoading}
                />
                <Button 
                  className="ml-2 mt-auto bg-indigo-600 hover:bg-indigo-700 p-2 h-10"
                  onClick={handleQuickPrompt}
                  disabled={!quickPrompt.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Suggested Prompts in a horizontal row */}
              <div className="mb-4 flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button 
                    key={index}
                    variant="ghost" 
                    size="sm" 
                    className="text-xs p-1.5 h-auto bg-indigo-100/50 text-indigo-700 hover:bg-indigo-100 flex-shrink-0"
                    onClick={() => handleSelectSuggestion(prompt)}
                  >
                    <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <div className="bg-white p-3 rounded-lg border border-indigo-100 text-sm text-gray-700 max-h-[150px] overflow-y-auto mb-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
                    <span className="text-gray-500">Thinking...</span>
                  </div>
                ) : (
                  quickResponse
                )}
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs flex-shrink-0 p-1 h-7 text-indigo-600"
                  onClick={() => setQuickResponse('')}
                >
                  Ask another question
                </Button>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white"
              onClick={handleFullAssistant}
            >
              <Bot className="h-4 w-4 mr-2" />
              Open AI Assistant
            </Button>
            
            <Link href="/dashboard/assistant?tab=advice">
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Get Financial Advice
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
} 