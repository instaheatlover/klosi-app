"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Home", href: "/" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] min-h-screen flex-shrink-0 flex flex-col border-r border-[#1E1E2E] bg-[#131320]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-9 h-9 rounded-[10px] bg-indigo-500 flex items-center justify-center text-white font-bold text-base">
          K
        </div>
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
                active
                  ? "bg-indigo-500/10 text-white"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/5"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-indigo-500" />
              )}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="mt-auto px-4 py-5 border-t border-[#1E1E2E] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          DZ
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-white truncate">D'alexander</p>
          <p className="text-[11px] text-[#94A3B8]">Sales Rep</p>
        </div>
      </div>
    </aside>
  );
}
