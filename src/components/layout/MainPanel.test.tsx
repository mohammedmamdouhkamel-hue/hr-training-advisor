import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainPanel from './MainPanel';
import type { Employee } from '../../types/employee';
import type { TrainingPlan } from '../../types/training-plan';

const mockEmployee: Employee = {
  name: 'Alice',
  role: 'Engineer',
  department: 'Tech',
  score: 58,
  competencies: { Coding: 55 },
};

const mockPlan: TrainingPlan = {
  summary: 'Test summary',
  priority_areas: ['Coding'],
  training_plan: [],
  milestones: [],
  expected_improvement: '+10 points',
};

describe('MainPanel', () => {
  it('shows empty state when no employee selected', () => {
    render(<MainPanel selected={null} loading={false} loadingMsg="" error="" plans={{}} onRetry={() => {}} />);
    expect(screen.getByText('Select an employee')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<MainPanel selected={mockEmployee} loading={true} loadingMsg="Generating..." error="" plans={{}} onRetry={() => {}} />);
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    render(<MainPanel selected={mockEmployee} loading={false} loadingMsg="" error="Something broke" plans={{}} onRetry={() => {}} />);
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('shows training plan when available', () => {
    render(<MainPanel selected={mockEmployee} loading={false} loadingMsg="" error="" plans={{ Alice: mockPlan }} onRetry={() => {}} />);
    expect(screen.getByText('Test summary')).toBeInTheDocument();
  });

  it('shows empty state hint text', () => {
    render(<MainPanel selected={null} loading={false} loadingMsg="" error="" plans={{}} onRetry={() => {}} />);
    expect(screen.getByText('Click any card to instantly generate their AI training plan')).toBeInTheDocument();
  });
});
