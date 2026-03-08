import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrainingPlanView from './TrainingPlanView';
import type { TrainingPlan } from '../../types/training-plan';
import type { Employee } from '../../types/employee';

const mockPlan: TrainingPlan = {
  summary: 'Alice needs improvement in leadership and technical skills.',
  priority_areas: ['Leadership', 'Technical Skills', 'Problem Solving'],
  training_plan: [
    {
      area: 'Leadership',
      current_score: 45,
      target_score: 70,
      courses: [
        { title: 'Leadership 101', platform: 'youtube', duration: '4 hours', level: 'Beginner', description: 'Intro to leadership', search_query: 'leadership basics' },
      ],
    },
  ],
  milestones: [
    { week: 'Week 1-2', goal: 'Complete intro courses' },
    { week: 'Week 3-6', goal: 'Apply skills in projects' },
    { week: 'Week 7-12', goal: 'Demonstrate improvement' },
  ],
  expected_improvement: '+15 points expected',
};

const mockEmployee: Employee = {
  name: 'Alice',
  role: 'Engineer',
  department: 'Tech',
  score: 58,
  competencies: { Leadership: 45, 'Technical Skills': 55, Communication: 72 },
};

describe('TrainingPlanView', () => {
  it('renders employee name and role', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Engineer · Tech')).toBeInTheDocument();
  });

  it('renders summary', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    expect(screen.getByText(mockPlan.summary)).toBeInTheDocument();
  });

  it('renders expected improvement', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    expect(screen.getByText(/\+15 points expected/)).toBeInTheDocument();
  });

  it('renders 3 tab buttons', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Training Plan')).toBeInTheDocument();
    expect(screen.getByText('Milestones')).toBeInTheDocument();
  });

  it('shows overview tab by default with priority areas', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    expect(screen.getAllByText('Leadership').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Problem Solving')).toBeInTheDocument();
    expect(screen.getByText('Priority Focus Areas')).toBeInTheDocument();
  });

  it('shows competency scores in overview tab', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('switches to Training Plan tab', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    fireEvent.click(screen.getByText('Training Plan'));
    expect(screen.getByText('Leadership 101')).toBeInTheDocument();
  });

  it('shows score progression in Training Plan tab', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    fireEvent.click(screen.getByText('Training Plan'));
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('switches to Milestones tab', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    fireEvent.click(screen.getByText('Milestones'));
    expect(screen.getByText('Week 1-2')).toBeInTheDocument();
    expect(screen.getByText('Complete intro courses')).toBeInTheDocument();
    expect(screen.getByText('Week 7-12')).toBeInTheDocument();
  });

  it('renders all 3 milestones', () => {
    render(<TrainingPlanView plan={mockPlan} employee={mockEmployee} />);
    fireEvent.click(screen.getByText('Milestones'));
    expect(screen.getByText('Week 1-2')).toBeInTheDocument();
    expect(screen.getByText('Week 3-6')).toBeInTheDocument();
    expect(screen.getByText('Week 7-12')).toBeInTheDocument();
  });
});
