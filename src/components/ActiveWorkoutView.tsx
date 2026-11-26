import {
  ArrowUpRight,
  Check,
  Clock,
  Dumbbell,
  Flame,
  History,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type {
  ActiveWorkoutDraft,
  WeightStep,
  WorkoutExercise,
  WorkoutSession,
  WorkoutTemplate,
} from '../types/workout.ts';
import {
  calculateExerciseTonnage,
  calculateSessionTonnage,
  evaluateDoubleProgression,
  findPreviousExercisePerformance,
  formatNumber,
  formatShortDate,
  generateId,
  getTodayISODate,
} from '../utils/calculations.ts';
import { ExercisePickerModal, type PickedExerciseConfig } from './ExercisePickerModal.tsx';
import { StepperInput } from './StepperInput.tsx';

interface ActiveWorkoutViewProps {
  draft: ActiveWorkoutDraft | null;
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  defaultWeightStep: WeightStep;
  onChangeWeightStep: (step: WeightStep) => void;
  onStartFromTemplate: (template: WorkoutTemplate) => void;
  onStartEmpty: () => void;
  onUpdateDraft: (draft: ActiveWorkoutDraft) => void;
  onFinishWorkout: () => void;
  onDiscardWorkout: () => void;
  onLoadDemoData: () => void;
  onGoToTemplates: () => void;
}

export function ActiveWorkoutView({
  draft,
  templates,
  sessions,
  defaultWeightStep,
  onChangeWeightStep,
  onStartFromTemplate,
  onStartEmpty,
  onUpdateDraft,
  onFinishWorkout,
  onDiscardWorkout,
  onLoadDemoData,
  onGoToTemplates,
}: ActiveWorkoutViewProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!draft) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [draft]);

  const elapsedSeconds = draft
    ? Math.max(0, Math.floor((nowMs - new Date(draft.startedAt).getTime()) / 1000))
    : 0;

  useEffect(() => {
    if (restRemaining === null || restRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setRestRemaining((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restRemaining]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Map previous exercise performances by exercise id in the active draft
  const previousMap = useMemo(() => {
    const result = new Map<
      string,
      { date: string; sets: Array<{ weight: number; reps: number }> }
    >();
    if (!draft) return result;

    for (const ex of draft.exercises) {
      const prev = findPreviousExercisePerformance(sessions, ex.name);
      if (prev) {
        result.set(ex.id, prev);
      }
    }
    return result;
  }, [draft, sessions]);

  const lastPerformedByTemplate = useMemo(() => {
    const map = new Map<string, string>();
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
    for (const s of sorted) {
      if (s.templateId && !map.has(s.templateId)) {
        map.set(s.templateId, s.date);
      }
    }
    return map;
  }, [sessions]);

  if (!draft) {
    return (
      <div className="space-y-6">
        {/* Hero launch card */}
        <section className="rounded-2xl bg-gradient-to-br from-[#161c2a] via-[#131824] to-[#0f141e] border border-slate-800/90 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium">
                <Flame className="w-3.5 h-3.5" />
                Готов к залу
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Начать тренировку
              </h2>
              <p className="text-sm text-slate-400">
                Выберите программу ниже или запустите свободную тренировку с нуля.
              </p>
            </div>

            <button
              type="button"
              onClick={onStartEmpty}
              className="h-12 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Пустая тренировка
            </button>
          </div>
        </section>

        {/* Demo data callout if user has no history yet */}
        {sessions.length === 0 && (
          <section className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-200">
                  История тренировок пока пуста
                </h3>
                <p className="text-xs text-emerald-200/75 mt-0.5 leading-relaxed">
                  Загрузите демо-историю за 4 недели (12 тренировок Full-Body A/B/C), чтобы сразу
                  увидеть подсказки «Прошлый раз», индикаторы прогрессии и графики.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLoadDemoData}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold whitespace-nowrap transition shrink-0"
            >
              Загрузить демо-данные
            </button>
          </section>
        )}

        {/* Templates list */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Ваши шаблоны программ
            </h3>
            <button
              type="button"
              onClick={onGoToTemplates}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition"
            >
              Управлять шаблонами →
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="rounded-2xl bg-[#141822] border border-dashed border-slate-800 p-8 text-center space-y-3">
              <p className="text-sm text-slate-400">У вас пока нет шаблонов тренировок.</p>
              <button
                type="button"
                onClick={onGoToTemplates}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition"
              >
                <Plus className="w-4 h-4" />
                Создать шаблон
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {templates.map((tpl) => {
                const lastDate = lastPerformedByTemplate.get(tpl.id);
                return (
                  <div
                    key={tpl.id}
                    className="rounded-2xl bg-[#141822] border border-slate-800/90 hover:border-slate-700 p-4 flex flex-col justify-between gap-4 transition"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-white">{tpl.name}</h4>
                          {tpl.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {tpl.description}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium shrink-0">
                          {tpl.exercises.length} упр.
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        {tpl.exercises.slice(0, 4).map((ex) => (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between text-xs text-slate-300/90"
                          >
                            <span className="truncate pr-2">{ex.name}</span>
                            <span className="text-slate-500 tabular-nums shrink-0">
                              {ex.targetSets}×{ex.targetRepMin}-{ex.targetRepMax}
                            </span>
                          </div>
                        ))}
                        {tpl.exercises.length > 4 && (
                          <p className="text-[11px] text-slate-500">
                            + ещё {tpl.exercises.length - 4} упр.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <History className="w-3.5 h-3.5" />
                        {lastDate ? `Посл.: ${formatShortDate(lastDate)}` : 'Ещё не выполнялась'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onStartFromTemplate(tpl)}
                        className="h-10 px-4 rounded-xl bg-blue-600/90 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Старт
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  // Active workout mode
  const totalTonnage = calculateSessionTonnage(draft);
  const completedSetsTotal = draft.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed && s.reps > 0).length,
    0
  );
  const totalSetsCount = draft.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const updateExercise = (exId: string, updater: (ex: WorkoutExercise) => WorkoutExercise) => {
    onUpdateDraft({
      ...draft,
      exercises: draft.exercises.map((ex) => (ex.id === exId ? updater(ex) : ex)),
    });
  };

  const handleAddExercise = (config: PickedExerciseConfig) => {
    const prev = findPreviousExercisePerformance(sessions, config.name);
    const sets = Array.from({ length: config.targetSets }, (_, idx) => {
      const prevSet = prev?.sets[idx] ?? prev?.sets[prev.sets.length - 1];
      return {
        id: generateId(),
        weight: prevSet ? prevSet.weight : 20,
        reps: prevSet ? prevSet.reps : config.targetRepMin,
        completed: false,
      };
    });

    const newExercise: WorkoutExercise = {
      id: generateId(),
      name: config.name,
      muscleGroup: config.muscleGroup,
      targetSets: config.targetSets,
      targetRepMin: config.targetRepMin,
      targetRepMax: config.targetRepMax,
      sets,
    };

    onUpdateDraft({
      ...draft,
      exercises: [...draft.exercises, newExercise],
    });
  };

  const handleRemoveExercise = (exId: string) => {
    onUpdateDraft({
      ...draft,
      exercises: draft.exercises.filter((ex) => ex.id !== exId),
    });
  };

  const handleAddSet = (exId: string) => {
    updateExercise(exId, (ex) => {
      const lastSet = ex.sets[ex.sets.length - 1];
      return {
        ...ex,
        sets: [
          ...ex.sets,
          {
            id: generateId(),
            weight: lastSet ? lastSet.weight : 20,
            reps: lastSet ? lastSet.reps : ex.targetRepMin ?? 10,
            completed: false,
          },
        ],
      };
    });
  };

  const handleRemoveSet = (exId: string, setId: string) => {
    updateExercise(exId, (ex) => ({
      ...ex,
      sets: ex.sets.filter((s) => s.id !== setId),
    }));
  };

  const handleUpdateSet = (
    exId: string,
    setId: string,
    patch: Partial<{ weight: number; reps: number; completed: boolean }>
  ) => {
    updateExercise(exId, (ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    }));
  };

  const handleToggleSetCompleted = (exId: string, setId: string, currentCompleted: boolean) => {
    handleUpdateSet(exId, setId, { completed: !currentCompleted });
    if (!currentCompleted) {
      setRestRemaining(90);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Sticky Active Workout Header */}
      <div className="sticky top-[57px] md:top-[65px] z-20 rounded-2xl bg-[#141924]/95 backdrop-blur-md border border-slate-800 shadow-xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <input
              type="text"
              value={draft.name}
              onChange={(e) => onUpdateDraft({ ...draft, name: e.target.value })}
              aria-label="Название тренировки"
              className="bg-transparent text-base sm:text-lg font-bold text-white outline-none border-b border-transparent focus:border-blue-500 truncate min-w-[120px] flex-1"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!confirmDiscard ? (
              <button
                type="button"
                onClick={() => setConfirmDiscard(true)}
                className="h-9 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-medium transition"
              >
                Отмена
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 rounded-xl px-2 py-1">
                <span className="text-[11px] text-rose-200 px-1">Сбросить?</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDiscard(false);
                    setRestRemaining(null);
                    onDiscardWorkout();
                  }}
                  className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-semibold"
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDiscard(false)}
                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px]"
                >
                  Нет
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setConfirmDiscard(false);
                setRestRemaining(null);
                onFinishWorkout();
              }}
              disabled={completedSetsTotal === 0}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
            >
              <Check className="w-4 h-4" />
              Завершить
            </button>
          </div>
        </div>

        {/* Metrics & Quick Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 text-slate-300">
            <span className="inline-flex items-center gap-1 bg-[#0b0e14] border border-slate-800 px-2.5 py-1 rounded-lg tabular-nums">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              {formatTimer(elapsedSeconds)}
            </span>
            <span className="inline-flex items-center gap-1 bg-[#0b0e14] border border-slate-800 px-2.5 py-1 rounded-lg tabular-nums">
              Подходы:{' '}
              <strong className="text-white">
                {completedSetsTotal}/{totalSetsCount}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1 bg-[#0b0e14] border border-slate-800 px-2.5 py-1 rounded-lg tabular-nums">
              Тоннаж: <strong className="text-blue-300">{formatNumber(totalTonnage)} кг</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Weight step toggle */}
            <div className="inline-flex items-center rounded-lg bg-[#0b0e14] border border-slate-800 p-0.5">
              <span className="text-[11px] text-slate-500 px-1.5 hidden sm:inline">Шаг:</span>
              {([1.25, 2.5] as const).map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => onChangeWeightStep(step)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                    defaultWeightStep === step
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ±{step} кг
                </button>
              ))}
            </div>

            {/* Rest Timer Pill */}
            {restRemaining !== null && restRemaining > 0 ? (
              <button
                type="button"
                onClick={() => setRestRemaining(null)}
                title="Нажмите, чтобы остановить таймер отдыха"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 font-semibold tabular-nums"
              >
                <Timer className="w-3.5 h-3.5 animate-pulse" />
                Отдых {formatTimer(restRemaining)}
                <X className="w-3 h-3 opacity-70" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRestRemaining(90)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-slate-800 text-slate-300 hover:text-white transition"
              >
                <Timer className="w-3.5 h-3.5 text-slate-400" />
                {restRemaining === 0 ? 'Отдых окончен!' : 'Таймер 90с'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Date row */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>Дата тренировки:</span>
        <input
          type="date"
          value={draft.date || getTodayISODate()}
          onChange={(e) => onUpdateDraft({ ...draft, date: e.target.value })}
          className="bg-[#141822] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
        />
      </div>

      {/* Exercises List */}
      {draft.exercises.length === 0 ? (
        <div className="rounded-2xl bg-[#141822] border border-dashed border-slate-800 p-8 text-center space-y-3">
          <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">
            Добавьте первое упражнение, чтобы начать запись подходов.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {draft.exercises.map((exercise) => {
            const prev = previousMap.get(exercise.id);
            const progression = evaluateDoubleProgression(exercise);
            const exTonnage = calculateExerciseTonnage(exercise);

            return (
              <article
                key={exercise.id}
                className={`rounded-2xl bg-[#141822] border transition-colors p-4 space-y-3.5 ${
                  progression.shouldIncreaseWeight
                    ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800/90'
                }`}
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {exercise.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium">
                        {exercise.muscleGroup}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      {exercise.targetRepMin && exercise.targetRepMax ? (
                        <span>
                          Цель:{' '}
                          <strong className="text-slate-200">
                            {exercise.targetSets ?? exercise.sets.length} × {exercise.targetRepMin}–
                            {exercise.targetRepMax}
                          </strong>
                        </span>
                      ) : (
                        <span>Свободный диапазон</span>
                      )}
                      {exTonnage > 0 && (
                        <span>
                          Тоннаж:{' '}
                          <strong className="text-blue-300">{formatNumber(exTonnage)} кг</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exercise.id)}
                    aria-label={`Удалить упражнение ${exercise.name}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Double Progression Callout */}
                {progression.shouldIncreaseWeight && (
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-300">Пора повысить вес!</p>
                        <p className="text-xs text-emerald-200/80">
                          Все {progression.completedSetsCount} подх. выполнены на{' '}
                          {progression.targetRepMax}+ повт. Попробуйте{' '}
                          <strong className="text-white">
                            {progression.topWeightUsed + defaultWeightStep} кг
                          </strong>{' '}
                          в следующий раз.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sets List */}
                <div className="space-y-2.5">
                  {exercise.sets.map((set, idx) => {
                    const prevSet = prev
                      ? prev.sets[idx] ?? prev.sets[prev.sets.length - 1]
                      : null;

                    return (
                      <div
                        key={set.id}
                        className={`rounded-xl p-2.5 sm:p-3 border transition-colors space-y-2 ${
                          set.completed
                            ? 'bg-emerald-500/[0.08] border-emerald-500/35'
                            : 'bg-[#0e121b] border-slate-800/80'
                        }`}
                      >
                        {/* Set header + Previous performance hint */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 ${
                                set.completed
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {idx + 1}
                            </span>

                            {prevSet ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSet(exercise.id, set.id, {
                                    weight: prevSet.weight,
                                    reps: prevSet.reps,
                                  })
                                }
                                title="Нажмите, чтобы подставить прошлый результат"
                                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-300 transition truncate"
                              >
                                <RotateCcw className="w-3 h-3 text-blue-400 shrink-0" />
                                <span className="truncate">
                                  Прошлый раз:{' '}
                                  <strong className="text-slate-200">
                                    {prevSet.weight} кг × {prevSet.reps}
                                  </strong>
                                </span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Прошлый раз: нет данных
                              </span>
                            )}
                          </div>

                          {exercise.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(exercise.id, set.id)}
                              aria-label={`Удалить подход ${idx + 1}`}
                              className="text-slate-600 hover:text-rose-400 p-1 transition shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Thumb-friendly Steppers + Complete button */}
                        <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                          <StepperInput
                            value={set.weight}
                            step={defaultWeightStep}
                            min={0}
                            max={600}
                            allowDecimal
                            unit="кг"
                            accent={set.completed ? 'emerald' : 'blue'}
                            ariaLabel={`Подход ${idx + 1} вес`}
                            onChange={(weight) =>
                              handleUpdateSet(exercise.id, set.id, { weight })
                            }
                          />

                          <StepperInput
                            value={set.reps}
                            step={1}
                            min={0}
                            max={200}
                            unit="повт."
                            accent={set.completed ? 'emerald' : 'blue'}
                            ariaLabel={`Подход ${idx + 1} повторения`}
                            onChange={(reps) =>
                              handleUpdateSet(exercise.id, set.id, { reps })
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleSetCompleted(exercise.id, set.id, set.completed)
                            }
                            aria-label={
                              set.completed ? 'Снять отметку подхода' : 'Отметить подход выполненным'
                            }
                            className={`w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition active:scale-95 touch-manipulation ${
                              set.completed
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                          >
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add set button */}
                <button
                  type="button"
                  onClick={() => handleAddSet(exercise.id)}
                  className="w-full h-10 rounded-xl bg-[#0e121b] hover:bg-slate-800/80 border border-dashed border-slate-700/80 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-blue-400" />
                  Добавить подход
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Add Exercise CTA */}
      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        className="w-full h-12 rounded-2xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/35 text-blue-300 font-semibold text-sm flex items-center justify-center gap-2 transition"
      >
        <Plus className="w-4 h-4" />
        Добавить упражнение
      </button>

      <ExercisePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleAddExercise}
        sessions={sessions}
      />
    </div>
  );
}
