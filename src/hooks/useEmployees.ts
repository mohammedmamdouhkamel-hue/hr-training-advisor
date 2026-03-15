import { useState } from 'react';
import type { Employee, UploadMeta } from '../types/employee';
import {
  saveEmployees, loadEmployees,
  saveUploadedFile, loadUploadedFile,
  saveUploadMeta, loadUploadMeta,
  clearAll,
} from '../services/storage';

export function useEmployees() {
  const [employees, setEmployeesState] = useState<Employee[]>(() => loadEmployees() || []);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [uploadedFile, setUploadedFileState] = useState<string | null>(() => loadUploadedFile());
  const [uploadMeta, setUploadMetaState] = useState<UploadMeta | null>(() => loadUploadMeta());

  const setEmployees = (emps: Employee[]) => {
    setEmployeesState(emps);
    saveEmployees(emps);
  };

  const setUploadedFile = (filename: string | null) => {
    setUploadedFileState(filename);
    if (filename) saveUploadedFile(filename);
  };

  const setUploadMeta = (meta: UploadMeta) => {
    setUploadMetaState(meta);
    saveUploadMeta(meta);
  };

  const clearResults = () => {
    clearAll();
    setEmployeesState([]);
    setSelected(null);
    setUploadedFileState(null);
    setUploadMetaState(null);
  };

  return {
    employees, setEmployees,
    selected, setSelected,
    uploadedFile, setUploadedFile,
    uploadMeta, setUploadMeta,
    clearResults,
  };
}
