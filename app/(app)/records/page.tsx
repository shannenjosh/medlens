"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import Button from "@/components/Button";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ResultStatus } from "@/lib/computeStatus";

type Source = "manual" | "ai";

interface FlatRecord {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: ResultStatus;
  date: string;
  source: Source;
}

const STATUS_STYLES: Record<
  ResultStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  normal: {
    bg: "bg-[#D8F2E7]",
    text: "text-[#0F6857]",
    border: "border-[#BCE5D3]",
    label: "Normal",
  },
  low: {
    bg: "bg-[#FCE4DE]",
    text: "text-[#A8372B]",
    border: "border-[#F8C8BF]",
    label: "Low",
  },
  high: {
    bg: "bg-[#FEF0D8]",
    text: "text-[#9A6214]",
    border: "border-[#F9D9A8]",
    label: "High",
  },
  unknown: {
    bg: "bg-[#EDE7FA]",
    text: "text-[#554095]",
    border: "border-[#D7CDF5]",
    label: "Unknown",
  },
};

function StatusChip({ status }: { status: ResultStatus }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.unknown;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      {s.label}
    </span>
  );
}

function SourceTag({ source }: { source: Source }) {
  const isAi = source === "ai";
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border
        ${isAi
          ? "bg-[#DBF0E7] text-[#0F6857] border-[#BFDFD1]"
          : "bg-white text-[#39544D] border-[#D3E8DE]"
        }
      `}
    >
      {isAi && <Sparkles size={11} className="text-[#0F6857]" />}
      <span>{isAi ? "Extracted by AI" : "Entered by you"}</span>
    </span>
  );
}

type SortKey = "testName" | "status" | "date";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={13} className="text-[#67827A]" />;
  return dir === "asc" ? (
    <ChevronUp size={13} className="text-[#0F6857]" />
  ) : (
    <ChevronDown size={13} className="text-[#0F6857]" />
  );
}

export default function RecordsPage() {
  const [records, setRecords] = useState<FlatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<ResultStatus | "all">("all");

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const reportsRef = collection(db, "reports");
      let snapshot;
      try {
        const q = query(
          reportsRef,
          where("patientId", "==", "demo-patient-1"),
          orderBy("uploadedAt", "desc")
        );
        snapshot = await getDocs(q);
      } catch {
        const fallbackQ = query(
          reportsRef,
          where("patientId", "==", "demo-patient-1")
        );
        snapshot = await getDocs(fallbackQ);
      }

      const flat: FlatRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const extracted = Array.isArray(data.extractedFields) ? data.extractedFields : [];
        const reportDate = data.uploadedAt?.toDate?.()
          ? data.uploadedAt.toDate().toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        extracted.forEach((field: {
          test_name?: string;
          value?: string | null;
          unit?: string | null;
          reference_range?: string | null;
          status?: ResultStatus;
          date?: string | null;
        }, index: number) => {
          flat.push({
            id: `${docSnap.id}-${index}`,
            testName: field.test_name || "Unspecified Panel",
            value: field.value ?? "—",
            unit: field.unit ?? "",
            referenceRange: field.reference_range ?? "—",
            status: (field.status as ResultStatus) || "unknown",
            date: field.date || reportDate,
            source: data.source === "ai_extracted" ? "ai" : "manual",
          });
        });
      });

      setRecords(flat);
    } catch (err) {
      console.error("[RecordsPage] Error fetching records:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve records from Firestore."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const stats = useMemo(() => {
    const total = records.length;
    const normal = records.filter((r) => r.status === "normal").length;
    const attention = records.filter((r) => r.status === "low" || r.status === "high").length;
    return { total, normal, attention };
  }, [records]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const displayed = useMemo(() => {
    return [...records]
      .filter((r) => filter === "all" || r.status === filter)
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date") cmp = a.date.localeCompare(b.date);
        if (sortKey === "testName") cmp = a.testName.localeCompare(b.testName);
        if (sortKey === "status") cmp = a.status.localeCompare(b.status);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [records, filter, sortKey, sortDir]);

  const filterOptions: Array<{ value: ResultStatus | "all"; label: string }> = [
    { value: "all",     label: "All Results" },
    { value: "normal",  label: "Normal" },
    { value: "low",     label: "Low" },
    { value: "high",    label: "High" },
    { value: "unknown", label: "Unknown" },
  ];

  return (
    <PageShell title="" subtitle="">
      <div className="flex flex-col gap-7 pb-20 -mt-6">

        {/* ── Top Hero Area: Large Soft Mint (#DBF0E7) ── */}
        <div className="bg-[#DBF0E7] border border-[#BFDFD1] rounded-[26px] p-7 sm:p-9 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadein">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F6857] text-white text-[11px] font-bold tracking-wider uppercase mb-3">
              <Activity size={12} />
              <span>HEALTH LEDGER</span>
            </div>
            <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#0F6857] tracking-tight leading-tight">
              Health Records
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#244E43] font-medium leading-relaxed max-w-xl">
              View and understand your extracted report data in one organized place.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            disabled={loading}
            className="gap-2 rounded-2xl bg-white border-[#BFDFD1] text-[#0F6857] font-bold shrink-0 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Sync records</span>
          </Button>
        </div>

        {/* ── 8. COLOURFUL STAT CARDS (Mint, Light Green, Peach) ── */}
        {!loading && records.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Tests = Mint Card (#DBF0E7) */}
              <div className="p-6 rounded-[24px] bg-[#DBF0E7] border border-[#BFDFD1] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F6857] uppercase tracking-wider">
                    Total Tests
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-[#0F6857] text-white flex items-center justify-center shadow-xs">
                    <Activity size={18} strokeWidth={2.4} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#142521] mt-3 tracking-tight">
                  {stats.total}
                </p>
                <p className="text-xs text-[#2F544A] font-medium mt-1">
                  Extracted across all lab reports
                </p>
              </div>

              {/* Normal = Light Green Card (#DDF5E5) */}
              <div className="p-6 rounded-[24px] bg-[#DDF5E5] border border-[#C1EAD0] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1B6E3E] uppercase tracking-wider">
                    Normal Range
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-[#1B6E3E] text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 size={18} strokeWidth={2.4} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#1B6E3E] mt-3 tracking-tight">
                  {stats.normal}
                </p>
                <p className="text-xs text-[#2A5E3E] font-medium mt-1">
                  Within expected clinical bounds
                </p>
              </div>

              {/* Needs Attention = Peach/Coral Card (#FCE4DE) */}
              <div className="p-6 rounded-[24px] bg-[#FCE4DE] border border-[#F8C8BF] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#A8372B] uppercase tracking-wider">
                    Needs Attention
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-[#E05345] text-white flex items-center justify-center shadow-xs">
                    <AlertTriangle size={18} strokeWidth={2.4} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#A8372B] mt-3 tracking-tight">
                  {stats.attention}
                </p>
                <p className="text-xs text-[#7A362E] font-medium mt-1">
                  Flagged low or elevated values
                </p>
              </div>
            </div>

            {/* ── Filter Pills & Metrics Count ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {filterOptions.map(({ value, label }) => {
                  const active = filter === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`
                        px-4 py-2 rounded-2xl text-xs font-bold border transition-all duration-150 cursor-pointer
                        ${active
                          ? "bg-[#0F6857] text-white border-[#0F6857] shadow-xs font-extrabold"
                          : "bg-white text-[#244E43] border-[#BFDFD1] hover:border-[#0F6857] hover:bg-[#EEF6F2]"
                        }
                      `}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-bold text-[#244E43] shrink-0">
                Showing {displayed.length} of {records.length} records
              </span>
            </div>
          </>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="p-12 rounded-[24px] bg-white border border-[#BFDFD1] flex flex-col items-center justify-center gap-3.5 shadow-xs">
            <svg
              className="animate-spin h-6 w-6 text-[#0F6857]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-xs font-bold text-[#244E43]">
              Synchronizing health records from Firestore…
            </p>
          </div>
        )}

        {/* ── Error State ── */}
        {!loading && error && (
          <div className="p-4 bg-[#FCE4DE] border border-[#F8C8BF] rounded-2xl flex items-start gap-3.5 animate-fadein shadow-xs">
            <AlertCircle size={20} className="text-[#E05345] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-[#A8372B]">
              <span className="font-bold">Error loading records: </span>
              {error}
            </div>
            <button
              type="button"
              onClick={fetchRecords}
              className="text-xs font-bold text-[#A8372B] hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && displayed.length === 0 && (
          <div className="py-20 rounded-[26px] bg-white border border-[#BFDFD1] text-center flex flex-col items-center justify-center gap-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#DBF0E7] text-[#0F6857] flex items-center justify-center">
              <Activity size={28} strokeWidth={2.4} />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-[#142521] tracking-tight">
                {records.length === 0 ? "No records yet" : "No results match this filter"}
              </h3>
              <p className="text-xs sm:text-sm text-[#426058] mt-1.5 leading-relaxed">
                {records.length === 0
                  ? "Upload a medical report to automatically extract and organise your biomarkers."
                  : "Try clearing your current filter tab to view all health records."}
              </p>
            </div>
            {records.length === 0 && (
              <Link
                href="/upload"
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-[#0F6857] text-white hover:bg-[#0A4D40] shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <UploadCloud size={16} />
                <span>Upload your first report</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}

        {/* ── Records Table: Soft Rounded Container with Pale Mint Header (#DBF0E7) ── */}
        {!loading && !error && displayed.length > 0 && (
          <div className="rounded-[24px] bg-white border border-[#BFDFD1] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-[#BFDFD1] bg-[#DBF0E7]">
                    {[
                      { key: "testName" as SortKey, label: "Test name" },
                      { key: null,                  label: "Value" },
                      { key: null,                  label: "Unit" },
                      { key: null,                  label: "Reference range" },
                      { key: "status" as SortKey,   label: "Status" },
                      { key: "date" as SortKey,     label: "Date" },
                      { key: null,                  label: "Source" },
                    ].map(({ key, label }) => (
                      <th
                        key={label}
                        className={`
                          px-6 py-4 text-xs font-bold text-[#0F6857] uppercase tracking-wider whitespace-nowrap
                          ${key ? "cursor-pointer select-none hover:text-[#0A4D40] transition-colors" : ""}
                        `}
                        onClick={() => key && toggleSort(key)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span>{label}</span>
                          {key && <SortIcon active={sortKey === key} dir={sortDir} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF6F2]">
                  {displayed.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-[#F2FAF6] transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-semibold text-[#142521] whitespace-nowrap">
                        {r.testName}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-[#142521]">
                        {r.value}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#39544D]">
                        {r.unit || "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[#39544D]">
                        {r.referenceRange}
                      </td>
                      <td className="px-6 py-4">
                        <StatusChip status={r.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-[#67827A] whitespace-nowrap font-mono">
                        {r.date}
                      </td>
                      <td className="px-6 py-4">
                        <SourceTag source={r.source} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </PageShell>
  );
}
