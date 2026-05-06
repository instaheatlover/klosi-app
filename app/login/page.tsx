"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">K</div>
          <div>
            <p className="text-white font-semibold text-lg leading-tight">Klosi</p>
            <p className="text-[#94A3B8] text-xs">AI Call Intelligence</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#131320] rounded-2xl p-8 border border-[#1E1E2E]">
          <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-[#94A3B8] text-sm mb-6">Sign in to your Klosi account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white placeholder-[#4F6080] focus:outline-none focus:border-indigo-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white placeholder-[#4F6080] focus:outline-none focus:border-indigo-500/60"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#94A3B8] mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300">Create one</Link>
        </p>
      </div>
    </div>
  );
}
