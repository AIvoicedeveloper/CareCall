"use client";
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface DataErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

export function DataErrorBoundary({ children, onRetry }: DataErrorBoundaryProps) {
  const handleDataError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Data loading error caught:', error, errorInfo);
    
    // You can add specific data error handling here
    // For example, log to analytics or show user feedback
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <ErrorBoundary 
      errorType="data"
      onError={handleDataError}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Data Loading Error
                </h3>
                <p className="text-sm text-gray-500">
                  Unable to load the requested data. This might be a temporary issue.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Retry loading data"
              >
                Try Again
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                aria-label="Go back to previous page"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
} 