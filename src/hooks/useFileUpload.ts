import { useCallback } from 'react';
import type { Employee, UploadMeta } from '../types/employee';
import { parseCSV } from '../utils/csv-parser';
import { transformRawData } from '../utils/data-transformer';
import { SAMPLE_DATA } from '../constants/sample-data';
import { validateFile, validateEmployeeCount, sanitizeEmployeeData } from '../utils/validators';

interface UseFileUploadCallbacks {
  setEmployees: (emps: Employee[]) => void;
  setSelected: (emp: Employee | null) => void;
  setPlans: (plans: Record<string, never>) => void;
  setUploadedFile: (name: string | null) => void;
  setUploadMeta: (meta: UploadMeta) => void;
  setError: (err: string) => void;
  setView: (view: 'upload' | 'dashboard') => void;
}

export function useFileUpload(callbacks: UseFileUploadCallbacks) {
  const { setEmployees, setSelected, setPlans, setUploadedFile, setUploadMeta, setError, setView } = callbacks;

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    setError('');

    // Validate file before processing
    const fileError = validateFile(file);
    if (fileError) { setError(fileError); return; }

    setUploadedFile(file.name);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rows: Record<string, string>[];
      if (ext === 'csv') {
        rows = parseCSV(await file.text());
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      } else {
        throw new Error('Unsupported format. Please upload .xlsx, .xls, or .csv.');
      }
      if (!rows.length) throw new Error('File appears empty.');

      // Sanitize all string values
      rows = rows.map(row => {
        const clean: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          clean[k] = sanitizeEmployeeData(String(v));
        }
        return clean;
      });

      const data = transformRawData(rows);

      // Validate employee count
      const countError = validateEmployeeCount(data.length);
      if (countError) throw new Error(countError);

      if (!data.some(e => Object.keys(e.competencies).length > 0)) {
        throw new Error(`No competency scores found. Columns: ${Object.keys(rows[0]).join(', ')}`);
      }
      setEmployees(data);
      setUploadMeta({ filename: file.name, employeeCount: data.length, uploadedAt: new Date().toISOString() });
      setSelected(null);
      setPlans({} as Record<string, never>);
      setView('dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [setEmployees, setSelected, setPlans, setUploadedFile, setUploadMeta, setError, setView]);

  const loadSample = useCallback(() => {
    setEmployees(SAMPLE_DATA);
    setUploadedFile('sample_performance_data.csv');
    setUploadMeta({ filename: 'sample_performance_data.csv', employeeCount: SAMPLE_DATA.length, uploadedAt: new Date().toISOString() });
    setSelected(null);
    setPlans({} as Record<string, never>);
    setError('');
    setView('dashboard');
  }, [setEmployees, setSelected, setPlans, setUploadedFile, setUploadMeta, setError, setView]);

  return { handleFile, loadSample };
}
