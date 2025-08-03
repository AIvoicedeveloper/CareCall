export async function quickConnectionTest() {
  const results = {
    success: false,
    method: '',
    error: '',
    responseTime: 0
  };

  const startTime = Date.now();

  try {
    // Test 1: Simple health check
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
      },
      signal: AbortSignal.timeout(1000) // Very quick test
    });

    results.responseTime = Date.now() - startTime;
    
    console.log('🔍 Quick connection test response status:', response.status);
    
    // Accept 401 (unauthorized) or 200 (success) as valid responses
    if (response.status === 401 || response.status === 200) {
      results.success = true;
      results.method = 'health_check';
      console.log('✅ Quick connection test passed (status:', response.status, ')');
    } else {
      results.error = `Unexpected status: ${response.status}`;
      console.log('❌ Quick connection test failed:', response.status);
    }
  } catch (error) {
    results.responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.error = errorMessage;
    console.log('❌ Quick connection test failed:', errorMessage);
  }

  return results;
} 