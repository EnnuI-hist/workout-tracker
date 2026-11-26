import type { ExerciseCategory } from '../types/workout.ts';

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'Спина',
  'Грудь',
  'Ноги',
  'Плечи',
  'Руки',
  'Кор',
  'Другое',
];

export interface CategoryStyle {
  label: ExerciseCategory;
  borderLeft: string;
  dot: string;
  pill: string;
}

const CATEGORY_STYLE_MAP: Record<ExerciseCategory, CategoryStyle> = {
  Спина: {
    label: 'Спина',
    borderLeft: 'border-l-blue-500',
    dot: 'bg-blue-400',
    pill: 'bg-blue-500/12 border-blue-400/30 text-blue-300 hover:border-blue-400/60',
  },
  Грудь: {
    label: 'Грудь',
    borderLeft: 'border-l-emerald-500',
    dot: 'bg-emerald-400',
    pill: 'bg-emerald-500/12 border-emerald-400/30 text-emerald-300 hover:border-emerald-400/60',
  },
  Ноги: {
    label: 'Ноги',
    borderLeft: 'border-l-violet-500',
    dot: 'bg-violet-400',
    pill: 'bg-violet-500/12 border-violet-400/30 text-violet-300 hover:border-violet-400/60',
  },
  Плечи: {
    label: 'Плечи',
    borderLeft: 'border-l-orange-400',
    dot: 'bg-orange-400',
    pill: 'bg-orange-500/12 border-orange-400/30 text-orange-300 hover:border-orange-400/60',
  },
  Руки: {
    label: 'Руки',
    borderLeft: 'border-l-amber-500',
    dot: 'bg-amber-400',
    pill: 'bg-amber-500/12 border-amber-400/30 text-amber-300 hover:border-amber-400/60',
  },
  Кор: {
    label: 'Кор',
    borderLeft: 'border-l-cyan-400',
    dot: 'bg-cyan-400',
    pill: 'bg-cyan-500/12 border-cyan-400/30 text-cyan-300 hover:border-cyan-400/60',
  },
  Другое: {
    label: 'Другое',
    borderLeft: 'border-l-slate-500',
    dot: 'bg-slate-400',
    pill: 'bg-slate-500/15 border-slate-500/35 text-slate-300 hover:border-slate-400/60',
  },
};

export function isExerciseCategory(value: unknown): value is ExerciseCategory {
  return typeof value === 'string' && EXERCISE_CATEGORIES.includes(value as ExerciseCategory);
}

export function normalizeCategory(value: unknown): ExerciseCategory {
  return isExerciseCategory(value) ? value : 'Другое';
}

export function getCategoryStyle(category: ExerciseCategory | undefined): CategoryStyle {
  return CATEGORY_STYLE_MAP[normalizeCategory(category)];
}
