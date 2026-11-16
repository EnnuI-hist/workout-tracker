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
  Target,
  BarChart2,
  Sparkles
} from 'lucide-react';
import { calculate1RM, calculateTonnage, formatDuration, formatTonnage } from '../utils/calculations';

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
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    data.exercises[0]?.id || 'lat-pulldown'
  );
  const [activeMetric, setActiveMetric] = useState<MetricType>('weight');
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const selectedExercise = useApp().data.exercises.find(e => e.id === selectedExerciseId) || data.exercises[0];

  // Overall stats
  const totalWorkouts = data.workoutHistory.length;
  const totalAllTimeTonnage = data.workoutHistory.reduce((sum, w) => sum + w.totalTonnageKg, 0);
  const averageDuration = totalWorkouts > 0 
    ? Math.round(data.workoutHistory.reduce((sum, w) => sum + w.durationSeconds, 0) / totalWorkouts) 
    : 0;

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
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

    chronologicalWorkouts.forEach(workout => {
      const match = workout.exercises.find(e => e.exerciseId === selectedExerciseId);
      if (match) {
        const completedSets = match.sets.filter(s => s.completed && s.reps > 0);
        if (completedSets.length > 0) {
          const maxW = Math.max(...completedSets.map(s => s.weight));
          const best1RM = Math.max(...completedSets.map(s => calculate1RM(s.weight, s.reps)));
          const tonnage = calculateTonnage(completedSets);

          const dateLabel = new Date(workout.startedAt).toLocaleDateString('ru-RU', {
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
      return { maxWeight: 0, best1RM: 0, totalVolume: 0, totalSets: 0 };
    }
    const maxWeight = Math.max(...chartDataPoints.map(p => p.maxWeight));
    const best1RM = Math.max(...chartDataPoints.map(p => p.best1RM));
    const totalVolume = chartDataPoints.reduce((sum, p) => sum + p.tonnage, 0);
    return { maxWeight, best1RM, totalVolume };
  }, [chartDataPoints]);

  // Chart configuration
  const chartConfig = useMemo(() => {
    const labels = chartDataPoints.map(p => p.date);
    let values: number[] = [];
    let label = '';
    let color = '#10b981'; // emerald
    let gradientFrom = 'rgba(16, 185, 129, 0.35)';
    let gradientTo = 'rgba(16, 185, 129, 0.0)';

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
      legend: {
        display: false
      },
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
            if (activeMetric === 'tonnage') {
              return `Тоннаж: ${val} кг`;
            } else if (activeMetric === 'oneRM') {
              return `1ПМ: ${val} кг`;
            }
            return `Вес: ${val} кг`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 }
        }
      }
    }
  };

  return (
    <div className="pb-28 pt-4 px-3 max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={22} /> Прогресс и Аналитика
        </h1>
        <p className="text-xs text-slate-400">История тренировок, силовые рекорды и графики 1ПМ</p>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Тренировки</div>
          <div className="text-lg font-black text-white font-mono">{totalWorkouts}</div>
        </div>
        <div className="p-3 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Всего тоннаж</div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            {formatTonnage(totalAllTimeTonnage)}
          </div>
        </div>
        <div className="p-3 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Сред. время</div>
          <div className="text-lg font-black text-amber-400 font-mono">
            {formatDuration(averageDuration)}
          </div>
        </div>
      </div>

      {/* EXERCISE PROGRESS SECTION */}
      <div className="rounded-3xl glass-panel p-4 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <h2 className="text-base font-bold text-white">Прогресс по упражнению</h2>
          </div>
        </div>

        {/* Exercise Selector */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Выберите упражнение:</label>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-medium"
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
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400">Макс. вес</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {exerciseStats.maxWeight} кг
            </div>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400">Рекорд 1ПМ</div>
            <div className="text-base font-bold text-sky-400 font-mono mt-0.5">
              {exerciseStats.best1RM} кг
            </div>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-center">
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
            <Calendar size={18} className="text-emerald-400" /> История тренировок ({data.workoutHistory.length})
          </h2>
        </div>

        {data.workoutHistory.length === 0 ? (
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-400">
            История тренировок пуста. Начните первую тренировку во вкладке «Тренировка»!
          </div>
        ) : (
          data.workoutHistory.map((workout) => {
            const isExpanded = expandedWorkoutId === workout.id;
            const completedSetsCount = workout.exercises.reduce(
              (acc, e) => acc + e.sets.filter(s => s.completed).length,
              0
            );

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
                      <div className="text-sm font-bold text-white">{workout.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(workout.startedAt).toLocaleDateString('ru-RU', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
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
                        <>Скрыть детали <ChevronUp size={14} /></>
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

                    {/* Delete Workout Button */}
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
