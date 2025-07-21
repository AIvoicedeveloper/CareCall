"use client";
import { useAuth } from "../authProvider";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
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
    </div>
  );
} 