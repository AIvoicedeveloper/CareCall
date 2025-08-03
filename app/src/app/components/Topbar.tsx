"use client";
import { useAuth } from "../authProvider";
import { useState } from "react";

export default function Topbar() {
  const { user, signOut } = useAuth();
  const [signOutLoading, setSignOutLoading] = useState(false);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setSignOutLoading(false);
    }
  };

  return (
    <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
      <div className="font-semibold text-lg">CareCall Dashboard</div>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-gray-700">{user.email}</span>
          <span className="bg-gray-200 text-gray-800 rounded px-2 py-1 text-xs font-semibold">{user.role}</span>
          <button
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="bg-gray-800 text-white rounded px-3 py-1 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signOutLoading ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      )}
    </header>
  );
} 