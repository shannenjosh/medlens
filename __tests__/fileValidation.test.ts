import { describe, it, expect } from 'vitest';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export function validateUploadFile(file: { name: string; size: number; type: string }) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported file format. Please upload JPG, PNG, or PDF.' };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { valid: false, error: 'File exceeds the 10 MB limit.' };
  }
  return { valid: true };
}

describe('File Upload Validation', () => {
  describe('MIME Type Validation', () => {
    it('accepts standard JPEG images', () => {
      const result = validateUploadFile({ name: 'scan.jpg', size: 500 * 1024, type: 'image/jpeg' });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts PNG images', () => {
      const result = validateUploadFile({ name: 'report.png', size: 2 * 1024 * 1024, type: 'image/png' });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts WebP images', () => {
      const result = validateUploadFile({ name: 'lab.webp', size: 800 * 1024, type: 'image/webp' });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts PDF documents', () => {
      const result = validateUploadFile({ name: 'blood_work.pdf', size: 5 * 1024 * 1024, type: 'application/pdf' });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects unsupported plain text files', () => {
      const result = validateUploadFile({ name: 'notes.txt', size: 500, type: 'text/plain' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unsupported file format. Please upload JPG, PNG, or PDF.');
    });

    it('rejects executable files', () => {
      const result = validateUploadFile({ name: 'virus.exe', size: 2048, type: 'application/x-msdownload' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unsupported file format. Please upload JPG, PNG, or PDF.');
    });

    it('rejects audio/video multimedia files', () => {
      const result = validateUploadFile({ name: 'recording.mp3', size: 100 * 1024, type: 'audio/mpeg' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unsupported file format. Please upload JPG, PNG, or PDF.');
    });

    it('rejects empty mime type string', () => {
      const result = validateUploadFile({ name: 'unknown', size: 1024, type: '' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unsupported file format. Please upload JPG, PNG, or PDF.');
    });
  });

  describe('File Size Validation', () => {
    it('accepts files within 10 MB limit', () => {
      const result = validateUploadFile({ name: 'small.jpg', size: 500 * 1024, type: 'image/jpeg' });
      expect(result.valid).toBe(true);
    });

    it('accepts files exactly at 10 MB boundary', () => {
      const result = validateUploadFile({ name: 'exact.pdf', size: 10 * 1024 * 1024, type: 'application/pdf' });
      expect(result.valid).toBe(true);
    });

    it('rejects files exceeding 10 MB limit', () => {
      const result = validateUploadFile({ name: 'large.pdf', size: 10 * 1024 * 1024 + 1, type: 'application/pdf' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File exceeds the 10 MB limit.');
    });

    it('rejects 50 MB files', () => {
      const result = validateUploadFile({ name: 'huge.png', size: 50 * 1024 * 1024, type: 'image/png' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File exceeds the 10 MB limit.');
    });
  });
});
