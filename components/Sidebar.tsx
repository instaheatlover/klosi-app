"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const nav = [
  { label: "Home", href: "/" },
  { label: "Lead Scraper", href: "/leads" },
  { label: "Settings", href: "/settings" },
];
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const email = data.user.email ?? null;
        const name = data.user.user_metadata?.full_name as string | undefined;
        setUserEmail(email);
        if (name) {
          const parts = name.trim().split(" ");
          setInitials(parts.map((p: string) => p[0]).join("").toUpperCase().slice(0, 2));
        } else if (email) {
          setInitials(email[0].toUpperCase());
        }
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-[220px] min-h-screen flex-shrink-0 flex flex-col border-r border-[#1E1E2E] bg-[#131320]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-9 h-9 rounded-[10px] bg-indigo-500 flex items-center justify-center text-white font-bold text-base">K</div>
        <div>
          <p className="text-[15px] font-semibold text-white leading-tight">Klosi</p>
          <p className="text-[10px] text-[#94A3B8]">AI Call Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 mt-2">
        {nav.map(({ label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors relative ${
                active ? "bg-indigo-500/10 text-white" : "text-[#94A3B8] hover:text-white hover:bg-white/5"
              }`}
            >
              {active && <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-indigo-500" />}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign out */}
      <div className="mt-auto px-4 py-5 border-t border-[#1E1E2E]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-white truncate">
              {userEmail ?? "Loading..."}
            </p>
            <p className="text-[11px] text-[#94A3B8]">Sales Rep</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-[#94A3B8] hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
