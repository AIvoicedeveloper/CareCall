"use client";
import Link from "next/link";
import { useAuth } from "../authProvider";
import React from "react";

interface SidebarProps {
  className?: string;
}

function SidebarComponent({ className = "" }: SidebarProps) {
  const { user } = useAuth();
  
  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/alerts", label: "Alerts", icon: "🚨" },
    { href: "/patients", label: "Patients", icon: "👥" },
  ];

  const adminItems = [
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside 
      className={`w-64 bg-gray-900 text-white flex flex-col p-4 ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="text-2xl font-bold mb-8" role="banner">
        CareCall
      </div>
      <nav className="flex flex-col gap-4" role="menubar">
        {navigationItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className="hover:text-blue-400 focus:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset rounded px-2 py-1 transition-colors"
            role="menuitem"
            aria-label={`Navigate to ${item.label}`}
          >
            <span className="mr-2" aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        {user?.role === "admin" && adminItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className="hover:text-blue-400 focus:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset rounded px-2 py-1 transition-colors"
            role="menuitem"
            aria-label={`Navigate to ${item.label} (Admin only)`}
          >
            <span className="mr-2" aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

// Export memoized component for performance
export default React.memo(SidebarComponent); 