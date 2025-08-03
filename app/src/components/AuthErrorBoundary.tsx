"use client";
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

export function AuthErrorBoundary({ children }: AuthErrorBoundaryProps) {
  const handleAuthError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Authentication error caught:', error, errorInfo);
    
    // You can add specific auth error handling here
    // For example, redirect to login page or clear auth state
  };

  return (
    <ErrorBoundary 
      errorType="auth"
      onError={handleAuthError}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-bold">🔐</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Authentication Error
                </h3>
                <p className="text-sm text-gray-500">
                  There was a problem with your authentication. Please try signing in again.
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Go to sign in page"
              >
                Go to Sign In
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