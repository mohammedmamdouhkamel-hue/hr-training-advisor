import { describe, it, expect } from 'vitest';
import { validateFile, validateEmployeeCount, validateApiKey, stripHtmlTags, sanitizeEmployeeData } from './validators';

describe('validateFile', () => {
  const createFile = (name: string, size: number) =>
    new File(['x'.repeat(size)], name, { type: 'text/plain' });

  it('returns null for valid CSV file', () => {
    expect(validateFile(createFile('data.csv', 1000))).toBeNull();
  });

  it('returns null for valid XLSX file', () => {
    expect(validateFile(createFile('data.xlsx', 1000))).toBeNull();
  });

  it('returns null for valid XLS file', () => {
    expect(validateFile(createFile('data.xls', 1000))).toBeNull();
  });

  it('rejects unsupported file format', () => {
    expect(validateFile(createFile('data.pdf', 100))).toContain('Unsupported format');
  });

  it('rejects file over 10MB', () => {
    const bigFile = createFile('data.csv', 11 * 1024 * 1024);
    expect(validateFile(bigFile)).toContain('too large');
  });

  it('accepts file at exactly 10MB', () => {
    const exactFile = createFile('data.csv', 10 * 1024 * 1024);
    expect(validateFile(exactFile)).toBeNull();
  });
});

describe('validateEmployeeCount', () => {
  it('returns null for valid count', () => {
    expect(validateEmployeeCount(100)).toBeNull();
  });

  it('returns null for exactly 500', () => {
    expect(validateEmployeeCount(500)).toBeNull();
  });

  it('rejects count over 500', () => {
    expect(validateEmployeeCount(501)).toContain('Too many employees');
  });

  it('rejects zero employees', () => {
    expect(validateEmployeeCount(0)).toContain('Could not detect');
  });
});

describe('validateApiKey', () => {
  it('accepts valid API key format', () => {
    expect(validateApiKey('sk-ant-api03-abcdefghijklmnopqrst')).toBe(true);
  });

  it('rejects key without sk-ant prefix', () => {
    expect(validateApiKey('invalid-key-abcdefghijklmnopqrst')).toBe(false);
  });

  it('rejects key that is too short', () => {
    expect(validateApiKey('sk-ant-short')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateApiKey('')).toBe(false);
  });
});

describe('stripHtmlTags', () => {
  it('removes HTML tags', () => {
    expect(stripHtmlTags('<b>bold</b>')).toBe('bold');
  });

  it('removes script tags', () => {
    expect(stripHtmlTags('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('passes through plain text', () => {
    expect(stripHtmlTags('plain text')).toBe('plain text');
  });

  it('handles nested tags', () => {
    expect(stripHtmlTags('<div><p>text</p></div>')).toBe('text');
  });
});

describe('sanitizeEmployeeData', () => {
  it('strips HTML and trims', () => {
    expect(sanitizeEmployeeData('  <b>Alice</b>  ')).toBe('Alice');
  });

  it('handles clean data', () => {
    expect(sanitizeEmployeeData('Alice')).toBe('Alice');
  });
});
