"use client";
import { useAuth } from "../authProvider";
import React from "react";

interface TopbarProps {
  className?: string;
}

function TopbarComponent({ className = "" }: TopbarProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSignOut();
    }
  };

  // Get role-specific styling
  const getRoleStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'doctor':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get role-specific icon
  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '👑';
      case 'doctor':
        return '👨‍⚕️';
      case 'staff':
        return '👥';
      default:
        return '👤';
    }
  };

  return (
    <header 
      className={`bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center ${className}`}
      role="banner"
      aria-label="Application header"
    >
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-900">
          CareCall Dashboard
        </h1>
        {user && (
          <div className="ml-4 flex items-center gap-2">
            <span 
              className="text-sm text-gray-600"
              aria-label={`Current user: ${user.email}`}
            >
              Welcome, {user.email}
            </span>
            <span 
              className={`px-2 py-1 text-xs font-semibold rounded-full border ${getRoleStyle(user.role)} flex items-center gap-1`}
              aria-label={`User role: ${user.role}`}
            >
              <span aria-hidden="true">{getRoleIcon(user.role)}</span>
              {user.role}
            </span>
          </div>
        )}
      </div>
      
      {user && (
        <button
          onClick={handleSignOut}
          onKeyDown={handleKeyDown}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors"
          aria-label="Sign out of the application"
          role="button"
          tabIndex={0}
        >
          Sign Out
        </button>
      )}
    </header>
  );
}

// Export memoized component for performance
export default React.memo(TopbarComponent);