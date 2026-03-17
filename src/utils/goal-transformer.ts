import type { Goal, GoalCategory, GoalRating, GoalRouteStep, GoalStatus, GoalDocument } from '../types/goal';

interface ColumnMap {
  employeeFirstName: number;
  employeeLastName: number;
  department: number;
  division: number;
  location: number;
  jobFamily: number;
  jobRole: number;
  localEmployeeId: number;
  managerUsername: number;
  hrManagerUsername: number;
  goalId: number;
  category: number;
  type: number;
  title: number;
  description: number;
  weight: number;
  expectedResult: number;
  routeStep: number;
  midYearFeedback: number;
  rating: number;
  documentId: number;
  achievementPercent: number;
  ratingDescription: number;
  goalOwnerUsername: number;
}

const COLUMN_PATTERNS: Record<keyof ColumnMap, RegExp> = {
  employeeFirstName: /goal\s*owner\s*first\s*name/i,
  employeeLastName: /goal\s*owner\s*last\s*name/i,
  department: /goal\s*owner\s*department|^department$/i,
  division: /goal\s*owner\s*division|^division$/i,
  location: /goal\s*owner\s*location|^location$/i,
  jobFamily: /job\s*family/i,
  jobRole: /subject\s*group\s*job\s*role|^job\s*role$/i,
  localEmployeeId: /local\s*employee\s*id/i,
  managerUsername: /^manager\s*username$/i,
  hrManagerUsername: /hr\s*manager/i,
  goalId: /^goal\s*id$/i,
  category: /^category$/i,
  type: /^type$/i,
  title: /^title$/i,
  description: /^description$/i,
  weight: /^weight$/i,
  expectedResult: /expected\s*result/i,
  routeStep: /current\s*route\s*step|route\s*step/i,
  midYearFeedback: /mid.year\s*feedback/i,
  rating: /goal\s*official\s*rating$/i,
  documentId: /document\s*id/i,
  achievementPercent: /achievement/i,
  ratingDescription: /rating\s*description/i,
  goalOwnerUsername: /goal\s*owner\s*username/i,
};

function detectColumns(headers: string[]): Partial<ColumnMap> {
  const map: Partial<ColumnMap> = {};
  for (const [key, pattern] of Object.entries(COLUMN_PATTERNS)) {
    const idx = headers.findIndex(h => pattern.test(h.trim()));
    if (idx !== -1) {
      (map as Record<string, number>)[key] = idx;
    }
  }
  return map;
}

function parseCategory(value: string): GoalCategory {
  if (/department|service/i.test(value)) return 'Department/Service goals';
  return 'Personal goals';
}

function parseRating(value: string): GoalRating {
  if (/outstanding/i.test(value)) return 'Outstanding';
  if (/exceed/i.test(value)) return 'Exceeds';
  if (/meets|meet/i.test(value)) return 'Meets';
  if (/below/i.test(value)) return 'Below';
  return 'Unrated';
}

function parseRouteStep(value: string): GoalRouteStep {
  if (/mid.year/i.test(value)) return 'Mid-Year Discussion';
  if (/year.end/i.test(value)) return 'Year-End Review';
  return 'Goal Setting';
}

function deriveStatus(rating: GoalRating, routeStep: GoalRouteStep): GoalStatus {
  if (rating !== 'Unrated') return 'completed';
  if (routeStep === 'Mid-Year Discussion') return 'in_progress';
  return 'not_started';
}

function deriveProgress(rating: GoalRating, routeStep: GoalRouteStep, achievement: number): number {
  if (achievement > 0) return Math.min(achievement, 100);
  if (rating !== 'Unrated') return 100;
  if (routeStep === 'Mid-Year Discussion') return 50;
  return 0;
}

function formatName(first: string, last: string): string {
  const f = first.trim().charAt(0).toUpperCase() + first.trim().slice(1).toLowerCase();
  const l = last.trim().charAt(0).toUpperCase() + last.trim().slice(1).toLowerCase();
  return `${f} ${l}`;
}

function getVal(row: string[], colMap: Partial<ColumnMap>, key: keyof ColumnMap): string {
  const idx = colMap[key];
  if (idx === undefined || idx >= row.length) return '';
  return (row[idx] ?? '').trim();
}

export function transformGoalData(headers: string[], rows: string[][]): Goal[] {
  const colMap = detectColumns(headers);
  const now = new Date().toISOString();
  const goals: Goal[] = [];

  for (const row of rows) {
    const firstName = getVal(row, colMap, 'employeeFirstName');
    const lastName = getVal(row, colMap, 'employeeLastName');
    if (!firstName && !lastName) continue;

    const goalIdRaw = getVal(row, colMap, 'goalId');
    const title = getVal(row, colMap, 'title');
    if (!title && !goalIdRaw) continue;

    const categoryRaw = getVal(row, colMap, 'category');
    const ratingRaw = getVal(row, colMap, 'rating');
    const routeStepRaw = getVal(row, colMap, 'routeStep');
    const weightRaw = getVal(row, colMap, 'weight');
    const achievementRaw = getVal(row, colMap, 'achievementPercent');

    const rating = parseRating(ratingRaw);
    const routeStep = parseRouteStep(routeStepRaw);
    const achievement = parseFloat(achievementRaw) || 0;

    goals.push({
      id: goalIdRaw || `goal-${goals.length + 1}`,
      employeeName: formatName(firstName, lastName),
      documentId: getVal(row, colMap, 'documentId'),
      category: parseCategory(categoryRaw),
      type: getVal(row, colMap, 'type') || 'user',
      title,
      description: getVal(row, colMap, 'description'),
      weight: parseFloat(weightRaw) || 0,
      expectedResult: getVal(row, colMap, 'expectedResult'),
      routeStep,
      midYearFeedback: getVal(row, colMap, 'midYearFeedback') || undefined,
      rating,
      achievementPercent: achievement,
      ratingDescription: getVal(row, colMap, 'ratingDescription') || undefined,
      progress: deriveProgress(rating, routeStep, achievement),
      status: deriveStatus(rating, routeStep),
      createdAt: now,
      updatedAt: now,
    });
  }

  return goals;
}

export function validateGoalWeights(goals: Goal[]): { valid: GoalDocument[]; invalid: GoalDocument[] } {
  const grouped = new Map<string, Goal[]>();
  for (const g of goals) {
    const key = g.employeeName;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(g);
  }

  const valid: GoalDocument[] = [];
  const invalid: GoalDocument[] = [];

  for (const [name, empGoals] of grouped) {
    const weightTotal = empGoals.reduce((sum, g) => sum + g.weight, 0);
    const isWeightValid = Math.abs(weightTotal - 100) < 0.5;

    const doc: GoalDocument = {
      documentId: empGoals[0]?.documentId ?? '',
      employeeName: name,
      department: '',
      goals: empGoals,
      weightTotal,
      isWeightValid,
    };

    if (isWeightValid) {
      valid.push(doc);
    } else {
      invalid.push(doc);
    }
  }

  return { valid, invalid };
}
