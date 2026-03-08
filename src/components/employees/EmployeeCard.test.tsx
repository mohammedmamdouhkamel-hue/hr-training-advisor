import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmployeeCard from './EmployeeCard';
import type { Employee } from '../../types/employee';

const mockEmployee: Employee = {
  name: 'Sarah Al-Mansoori',
  role: 'Software Engineer',
  department: 'Technology',
  score: 58,
  competencies: { 'Technical Skills': 55, 'Communication': 72 },
};

describe('EmployeeCard', () => {
  it('renders employee name', () => {
    render(<EmployeeCard emp={mockEmployee} onSelect={() => {}} isSelected={false} hasPlan={false} />);
    expect(screen.getByText('Sarah Al-Mansoori')).toBeInTheDocument();
  });

  it('renders role and department', () => {
    render(<EmployeeCard emp={mockEmployee} onSelect={() => {}} isSelected={false} hasPlan={false} />);
    expect(screen.getByText('Software Engineer · Technology')).toBeInTheDocument();
  });

  it('renders score', () => {
    render(<EmployeeCard emp={mockEmployee} onSelect={() => {}} isSelected={false} hasPlan={false} />);
    expect(screen.getByText('58')).toBeInTheDocument();
  });

  it('shows ScoreBadge when not selected', () => {
    render(<EmployeeCard emp={mockEmployee} onSelect={() => {}} isSelected={false} hasPlan={false} />);
    expect(screen.getByText('Needs Focus')).toBeInTheDocument();
  });

  it('hides ScoreBadge when selected', () => {
    render(<EmployeeCard emp={mockEmployee} onSelect={() => {}} isSelected={true} hasPlan={false} />);
    expect(screen.queryByText('Needs Focus')).not.toBeInTheDocument();
  });

  it('shows Plan Ready when hasPlan is true', () => {
    render(<EmployeeCard emp={mockEmployee} onSelect={() => {}} isSelected={false} hasPlan={true} />);
    expect(screen.getByText('Plan Ready')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<EmployeeCard emp={mockEmployee} onSelect={onSelect} isSelected={false} hasPlan={false} />);
    fireEvent.click(screen.getByText('Sarah Al-Mansoori'));
    expect(onSelect).toHaveBeenCalledWith(mockEmployee);
  });

  it('applies selected styles when isSelected', () => {
    const { container } = render(<EmployeeCard emp={mockEmployee} onSelect={() => {}} isSelected={true} hasPlan={false} />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.background).toBe('rgb(15, 23, 42)');
  });
});
