import { describe, it, expect, beforeEach } from 'vitest';
import { saveEmployees, loadEmployees, savePlans, loadPlans, saveUploadedFile, loadUploadedFile, clearAll } from './storage';
import type { Employee } from '../types/employee';
import type { TrainingPlan } from '../types/training-plan';

beforeEach(() => {
  localStorage.clear();
});

const mockEmployee: Employee = {
  name: 'Alice',
  role: 'Engineer',
  department: 'Tech',
  score: 85,
  competencies: { Coding: 90, Communication: 80 },
};

const mockPlan: TrainingPlan = {
  summary: 'Test summary',
  priority_areas: ['Coding'],
  training_plan: [],
  milestones: [],
  expected_improvement: '10 points',
};

describe('storage - employees', () => {
  it('saves and loads employees', () => {
    saveEmployees([mockEmployee]);
    const loaded = loadEmployees();
    expect(loaded).toEqual([mockEmployee]);
  });

  it('returns null when no employees saved', () => {
    expect(loadEmployees()).toBeNull();
  });
});

describe('storage - plans', () => {
  it('saves and loads plans', () => {
    const plans = { Alice: mockPlan };
    savePlans(plans);
    const loaded = loadPlans();
    expect(loaded).toEqual(plans);
  });

  it('returns null when no plans saved', () => {
    expect(loadPlans()).toBeNull();
  });
});

describe('storage - uploaded file', () => {
  it('saves and loads uploaded filename', () => {
    saveUploadedFile('data.csv');
    expect(loadUploadedFile()).toBe('data.csv');
  });

  it('returns null when no file saved', () => {
    expect(loadUploadedFile()).toBeNull();
  });
});

describe('clearAll', () => {
  it('clears all stored data', () => {
    saveEmployees([mockEmployee]);
    savePlans({ Alice: mockPlan });
    saveUploadedFile('test.csv');

    clearAll();

    expect(loadEmployees()).toBeNull();
    expect(loadPlans()).toBeNull();
    expect(loadUploadedFile()).toBeNull();
  });
});

describe('storage - corrupted data', () => {
  it('returns null for corrupted JSON', () => {
    localStorage.setItem('hra:employees', 'not valid json{{{');
    expect(loadEmployees()).toBeNull();
  });
});
