"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!email || !password) {
        throw new Error("Please enter both email and password.");
      }

      if (isLogin) {
        // Handle Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Redirect on successful login
        router.push("/");
        router.refresh();
      } else {
        // Handle Sign Up
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // If email confirmation is required, session will be null
        if (data.session === null) {
          setSuccess("Account created successfully! Please check your email to confirm.");
          setEmail("");
          setPassword("");
        } else {
          // If auto-login is enabled after signup
          router.push("/");
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Decorative Blur Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-green/10 rounded-full blur-[100px] -z-10" />

      {/* Back to Home Link */}
      <Link 
        href="/" 
        className="absolute top-8 left-6 md:left-12 flex items-center gap-2 text-sm font-medium text-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Store
      </Link>

      <div className="w-full max-w-md">
        {/* Brand/Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-semibold tracking-tight text-foreground hover:text-accent-blue transition-colors">
            ambrosia
          </Link>
          <p className="text-secondary mt-3 text-sm">
            {isLogin ? "Welcome back to pure performance." : "Join the premium nutrition revolution."}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface/50 backdrop-blur-xl border border-border-custom rounded-2xl p-8 sm:p-10 shadow-2xl">
          
          {/* Toggle Tabs */}
          <div className="flex w-full bg-background/50 p-1 rounded-xl mb-8 border border-border-custom/50">
            <button
              onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                isLogin ? "bg-white text-black shadow-sm" : "text-secondary hover:text-foreground"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                !isLogin ? "bg-white text-black shadow-sm" : "text-secondary hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-500 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-green-500 font-medium leading-relaxed">{success}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-background/50 border border-border-custom rounded-xl px-4 py-3.5 text-foreground text-sm placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-foreground">Password</label>
                {isLogin && (
                  <a href="#" className="text-xs font-medium text-secondary hover:text-foreground transition-colors">
                    Forgot password?
                  </a>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                required
                className="w-full bg-background/50 border border-border-custom rounded-xl px-4 py-3.5 text-foreground text-sm placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-foreground text-background font-medium py-3.5 rounded-xl hover:bg-foreground/90 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? "Log In" : "Create Account"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
