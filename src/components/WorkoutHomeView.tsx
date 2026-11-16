import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, 
  Flame, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Dumbbell, 
  ChevronRight, 
  CheckCircle2, 
  ListOrdered,
  Calendar,
  Layers
} from 'lucide-react';
import { formatDuration, formatTonnage, checkProgression } from '../utils/calculations';

export const WorkoutHomeView: React.FC = () => {
  const { data, startWorkout, setActiveTab } = useApp();
  const [showExercisesList, setShowExercisesList] = useState<boolean>(false);

  const lastWorkout = data.workoutHistory && data.workoutHistory.length > 0 
    ? data.workoutHistory[0] 
    : null;

  // Count exercises ready for progression
  const progressionReadyCount = data.exercises.filter(ex => {
    const res = checkProgression(ex.id, ex.minReps, ex.maxReps, data.workoutHistory);
    return res.isReady;
  }).length;

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-5">
      {/* App Brand Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Силовой протокол
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Железный Трекер
          </h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Dumbbell size={20} />
        </div>
      </div>

      {/* Smart Progression Alert Banner */}
      {progressionReadyCount > 0 && (
        <div 
          onClick={() => setShowExercisesList(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900 border border-emerald-500/50 shadow-lg shadow-emerald-950/40 cursor-pointer hover:border-emerald-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-dark-950 shadow-md">
              <Sparkles size={20} className="animate-spin text-dark-950" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Умная прогрессия
              </div>
              <div className="text-sm font-bold text-white">
                {progressionReadyCount} {progressionReadyCount === 1 ? 'упражнение готово' : 'упражнения готовы'} к повышению веса!
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                На прошлой тренировке достигнуты верхние границы целевых повторений
              </div>
            </div>
            <ChevronRight size={18} className="text-emerald-400 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* Hero "Начать тренировку" CTA Card */}
      <div className="rounded-3xl glass-panel p-5 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300">
              Базовый шаблон
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Layers size={13} /> {data.exercises.length} упражнений
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Full-Body Силовая программа
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Комплексная тренировка на все мышечные группы: спина, грудь, ноги, дельты, руки и пресс с автоматическим отслеживанием прогрессии.
            </p>
          </div>

          {/* Big Start Workout Button */}
          <button
            type="button"
            onClick={startWorkout}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99] text-dark-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-3"
          >
            <Play size={20} className="fill-current stroke-[2.5]" />
            <span>Начать тренировку</span>
          </button>
        </div>
      </div>

      {/* Last Workout Summary Card */}
      {lastWorkout ? (
        <div className="rounded-2xl glass-panel p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-400" />
              Предыдущая тренировка
            </span>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              История <ChevronRight size={13} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">{lastWorkout.title}</div>
              <div className="text-xs text-slate-400">
                {new Date(lastWorkout.startedAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-mono font-bold text-emerald-400">
                {formatTonnage(lastWorkout.totalTonnageKg)}
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center justify-end gap-1">
                <Clock size={11} /> {formatDuration(lastWorkout.durationSeconds)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl glass-panel p-4 border border-slate-800 text-center text-xs text-slate-400">
          Вы еще не завершили ни одной тренировки. Нажмите «Начать тренировку», чтобы запустить первый цикл!
        </div>
      )}

      {/* Program Exercises Collapsible List */}
      <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowExercisesList(!showExercisesList)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ListOrdered size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-white">
              Список упражнений программы ({data.exercises.length})
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {showExercisesList ? 'Свернуть ▲' : 'Развернуть ▼'}
          </span>
        </button>

        {showExercisesList && (
          <div className="px-4 pb-4 space-y-2 border-t border-slate-800/80 pt-3">
            {data.exercises.map((ex, idx) => {
              const prog = checkProgression(ex.id, ex.minReps, ex.maxReps, data.workoutHistory);
              return (
                <div
                  key={ex.id}
                  className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {ex.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {ex.targetSets} × {ex.minReps}–{ex.maxReps}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white">
                      {idx + 1}. {ex.name}
                    </div>
                  </div>

                  {prog.isReady && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold tracking-wide">
                      ⚡ +Вес
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
