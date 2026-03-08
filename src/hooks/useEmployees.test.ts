import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmployees } from './useEmployees';
import { saveEmployees, saveUploadedFile } from '../services/storage';
import type { Employee } from '../types/employee';

vi.mock('../services/storage', () => ({
  loadEmployees: vi.fn(() => null),
  saveEmployees: vi.fn(),
  loadUploadedFile: vi.fn(() => null),
  saveUploadedFile: vi.fn(),
}));

const mockEmp: Employee = { name: 'Test', role: 'Dev', department: 'Tech', score: 70, competencies: { Coding: 70 } };

describe('useEmployees', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with empty employees', () => {
    const { result } = renderHook(() => useEmployees());
    expect(result.current.employees).toEqual([]);
  });

  it('starts with null selected', () => {
    const { result } = renderHook(() => useEmployees());
    expect(result.current.selected).toBeNull();
  });

  it('starts with null uploadedFile', () => {
    const { result } = renderHook(() => useEmployees());
    expect(result.current.uploadedFile).toBeNull();
  });

  it('setEmployees updates and saves', () => {
    const { result } = renderHook(() => useEmployees());
    act(() => result.current.setEmployees([mockEmp]));
    expect(result.current.employees).toEqual([mockEmp]);
    expect(saveEmployees).toHaveBeenCalledWith([mockEmp]);
  });

  it('setSelected updates selected', () => {
    const { result } = renderHook(() => useEmployees());
    act(() => result.current.setSelected(mockEmp));
    expect(result.current.selected).toEqual(mockEmp);
  });

  it('setUploadedFile updates and saves', () => {
    const { result } = renderHook(() => useEmployees());
    act(() => result.current.setUploadedFile('test.csv'));
    expect(result.current.uploadedFile).toBe('test.csv');
    expect(saveUploadedFile).toHaveBeenCalledWith('test.csv');
  });
});
