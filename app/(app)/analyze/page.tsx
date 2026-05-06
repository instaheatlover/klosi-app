"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "uploading" | "transcribing" | "analyzing" | "done";
type Notes = {
  summary: string;
  painPoints: string[];
  nextSteps: string[];
  objections: string[];
  crmNote: string;
};

const STEPS: Step[] = ["uploading", "transcribing", "analyzing", "done"];
const STEP_LABELS: Record<Step, string> = {
  uploading: "Upload",
  transcribing: "Transcribe",
  analyzing: "Analyze",
  done: "Notes Ready",
};

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("uploading");
  const [notes, setNotes] = useState<Notes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const objectUrl = sessionStorage.getItem("klosi_file_object_url");
    const fileName = sessionStorage.getItem("klosi_file_name");
    const fileType = sessionStorage.getItem("klosi_file_type") || "audio/mpeg";
    if (!objectUrl || !fileName) { router.push("/"); return; }
    runAnalysis(objectUrl, fileName, fileType);
  }, []);

  async function runAnalysis(objectUrl: string, fileName: string, fileType: string) {
    try {
      setStep("transcribing");

      // Fetch the file from the object URL and send as FormData — no size limit issues
      const fileBlob = await fetch(objectUrl).then(r => r.blob());
      const file = new File([fileBlob], fileName, { type: fileType });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("script", localStorage.getItem("klosi_script") || "");
      formData.append("noteTemplate", localStorage.getItem("klosi_note_template") || "");
      formData.append("icp", localStorage.getItem("klosi_icp") || "");
      formData.append("product", localStorage.getItem("klosi_product") || "");
      formData.append("dealStages", localStorage.getItem("klosi_deal_stages") || "");
      formData.append("objectionFocus", localStorage.getItem("klosi_objection_focus") || "");

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      setStep("analyzing");

      if (!res.ok) {
        const text = await res.text();
        try {
          const err = JSON.parse(text);
          throw new Error(err.error || "Analysis failed");
        } catch {
          throw new Error(text || "Analysis failed");
        }
      }

      const data = await res.json();
      setNotes(data);
      setStep("done");

      // Clean up session
      sessionStorage.removeItem("klosi_file_object_url");
      URL.revokeObjectURL(objectUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const copyToClipboard = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes.crmNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentIdx = STEPS.indexOf(step);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">
        <div className="w-full max-w-lg bg-[#131320] rounded-2xl p-8 text-center">
          <p className="text-red-400 text-lg font-semibold mb-2">Something went wrong</p>
          <p className="text-[#94A3B8] text-sm mb-6">{error}</p>
          <button onClick={() => router.push("/")} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center flex-1 px-6 py-12">
      {/* Top bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">AI Notes</h1>
          <p className="text-[13px] text-[#94A3B8]">
            {(typeof window !== "undefined" && sessionStorage.getItem("klosi_file_name")) || "Analyzing call..."}
          </p>
        </div>
        {step === "done" && (
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg">
            ✓ Analysis Complete
          </span>
        )}
      </div>

      {/* Progress steps */}
      <div className="w-full max-w-3xl bg-[#131320] rounded-2xl p-6 mb-6">
        <p className="text-[11px] text-[#94A3B8] uppercase tracking-wider mb-4">Analysis progress</p>
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    done ? "bg-emerald-500 text-white" : active ? "bg-indigo-500/30 text-indigo-400 ring-2 ring-indigo-500" : "bg-[#1E1E2E] text-[#4F6080]"
                  }`}>
                    {done ? "✓" : active ? "…" : ""}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium ${done ? "text-emerald-400" : active ? "text-indigo-400" : "text-[#4F6080]"}`}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-2 mb-4 transition-colors ${done ? "bg-emerald-500" : "bg-[#1E1E2E]"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {step !== "done" && (
        <div className="w-full max-w-3xl bg-[#131320] rounded-2xl p-12 flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-medium">
            {step === "transcribing" ? "Transcribing your call..." : "Generating AI notes..."}
          </p>
          <p className="text-[#94A3B8] text-sm mt-1">This usually takes 30–60 seconds</p>
        </div>
      )}

      {/* Results */}
      {step === "done" && notes && (
        <div className="w-full max-w-3xl space-y-4">
          {/* Export card */}
          <div className="bg-[#131320] rounded-2xl p-6">
            <h2 className="text-[18px] font-semibold text-white mb-1">Export to CRM</h2>
            <p className="text-[13px] text-[#94A3B8] mb-4">Your AI-generated notes are ready — copy or paste into your CRM</p>

            {/* CRM preview */}
            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 mb-4">
              <p className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">CRM Note Preview</p>
              <p className="text-[13px] text-[#94A3B8] leading-relaxed">{notes.crmNote}</p>
            </div>

            {/* Copy button */}
            <button
              onClick={copyToClipboard}
              className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[15px] font-semibold transition-colors"
            >
              {copied ? "✓ Copied to Clipboard!" : "Copy to Clipboard"}
            </button>
          </div>

          {/* Two-column insights */}
          <div className="grid grid-cols-2 gap-4">
            {/* Key Pain Points */}
            <div className="bg-[#131320] rounded-2xl p-5 border-l-[3px] border-red-400">
              <h3 className="text-[12px] font-semibold text-red-400 mb-3">Key Pain Points</h3>
              <ul className="space-y-2">
                {notes.painPoints.map((p, i) => (
                  <li key={i} className="text-[12px] text-[#94A3B8] flex gap-2">
                    <span className="text-red-400 mt-0.5">•</span>{p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-[#131320] rounded-2xl p-5 border-l-[3px] border-emerald-400">
              <h3 className="text-[12px] font-semibold text-emerald-400 mb-3">Next Steps</h3>
              <ul className="space-y-2">
                {notes.nextSteps.map((s, i) => (
                  <li key={i} className="text-[12px] text-[#94A3B8] flex gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Full notes */}
          <div className="bg-[#131320] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 bg-indigo-500/15 text-indigo-400 text-[12px] font-medium rounded-lg">AI Output</span>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-[12px] font-semibold text-indigo-400 mb-2">Summary</p>
                <p className="text-[13px] text-[#F8FAFC] leading-relaxed">{notes.summary}</p>
              </div>
              <div className="border-t border-[#1E1E2E] pt-5">
                <p className="text-[12px] font-semibold text-indigo-400 mb-2">Objections Raised</p>
                <ul className="space-y-1">
                  {notes.objections.map((o, i) => (
                    <li key={i} className="text-[13px] text-[#F8FAFC]">• {o}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <button onClick={() => router.push("/")} className="w-full py-3 bg-[#131320] hover:bg-[#1a1a2e] border border-[#1E1E2E] text-[#94A3B8] rounded-xl text-[13px] font-medium transition-colors">
            ← Analyze Another Call
          </button>
        </div>
      )}
    </div>
  );
}
