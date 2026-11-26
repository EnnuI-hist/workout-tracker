export type MuscleGroup =
  | 'Грудь'
  | 'Спина'
  | 'Ноги'
  | 'Плечи'
  | 'Руки'
  | 'Кор'
  | 'Всё тело';

export interface TemplateExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetSets?: number;
  targetRepMin?: number;
  targetRepMax?: number;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  templateId?: string;
  name: string;
  date: string; // ISO YYYY-MM-DD
  startedAt: string; // ISO timestamp
  finishedAt: string; // ISO timestamp
  durationMinutes: number;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface ActiveWorkoutDraft {
  id: string;
  templateId?: string;
  name: string;
  date: string;
  startedAt: string;
  exercises: WorkoutExercise[];
  notes?: string;
}

export type WeightStep = 1.25 | 2.5;

export interface AppSettings {
  defaultWeightStep: WeightStep;
  restTimerSeconds: number;
}

export interface AppDatabase {
  version: number;
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  settings: AppSettings;
}

export type NavTab = 'workout' | 'templates' | 'analytics' | 'history';
