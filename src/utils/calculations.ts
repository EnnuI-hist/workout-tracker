import { WorkoutSession, WorkoutSet, WorkoutExercise } from '../types';

/**
 * Calculates Estimated One-Rep Max (1RM) using Epley formula.
 * Formula: weight * (1 + reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  const epley = weight * (1 + reps / 30);
  return Math.round(epley * 10) / 10;
}

/**
 * Computes total tonnage (weight * reps for completed sets)
 */
export function calculateTonnage(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => {
    if (s.completed && s.weight > 0 && s.reps > 0) {
      return sum + s.weight * s.reps;
    }
    return sum;
  }, 0);
}

export function calculateWorkoutTonnage(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => total + calculateTonnage(ex.sets), 0);
}

export interface ProgressionCheckResult {
  isReady: boolean;
  reason: string;
  previousSets?: WorkoutSet[];
  previousWorkoutDate?: string;
  recommendedWeightIncrease?: string;
  lastMaxWeight?: number;
  lastReps?: number;
}

/**
 * Analyzes whether the user is ready to increase weight for an exercise.
 * Rule:
 * If on the previous completed workout:
 * 1. First completed set reached the upper limit (reps >= maxReps)
 * 2. All subsequent completed sets stayed within the target range (reps >= minReps)
 */
export function checkProgression(
  exerciseId: string,
  minReps: number,
  maxReps: number,
  workoutHistory: WorkoutSession[]
): ProgressionCheckResult {
  // Sort workouts newest first
  const sorted = [...workoutHistory]
    .filter(w => w.isCompleted)
    .sort((a, b) => new Date(b.date || b.startedAt).getTime() - new Date(a.date || a.startedAt).getTime());

  // Find the most recent workout where this exercise was performed with completed sets
  for (const session of sorted) {
    const matchedEx = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!matchedEx) continue;

    const completedSets = matchedEx.sets.filter(s => s.completed && s.reps > 0);
    if (completedSets.length === 0) continue;

    const firstSet = completedSets[0];
    const firstSetHitTarget = firstSet.reps >= maxReps;

    const remainingSets = completedSets.slice(1);
    const remainingInTarget = remainingSets.every(s => s.reps >= minReps);

    const prevDateStr = new Date(session.date || session.startedAt).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });

    if (firstSetHitTarget && remainingInTarget) {
      const setsDesc = completedSets.map(s => `${s.weight} кг × ${s.reps}`).join(', ');
      return {
        isReady: true,
        reason: `В прошлый раз (${prevDateStr}): 1-й подход достиг цели (${firstSet.reps} из ${maxReps} повт.), остальные в диапазоне (${setsDesc}). Пора повысить рабочий вес на +1–2.5 кг!`,
        previousSets: completedSets,
        previousWorkoutDate: prevDateStr,
        recommendedWeightIncrease: '+1.25 – 2.5 кг',
        lastMaxWeight: Math.max(...completedSets.map(s => s.weight)),
        lastReps: firstSet.reps
      };
    } else {
      let failDetail = '';
      if (!firstSetHitTarget) {
        failDetail = `1-й подход: ${firstSet.reps} из ${maxReps} повт.`;
      } else {
        const failedSet = remainingSets.find(s => s.reps < minReps);
        failDetail = `подход #${failedSet?.setNumber || '?'}: ${failedSet?.reps} повт. (меньше нижней границы ${minReps})`;
      }

      return {
        isReady: false,
        reason: `В прошлый раз (${prevDateStr}): ${failDetail}. Закрепите текущий вес в диапазоне ${minReps}–${maxReps}.`,
        previousSets: completedSets,
        previousWorkoutDate: prevDateStr,
        lastMaxWeight: Math.max(...completedSets.map(s => s.weight)),
        lastReps: firstSet.reps
      };
    }
  }

  return {
    isReady: false,
    reason: 'Нет данных о предыдущих завершенных тренировках этого упражнения.'
  };
}

/**
 * Finds previous workout set performance for an exercise to display as hint
 */
export function getPreviousExerciseSets(
  exerciseId: string,
  workoutHistory: WorkoutSession[]
): WorkoutSet[] | null {
  const sorted = [...workoutHistory]
    .filter(w => w.isCompleted)
    .sort((a, b) => new Date(b.date || b.startedAt).getTime() - new Date(a.date || a.startedAt).getTime());

  for (const session of sorted) {
    const matchedEx = session.exercises.find(e => e.exerciseId === exerciseId);
    if (matchedEx) {
      const completedSets = matchedEx.sets.filter(s => s.completed && s.reps > 0);
      if (completedSets.length > 0) {
        return completedSets;
      }
    }
  }
  return null;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours} ч ${remainingMins} мин`;
}

export function formatTonnage(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} т`;
  }
  return `${Math.round(kg)} кг`;
}

export type StatsPeriod = 'month' | 'year' | 'all';

export function filterWorkoutsByPeriod(workouts: WorkoutSession[], period: StatsPeriod): WorkoutSession[] {
  if (period === 'all') return workouts;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return workouts.filter(w => {
    const wDate = new Date(w.date || w.startedAt);
    if (period === 'year') {
      return wDate.getFullYear() === currentYear;
    }
    if (period === 'month') {
      return wDate.getFullYear() === currentYear && wDate.getMonth() === currentMonth;
    }
    return true;
  });
}

export interface PeriodSummaryStats {
  workoutCount: number;
  totalTonnage: number;
  avgDurationMins: number;
  frequencyPerWeek: string;
}

export function calculatePeriodSummary(workouts: WorkoutSession[], period: StatsPeriod): PeriodSummaryStats {
  const count = workouts.length;
  const totalTonnage = workouts.reduce((sum, w) => sum + w.totalTonnageKg, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.durationSeconds, 0);
  const avgDurationMins = count > 0 ? Math.round(totalDuration / count / 60) : 0;

  let weeksInPeriod = 4.3;
  if (period === 'year') {
    const now = new Date();
    // Weeks elapsed this year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysElapsed = Math.max(7, Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)));
    weeksInPeriod = daysElapsed / 7;
  } else if (period === 'month') {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    weeksInPeriod = daysInMonth / 7;
  } else {
    // All time
    if (workouts.length >= 2) {
      const dates = workouts.map(w => new Date(w.date || w.startedAt).getTime()).sort();
      const spanDays = Math.max(7, Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24)));
      weeksInPeriod = spanDays / 7;
    } else {
      weeksInPeriod = 1;
    }
  }

  const freq = count > 0 ? (count / weeksInPeriod).toFixed(1) : '0';

  return {
    workoutCount: count,
    totalTonnage,
    avgDurationMins,
    frequencyPerWeek: `${freq} тр./нед`
  };
}
