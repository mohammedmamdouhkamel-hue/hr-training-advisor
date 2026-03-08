import { describe, it, expect } from 'vitest';
import { parseCSV } from './csv-parser';

describe('parseCSV', () => {
  it('parses standard CSV with headers and rows', () => {
    const csv = 'Name,Role,Score\nAlice,Engineer,85\nBob,Manager,72';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ Name: 'Alice', Role: 'Engineer', Score: '85' });
    expect(result[1]).toEqual({ Name: 'Bob', Role: 'Manager', Score: '72' });
  });

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Description\nAlice,"Senior, Lead Engineer"\nBob,"Manager, L2"';
    const result = parseCSV(csv);
    expect(result[0].Description).toBe('Senior, Lead Engineer');
    expect(result[1].Description).toBe('Manager, L2');
  });

  it('handles Windows line endings (CRLF)', () => {
    const csv = 'Name,Score\r\nAlice,85\r\nBob,72';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].Name).toBe('Alice');
  });

  it('returns empty array for empty input', () => {
    expect(parseCSV('')).toEqual([]);
  });

  it('returns empty array for header-only input', () => {
    expect(parseCSV('Name,Role,Score')).toEqual([]);
  });

  it('filters out completely empty rows', () => {
    const csv = 'Name,Score\nAlice,85\n,,\nBob,72';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it('handles trailing whitespace in values', () => {
    const csv = 'Name,Score\n  Alice  , 85 ';
    const result = parseCSV(csv);
    expect(result[0].Name).toBe('Alice');
    expect(result[0].Score).toBe('85');
  });

  it('handles missing values (fewer columns than headers)', () => {
    const csv = 'Name,Role,Score\nAlice';
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].Role).toBe('');
    expect(result[0].Score).toBe('');
  });

  it('strips surrounding quotes from values', () => {
    const csv = 'Name,Role\n"Alice","Engineer"';
    const result = parseCSV(csv);
    expect(result[0].Name).toBe('Alice');
    expect(result[0].Role).toBe('Engineer');
  });

  it('handles multiple rows with varied data', () => {
    const csv = 'A,B,C\n1,2,3\n4,5,6\n7,8,9';
    const result = parseCSV(csv);
    expect(result).toHaveLength(3);
  });
});
