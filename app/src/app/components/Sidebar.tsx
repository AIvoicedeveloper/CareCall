"use client";
import Link from "next/link";
import { useAuth } from "../authProvider";

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col p-4">
      <div className="text-2xl font-bold mb-8">CareCall</div>
      <nav className="flex flex-col gap-4">
        <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
        <Link href="/alerts" className="hover:text-blue-400">Alerts</Link>
        <Link href="/patients" className="hover:text-blue-400">Patients</Link>
        {user?.role === "admin" && (
          <Link href="/settings" className="hover:text-blue-400">Settings</Link>
        )}
      </nav>
    </aside>
  );
} 