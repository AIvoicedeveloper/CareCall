"use client";
import { useAuth } from "../authProvider";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import DebugPanel from "../../components/DebugPanel";

export default function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Show loading when auth is still loading
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // Don't show layout if no user (will be handled by ProtectedRoute)
  if (!user) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
      <DebugPanel />
    </div>
  );
} 