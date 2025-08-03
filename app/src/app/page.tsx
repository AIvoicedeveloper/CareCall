"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "./authProvider";
import { supabase } from "./supabaseClient";

export default function Home() {
  const { user, loading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // Add an effect to clear email and password when user logs out
  useEffect(() => {
    if (!user) {
      setEmail("");
      setPassword("");
    }
  }, [user]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    }
    setSigningIn(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;
      if (data.user) {
        // Insert into users table with default role 'staff'
        const { error: insertError } = await supabase.from("users").insert([
          { id: data.user.id, email: data.user.email, name, role: "staff" },
        ]);
        if (insertError) throw insertError;
      }
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    }
    setSigningIn(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage("");
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-lg mb-4">Loading...</div>
        {!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
          <div className="text-red-600 text-center max-w-md">
            <p className="mb-2">⚠️ Supabase not configured</p>
            <p className="text-sm">Please check SUPABASE_SETUP.md for configuration instructions.</p>
          </div>
        ) : null}
      </div>
    );
  }

  if (!user) {
  return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">
          {showReset ? "Reset Password" : isSignUp ? "Sign Up" : "Sign In"}
        </h1>
        {showReset ? (
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-2 w-80">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 mt-2"
            >
              Send Reset Email
            </button>
            {resetMessage && <div className="text-green-600 text-sm mt-2">{resetMessage}</div>}
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </form>
        ) : (
          <>
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="flex flex-col gap-2 w-80">
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="border rounded px-3 py-2"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white rounded px-4 py-2 mt-2 disabled:opacity-50"
                disabled={signingIn}
              >
                {signingIn ? (isSignUp ? "Signing Up..." : "Signing In...") : isSignUp ? "Sign Up" : "Sign In"}
              </button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </form>
            <div className="flex flex-col items-center mt-4 gap-2">
              <button
                className="text-blue-600 hover:underline"
                onClick={() => { setIsSignUp(!isSignUp); setError(""); setResetMessage(""); }}
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
              <button
                className="text-blue-600 hover:underline"
                onClick={() => { setShowReset(true); setError(""); setResetMessage(""); }}
              >
                Forgot password?
              </button>
            </div>
          </>
        )}
        {showReset && (
          <button
            className="mt-4 text-blue-600 hover:underline"
            onClick={() => { setShowReset(false); setResetMessage(""); setError(""); }}
          >
            Back to Sign In
          </button>
        )}
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.email}</h1>
      <div className="mb-4">Role: {user.role}</div>
    </div>
  );
}
