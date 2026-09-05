/**
 * lib/types.ts — Shared TypeScript types used across the MedLens app.
 */

import type { ResultStatus } from "./computeStatus";

/** A single extracted test result from a medical report. */
export interface ExtractedField {
  test_name: string;
  testName?: string;
  value: string | null;
  unit: string | null;
  reference_range: string | null;
  referenceRange?: string | null;
  date: string | null;
  /** Computed server-side by computeStatus() — never from AI. */
  status: ResultStatus;
}

/** A report document as stored in Firestore (reports/{id}). */
export interface ReportDocument {
  patientId: string;
  extractedFields: ExtractedField[];
  source: "ai_extracted";
  uploadedAt: unknown; // Firestore FieldValue / Timestamp
}

/** Response shape from POST /api/extract-report. */
export interface ExtractReportResponse {
  success: true;
  fields: ExtractedField[];
}

export interface ExtractReportError {
  success: false;
  error: string;
}

/** Response shape from POST /api/generate-summary. */
export interface GenerateSummaryResponse {
  success: true;
  summary: string;
}

export interface GenerateSummaryError {
  success: false;
  error: string;
}
