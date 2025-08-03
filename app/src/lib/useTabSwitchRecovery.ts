import { useEffect, useRef, useCallback } from 'react';

interface UseTabSwitchRecoveryOptions {
  enabled?: boolean;
  maxStuckTime?: number; // Maximum time before triggering recovery (default: 15 seconds)
  reloadAsLastResort?: boolean; // Whether to reload page as last resort
  onRecoveryAttempt?: (method: string) => void; // Callback when recovery is attempted
}

export function useTabSwitchRecovery({
  enabled = true,
  maxStuckTime = 15000, // 15 seconds
  reloadAsLastResort = true,
  onRecoveryAttempt
}: UseTabSwitchRecoveryOptions = {}) {
  const lastTabVisibleTime = useRef<number>(Date.now());
  const wasHidden = useRef(false);
  const recoveryAttempted = useRef(false);
  const stuckCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Nuclear option: reload the page
  const reloadPage = useCallback(() => {
    console.error('🚨 NUCLEAR OPTION: Reloading page due to persistent loading state bug');
    
    if (onRecoveryAttempt) {
      onRecoveryAttempt('page-reload');
    }
    
    // Add a slight delay to allow logging
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, [onRecoveryAttempt]);

  // Check for stuck loading states
  const checkForStuckStates = useCallback(() => {
    if (!enabled) return;

    // Look for loading indicators in the DOM
    const loadingElements = document.querySelectorAll(
      '[data-testid*="loading"], .loading, [class*="loading"], [class*="Loading"]'
    );
    
    const loadingTexts = Array.from(loadingElements).filter(el => 
      el.textContent?.toLowerCase().includes('loading')
    );

    if (loadingTexts.length > 0) {
      const timeSinceVisible = Date.now() - lastTabVisibleTime.current;
      
      if (timeSinceVisible > maxStuckTime && !recoveryAttempted.current) {
        console.error(
          `🚨 STUCK LOADING DETECTED: ${loadingTexts.length} loading elements stuck for ${timeSinceVisible}ms`
        );
        
        recoveryAttempted.current = true;
        
        if (reloadAsLastResort) {
          console.log('💣 Initiating nuclear option: page reload');
          reloadPage();
        } else if (onRecoveryAttempt) {
          onRecoveryAttempt('stuck-detection');
        }
      }
    } else {
      // Reset recovery attempt flag if no loading states detected
      recoveryAttempted.current = false;
    }
  }, [enabled, maxStuckTime, reloadAsLastResort, reloadPage, onRecoveryAttempt]);

  // Handle visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (typeof document === 'undefined') return;

    if (document.hidden) {
      wasHidden.current = true;
      console.log('🙈 Tab hidden - marking for recovery monitoring');
    } else {
      lastTabVisibleTime.current = Date.now();
      
      if (wasHidden.current) {
        console.log('👀 Tab visible again - starting stuck state monitoring');
        wasHidden.current = false;
        recoveryAttempted.current = false;
        
        // Start checking for stuck states after tab becomes visible
        if (stuckCheckInterval.current) {
          clearInterval(stuckCheckInterval.current);
        }
        
        stuckCheckInterval.current = setInterval(checkForStuckStates, 2000); // Check every 2 seconds
        
        // Stop checking after maxStuckTime + buffer
        setTimeout(() => {
          if (stuckCheckInterval.current) {
            clearInterval(stuckCheckInterval.current);
            stuckCheckInterval.current = null;
          }
        }, maxStuckTime + 5000);
      }
    }
  }, [checkForStuckStates, maxStuckTime]);

  // Handle window focus (additional safety net)
  const handleFocus = useCallback(() => {
    if (wasHidden.current) {
      console.log('🎯 Window focused after being hidden - triggering visibility logic');
      handleVisibilityChange();
    }
  }, [handleVisibilityChange]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const options = { passive: true };
    document.addEventListener('visibilitychange', handleVisibilityChange, options);
    window.addEventListener('focus', handleFocus, options);

    // Initial check
    if (!document.hidden) {
      lastTabVisibleTime.current = Date.now();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      
      if (stuckCheckInterval.current) {
        clearInterval(stuckCheckInterval.current);
      }
    };
  }, [enabled, handleVisibilityChange, handleFocus]);

  // Manual recovery trigger
  const triggerRecovery = useCallback((force = false) => {
    if (force || !recoveryAttempted.current) {
      console.log('🔄 Manual recovery triggered');
      recoveryAttempted.current = true;
      
      if (onRecoveryAttempt) {
        onRecoveryAttempt('manual');
      }
      
      if (reloadAsLastResort && force) {
        reloadPage();
      }
    }
  }, [reloadAsLastResort, reloadPage, onRecoveryAttempt]);

  return {
    triggerRecovery,
    isMonitoring: stuckCheckInterval.current !== null,
    lastTabVisibleTime: lastTabVisibleTime.current
  };
}