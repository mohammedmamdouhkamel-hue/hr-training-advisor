import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrainingPlans } from './useTrainingPlans';
import type { Employee } from '../types/employee';

vi.mock('../services/storage', () => ({
  loadPlans: vi.fn(() => null),
  savePlans: vi.fn(),
}));

vi.mock('../services/api-client', () => ({
  generateTrainingPlan: vi.fn(() => Promise.resolve({
    summary: 'Test plan',
    priority_areas: ['Coding'],
    training_plan: [],
    milestones: [],
    expected_improvement: '+10',
  })),
}));

vi.mock('../services/rate-limiter', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, waitSeconds: 0 })),
}));

const emp: Employee = { name: 'Alice', role: 'Dev', department: 'Tech', score: 50, competencies: { Coding: 50 } };

describe('useTrainingPlans', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with empty plans', () => {
    const { result } = renderHook(() => useTrainingPlans('sk-ant-test'));
    expect(result.current.plans).toEqual({});
  });

  it('starts with loading false', () => {
    const { result } = renderHook(() => useTrainingPlans('sk-ant-test'));
    expect(result.current.loading).toBe(false);
  });

  it('doGenerate creates a plan', async () => {
    const { result } = renderHook(() => useTrainingPlans('sk-ant-test'));
    await act(async () => { await result.current.doGenerate(emp); });
    expect(result.current.plans['Alice']).toBeDefined();
    expect(result.current.plans['Alice'].summary).toBe('Test plan');
  });

  it('doGenerate sets error on failure', async () => {
    const { generateTrainingPlan } = await import('../services/api-client');
    (generateTrainingPlan as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API down'));
    const { result } = renderHook(() => useTrainingPlans('sk-ant-test'));
    await act(async () => { await result.current.doGenerate(emp); });
    expect(result.current.error).toBe('API down');
  });

  it('doGenerate respects rate limiting', async () => {
    const { checkRateLimit } = await import('../services/rate-limiter');
    (checkRateLimit as ReturnType<typeof vi.fn>).mockReturnValueOnce({ allowed: false, waitSeconds: 30 });
    const { result } = renderHook(() => useTrainingPlans('sk-ant-test'));
    await act(async () => { await result.current.doGenerate(emp); });
    expect(result.current.error).toContain('wait 30 seconds');
  });

  it('autoGenerate skips if plan exists', () => {
    const { result } = renderHook(() => useTrainingPlans('sk-ant-test'));
    // First generate a plan
    act(() => {
      result.current.setPlans({ Alice: { summary: 'existing', priority_areas: [], training_plan: [], milestones: [], expected_improvement: '' } });
    });
    // autoGenerate should skip
    act(() => { result.current.autoGenerate(emp); });
    expect(result.current.loading).toBe(false);
  });

  it('autoGenerate skips if no selected employee', () => {
    const { result } = renderHook(() => useTrainingPlans('sk-ant-test'));
    act(() => { result.current.autoGenerate(null); });
    expect(result.current.loading).toBe(false);
  });

  it('setError updates error state', () => {
    const { result } = renderHook(() => useTrainingPlans('sk-ant-test'));
    act(() => { result.current.setError('test error'); });
    expect(result.current.error).toBe('test error');
  });
});
