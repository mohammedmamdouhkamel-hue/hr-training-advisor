import { useState } from 'react';
import type { Employee } from '../types/employee';
import { saveEmployees, loadEmployees, saveUploadedFile, loadUploadedFile } from '../services/storage';

export function useEmployees() {
  const [employees, setEmployeesState] = useState<Employee[]>(() => loadEmployees() || []);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [uploadedFile, setUploadedFileState] = useState<string | null>(() => loadUploadedFile());

  const setEmployees = (emps: Employee[]) => {
    setEmployeesState(emps);
    saveEmployees(emps);
  };

  const setUploadedFile = (filename: string | null) => {
    setUploadedFileState(filename);
    if (filename) saveUploadedFile(filename);
  };

  return { employees, setEmployees, selected, setSelected, uploadedFile, setUploadedFile };
}
