"use client";
import { useAuth } from "../authProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

function ProtectedRouteComponent({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if not loading and we haven't already redirected
    if (!loading && !hasRedirected) {
      if (!user) {
        console.log('No user found, redirecting to sign-in');
        setHasRedirected(true);
        router.replace("/");
      } else if (requiredRole && user.role !== requiredRole) {
        console.log(`User role ${user.role} doesn't match required role ${requiredRole}, redirecting to dashboard`);
        setHasRedirected(true);
        router.replace("/dashboard");
      }
    }
  }, [user, loading, requiredRole, router, hasRedirected]);

  // Reset redirect flag when user changes
  useEffect(() => {
    setHasRedirected(false);
  }, [user?.id]);

  // Show loading only when auth is still loading
  if (loading) {
    return (
      <div 
        className="flex justify-center items-center h-screen"
        role="status"
        aria-live="polite"
        aria-label="Authentication status"
      >
        <div className="text-center">
          <div className="text-lg mb-4">Loading...</div>
          <div className="text-sm text-gray-500">Checking authentication...</div>
        </div>
      </div>
    );
  }

  // Don't render children if no user or wrong role
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return (
      <div 
        className="flex justify-center items-center h-screen"
        role="alert"
        aria-live="assertive"
        aria-label="Access denied"
      >
        <div className="text-center">
          <div className="text-lg mb-4">Access Denied</div>
          <div className="text-sm text-gray-500">
            {!user ? "Please sign in to continue" : "You don't have permission to access this page"}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Export memoized component for performance
export default React.memo(ProtectedRouteComponent); 