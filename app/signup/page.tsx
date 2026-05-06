"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-4">
        <div className="w-full max-w-sm bg-[#131320] rounded-2xl p-8 border border-[#1E1E2E] text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-400 text-xl">✓</span>
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Check your email</h2>
          <p className="text-[#94A3B8] text-sm">
            We sent a confirmation link to <span className="text-white">{email}</span>. Click it to activate your account.
          </p>
          <Link href="/login" className="block mt-6 text-indigo-400 text-sm hover:text-indigo-300">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold text-white mb-1">Create your account</h1>
          <p className="text-[#94A3B8] text-sm mb-6">Start analyzing calls in minutes</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white placeholder-[#4F6080] focus:outline-none focus:border-indigo-500/60"
              />
            </div>
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
                placeholder="Min. 8 characters"
                minLength={8}
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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#94A3B8] mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
