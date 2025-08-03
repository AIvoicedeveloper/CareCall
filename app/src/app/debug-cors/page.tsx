"use client";

import { useState } from 'react';
import { useAuth } from '../authProvider';

export default function DebugCors() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testEdgeFunction = async () => {
    if (!user?.id) {
      addResult('❌ No user logged in');
      return;
    }

    setLoading(true);
    addResult('🚀 Starting Edge Function CORS test...');

    try {
      const functionUrl = 'https://zalssfdlgltzquzouevs.functions.supabase.co/fetch-role';
      addResult(`🔗 Testing URL: ${functionUrl}`);

      // Test 1: Simple POST request
      addResult('📤 Test 1: Simple POST request');
      const response1 = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      addResult(`📥 Response 1 Status: ${response1.status}`);
      addResult(`📥 Response 1 Headers: ${JSON.stringify(Object.fromEntries(response1.headers.entries()))}`);
      
      if (response1.ok) {
        const data1 = await response1.json();
        addResult(`✅ Response 1 Data: ${JSON.stringify(data1)}`);
      } else {
        addResult(`❌ Response 1 Error: ${response1.statusText}`);
      }

      // Test 2: With additional headers
      addResult('📤 Test 2: With additional headers');
      const response2 = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      addResult(`📥 Response 2 Status: ${response2.status}`);
      addResult(`📥 Response 2 Headers: ${JSON.stringify(Object.fromEntries(response2.headers.entries()))}`);
      
      if (response2.ok) {
        const data2 = await response2.json();
        addResult(`✅ Response 2 Data: ${JSON.stringify(data2)}`);
      } else {
        addResult(`❌ Response 2 Error: ${response2.statusText}`);
      }

      // Test 3: OPTIONS preflight
      addResult('📤 Test 3: OPTIONS preflight request');
      try {
        const response3 = await fetch(functionUrl, {
          method: 'OPTIONS',
          headers: {
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
            'Origin': window.location.origin,
          },
        });

        addResult(`📥 Response 3 Status: ${response3.status}`);
        addResult(`📥 Response 3 Headers: ${JSON.stringify(Object.fromEntries(response3.headers.entries()))}`);
      } catch (error) {
        addResult(`❌ Response 3 Error: ${error}`);
      }

    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      addResult('🏁 Test completed');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edge Function CORS Debug</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current User</h2>
        {user ? (
          <div className="mb-4">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>
        ) : (
          <p className="text-gray-600">No user logged in</p>
        )}

        <div className="flex gap-4">
          <button
            onClick={testEdgeFunction}
            disabled={loading || !user}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Testing...' : 'Test Edge Function CORS'}
          </button>
          
          <button
            onClick={clearResults}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Clear Results
          </button>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="mb-1">{result}</div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 bg-yellow-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <p className="text-sm text-gray-700">
          This page tests the Edge Function with different request configurations to identify CORS issues.
          Check the browser's Network tab and Console for additional debugging information.
        </p>
      </div>
    </div>
  );
} 