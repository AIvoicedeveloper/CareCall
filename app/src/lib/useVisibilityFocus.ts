import { useEffect, useRef, useCallback } from 'react';

interface UseVisibilityFocusOptions {
  onVisibilityChange?: (isVisible: boolean) => void;
  onFocusChange?: (isFocused: boolean) => void;
  enableRecovery?: boolean;
}

export function useVisibilityFocus({
  onVisibilityChange,
  onFocusChange,
  enableRecovery = true
}: UseVisibilityFocusOptions = {}) {
  const isVisible = useRef(true);
  const isFocused = useRef(true);
  const lastVisibilityChange = useRef<number>(Date.now());

  // Handle visibility change with error recovery
  const handleVisibilityChange = useCallback(() => {
    try {
      const wasVisible = isVisible.current;
      isVisible.current = !document.hidden;
      lastVisibilityChange.current = Date.now();

      if (isVisible.current !== wasVisible) {
        if (onVisibilityChange) {
          try {
            onVisibilityChange(isVisible.current);
          } catch (error) {
            console.error('Error in visibility change handler:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error handling visibility change:', error);
    }
  }, [onVisibilityChange]);

  // Handle focus/blur with error recovery
  const handleFocusChange = useCallback(() => {
    try {
      const wasFocused = isFocused.current;
      isFocused.current = document.hasFocus();

      if (isFocused.current !== wasFocused) {
        if (onFocusChange) {
          try {
            onFocusChange(isFocused.current);
          } catch (error) {
            console.error('Error in focus change handler:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error handling focus change:', error);
    }
  }, [onFocusChange]);

  // Recovery mechanism for stuck states
  const checkForStuckState = useCallback(() => {
    if (!enableRecovery) return;

    const timeSinceVisibilityChange = Date.now() - lastVisibilityChange.current;
    
    // If we haven't had a visibility change in 30 seconds, something might be stuck
    if (timeSinceVisibilityChange > 30000) {
      // Force a visibility check
      try {
        const currentHidden = document.hidden;
        if (isVisible.current !== !currentHidden) {
          isVisible.current = !currentHidden;
          lastVisibilityChange.current = Date.now();
          
          if (onVisibilityChange) {
            onVisibilityChange(isVisible.current);
          }
        }
      } catch (error) {
        console.error('Error in stuck state recovery:', error);
      }
    }
  }, [enableRecovery, onVisibilityChange]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Set up event listeners with error handling
    const safeAddEventListener = (event: string, handler: EventListener) => {
      try {
        document.addEventListener(event, handler, { passive: true });
      } catch (error) {
        console.error(`Error adding ${event} listener:`, error);
      }
    };

    const safeRemoveEventListener = (event: string, handler: EventListener) => {
      try {
        document.removeEventListener(event, handler);
      } catch (error) {
        console.error(`Error removing ${event} listener:`, error);
      }
    };

    // Add event listeners
    safeAddEventListener('visibilitychange', handleVisibilityChange);
    safeAddEventListener('focus', handleFocusChange);
    safeAddEventListener('blur', handleFocusChange);

    // Set up recovery interval
    const recoveryInterval = setInterval(checkForStuckState, 10000); // Check every 10 seconds

    // Initial state check
    try {
      isVisible.current = !document.hidden;
      isFocused.current = document.hasFocus();
    } catch (error) {
      console.error('Error checking initial state:', error);
    }

    return () => {
      safeRemoveEventListener('visibilitychange', handleVisibilityChange);
      safeRemoveEventListener('focus', handleFocusChange);
      safeRemoveEventListener('blur', handleFocusChange);
      clearInterval(recoveryInterval);
    };
  }, [handleVisibilityChange, handleFocusChange, checkForStuckState]);

  return {
    isVisible: isVisible.current,
    isFocused: isFocused.current,
    lastVisibilityChange: lastVisibilityChange.current
  };
} 