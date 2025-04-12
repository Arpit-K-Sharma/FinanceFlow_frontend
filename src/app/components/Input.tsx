'use client';

import { useState } from 'react';

interface InputProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}

export const Input = ({
  label,
  type,
  value,
  onChange,
  required = false,
  error,
  icon,
  placeholder
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div
        className={`relative rounded-md shadow-sm transition-all duration-200 ${
          isFocused
            ? 'ring-2 ring-indigo-500'
            : error
            ? 'ring-2 ring-red-500'
            : ''
        }`}
      >
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`block w-full rounded-md border-gray-300 ${
            icon ? 'pl-10' : 'pl-3'
          } pr-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none sm:text-sm ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'focus:border-indigo-500'
          }`}
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}; 