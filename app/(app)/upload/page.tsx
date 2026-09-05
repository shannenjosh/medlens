"use client";

import { useState, useCallback, useRef } from "react";
import {
  UploadCloud,
  FileText,
  ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import Button from "@/components/Button";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExtractedField } from "@/lib/types";

type UploadStatus = "idle" | "dragging" | "uploading" | "done" | "error";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function FileTypeIcon({ type }: { type: string }) {
  return type.startsWith("image/") ? (
    <ImageIcon size={20} className="text-[#0F6857]" />
  ) : (
    <FileText size={20} className="text-[#0F6857]" />
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; border: string; label: string }> = {
    low: {
      bg: "bg-[#FCE4DE]",
      text: "text-[#A8372B]",
      border: "border-[#F8C8BF]",
      label: "Low",
    },
    normal: {
      bg: "bg-[#D8F2E7]",
      text: "text-[#0F6857]",
      border: "border-[#BCE5D3]",
      label: "Normal",
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

  const s = styles[status] || styles.unknown;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      {s.label}
    </span>
  );
}

export default function UploadPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ExtractedField[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedToDb, setSavedToDb] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (selectedFile: File) => {
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setErrorMsg("Unsupported file format. Please upload JPG, PNG, or PDF.");
      setStatus("error");
      return;
    }

    if (selectedFile.size > MAX_FILE_BYTES) {
      setErrorMsg("File exceeds the 10 MB limit.");
      setStatus("error");
      return;
    }

    setFile(selectedFile);
    setStatus("uploading");
    setErrorMsg("");
    setResults([]);
    setSavedToDb(false);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/extract-report", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract report data.");
      }

      const extractedFields: ExtractedField[] = data.fields;
      setResults(extractedFields);
      setStatus("done");

      try {
        const reportsRef = collection(db, "reports");
        await addDoc(reportsRef, {
          patientId: "demo-patient-1",
          extractedFields,
          fileName: selectedFile.name,
          source: "ai_extracted",
          uploadedAt: serverTimestamp(),
        });
        setSavedToDb(true);
      } catch (dbErr) {
        console.warn("[UploadPage] Firestore save warning:", dbErr);
      }
    } catch (err) {
      console.error("[UploadPage] Extraction error:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "An error occurred while processing the document."
      );
      setStatus("error");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setStatus("idle");
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) processFile(droppedFile);
    },
    [processFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosenFile = e.target.files?.[0];
    if (chosenFile) processFile(chosenFile);
  };

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setResults([]);
    setErrorMsg("");
    setSavedToDb(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <PageShell title="" subtitle="">
      <div className="flex flex-col gap-7 pb-20 max-w-3xl -mt-6">

        {/* ── Top Hero Area (Visible Pale Mint #DBF0E7) ── */}
        <div className="bg-[#DBF0E7] border border-[#BFDFD1] rounded-[26px] p-7 sm:p-9 shadow-xs animate-fadein">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F6857] text-white text-[11px] font-bold tracking-wider uppercase mb-3">
            <Sparkles size={12} />
            <span>AI REPORT ANALYSIS</span>
          </div>

          <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#0F6857] tracking-tight leading-tight">
            Turn reports into clarity.
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[#244E43] font-medium leading-relaxed max-w-xl">
            Upload your medical report and MedLens will organise the important information.
          </p>
        </div>

        {/* ── Large Upload Zone: Visible Pale Peach / Mint Surface ── */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (status !== "uploading") setStatus("dragging");
          }}
          onDragLeave={() => {
            if (status !== "uploading") setStatus("idle");
          }}
          onDrop={onDrop}
          className={`
            relative rounded-[26px] border-2 border-dashed p-10 sm:p-16 text-center
            transition-all duration-200 select-none shadow-xs
            ${status === "dragging"
              ? "border-[#0F6857] bg-[#DBF0E7] scale-[1.01]"
              : "border-[#BFDFD1] bg-[#DBF0E7]/60 hover:border-[#0F6857] hover:bg-[#DBF0E7]"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            {/* Colored Icon Circle in Flat Deep Teal with white icon */}
            <div className="w-16 h-16 rounded-full bg-[#0F6857] text-white flex items-center justify-center mb-5 shadow-sm">
              <UploadCloud size={28} strokeWidth={2.4} />
            </div>

            <h2 className="text-xl font-extrabold text-[#0F6857] tracking-tight">
              Drop your report here
            </h2>

            <p className="text-sm text-[#244E43] font-medium mt-2 max-w-sm leading-relaxed">
              Drag and drop your laboratory panel, imaging scan, or clinical report here.
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={status === "uploading"}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0F6857] hover:bg-[#0A4D40] shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Choose a report</span>
              </button>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#BCE5D3]">
              <span className="text-xs font-bold text-[#0F6857] tracking-wider">
                JPG · PNG · PDF
              </span>
              <span className="text-[10px] text-[#426058] font-medium">
                (Up to 10 MB)
              </span>
            </div>
          </div>
        </div>

        {/* ── Active File Card (Visible White on Mint) ── */}
        {file && (
          <div className="flex items-center justify-between gap-4 p-4 bg-white border border-[#BFDFD1] rounded-2xl shadow-xs animate-fadein">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#DBF0E7] text-[#0F6857] flex items-center justify-center shrink-0">
                <FileTypeIcon type={file.type} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#142521] truncate">
                  {file.name}
                </p>
                <p className="text-xs text-[#67827A] font-medium">
                  {(file.size / 1024).toFixed(1)} KB · Ready for analysis
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={reset}
              disabled={status === "uploading"}
              className="p-2 text-[#67827A] hover:text-[#142521] rounded-xl hover:bg-[#EEF6F2] transition-colors disabled:opacity-40"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Processing State: Scanning-line & Pulsing animation ── */}
        {status === "uploading" && (
          <div className="p-6 bg-white border border-[#BFDFD1] rounded-2xl shadow-xs relative overflow-hidden animate-fadein">
            <div className="absolute inset-x-0 h-0.5 bg-[#0F6857] animate-scanline" />

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#DBF0E7] flex items-center justify-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#0F6857] animate-dot-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#0F6857] animate-dot-pulse" style={{ animationDelay: "200ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#0F6857] animate-dot-pulse" style={{ animationDelay: "400ms" }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#142521] flex items-center gap-2">
                  <span>Reading document with Gemini AI</span>
                  <Sparkles size={14} className="text-[#0F6857]" />
                </p>
                <p className="text-xs text-[#426058] mt-0.5">
                  Scanning markers, quantitative values, and reference limits…
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Error Banner ── */}
        {status === "error" && (
          <div className="p-4 bg-[#FCE4DE] border border-[#F8C8BF] rounded-2xl flex items-start gap-3.5 animate-fadein shadow-xs">
            <AlertCircle size={20} className="text-[#E05345] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-[#A8372B]">
              <span className="font-bold">Extraction could not complete: </span>
              {errorMsg}
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              Try again
            </Button>
          </div>
        )}

        {/* ── Extracted Results: Visible Card with Table ── */}
        {status === "done" && results.length > 0 && (
          <div className="flex flex-col gap-4 animate-fadein">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#0F6857]" />
                <h3 className="text-base font-bold text-[#142521]">
                  Extracted biomarkers ({results.length})
                </h3>
              </div>
              {savedToDb && (
                <span className="text-xs font-bold text-[#0F6857] bg-[#DBF0E7] px-3.5 py-1 rounded-full border border-[#BFDFD1]">
                  Saved to records
                </span>
              )}
            </div>

            <div className="bg-white border border-[#BFDFD1] rounded-[24px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-[#BFDFD1] bg-[#DBF0E7]">
                      <th className="px-6 py-4 text-xs font-bold text-[#0F6857] uppercase tracking-wider">
                        Marker
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-[#0F6857] uppercase tracking-wider">
                        Value & Unit
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-[#0F6857] uppercase tracking-wider">
                        Reference Range
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-[#0F6857] uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF6F2]">
                    {results.map((r, i) => (
                      <tr
                        key={i}
                        className="hover:bg-[#F2FAF6] transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-semibold text-[#142521]">
                          {r.test_name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-[#142521]">
                          {r.value ?? "—"}{" "}
                          <span className="text-[#67827A] font-sans font-normal">
                            {r.unit ?? ""}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#39544D] font-mono">
                          {r.reference_range ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusChip status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={reset}
                className="gap-2 bg-white border-[#BFDFD1] text-[#142521]"
              >
                <RotateCcw size={14} />
                <span>Upload another report</span>
              </Button>
              <a
                href="/records"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-[#0F6857] text-white hover:bg-[#0A4D40] shadow-sm hover:shadow transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>View health records</span>
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        )}

      </div>
    </PageShell>
  );
}
