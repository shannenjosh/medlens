import { describe, it, expect } from "vitest";
import { computeStatus } from "@/lib/computeStatus";

describe("computeStatus", () => {
  describe("Standard min-max numeric ranges", () => {
    it("returns 'normal' when value is strictly within bounds", () => {
      expect(computeStatus("14.2", "12.0 - 16.0")).toBe("normal");
      expect(computeStatus("14", "12-16")).toBe("normal");
      expect(computeStatus("120", "70 - 140")).toBe("normal");
    });

    it("returns 'normal' when value equals boundary limits", () => {
      expect(computeStatus("12.0", "12.0 - 16.0")).toBe("normal");
      expect(computeStatus("16.0", "12.0 - 16.0")).toBe("normal");
    });

    it("returns 'low' when value is below the minimum", () => {
      expect(computeStatus("10.5", "12.0 - 16.0")).toBe("low");
      expect(computeStatus("65", "70 - 140")).toBe("low");
      expect(computeStatus("3.9", "4.0 - 10.0")).toBe("low");
    });

    it("returns 'high' when value is above the maximum", () => {
      expect(computeStatus("17.8", "12.0 - 16.0")).toBe("high");
      expect(computeStatus("165", "70 - 140")).toBe("high");
      expect(computeStatus("11.2", "4.0 - 10.0")).toBe("high");
    });

    it("handles en-dash and em-dash separators correctly", () => {
      expect(computeStatus("14.5", "13.0 – 17.5")).toBe("normal");
      expect(computeStatus("12.0", "13.0 – 17.5")).toBe("low");
      expect(computeStatus("18.0", "13.0 — 17.5")).toBe("high");
    });

    it("handles formatted numbers with commas", () => {
      expect(computeStatus("1,250", "1,000 - 2,,500")).toBe("normal");
      expect(computeStatus("850", "1,000 - 2,500")).toBe("low");
      expect(computeStatus("3,100", "1,000 - 2,500")).toBe("high");
    });
  });

  describe("Less-than upper bound ranges", () => {
    it("returns 'normal' when value is less than the upper threshold", () => {
      expect(computeStatus("150", "< 200")).toBe("normal");
      expect(computeStatus("85", "<100")).toBe("normal");
      expect(computeStatus("5.2", "<5.7")).toBe("normal");
    });

    it("returns 'high' when value meets or exceeds the upper threshold", () => {
      expect(computeStatus("200", "< 200")).toBe("high");
      expect(computeStatus("245", "< 200")).toBe("high");
      expect(computeStatus("6.1", "<5.7")).toBe("high");
    });

    it("handles full-width less-than symbol", () => {
      expect(computeStatus("120", "＜ 200")).toBe("normal");
      expect(computeStatus("220", "＜ 200")).toBe("high");
    });
  });

  describe("Greater-than lower bound ranges", () => {
    it("returns 'normal' when value is greater than the lower threshold", () => {
      expect(computeStatus("55", "> 40")).toBe("normal");
      expect(computeStatus("45.5", ">40")).toBe("normal");
    });

    it("returns 'low' when value is less than or equal to the lower threshold", () => {
      expect(computeStatus("40", "> 40")).toBe("low");
      expect(computeStatus("32", "> 40")).toBe("low");
    });

    it("handles full-width greater-than symbol", () => {
      expect(computeStatus("50", "＞ 40")).toBe("normal");
      expect(computeStatus("30", "＞ 40")).toBe("low");
    });
  });

  describe("Edge cases, missing values, and non-numeric inputs", () => {
    it("returns 'unknown' for null or undefined values", () => {
      expect(computeStatus(null, "12 - 16")).toBe("unknown");
      expect(computeStatus(undefined, "12 - 16")).toBe("unknown");
      expect(computeStatus("14", null)).toBe("unknown");
      expect(computeStatus("14", undefined)).toBe("unknown");
      expect(computeStatus(null, null)).toBe("unknown");
    });

    it("returns 'unknown' for empty strings", () => {
      expect(computeStatus("", "12 - 16")).toBe("unknown");
      expect(computeStatus("14", "")).toBe("unknown");
      expect(computeStatus("   ", "12 - 16")).toBe("unknown");
    });

    it("returns 'unknown' for non-numeric qualitative results", () => {
      expect(computeStatus("NEGATIVE", "Negative")).toBe("unknown");
      expect(computeStatus("DETECTED", "Not Detected")).toBe("unknown");
      expect(computeStatus("N/A", "10-20")).toBe("unknown");
    });

    it("returns 'unknown' for unrecognized reference range formats", () => {
      expect(computeStatus("14", "Normal range varies by age")).toBe("unknown");
      expect(computeStatus("14", "See doctor note")).toBe("unknown");
    });
  });
});
