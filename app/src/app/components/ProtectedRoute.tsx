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

  if (loading || !user || (requiredRole && user.role !== requiredRole)) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return <>{children}</>;
} 