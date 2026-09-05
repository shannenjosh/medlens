import { describe, it, expect } from 'vitest';
import { computeStatus } from '@/lib/computeStatus';

// Matches normalization logic in app/api/extract-report/route.ts
interface RawGeminiField {
  test_name?: unknown;
  testName?: unknown;
  value?: unknown;
  unit?: unknown;
  reference_range?: unknown;
  referenceRange?: unknown;
  date?: unknown;
}

function toStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s === 'null' ? null : s;
}

export function normalizeExtractedFields(items: RawGeminiField[]) {
  return items.map((item) => {
    const test_name = toStringOrNull(item.test_name) ?? toStringOrNull(item.testName) ?? 'Unknown Test';
    const value = toStringOrNull(item.value);
    const unit = toStringOrNull(item.unit);
    const reference_range = toStringOrNull(item.reference_range) ?? toStringOrNull(item.referenceRange);
    const date = toStringOrNull(item.date);
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

describe('Extracted Report Data Normalization', () => {
  it('normalizes snake_case keys correctly', () => {
    const raw = [{
      test_name: 'Hemoglobin',
      value: '14.2',
      unit: 'g/dL',
      reference_range: '13.0 - 17.0',
      date: '2025-01-15',
    }];

    const [field] = normalizeExtractedFields(raw);
    expect(field.test_name).toBe('Hemoglobin');
    expect(field.testName).toBe('Hemoglobin');
    expect(field.value).toBe('14.2');
    expect(field.unit).toBe('g/dL');
    expect(field.reference_range).toBe('13.0 - 17.0');
    expect(field.referenceRange).toBe('13.0 - 17.0');
    expect(field.status).toBe('normal');
    expect(field.date).toBe('2025-01-15');
  });

  it('normalizes camelCase keys when snake_case is absent', () => {
    const raw = [{
      testName: 'Glucose Fasting',
      value: '126',
      unit: 'mg/dL',
      referenceRange: '70 - 99',
      date: null,
    }];

    const [field] = normalizeExtractedFields(raw);
    expect(field.test_name).toBe('Glucose Fasting');
    expect(field.testName).toBe('Glucose Fasting');
    expect(field.value).toBe('126');
    expect(field.unit).toBe('mg/dL');
    expect(field.reference_range).toBe('70 - 99');
    expect(field.referenceRange).toBe('70 - 99');
    expect(field.status).toBe('high');
    expect(field.date).toBeNull();
  });

  it('falls back to Unknown Test if test name is null, undefined, or empty', () => {
    const raw = [
      { value: '10', unit: 'mg/dL' },
      { test_name: '', value: '20' },
      { test_name: 'null', value: '30' },
    ];

    const fields = normalizeExtractedFields(raw);
    expect(fields[0].test_name).toBe('Unknown Test');
    expect(fields[1].test_name).toBe('Unknown Test');
    expect(fields[2].test_name).toBe('Unknown Test');
  });

  it('handles string literal null or empty strings as null', () => {
    const raw = [{
      test_name: 'WBC',
      value: '   ',
      unit: 'null',
      reference_range: undefined,
      date: null,
    }];

    const [field] = normalizeExtractedFields(raw);
    expect(field.value).toBeNull();
    expect(field.unit).toBeNull();
    expect(field.reference_range).toBeNull();
    expect(field.date).toBeNull();
    expect(field.status).toBe('unknown');
  });

  it('accurately assigns status using computeStatus for multiple records', () => {
    const raw = [
      { test_name: 'Platelets', value: '90', reference_range: '150 - 450' },
      { test_name: 'ALT', value: '35', reference_range: '< 55' },
      { test_name: 'Cholesterol', value: '250', reference_range: '< 200' },
    ];

    const fields = normalizeExtractedFields(raw);
    expect(fields[0].status).toBe('low');
    expect(fields[1].status).toBe('normal');
    expect(fields[2].status).toBe('high');
  });
});
