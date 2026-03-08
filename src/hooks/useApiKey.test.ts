import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiKey } from './useApiKey';

describe('useApiKey', () => {
  it('starts with empty string', () => {
    const { result } = renderHook(() => useApiKey());
    expect(result.current.apiKey).toBe('');
  });

  it('updates key via setApiKey', () => {
    const { result } = renderHook(() => useApiKey());
    act(() => result.current.setApiKey('sk-ant-test'));
    expect(result.current.apiKey).toBe('sk-ant-test');
  });

  it('clears key via clearKey', () => {
    const { result } = renderHook(() => useApiKey());
    act(() => result.current.setApiKey('sk-ant-test'));
    act(() => result.current.clearKey());
    expect(result.current.apiKey).toBe('');
  });
});
