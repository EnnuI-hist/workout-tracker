import type { DraftExercise, ExerciseEntry, ProgramExercise, SetEntry, WorkoutEntry } from '../types/workout.ts';

/* ─── ID ─── */

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ─── Date helpers ─── */

export function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseISODateUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return 0;
  return Date.UTC(y, m - 1, d);
}

export function shiftISODate(iso: string, deltaDays: number): string {
  const ms = parseISODateUTC(iso);
  if (!ms) return iso;
  const shifted = new Date(ms + deltaDays * 86400000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

export function formatFullDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function formatNum(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(n);
}

/* ─── Sorting ─── */

export function sortEntriesNewestFirst(entries: WorkoutEntry[]): WorkoutEntry[] {
  return [...entries].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.createdAt ?? 0) - (a.createdAt ?? 0) ||
      b.id.localeCompare(a.id)
  );
}

export function sortEntriesChronological(entries: WorkoutEntry[]): WorkoutEntry[] {
  return [...entries].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.createdAt ?? 0) - (b.createdAt ?? 0) ||
      a.id.localeCompare(b.id)
  );
}

/* ─── Set formatting & checks ─── */

export function isCompletedSet(s: SetEntry): boolean {
  return s.weight >= 0 && s.reps > 0;
}

export function formatSetsCompact(sets: SetEntry[]): string {
  return sets.map((s) => `${s.weight}×${s.reps}`).join(', ');
}

export function formatEntryAsText(entry: WorkoutEntry): string {
  const lines: string[] = [`📅 ${formatFullDate(entry.date)}`];
  if (entry.notes) lines.push(`📝 ${entry.notes}`);
  lines.push('');
  for (const ex of entry.exercises) {
    if (ex.sets.length === 0) continue;
    lines.push(`${ex.name} — ${formatSetsCompact(ex.sets)}`);
  }
  return lines.join('\n');
}

/* ─── 1RM (Epley) ─── */

export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/* ─── Tonnage ─── */

export function setTonnage(s: SetEntry): number {
  return s.weight * s.reps;
}

export function exerciseTonnage(ex: ExerciseEntry): number {
  return ex.sets.reduce((t, s) => t + setTonnage(s), 0);
}

export function entryTonnage(entry: WorkoutEntry): number {
  return entry.exercises.reduce((t, ex) => t + exerciseTonnage(ex), 0);
}

/* ─── Max weight in exercise ─── */

export function exerciseMaxWeight(ex: ExerciseEntry): number {
  return ex.sets.reduce((mx, s) => (s.weight > mx && s.reps > 0 ? s.weight : mx), 0);
}

export function exerciseBest1RM(ex: ExerciseEntry): number {
  return ex.sets.reduce((mx, s) => {
    const e = epley1RM(s.weight, s.reps);
    return e > mx ? e : mx;
  }, 0);
}

/* ─── Double progression check ─── */

export interface ProgressionStatus {
  shouldIncrease: boolean;
  reason: string;
}

/**
 * Double progression rule:
 * True when the first set reached targetRepMax, all completed sets are >= targetRepMin,
 * and at least targetSets sets were completed.
 */
export function checkDoubleProgression(
  sets: SetEntry[],
  prog: ProgramExercise | undefined
): ProgressionStatus {
  if (!prog || sets.length === 0) return { shouldIncrease: false, reason: '' };

  const { targetSets, targetRepMin, targetRepMax } = prog;
  const completed = sets.filter(isCompletedSet);
  if (completed.length === 0) return { shouldIncrease: false, reason: '' };
  if (completed.length < targetSets) return { shouldIncrease: false, reason: '' };

  const first = completed[0];
  if (first.reps < targetRepMax) return { shouldIncrease: false, reason: '' };

  const allHoldMin = completed.every((s) => s.reps >= targetRepMin);
  if (!allHoldMin) return { shouldIncrease: false, reason: '' };

  return {
    shouldIncrease: true,
    reason: `1-й подход: ${first.reps} повт. (цель ${targetRepMin}-${targetRepMax}), все подходы удержаны — пора повышать вес`,
  };
}

/* ─── Find previous performance ─── */

export function findPreviousPerformance(
  entries: WorkoutEntry[],
  exerciseName: string,
  excludeId?: string
): SetEntry[] | null {
  const key = exerciseName.trim().toLowerCase();
  const sorted = sortEntriesNewestFirst(entries);
  for (const entry of sorted) {
    if (excludeId && entry.id === excludeId) continue;
    const ex = entry.exercises.find((e) => e.name.trim().toLowerCase() === key);
    if (ex && ex.sets.some(isCompletedSet)) {
      return ex.sets.filter(isCompletedSet);
    }
  }
  return null;
}

export function createDraftExercises(
  program: ProgramExercise[],
  entries: WorkoutEntry[]
): DraftExercise[] {
  return program
    .filter((p) => p.name.trim().length > 0)
    .map((p) => {
      const prev = findPreviousPerformance(entries, p.name);
      const sets = Array.from({ length: p.targetSets }, (_, i) => {
        const prevSet = prev?.[i] ?? prev?.[prev.length - 1];
        return {
          weight: prevSet ? String(prevSet.weight) : '',
          reps: '',
        };
      });
      return { name: p.name, sets };
    });
}

/* ─── Progression series for charts ─── */

export interface ProgressionPoint {
  date: string;
  label: string;
  maxWeight: number;
  estimated1RM: number;
  tonnage: number;
  repsFirst: number;
  repsTotal: number;
  repsAll: string;
  bestSetText: string;
}

export function getProgressionSeries(entries: WorkoutEntry[], exerciseName: string): ProgressionPoint[] {
  const key = exerciseName.trim().toLowerCase();
  const chronological = sortEntriesChronological(entries);
  const points: ProgressionPoint[] = [];

  for (const entry of chronological) {
    const ex = entry.exercises.find((e) => e.name.trim().toLowerCase() === key);
    if (!ex || ex.sets.length === 0) continue;
    const completed = ex.sets.filter(isCompletedSet);
    if (completed.length === 0) continue;

    const maxW = exerciseMaxWeight(ex);
    const best1rm = exerciseBest1RM(ex);
    const ton = Math.round(exerciseTonnage(ex));
    const repsFirst = completed[0].reps;
    const repsTotal = completed.reduce((sum, s) => sum + s.reps, 0);
    const repsAll = completed.map((s) => String(s.reps)).join(' / ');

    let bestSet = completed[0];
    for (const s of completed) {
      const s1rm = epley1RM(s.weight, s.reps);
      const b1rm = epley1RM(bestSet.weight, bestSet.reps);
      if (s1rm > b1rm || (s1rm === b1rm && s.reps > bestSet.reps)) {
        bestSet = s;
      }
    }

    points.push({
      date: entry.date,
      label: formatShortDate(entry.date),
      maxWeight: maxW,
      estimated1RM: best1rm,
      tonnage: ton,
      repsFirst,
      repsTotal,
      repsAll,
      bestSetText: `${bestSet.weight}×${bestSet.reps}`,
    });
  }

  return points;
}

/* ─── All exercise names from entries ─── */

export function allExerciseNames(entries: WorkoutEntry[], programNames: string[] = []): string[] {
  const map = new Map<string, string>();
  for (const name of programNames) {
    const t = name.trim();
    if (t) map.set(t.toLowerCase(), t);
  }
  for (const entry of entries) {
    for (const ex of entry.exercises) {
      const t = ex.name.trim();
      if (t && !map.has(t.toLowerCase())) map.set(t.toLowerCase(), t);
    }
  }
  return Array.from(map.values());
}

/* ─── PR table ─── */

export interface ExercisePR {
  name: string;
  maxWeight: number;
  maxWeightDate: string;
  maxWeightSet: string;
  best1RM: number;
  best1RMDate: string;
  best1RMSet: string;
  maxReps: number;
  maxRepsSet: string;
  maxRepsDate: string;
  sessions: number;
}

export function getAllPRs(entries: WorkoutEntry[]): ExercisePR[] {
  const map = new Map<string, ExercisePR>();
  const sorted = sortEntriesChronological(entries);

  for (const entry of sorted) {
    for (const ex of entry.exercises) {
      const key = ex.name.trim().toLowerCase();
      if (!key) continue;
      const completed = ex.sets.filter(isCompletedSet);
      if (completed.length === 0) continue;

      let pr = map.get(key);
      if (!pr) {
        pr = {
          name: ex.name.trim(),
          maxWeight: -1,
          maxWeightDate: '',
          maxWeightSet: '',
          best1RM: 0,
          best1RMDate: '',
          best1RMSet: '',
          maxReps: 0,
          maxRepsSet: '',
          maxRepsDate: '',
          sessions: 0,
        };
        map.set(key, pr);
      }
      pr.sessions++;

      for (const s of completed) {
        if (s.weight > pr.maxWeight || (s.weight === pr.maxWeight && s.reps > parseInt(pr.maxWeightSet.split('×')[1] ?? '0', 10))) {
          pr.maxWeight = s.weight;
          pr.maxWeightDate = entry.date;
          pr.maxWeightSet = `${s.weight}×${s.reps}`;
        }
        const e = epley1RM(s.weight, s.reps);
        if (e > pr.best1RM) {
          pr.best1RM = e;
          pr.best1RMDate = entry.date;
          pr.best1RMSet = `${s.weight}×${s.reps}`;
        }
        if (s.reps > pr.maxReps) {
          pr.maxReps = s.reps;
          pr.maxRepsSet = `${s.weight}×${s.reps}`;
          pr.maxRepsDate = entry.date;
        }
      }
    }
  }

  return Array.from(map.values())
    .map((pr) => ({
      ...pr,
      maxWeight: Math.max(0, pr.maxWeight),
      best1RMDate: pr.best1RMDate || pr.maxRepsDate,
      best1RMSet: pr.best1RMSet || pr.maxRepsSet,
    }))
    .sort((a, b) => b.best1RM - a.best1RM || b.maxReps - a.maxReps);
}

/* ─── Summary KPIs ─── */

export interface AnalyticsSummary {
  total: number;
  avgPerWeek: number;
  monthTonnage: number;
}

export function computeAnalyticsSummary(entries: WorkoutEntry[], todayISO: string): AnalyticsSummary | null {
  if (entries.length === 0) return null;
  const sorted = sortEntriesChronological(entries);
  const firstMs = parseISODateUTC(sorted[0].date);
  const lastMs = parseISODateUTC(sorted[sorted.length - 1].date);
  const spanDays = Math.max(0, Math.round((lastMs - firstMs) / 86400000));
  const weeks = Math.max(1, Math.ceil((spanDays + 1) / 7));
  const avg = entries.length / weeks;

  const isoThirty = shiftISODate(todayISO, -30);
  const monthTonnage = entries
    .filter((e) => e.date >= isoThirty)
    .reduce((t, e) => t + entryTonnage(e), 0);

  return {
    total: entries.length,
    avgPerWeek: Math.round(avg * 10) / 10,
    monthTonnage: Math.round(monthTonnage),
  };
}

/* ─── Progression summary table ─── */

export interface ProgressionRow {
  name: string;
  targetRange: string;
  prevSets: string;
  currSets: string;
  delta: string;
  deltaTone: 'positive' | 'negative' | 'neutral';
  recommendation: string;
  shouldIncrease: boolean;
}

export function getProgressionSummary(
  entries: WorkoutEntry[],
  program: ProgramExercise[]
): ProgressionRow[] {
  const sorted = sortEntriesNewestFirst(entries);
  const rows: ProgressionRow[] = [];

  for (const prog of program) {
    const key = prog.name.trim().toLowerCase();
    let curr: ExerciseEntry | undefined;
    let prev: ExerciseEntry | undefined;

    for (const entry of sorted) {
      const found = entry.exercises.find((e) => e.name.trim().toLowerCase() === key);
      if (found && found.sets.some(isCompletedSet)) {
        const cleanedSets = found.sets.filter(isCompletedSet);
        if (!curr) {
          curr = { name: found.name, sets: cleanedSets };
        } else if (!prev) {
          prev = { name: found.name, sets: cleanedSets };
          break;
        }
      }
    }

    const prevSets = prev ? formatSetsCompact(prev.sets) : '—';
    const currSets = curr ? formatSetsCompact(curr.sets) : '—';

    let delta = '—';
    let deltaTone: ProgressionRow['deltaTone'] = 'neutral';
    let recommendation = 'Нет записей';
    let shouldIncrease = false;

    if (curr && prev) {
      const currMax = exerciseMaxWeight(curr);
      const prevMax = exerciseMaxWeight(prev);
      const weightDiff = Math.round((currMax - prevMax) * 100) / 100;
      const currFirstReps = curr.sets[0]?.reps ?? 0;
      const prevFirstReps = prev.sets[0]?.reps ?? 0;
      const currTotalReps = curr.sets.reduce((s, x) => s + x.reps, 0);
      const prevTotalReps = prev.sets.reduce((s, x) => s + x.reps, 0);
      const firstRepsDiff = currFirstReps - prevFirstReps;
      const totalRepsDiff = currTotalReps - prevTotalReps;

      if (weightDiff !== 0) {
        delta = `${weightDiff > 0 ? '+' : ''}${weightDiff} кг`;
        deltaTone = weightDiff > 0 ? 'positive' : 'negative';
      } else if (firstRepsDiff !== 0) {
        delta = `${firstRepsDiff > 0 ? '+' : ''}${firstRepsDiff} повт.`;
        deltaTone = firstRepsDiff > 0 ? 'positive' : 'negative';
      } else if (totalRepsDiff !== 0) {
        delta = `${totalRepsDiff > 0 ? '+' : ''}${totalRepsDiff} повт. (всего)`;
        deltaTone = totalRepsDiff > 0 ? 'positive' : 'negative';
      } else {
        delta = '0';
        deltaTone = 'neutral';
      }

      const status = checkDoubleProgression(curr.sets, prog);
      if (status.shouldIncrease) {
        recommendation = 'Пора повышать вес';
        shouldIncrease = true;
      } else if (curr.sets.some((s) => s.reps < prog.targetRepMin)) {
        recommendation = `Удержи мин. ${prog.targetRepMin} повт.`;
      } else if (currFirstReps < prog.targetRepMax) {
        recommendation = `Добивай повторения до ${prog.targetRepMax}`;
      } else if (curr.sets.length < prog.targetSets) {
        recommendation = `Выполни все ${prog.targetSets} подхода`;
      } else {
        recommendation = 'Дотяни остальные подходы';
      }
    } else if (curr) {
      const status = checkDoubleProgression(curr.sets, prog);
      const currFirstReps = curr.sets[0]?.reps ?? 0;
      if (status.shouldIncrease) {
        recommendation = 'Пора повышать вес';
        shouldIncrease = true;
      } else if (currFirstReps < prog.targetRepMax) {
        recommendation = `Добивай повторения до ${prog.targetRepMax}`;
      } else {
        recommendation = 'Первая запись — базовая точка';
      }
    }

    rows.push({
      name: prog.name,
      targetRange: `${prog.targetSets}×${prog.targetRepMin}-${prog.targetRepMax}`,
      prevSets,
      currSets,
      delta,
      deltaTone,
      recommendation,
      shouldIncrease,
    });
  }

  return rows;
}
