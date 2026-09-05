/**
 * app/api/extract-report/route.ts
 *
 * POST /api/extract-report
 *
 * Receives a multipart form upload, sends the image/PDF to Gemini for
 * structured lab-result extraction, and returns validated JSON.
 *
 * Security:
 *   - Runs server-side only (Next.js App Router API route)
 *   - GEMINI_API_KEY is read from process.env — never exposed to the browser
 *   - Raw Gemini response is validated before returning to the client
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { computeStatus } from "@/lib/computeStatus";
import type { ExtractedField } from "@/lib/types";

// ── Config ────────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES  = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MODEL          = "gemini-3.6-flash";

// ── Prompt ────────────────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are extracting factual laboratory test information from a medical report.

Extract ONLY information that is clearly visible in the uploaded report.

Do not diagnose the patient.
Do not provide medical advice.
Do not invent missing information.
Do not infer values that are not clearly visible.

For every clearly visible test result, extract:
- test_name
- value
- unit
- reference_range
- date

Return structured JSON ONLY — no markdown fences, no explanation text, just the raw JSON array.

If a field is not visible, use null.

Expected format:
[
  {
    "test_name": "Hemoglobin",
    "value": "12.5",
    "unit": "g/dL",
    "reference_range": "13-17",
    "date": null
  }
]`;

// ── Raw extraction result from Gemini ─────────────────────────────────────────
interface RawGeminiField {
  test_name?: unknown;
  testName?: unknown;
  value?: unknown;
  unit?: unknown;
  reference_range?: unknown;
  referenceRange?: unknown;
  date?: unknown;
}

// ── Helper: extract clean message from Gemini API errors ──────────────────────
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Not JSON string
    }
    return err.message;
  }
  return String(err);
}

// ── Helper: safely convert Gemini field to string | null ─────────────────────
function toStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" || s === "null" ? null : s;
}

// ── Helper: parse and validate Gemini's JSON output ──────────────────────────
function parseGeminiResponse(raw: string): ExtractedField[] {
  // Strip any accidental markdown fences the model may add
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${cleaned.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini JSON was not an array");
  }

  return (parsed as RawGeminiField[]).map((item) => {
    const test_name       = toStringOrNull(item.test_name) ?? toStringOrNull(item.testName) ?? "Unknown Test";
    const value           = toStringOrNull(item.value);
    const unit            = toStringOrNull(item.unit);
    const reference_range = toStringOrNull(item.reference_range) ?? toStringOrNull(item.referenceRange);
    const date            = toStringOrNull(item.date);

    // Status is computed by code — not taken from AI
    const status = computeStatus(value, reference_range);

    return {
      test_name,
      testName: test_name,
      value,
      unit,
      reference_range,
      referenceRange: reference_range,
      date,
      status,
    };
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── 1. Validate Gemini API key presence ──────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[extract-report] GEMINI_API_KEY is not set in environment variables");
    return NextResponse.json(
      { success: false, error: "Server configuration error: GEMINI_API_KEY is not set." },
      { status: 500 }
    );
  }

  // ── 2. Parse multipart form data ─────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request: could not parse form data." },
      { status: 400 }
    );
  }

  const fileField = formData.get("file");
  if (!(fileField instanceof File)) {
    return NextResponse.json(
      { success: false, error: "No file was uploaded." },
      { status: 400 }
    );
  }

  const file = fileField as File;

  // ── 3. Server-side validation ─────────────────────────────────────────────────
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: `Unsupported file type: ${file.type}. Use JPG, PNG, WEBP, or PDF.` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { success: false, error: "File exceeds the 10 MB limit." },
      { status: 400 }
    );
  }

  // ── 4. Convert file to base64 for Gemini inline data ─────────────────────────
  const arrayBuffer = await file.arrayBuffer();
  const base64Data  = Buffer.from(arrayBuffer).toString("base64");

  // ── 5. Call Gemini ────────────────────────────────────────────────────────────
  let rawText: string;
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type,
              },
            },
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    rawText = response.text ?? "";
  } catch (err: unknown) {
    const errorMsg = extractErrorMessage(err);
    console.error("[extract-report] Gemini API error:", err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 502 }
    );
  }

  // ── 6. Parse and validate Gemini's JSON ──────────────────────────────────────
  let fields: ExtractedField[];
  try {
    fields = parseGeminiResponse(rawText);
  } catch (err: unknown) {
    const errorMsg = extractErrorMessage(err);
    console.error("[extract-report] JSON parse error:", err);
    return NextResponse.json(
      { success: false, error: `Invalid AI output: ${errorMsg}` },
      { status: 502 }
    );
  }

  if (fields.length === 0) {
    return NextResponse.json(
      { success: false, error: "No test results could be extracted from this report." },
      { status: 422 }
    );
  }

  // ── 7. Return structured results ─────────────────────────────────────────────
  return NextResponse.json({ success: true, fields }, { status: 200 });
}
