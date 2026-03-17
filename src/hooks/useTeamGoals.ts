import { useMemo } from 'react';
import type { Goal } from '../types/goal';
import { useGoals } from './useGoals';
import { useAuth } from './useAuth';
import { useTeamEmployees } from './useTeamEmployees';

export function useTeamGoals(): { teamGoals: Goal[]; allGoals: Goal[] } {
  const { goals } = useGoals();
  const { user, hasRole } = useAuth();
  const { teamEmployees } = useTeamEmployees();

  const teamGoals = useMemo(() => {
    if (!user) return [];

    // Admin and HR see everything
    if (hasRole(['admin', 'hr_coordinator'])) {
      return goals;
    }

    // Manager sees goals for their team employees
    if (hasRole('manager')) {
      const teamNames = new Set(teamEmployees.map(e => e.name));
      return goals.filter(g => teamNames.has(g.employeeName));
    }

    // Employee sees only their own goals
    return goals.filter(g => g.employeeName === user.fullName);
  }, [goals, user, hasRole, teamEmployees]);

  return { teamGoals, allGoals: goals };
}
