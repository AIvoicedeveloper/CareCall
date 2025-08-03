import { useEffect, useRef, useCallback } from 'react';

interface UseLoadingTimeoutOptions {
  timeout?: number; // Timeout in milliseconds (default: 10 seconds)
  onTimeout?: () => void; // Callback when timeout occurs
  resetOnVisibilityChange?: boolean; // Reset loading on tab focus
  forceResetLoadingStates?: () => void; // Function to force reset all loading states
}

export function useLoadingTimeout({
  timeout = 10000, // 10 seconds default
  onTimeout,
  resetOnVisibilityChange = true,
  forceResetLoadingStates
}: UseLoadingTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartTime = useRef<number | null>(null);
  const isMonitoring = useRef(false);

  // Start monitoring loading state
  const startLoadingTimeout = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    loadingStartTime.current = Date.now();
    isMonitoring.current = true;

    timeoutRef.current = setTimeout(() => {
      if (isMonitoring.current) {
        // Force reset loading states
        if (forceResetLoadingStates) {
          forceResetLoadingStates();
        }
        
        // Call custom timeout handler
        if (onTimeout) {
          onTimeout();
        }
        
        isMonitoring.current = false;
      }
    }, timeout);
  }, [timeout, onTimeout, forceResetLoadingStates]);

  // Stop monitoring loading state
  const stopLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (isMonitoring.current) {
      const duration = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0;
    }
    
    isMonitoring.current = false;
    loadingStartTime.current = null;
  }, []);

  // Handle visibility change events
  const handleVisibilityChange = useCallback(() => {
    if (typeof document !== 'undefined' && !document.hidden && resetOnVisibilityChange) {
      if (isMonitoring.current) {
        const duration = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0;
        
        if (duration > 5000) { // If loading for more than 5 seconds
          if (forceResetLoadingStates) {
            forceResetLoadingStates();
          }
          
          stopLoadingTimeout();
        }
      }
    }
  }, [resetOnVisibilityChange, forceResetLoadingStates, stopLoadingTimeout]);

  // Set up visibility change listener
  useEffect(() => {
    if (resetOnVisibilityChange && typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [handleVisibilityChange, resetOnVisibilityChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    startLoadingTimeout,
    stopLoadingTimeout,
    isMonitoring: isMonitoring.current,
    getLoadingDuration: () => loadingStartTime.current ? Date.now() - loadingStartTime.current : 0
  };
}