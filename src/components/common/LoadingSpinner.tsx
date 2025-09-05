import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium',
  message,
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className="glass-effect rounded-lg p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-white`}></div>
            <Sparkles className={`${sizeClasses[size]} absolute inset-0 text-blue-400 animate-pulse`} />
          </div>
        </div>
        {message && (
          <p className="text-white text-sm animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
