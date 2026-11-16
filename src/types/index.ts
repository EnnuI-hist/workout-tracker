export type MuscleCategory = 
  | 'Спина' 
  | 'Грудь' 
  | 'Ноги' 
  | 'Плечи' 
  | 'Руки' 
  | 'Пресс' 
  | 'Другое';

export interface ExerciseDefinition {
  id: string;
  name: string;
  targetSets: number;
  minReps: number;
  maxReps: number;
  category: MuscleCategory;
  description?: string;
  defaultRestSeconds?: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  completedAt?: string;
  previousWeight?: number;
  previousReps?: number;
}

export interface WorkoutExercise {
  id: string; // unique ID in this workout session
  exerciseId: string; // reference to ExerciseDefinition
  name: string;
  category: MuscleCategory;
  minReps: number;
  maxReps: number;
  sets: WorkoutSet[];
  notes?: string;
  readyForProgression?: boolean;
  progressionReason?: string;
}

export interface WorkoutSession {
  id: string;
  title: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalTonnageKg: number;
  notes?: string;
  isCompleted: boolean;
}

export interface WeightRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number;
  note?: string;
}

export interface BodyMeasurements {
  id: string;
  date: string; // YYYY-MM-DD
  chest?: number; // Грудь
  waist?: number; // Талия
  hips?: number; // Бедра
  biceps?: number; // Бицепс
  neck?: number; // Шея
}

export interface UserProfile {
  name: string;
  currentWeight: number;
  targetWeight: number;
  height: number;
  weightHistory: WeightRecord[];
  measurementsHistory: BodyMeasurements[];
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoStartRestTimer: boolean;
  defaultRestSeconds: number;
  autoFillPreviousResults: boolean;
}

export interface AppData {
  version: number;
  profile: UserProfile;
  exercises: ExerciseDefinition[];
  activeWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  settings: AppSettings;
}
