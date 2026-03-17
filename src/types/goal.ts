export type GoalCategory = 'Personal goals' | 'Department/Service goals';

export type GoalRouteStep = 'Goal Setting' | 'Mid-Year Discussion' | 'Year-End Review';

export type GoalRating = 'Unrated' | 'Meets' | 'Exceeds' | 'Outstanding' | 'Below';

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

export interface Goal {
  id: string;
  employeeName: string;
  documentId: string;
  category: GoalCategory;
  type: string;
  title: string;
  description: string;
  weight: number;
  expectedResult: string;
  routeStep: GoalRouteStep;
  midYearFeedback?: string;
  midYearAdjustment?: string;
  rating: GoalRating;
  achievementPercent: number;
  ratingDescription?: string;
  progress: number;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GoalDocument {
  documentId: string;
  employeeName: string;
  department: string;
  division?: string;
  location?: string;
  jobFamily?: string;
  jobRole?: string;
  localEmployeeId?: string;
  managerUsername?: string;
  hrManagerUsername?: string;
  goals: Goal[];
  weightTotal: number;
  isWeightValid: boolean;
}

export interface GoalUploadMeta {
  filename: string;
  goalCount: number;
  employeeCount: number;
  uploadedAt: string;
  invalidWeightEmployees: string[];
}

export const RATING_SCORE_MAP: Record<GoalRating, number> = {
  Outstanding: 100,
  Exceeds: 85,
  Meets: 70,
  Below: 40,
  Unrated: 0,
};
