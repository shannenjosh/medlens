"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Zap,
  AlertTriangle,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExtractedField } from "@/lib/types";

interface MetricSummary {
  total: number;
  normal: number;
  abnormal: number;
  lowCount: number;
  highCount: number;
}

export default function SummaryPage() {
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [metrics, setMetrics] = useState<MetricSummary>({
    total: 0,
    normal: 0,
    abnormal: 0,
    lowCount: 0,
    highCount: 0,
  });
  const [summary, setSummary] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    async function loadRecords() {
      setLoadingRecords(true);
      try {
        const reportsRef = collection(db, "reports");
        const q = query(reportsRef, where("patientId", "==", "demo-patient-1"));
        const snapshot = await getDocs(q);

        const allFields: ExtractedField[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (Array.isArray(data.extractedFields)) {
            allFields.push(...data.extractedFields);
          }
        });

        setFields(allFields);

        let normal = 0;
        let lowCount = 0;
        let highCount = 0;

        allFields.forEach((f) => {
          if (f.status === "normal") normal++;
          else if (f.status === "low") lowCount++;
          else if (f.status === "high") highCount++;
        });

        setMetrics({
          total: allFields.length,
          normal,
          abnormal: lowCount + highCount,
          lowCount,
          highCount,
        });
      } catch (err) {
        console.warn("[SummaryPage] Error loading records:", err);
      } finally {
        setLoadingRecords(false);
      }
    }

    loadRecords();
  }, []);

  const handleGenerateSummary = async () => {
    setGenerating(true);
    setError(null);
    try {
      if (fields.length === 0) {
        throw new Error(
          "No test records found to summarise. Please upload a report first."
        );
      }

      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate AI summary.");
      }

      setSummary(data.summary);
      setGenerated(true);
    } catch (err) {
      console.error("[SummaryPage] Generation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while generating summary."
      );
    } finally {
      setGenerating(false);
    }
  };

  const flaggedFields = fields.filter((f) => f.status === "low" || f.status === "high");

  return (
    <PageShell title="" subtitle="">
      <div className="flex flex-col gap-7 pb-20 max-w-3xl -mt-6">

        {/* ── Top Hero Area (Visible Pale Mint #DBF0E7) ── */}
        <div className="bg-[#DBF0E7] border border-[#BFDFD1] rounded-[26px] p-7 sm:p-9 shadow-xs animate-fadein">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F6857] text-white text-[11px] font-bold tracking-wider uppercase mb-3">
            <Sparkles size={12} />
            <span>AI INSIGHT</span>
          </div>

          <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#0F6857] tracking-tight leading-tight">
            Your health, at a glance.
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[#244E43] font-medium leading-relaxed max-w-xl">
            A plain-language clinical synthesis of your diagnostic reports powered by Gemini AI.
          </p>
        </div>

        {/* ── Key Metrics Overview: Mint, Light Green, Peach Cards ── */}
        {!loadingRecords && fields.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Markers: Pale Mint (#DBF0E7) */}
            <div className="p-6 rounded-[24px] bg-[#DBF0E7] border border-[#BFDFD1] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F6857] uppercase tracking-wider">
                  Analyzed markers
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#0F6857] text-white flex items-center justify-center shadow-xs">
                  <FileCheck size={18} strokeWidth={2.4} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[#142521] mt-3 tracking-tight">
                {metrics.total}
              </p>
              <p className="text-xs text-[#2F544A] font-medium mt-1">
                Extracted across uploaded reports
              </p>
            </div>

            {/* Normal: Light Green (#DDF5E5) */}
            <div className="p-6 rounded-[24px] bg-[#DDF5E5] border border-[#C1EAD0] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1B6E3E] uppercase tracking-wider">
                  Within limits
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#1B6E3E] text-white flex items-center justify-center shadow-xs">
                  <Minus size={18} strokeWidth={2.6} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[#1B6E3E] mt-3 tracking-tight">
                {metrics.normal}
              </p>
              <p className="text-xs text-[#2A5E3E] font-medium mt-1">
                Standard expected range
              </p>
            </div>

            {/* Needs Review: Peach/Coral (#FCE4DE) */}
            <div className="p-6 rounded-[24px] bg-[#FCE4DE] border border-[#F8C8BF] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A8372B] uppercase tracking-wider">
                  Needs review
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#E05345] text-white flex items-center justify-center shadow-xs">
                  <div className="flex items-center gap-0.5">
                    {metrics.highCount > 0 && <TrendingUp size={15} strokeWidth={2.4} />}
                    {metrics.lowCount > 0 && <TrendingDown size={15} strokeWidth={2.4} />}
                  </div>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[#A8372B] mt-3 tracking-tight">
                {metrics.abnormal}
              </p>
              <p className="text-xs text-[#7A362E] font-medium mt-1">
                {metrics.highCount} high · {metrics.lowCount} low
              </p>
            </div>
          </div>
        )}

        {/* ── AI Summary Card: Visible PALE LAVENDER Container (#EDE7FA) ── */}
        <div className="rounded-[26px] bg-[#EDE7FA] border border-[#D7CDF5] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#6B52B5] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#4F3699] tracking-tight">
                  AI-generated overview
                </h2>
                <p className="text-xs sm:text-[13px] text-[#47367B] font-medium mt-0.5">
                  Synthesised by Gemini from verified diagnostic panels
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={generating || fields.length === 0}
              onClick={handleGenerateSummary}
              className={`
                inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white
                bg-[#0F6857] hover:bg-[#0A4D40] shadow-md hover:shadow-lg
                hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer
                ${(generating || fields.length === 0) ? "opacity-70 cursor-not-allowed" : ""}
              `}
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Synthesising…</span>
                </>
              ) : generated ? (
                <>
                  <RefreshCw size={14} />
                  <span>Regenerate overview</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Generate overview</span>
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-[#FCE4DE] border border-[#F8C8BF] rounded-2xl flex items-start gap-3 mb-5 animate-fadein shadow-xs">
              <AlertCircle size={18} className="text-[#E05345] shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-[#A8372B]">
                <span className="font-bold">Unable to generate summary: </span>
                {error}
              </div>
            </div>
          )}

          {/* Initial State Box (Clean White on Lavender) */}
          {!generated && !generating && (
            <div className="py-12 px-6 rounded-[22px] bg-white border border-[#D7CDF5] text-center flex flex-col items-center justify-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#EDE7FA] text-[#6B52B5] flex items-center justify-center mb-4">
                <Sparkles size={24} strokeWidth={2.2} />
              </div>
              <p className="text-base font-bold text-[#142521]">
                {fields.length === 0
                  ? "No test records found to summarise"
                  : "Ready to synthesise your health overview"}
              </p>
              <p className="text-xs sm:text-sm text-[#47367B] max-w-md mt-1.5 leading-relaxed">
                {fields.length === 0
                  ? "Upload a lab report to automatically extract biometric values for analysis."
                  : "Click 'Generate overview' to create a plain-language summary of your latest biomarkers."}
              </p>
            </div>
          )}

          {/* Loading State Box */}
          {generating && (
            <div className="py-12 px-6 rounded-[22px] bg-white border border-[#D7CDF5] flex items-center justify-center gap-4 animate-fadein shadow-xs">
              <div className="w-11 h-11 rounded-2xl bg-[#DBF0E7] flex items-center justify-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F6857] animate-dot-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F6857] animate-dot-pulse" style={{ animationDelay: "200ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F6857] animate-dot-pulse" style={{ animationDelay: "400ms" }} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#142521]">
                  Synthesising your test records with Gemini…
                </p>
                <p className="text-xs text-[#2F544A] mt-0.5">
                  Translating clinical markers into plain, understandable highlights
                </p>
              </div>
            </div>
          )}

          {/* Generated Result Box (Clean White on Lavender) */}
          {generated && summary && !generating && (
            <div className="p-6 sm:p-8 rounded-[22px] bg-white border border-[#D7CDF5] shadow-xs flex flex-col gap-6 animate-fadein">
              <div className="text-sm sm:text-[15px] text-[#142521] leading-relaxed whitespace-pre-line">
                {summary}
              </div>

              {/* Flat-Color Callouts for Flagged Values */}
              {flaggedFields.length > 0 && (
                <div className="pt-5 border-t border-[#EDE7FA]">
                  <span className="text-xs font-bold text-[#47367B] uppercase tracking-wider block mb-3">
                    Markers Flagged For Attention ({flaggedFields.length})
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {flaggedFields.map((f, i) => {
                      const isLow = f.status === "low";
                      return (
                        <div
                          key={i}
                          className={`
                            inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border
                            ${isLow
                              ? "bg-[#FCE4DE] text-[#A8372B] border-[#F8C8BF]"
                              : "bg-[#FEF0D8] text-[#9A6214] border-[#F9D9A8]"
                            }
                          `}
                        >
                          <AlertTriangle size={13} className="shrink-0" />
                          <span>{f.test_name}</span>
                          <span className="font-mono text-[11px] font-extrabold opacity-90">
                            {f.value} {f.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Disclaimer ── */}
        <div className="flex items-start gap-2.5 px-2">
          <ShieldCheck size={16} className="text-[#67827A] shrink-0 mt-0.5" />
          <p className="text-xs text-[#67827A] leading-relaxed">
            MedLens summaries are AI-assisted mathematical syntheses of provided laboratory values. This tool does not offer diagnostic advice, clinical diagnosis, or treatment plans. Always consult a qualified healthcare provider regarding laboratory findings.
          </p>
        </div>

      </div>
    </PageShell>
  );
}
