"use client";
import { useAuth } from "../authProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/"); // Redirect to sign-in
      } else if (requiredRole && user.role !== requiredRole) {
        router.replace("/dashboard"); // Redirect unauthorized users
      }
    }
  }, [user, loading, requiredRole, router]);

  // Show loading only when auth is still loading
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Don't render children if no user or wrong role
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
} 