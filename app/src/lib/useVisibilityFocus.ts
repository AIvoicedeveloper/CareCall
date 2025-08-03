import { useEffect, useRef, useCallback, useState } from 'react';

interface UseVisibilityFocusOptions {
  onVisibilityChange?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  debounceMs?: number;
  enabled?: boolean;
  minIntervalMs?: number; // Minimum time between consecutive calls
}

export function useVisibilityFocus({
  onVisibilityChange,
  onFocus,
  onBlur,
  debounceMs = 100,
  enabled = true,
  minIntervalMs = 1000
}: UseVisibilityFocusOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const [isClient, setIsClient] = useState(false);
  const lastCallTime = useRef<{ [key: string]: number }>({});

  const debouncedCallback = useCallback((callback: () => void, callbackName: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!enabled || !isInitialized.current) return;
      
      // Prevent too frequent calls of the same type
      const now = Date.now();
      const lastCall = lastCallTime.current[callbackName] || 0;
      
      if (now - lastCall >= minIntervalMs) {
        lastCallTime.current[callbackName] = now;
        callback();
      } else {
        console.log(`Skipping ${callbackName} - too frequent (${now - lastCall}ms ago)`);
      }
    }, debounceMs);
  }, [debounceMs, enabled, minIntervalMs]);

  const handleVisibilityChange = useCallback(() => {
    if (typeof document !== 'undefined' && !document.hidden && onVisibilityChange) {
      console.log('Tab became visible');
      debouncedCallback(onVisibilityChange, 'visibilityChange');
    }
  }, [onVisibilityChange, debouncedCallback]);

  const handleFocus = useCallback(() => {
    if (onFocus) {
      console.log('Window focused');
      debouncedCallback(onFocus, 'focus');
    }
  }, [onFocus, debouncedCallback]);

  const handleBlur = useCallback(() => {
    if (onBlur) {
      console.log('Window blurred');
      debouncedCallback(onBlur, 'blur');
    }
  }, [onBlur, debouncedCallback]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Add passive event listeners for better performance
    const options = { passive: true };
    document.addEventListener('visibilitychange', handleVisibilityChange, options);
    window.addEventListener('focus', handleFocus, options);
    window.addEventListener('blur', handleBlur, options);

    // Mark as initialized after a short delay
    const initTimeout = setTimeout(() => {
      isInitialized.current = true;
      console.log('useVisibilityFocus initialized');
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      clearTimeout(initTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      // Reset state
      isInitialized.current = false;
      lastCallTime.current = {};
    };
  }, [enabled, handleVisibilityChange, handleFocus, handleBlur]);

  // Return consistent values during SSR
  if (!isClient) {
    return {
      isVisible: true,
      hasFocus: false,
      isInitialized: false
    };
  }

  return {
    isVisible: typeof document !== 'undefined' ? !document.hidden : true,
    hasFocus: typeof document !== 'undefined' ? document.hasFocus() : false,
    isInitialized: isInitialized.current
  };
} 