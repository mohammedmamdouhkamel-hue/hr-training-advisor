import type { Goal, GoalUploadMeta } from '../types/goal';

const GOAL_KEYS = {
  GOALS: 'hra:goals',
  GOAL_UPLOAD_META: 'hra:goalUploadMeta',
} as const;

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('localStorage quota exceeded');
  }
}

export function saveGoals(goals: Goal[]): void {
  safeSet(GOAL_KEYS.GOALS, goals);
}

export function loadGoals(): Goal[] | null {
  return safeGet<Goal[]>(GOAL_KEYS.GOALS);
}

export function saveGoalUploadMeta(meta: GoalUploadMeta): void {
  safeSet(GOAL_KEYS.GOAL_UPLOAD_META, meta);
}

export function loadGoalUploadMeta(): GoalUploadMeta | null {
  return safeGet<GoalUploadMeta>(GOAL_KEYS.GOAL_UPLOAD_META);
}

export function clearGoals(): void {
  Object.values(GOAL_KEYS).forEach(k => localStorage.removeItem(k));
}

export { GOAL_KEYS };
