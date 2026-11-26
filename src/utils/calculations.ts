import type {
  MuscleGroup,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from '../types/workout.ts';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Грудь',
  'Спина',
  'Ноги',
  'Плечи',
  'Руки',
  'Кор',
  'Всё тело',
];

export const COMMON_EXERCISES: { name: string; muscleGroup: MuscleGroup }[] = [
  { name: 'Жим штанги лёжа', muscleGroup: 'Грудь' },
  { name: 'Жим гантелей на наклонной', muscleGroup: 'Грудь' },
  { name: 'Отжимания на брусьях', muscleGroup: 'Грудь' },
  { name: 'Сведение рук в кроссовере', muscleGroup: 'Грудь' },
  { name: 'Приседания со штангой', muscleGroup: 'Ноги' },
  { name: 'Жим ногами в тренажёре', muscleGroup: 'Ноги' },
  { name: 'Румынская тяга', muscleGroup: 'Ноги' },
  { name: 'Выпады с гантелями', muscleGroup: 'Ноги' },
  { name: 'Сгибание ног лёжа', muscleGroup: 'Ноги' },
  { name: 'Подъём на носки стоя', muscleGroup: 'Ноги' },
  { name: 'Становая тяга', muscleGroup: 'Спина' },
  { name: 'Подтягивания', muscleGroup: 'Спина' },
  { name: 'Тяга штанги в наклоне', muscleGroup: 'Спина' },
  { name: 'Тяга верхнего блока', muscleGroup: 'Спина' },
  { name: 'Тяга горизонтального блока', muscleGroup: 'Спина' },
  { name: 'Армейский жим стоя', muscleGroup: 'Плечи' },
  { name: 'Жим гантелей сидя', muscleGroup: 'Плечи' },
  { name: 'Махи гантелями в стороны', muscleGroup: 'Плечи' },
  { name: 'Тяга к лицу (Face Pull)', muscleGroup: 'Плечи' },
  { name: 'Подъём штанги на бицепс', muscleGroup: 'Руки' },
  { name: 'Молотки с гантелями', muscleGroup: 'Руки' },
  { name: 'Французский жим', muscleGroup: 'Руки' },
  { name: 'Разгибание рук на блоке', muscleGroup: 'Руки' },
  { name: 'Скручивания на пресс', muscleGroup: 'Кор' },
  { name: 'Планка с отягощением', muscleGroup: 'Кор' },
];

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Epley 1RM formula: weight * (1 + reps / 30).
 * For 1 rep, returns weight directly.
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return roundTo1Decimal(weight);
  return roundTo1Decimal(weight * (1 + reps / 30));
}

export function roundTo1Decimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateSetTonnage(set: WorkoutSet): number {
  if (!set.completed || set.weight < 0 || set.reps <= 0) return 0;
  return set.weight * set.reps;
}

export function calculateExerciseTonnage(exercise: WorkoutExercise): number {
  return exercise.sets.reduce((sum, set) => sum + calculateSetTonnage(set), 0);
}

export function calculateSessionTonnage(session: Pick<WorkoutSession, 'exercises'>): number {
  return session.exercises.reduce((sum, ex) => sum + calculateExerciseTonnage(ex), 0);
}

export function getExerciseMaxWeight(exercise: WorkoutExercise): number {
  let max = 0;
  for (const s of exercise.sets) {
    if (s.completed && s.reps > 0 && s.weight > max) {
      max = s.weight;
    }
  }
  return max;
}

export function getExerciseBest1RM(exercise: WorkoutExercise): number {
  let best = 0;
  for (const s of exercise.sets) {
    if (s.completed && s.weight > 0 && s.reps > 0) {
      const e1rm = calculateEpley1RM(s.weight, s.reps);
      if (e1rm > best) best = e1rm;
    }
  }
  return best;
}

export interface ProgressionStatus {
  shouldIncreaseWeight: boolean;
  completedSetsCount: number;
  requiredSetsCount: number;
  targetRepMax: number | null;
  topWeightUsed: number;
}

/**
 * Evaluates Double Progression rule:
 * If the exercise has a targetRepMax (and targetSets, defaulting to sets.length),
 * check whether at least `requiredSetsCount` sets are completed AND every completed set
 * reached `reps >= targetRepMax`.
 */
export function evaluateDoubleProgression(exercise: WorkoutExercise): ProgressionStatus {
  const targetRepMax = exercise.targetRepMax ?? null;
  const completedSets = exercise.sets.filter((s) => s.completed && s.reps > 0);
  const requiredSetsCount = exercise.targetSets ?? exercise.sets.length;

  const topWeightUsed = completedSets.reduce(
    (max, s) => (s.weight > max ? s.weight : max),
    0
  );

  if (!targetRepMax || requiredSetsCount <= 0 || completedSets.length < requiredSetsCount) {
    return {
      shouldIncreaseWeight: false,
      completedSetsCount: completedSets.length,
      requiredSetsCount,
      targetRepMax,
      topWeightUsed,
    };
  }

  const allReachedUpperLimit = completedSets.every((s) => s.reps >= targetRepMax);

  return {
    shouldIncreaseWeight: allReachedUpperLimit,
    completedSetsCount: completedSets.length,
    requiredSetsCount,
    targetRepMax,
    topWeightUsed,
  };
}

/**
 * Finds the most recent completed session (strictly before `beforeDate` or excluding `excludeSessionId`)
 * that contains the given exercise name (case-insensitive trimmed).
 */
export function findPreviousExercisePerformance(
  sessions: WorkoutSession[],
  exerciseName: string,
  options?: { excludeSessionId?: string; onOrBeforeDate?: string }
): { date: string; sets: WorkoutSet[] } | null {
  const normalized = exerciseName.trim().toLowerCase();
  if (!normalized) return null;

  const sorted = [...sessions].sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return b.finishedAt.localeCompare(a.finishedAt);
  });

  for (const session of sorted) {
    if (options?.excludeSessionId && session.id === options.excludeSessionId) {
      continue;
    }
    if (options?.onOrBeforeDate && session.date > options.onOrBeforeDate) {
      continue;
    }
    const found = session.exercises.find(
      (ex) => ex.name.trim().toLowerCase() === normalized
    );
    if (found) {
      const completed = found.sets.filter((s) => s.completed && s.reps > 0);
      if (completed.length > 0) {
        return { date: session.date, sets: completed };
      }
    }
  }

  return null;
}

export interface ExerciseHistoryPoint {
  sessionId: string;
  date: string;
  label: string;
  maxWeight: number;
  estimated1RM: number;
  tonnage: number;
  bestSetText: string;
}

export function getExerciseProgressionSeries(
  sessions: WorkoutSession[],
  exerciseName: string
): ExerciseHistoryPoint[] {
  const normalized = exerciseName.trim().toLowerCase();
  if (!normalized) return [];

  const chronological = [...sessions].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.finishedAt.localeCompare(b.finishedAt);
  });

  const points: ExerciseHistoryPoint[] = [];

  for (const session of chronological) {
    const ex = session.exercises.find(
      (item) => item.name.trim().toLowerCase() === normalized
    );
    if (!ex) continue;

    const completedSets = ex.sets.filter((s) => s.completed && s.reps > 0);
    if (completedSets.length === 0) continue;

    const maxWeight = getExerciseMaxWeight(ex);
    const estimated1RM = getExerciseBest1RM(ex);
    const tonnage = Math.round(calculateExerciseTonnage(ex));

    let bestSet = completedSets[0];
    for (const s of completedSets) {
      if (
        calculateEpley1RM(s.weight, s.reps) >
        calculateEpley1RM(bestSet.weight, bestSet.reps)
      ) {
        bestSet = s;
      }
    }

    points.push({
      sessionId: session.id,
      date: session.date,
      label: formatShortDate(session.date),
      maxWeight,
      estimated1RM,
      tonnage,
      bestSetText: `${bestSet.weight} кг × ${bestSet.reps}`,
    });
  }

  return points;
}

export interface ExercisePR {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  maxWeight: number;
  maxWeightDate: string;
  bestSetAtMaxWeight: string;
  best1RM: number;
  best1RMDate: string;
  best1RMSet: string;
  sessionsCount: number;
}

export function getAllExercisePRs(sessions: WorkoutSession[]): ExercisePR[] {
  const map = new Map<string, ExercisePR & { maxWeightReps: number }>();

  const chronological = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  for (const session of chronological) {
    for (const ex of session.exercises) {
      const key = ex.name.trim().toLowerCase();
      if (!key) continue;

      const completed = ex.sets.filter((s) => s.completed && s.reps > 0);
      if (completed.length === 0) continue;

      let existing = map.get(key);
      if (!existing) {
        existing = {
          exerciseName: ex.name.trim(),
          muscleGroup: ex.muscleGroup,
          maxWeight: -1,
          maxWeightReps: 0,
          maxWeightDate: session.date,
          bestSetAtMaxWeight: '',
          best1RM: -1,
          best1RMDate: session.date,
          best1RMSet: '',
          sessionsCount: 0,
        };
        map.set(key, existing);
      }

      existing.sessionsCount += 1;

      for (const s of completed) {
        const e1rm = calculateEpley1RM(s.weight, s.reps);
        if (
          s.weight > existing.maxWeight ||
          (s.weight === existing.maxWeight && s.reps > existing.maxWeightReps)
        ) {
          existing.maxWeight = s.weight;
          existing.maxWeightReps = s.reps;
          existing.maxWeightDate = session.date;
          existing.bestSetAtMaxWeight = `${s.weight} кг × ${s.reps}`;
        }
        if (e1rm > existing.best1RM) {
          existing.best1RM = e1rm;
          existing.best1RMDate = session.date;
          existing.best1RMSet = `${s.weight} кг × ${s.reps}`;
        }
      }
    }
  }

  return Array.from(map.values())
    .filter((pr) => pr.maxWeight >= 0)
    .map(({ maxWeightReps: _unused, ...pr }) => pr)
    .sort((a, b) => b.best1RM - a.best1RM);
}

export function getAllUniqueExerciseNames(
  sessions: WorkoutSession[],
  templateExerciseNames: string[] = []
): string[] {
  const map = new Map<string, string>();
  for (const name of templateExerciseNames) {
    const trimmed = name.trim();
    if (trimmed && !map.has(trimmed.toLowerCase())) {
      map.set(trimmed.toLowerCase(), trimmed);
    }
  }
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const trimmed = ex.name.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), trimmed);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'ru'));
}

export function getTodayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function offsetISODate(daysOffset: number, baseDate = new Date()): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function formatFullDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(n);
}
