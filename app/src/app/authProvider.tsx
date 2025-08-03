"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase, isSupabaseAvailable } from "./supabaseClient";
import { diagnoseSupabaseConnection } from "../lib/supabaseDiagnostics";

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

async function fetchUserRole(userId: string): Promise<string> {
  console.log('Fetching user role for:', userId);
  
  if (!supabase) {
    console.log('Supabase not configured, using default role');
    return 'staff';
  }
  
  try {
    // Add timeout for role fetch - increased to 5 seconds
    const rolePromise = supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    const roleTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Role fetch timeout')), 5000); // Increased timeout
    });
    
    const { data, error } = await Promise.race([rolePromise, roleTimeout]);
    
    console.log('Role fetch result:', { data, error });
    
    if (error) {
      // Check if it's a table doesn't exist error
      if (error.message.includes('relation "users" does not exist') || 
          error.message.includes('does not exist')) {
        console.log('Users table does not exist, using default role');
        return 'staff';
      }
      
      // Check if it's a network/timeout error
      if (error.message.includes('fetch') || 
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('aborted')) {
        console.log('Network error fetching role, using default role');
        return 'staff';
      }
      
      console.error('Error fetching user role:', error);
      return 'staff'; // Default fallback
    }
    
    if (!data) {
      console.log('No user data found, using default role');
      return 'staff';
    }
    
    console.log('User role found:', data.role);
    return data.role || 'staff';
  } catch (error: any) {
    console.error('Exception fetching user role:', error);
    
    // Handle specific timeout errors
    if (error.message && error.message.includes('timeout')) {
      console.log('Role fetch timed out, using default role');
      return 'staff';
    }
    
    return 'staff'; // Default fallback
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

  // Function to check and update auth state
  const checkAuthState = async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth.current) {
      console.log('Auth check already in progress, skipping...');
      return;
    }
    
    // Prevent too frequent auth checks (debounce)
    const now = Date.now();
    if (now - lastAuthCheck.current < 1000) {
      console.log('Auth check too recent, skipping...');
      return;
    }
    
    isCheckingAuth.current = true;
    lastAuthCheck.current = now;
    console.log('Checking auth state...');
    
    try {
      if (!supabase) {
        console.log('Supabase not configured, skipping auth check');
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Add timeout for session check
      const sessionPromise = supabase.auth.getSession();
      const sessionTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Session check timeout')), 5000); // Increased timeout
      });
      
      const sessionResult = await Promise.race([sessionPromise, sessionTimeout]);
      console.log('Session check result:', { session: !!sessionResult.data.session, error: sessionResult.error });
      
      if (sessionResult.error) {
        console.error('Error getting session:', sessionResult.error);
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (sessionResult.data.session?.user) {
        console.log('User found, fetching role...');
        
        try {
          // Add timeout for role fetch
          const rolePromise = fetchUserRole(sessionResult.data.session.user.id);
          const roleTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Role fetch timeout')), 5000); // Increased timeout
          });
          
          const role = await Promise.race([rolePromise, roleTimeout]);
          console.log('Role fetched:', role);
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
        console.log('No session found, setting user to null');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      // In case of timeout or error, assume no user is logged in
      setUser(null);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
      isCheckingAuth.current = false;
    }
  };

  // Handle visibility change and focus events with improved logic
  const handleVisibilityChange = useCallback(() => {
    if (typeof document !== 'undefined' && !document.hidden) {
      console.log('Tab became visible, checking if auth recheck is needed...');
      
      // Always recheck if not initialized yet
      if (!isInitialized.current) {
        console.log('Not initialized yet, skipping visibility recheck');
        return;
      }
      
      // Only recheck if we're not currently loading and it's been a while
      const now = Date.now();
      if (!isCheckingAuth.current && !loading && (now - lastAuthCheck.current > 5000)) {
        console.log('Tab became visible, rechecking auth state...');
        checkAuthState();
      } else {
        console.log('Skipping auth recheck - too recent, already loading, or already checking');
      }
    }
  }, [loading]);

  const handleFocus = useCallback(() => {
    console.log('Window focused, checking if auth recheck is needed...');
    
    // Always recheck if not initialized yet
    if (!isInitialized.current) {
      console.log('Not initialized yet, skipping focus recheck');
      return;
    }
    
    // Only recheck if we're not currently loading and it's been a while
    const now = Date.now();
    if (!isCheckingAuth.current && !loading && (now - lastAuthCheck.current > 5000)) {
      console.log('Window focused, rechecking auth state...');
      checkAuthState();
    } else {
      console.log('Skipping auth recheck - too recent, already loading, or already checking');
    }
  }, [loading]);

  // Force auth check on network recovery
  const handleOnline = useCallback(() => {
    console.log('Network connection restored, checking auth state...');
    if (isInitialized.current && !isCheckingAuth.current && !loading) {
      checkAuthState();
    }
  }, [loading]);

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!isSupabaseAvailable() || !supabase) {
      console.error('Supabase not configured - setting loading to false');
      setLoading(false);
      isInitialized.current = true; // Mark as initialized even in offline mode
      return;
    }

    console.log('Setting up auth provider...');

    // Test Supabase connectivity first
    const testConnection = async () => {
      if (!supabase) {
        console.log('Supabase not configured, skipping connection test');
        return false;
      }
      
      try {
        console.log('Testing Supabase connection...');
        
        // Try multiple connection test methods
        const testMethods = [
          // Method 1: Simple health check endpoint (no auth required)
          async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
              method: 'GET',
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
              },
              signal: AbortSignal.timeout(3000)
            });
            // 401 is expected for unauthorized access, but means the service is reachable
            return response.status === 401;
          },
          // Method 2: Supabase client getSession
          async () => {
            if (!supabase) return false;
            const { data, error } = await supabase.auth.getSession();
            // Even if there's an error, if it's not a network error, the connection works
            return !error || !error.message.includes('fetch');
          },
          // Method 3: Simple ping test (no auth required)
          async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/`, {
              method: 'OPTIONS',
              signal: AbortSignal.timeout(3000)
            });
            return response.status === 200 || response.status === 204;
          }
        ];

        // Try each method until one succeeds
        for (let i = 0; i < testMethods.length; i++) {
          try {
            console.log(`🔍 Trying connection test method ${i + 1}...`);
            const success = await testMethods[i]();
            if (success) {
              console.log(`✅ Connection test method ${i + 1} successful`);
              return true;
            }
          } catch (methodError) {
            console.log(`❌ Connection test method ${i + 1} failed:`, methodError);
            if (i === testMethods.length - 1) {
              throw methodError;
            }
          }
        }
        
        console.log('❌ All connection test methods failed');
        return false;
      } catch (error) {
        console.error('Supabase connection test exception:', error);
        
        // Run diagnostics if this is the first failure
        if (!diagnosticsRun.current) {
          console.log('🔍 Running Supabase diagnostics due to connection failure...');
          diagnosticsRun.current = true;
          await diagnoseSupabaseConnection();
        }
        
        return false;
      }
    };

    // Initialize auth provider with improved flow
    const initializeAuth = async () => {
      try {
        // Test connection first
        const isConnected = await testConnection();
        
        if (isConnected) {
          console.log('Connection test passed, proceeding with auth check...');
          
          // Set up auth state listener only after successful connection
          const { data: listener } = supabase!.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            // Only handle specific auth events
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
              if (session?.user) {
                try {
                  // Add timeout for role fetch in auth state change
                  const rolePromise = fetchUserRole(session.user.id);
                  const roleTimeout = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Role fetch timeout')), 5000);
                  });
                  
                  const role = await Promise.race([rolePromise, roleTimeout]);
                  setUser({
                    id: session.user.id,
                    email: session.user.email ?? '',
                    role,
                  });
                } catch (roleError) {
                  console.error('Role fetch failed in auth state change, using default role:', roleError);
                  // Use default role if role fetch fails
                  setUser({
                    id: session.user.id,
                    email: session.user.email ?? '',
                    role: 'staff',
                  });
                }
              } else {
                setUser(null);
              }
              setLoading(false);
            }
          });

          authListener.current = listener;
        } else {
          console.log('Connection test failed, proceeding with offline mode...');
        }

        // Always proceed with auth check, even if connection failed
        await checkAuthState();
        
        // Mark as initialized immediately after auth check
        isInitialized.current = true;
        console.log(`Auth provider initialized${isConnected ? '' : ' (offline mode)'}`);
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Force initialization even if everything fails
        setLoading(false);
        isInitialized.current = true;
        console.log('Auth provider initialized (fallback mode)');
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
  }, [handleVisibilityChange, handleFocus, handleOnline]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    setLoading(true);
    await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
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