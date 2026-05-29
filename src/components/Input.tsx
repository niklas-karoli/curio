import React from 'react';
import { cn } from '../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700 ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-xl border-2 border-gray-100 bg-white px-4 py-2 text-text-dark placeholder:text-gray-400 focus:border-secondary focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-300 focus:border-red-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500 ml-1">{error}</p>}
      </div>
    );
  }
);
