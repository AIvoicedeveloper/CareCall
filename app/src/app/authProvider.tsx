"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase, isSupabaseAvailable } from "./supabaseClient";
import { retryWithBackoff, isRetryableError, getAdaptiveTimeout, retrySupabaseOperation, testSupabaseConnectivity } from "../lib/connectionUtils";
import { fetchUserRoleWithFallback } from "../lib/fetchRole";

export type User = {
  id: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserRole(userId: string, roleCache: React.MutableRefObject<Map<string, { role: string; timestamp: number }>>): Promise<string> {
  try {
    // Check cache first (temporarily disabled to test Edge Function)
    const cached = roleCache.current.get(userId);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
      // Temporarily clear cache to test Edge Function
      roleCache.current.delete(userId);
    }
    
    // Use the Edge Function with fallback
    const { role } = await fetchUserRoleWithFallback(userId);
    
    // Cache the successful result
    roleCache.current.set(userId, { role, timestamp: Date.now() });
    
    return role;
  } catch (error) {
    console.error('❌ Role fetch failed:', error);
    
    // Fallback: try to determine role from user metadata or email
    return await determineRoleFromMetadata(userId, roleCache);
  }
}

// Helper function to determine role from metadata
async function determineRoleFromMetadata(userId: string, roleCache: React.MutableRefObject<Map<string, { role: string; timestamp: number }>>): Promise<string> {
  try {
    if (!supabase) {
      return 'staff';
    }
    
    // Try to get user metadata from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if user has admin email pattern or metadata
      const email = user.email?.toLowerCase() || '';
      const metadata = user.user_metadata || {};
      
      // Simple role determination logic
      if (email.includes('admin') || email.includes('administrator') || 
          metadata.role === 'admin' || metadata.role === 'administrator') {
        const role = 'admin';
        roleCache.current.set(userId, { role, timestamp: Date.now() });
        return role;
      }
      
      if (email.includes('doctor') || email.includes('physician') || 
          metadata.role === 'doctor' || metadata.role === 'physician') {
        const role = 'doctor';
        roleCache.current.set(userId, { role, timestamp: Date.now() });
        return role;
      }
    }
    
    const role = 'staff';
    roleCache.current.set(userId, { role, timestamp: Date.now() });
    return role;
  } catch (fallbackError) {
    console.error('❌ Fallback role determination failed:', fallbackError);
    return 'staff'; // Final fallback
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);
  const authListener = useRef<any>(null);
  const isCheckingAuth = useRef(false);
  const diagnosticsRun = useRef(false);
  const lastAuthCheck = useRef<number>(0);
  const authCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const roleCache = useRef<Map<string, { role: string; timestamp: number }>>(new Map());
  const authStatePromise = useRef<Promise<void> | null>(null);

  // Function to check and update auth state with proper debouncing
  const checkAuthState = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth.current) {
      return;
    }
    
    // Prevent too frequent auth checks (debounce)
    const now = Date.now();
    if (now - lastAuthCheck.current < 2000) { // Increased debounce to 2 seconds
      return;
    }
    
    // If there's already a pending auth check, wait for it
    if (authStatePromise.current) {
      await authStatePromise.current;
      return;
    }
    
    isCheckingAuth.current = true;
    lastAuthCheck.current = now;
    
    // Create a promise for this auth check
    authStatePromise.current = (async () => {
      try {
        if (!supabase) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Add timeout for session check with retry mechanism
        let sessionResult;
        
        try {
          sessionResult = await retrySupabaseOperation(async () => {
            if (!supabase) {
              throw new Error('Supabase not configured');
            }
            
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              throw error;
            }
            
            return { data, error: null };
          }, 'Session check', 1, 1000); // 1 retry, 1s base delay
        } catch (error) {
          console.error('Session check failed:', error);
          // Assume no session if all attempts fail
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (sessionResult?.error) {
          console.error('Error getting session:', sessionResult.error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (sessionResult?.data.session?.user) {
          try {
            const role = await fetchUserRole(sessionResult.data.session.user.id, roleCache);
            setUser({
              id: sessionResult.data.session.user.id,
              email: sessionResult.data.session.user.email ?? '',
              role,
            });
          } catch (roleError) {
            console.error('Role fetch failed, using default role:', roleError);
            // Use default role if role fetch fails
            setUser({
              id: sessionResult.data.session.user.id,
              email: sessionResult.data.session.user.email ?? '',
              role: 'staff',
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        // In case of timeout or error, assume no user is logged in
        setUser(null);
      } finally {

        setLoading(false);
        isCheckingAuth.current = false;
        authStatePromise.current = null;
      }
    })();
    
    await authStatePromise.current;
  }, []);

  // Handle visibility change and focus events with improved logic
  const handleVisibilityChange = useCallback(() => {
    if (typeof document !== 'undefined' && !document.hidden) {
      // Only recheck if not currently loading and it's been a while
      const now = Date.now();
      if (!isCheckingAuth.current && !loading && (now - lastAuthCheck.current > 15000)) { // Increased to 15 seconds
        checkAuthState();
      }
    }
  }, [loading, checkAuthState]);

  const handleFocus = useCallback(() => {
    // Only recheck if not currently loading and it's been a while
    const now = Date.now();
    if (!isCheckingAuth.current && !loading && (now - lastAuthCheck.current > 10000)) { // Increased to 10 seconds
      checkAuthState();
    }
  }, [loading, checkAuthState]);

  // Force auth check on network recovery
  const handleOnline = useCallback(() => {
    if (!isCheckingAuth.current && !loading) {
      checkAuthState();
    }
  }, [loading, checkAuthState]);

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!isSupabaseAvailable() || !supabase) {
      console.error('Supabase not configured - setting loading to false');
      setLoading(false);
      isInitialized.current = true;
      return;
    }

    // Initialize auth provider with improved flow
    const initializeAuth = async () => {
      try {
        // Set up auth state listener
        const { data: listener } = supabase!.auth.onAuthStateChange(async (event, session) => {
          // Only handle specific auth events
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
              try {
                const role = await fetchUserRole(session.user.id, roleCache);
                const userWithRole = {
                  id: session.user.id,
                  email: session.user.email ?? '',
                  role,
                };
                setUser(userWithRole);
              } catch (roleError) {
                console.error('Role fetch failed, using default role:', roleError);
                // Use default role if role fetch fails
                const userWithDefaultRole = {
                  id: session.user.id,
                  email: session.user.email ?? '',
                  role: 'staff',
                };
                setUser(userWithDefaultRole);
              }
            } else {
              setUser(null);
            }
            setLoading(false);
          }
        });

        authListener.current = listener;

        // Perform initial auth check
        await checkAuthState();
        
        // Mark as initialized
        isInitialized.current = true;

        
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Force initialization even if everything fails
        setLoading(false);
        isInitialized.current = true;

      }
    };

    // Start initialization
    initializeAuth();

    // Add visibility and focus event listeners (client-side only) with passive option
    if (typeof window !== 'undefined') {
      const options = { passive: true };
      document.addEventListener('visibilitychange', handleVisibilityChange, options);
      window.addEventListener('focus', handleFocus, options);
      window.addEventListener('online', handleOnline, options);
    }

    return () => {
      if (authListener.current) {
        authListener.current.subscription.unsubscribe();
      }
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [handleVisibilityChange, handleFocus, handleOnline, checkAuthState]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!supabase) {
      console.error('Supabase not configured for sign out');
      return;
    }
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}