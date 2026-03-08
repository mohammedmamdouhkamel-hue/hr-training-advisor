import { describe, it, expect } from 'vitest';
import { transformRawData } from './data-transformer';

describe('transformRawData', () => {
  it('returns empty array for empty input', () => {
    expect(transformRawData([])).toEqual([]);
  });

  it('detects paired competency format (Competency N Name + Competency N Score)', () => {
    const rows = [
      {
        'Employee Name': 'Alice',
        'Role': 'Engineer',
        'Department': 'Tech',
        'Competency 1 Name': 'Coding',
        'Competency 1 Score': '85',
        'Competency 2 Name': 'Communication',
        'Competency 2 Score': '72',
      },
    ];
    const result = transformRawData(rows);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
    expect(result[0].competencies).toEqual({ Coding: 85, Communication: 72 });
  });

  it('detects flat competency format (numeric columns)', () => {
    const rows = [
      {
        'Name': 'Bob',
        'Title': 'Manager',
        'Department': 'Product',
        'Leadership': '70',
        'Communication': '80',
      },
    ];
    const result = transformRawData(rows);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bob');
    expect(result[0].competencies).toEqual({ Leadership: 70, Communication: 80 });
  });

  it('uses Overall Score column when available', () => {
    const rows = [
      {
        'Name': 'Alice',
        'Role': 'Eng',
        'Department': 'Tech',
        'Overall Score': '65',
        'Skill A': '60',
        'Skill B': '70',
      },
    ];
    const result = transformRawData(rows);
    expect(result[0].score).toBe(65);
  });

  it('averages competency scores when no Overall Score column', () => {
    const rows = [
      {
        'Name': 'Alice',
        'Role': 'Eng',
        'Department': 'Tech',
        'Skill A': '60',
        'Skill B': '80',
      },
    ];
    const result = transformRawData(rows);
    expect(result[0].score).toBe(70);
  });

  it('filters out rows with Unknown name and zero score', () => {
    const rows = [
      { 'Name': '', 'Role': '', 'Department': '', 'Skill': '0' },
    ];
    const result = transformRawData(rows);
    expect(result).toHaveLength(0);
  });

  it('handles column detection with alternate names (title, position)', () => {
    const rows = [
      {
        'Employee Name': 'Carol',
        'Position': 'Designer',
        'Dept': 'Design',
        'Creativity': '90',
      },
    ];
    const result = transformRawData(rows);
    expect(result[0].role).toBe('Designer');
    expect(result[0].department).toBe('Design');
  });

  it('skips meta columns (ID, date, manager, etc.)', () => {
    const rows = [
      {
        'Name': 'Dan',
        'Role': 'Analyst',
        'Department': 'Analytics',
        'Employee ID': '12345',
        'Review Date': '2024-01-15',
        'Manager': 'Eve',
        'Data Analysis': '75',
      },
    ];
    const result = transformRawData(rows);
    expect(result[0].competencies).toEqual({ 'Data Analysis': 75 });
    expect(result[0].competencies['Employee ID']).toBeUndefined();
  });

  it('handles multiple employees', () => {
    const rows = [
      { 'Name': 'A', 'Role': 'R1', 'Department': 'D1', 'Skill': '50' },
      { 'Name': 'B', 'Role': 'R2', 'Department': 'D2', 'Skill': '90' },
    ];
    const result = transformRawData(rows);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('A');
    expect(result[1].name).toBe('B');
  });

  it('defaults role and department to N/A when missing', () => {
    const rows = [
      { 'Name': 'Alice', 'Col2': '', 'Col3': '', 'Skill': '80' },
    ];
    const result = transformRawData(rows);
    expect(result[0].role).toBe('N/A');
  });
});
