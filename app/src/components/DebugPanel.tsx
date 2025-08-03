"use client";
import React, { useState } from 'react';
import { TabSwitchTester } from '../lib/tabSwitchTest';

interface DebugPanelProps {
  enabled?: boolean;
}

export default function DebugPanel({ enabled = process.env.NODE_ENV === 'development' }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  if (!enabled) return null;

  const runTests = async () => {
    setTesting(true);
    const tester = new TabSwitchTester();
    const results = await tester.runAllTests();
    setTestResults(results);
    setTesting(false);
  };

  const simulateTabSwitch = () => {
    console.log('🔄 Simulating tab switch...');
    
    // Hide tab
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true
    });
    document.dispatchEvent(new Event('visibilitychange'));
    
    setTimeout(() => {
      // Show tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });
      document.dispatchEvent(new Event('visibilitychange'));
      console.log('🔄 Tab switch simulation complete');
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-md text-sm z-50 shadow-lg hover:bg-blue-700"
        title="Open Debug Panel"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={simulateTabSwitch}
          className="w-full bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
        >
          🔄 Simulate Tab Switch
        </button>
        
        <button
          onClick={runTests}
          disabled={testing}
          className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {testing ? '🧪 Testing...' : '🧪 Run All Tests'}
        </button>
        
        <button
          onClick={() => {
            console.log('💣 Manual nuclear recovery triggered');
            window.location.reload();
          }}
          className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
        >
          💣 Nuclear Option (Reload)
        </button>
        
        {testResults.length > 0 && (
          <div className="mt-3 space-y-1">
            <h4 className="font-medium text-sm text-gray-700">Test Results:</h4>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`text-xs p-2 rounded ${
                  result.passed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.passed ? '✅' : '❌'} {result.testName}
                <div className="text-xs opacity-75">{result.message}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-3">
          Check browser console for detailed logs
        </div>
      </div>
    </div>
  );
}