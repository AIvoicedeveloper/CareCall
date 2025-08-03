// Utility functions for handling connection issues and timeouts

export interface ConnectionTestResult {
  isConnected: boolean;
  responseTime: number;
  error?: string;
}

/**
 * Test Supabase connection with timeout
 */
export async function testSupabaseConnection(supabase: any): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  
  try {
    // Simple connection test - try to get a single row from a table that should exist
    const { data, error } = await Promise.race([
      supabase.from('users').select('id').limit(1),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
    ]);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      // Check if it's a table doesn't exist error (which means connection works)
      if (error.message.includes('relation "users" does not exist')) {
        return {
          isConnected: true,
          responseTime,
          error: 'Table does not exist'
        };
      }
      
      return {
        isConnected: false,
        responseTime,
        error: error.message
      };
    }
    
    return {
      isConnected: true,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      isConnected: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Simple connection test to check if Supabase is reachable
 */
export async function testSupabaseConnectivity(): Promise<{ isConnected: boolean; responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // Try a simple ping-like operation
    const response = await fetch('https://zalssfdlgltzquzouevs.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return { isConnected: true, responseTime };
    } else {
      return { 
        isConnected: false, 
        responseTime, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      isConnected: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get appropriate timeout based on connection quality
 */
export function getAdaptiveTimeout(baseTimeout: number = 5000): number {
  // You could implement logic here to adjust timeout based on:
  // - Previous connection test results
  // - Network conditions
  // - User's connection history
  
  // For now, return a reasonable default
  return baseTimeout;
}

/**
 * Exponential backoff delay
 */
export function getBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || '';
  
  // Network-related errors that are typically retryable
  const retryablePatterns = [
    'timeout',
    'network',
    'fetch',
    'aborted',
    'connection',
    'unavailable',
    'service unavailable',
    'too many requests',
    'rate limit'
  ];
  
  return retryablePatterns.some(pattern => 
    message.toLowerCase().includes(pattern)
  );
}

/**
 * Retry function with exponential backoff and timeout handling
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  timeoutMs: number = 10000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add explicit timeout to each attempt
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timeout (${timeoutMs}ms)`)), timeoutMs);
      });
      
      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        console.log('All retry attempts exhausted');
        throw lastError;
      }
      
      if (!isRetryableError(error)) {
        console.log('Non-retryable error, stopping retries');
        throw lastError;
      }
      
      const delay = getBackoffDelay(attempt, baseDelay);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Enhanced retry function specifically for Supabase operations
 */
export async function retrySupabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'Supabase operation',
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${operationName} attempt ${attempt + 1}/${maxRetries + 1}`);
      
      // Progressive timeout: 6s, 8s, 10s (to match Supabase client timeout)
      const timeoutMs = 6000 + (attempt * 2000);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${operationName} timeout (${timeoutMs}ms)`)), timeoutMs);
      });
      
      const result = await Promise.race([operation(), timeoutPromise]);
      console.log(`${operationName} succeeded on attempt ${attempt + 1}`);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      console.log(`${operationName} attempt ${attempt + 1} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        console.log(`All ${operationName} attempts exhausted`);
        throw lastError;
      }
      
      // Check if it's a table doesn't exist error (non-retryable)
      if (lastError.message.includes('relation "users" does not exist') || 
          lastError.message.includes('does not exist')) {
        console.log('Table does not exist, not retrying');
        throw lastError;
      }
      
      // Check if it's a non-retryable error
      if (!isRetryableError(error)) {
        console.log('Non-retryable error, stopping retries');
        throw lastError;
      }
      
      const delay = getBackoffDelay(attempt, baseDelay);
      console.log(`Retrying ${operationName} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
} 