import type { ProgramExercise } from '../types/workout.ts';

export const DEFAULT_PROGRAM: ProgramExercise[] = [
  { name: 'Тяга вертикального блока', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
  { name: 'Жим гантелей на наклонной скамье', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
  { name: 'Тяга в рычажном хаммере', targetSets: 3, targetRepMin: 6, targetRepMax: 12 },
  { name: 'Бабочка (сведение рук)', targetSets: 2, targetRepMin: 8, targetRepMax: 12 },
  { name: 'Сгибание ног', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
  { name: 'Разгибания ног', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
  { name: 'Бицепс на скамье Скотта', targetSets: 2, targetRepMin: 6, targetRepMax: 12 },
  { name: 'Брусья на трицепс', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
  { name: 'Протяжка на средние дельты', targetSets: 4, targetRepMin: 10, targetRepMax: 15 },
  { name: 'Скручивания', targetSets: 3, targetRepMin: 10, targetRepMax: 20 },
  { name: 'Задние дельты на обратной бабочке', targetSets: 2, targetRepMin: 10, targetRepMax: 15 },
  { name: 'Брахиалис', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
  { name: 'Разгибание в блоке из-за головы', targetSets: 2, targetRepMin: 6, targetRepMax: 12 },
];
