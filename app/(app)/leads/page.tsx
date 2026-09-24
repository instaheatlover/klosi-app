"use client";
import { useState, useEffect } from "react";

type Lead = {
  name: string;
  phone: string;
  website: string;
  address: string;
};

const STORAGE_KEY = "klosi_leads";

function toCsv(rows: Lead[]) {
  const header = ["Name", "Phone", "Website", "Address"];
  const escape = (val: string) => `"${(val || "").replace(/"/g, '""')}"`;
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [escape(r.name), escape(r.phone), escape(r.website), escape(r.address)].join(",")
    );
  }
  return lines.join("\n");
}

// Tab-separated values paste cleanly into Google Sheets / Excel, with
// each field landing in its own cell.
function toTsv(rows: Lead[]) {
  const clean = (val: string) => (val || "").replace(/[\t\n\r]+/g, " ").trim();
  const header = ["Name", "Phone", "Website", "Address"];
  const lines = [header.join("\t")];
  for (const r of rows) {
    lines.push(
      [clean(r.name), clean(r.phone), clean(r.website), clean(r.address)].join("\t")
    );
  }
  return lines.join("\n");
}

// Used to skip exact duplicates when stacking new search results.
function leadKey(l: Lead) {
  return [l.name, l.phone, l.website, l.address].join("|").toLowerCase();
}

export default function LeadsPage() {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load any previously saved leads on first render so the running list
  // survives page reloads and navigating away and back.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setLeads(parsed);
      }
    } catch {
      // ignore corrupt/unavailable storage
    }
    setHydrated(true);
  }, []);

  // Persist the running list whenever it changes (but not before the
  // initial load has run, or we'd overwrite saved leads with []).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch {
      // ignore storage failures (private mode / quota)
    }
  }, [leads, hydrated]);

  const canSearch = businessType.trim() && location.trim() && !loading;

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setLastAdded(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: businessType, location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed.");
      const incoming: Lead[] = data.results || [];
      // Stack the new batch on top of what's already saved, skipping any
      // exact duplicates that are already in the list.
      const seen = new Set(leads.map(leadKey));
      const fresh = incoming.filter((l) => !seen.has(leadKey(l)));
      setLeads((prev) => [...prev, ...fresh]);
      setLastAdded(fresh.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const csv = toCsv(leads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName =
      businessType.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "leads";
    a.href = url;
    a.download = `${safeName}-leads.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(toTsv(leads));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(
        "Couldn't copy to the clipboard. Try the Download CSV button instead."
      );
    }
  };

  const handleClear = () => {
    if (leads.length === 0) return;
    if (!window.confirm("Clear the whole list? This can't be undone.")) return;
    setLeads([]);
    setSearched(false);
    setLastAdded(null);
  };

  const handleDelete = (index: number) => {
    setLeads((prev) => prev.filter((_, i) => i !== index));
  };

  const showResults = leads.length > 0 || searched;

  return (
    <div className="flex flex-col flex-1 px-8 py-8 max-w-5xl w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Lead Scraper</h1>
        <p className="text-[13px] text-[#94A3B8] mt-1">
          Search a business type + city and get names, phone numbers, and websites
          pulled straight from Google Maps — no manual copy-paste.
        </p>
      </div>

      {/* Search card */}
      <div className="bg-[#131320] rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-[#94A3B8] mb-1.5">Business Type</label>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. landscaper, concrete contractor, house cleaner"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#4F6080] focus:outline-none focus:border-indigo-500/60"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#94A3B8] mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Charleston, SC"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#4F6080] focus:outline-none focus:border-indigo-500/60"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSearch}
            disabled={!canSearch}
            className={`px-6 py-3 rounded-xl text-[14px] font-semibold transition-all ${
              canSearch
                ? "bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
                : "bg-indigo-500/30 text-white/40 cursor-not-allowed"
            }`}
          >
            {loading ? "Searching…" : "Search Google Maps"}
          </button>
          {loading && (
            <span className="text-[12px] text-[#94A3B8]">
              This can take up to a minute — flipping through pages of results…
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {showResults && !loading && (
        <div className="bg-[#131320] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h2 className="text-[14px] font-semibold text-white">
                {leads.length} lead{leads.length === 1 ? "" : "s"} saved
              </h2>
              <p className="text-[12px] text-[#94A3B8]">
                {lastAdded !== null
                  ? `Added ${lastAdded} new ${lastAdded === 1 ? "lead" : "leads"} from your last search. New searches stack on top — use Clear to start fresh.`
                  : "New searches add to this list. Use Clear to start a fresh list."}
              </p>
            </div>
            {leads.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-[13px] font-semibold text-white transition-colors"
                >
                  {copied ? "Copied!" : "Copy for Google Sheets"}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg text-[13px] text-white hover:bg-[#252540] transition-colors"
                >
                  Download CSV
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-transparent border border-[#2a2a4a] rounded-lg text-[13px] text-[#94A3B8] hover:text-red-400 hover:border-red-400/40 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {leads.length === 0 ? (
            <p className="text-[13px] text-[#94A3B8]">
              No results for that search — try a broader business type or a wider
              location.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#1E1E2E]">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Website</th>
                    <th className="py-2 pr-4">Address</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={i} className="border-b border-[#1E1E2E]/60">
                      <td className="py-2 pr-4 text-[13px] text-white whitespace-nowrap">
                        {lead.name}
                      </td>
                      <td className="py-2 pr-4 text-[13px] text-[#94A3B8] whitespace-nowrap">
                        {lead.phone || "—"}
                      </td>
                      <td className="py-2 pr-4 text-[13px] text-[#94A3B8] max-w-[220px] truncate">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline"
                          >
                            {lead.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 pr-4 text-[13px] text-[#94A3B8]">
                        {lead.address || "—"}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleDelete(i)}
                          title="Remove this lead"
                          aria-label="Remove this lead"
                          className="w-6 h-6 rounded-md text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 transition-colors text-[15px] leading-none"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
