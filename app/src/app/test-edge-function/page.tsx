"use client";

import { useState } from 'react';
import { useAuth } from '../authProvider';
import { fetchUserRole } from '../../lib/fetchRole';

export default function TestEdgeFunction() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testEdgeFunction = async () => {
    if (!user?.id) {
      setTestResult('No user logged in');
      return;
    }

    setLoading(true);
    setTestResult('Testing Edge Function...');

    try {
      const result = await fetchUserRole(user.id);
      setTestResult(`✅ Edge Function test successful! Role: ${result.role}`);
    } catch (error) {
      setTestResult(`❌ Edge Function test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edge Function Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Current User</h2>
        {user ? (
          <div className="mb-4">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Current Role:</strong> {user.role}</p>
          </div>
        ) : (
          <p className="text-gray-600">No user logged in</p>
        )}

        <button
          onClick={testEdgeFunction}
          disabled={loading || !user}
          className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? 'Testing...' : 'Test Edge Function'}
        </button>

        {testResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <pre className="whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">About the Edge Function</h3>
        <p className="text-sm text-gray-700">
          This test calls the <code>fetch-role</code> Edge Function deployed on Supabase. 
          The function fetches user roles with proper CORS headers and includes fallback 
          functionality for better reliability.
        </p>
      </div>
    </div>
  );
} 