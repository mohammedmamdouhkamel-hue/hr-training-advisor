import type { Goal } from '../types/goal';
import { RATING_SCORE_MAP } from '../types/goal';

export interface GoalBreakdownItem {
  goalTitle: string;
  weight: number;
  ratingScore: number;
  weightedContribution: number;
}

export interface GoalPerformanceResult {
  weightedScore: number;
  completionRate: number;
  breakdown: GoalBreakdownItem[];
}

export function computeGoalPerformanceScore(goals: Goal[]): GoalPerformanceResult {
  if (goals.length === 0) {
    return { weightedScore: 0, completionRate: 0, breakdown: [] };
  }

  const breakdown: GoalBreakdownItem[] = goals.map(g => {
    const ratingScore = RATING_SCORE_MAP[g.rating];
    const weightedContribution = (g.weight * ratingScore) / 100;
    return {
      goalTitle: g.title,
      weight: g.weight,
      ratingScore,
      weightedContribution,
    };
  });

  const weightedScore = Math.round(
    breakdown.reduce((sum, b) => sum + b.weightedContribution, 0) * 10
  ) / 10;

  const ratedCount = goals.filter(g => g.rating !== 'Unrated').length;
  const completionRate = Math.round((ratedCount / goals.length) * 1000) / 10;

  return { weightedScore, completionRate, breakdown };
}
