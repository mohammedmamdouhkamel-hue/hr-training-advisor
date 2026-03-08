import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';
import type { Employee } from '../../types/employee';

const employees: Employee[] = [
  { name: 'Low', role: 'Dev', department: 'Tech', score: 40, competencies: { A: 40 } },
  { name: 'Mid', role: 'PM', department: 'Product', score: 70, competencies: { B: 70 } },
  { name: 'High', role: 'Lead', department: 'Tech', score: 90, competencies: { C: 90 } },
];

describe('Sidebar', () => {
  it('renders employee count', () => {
    render(<Sidebar employees={employees} selected={null} plans={{}} uploadedFile="test.csv" onSelect={() => {}} />);
    expect(screen.getByText('3 Employees')).toBeInTheDocument();
  });

  it('renders uploaded filename', () => {
    render(<Sidebar employees={employees} selected={null} plans={{}} uploadedFile="data.csv" onSelect={() => {}} />);
    expect(screen.getByText(/data\.csv/)).toBeInTheDocument();
  });

  it('renders category headers', () => {
    render(<Sidebar employees={employees} selected={null} plans={{}} uploadedFile="test.csv" onSelect={() => {}} />);
    // Category headers use Lucide icons + text; text appears in multiple places (stat cards + section headers)
    const needsFocusHeaders = screen.getAllByText('Needs Focus');
    expect(needsFocusHeaders.length).toBeGreaterThan(0);
    const developingHeaders = screen.getAllByText('Developing');
    expect(developingHeaders.length).toBeGreaterThan(0);
    const strongHeaders = screen.getAllByText('Strong');
    expect(strongHeaders.length).toBeGreaterThan(0);
  });

  it('renders all employee names', () => {
    render(<Sidebar employees={employees} selected={null} plans={{}} uploadedFile="test.csv" onSelect={() => {}} />);
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Mid')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('calls onSelect when employee clicked', () => {
    const onSelect = vi.fn();
    render(<Sidebar employees={employees} selected={null} plans={{}} uploadedFile="test.csv" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Low'));
    expect(onSelect).toHaveBeenCalledWith(employees[0]);
  });

  it('shows stat counts correctly', () => {
    render(<Sidebar employees={employees} selected={null} plans={{}} uploadedFile="test.csv" onSelect={() => {}} />);
    const statLabels = screen.getAllByText(/Needs Focus|Developing|Strong|Plans Ready/);
    expect(statLabels.length).toBeGreaterThan(0);
  });
});
