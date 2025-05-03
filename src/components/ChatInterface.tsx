import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ChatMessage, ChatMessageProps } from './ChatMessage';
import { Send, Bot } from 'lucide-react';
import { aiService } from '@/app/services/aiService';

interface ChatInterfaceProps {
  title?: string;
  placeholder?: string;
  onMessageSent?: (message: string) => void;
  aiServiceDown?: boolean;
  compact?: boolean;
}

export function ChatInterface({ 
  title = 'AI Assistant', 
  placeholder = 'Ask your financial assistant a question...',
  onMessageSent,
  aiServiceDown = false,
  compact = false
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your financial assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // Add user message
    const userMessage: ChatMessageProps = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    if (onMessageSent) {
      onMessageSent(userMessage.content);
    }

    try {
      // Only try to get a response if AI service is available
      if (!aiServiceDown) {
        // Convert to the format expected by the API
        const chatHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // Add the new user message
        chatHistory.push({
          role: userMessage.role,
          content: userMessage.content
        });
        
        // Call the AI service
        const response = await aiService.sendChatMessage({
          content: userMessage.content,
          chat_history: chatHistory
        });
        
        // Add the response to the chat
        const assistantMessage: ChatMessageProps = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // If AI service is down, show a fallback message
        const fallbackMessage: ChatMessageProps = {
          role: 'assistant',
          content: "I'm sorry, I'm currently unable to connect to my knowledge base. Please try again later.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessageProps = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${compact ? 'bg-transparent' : 'bg-gray-50 rounded-lg overflow-hidden border border-gray-200 shadow-sm'}`}>
      {/* Chat header - only show in full mode */}
      {!compact && title && (
        <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-medium">{title}</h3>
        </div>
      )}
      
      {/* Chat messages - explicitly set to take all available height and be scrollable */}
      <div 
        className={`${compact ? 'p-2 space-y-2' : 'p-4 space-y-4'} bg-gray-50 overflow-y-auto`} 
        style={{ 
          height: 'calc(100% - 60px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
        ref={messagesContainerRef}
      >
        {messages.map((message, index) => (
          <ChatMessage 
            key={index} 
            role={message.role} 
            content={message.content} 
            timestamp={message.timestamp}
            compact={compact}
          />
        ))}
        <div ref={messagesEndRef} className="h-2" />
      </div>
      
      {/* Input area - fixed at the bottom */}
      <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0" style={{ height: '60px' }}>
        <div className="flex items-end space-x-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`resize-none ${compact ? 'min-h-[40px] max-h-[40px]' : 'min-h-[40px] max-h-[40px]'}`}
            disabled={isLoading || aiServiceDown}
          />
          <Button 
            type="button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || aiServiceDown}
            className={compact ? "h-8 px-2" : "h-10 px-3"}
            size={compact ? "sm" : "default"}
          >
            <Send className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </Button>
        </div>
        
        {(aiServiceDown || isLoading) && (
          <div className="absolute bottom-1 left-3 text-xs">
            {aiServiceDown && (
              <span className="text-red-500">
                AI service is currently unavailable. Please try again later.
              </span>
            )}
            
            {isLoading && (
              <span className="text-gray-500">
                Thinking...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 