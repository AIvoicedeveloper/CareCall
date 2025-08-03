import { supabase } from '../app/supabaseClient';

export async function diagnoseSupabaseConnection() {
  const results = {
    environmentVariables: false,
    networkConnectivity: false,
    supabaseReachability: false,
    authService: false,
    databaseService: false,
    corsIssues: false,
    timeoutIssues: false,
    errors: [] as string[]
  };

  console.log('🔍 Starting comprehensive Supabase connection diagnostics...');

  // 1. Check environment variables
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (url && key) {
      results.environmentVariables = true;
      console.log('✅ Environment variables are configured');
      console.log('🔍 URL format check:', url.includes('supabase.co') ? 'Valid' : 'Suspicious');
    } else {
      results.errors.push('Environment variables are missing');
      console.log('❌ Environment variables are missing');
    }
  } catch (error) {
    results.errors.push('Failed to check environment variables');
  }

  // 2. Test basic network connectivity
  try {
    const response = await fetch('https://httpbin.org/get', { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      results.networkConnectivity = true;
      console.log('✅ Basic network connectivity is working');
    } else {
      results.errors.push('Basic network connectivity failed');
    }
  } catch (error) {
    results.errors.push('Network connectivity test failed');
    console.log('❌ Network connectivity test failed:', error);
  }

  // 3. Test Supabase URL reachability with different methods
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      // Test 1: Basic reachability
      const basicResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        },
        signal: AbortSignal.timeout(5000)
      });
      
      console.log('🔍 Basic reachability test status:', basicResponse.status);
      
      if (basicResponse.status === 401) {
        // 401 is expected for unauthorized access, but means the service is reachable
        results.supabaseReachability = true;
        console.log('✅ Supabase service is reachable (401 expected)');
      } else if (basicResponse.ok) {
        results.supabaseReachability = true;
        console.log('✅ Supabase service is reachable');
      } else {
        results.errors.push(`Supabase service returned status: ${basicResponse.status}`);
      }

      // Test 2: CORS preflight check
      try {
        const corsResponse = await fetch(`${supabaseUrl}/auth/v1/`, {
          method: 'OPTIONS',
          signal: AbortSignal.timeout(3000)
        });
        console.log('🔍 CORS preflight test status:', corsResponse.status);
        if (corsResponse.status === 200 || corsResponse.status === 204) {
          console.log('✅ CORS preflight successful');
        } else {
          results.corsIssues = true;
          console.log('⚠️ CORS preflight returned:', corsResponse.status);
        }
      } catch (corsError) {
        results.corsIssues = true;
        console.log('❌ CORS preflight failed:', corsError);
      }
    } else {
      results.errors.push('Supabase URL is not configured');
    }
  } catch (error) {
    results.errors.push('Supabase service is not reachable');
    console.log('❌ Supabase service is not reachable:', error);
  }

  // 4. Test auth service specifically with different approaches
  if (supabase) {
    try {
      console.log('🔍 Testing auth service with getSession...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('🔍 Auth service error details:', error);
        if (error.message.includes('fetch') || error.message.includes('network')) {
          results.errors.push('Auth service network error');
          results.timeoutIssues = true;
        } else if (error.message.includes('timeout')) {
          results.timeoutIssues = true;
          results.errors.push('Auth service timeout');
        } else {
          // Other auth errors are expected when not authenticated
          results.authService = true;
          console.log('✅ Auth service is working (expected error for unauthenticated user)');
        }
      } else {
        results.authService = true;
        console.log('✅ Auth service is working');
      }
    } catch (error) {
      results.errors.push('Auth service test failed');
      console.log('❌ Auth service test failed:', error);
    }

    // Test 2: Try a simpler auth endpoint
    try {
      console.log('🔍 Testing auth endpoint directly...');
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/`, {
        method: 'OPTIONS',
        signal: AbortSignal.timeout(5000)
      });
      
      console.log('🔍 Direct auth endpoint status:', authResponse.status);
      if (authResponse.status === 200 || authResponse.status === 204) {
        console.log('✅ Direct auth endpoint is reachable');
      } else {
        console.log('⚠️ Direct auth endpoint returned:', authResponse.status);
      }
    } catch (directError) {
      console.log('❌ Direct auth endpoint failed:', directError);
    }
  } else {
    results.errors.push('Supabase client not available');
  }

  // 5. Test database service
  if (supabase) {
    try {
      // Use a simpler test that doesn't require specific table access
      const { data, error } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('fetch') || error.message.includes('timeout')) {
          results.errors.push('Database service network error');
          results.timeoutIssues = true;
        } else if (error.message.includes('relation "_supabase_migrations" does not exist')) {
          // This is expected - the table doesn't exist but connection works
          results.databaseService = true;
          console.log('✅ Database service is working (connection successful)');
        } else {
          // Other database errors might be expected
          results.databaseService = true;
          console.log('✅ Database service is working');
        }
      } else {
        results.databaseService = true;
        console.log('✅ Database service is working');
      }
    } catch (error) {
      results.errors.push('Database service test failed');
      console.log('❌ Database service test failed:', error);
    }
  }

  // Summary with recommendations
  console.log('\n📊 Comprehensive Supabase Diagnostics Summary:');
  console.log(`Environment Variables: ${results.environmentVariables ? '✅' : '❌'}`);
  console.log(`Network Connectivity: ${results.networkConnectivity ? '✅' : '❌'}`);
  console.log(`Supabase Reachability: ${results.supabaseReachability ? '✅' : '❌'}`);
  console.log(`Auth Service: ${results.authService ? '✅' : '❌'}`);
  console.log(`Database Service: ${results.databaseService ? '✅' : '❌'}`);
  console.log(`CORS Issues: ${results.corsIssues ? '⚠️' : '✅'}`);
  console.log(`Timeout Issues: ${results.timeoutIssues ? '⚠️' : '✅'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Issues found:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  // Provide specific recommendations
  console.log('\n💡 Recommendations:');
  if (results.timeoutIssues) {
    console.log('  - Try increasing timeout values in your connection tests');
    console.log('  - Check if your network has strict firewall rules');
    console.log('  - Try using a different network connection');
  }
  if (results.corsIssues) {
    console.log('  - Check if your Supabase project has proper CORS settings');
    console.log('  - Verify your project URL is correct');
  }
  if (!results.authService && results.supabaseReachability) {
    console.log('  - Auth service might be having issues, try again in a few minutes');
    console.log('  - Check your Supabase project status at https://status.supabase.com');
  }

  return results;
} 