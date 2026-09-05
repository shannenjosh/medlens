/**
 * lib/computeStatus.ts
 *
 * Pure utility — no AI involved.
 * Parses a reference range string and determines whether a numeric
 * test result is low, normal, high, or unknown.
 *
 * Supported range formats:
 *   "13-17"         simple hyphen (also handles en-dash –)
 *   "13.5 - 17.5"  with spaces
 *   "70 – 140"     en-dash with spaces
 *   "< 100"        less-than upper bound only
 *   "> 40"         greater-than lower bound only
 *   "<5.7"         no space variant
 */

export type ResultStatus = "low" | "normal" | "high" | "unknown";

/**
 * Compute whether `value` is low / normal / high relative to `referenceRange`.
 * Returns "unknown" when either argument is missing or cannot be parsed.
 */
export function computeStatus(
  value: string | null | undefined,
  referenceRange: string | null | undefined
): ResultStatus {
  if (!value || !referenceRange) return "unknown";

  const numericValue = parseFloat(value.replace(/,/g, ""));
  if (isNaN(numericValue)) return "unknown";

  const range = referenceRange.trim();

  // ── Less-than upper bound  e.g.  "< 100"  or  "<5.7" ──────────────────────
  const ltMatch = range.match(/^[<＜]\s*([\d.]+)/);
  if (ltMatch) {
    const upper = parseFloat(ltMatch[1]);
    if (isNaN(upper)) return "unknown";
    return numericValue < upper ? "normal" : "high";
  }

  // ── Greater-than lower bound  e.g.  "> 40" ─────────────────────────────────
  const gtMatch = range.match(/^[>＞]\s*([\d.]+)/);
  if (gtMatch) {
    const lower = parseFloat(gtMatch[1]);
    if (isNaN(lower)) return "unknown";
    return numericValue > lower ? "normal" : "low";
  }

  // ── min–max range  e.g.  "13-17" / "13.5 – 17.5" / "70 - 140" ─────────────
  // Normalise: replace en-dash and em-dash with a plain hyphen, then split.
  // Be careful not to interpret the minus sign in "−3 – +3" style ranges.
  const normalized = range.replace(/[–—]/g, "-");

  // Split on hyphen that is surrounded by digits (not a leading negative sign)
  const parts = normalized.split(/(?<=\d)\s*-\s*(?=\d)/);
  if (parts.length === 2) {
    const min = parseFloat(parts[0].replace(/,/g, ""));
    const max = parseFloat(parts[1].replace(/,/g, ""));
    if (isNaN(min) || isNaN(max)) return "unknown";

    if (numericValue < min) return "low";
    if (numericValue > max) return "high";
    return "normal";
  }

  return "unknown";
}
