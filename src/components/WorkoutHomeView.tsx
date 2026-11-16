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
  Layers,
  Settings2
} from 'lucide-react';
import { formatDuration, formatTonnage, checkProgression } from '../utils/calculations';

export const WorkoutHomeView: React.FC = () => {
  const { data, startWorkout, setActiveTab } = useApp();
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<string>('template-day-a');
  const [showExercisesList, setShowExercisesList] = useState<boolean>(false);

  const lastWorkout = data.workoutHistory && data.workoutHistory.length > 0 
    ? data.workoutHistory[0] 
    : null;

  // Count exercises ready for progression
  const progressionReadyCount = data.exercises.filter(ex => {
    const res = checkProgression(ex.id, ex.minReps, ex.maxReps, data.workoutHistory);
    return res.isReady;
  }).length;

  const currentTemplate = data.templates.find(t => t.id === selectedTemplateTab) || data.templates[0];
  const isDayA = currentTemplate.type === 'day-a';

  return (
    <div className="pb-28 pt-4 px-3 max-w-xl mx-auto space-y-5">
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
          onClick={() => setActiveTab('history')}
          className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900 border border-emerald-500/50 shadow-lg shadow-emerald-950/40 cursor-pointer hover:border-emerald-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-dark-950 shadow-md">
              <Sparkles size={20} className="text-dark-950" />
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

      {/* Template Selector Switcher (День А / День Б) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Выберите программу на сегодня
          </span>
          <button
            onClick={() => setActiveTab('templates')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <Settings2 size={13} /> Настроить шаблоны
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
          {data.templates.map(tpl => {
            const isSelected = tpl.id === selectedTemplateTab;
            const isA = tpl.type === 'day-a';
            return (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplateTab(tpl.id)}
                className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex flex-col items-center gap-1 ${
                  isSelected
                    ? isA 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60' 
                      : 'bg-sky-600 text-white shadow-lg shadow-sky-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{tpl.name}</span>
                <span className={`text-[10px] font-normal ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                  {tpl.exercises.length} упражнений
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero "Начать тренировку" CTA Card for chosen template */}
      <div className={`rounded-3xl glass-panel p-5 border relative overflow-hidden shadow-2xl transition-all ${
        isDayA ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-sky-500/40 bg-sky-950/10'
      }`}>
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isDayA ? 'bg-emerald-500/10' : 'bg-sky-500/10'
        }`} />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              isDayA ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300' : 'bg-sky-950 border-sky-500/30 text-sky-300'
            }`}>
              {currentTemplate.name}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Layers size={13} /> {currentTemplate.exercises.length} упражнений
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {currentTemplate.name}
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {currentTemplate.description || 'Комплексная силовая программа Full-Body с автоматическим контролем прогрессии.'}
            </p>
          </div>

          {/* Big Start Workout Button */}
          <button
            type="button"
            onClick={() => startWorkout(currentTemplate.id)}
            className={`w-full py-4 px-6 rounded-2xl active:scale-[0.99] font-black text-base shadow-xl transition-all flex items-center justify-center gap-3 ${
              isDayA
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-dark-950 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-dark-950 shadow-sky-500/25'
            }`}
          >
            <Play size={20} className="fill-current stroke-[2.5]" />
            <span>Начать «{currentTemplate.name}»</span>
          </button>
        </div>
      </div>

      {/* Last Workout Summary Card */}
      {lastWorkout ? (
        <div className="rounded-3xl glass-panel p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-400" />
              Предыдущая тренировка
            </span>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5 font-semibold"
            >
              В календарь <ChevronRight size={13} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">{lastWorkout.title}</div>
              <div className="text-xs text-slate-400">
                {new Date(lastWorkout.date || lastWorkout.startedAt).toLocaleDateString('ru-RU', {
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
        <div className="rounded-3xl glass-panel p-4 border border-slate-800 text-center text-xs text-slate-400">
          Вы еще не завершили ни одной тренировки. Нажмите кнопку выше, чтобы запустить первый цикл!
        </div>
      )}

      {/* Program Exercises Collapsible List */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowExercisesList(!showExercisesList)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ListOrdered size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-white">
              Упражнения: {currentTemplate.name} ({currentTemplate.exercises.length})
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {showExercisesList ? 'Свернуть ▲' : 'Развернуть ▼'}
          </span>
        </button>

        {showExercisesList && (
          <div className="px-4 pb-4 space-y-2 border-t border-slate-800/80 pt-3">
            {currentTemplate.exercises.map((tex, idx) => {
              const prog = checkProgression(tex.exerciseId, tex.minReps, tex.maxReps, data.workoutHistory);
              return (
                <div
                  key={tex.id}
                  className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {tex.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {tex.targetSets} × {tex.minReps}–{tex.maxReps}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white">
                      {idx + 1}. {tex.name}
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
