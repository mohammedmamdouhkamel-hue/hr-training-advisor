import { useState, useMemo, useEffect } from 'react';
import type { Goal, GoalUploadMeta } from '../types/goal';
import { saveGoals, loadGoals, saveGoalUploadMeta, loadGoalUploadMeta } from '../services/goal-storage';
import { SAMPLE_GOALS } from '../constants/sample-goals';

export function useGoals() {
  const [goals, setGoalsState] = useState<Goal[]>(() => {
    const stored = loadGoals();
    if (stored && stored.length > 0) return stored;
    // Seed with sample goals on first load
    saveGoals(SAMPLE_GOALS);
    return SAMPLE_GOALS;
  });

  const [goalUploadMeta, setGoalUploadMetaState] = useState<GoalUploadMeta | null>(
    () => loadGoalUploadMeta()
  );

  const setGoals = (newGoals: Goal[]) => {
    setGoalsState(newGoals);
    saveGoals(newGoals);
  };

  const setGoalUploadMeta = (meta: GoalUploadMeta) => {
    setGoalUploadMetaState(meta);
    saveGoalUploadMeta(meta);
  };

  const goalsByEmployee = useMemo(() => {
    const map: Record<string, Goal[]> = {};
    for (const g of goals) {
      if (!map[g.employeeName]) map[g.employeeName] = [];
      map[g.employeeName].push(g);
    }
    return map;
  }, [goals]);

  const getGoalsForEmployee = (name: string): Goal[] => {
    return goalsByEmployee[name] || [];
  };

  const goalStats = useMemo(() => {
    const total = goals.length;
    const uniqueEmployees = new Set(goals.map(g => g.employeeName)).size;
    const rated = goals.filter(g => g.rating !== 'Unrated').length;
    const avgProgress = total > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / total)
      : 0;
    return { total, uniqueEmployees, rated, avgProgress };
  }, [goals]);

  return {
    goals,
    setGoals,
    goalUploadMeta,
    setGoalUploadMeta,
    goalsByEmployee,
    getGoalsForEmployee,
    goalStats,
  };
}
