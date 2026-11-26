import type {
  ActiveWorkoutDraft,
  AppDatabase,
  AppSettings,
  WorkoutSession,
  WorkoutTemplate,
} from '../types/workout.ts';
import { createDemoDatabase } from './demoData.ts';

const DB_STORAGE_KEY = 'ironpulse_workout_db_v1';
const DRAFT_STORAGE_KEY = 'ironpulse_active_draft_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultWeightStep: 2.5,
  restTimerSeconds: 90,
};

export function createEmptyDatabase(): AppDatabase {
  const demo = createDemoDatabase();
  // Provide default starter templates even on empty DB? Or empty sessions + starter templates.
  // Keeping starter templates makes first launch immediately usable, while sessions start empty unless demo is loaded.
  return {
    version: 1,
    templates: demo.templates,
    sessions: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      return createEmptyDatabase();
    }
    const parsed = JSON.parse(raw) as Partial<AppDatabase>;
    return normalizeDatabase(parsed);
  } catch {
    return createEmptyDatabase();
  }
}

export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save database to localStorage:', err);
  }
}

export function loadActiveDraft(): ActiveWorkoutDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveWorkoutDraft;
    if (!parsed || typeof parsed.id !== 'string' || !Array.isArray(parsed.exercises)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveDraft(draft: ActiveWorkoutDraft | null): void {
  try {
    if (!draft) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } else {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  } catch (err) {
    console.error('Failed to save active workout draft:', err);
  }
}

export function exportDatabaseToJson(db: AppDatabase): void {
  const payload = JSON.stringify(db, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `ironpulse-backup-${today}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseAndValidateImportedJson(jsonText: string): AppDatabase {
  const parsed: unknown = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Некорректный JSON-файл: ожидается объект базы данных.');
  }

  const candidate = parsed as Partial<AppDatabase>;
  if (!Array.isArray(candidate.templates) && !Array.isArray(candidate.sessions)) {
    throw new Error(
      'Файл не содержит массивов templates или sessions. Проверьте формат экспорта.'
    );
  }

  return normalizeDatabase(candidate);
}

function normalizeDatabase(raw: Partial<AppDatabase>): AppDatabase {
  const templates: WorkoutTemplate[] = Array.isArray(raw.templates)
    ? raw.templates.filter(
        (t): t is WorkoutTemplate =>
          Boolean(t && typeof t.id === 'string' && typeof t.name === 'string' && Array.isArray(t.exercises))
      )
    : [];

  const sessions: WorkoutSession[] = Array.isArray(raw.sessions)
    ? raw.sessions.filter(
        (s): s is WorkoutSession =>
          Boolean(
            s &&
              typeof s.id === 'string' &&
              typeof s.name === 'string' &&
              typeof s.date === 'string' &&
              Array.isArray(s.exercises)
          )
      )
    : [];

  const settings: AppSettings = {
    defaultWeightStep:
      raw.settings?.defaultWeightStep === 1.25 || raw.settings?.defaultWeightStep === 2.5
        ? raw.settings.defaultWeightStep
        : DEFAULT_SETTINGS.defaultWeightStep,
    restTimerSeconds:
      typeof raw.settings?.restTimerSeconds === 'number' && raw.settings.restTimerSeconds >= 15
        ? raw.settings.restTimerSeconds
        : DEFAULT_SETTINGS.restTimerSeconds,
  };

  return {
    version: 1,
    templates,
    sessions,
    settings,
  };
}
