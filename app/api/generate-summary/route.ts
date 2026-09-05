/**
 * app/api/generate-summary/route.ts
 *
 * POST /api/generate-summary
 *
 * Receives structured test records, sends them to Gemini for a concise
 * neutral summary, and returns plain text.
 *
 * Security:
 *   - Runs server-side only
 *   - GEMINI_API_KEY is read from process.env — never in client code
 *   - Only structured JSON data is sent to Gemini — not the raw report
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { ExtractedField } from "@/lib/types";

const MODEL = "gemini-3.6-flash";

function buildPrompt(fields: ExtractedField[]): string {
  const lines = fields
    .map((f) => {
      const parts = [
        `Test: ${f.test_name || f.testName || "Unknown"}`,
        `Value: ${f.value ?? "N/A"} ${f.unit ?? ""}`.trim(),
        `Reference: ${(f.reference_range || f.referenceRange) ?? "N/A"}`,
        `Status: ${f.status}`,
      ];
      if (f.date) parts.push(`Date: ${f.date}`);
      return parts.join(" | ");
    })
    .join("\n");

  return `Generate a concise, neutral summary of the provided structured laboratory results.

Only describe values present in the data.
Do not invent findings.
Do not diagnose.
Do not recommend treatment.
Do not claim certainty beyond the supplied data.
Mention notable low or high values if present.
Keep the summary concise and understandable for a non-medical reader.
End with a short disclaimer that this is an informational summary and not medical advice.

Laboratory results:
${lines}`;
}

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

export async function POST(req: NextRequest) {
  // ── 1. Validate API key ───────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[generate-summary] GEMINI_API_KEY is not set in environment variables");
    return NextResponse.json(
      { success: false, error: "Server configuration error: GEMINI_API_KEY is not set." },
      { status: 500 }
    );
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────────
  let fields: ExtractedField[];
  try {
    const body = await req.json();
    if (!Array.isArray(body.fields) || body.fields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No records provided for summary." },
        { status: 400 }
      );
    }
    fields = body.fields as ExtractedField[];
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  // ── 3. Call Gemini ────────────────────────────────────────────────────────────
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(fields),
    });

    const summary = (response.text ?? "").trim();
    if (!summary) {
      return NextResponse.json(
        { success: false, error: "Gemini returned an empty summary." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, summary }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = extractErrorMessage(err);
    console.error("[generate-summary] Gemini API error:", err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 502 }
    );
  }
}
