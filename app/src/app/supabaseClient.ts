import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are configured
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('Missing Supabase environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  console.error('Please configure your Supabase environment variables in .env.local');
  console.error('See SUPABASE_SETUP.md for setup instructions');
} else {
  console.log('Supabase configuration found:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  });
}

// Only create the client if environment variables are configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce' // Use PKCE flow for better security
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'carecall-dashboard'
        }
      },
      // Add fetch options for better error handling
      fetch: (url, options = {}) => {
        console.log('🔍 Supabase fetch request:', url);
        return fetch(url, {
          ...options,
          // Add timeout to prevent hanging requests - increased from 10s to 15s
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
      }
    })
  : null;

// Export a helper to check if Supabase is configured
export const isSupabaseAvailable = () => isSupabaseConfigured && supabase !== null;

// Add global error handling for network issues (client-side only)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network connection restored');
  });

  window.addEventListener('offline', () => {
    console.log('Network connection lost');
  });
}
