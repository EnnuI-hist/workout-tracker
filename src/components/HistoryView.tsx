import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit3,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { WeightStep, WorkoutExercise, WorkoutSession } from '../types/workout.ts';
import {
  calculateEpley1RM,
  calculateExerciseTonnage,
  calculateSessionTonnage,
  evaluateDoubleProgression,
  formatFullDate,
  formatNumber,
  generateId,
} from '../utils/calculations.ts';
import { ExercisePickerModal, type PickedExerciseConfig } from './ExercisePickerModal.tsx';
import { StepperInput } from './StepperInput.tsx';

interface HistoryViewProps {
  sessions: WorkoutSession[];
  defaultWeightStep: WeightStep;
  onUpdateSession: (session: WorkoutSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onLoadDemoData: () => void;
}

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function HistoryView({
  sessions,
  defaultWeightStep,
  onUpdateSession,
  onDeleteSession,
  onLoadDemoData,
}: HistoryViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      return b.finishedAt.localeCompare(a.finishedAt);
    });
  }, [sessions]);

  const workoutDatesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      map.set(s.date, (map.get(s.date) ?? 0) + 1);
    }
    return map;
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!selectedDateFilter) return sortedSessions;
    return sortedSessions.filter((s) => s.date === selectedDateFilter);
  }, [sortedSessions, selectedDateFilter]);

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Convert JS getDay() (0=Sun..6=Sat) to Monday-first (0=Mon..6=Sun)
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells: Array<{ iso: string; day: number } | null> = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      cells.push({ iso: `${year}-${mStr}-${dStr}`, day });
    }
    return cells;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  const handleOpenEdit = (session: WorkoutSession) => {
    setEditingSession({
      ...session,
      exercises: session.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => ({ ...s })),
      })),
    });
  };

  const handleAddExerciseToEdit = (config: PickedExerciseConfig) => {
    if (!editingSession) return;
    const newEx: WorkoutExercise = {
      id: generateId(),
      name: config.name,
      muscleGroup: config.muscleGroup,
      targetSets: config.targetSets,
      targetRepMin: config.targetRepMin,
      targetRepMax: config.targetRepMax,
      sets: Array.from({ length: config.targetSets }, () => ({
        id: generateId(),
        weight: 20,
        reps: config.targetRepMin,
        completed: true,
      })),
    };
    setEditingSession({
      ...editingSession,
      exercises: [...editingSession.exercises, newEx],
    });
  };

  const handleSaveEdit = () => {
    if (!editingSession) return;
    onUpdateSession({
      ...editingSession,
      name: editingSession.name.trim() || 'Тренировка',
    });
    setEditingSession(null);
  };

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl bg-[#141822] border border-slate-800 p-8 sm:p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h2 className="text-lg font-bold text-white">История тренировок пуста</h2>
          <p className="text-sm text-slate-400">
            Завершённые тренировки будут отображаться здесь в виде календаря и хронологического
            журнала с возможностью редактирования.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadDemoData}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
        >
          <Sparkles className="w-4 h-4" />
          Загрузить демо-данные (4 недели)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">История тренировок</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Нажмите на дату в календаре для фильтрации или раскройте тренировку для просмотра и
          редактирования.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-5 items-start">
        {/* Calendar Card */}
        <section className="rounded-2xl bg-[#141822] border border-slate-800/90 p-4 space-y-3 lg:sticky lg:top-[80px]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                )
              }
              aria-label="Предыдущий месяц"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-white capitalize">{monthLabel}</h3>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                )
              }
              aria-label="Следующий месяц"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
            {WEEKDAYS_RU.map((wd) => (
              <div key={wd} className="py-1">
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-9" />;
              }
              const count = workoutDatesMap.get(cell.iso) ?? 0;
              const isSelected = selectedDateFilter === cell.iso;
              const hasWorkout = count > 0;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() =>
                    setSelectedDateFilter((prev) => (prev === cell.iso ? null : cell.iso))
                  }
                  className={`h-9 rounded-lg text-xs font-medium flex flex-col items-center justify-center relative transition ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                      : hasWorkout
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'text-slate-400 hover:bg-slate-800/70'
                  }`}
                >
                  <span>{cell.day}</span>
                  {hasWorkout && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateFilter && (
            <button
              type="button"
              onClick={() => setSelectedDateFilter(null)}
              className="w-full h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
            >
              Показать все даты ({sessions.length})
            </button>
          )}
        </section>

        {/* Chronological List */}
        <section className="space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="rounded-2xl bg-[#141822] border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
              За выбранную дату ({selectedDateFilter}) тренировок нет.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isExpanded = expandedId === session.id;
              const tonnage = Math.round(calculateSessionTonnage(session));
              const completedSets = session.exercises.reduce(
                (sum, ex) => sum + ex.sets.filter((s) => s.completed && s.reps > 0).length,
                0
              );

              return (
                <article
                  key={session.id}
                  className="rounded-2xl bg-[#141822] border border-slate-800/90 overflow-hidden transition"
                >
                  {/* Summary Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : session.id);
                      }
                    }}
                    className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-800/25 transition"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white truncate">
                          {session.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 text-xs font-semibold tabular-nums">
                          {formatNumber(tonnage)} кг
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="capitalize">{formatFullDate(session.date)}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {session.durationMinutes} мин
                        </span>
                        <span>
                          {session.exercises.length} упр. · {completedSets} подх.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(session);
                        }}
                        title="Редактировать"
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {confirmDeleteId === session.id ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 rounded-lg px-2 py-1"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteSession(session.id);
                              setConfirmDeleteId(null);
                            }}
                            className="text-xs font-semibold text-rose-300 px-1"
                          >
                            Удалить
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-slate-400 px-1"
                          >
                            Нет
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(session.id);
                          }}
                          title="Удалить"
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <span className="w-8 h-8 flex items-center justify-center text-slate-500">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/80 bg-[#0e121b] p-4 sm:p-5 space-y-3.5">
                      {session.exercises.map((ex) => {
                        const exTonnage = Math.round(calculateExerciseTonnage(ex));
                        const prog = evaluateDoubleProgression(ex);

                        return (
                          <div
                            key={ex.id}
                            className="rounded-xl bg-[#141822] border border-slate-800/80 p-3.5 space-y-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">{ex.name}</h4>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {ex.muscleGroup}
                                </span>
                                {prog.shouldIncreaseWeight && (
                                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                                    Пора повысить вес!
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 tabular-nums">
                                Тоннаж: <strong className="text-blue-300">{formatNumber(exTonnage)} кг</strong>
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                              {ex.sets.map((s, idx) => (
                                <div
                                  key={s.id}
                                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border ${
                                    s.completed
                                      ? 'bg-[#0b0e14] border-slate-800 text-slate-200'
                                      : 'bg-[#0b0e14]/50 border-slate-800/40 text-slate-500 line-through'
                                  }`}
                                >
                                  <span>
                                    <span className="text-slate-500 mr-1.5">#{idx + 1}</span>
                                    <strong className="tabular-nums">
                                      {s.weight} кг × {s.reps}
                                    </strong>
                                  </span>
                                  {s.completed && s.weight > 0 && s.reps > 0 && (
                                    <span className="text-[11px] text-slate-500 tabular-nums">
                                      1ПМ ~{calculateEpley1RM(s.weight, s.reps)} кг
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>

      {/* Edit Historical Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl bg-[#141822] border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Редактировать тренировку
              </h3>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="sm:col-span-1 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Название</span>
                  <input
                    type="text"
                    value={editingSession.name}
                    onChange={(e) =>
                      setEditingSession({ ...editingSession, name: e.target.value })
                    }
                    className="h-10 px-3 rounded-xl bg-[#0b0e14] border border-slate-700/80 text-sm text-white outline-none focus:border-blue-500"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Дата</span>
                  <input
                    type="date"
                    value={editingSession.date}
                    onChange={(e) =>
                      setEditingSession({ ...editingSession, date: e.target.value })
                    }
                    className="h-10 px-3 rounded-xl bg-[#0b0e14] border border-slate-700/80 text-sm text-white outline-none focus:border-blue-500"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Длительность (мин)</span>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={editingSession.durationMinutes}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        durationMinutes: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="h-10 px-3 rounded-xl bg-[#0b0e14] border border-slate-700/80 text-sm text-white outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="space-y-3">
                {editingSession.exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="rounded-xl bg-[#0e121b] border border-slate-800 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white">{ex.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingSession({
                            ...editingSession,
                            exercises: editingSession.exercises.filter((item) => item.id !== ex.id),
                          })
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {ex.sets.map((s, idx) => (
                        <div
                          key={s.id}
                          className="grid grid-cols-[24px_1fr_1fr_auto_auto] items-center gap-2"
                        >
                          <span className="text-xs text-slate-500 font-semibold text-center">
                            #{idx + 1}
                          </span>
                          <StepperInput
                            value={s.weight}
                            step={defaultWeightStep}
                            min={0}
                            max={600}
                            allowDecimal
                            unit="кг"
                            ariaLabel={`Редактировать вес подхода ${idx + 1}`}
                            onChange={(weight) =>
                              setEditingSession({
                                ...editingSession,
                                exercises: editingSession.exercises.map((item) =>
                                  item.id === ex.id
                                    ? {
                                        ...item,
                                        sets: item.sets.map((st) =>
                                          st.id === s.id ? { ...st, weight } : st
                                        ),
                                      }
                                    : item
                                ),
                              })
                            }
                          />
                          <StepperInput
                            value={s.reps}
                            step={1}
                            min={0}
                            max={200}
                            unit="повт."
                            ariaLabel={`Редактировать повторения подхода ${idx + 1}`}
                            onChange={(reps) =>
                              setEditingSession({
                                ...editingSession,
                                exercises: editingSession.exercises.map((item) =>
                                  item.id === ex.id
                                    ? {
                                        ...item,
                                        sets: item.sets.map((st) =>
                                          st.id === s.id ? { ...st, reps } : st
                                        ),
                                      }
                                    : item
                                ),
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditingSession({
                                ...editingSession,
                                exercises: editingSession.exercises.map((item) =>
                                  item.id === ex.id
                                    ? {
                                        ...item,
                                        sets: item.sets.map((st) =>
                                          st.id === s.id
                                            ? { ...st, completed: !st.completed }
                                            : st
                                        ),
                                      }
                                    : item
                                ),
                              })
                            }
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                              s.completed
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          {ex.sets.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingSession({
                                  ...editingSession,
                                  exercises: editingSession.exercises.map((item) =>
                                    item.id === ex.id
                                      ? {
                                          ...item,
                                          sets: item.sets.filter((st) => st.id !== s.id),
                                        }
                                      : item
                                  ),
                                })
                              }
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="w-8" />
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const last = ex.sets[ex.sets.length - 1];
                        setEditingSession({
                          ...editingSession,
                          exercises: editingSession.exercises.map((item) =>
                            item.id === ex.id
                              ? {
                                  ...item,
                                  sets: [
                                    ...item.sets,
                                    {
                                      id: generateId(),
                                      weight: last ? last.weight : 20,
                                      reps: last ? last.reps : 10,
                                      completed: true,
                                    },
                                  ],
                                }
                              : item
                          ),
                        });
                      }}
                      className="w-full h-9 rounded-lg bg-[#141822] hover:bg-slate-800 border border-dashed border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Добавить подход
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="w-full h-10 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/35 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                Добавить упражнение
              </button>
            </div>

            <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      <ExercisePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleAddExerciseToEdit}
        sessions={sessions}
      />
    </div>
  );
}
