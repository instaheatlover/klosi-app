"use client";
import { useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.includes("audio") && !f.name.endsWith(".mp3") && !f.name.endsWith(".m4a")) {
      alert("Please upload an MP3 or M4A file.");
      return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleAnalyze = () => {
    if (!file) return;
    // Store the File object reference — we'll send it as FormData (no base64, no size limit)
    sessionStorage.setItem("klosi_file_name", file.name);
    sessionStorage.setItem("klosi_file_size", String(file.size));
    // Store as object URL so the analyze page can retrieve the actual File
    const objectUrl = URL.createObjectURL(file);
    sessionStorage.setItem("klosi_file_object_url", objectUrl);
    sessionStorage.setItem("klosi_file_type", file.type || "audio/mpeg");
    router.push("/analyze");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">
      {/* Hero */}
      <h1 className="text-4xl font-bold text-white text-center mb-3 leading-tight">
        Drop a call.<br />Get CRM-ready notes.
      </h1>
      <p className="text-[#94A3B8] text-center text-[15px] mb-10 max-w-lg">
        Upload a recording and Klosi instantly writes CRM-ready notes — no calls stored.
      </p>

      {/* Upload card */}
      <div className="w-full max-w-xl bg-[#131320] rounded-2xl p-6">
        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-12 px-6 cursor-pointer transition-colors ${
            dragging
              ? "border-indigo-400 bg-indigo-500/10"
              : "border-[#2a2a4a] hover:border-indigo-500/60 hover:bg-indigo-500/5"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <p className="text-white font-semibold text-[15px] mb-1">Drag & drop your MP3 here</p>
          <p className="text-[#94A3B8] text-[13px]">MP3 and M4A recordings supported</p>
          <button
            type="button"
            className="mt-4 px-5 py-2 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg text-[13px] text-white hover:bg-[#252540] transition-colors"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.m4a,audio/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>

        {/* Selected file info */}
        {file && (
          <div className="mt-4 flex items-center gap-3 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{file.name}</p>
              <p className="text-[11px] text-[#94A3B8]">{formatSize(file.size)}</p>
            </div>
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">✓ Ready</span>
          </div>
        )}

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!file}
          className={`mt-4 w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all ${
            file
              ? "bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
              : "bg-indigo-500/30 text-white/40 cursor-not-allowed"
          }`}
        >
          Analyze Call →
        </button>
        {!file && (
          <p className="text-center text-[11px] text-[#4F6080] mt-2">Drop a file to unlock the button</p>
        )}
      </div>

      {/* How it works */}
      <div className="mt-12 w-full max-w-2xl">
        <p className="text-[12px] text-[#94A3B8] uppercase tracking-wider mb-4 text-center">How it works</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { n: "01", label: "Upload", desc: "Drop your MP3 recording", color: "text-indigo-400" },
            { n: "02", label: "Analyze", desc: "AI transcribes & finds insights", color: "text-emerald-400" },
            { n: "03", label: "Export", desc: "Paste notes into your CRM", color: "text-amber-400" },
          ].map((s) => (
            <div key={s.n} className="bg-[#131320] rounded-xl p-4">
              <p className={`text-[12px] font-semibold ${s.color} mb-1`}>{s.n} &nbsp;{s.label}</p>
              <p className="text-[11px] text-[#94A3B8]">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] text-[#4F6080] mt-6">
          No calls stored. No data retained. Privacy-first by design.
        </p>
      </div>
    </div>
  );
}
