// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, origin, referer, cache-control',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
}

Deno.serve(async (req) => {
  console.log('=== Edge Function Debug ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, origin, referer, cache-control',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true'
    };
    console.log('OPTIONS response headers:', corsHeaders);
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    console.log('Processing POST request...');
    const body = await req.json();
    console.log('Request body:', body);
    
    const { user_id } = body;

    if (!user_id) {
      console.log('Missing user_id, returning error');
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    console.log('Processing request for user_id:', user_id);
    
    // Query the database for the user's role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: corsHeaders
      })
    }
    
    console.log('Querying database for user role...');
    const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user_id}&select=role`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`
      }
    });

    if (!res.ok) {
      console.error('Database query failed:', res.status, res.statusText);
      return new Response(JSON.stringify({ error: 'Database query failed' }), {
        status: 500,
        headers: corsHeaders
      })
    }

    const data = await res.json();
    console.log('Database response:', data);
    
    const userRole = data[0]?.role || 'staff';
    const response = { role: userRole };
    
    console.log('Sending response:', response);
    console.log('Response headers:', corsHeaders);
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    })


  } catch (error) {
    console.error('Error in fetch-role function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-role' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"user_id":"your-user-id-here"}'

*/
