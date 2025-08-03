import { supabase } from '../app/supabaseClient';

// Get the Supabase project URL from environment variables
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  return url;
};

// Extract project reference from Supabase URL
const getProjectRef = (url: string) => {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    throw new Error('Invalid Supabase URL format');
  }
  return match[1];
};

// Get the Edge Function URL
const getEdgeFunctionUrl = () => {
  const supabaseUrl = getSupabaseUrl();
  const projectRef = getProjectRef(supabaseUrl);
  return `https://${projectRef}.functions.supabase.co/fetch-role`;
};

/**
 * Fetch user role using the Supabase Edge Function
 * @param userId - The user ID to fetch the role for
 * @returns Promise<{ role: string }>
 */
export const fetchUserRole = async (userId: string): Promise<{ role: string }> => {
  try {
    const functionUrl = getEdgeFunctionUrl();
    

    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching user role:', error);
    throw error;
  }
};

/**
 * Fetch user role with fallback to direct Supabase query
 * @param userId - The user ID to fetch the role for
 * @returns Promise<{ role: string }>
 */
export const fetchUserRoleWithFallback = async (userId: string): Promise<{ role: string }> => {
  try {
    // First try the Edge Function
    return await fetchUserRole(userId);
  } catch (error) {
    
    // Fallback to direct Supabase query
    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    const { data, error: supabaseError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (supabaseError) {
      throw supabaseError;
    }

    return { role: data?.role || 'staff' };
  }
}; 