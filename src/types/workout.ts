/* ─── Compact diary-style workout tracker types ─── */

export interface ProgramExercise {
  name: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  exercises: ProgramExercise[];
}

export interface SetEntry {
  weight: number;
  reps: number;
}

export interface ExerciseEntry {
  name: string;
  sets: SetEntry[];
}

export interface WorkoutEntry {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt?: number;
  exercises: ExerciseEntry[];
  notes?: string;
}

export interface DraftSet {
  weight: string;
  reps: string;
}

export interface DraftExercise {
  name: string;
  sets: DraftSet[];
}

export interface WorkoutDraftState {
  date: string;
  notes: string;
  exercises: DraftExercise[];
  textMode: boolean;
  rawText: string;
}

export interface AppSettings {
  weightStep: 1.25 | 2.5;
}

export interface AppDatabase {
  version: number;
  programs: WorkoutProgram[];
  activeProgramId: string | null;
  program: ProgramExercise[];
  entries: WorkoutEntry[];
  settings: AppSettings;
}

export type NavTab = 'entry' | 'journal' | 'analytics';
