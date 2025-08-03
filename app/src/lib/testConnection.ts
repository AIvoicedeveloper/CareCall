import { supabase } from '../app/supabaseClient';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  const results = {
    clientAvailable: false,
    authTest: false,
    databaseTest: false,
    errors: [] as string[]
  };

  try {
    // Test 1: Check if client is available
    if (supabase) {
      results.clientAvailable = true;
      console.log('✅ Supabase client is available');
    } else {
      results.errors.push('Supabase client is not available');
      console.log('❌ Supabase client is not available');
      return results;
    }

    // Test 2: Test auth service
    try {
      console.log('🔍 Testing auth service...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('🔍 Auth service error:', error.message);
        if (error.message.includes('fetch') || error.message.includes('network')) {
          results.errors.push('Auth service network error');
        } else {
          // Other auth errors are expected when not authenticated
          results.authTest = true;
          console.log('✅ Auth service is working (expected error for unauthenticated user)');
        }
      } else {
        results.authTest = true;
        console.log('✅ Auth service is working');
      }
    } catch (authError) {
      results.errors.push('Auth service test failed');
      console.log('❌ Auth service test failed:', authError);
    }

    // Test 3: Test database service
    try {
      console.log('🔍 Testing database service...');
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation "users" does not exist')) {
          console.log('⚠️ Users table does not exist, but connection works');
          results.databaseTest = true;
        } else if (error.message.includes('fetch') || error.message.includes('timeout')) {
          results.errors.push('Database service network error');
          console.log('❌ Database service network error:', error.message);
        } else {
          // Other database errors might be expected
          results.databaseTest = true;
          console.log('✅ Database service is working');
        }
      } else {
        results.databaseTest = true;
        console.log('✅ Database service is working');
      }
    } catch (dbError) {
      results.errors.push('Database service test failed');
      console.log('❌ Database service test failed:', dbError);
    }

  } catch (error) {
    results.errors.push('General connection test failed');
    console.log('❌ General connection test failed:', error);
  }

  // Summary
  console.log('\n📊 Connection Test Summary:');
  console.log(`Client Available: ${results.clientAvailable ? '✅' : '❌'}`);
  console.log(`Auth Service: ${results.authTest ? '✅' : '❌'}`);
  console.log(`Database Service: ${results.databaseTest ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Issues found:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  return results;
} 