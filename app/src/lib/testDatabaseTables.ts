import { supabase } from '../app/supabaseClient';

export async function testDatabaseTables() {
  console.log('🔍 Testing database tables...');
  
  const results = {
    usersTableExists: false,
    availableTables: [] as string[],
    errors: [] as string[]
  };

  try {
    // Test 1: Try to access users table
    console.log('🔍 Testing users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
      if (usersError.message.includes('relation "users" does not exist')) {
        results.errors.push('Users table does not exist');
      } else {
        results.errors.push(`Users table error: ${usersError.message}`);
      }
    } else {
      results.usersTableExists = true;
      console.log('✅ Users table exists and is accessible');
      console.log('🔍 Users table data sample:', usersData);
    }

    // Test 2: Try to list all tables (this might not work with anon key)
    console.log('🔍 Testing table listing...');
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1);
      
      if (tablesError) {
        console.log('❌ Cannot list tables (expected with anon key):', tablesError.message);
      } else {
        console.log('✅ Can access system tables');
      }
    } catch (error) {
      console.log('❌ Table listing failed (expected):', error);
    }

    // Test 3: Try to access auth.users (if it exists)
    console.log('🔍 Testing auth.users table...');
    try {
      const { data: authUsersData, error: authUsersError } = await supabase
        .from('auth.users')
        .select('*')
        .limit(1);
      
      if (authUsersError) {
        console.log('❌ auth.users table error:', authUsersError.message);
      } else {
        console.log('✅ auth.users table exists');
        console.log('🔍 auth.users data sample:', authUsersData);
      }
    } catch (error) {
      console.log('❌ auth.users table access failed:', error);
    }

  } catch (error: any) {
    results.errors.push(`General database test error: ${error.message}`);
    console.log('❌ General database test error:', error);
  }

  // Summary
  console.log('\n📊 Database Tables Test Summary:');
  console.log(`Users Table Exists: ${results.usersTableExists ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Issues found:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  return results;
} 