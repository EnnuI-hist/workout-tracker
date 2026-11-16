import { WorkoutSession, WorkoutSet, WorkoutExercise } from '../types';

/**
 * Calculates Estimated One-Rep Max (1RM) using Epley formula.
 * Formula: weight * (1 + reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  // Epley formula
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
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

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

    const prevDateStr = new Date(session.startedAt).toLocaleDateString('ru-RU', {
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
        recommendedWeightIncrease: '+1.25 – 2.5 кг'
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
        previousWorkoutDate: prevDateStr
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
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

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
