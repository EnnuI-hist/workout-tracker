import type { ProgramExercise } from '../types/workout.ts';

export const DEFAULT_PROGRAM: ProgramExercise[] = [
  { name: 'Тяга вертикального блока', category: 'Спина', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
  { name: 'Жим гантелей на наклонной скамье', category: 'Грудь', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
  { name: 'Тяга в рычажном хаммере', category: 'Спина', targetSets: 3, targetRepMin: 6, targetRepMax: 12 },
  { name: 'Бабочка (сведение рук)', category: 'Грудь', targetSets: 2, targetRepMin: 8, targetRepMax: 12 },
  { name: 'Сгибание ног', category: 'Ноги', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
  { name: 'Разгибания ног', category: 'Ноги', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
  { name: 'Бицепс на скамье Скотта', category: 'Руки', targetSets: 2, targetRepMin: 6, targetRepMax: 12 },
  { name: 'Брусья на трицепс', category: 'Руки', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
  { name: 'Протяжка на средние дельты', category: 'Плечи', targetSets: 4, targetRepMin: 10, targetRepMax: 15 },
  { name: 'Скручивания', category: 'Кор', targetSets: 3, targetRepMin: 10, targetRepMax: 20 },
  { name: 'Задние дельты на обратной бабочке', category: 'Плечи', targetSets: 2, targetRepMin: 10, targetRepMax: 15 },
  { name: 'Брахиалис', category: 'Руки', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
  { name: 'Разгибание в блоке из-за головы', category: 'Руки', targetSets: 2, targetRepMin: 6, targetRepMax: 12 },
];
