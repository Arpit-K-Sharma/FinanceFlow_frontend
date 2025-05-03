import React from 'react';
import { format } from 'date-fns';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  compact?: boolean;
}

export function ChatMessage({ role, content, timestamp, compact = false }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${compact ? 'max-w-[85%]' : 'max-w-[80%]'}`}>
        {!isUser && !compact && (
          <div className="mr-2 flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        )}
        
        <div
          className={`
            rounded-lg p-3 
            ${isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-white border border-gray-200 text-gray-900'
            }
            ${compact ? 'text-sm' : 'text-base'}
          `}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          {timestamp && (
            <div className={`mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'} ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {format(timestamp, 'h:mm a')}
            </div>
          )}
        </div>
        
        {isUser && !compact && (
          <div className="ml-2 flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 