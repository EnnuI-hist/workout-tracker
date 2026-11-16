import { ExerciseDefinition, AppData, WorkoutSession, WorkoutTemplate } from '../types';

export const DEFAULT_EXERCISES: ExerciseDefinition[] = [
  {
    id: 'lat-pulldown',
    name: 'Тяга верхнего блока',
    targetSets: 3,
    minReps: 6,
    maxReps: 10,
    category: 'Спина',
    description: 'Широкий или средний хват, приведение лопаток вниз, тяга к верхней части груди',
    defaultRestSeconds: 90
  },
  {
    id: 'incline-db-press',
    name: 'Жим гантелей на наклонной скамье',
    targetSets: 2,
    minReps: 6,
    maxReps: 10,
    category: 'Грудь',
    description: 'Угол скамьи 30°, контроль опускания, локти под 45–60° к корпусу',
    defaultRestSeconds: 120
  },
  {
    id: 'hammer-row',
    name: 'Тяга в тренажере Хаммер',
    targetSets: 3,
    minReps: 6,
    maxReps: 12,
    category: 'Спина',
    description: 'Нейтральный хват, акцент на сведение лопаток и сокращение широчайших',
    defaultRestSeconds: 90
  },
  {
    id: 'pec-deck-fly',
    name: 'Бабочка (сведение рук)',
    targetSets: 2,
    minReps: 8,
    maxReps: 12,
    category: 'Грудь',
    description: 'Плавное растяжение грудных, пиковое сокращение на 1 сек в центре',
    defaultRestSeconds: 75
  },
  {
    id: 'leg-curl',
    name: 'Сгибание ног',
    targetSets: 3,
    minReps: 8,
    maxReps: 12,
    category: 'Ноги',
    description: 'Бицепс бедра лежа/сидя, фиксация таза, без рывков поясницей',
    defaultRestSeconds: 90
  },
  {
    id: 'leg-extension',
    name: 'Разгибание ног',
    targetSets: 3,
    minReps: 8,
    maxReps: 12,
    category: 'Ноги',
    description: 'Квадрицепс сидя, пауза в верхней точке, медленное опускание',
    defaultRestSeconds: 75
  },
  {
    id: 'scott-curl',
    name: 'Бицепс на скамье Скотта',
    targetSets: 2,
    minReps: 6,
    maxReps: 12,
    category: 'Руки',
    description: 'Изоляция бицепса, не отрывать локти от парты, без читинга',
    defaultRestSeconds: 75
  },
  {
    id: 'triceps-dips',
    name: 'Брусья на трицепс',
    targetSets: 2,
    minReps: 6,
    maxReps: 10,
    category: 'Руки',
    description: 'Корпус вертикально, локти ближе к телу, опускание до угла 90°',
    defaultRestSeconds: 90
  },
  {
    id: 'upright-row',
    name: 'Протяжка на средние дельты',
    targetSets: 4,
    minReps: 10,
    maxReps: 15,
    category: 'Плечи',
    description: 'Хват чуть шире плеч, тяга к подбородку локтями вверх через стороны',
    defaultRestSeconds: 60
  },
  {
    id: 'ab-crunches',
    name: 'Скручивания',
    targetSets: 3,
    minReps: 10,
    maxReps: 20,
    category: 'Пресс',
    description: 'Скручивание грудной клетки к тазу на римском стуле или коврике',
    defaultRestSeconds: 60
  },
  {
    id: 'rear-delt-fly',
    name: 'Задние дельты на обратной бабочке',
    targetSets: 2,
    minReps: 10,
    maxReps: 15,
    category: 'Плечи',
    description: 'Разведение через локти в тренажере пек-дек назад, задний пучок дельт',
    defaultRestSeconds: 60
  },
  {
    id: 'hammer-curl',
    name: 'Брахиалис (молотки)',
    targetSets: 2,
    minReps: 6,
    maxReps: 10,
    category: 'Руки',
    description: 'Сгибание рук нейтральным хватом (ладони друг к другу)',
    defaultRestSeconds: 75
  },
  {
    id: 'overhead-triceps-ext',
    name: 'Разгибание в блоке из-за головы',
    targetSets: 2,
    minReps: 6,
    maxReps: 12,
    category: 'Руки',
    description: 'Длинная головка трицепса в кроссовере, канатная рукоять',
    defaultRestSeconds: 75
  }
];

export const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'template-day-a',
    name: 'Full-Body: День А',
    type: 'day-a',
    color: 'emerald',
    description: 'Базовый протокол Full-Body: акцент на вертикальные тяги, наклонный жим и квадрицепс',
    exercises: [
      { id: 'te-a-1', exerciseId: 'lat-pulldown', name: 'Тяга верхнего блока', category: 'Спина', targetSets: 3, minReps: 6, maxReps: 10, defaultRestSeconds: 90 },
      { id: 'te-a-2', exerciseId: 'incline-db-press', name: 'Жим гантелей на наклонной скамье', category: 'Грудь', targetSets: 2, minReps: 6, maxReps: 10, defaultRestSeconds: 120 },
      { id: 'te-a-3', exerciseId: 'hammer-row', name: 'Тяга в тренажере Хаммер', category: 'Спина', targetSets: 3, minReps: 6, maxReps: 12, defaultRestSeconds: 90 },
      { id: 'te-a-4', exerciseId: 'pec-deck-fly', name: 'Бабочка (сведение рук)', category: 'Грудь', targetSets: 2, minReps: 8, maxReps: 12, defaultRestSeconds: 75 },
      { id: 'te-a-5', exerciseId: 'leg-curl', name: 'Сгибание ног', category: 'Ноги', targetSets: 3, minReps: 8, maxReps: 12, defaultRestSeconds: 90 },
      { id: 'te-a-6', exerciseId: 'leg-extension', name: 'Разгибание ног', category: 'Ноги', targetSets: 3, minReps: 8, maxReps: 12, defaultRestSeconds: 75 },
      { id: 'te-a-7', exerciseId: 'scott-curl', name: 'Бицепс на скамье Скотта', category: 'Руки', targetSets: 2, minReps: 6, maxReps: 12, defaultRestSeconds: 75 },
      { id: 'te-a-8', exerciseId: 'triceps-dips', name: 'Брусья на трицепс', category: 'Руки', targetSets: 2, minReps: 6, maxReps: 10, defaultRestSeconds: 90 },
      { id: 'te-a-9', exerciseId: 'upright-row', name: 'Протяжка на средние дельты', category: 'Плечи', targetSets: 4, minReps: 10, maxReps: 15, defaultRestSeconds: 60 },
      { id: 'te-a-10', exerciseId: 'ab-crunches', name: 'Скручивания', category: 'Пресс', targetSets: 3, minReps: 10, maxReps: 20, defaultRestSeconds: 60 },
      { id: 'te-a-11', exerciseId: 'rear-delt-fly', name: 'Задние дельты на обратной бабочке', category: 'Плечи', targetSets: 2, minReps: 10, maxReps: 15, defaultRestSeconds: 60 },
      { id: 'te-a-12', exerciseId: 'hammer-curl', name: 'Брахиалис (молотки)', category: 'Руки', targetSets: 2, minReps: 6, maxReps: 10, defaultRestSeconds: 75 },
      { id: 'te-a-13', exerciseId: 'overhead-triceps-ext', name: 'Разгибание в блоке из-за головы', category: 'Руки', targetSets: 2, minReps: 6, maxReps: 12, defaultRestSeconds: 75 }
    ]
  },
  {
    id: 'template-day-b',
    name: 'Full-Body: День Б',
    type: 'day-b',
    color: 'sky',
    description: 'Второй протокол Full-Body: редактируемая вариация подходов и повторений',
    exercises: [
      { id: 'te-b-1', exerciseId: 'lat-pulldown', name: 'Тяга верхнего блока', category: 'Спина', targetSets: 3, minReps: 6, maxReps: 10, defaultRestSeconds: 90 },
      { id: 'te-b-2', exerciseId: 'incline-db-press', name: 'Жим гантелей на наклонной скамье', category: 'Грудь', targetSets: 3, minReps: 6, maxReps: 10, defaultRestSeconds: 120 },
      { id: 'te-b-3', exerciseId: 'hammer-row', name: 'Тяга в тренажере Хаммер', category: 'Спина', targetSets: 3, minReps: 8, maxReps: 12, defaultRestSeconds: 90 },
      { id: 'te-b-4', exerciseId: 'pec-deck-fly', name: 'Бабочка (сведение рук)', category: 'Грудь', targetSets: 3, minReps: 8, maxReps: 12, defaultRestSeconds: 75 },
      { id: 'te-b-5', exerciseId: 'leg-curl', name: 'Сгибание ног', category: 'Ноги', targetSets: 3, minReps: 8, maxReps: 12, defaultRestSeconds: 90 },
      { id: 'te-b-6', exerciseId: 'leg-extension', name: 'Разгибание ног', category: 'Ноги', targetSets: 3, minReps: 8, maxReps: 12, defaultRestSeconds: 75 },
      { id: 'te-b-7', exerciseId: 'scott-curl', name: 'Бицепс на скамье Скотта', category: 'Руки', targetSets: 3, minReps: 6, maxReps: 12, defaultRestSeconds: 75 },
      { id: 'te-b-8', exerciseId: 'triceps-dips', name: 'Брусья на трицепс', category: 'Руки', targetSets: 3, minReps: 6, maxReps: 10, defaultRestSeconds: 90 },
      { id: 'te-b-9', exerciseId: 'upright-row', name: 'Протяжка на средние дельты', category: 'Плечи', targetSets: 4, minReps: 10, maxReps: 15, defaultRestSeconds: 60 },
      { id: 'te-b-10', exerciseId: 'ab-crunches', name: 'Скручивания', category: 'Пресс', targetSets: 3, minReps: 10, maxReps: 20, defaultRestSeconds: 60 },
      { id: 'te-b-11', exerciseId: 'rear-delt-fly', name: 'Задние дельты на обратной бабочке', category: 'Плечи', targetSets: 3, minReps: 10, maxReps: 15, defaultRestSeconds: 60 },
      { id: 'te-b-12', exerciseId: 'hammer-curl', name: 'Брахиалис (молотки)', category: 'Руки', targetSets: 2, minReps: 6, maxReps: 10, defaultRestSeconds: 75 },
      { id: 'te-b-13', exerciseId: 'overhead-triceps-ext', name: 'Разгибание в блоке из-за головы', category: 'Руки', targetSets: 2, minReps: 6, maxReps: 12, defaultRestSeconds: 75 }
    ]
  }
];

// Helper to generate dates relative to today
const getPastDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const getPastDateTime = (daysAgo: number, hour: number = 18): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};

export const SAMPLE_WORKOUT_HISTORY: WorkoutSession[] = [
  {
    id: 'session-demo-1',
    templateId: 'template-day-a',
    title: 'Full-Body: День А',
    date: getPastDate(7),
    startedAt: getPastDateTime(7, 18),
    endedAt: getPastDateTime(7, 19),
    durationSeconds: 3420, // 57 min
    totalTonnageKg: 8940,
    notes: 'Отличная тренировка Дня А, размялся как следует. Хаммер зашел легко.',
    isCompleted: true,
    exercises: [
      {
        id: 'we-demo-1-1',
        exerciseId: 'lat-pulldown',
        name: 'Тяга верхнего блока',
        category: 'Спина',
        minReps: 6,
        maxReps: 10,
        sets: [
          { id: 's1', setNumber: 1, weight: 60, reps: 9, completed: true },
          { id: 's2', setNumber: 2, weight: 60, reps: 8, completed: true },
          { id: 's3', setNumber: 3, weight: 60, reps: 7, completed: true }
        ]
      },
      {
        id: 'we-demo-1-2',
        exerciseId: 'incline-db-press',
        name: 'Жим гантелей на наклонной скамье',
        category: 'Грудь',
        minReps: 6,
        maxReps: 10,
        sets: [
          { id: 's4', setNumber: 1, weight: 26, reps: 9, completed: true },
          { id: 's5', setNumber: 2, weight: 26, reps: 8, completed: true }
        ]
      },
      {
        id: 'we-demo-1-3',
        exerciseId: 'hammer-row',
        name: 'Тяга в тренажере Хаммер',
        category: 'Спина',
        minReps: 6,
        maxReps: 12,
        sets: [
          { id: 's6', setNumber: 1, weight: 45, reps: 10, completed: true },
          { id: 's7', setNumber: 2, weight: 45, reps: 10, completed: true },
          { id: 's8', setNumber: 3, weight: 45, reps: 9, completed: true }
        ]
      },
      {
        id: 'we-demo-1-4',
        exerciseId: 'pec-deck-fly',
        name: 'Бабочка (сведение рук)',
        category: 'Грудь',
        minReps: 8,
        maxReps: 12,
        sets: [
          { id: 's9', setNumber: 1, weight: 50, reps: 10, completed: true },
          { id: 's10', setNumber: 2, weight: 50, reps: 9, completed: true }
        ]
      },
      {
        id: 'we-demo-1-5',
        exerciseId: 'leg-curl',
        name: 'Сгибание ног',
        category: 'Ноги',
        minReps: 8,
        maxReps: 12,
        sets: [
          { id: 's11', setNumber: 1, weight: 40, reps: 11, completed: true },
          { id: 's12', setNumber: 2, weight: 40, reps: 10, completed: true },
          { id: 's13', setNumber: 3, weight: 40, reps: 9, completed: true }
        ]
      },
      {
        id: 'we-demo-1-6',
        exerciseId: 'leg-extension',
        name: 'Разгибание ног',
        category: 'Ноги',
        minReps: 8,
        maxReps: 12,
        sets: [
          { id: 's14', setNumber: 1, weight: 55, reps: 10, completed: true },
          { id: 's15', setNumber: 2, weight: 55, reps: 9, completed: true },
          { id: 's16', setNumber: 3, weight: 55, reps: 9, completed: true }
        ]
      },
      {
        id: 'we-demo-1-7',
        exerciseId: 'scott-curl',
        name: 'Бицепс на скамье Скотта',
        category: 'Руки',
        minReps: 6,
        maxReps: 12,
        sets: [
          { id: 's17', setNumber: 1, weight: 27.5, reps: 10, completed: true },
          { id: 's18', setNumber: 2, weight: 27.5, reps: 8, completed: true }
        ]
      },
      {
        id: 'we-demo-1-8',
        exerciseId: 'triceps-dips',
        name: 'Брусья на трицепс',
        category: 'Руки',
        minReps: 6,
        maxReps: 10,
        sets: [
          { id: 's19', setNumber: 1, weight: 0, reps: 9, completed: true },
          { id: 's20', setNumber: 2, weight: 0, reps: 8, completed: true }
        ]
      },
      {
        id: 'we-demo-1-9',
        exerciseId: 'upright-row',
        name: 'Протяжка на средние дельты',
        category: 'Плечи',
        minReps: 10,
        maxReps: 15,
        sets: [
          { id: 's21', setNumber: 1, weight: 30, reps: 12, completed: true },
          { id: 's22', setNumber: 2, weight: 30, reps: 12, completed: true },
          { id: 's23', setNumber: 3, weight: 30, reps: 11, completed: true },
          { id: 's24', setNumber: 4, weight: 30, reps: 10, completed: true }
        ]
      },
      {
        id: 'we-demo-1-10',
        exerciseId: 'ab-crunches',
        name: 'Скручивания',
        category: 'Пресс',
        minReps: 10,
        maxReps: 20,
        sets: [
          { id: 's25', setNumber: 1, weight: 0, reps: 15, completed: true },
          { id: 's26', setNumber: 2, weight: 0, reps: 15, completed: true },
          { id: 's27', setNumber: 3, weight: 0, reps: 15, completed: true }
        ]
      },
      {
        id: 'we-demo-1-11',
        exerciseId: 'rear-delt-fly',
        name: 'Задние дельты на обратной бабочке',
        category: 'Плечи',
        minReps: 10,
        maxReps: 15,
        sets: [
          { id: 's28', setNumber: 1, weight: 35, reps: 13, completed: true },
          { id: 's29', setNumber: 2, weight: 35, reps: 12, completed: true }
        ]
      },
      {
        id: 'we-demo-1-12',
        exerciseId: 'hammer-curl',
        name: 'Брахиалис (молотки)',
        category: 'Руки',
        minReps: 6,
        maxReps: 10,
        sets: [
          { id: 's30', setNumber: 1, weight: 14, reps: 8, completed: true },
          { id: 's31', setNumber: 2, weight: 14, reps: 8, completed: true }
        ]
      },
      {
        id: 'we-demo-1-13',
        exerciseId: 'overhead-triceps-ext',
        name: 'Разгибание в блоке из-за головы',
        category: 'Руки',
        minReps: 6,
        maxReps: 12,
        sets: [
          { id: 's32', setNumber: 1, weight: 22.5, reps: 10, completed: true },
          { id: 's33', setNumber: 2, weight: 22.5, reps: 9, completed: true }
        ]
      }
    ]
  },
  {
    id: 'session-demo-2',
    templateId: 'template-day-b',
    title: 'Full-Body: День Б',
    date: getPastDate(3),
    startedAt: getPastDateTime(3, 19),
    endedAt: getPastDateTime(3, 20),
    durationSeconds: 3600, // 60 min
    totalTonnageKg: 9480,
    notes: 'Тренировка Дня Б: тяга верхнего блока и сгибания ног пошли с запасом — пора повышать!',
    isCompleted: true,
    exercises: [
      {
        id: 'we-demo-2-1',
        exerciseId: 'lat-pulldown',
        name: 'Тяга верхнего блока',
        category: 'Спина',
        minReps: 6,
        maxReps: 10,
        sets: [
          { id: 's201', setNumber: 1, weight: 60, reps: 10, completed: true }, // Reached max! (10 >= 10)
          { id: 's202', setNumber: 2, weight: 60, reps: 9, completed: true },  // 9 >= 6
          { id: 's203', setNumber: 3, weight: 60, reps: 8, completed: true }   // 8 >= 6 -> READY FOR PROGRESSION!
        ]
      },
      {
        id: 'we-demo-2-2',
        exerciseId: 'incline-db-press',
        name: 'Жим гантелей на наклонной скамье',
        category: 'Грудь',
        minReps: 6,
        maxReps: 10,
        sets: [
          { id: 's204', setNumber: 1, weight: 28, reps: 8, completed: true },
          { id: 's205', setNumber: 2, weight: 28, reps: 7, completed: true }
        ]
      },
      {
        id: 'we-demo-2-3',
        exerciseId: 'hammer-row',
        name: 'Тяга в тренажере Хаммер',
        category: 'Спина',
        minReps: 6,
        maxReps: 12,
        sets: [
          { id: 's206', setNumber: 1, weight: 45, reps: 12, completed: true }, // Reached max! (12 >= 12)
          { id: 's207', setNumber: 2, weight: 45, reps: 11, completed: true }, // 11 >= 6
          { id: 's208', setNumber: 3, weight: 45, reps: 10, completed: true }  // 10 >= 6 -> READY FOR PROGRESSION!
        ]
      },
      {
        id: 'we-demo-2-4',
        exerciseId: 'pec-deck-fly',
        name: 'Бабочка (сведение рук)',
        category: 'Грудь',
        minReps: 8,
        maxReps: 12,
        sets: [
          { id: 's209', setNumber: 1, weight: 52.5, reps: 11, completed: true },
          { id: 's210', setNumber: 2, weight: 52.5, reps: 9, completed: true }
        ]
      },
      {
        id: 'we-demo-2-5',
        exerciseId: 'leg-curl',
        name: 'Сгибание ног',
        category: 'Ноги',
        minReps: 8,
        maxReps: 12,
        sets: [
          { id: 's211', setNumber: 1, weight: 42.5, reps: 12, completed: true }, // Reached max! (12 >= 12)
          { id: 's212', setNumber: 2, weight: 42.5, reps: 10, completed: true }, // 10 >= 8
          { id: 's213', setNumber: 3, weight: 42.5, reps: 9, completed: true }   // 9 >= 8 -> READY FOR PROGRESSION!
        ]
      },
      {
        id: 'we-demo-2-6',
        exerciseId: 'leg-extension',
        name: 'Разгибание ног',
        category: 'Ноги',
        minReps: 8,
        maxReps: 12,
        sets: [
          { id: 's214', setNumber: 1, weight: 55, reps: 11, completed: true },
          { id: 's215', setNumber: 2, weight: 55, reps: 10, completed: true },
          { id: 's216', setNumber: 3, weight: 55, reps: 10, completed: true }
        ]
      },
      {
        id: 'we-demo-2-7',
        exerciseId: 'scott-curl',
        name: 'Бицепс на скамье Скотта',
        category: 'Руки',
        minReps: 6,
        maxReps: 12,
        sets: [
          { id: 's217', setNumber: 1, weight: 30, reps: 9, completed: true },
          { id: 's218', setNumber: 2, weight: 30, reps: 8, completed: true }
        ]
      },
      {
        id: 'we-demo-2-8',
        exerciseId: 'triceps-dips',
        name: 'Брусья на трицепс',
        category: 'Руки',
        minReps: 6,
        maxReps: 10,
        sets: [
          { id: 's219', setNumber: 1, weight: 0, reps: 10, completed: true },
          { id: 's220', setNumber: 2, weight: 0, reps: 9, completed: true }
        ]
      },
      {
        id: 'we-demo-2-9',
        exerciseId: 'upright-row',
        name: 'Протяжка на средние дельты',
        category: 'Плечи',
        minReps: 10,
        maxReps: 15,
        sets: [
          { id: 's221', setNumber: 1, weight: 32.5, reps: 13, completed: true },
          { id: 's222', setNumber: 2, weight: 32.5, reps: 12, completed: true },
          { id: 's223', setNumber: 3, weight: 32.5, reps: 11, completed: true },
          { id: 's224', setNumber: 4, weight: 32.5, reps: 10, completed: true }
        ]
      },
      {
        id: 'we-demo-2-10',
        exerciseId: 'ab-crunches',
        name: 'Скручивания',
        category: 'Пресс',
        minReps: 10,
        maxReps: 20,
        sets: [
          { id: 's225', setNumber: 1, weight: 0, reps: 18, completed: true },
          { id: 's226', setNumber: 2, weight: 0, reps: 16, completed: true },
          { id: 's227', setNumber: 3, weight: 0, reps: 15, completed: true }
        ]
      },
      {
        id: 'we-demo-2-11',
        exerciseId: 'rear-delt-fly',
        name: 'Задние дельты на обратной бабочке',
        category: 'Плечи',
        minReps: 10,
        maxReps: 15,
        sets: [
          { id: 's228', setNumber: 1, weight: 37.5, reps: 12, completed: true },
          { id: 's229', setNumber: 2, weight: 37.5, reps: 11, completed: true }
        ]
      },
      {
        id: 'we-demo-2-12',
        exerciseId: 'hammer-curl',
        name: 'Брахиалис (молотки)',
        category: 'Руки',
        minReps: 6,
        maxReps: 10,
        sets: [
          { id: 's230', setNumber: 1, weight: 16, reps: 8, completed: true },
          { id: 's231', setNumber: 2, weight: 16, reps: 7, completed: true }
        ]
      },
      {
        id: 'we-demo-2-13',
        exerciseId: 'overhead-triceps-ext',
        name: 'Разгибание в блоке из-за головы',
        category: 'Руки',
        minReps: 6,
        maxReps: 12,
        sets: [
          { id: 's232', setNumber: 1, weight: 25, reps: 10, completed: true },
          { id: 's233', setNumber: 2, weight: 25, reps: 9, completed: true }
        ]
      }
    ]
  }
];

export const INITIAL_APP_DATA: AppData = {
  version: 2,
  profile: {
    name: 'Атлет',
    currentWeight: 79.4,
    targetWeight: 82.0,
    height: 182,
    weightHistory: [
      { id: 'w-1', date: getPastDate(21), weight: 78.0, note: 'Начало цикла' },
      { id: 'w-2', date: getPastDate(14), weight: 78.6, note: 'Норма по белку' },
      { id: 'w-3', date: getPastDate(7), weight: 79.1, note: 'Увеличил калории' },
      { id: 'w-4', date: getPastDate(1), weight: 79.4, note: 'Отличный рельеф' }
    ],
    measurementsHistory: [
      { id: 'm-1', date: getPastDate(21), chest: 103, waist: 82, hips: 98, biceps: 37.5, neck: 39 },
      { id: 'm-2', date: getPastDate(1), chest: 105, waist: 81.5, hips: 99, biceps: 38.5, neck: 39.5 }
    ]
  },
  exercises: DEFAULT_EXERCISES,
  templates: DEFAULT_TEMPLATES,
  activeWorkout: null,
  workoutHistory: SAMPLE_WORKOUT_HISTORY,
  settings: {
    soundEnabled: true,
    vibrationEnabled: true,
    autoStartRestTimer: true,
    defaultRestSeconds: 90,
    autoFillPreviousResults: true
  }
};
