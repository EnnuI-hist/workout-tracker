import type {
  AppDatabase,
  AppSettings,
  ProgramExercise,
  WorkoutDraftState,
  WorkoutEntry,
  WorkoutProgram,
} from '../types/workout.ts';
import { generateId } from './calculations.ts';

const DB_KEY = 'ironpulse_gym_db_v2';
const DRAFT_KEY = 'ironpulse_entry_draft_v2';

export const DEFAULT_SETTINGS: AppSettings = { weightStep: 2.5 };

export function createEmptyDatabase(): AppDatabase {
  return {
    version: 2,
    programs: [],
    activeProgramId: null,
    program: [],
    entries: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return createEmptyDatabase();
    const parsed = JSON.parse(raw) as Partial<AppDatabase>;
    return normalizeDb(parsed);
  } catch {
    return createEmptyDatabase();
  }
}

export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save DB:', e);
  }
}

export function loadEntryDraft(): WorkoutDraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkoutDraftState>;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.exercises)) {
      return null;
    }
    return {
      date: typeof parsed.date === 'string' ? parsed.date : '',
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      exercises: parsed.exercises,
      textMode: Boolean(parsed.textMode),
      rawText: typeof parsed.rawText === 'string' ? parsed.rawText : '',
    };
  } catch {
    return null;
  }
}

export function saveEntryDraft(draft: WorkoutDraftState | null): void {
  try {
    if (!draft) {
      localStorage.removeItem(DRAFT_KEY);
    } else {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  } catch (e) {
    console.error('Failed to save entry draft:', e);
  }
}

export function exportJson(db: AppDatabase): void {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ironpulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedJson(text: string): AppDatabase {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Некорректный JSON');
  const candidate = parsed as Partial<AppDatabase>;
  if (
    !Array.isArray(candidate.programs) &&
    !Array.isArray(candidate.program) &&
    !Array.isArray(candidate.entries)
  ) {
    throw new Error('JSON не содержит полей programs, program или entries.');
  }
  return normalizeDb(candidate);
}

function normalizeExercises(rawProgram: unknown): ProgramExercise[] {
  if (!Array.isArray(rawProgram)) return [];
  return rawProgram
    .filter(
      (p): p is ProgramExercise =>
        Boolean(
          p &&
            typeof p === 'object' &&
            typeof (p as ProgramExercise).name === 'string' &&
            (p as ProgramExercise).name.trim().length > 0
        )
    )
    .map((p) => ({
      name: p.name.trim(),
      targetSets: Math.max(1, Math.round(Number(p.targetSets) || 2)),
      targetRepMin: Math.max(1, Math.round(Number(p.targetRepMin) || 6)),
      targetRepMax: Math.max(1, Math.round(Number(p.targetRepMax) || 12)),
    }));
}

function normalizePrograms(raw: Partial<AppDatabase>): {
  programs: WorkoutProgram[];
  activeProgramId: string | null;
  program: ProgramExercise[];
} {
  let programs: WorkoutProgram[] = [];

  if (Array.isArray(raw.programs)) {
    programs = raw.programs
      .filter((p): p is WorkoutProgram => Boolean(p && typeof p === 'object'))
      .map((p, idx) => ({
        id: typeof p.id === 'string' && p.id.trim() ? p.id : generateId(),
        name:
          typeof p.name === 'string' && p.name.trim()
            ? p.name.trim()
            : `Программа ${idx + 1}`,
        exercises: normalizeExercises(p.exercises),
      }));
  } else if (Array.isArray(raw.program) && raw.program.length > 0) {
    const legacyExercises = normalizeExercises(raw.program);
    if (legacyExercises.length > 0) {
      programs = [
        {
          id: generateId(),
          name: 'Моя программа',
          exercises: legacyExercises,
        },
      ];
    }
  }

  let activeProgramId: string | null = null;
  if (
    typeof raw.activeProgramId === 'string' &&
    programs.some((p) => p.id === raw.activeProgramId)
  ) {
    activeProgramId = raw.activeProgramId;
  } else if (programs.length > 0) {
    activeProgramId = programs[0].id;
  }

  const active = programs.find((p) => p.id === activeProgramId) ?? null;

  return {
    programs,
    activeProgramId,
    program: active ? active.exercises : [],
  };
}

function normalizeDb(raw: Partial<AppDatabase>): AppDatabase {
  const { programs, activeProgramId, program } = normalizePrograms(raw);

  const entries: WorkoutEntry[] = Array.isArray(raw.entries)
    ? raw.entries
        .filter(
          (e): e is WorkoutEntry =>
            Boolean(
              e &&
                typeof e === 'object' &&
                typeof (e as WorkoutEntry).id === 'string' &&
                typeof (e as WorkoutEntry).date === 'string' &&
                Array.isArray((e as WorkoutEntry).exercises)
            )
        )
        .map((e) => ({
          id: e.id,
          date: e.date,
          createdAt: typeof e.createdAt === 'number' ? e.createdAt : undefined,
          notes: typeof e.notes === 'string' && e.notes.trim() ? e.notes.trim() : undefined,
          exercises: e.exercises
            .filter((ex) => ex && typeof ex.name === 'string' && Array.isArray(ex.sets))
            .map((ex) => ({
              name: ex.name.trim(),
              sets: ex.sets
                .map((s) => ({
                  weight: Math.max(0, Number(s?.weight) || 0),
                  reps: Math.max(0, Math.round(Number(s?.reps) || 0)),
                }))
                .filter((s) => s.reps > 0),
            }))
            .filter((ex) => ex.name.length > 0 && ex.sets.length > 0),
        }))
        .filter((e) => e.exercises.length > 0)
    : [];

  const ws = (raw.settings as AppSettings | undefined)?.weightStep;
  const settings: AppSettings = {
    weightStep: ws === 1.25 || ws === 2.5 ? ws : DEFAULT_SETTINGS.weightStep,
  };

  return { version: 2, programs, activeProgramId, program, entries, settings };
}
