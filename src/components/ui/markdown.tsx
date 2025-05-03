import React from 'react';

interface MarkdownProps {
  content: string;
  className?: string;
}

// Simple markdown renderer as a fallback until dependencies are installed
export function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {/* 
        This component requires:
        npm install react-markdown react-syntax-highlighter --save
        
        And types:
        npm install @types/react-syntax-highlighter --save-dev
      */}
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
} 