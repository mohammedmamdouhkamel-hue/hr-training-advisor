import type { Employee } from '../types/employee';
import type { TrainingPlan } from '../types/training-plan';

const KEYS = {
  EMPLOYEES: 'hra:employees',
  PLANS: 'hra:plans',
  UPLOADED_FILE: 'hra:uploadedFile',
} as const;

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('localStorage quota exceeded');
  }
}

export function saveEmployees(employees: Employee[]): void {
  safeSet(KEYS.EMPLOYEES, employees);
}

export function loadEmployees(): Employee[] | null {
  return safeGet<Employee[]>(KEYS.EMPLOYEES);
}

export function savePlans(plans: Record<string, TrainingPlan>): void {
  safeSet(KEYS.PLANS, plans);
}

export function loadPlans(): Record<string, TrainingPlan> | null {
  return safeGet<Record<string, TrainingPlan>>(KEYS.PLANS);
}

export function saveUploadedFile(filename: string): void {
  safeSet(KEYS.UPLOADED_FILE, filename);
}

export function loadUploadedFile(): string | null {
  return safeGet<string>(KEYS.UPLOADED_FILE);
}

export function clearAll(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}
