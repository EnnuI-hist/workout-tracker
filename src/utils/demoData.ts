import type {
  AppDatabase,
  MuscleGroup,
  WorkoutExercise,
  WorkoutSession,
  WorkoutTemplate,
} from '../types/workout.ts';
import { generateId, offsetISODate } from './calculations.ts';

function makeSets(
  entries: Array<{ weight: number; reps: number }>
): WorkoutExercise['sets'] {
  return entries.map((e) => ({
    id: generateId(),
    weight: e.weight,
    reps: e.reps,
    completed: true,
  }));
}

function makeExercise(
  name: string,
  muscleGroup: MuscleGroup,
  targetSets: number,
  targetRepMin: number,
  targetRepMax: number,
  sets: Array<{ weight: number; reps: number }>
): WorkoutExercise {
  return {
    id: generateId(),
    name,
    muscleGroup,
    targetSets,
    targetRepMin,
    targetRepMax,
    sets: makeSets(sets),
  };
}

export function createDemoDatabase(): AppDatabase {
  const nowIso = new Date().toISOString();

  const templateA: WorkoutTemplate = {
    id: 'tpl-fullbody-a',
    name: 'Full-Body A',
    description: 'Базовый день: присед, горизонтальный жим, вертикальная тяга',
    createdAt: nowIso,
    updatedAt: nowIso,
    exercises: [
      {
        id: 'tpl-a-1',
        name: 'Приседания со штангой',
        muscleGroup: 'Ноги',
        targetSets: 3,
        targetRepMin: 6,
        targetRepMax: 8,
      },
      {
        id: 'tpl-a-2',
        name: 'Жим штанги лёжа',
        muscleGroup: 'Грудь',
        targetSets: 3,
        targetRepMin: 8,
        targetRepMax: 10,
      },
      {
        id: 'tpl-a-3',
        name: 'Тяга верхнего блока',
        muscleGroup: 'Спина',
        targetSets: 3,
        targetRepMin: 8,
        targetRepMax: 12,
      },
      {
        id: 'tpl-a-4',
        name: 'Жим гантелей сидя',
        muscleGroup: 'Плечи',
        targetSets: 3,
        targetRepMin: 10,
        targetRepMax: 12,
      },
      {
        id: 'tpl-a-5',
        name: 'Подъём штанги на бицепс',
        muscleGroup: 'Руки',
        targetSets: 3,
        targetRepMin: 10,
        targetRepMax: 12,
      },
    ],
  };

  const templateB: WorkoutTemplate = {
    id: 'tpl-fullbody-b',
    name: 'Full-Body B',
    description: 'День задней цепи: румынская тяга, наклонный жим, тяга в наклоне',
    createdAt: nowIso,
    updatedAt: nowIso,
    exercises: [
      {
        id: 'tpl-b-1',
        name: 'Румынская тяга',
        muscleGroup: 'Ноги',
        targetSets: 3,
        targetRepMin: 8,
        targetRepMax: 10,
      },
      {
        id: 'tpl-b-2',
        name: 'Жим гантелей на наклонной',
        muscleGroup: 'Грудь',
        targetSets: 3,
        targetRepMin: 8,
        targetRepMax: 12,
      },
      {
        id: 'tpl-b-3',
        name: 'Тяга штанги в наклоне',
        muscleGroup: 'Спина',
        targetSets: 3,
        targetRepMin: 8,
        targetRepMax: 10,
      },
      {
        id: 'tpl-b-4',
        name: 'Махи гантелями в стороны',
        muscleGroup: 'Плечи',
        targetSets: 3,
        targetRepMin: 12,
        targetRepMax: 15,
      },
      {
        id: 'tpl-b-5',
        name: 'Разгибание рук на блоке',
        muscleGroup: 'Руки',
        targetSets: 3,
        targetRepMin: 10,
        targetRepMax: 12,
      },
    ],
  };

  const templateC: WorkoutTemplate = {
    id: 'tpl-fullbody-c',
    name: 'Full-Body C',
    description: 'Силовой баланс: жим ногами, армейский жим, подтягивания',
    createdAt: nowIso,
    updatedAt: nowIso,
    exercises: [
      {
        id: 'tpl-c-1',
        name: 'Жим ногами в тренажёре',
        muscleGroup: 'Ноги',
        targetSets: 3,
        targetRepMin: 10,
        targetRepMax: 12,
      },
      {
        id: 'tpl-c-2',
        name: 'Армейский жим стоя',
        muscleGroup: 'Плечи',
        targetSets: 3,
        targetRepMin: 6,
        targetRepMax: 8,
      },
      {
        id: 'tpl-c-3',
        name: 'Тяга горизонтального блока',
        muscleGroup: 'Спина',
        targetSets: 3,
        targetRepMin: 10,
        targetRepMax: 12,
      },
      {
        id: 'tpl-c-4',
        name: 'Сведение рук в кроссовере',
        muscleGroup: 'Грудь',
        targetSets: 3,
        targetRepMin: 12,
        targetRepMax: 15,
      },
      {
        id: 'tpl-c-5',
        name: 'Скручивания на пресс',
        muscleGroup: 'Кор',
        targetSets: 3,
        targetRepMin: 12,
        targetRepMax: 15,
      },
    ],
  };

  // 4 weeks x 3 workouts/week = 12 workouts ending recently
  const sessions: WorkoutSession[] = [
    // Week 1
    buildSession('tpl-fullbody-a', 'Full-Body A', -27, 62, [
      makeExercise('Приседания со штангой', 'Ноги', 3, 6, 8, [
        { weight: 80, reps: 6 },
        { weight: 80, reps: 6 },
        { weight: 80, reps: 6 },
      ]),
      makeExercise('Жим штанги лёжа', 'Грудь', 3, 8, 10, [
        { weight: 60, reps: 8 },
        { weight: 60, reps: 8 },
        { weight: 60, reps: 8 },
      ]),
      makeExercise('Тяга верхнего блока', 'Спина', 3, 8, 12, [
        { weight: 50, reps: 10 },
        { weight: 50, reps: 9 },
        { weight: 50, reps: 8 },
      ]),
      makeExercise('Жим гантелей сидя', 'Плечи', 3, 10, 12, [
        { weight: 16, reps: 10 },
        { weight: 16, reps: 10 },
        { weight: 16, reps: 10 },
      ]),
      makeExercise('Подъём штанги на бицепс', 'Руки', 3, 10, 12, [
        { weight: 25, reps: 10 },
        { weight: 25, reps: 10 },
        { weight: 25, reps: 9 },
      ]),
    ]),
    buildSession('tpl-fullbody-b', 'Full-Body B', -25, 58, [
      makeExercise('Румынская тяга', 'Ноги', 3, 8, 10, [
        { weight: 70, reps: 8 },
        { weight: 70, reps: 8 },
        { weight: 70, reps: 8 },
      ]),
      makeExercise('Жим гантелей на наклонной', 'Грудь', 3, 8, 12, [
        { weight: 20, reps: 9 },
        { weight: 20, reps: 9 },
        { weight: 20, reps: 8 },
      ]),
      makeExercise('Тяга штанги в наклоне', 'Спина', 3, 8, 10, [
        { weight: 55, reps: 8 },
        { weight: 55, reps: 8 },
        { weight: 55, reps: 8 },
      ]),
      makeExercise('Махи гантелями в стороны', 'Плечи', 3, 12, 15, [
        { weight: 8, reps: 12 },
        { weight: 8, reps: 12 },
        { weight: 8, reps: 12 },
      ]),
      makeExercise('Разгибание рук на блоке', 'Руки', 3, 10, 12, [
        { weight: 22.5, reps: 11 },
        { weight: 22.5, reps: 10 },
        { weight: 22.5, reps: 10 },
      ]),
    ]),
    buildSession('tpl-fullbody-c', 'Full-Body C', -23, 55, [
      makeExercise('Жим ногами в тренажёре', 'Ноги', 3, 10, 12, [
        { weight: 120, reps: 10 },
        { weight: 120, reps: 10 },
        { weight: 120, reps: 10 },
      ]),
      makeExercise('Армейский жим стоя', 'Плечи', 3, 6, 8, [
        { weight: 40, reps: 6 },
        { weight: 40, reps: 6 },
        { weight: 40, reps: 6 },
      ]),
      makeExercise('Тяга горизонтального блока', 'Спина', 3, 10, 12, [
        { weight: 50, reps: 10 },
        { weight: 50, reps: 10 },
        { weight: 50, reps: 10 },
      ]),
      makeExercise('Сведение рук в кроссовере', 'Грудь', 3, 12, 15, [
        { weight: 15, reps: 12 },
        { weight: 15, reps: 12 },
        { weight: 15, reps: 12 },
      ]),
      makeExercise('Скручивания на пресс', 'Кор', 3, 12, 15, [
        { weight: 10, reps: 12 },
        { weight: 10, reps: 12 },
        { weight: 10, reps: 12 },
      ]),
    ]),

    // Week 2
    buildSession('tpl-fullbody-a', 'Full-Body A', -20, 64, [
      makeExercise('Приседания со штангой', 'Ноги', 3, 6, 8, [
        { weight: 80, reps: 8 },
        { weight: 80, reps: 7 },
        { weight: 80, reps: 7 },
      ]),
      makeExercise('Жим штанги лёжа', 'Грудь', 3, 8, 10, [
        { weight: 60, reps: 10 },
        { weight: 60, reps: 9 },
        { weight: 60, reps: 9 },
      ]),
      makeExercise('Тяга верхнего блока', 'Спина', 3, 8, 12, [
        { weight: 50, reps: 11 },
        { weight: 50, reps: 11 },
        { weight: 50, reps: 10 },
      ]),
      makeExercise('Жим гантелей сидя', 'Плечи', 3, 10, 12, [
        { weight: 16, reps: 12 },
        { weight: 16, reps: 11 },
        { weight: 16, reps: 11 },
      ]),
      makeExercise('Подъём штанги на бицепс', 'Руки', 3, 10, 12, [
        { weight: 25, reps: 12 },
        { weight: 25, reps: 11 },
        { weight: 25, reps: 10 },
      ]),
    ]),
    buildSession('tpl-fullbody-b', 'Full-Body B', -18, 60, [
      makeExercise('Румынская тяга', 'Ноги', 3, 8, 10, [
        { weight: 70, reps: 10 },
        { weight: 70, reps: 10 },
        { weight: 70, reps: 9 },
      ]),
      makeExercise('Жим гантелей на наклонной', 'Грудь', 3, 8, 12, [
        { weight: 20, reps: 11 },
        { weight: 20, reps: 10 },
        { weight: 20, reps: 10 },
      ]),
      makeExercise('Тяга штанги в наклоне', 'Спина', 3, 8, 10, [
        { weight: 55, reps: 10 },
        { weight: 55, reps: 9 },
        { weight: 55, reps: 9 },
      ]),
      makeExercise('Махи гантелями в стороны', 'Плечи', 3, 12, 15, [
        { weight: 8, reps: 14 },
        { weight: 8, reps: 14 },
        { weight: 8, reps: 13 },
      ]),
      makeExercise('Разгибание рук на блоке', 'Руки', 3, 10, 12, [
        { weight: 22.5, reps: 12 },
        { weight: 22.5, reps: 12 },
        { weight: 22.5, reps: 12 },
      ]),
    ]),
    buildSession('tpl-fullbody-c', 'Full-Body C', -16, 57, [
      makeExercise('Жим ногами в тренажёре', 'Ноги', 3, 10, 12, [
        { weight: 120, reps: 12 },
        { weight: 120, reps: 12 },
        { weight: 120, reps: 12 },
      ]),
      makeExercise('Армейский жим стоя', 'Плечи', 3, 6, 8, [
        { weight: 40, reps: 8 },
        { weight: 40, reps: 7 },
        { weight: 40, reps: 7 },
      ]),
      makeExercise('Тяга горизонтального блока', 'Спина', 3, 10, 12, [
        { weight: 50, reps: 12 },
        { weight: 50, reps: 11 },
        { weight: 50, reps: 11 },
      ]),
      makeExercise('Сведение рук в кроссовере', 'Грудь', 3, 12, 15, [
        { weight: 15, reps: 14 },
        { weight: 15, reps: 14 },
        { weight: 15, reps: 13 },
      ]),
      makeExercise('Скручивания на пресс', 'Кор', 3, 12, 15, [
        { weight: 10, reps: 14 },
        { weight: 10, reps: 14 },
        { weight: 10, reps: 13 },
      ]),
    ]),

    // Week 3
    buildSession('tpl-fullbody-a', 'Full-Body A', -13, 66, [
      makeExercise('Приседания со штангой', 'Ноги', 3, 6, 8, [
        { weight: 80, reps: 8 },
        { weight: 80, reps: 8 },
        { weight: 80, reps: 8 },
      ]),
      makeExercise('Жим штанги лёжа', 'Грудь', 3, 8, 10, [
        { weight: 60, reps: 10 },
        { weight: 60, reps: 10 },
        { weight: 60, reps: 10 },
      ]),
      makeExercise('Тяга верхнего блока', 'Спина', 3, 8, 12, [
        { weight: 50, reps: 12 },
        { weight: 50, reps: 12 },
        { weight: 50, reps: 12 },
      ]),
      makeExercise('Жим гантелей сидя', 'Плечи', 3, 10, 12, [
        { weight: 16, reps: 12 },
        { weight: 16, reps: 12 },
        { weight: 16, reps: 12 },
      ]),
      makeExercise('Подъём штанги на бицепс', 'Руки', 3, 10, 12, [
        { weight: 25, reps: 12 },
        { weight: 25, reps: 12 },
        { weight: 25, reps: 12 },
      ]),
    ]),
    buildSession('tpl-fullbody-b', 'Full-Body B', -11, 61, [
      makeExercise('Румынская тяга', 'Ноги', 3, 8, 10, [
        { weight: 70, reps: 10 },
        { weight: 70, reps: 10 },
        { weight: 70, reps: 10 },
      ]),
      makeExercise('Жим гантелей на наклонной', 'Грудь', 3, 8, 12, [
        { weight: 20, reps: 12 },
        { weight: 20, reps: 12 },
        { weight: 20, reps: 11 },
      ]),
      makeExercise('Тяга штанги в наклоне', 'Спина', 3, 8, 10, [
        { weight: 55, reps: 10 },
        { weight: 55, reps: 10 },
        { weight: 55, reps: 10 },
      ]),
      makeExercise('Махи гантелями в стороны', 'Плечи', 3, 12, 15, [
        { weight: 8, reps: 15 },
        { weight: 8, reps: 15 },
        { weight: 8, reps: 15 },
      ]),
      makeExercise('Разгибание рук на блоке', 'Руки', 3, 10, 12, [
        { weight: 25, reps: 10 },
        { weight: 25, reps: 10 },
        { weight: 25, reps: 10 },
      ]),
    ]),
    buildSession('tpl-fullbody-c', 'Full-Body C', -9, 59, [
      makeExercise('Жим ногами в тренажёре', 'Ноги', 3, 10, 12, [
        { weight: 130, reps: 10 },
        { weight: 130, reps: 10 },
        { weight: 130, reps: 10 },
      ]),
      makeExercise('Армейский жим стоя', 'Плечи', 3, 6, 8, [
        { weight: 40, reps: 8 },
        { weight: 40, reps: 8 },
        { weight: 40, reps: 8 },
      ]),
      makeExercise('Тяга горизонтального блока', 'Спина', 3, 10, 12, [
        { weight: 50, reps: 12 },
        { weight: 50, reps: 12 },
        { weight: 50, reps: 12 },
      ]),
      makeExercise('Сведение рук в кроссовере', 'Грудь', 3, 12, 15, [
        { weight: 15, reps: 15 },
        { weight: 15, reps: 15 },
        { weight: 15, reps: 15 },
      ]),
      makeExercise('Скручивания на пресс', 'Кор', 3, 12, 15, [
        { weight: 10, reps: 15 },
        { weight: 10, reps: 15 },
        { weight: 10, reps: 15 },
      ]),
    ]),

    // Week 4 (Weight progressed!)
    buildSession('tpl-fullbody-a', 'Full-Body A', -6, 68, [
      makeExercise('Приседания со штангой', 'Ноги', 3, 6, 8, [
        { weight: 85, reps: 7 },
        { weight: 85, reps: 6 },
        { weight: 85, reps: 6 },
      ]),
      makeExercise('Жим штанги лёжа', 'Грудь', 3, 8, 10, [
        { weight: 62.5, reps: 10 },
        { weight: 62.5, reps: 10 },
        { weight: 62.5, reps: 10 },
      ]),
      makeExercise('Тяга верхнего блока', 'Спина', 3, 8, 12, [
        { weight: 55, reps: 10 },
        { weight: 55, reps: 9 },
        { weight: 55, reps: 9 },
      ]),
      makeExercise('Жим гантелей сидя', 'Плечи', 3, 10, 12, [
        { weight: 18, reps: 10 },
        { weight: 18, reps: 10 },
        { weight: 18, reps: 10 },
      ]),
      makeExercise('Подъём штанги на бицепс', 'Руки', 3, 10, 12, [
        { weight: 27.5, reps: 11 },
        { weight: 27.5, reps: 10 },
        { weight: 27.5, reps: 10 },
      ]),
    ]),
    buildSession('tpl-fullbody-b', 'Full-Body B', -4, 63, [
      makeExercise('Румынская тяга', 'Ноги', 3, 8, 10, [
        { weight: 75, reps: 9 },
        { weight: 75, reps: 9 },
        { weight: 75, reps: 8 },
      ]),
      makeExercise('Жим гантелей на наклонной', 'Грудь', 3, 8, 12, [
        { weight: 22.5, reps: 9 },
        { weight: 22.5, reps: 9 },
        { weight: 22.5, reps: 8 },
      ]),
      makeExercise('Тяга штанги в наклоне', 'Спина', 3, 8, 10, [
        { weight: 60, reps: 9 },
        { weight: 60, reps: 8 },
        { weight: 60, reps: 8 },
      ]),
      makeExercise('Махи гантелями в стороны', 'Плечи', 3, 12, 15, [
        { weight: 10, reps: 12 },
        { weight: 10, reps: 12 },
        { weight: 10, reps: 12 },
      ]),
      makeExercise('Разгибание рук на блоке', 'Руки', 3, 10, 12, [
        { weight: 25, reps: 12 },
        { weight: 25, reps: 11 },
        { weight: 25, reps: 11 },
      ]),
    ]),
    buildSession('tpl-fullbody-c', 'Full-Body C', -2, 60, [
      makeExercise('Жим ногами в тренажёре', 'Ноги', 3, 10, 12, [
        { weight: 135, reps: 11 },
        { weight: 135, reps: 11 },
        { weight: 135, reps: 10 },
      ]),
      makeExercise('Армейский жим стоя', 'Плечи', 3, 6, 8, [
        { weight: 42.5, reps: 7 },
        { weight: 42.5, reps: 7 },
        { weight: 42.5, reps: 6 },
      ]),
      makeExercise('Тяга горизонтального блока', 'Спина', 3, 10, 12, [
        { weight: 55, reps: 11 },
        { weight: 55, reps: 10 },
        { weight: 55, reps: 10 },
      ]),
      makeExercise('Сведение рук в кроссовере', 'Грудь', 3, 12, 15, [
        { weight: 17.5, reps: 13 },
        { weight: 17.5, reps: 12 },
        { weight: 17.5, reps: 12 },
      ]),
      makeExercise('Скручивания на пресс', 'Кор', 3, 12, 15, [
        { weight: 12.5, reps: 14 },
        { weight: 12.5, reps: 13 },
        { weight: 12.5, reps: 13 },
      ]),
    ]),
  ];

  return {
    version: 1,
    templates: [templateA, templateB, templateC],
    sessions,
    settings: {
      defaultWeightStep: 2.5,
      restTimerSeconds: 90,
    },
  };
}

function buildSession(
  templateId: string,
  name: string,
  daysOffset: number,
  durationMinutes: number,
  exercises: WorkoutExercise[]
): WorkoutSession {
  const date = offsetISODate(daysOffset);
  const start = new Date(`${date}T18:30:00`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return {
    id: generateId(),
    templateId,
    name,
    date,
    startedAt: start.toISOString(),
    finishedAt: end.toISOString(),
    durationMinutes,
    exercises,
  };
}
