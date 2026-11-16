import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Clock, 
  Flame, 
  FileText, 
  Dumbbell,
  Sparkles,
  Info
} from 'lucide-react';
import { WorkoutSession, WorkoutExercise, WorkoutSet, ExerciseDefinition } from '../types';
import { formatDuration, formatTonnage, calculateWorkoutTonnage, getPreviousExerciseSets } from '../utils/calculations';

export const CalendarView: React.FC = () => {
  const { 
    data, 
    selectedCalendarDate, 
    setSelectedCalendarDate, 
    saveWorkoutForDate, 
    deleteWorkoutFromHistory 
  } = useApp();

  // Current view month & year state
  const [viewDate, setViewDate] = useState<Date>(() => {
    const parts = selectedCalendarDate.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    }
    return new Date();
  });

  // Modal for logging / editing workout on selected date
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Workouts mapped by date string (YYYY-MM-DD)
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    data.workoutHistory.forEach(w => {
      const d = w.date || (w.startedAt ? w.startedAt.split('T')[0] : '');
      if (d) {
        const existing = map.get(d) || [];
        existing.push(w);
        map.set(d, existing);
      }
    });
    return map;
  }, [data.workoutHistory]);

  // Calendar month days calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // In JS getDay(): 0 is Sunday, 1 is Monday... convert to Monday = 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      workouts: WorkoutSession[];
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dNum);
      const dStr = prevDate.toISOString().split('T')[0];
      days.push({
        dateString: dStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedCalendarDate,
        workouts: workoutsByDate.get(dStr) || []
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = (month + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const dStr = `${year}-${mStr}-${dayStr}`;
      days.push({
        dateString: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedCalendarDate,
        workouts: workoutsByDate.get(dStr) || []
      });
    }

    // Days from next month to fill grid (up to 42 cells)
    const remaining = 42 - days.length;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(year, month + 1, n);
      const dStr = nextDate.toISOString().split('T')[0];
      days.push({
        dateString: dStr,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedCalendarDate,
        workouts: workoutsByDate.get(dStr) || []
      });
    }

    return days;
  }, [year, month, selectedCalendarDate, workoutsByDate]);

  // Selected date workouts
  const selectedDateWorkouts = workoutsByDate.get(selectedCalendarDate) || [];

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(todayStr);
  };

  // Open editor for a new workout on selected date
  const handleStartNewWorkoutForDate = (templateId: string = 'template-day-a') => {
    const template = data.templates.find(t => t.id === templateId) || data.templates[0];

    const exercises: WorkoutExercise[] = template.exercises.map(tex => {
      const prevSets = getPreviousExerciseSets(tex.exerciseId, data.workoutHistory);
      const sets: WorkoutSet[] = Array.from({ length: tex.targetSets }, (_, i) => {
        const prevSet = prevSets && prevSets[i] ? prevSets[i] : (prevSets && prevSets[0] ? prevSets[0] : null);
        return {
          id: `set-${Date.now()}-${tex.exerciseId}-${i + 1}`,
          setNumber: i + 1,
          weight: prevSet ? prevSet.weight : 0,
          reps: prevSet ? prevSet.reps : tex.minReps,
          completed: true,
          previousWeight: prevSet ? prevSet.weight : undefined,
          previousReps: prevSet ? prevSet.reps : undefined
        };
      });

      return {
        id: `we-${Date.now()}-${tex.exerciseId}`,
        exerciseId: tex.exerciseId,
        name: tex.name,
        category: tex.category,
        minReps: tex.minReps,
        maxReps: tex.maxReps,
        sets
      };
    });

    const newSession: WorkoutSession = {
      id: `workout-${Date.now()}`,
      templateId: template.id,
      title: template.name,
      date: selectedCalendarDate,
      startedAt: `${selectedCalendarDate}T18:00:00.000Z`,
      endedAt: `${selectedCalendarDate}T19:00:00.000Z`,
      durationSeconds: 3600, // default 60 min
      exercises,
      totalTonnageKg: 0,
      notes: '',
      isCompleted: true
    };

    setEditingSession(newSession);
    setIsEditorOpen(true);
  };

  // Open editor to modify existing workout
  const handleEditExistingWorkout = (workout: WorkoutSession) => {
    // Deep clone so edits don't mutate state before saving
    setEditingSession(JSON.parse(JSON.stringify(workout)));
    setIsEditorOpen(true);
  };

  // Save workout from editor
  const handleSaveEditor = () => {
    if (!editingSession) return;
    saveWorkoutForDate(editingSession);
    setIsEditorOpen(false);
    setEditingSession(null);
  };

  // Switch template in editor
  const handleSwitchTemplateInEditor = (templateId: string) => {
    if (!editingSession) return;
    const template = data.templates.find(t => t.id === templateId);
    if (!template) return;

    const exercises: WorkoutExercise[] = template.exercises.map(tex => {
      const prevSets = getPreviousExerciseSets(tex.exerciseId, data.workoutHistory);
      const sets: WorkoutSet[] = Array.from({ length: tex.targetSets }, (_, i) => {
        const prevSet = prevSets && prevSets[i] ? prevSets[i] : null;
        return {
          id: `set-${Date.now()}-${tex.exerciseId}-${i + 1}`,
          setNumber: i + 1,
          weight: prevSet ? prevSet.weight : 0,
          reps: prevSet ? prevSet.reps : tex.minReps,
          completed: true,
          previousWeight: prevSet ? prevSet.weight : undefined,
          previousReps: prevSet ? prevSet.reps : undefined
        };
      });

      return {
        id: `we-${Date.now()}-${tex.exerciseId}`,
        exerciseId: tex.exerciseId,
        name: tex.name,
        category: tex.category,
        minReps: tex.minReps,
        maxReps: tex.maxReps,
        sets
      };
    });

    setEditingSession({
      ...editingSession,
      templateId: template.id,
      title: template.name,
      exercises
    });
  };

  // Add exercise to editing workout
  const handleAddExerciseToEditing = (exDef: ExerciseDefinition) => {
    if (!editingSession) return;
    const prevSets = getPreviousExerciseSets(exDef.id, data.workoutHistory);
    const sets: WorkoutSet[] = Array.from({ length: exDef.targetSets }, (_, i) => {
      const prevSet = prevSets && prevSets[i] ? prevSets[i] : null;
      return {
        id: `set-${Date.now()}-${exDef.id}-${i + 1}`,
        setNumber: i + 1,
        weight: prevSet ? prevSet.weight : 0,
        reps: prevSet ? prevSet.reps : exDef.minReps,
        completed: true
      };
    });

    const newEx: WorkoutExercise = {
      id: `we-${Date.now()}-${exDef.id}`,
      exerciseId: exDef.id,
      name: exDef.name,
      category: exDef.category,
      minReps: exDef.minReps,
      maxReps: exDef.maxReps,
      sets
    };

    setEditingSession({
      ...editingSession,
      exercises: [...editingSession.exercises, newEx]
    });
    setShowAddExerciseModal(false);
  };

  return (
    <div className="pb-28 pt-3 px-3 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Календарь тренировок
          </span>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <CalendarIcon size={20} className="text-emerald-400" /> Дневник по датам
          </h1>
        </div>
        <button
          onClick={handleGoToday}
          className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
        >
          Сегодня
        </button>
      </div>

      {/* Calendar Card */}
      <div className="rounded-3xl glass-panel p-4 border border-slate-800 shadow-xl space-y-3">
        {/* Month & Year Navigation */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-black text-white">
              {monthNames[month]} {year}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Предыдущий месяц"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Следующий месяц"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> День А
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> День Б
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Своя
          </span>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase py-1">
          {weekDays.map(wd => (
            <div key={wd}>{wd}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((cd, idx) => {
            const hasWorkout = cd.workouts.length > 0;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedCalendarDate(cd.dateString)}
                className={`min-h-[52px] rounded-xl flex flex-col items-center justify-between p-1 transition-all relative ${
                  cd.isSelected
                    ? 'bg-emerald-950/70 border-2 border-emerald-400 text-white shadow-md shadow-emerald-950/40'
                    : cd.isToday
                    ? 'bg-slate-800/80 border border-slate-600 text-white'
                    : cd.isCurrentMonth
                    ? 'bg-slate-900/60 hover:bg-slate-800/60 text-slate-200 border border-slate-800/50'
                    : 'bg-transparent text-slate-600 border border-transparent hover:text-slate-400'
                }`}
              >
                <span className={`text-xs font-bold ${cd.isSelected ? 'text-emerald-300' : ''}`}>
                  {cd.dayNumber}
                </span>

                {/* Workout Dots Indicator */}
                <div className="flex items-center justify-center gap-0.5 h-2">
                  {cd.workouts.map((w, wIdx) => {
                    const isDayA = w.templateId === 'template-day-a' || w.title.includes('День А') || w.title.includes('Day A');
                    const isDayB = w.templateId === 'template-day-b' || w.title.includes('День Б') || w.title.includes('Day B');
                    const dotColor = isDayA ? 'bg-emerald-400' : isDayB ? 'bg-sky-400' : 'bg-purple-400';
                    return (
                      <span
                        key={wIdx}
                        className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-sm`}
                      />
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DATE DETAILS & WORKOUT LIST */}
      <div className="rounded-3xl glass-panel p-4 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Выбранная дата
            </span>
            <h3 className="text-base font-bold text-white">
              {new Date(selectedCalendarDate).toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleStartNewWorkoutForDate('template-day-a')}
              className="px-2.5 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
            >
              <Plus size={13} /> День А
            </button>
            <button
              onClick={() => handleStartNewWorkoutForDate('template-day-b')}
              className="px-2.5 py-1.5 bg-sky-600/80 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
            >
              <Plus size={13} /> День Б
            </button>
          </div>
        </div>

        {/* Existing workouts for this day */}
        {selectedDateWorkouts.length > 0 ? (
          <div className="space-y-3">
            {selectedDateWorkouts.map((workout) => {
              const isDayA = workout.templateId === 'template-day-a' || workout.title.includes('День А');
              const isDayB = workout.templateId === 'template-day-b' || workout.title.includes('День Б');
              const tagColor = isDayA ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30' : isDayB ? 'text-sky-400 border-sky-500/40 bg-sky-950/30' : 'text-purple-400 border-purple-500/40 bg-purple-950/30';

              return (
                <div
                  key={workout.id}
                  className="rounded-2xl p-3.5 bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${tagColor}`}>
                          {workout.title}
                        </span>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Clock size={12} /> {formatDuration(workout.durationSeconds)}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Flame size={13} className="text-amber-400" />
                        {formatTonnage(workout.totalTonnageKg)} тоннаж
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditExistingWorkout(workout)}
                        className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors flex items-center gap-1"
                        title="Редактировать запись"
                      >
                        <Edit3 size={13} /> Изменить
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить эту тренировку?')) {
                            deleteWorkoutFromHistory(workout.id);
                          }
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 rounded-lg text-xs transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {workout.notes && (
                    <div className="text-xs text-slate-300 italic p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                      «{workout.notes}»
                    </div>
                  )}

                  {/* Exercises summary list */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                    {workout.exercises.map((ex, exIdx) => {
                      const completedSets = ex.sets.filter(s => s.completed);
                      return (
                        <div key={ex.id || exIdx} className="text-xs flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                          <span className="text-slate-200 font-medium">{ex.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {completedSets.map(s => `${s.weight}кг×${s.reps}`).join(', ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl p-4 space-y-2">
            <p>На эту дату тренировок не записано.</p>
            <p className="text-[11px] text-slate-400">
              Вы можете внести тренировку задним числом или запланировать на будущее!
            </p>
          </div>
        )}
      </div>

      {/* WORKOUT EDITOR MODAL (For retroactively logging or editing any date) */}
      {isEditorOpen && editingSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-dark-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 size={16} className="text-emerald-400" />
                  Запись тренировки: {editingSession.date}
                </h3>
                <p className="text-xs text-slate-400">Настройте шаблон, подходы и веса</p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Template Selector & Duration */}
            <div className="p-3 border-b border-slate-800/80 space-y-2.5 bg-slate-950/60">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSwitchTemplateInEditor('template-day-a')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    editingSession.templateId === 'template-day-a'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  День А
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTemplateInEditor('template-day-b')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    editingSession.templateId === 'template-day-b'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  День Б
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSession({ ...editingSession, templateId: 'custom', title: 'Своя тренировка' })}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    editingSession.templateId === 'custom'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Своя
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Длительность (мин):</label>
                  <input
                    type="number"
                    value={Math.round(editingSession.durationSeconds / 60)}
                    onChange={(e) => setEditingSession({
                      ...editingSession,
                      durationSeconds: (parseInt(e.target.value, 10) || 0) * 60
                    })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Заметка:</label>
                  <input
                    type="text"
                    placeholder="Самочувствие, отдых..."
                    value={editingSession.notes || ''}
                    onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Exercises & Sets Editor List */}
            <div className="p-3 overflow-y-auto flex-1 space-y-3">
              {editingSession.exercises.map((ex, exIdx) => (
                <div key={ex.id || exIdx} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 mr-1.5">
                        {ex.category}
                      </span>
                      <span className="text-xs font-bold text-white">{ex.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSession({
                          ...editingSession,
                          exercises: editingSession.exercises.filter((_, idx) => idx !== exIdx)
                        });
                      }}
                      className="text-slate-500 hover:text-rose-400 text-xs p-1"
                      title="Удалить упражнение"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Sets list */}
                  <div className="space-y-1.5">
                    {ex.sets.map((set, sIdx) => (
                      <div key={set.id || sIdx} className="grid grid-cols-12 gap-1.5 items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
                        <span className="col-span-1 text-center text-xs font-bold text-slate-400">
                          #{sIdx + 1}
                        </span>

                        {/* Weight input */}
                        <div className="col-span-5 flex items-center bg-slate-900 rounded-lg px-2 py-1">
                          <span className="text-[10px] text-slate-500 mr-1">кг</span>
                          <input
                            type="number"
                            step="0.5"
                            value={set.weight === 0 ? '' : set.weight}
                            placeholder="0"
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...ex.sets];
                              updated[sIdx] = { ...set, weight: val };
                              const exUpdated = [...editingSession.exercises];
                              exUpdated[exIdx] = { ...ex, sets: updated };
                              setEditingSession({ ...editingSession, exercises: exUpdated });
                            }}
                            className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                          />
                        </div>

                        {/* Reps input */}
                        <div className="col-span-5 flex items-center bg-slate-900 rounded-lg px-2 py-1">
                          <span className="text-[10px] text-slate-500 mr-1">повт</span>
                          <input
                            type="number"
                            value={set.reps === 0 ? '' : set.reps}
                            placeholder="0"
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              const updated = [...ex.sets];
                              updated[sIdx] = { ...set, reps: val };
                              const exUpdated = [...editingSession.exercises];
                              exUpdated[exIdx] = { ...ex, sets: updated };
                              setEditingSession({ ...editingSession, exercises: exUpdated });
                            }}
                            className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                          />
                        </div>

                        {/* Delete set */}
                        <div className="col-span-1 text-center">
                          {ex.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = ex.sets.filter((_, idx) => idx !== sIdx).map((s, idx) => ({ ...s, setNumber: idx + 1 }));
                                const exUpdated = [...editingSession.exercises];
                                exUpdated[exIdx] = { ...ex, sets: updated };
                                setEditingSession({ ...editingSession, exercises: exUpdated });
                              }}
                              className="text-slate-600 hover:text-rose-400 text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add set button */}
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const lastSet = ex.sets[ex.sets.length - 1];
                        const newSet: WorkoutSet = {
                          id: `set-${Date.now()}-${ex.sets.length + 1}`,
                          setNumber: ex.sets.length + 1,
                          weight: lastSet ? lastSet.weight : 0,
                          reps: lastSet ? lastSet.reps : 10,
                          completed: true
                        };
                        const updated = [...ex.sets, newSet];
                        const exUpdated = [...editingSession.exercises];
                        exUpdated[exIdx] = { ...ex, sets: updated };
                        setEditingSession({ ...editingSession, exercises: exUpdated });
                      }}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Plus size={12} /> Добавить подход
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowAddExerciseModal(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50 text-xs text-slate-300 font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={15} /> Добавить упражнение в этот день
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveEditor}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Сохранить в календарь
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELECT EXERCISE MODAL FOR EDITOR */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-800 rounded-3xl max-w-sm w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Выбрать упражнение</h4>
              <button onClick={() => setShowAddExerciseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-2 border-b border-slate-800">
              <input
                type="text"
                placeholder="Поиск..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div className="p-2 overflow-y-auto flex-1 space-y-1">
              {data.exercises
                .filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                .map(def => (
                  <div
                    key={def.id}
                    onClick={() => handleAddExerciseToEditing(def)}
                    className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{def.name}</div>
                      <div className="text-[10px] text-slate-400">{def.category}</div>
                    </div>
                    <Plus size={14} className="text-emerald-400" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
