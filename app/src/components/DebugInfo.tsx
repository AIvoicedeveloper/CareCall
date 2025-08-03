"use client";
import { useAuth } from "../app/authProvider";
import { useVisibilityFocus } from "../lib/useVisibilityFocus";
import { useState, useEffect } from "react";

export default function DebugInfo() {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('online');
  const { isVisible, isFocused } = useVisibilityFocus({
    onVisibilityChange: () => console.log('Debug: Tab became visible'),
    onFocusChange: () => console.log('Debug: Window focused')
  });

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Prevent hydration mismatch by only rendering after client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // During SSR and initial render, show default values
  if (!isClient) {
    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs font-mono z-50">
        <div>Auth Loading: {loading ? 'true' : 'false'}</div>
        <div>User: {user ? user.email : 'null'}</div>
        <div>Network: online</div>
        <div>Visible: true</div>
        <div>Focused: false</div>
        <div>Time: --:--:--</div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs font-mono z-50">
      <div>Auth Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <div>Network: {networkStatus}</div>
      <div>Visible: {isVisible ? 'true' : 'false'}</div>
      <div>Focused: {isFocused ? 'true' : 'false'}</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
    </div>
  );
} 