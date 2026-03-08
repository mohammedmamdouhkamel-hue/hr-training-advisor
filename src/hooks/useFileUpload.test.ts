import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from './useFileUpload';

const mockCallbacks = {
  setEmployees: vi.fn(),
  setSelected: vi.fn(),
  setPlans: vi.fn(),
  setUploadedFile: vi.fn(),
  setError: vi.fn(),
  setView: vi.fn(),
};

describe('useFileUpload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loadSample sets employees and switches to dashboard', () => {
    const { result } = renderHook(() => useFileUpload(mockCallbacks));
    act(() => result.current.loadSample());
    expect(mockCallbacks.setEmployees).toHaveBeenCalledOnce();
    expect(mockCallbacks.setView).toHaveBeenCalledWith('dashboard');
    expect(mockCallbacks.setUploadedFile).toHaveBeenCalledWith('sample_performance_data.csv');
    expect(mockCallbacks.setSelected).toHaveBeenCalledWith(null);
    expect(mockCallbacks.setError).toHaveBeenCalledWith('');
  });

  it('handleFile rejects invalid file extension', async () => {
    const { result } = renderHook(() => useFileUpload(mockCallbacks));
    const file = new File(['data'], 'test.txt', { type: 'text/plain' });
    await act(async () => { await result.current.handleFile(file); });
    expect(mockCallbacks.setError).toHaveBeenCalledWith(expect.stringContaining('Unsupported format'));
  });

  it('handleFile rejects oversized file', async () => {
    const { result } = renderHook(() => useFileUpload(mockCallbacks));
    const bigFile = new File(['x'], 'big.csv', { type: 'text/csv' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });
    await act(async () => { await result.current.handleFile(bigFile); });
    expect(mockCallbacks.setError).toHaveBeenCalledWith(expect.stringContaining('10MB'));
  });

  it('handleFile processes valid CSV', async () => {
    const csvContent = 'Name,Role,Department,Communication Score,Communication Rating,Leadership Score,Leadership Rating\nAlice,Dev,Tech,80,Strong,70,Developing';
    const { result } = renderHook(() => useFileUpload(mockCallbacks));
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    await act(async () => { await result.current.handleFile(file); });
    expect(mockCallbacks.setEmployees).toHaveBeenCalledOnce();
    expect(mockCallbacks.setView).toHaveBeenCalledWith('dashboard');
  });

  it('handleFile handles empty CSV', async () => {
    const { result } = renderHook(() => useFileUpload(mockCallbacks));
    const file = new File([''], 'empty.csv', { type: 'text/csv' });
    await act(async () => { await result.current.handleFile(file); });
    expect(mockCallbacks.setError).toHaveBeenCalledWith(expect.stringContaining('empty'));
  });

  it('handleFile does nothing for null-like file', async () => {
    const { result } = renderHook(() => useFileUpload(mockCallbacks));
    await act(async () => { await result.current.handleFile(null as unknown as File); });
    expect(mockCallbacks.setEmployees).not.toHaveBeenCalled();
  });
});
