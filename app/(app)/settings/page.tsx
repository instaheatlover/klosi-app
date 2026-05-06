"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const FIELDS = [
  { key: "product", label: "Product / Service", placeholder: "e.g. Klosi — AI Call Intelligence Platform" },
  { key: "icp", label: "Ideal Customer Profile (ICP)", placeholder: "e.g. B2B SaaS teams, 10–200 employees, outbound-led" },
  { key: "deal_stages", label: "Deal Stages", placeholder: "e.g. Discovery → Demo → Proposal → Legal → Close" },
  { key: "pain_points", label: "Pain Points to Look For", placeholder: "e.g. Low patient flow, slow revenue growth, lack of marketing system" },
];

export default function SettingsPage() {
  const [script, setScript] = useState("");
  const [noteTemplate, setNoteTemplate] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings from Supabase on mount
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setScript(data.script || "");
        setNoteTemplate(data.note_template || "");
        setFields({
          product: data.product || "",
          icp: data.icp || "",
          deal_stages: data.deal_stages || "",
          pain_points: data.pain_points || "",
        });
        // Also keep localStorage in sync for the API route
        localStorage.setItem("klosi_script", data.script || "");
        localStorage.setItem("klosi_note_template", data.note_template || "");
        localStorage.setItem("klosi_product", data.product || "");
        localStorage.setItem("klosi_icp", data.icp || "");
        localStorage.setItem("klosi_deal_stages", data.deal_stages || "");
        localStorage.setItem("klosi_objection_focus", data.pain_points || "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      script,
      note_template: noteTemplate,
      product: fields.product || "",
      icp: fields.icp || "",
      deal_stages: fields.deal_stages || "",
      pain_points: fields.pain_points || "",
      updated_at: new Date().toISOString(),
    };

    // Upsert — creates a new row or updates existing one
    await supabase.from("user_settings").upsert(payload, { onConflict: "user_id" });

    // Keep localStorage in sync for the API route
    localStorage.setItem("klosi_script", script);
    localStorage.setItem("klosi_note_template", noteTemplate);
    localStorage.setItem("klosi_product", fields.product || "");
    localStorage.setItem("klosi_icp", fields.icp || "");
    localStorage.setItem("klosi_deal_stages", fields.deal_stages || "");
    localStorage.setItem("klosi_objection_focus", fields.pain_points || "");

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-8 py-8 max-w-5xl w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Sales Script & Settings</h1>
        <p className="text-[13px] text-[#94A3B8] mt-1">Train Klosi to recognize your key signals on every call — saved to your account</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* LEFT — Sales Script */}
        <div className="bg-[#131320] rounded-2xl p-6 flex flex-col">
          <h2 className="text-[14px] font-semibold text-white mb-1">Your Sales Script</h2>
          <p className="text-[12px] text-[#94A3B8] mb-4">Paste your script — Klosi detects key moments in every recording</p>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder={"1. Opening\n   Introduce yourself, keep it under 30 seconds\n\n2. Discovery Questions\n   \"What does your current CRM workflow look like?\"\n\n3. Pain Identification\n   Listen for: missed follow-ups, manual logging\n\n4. Solution Fit\n   Demo AI notes, one-click export\n\n5. Budget & Timeline\n   \"Do you have a Q3 budget allocated?\"\n\n6. Objection Handling\n   Common: pricing, migration, data privacy\n\n7. Next Steps\n   Book follow-up or send demo recording"}
            className="flex-1 min-h-[280px] bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 text-[12px] text-[#F8FAFC] placeholder-[#4F6080] resize-none focus:outline-none focus:border-indigo-500/60 font-mono leading-relaxed"
          />
          <div className="flex items-center justify-between mt-4">
            {script ? (
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg">✓ Script Active</span>
            ) : (
              <span className="text-[11px] text-[#4F6080]">No script added yet</span>
            )}
          </div>
        </div>

        {/* RIGHT — Key Details + Note Template */}
        <div className="flex flex-col gap-5">
          {/* Key Details */}
          <div className="bg-[#131320] rounded-2xl p-6">
            <h2 className="text-[14px] font-semibold text-white mb-1">Key Details</h2>
            <p className="text-[12px] text-[#94A3B8] mb-4">Help Klosi understand your product and customer profile</p>
            <div className="space-y-4">
              {FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-[11px] text-[#94A3B8] mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={fields[key] || ""}
                    onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-[12px] text-white placeholder-[#4F6080] focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Note Template */}
          <div className="bg-[#131320] rounded-2xl p-6 border-l-[3px] border-indigo-500">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[14px] font-semibold text-white">Note Template</h2>
              <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/12 px-2 py-0.5 rounded-md">Trains AI output style</span>
            </div>
            <p className="text-[12px] text-[#94A3B8] mb-3">
              Paste an example of how you want your CRM notes to look — Klosi will match this format.
            </p>
            <textarea
              value={noteTemplate}
              onChange={(e) => setNoteTemplate(e.target.value)}
              placeholder={"e.g.\nSummary: Discovery call with [Company]. Key pain: [issue]. Budget: [amount].\nNext steps: [action items].\nObjections: [objections raised]."}
              className="w-full min-h-[100px] bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 text-[12px] text-[#F8FAFC] placeholder-[#4F6080] resize-none focus:outline-none focus:border-indigo-500/60 font-mono leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[14px] font-semibold transition-colors"
        >
          {saved ? "✓ Saved!" : "Save & Apply"}
        </button>
      </div>
    </div>
  );
}
