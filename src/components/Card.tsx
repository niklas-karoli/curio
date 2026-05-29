import React from 'react';
import { cn } from '../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div className={cn('bg-white rounded-3xl shadow-sm p-6 border border-gray-50', className)}>
      {children}
    </div>
  );
};
