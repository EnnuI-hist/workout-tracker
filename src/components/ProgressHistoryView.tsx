import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  TrendingUp, 
  Flame, 
  Clock, 
  Calendar, 
  Trophy, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { 
  calculate1RM, 
  calculateTonnage, 
  formatDuration, 
  formatTonnage,
  checkProgression,
  filterWorkoutsByPeriod,
  calculatePeriodSummary,
  StatsPeriod
} from '../utils/calculations';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type MetricType = 'weight' | 'oneRM' | 'tonnage';

export const ProgressHistoryView: React.FC = () => {
  const { data, deleteWorkoutFromHistory } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<StatsPeriod>('month');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    data.exercises[0]?.id || 'lat-pulldown'
  );
  const [activeMetric, setActiveMetric] = useState<MetricType>('weight');
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [progressionFilter, setProgressionFilter] = useState<'all' | 'ready'>('all');

  // Filtered workouts for period summary
  const periodWorkouts = useMemo(() => {
    return filterWorkoutsByPeriod(data.workoutHistory, selectedPeriod);
  }, [data.workoutHistory, selectedPeriod]);

  // Period summary stats
  const periodSummary = useMemo(() => {
    return calculatePeriodSummary(periodWorkouts, selectedPeriod);
  }, [periodWorkouts, selectedPeriod]);

  // Process data for the selected exercise across all workouts (chronological order)
  const chartDataPoints = useMemo(() => {
    const points: Array<{
      date: string;
      maxWeight: number;
      best1RM: number;
      tonnage: number;
    }> = [];

    // Chronological order: oldest to newest
    const chronologicalWorkouts = [...data.workoutHistory].sort(
      (a, b) => new Date(a.date || a.startedAt).getTime() - new Date(b.date || b.startedAt).getTime()
    );

    chronologicalWorkouts.forEach(workout => {
      const match = workout.exercises.find(e => e.exerciseId === selectedExerciseId);
      if (match) {
        const completedSets = match.sets.filter(s => s.completed && s.reps > 0);
        if (completedSets.length > 0) {
          const maxW = Math.max(...completedSets.map(s => s.weight));
          const best1RM = Math.max(...completedSets.map(s => calculate1RM(s.weight, s.reps)));
          const tonnage = calculateTonnage(completedSets);

          const dateLabel = new Date(workout.date || workout.startedAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
          });

          points.push({
            date: dateLabel,
            maxWeight: maxW,
            best1RM: best1RM,
            tonnage: tonnage
          });
        }
      }
    });

    return points;
  }, [data.workoutHistory, selectedExerciseId]);

  // Aggregate stats for this exercise
  const exerciseStats = useMemo(() => {
    if (chartDataPoints.length === 0) {
      return { maxWeight: 0, best1RM: 0, totalVolume: 0 };
    }
    const maxWeight = Math.max(...chartDataPoints.map(p => p.maxWeight));
    const best1RM = Math.max(...chartDataPoints.map(p => p.best1RM));
    const totalVolume = chartDataPoints.reduce((sum, p) => sum + p.tonnage, 0);
    return { maxWeight, best1RM, totalVolume };
  }, [chartDataPoints]);

  // Evaluate progression for all exercises
  const allExercisesProgression = useMemo(() => {
    return data.exercises.map(ex => {
      const prog = checkProgression(ex.id, ex.minReps, ex.maxReps, data.workoutHistory);
      return {
        exercise: ex,
        progression: prog
      };
    });
  }, [data.exercises, data.workoutHistory]);

  const readyForProgressionCount = allExercisesProgression.filter(p => p.progression.isReady).length;

  const filteredProgressionList = allExercisesProgression.filter(item => {
    if (progressionFilter === 'ready') return item.progression.isReady;
    return true;
  });

  // Chart configuration
  const chartConfig = useMemo(() => {
    const labels = chartDataPoints.map(p => p.date);
    let values: number[] = [];
    let label = '';
    let color = '#10b981'; // emerald
    let gradientFrom = 'rgba(16, 185, 129, 0.4)';

    if (activeMetric === 'weight') {
      values = chartDataPoints.map(p => p.maxWeight);
      label = 'Максимальный рабочий вес (кг)';
      color = '#10b981';
      gradientFrom = 'rgba(16, 185, 129, 0.4)';
    } else if (activeMetric === 'oneRM') {
      values = chartDataPoints.map(p => p.best1RM);
      label = 'Расчетный 1ПМ Epley (кг)';
      color = '#38bdf8'; // sky cyan
      gradientFrom = 'rgba(56, 189, 248, 0.4)';
    } else {
      values = chartDataPoints.map(p => p.tonnage);
      label = 'Тоннаж упражнения (кг)';
      color = '#f59e0b'; // amber
      gradientFrom = 'rgba(245, 158, 11, 0.4)';
    }

    return {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderColor: color,
          backgroundColor: gradientFrom,
          borderWidth: 3,
          pointBackgroundColor: color,
          pointBorderColor: '#0a0f1d',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.35
        }
      ]
    };
  }, [chartDataPoints, activeMetric]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            if (activeMetric === 'tonnage') return `Тоннаж: ${val} кг`;
            if (activeMetric === 'oneRM') return `1ПМ: ${val} кг`;
            return `Вес: ${val} кг`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="pb-28 pt-3 px-3 max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Аналитика прогресса
        </span>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={22} /> Общая статистика
        </h1>
        <p className="text-xs text-slate-400">Сводка за период, динамика силовых и индикаторы прогрессии</p>
      </div>

      {/* PERIOD SELECTOR & SUMMARY SECTION */}
      <div className="rounded-3xl glass-panel p-4 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Период статистики:</span>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedPeriod === 'month'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedPeriod === 'year'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Год
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedPeriod === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Всё время
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Тренировки</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {periodSummary.workoutCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Общий тоннаж</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              {formatTonnage(periodSummary.totalTonnage)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Частота</div>
            <div className="text-sm font-bold text-sky-400 mt-1">
              {periodSummary.frequencyPerWeek}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Сред. время</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
              {periodSummary.avgDurationMins} <span className="text-xs font-normal text-slate-400">мин</span>
            </div>
          </div>
        </div>
      </div>

      {/* SMART PROGRESSION STATUS SECTION */}
      <div className="rounded-3xl glass-panel p-4 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400" />
            <h2 className="text-base font-bold text-white">Индикаторы прогрессии</h2>
          </div>
          <button
            onClick={() => setProgressionFilter(progressionFilter === 'all' ? 'ready' : 'all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
              progressionFilter === 'ready'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {progressionFilter === 'ready' ? '⚡ Только готовые' : `Все (${readyForProgressionCount} готовы)`}
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pt-1">
          {filteredProgressionList.map(({ exercise, progression }) => (
            <div
              key={exercise.id}
              className={`p-2.5 rounded-2xl border transition-all ${
                progression.isReady
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-900/70 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {exercise.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Цель: {exercise.minReps}–{exercise.maxReps} повт.
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{exercise.name}</h4>
                </div>

                {progression.isReady ? (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-dark-950 text-[11px] font-black uppercase tracking-wide shadow-md flex items-center gap-1 flex-shrink-0">
                    <Sparkles size={12} /> Готов к +весу
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-semibold flex-shrink-0">
                    Закрепление
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/60 line-clamp-2">
                {progression.reason}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EXERCISE PROGRESS CHART */}
      <div className="rounded-3xl glass-panel p-4 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <h2 className="text-base font-bold text-white">График по упражнению</h2>
        </div>

        {/* Exercise Selector */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Выберите упражнение:</label>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            {data.exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.category})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Exercise Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Макс. вес</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {exerciseStats.maxWeight} кг
            </div>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Рекорд 1ПМ</div>
            <div className="text-base font-bold text-sky-400 font-mono mt-0.5">
              {exerciseStats.best1RM} кг
            </div>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Объем</div>
            <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
              {formatTonnage(exerciseStats.totalVolume)}
            </div>
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveMetric('weight')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeMetric === 'weight'
                ? 'bg-emerald-500 text-dark-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Рабочий вес
          </button>
          <button
            onClick={() => setActiveMetric('oneRM')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeMetric === 'oneRM'
                ? 'bg-sky-500 text-dark-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1ПМ (Epley)
          </button>
          <button
            onClick={() => setActiveMetric('tonnage')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeMetric === 'tonnage'
                ? 'bg-amber-500 text-dark-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Тоннаж
          </button>
        </div>

        {/* Interactive Chart Container */}
        <div className="h-56 w-full pt-1">
          {chartDataPoints.length > 0 ? (
            <Line data={chartConfig} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Нет завершенных тренировок для этого упражнения
            </div>
          )}
        </div>
      </div>

      {/* COMPLETED WORKOUTS HISTORY LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar size={18} className="text-emerald-400" /> Все тренировки ({data.workoutHistory.length})
          </h2>
        </div>

        {data.workoutHistory.length === 0 ? (
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-400">
            История тренировок пуста. Начните первую тренировку во вкладке «Тренировка» или внесите в «Календаре»!
          </div>
        ) : (
          data.workoutHistory.map((workout) => {
            const isExpanded = expandedWorkoutId === workout.id;
            const completedSetsCount = workout.exercises.reduce(
              (acc, e) => acc + e.sets.filter(s => s.completed).length,
              0
            );

            const isDayA = workout.templateId === 'template-day-a' || workout.title.includes('День А');
            const isDayB = workout.templateId === 'template-day-b' || workout.title.includes('День Б');
            const badgeColor = isDayA ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : isDayB ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40';

            return (
              <div
                key={workout.id}
                className="rounded-2xl glass-panel border border-slate-800 overflow-hidden transition-all duration-200"
              >
                {/* Workout Card Header */}
                <div
                  onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                  className="p-4 cursor-pointer hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${badgeColor}`}>
                          {workout.title}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(workout.date || workout.startedAt).toLocaleDateString('ru-RU', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-emerald-400">
                        {formatTonnage(workout.totalTonnageKg)}
                      </div>
                      <div className="text-xs font-mono text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                        <Clock size={11} /> {formatDuration(workout.durationSeconds)}
                      </div>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>{workout.exercises.length} упражнений • {completedSetsCount} подходов</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      {isExpanded ? (
                        <>Скрыть <ChevronUp size={14} /></>
                      ) : (
                        <>Подробнее <ChevronDown size={14} /></>
                      )}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                    {workout.notes && (
                      <div className="text-xs text-slate-300 italic p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        «{workout.notes}»
                      </div>
                    )}

                    <div className="space-y-2">
                      {workout.exercises.map((ex, idx) => {
                        const doneSets = ex.sets.filter(s => s.completed);
                        if (doneSets.length === 0) return null;

                        return (
                          <div
                            key={ex.id || idx}
                            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/70"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-slate-200">
                                {idx + 1}. {ex.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatTonnage(calculateTonnage(doneSets))}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {doneSets.map((s) => (
                                <span
                                  key={s.id}
                                  className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                                >
                                  #{s.setNumber}: <b className="text-white">{s.weight} кг</b> × {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Удалить эту тренировку из истории?')) {
                            deleteWorkoutFromHistory(workout.id);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} /> Удалить запись
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
