import { useMemo } from 'react';
import type { Employee } from '../types/employee';
import type { User } from '../types/auth';
import { useEmployees } from './useEmployees';
import { useAuth } from './useAuth';

/**
 * Returns employees filtered by the current user's role:
 * - admin / hr_coordinator: all employees
 * - manager: only employees whose name matches a directReport user's fullName
 * - employee: only their own data
 *
 * The mapping works by looking up the manager's directReportIds in hra_users,
 * then matching those users' fullName fields against the uploaded Employee.name.
 */
export function useTeamEmployees(): { teamEmployees: Employee[]; allEmployees: Employee[] } {
  const { employees } = useEmployees();
  const { user, hasRole } = useAuth();

  const teamEmployees = useMemo(() => {
    if (!user) return [];

    // Admin and HR see everything
    if (hasRole(['admin', 'hr_coordinator'])) {
      return employees;
    }

    // Manager sees only their direct reports
    if (hasRole('manager')) {
      return getManagerTeamEmployees(user, employees);
    }

    // Employee sees only their own data
    return employees.filter(e => e.name === user.fullName);
  }, [employees, user, hasRole]);

  return { teamEmployees, allEmployees: employees };
}

/**
 * Given a manager user and all employees, returns only the employees
 * that belong to the manager's team. Matches by:
 * 1. Looking up directReportIds in localStorage hra_users
 * 2. Getting the fullName of each direct report
 * 3. Matching against Employee.name
 * Falls back to department matching if no directReportIds are configured.
 */
function getManagerTeamEmployees(manager: User, employees: Employee[]): Employee[] {
  if (!manager.directReportIds || manager.directReportIds.length === 0) {
    // Fallback: match by department
    return employees.filter(e => e.department === manager.department);
  }

  // Look up direct report user records to get their fullNames
  try {
    const raw = localStorage.getItem('hra_users');
    if (!raw) return employees.filter(e => e.department === manager.department);

    const users: User[] = JSON.parse(raw);
    const reportNames = new Set(
      manager.directReportIds
        .map(id => users.find(u => u.id === id)?.fullName)
        .filter((n): n is string => !!n)
    );

    if (reportNames.size === 0) {
      return employees.filter(e => e.department === manager.department);
    }

    return employees.filter(e => reportNames.has(e.name));
  } catch {
    return employees.filter(e => e.department === manager.department);
  }
}
