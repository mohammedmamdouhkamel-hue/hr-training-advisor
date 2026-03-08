export interface Competencies {
  [name: string]: number;
}

export interface Employee {
  name: string;
  role: string;
  department: string;
  score: number;
  competencies: Competencies;
}

export type ScoreCategory = 'needsFocus' | 'developing' | 'strong';

export function getScoreCategory(score: number): ScoreCategory {
  if (score >= 80) return 'strong';
  if (score >= 65) return 'developing';
  return 'needsFocus';
}
