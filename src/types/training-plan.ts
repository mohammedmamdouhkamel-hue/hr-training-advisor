import type { PlatformKey } from './platform';

export interface Course {
  title: string;
  platform: PlatformKey;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  search_query: string;
}

export interface TrainingArea {
  area: string;
  current_score: number;
  target_score: number;
  courses: Course[];
}

export interface Milestone {
  week: string;
  goal: string;
}

export interface TrainingPlan {
  summary: string;
  priority_areas: string[];
  training_plan: TrainingArea[];
  milestones: Milestone[];
  expected_improvement: string;
}
