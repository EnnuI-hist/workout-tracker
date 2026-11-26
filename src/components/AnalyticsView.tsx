import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  Dumbbell,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WorkoutSession, WorkoutTemplate } from '../types/workout.ts';
import {
  calculateSessionTonnage,
  formatFullDate,
  formatNumber,
  formatShortDate,
  getAllExercisePRs,
  getAllUniqueExerciseNames,
  getExerciseProgressionSeries,
  offsetISODate,
} from '../utils/calculations.ts';

interface AnalyticsViewProps {
  sessions: WorkoutSession[];
  templates: WorkoutTemplate[];
  onLoadDemoData: () => void;
}

type ChartMetricTab = 'all' | 'maxWeight' | 'estimated1RM' | 'tonnage';

export function AnalyticsView({
  sessions,
  templates,
  onLoadDemoData,
}: AnalyticsViewProps) {
  const exerciseNames = useMemo(() => {
    const tplNames = templates.flatMap((t) => t.exercises.map((e) => e.name));
    return getAllUniqueExerciseNames(sessions, tplNames);
  }, [sessions, templates]);

  const prs = useMemo(() => getAllExercisePRs(sessions), [sessions]);

  const [selectedExerciseState, setSelectedExercise] = useState<string>('');
  const [metricTab, setMetricTab] = useState<ChartMetricTab>('all');

  const selectedExercise = useMemo(() => {
    if (exerciseNames.length === 0) return '';
    if (selectedExerciseState && exerciseNames.includes(selectedExerciseState)) {
      return selectedExerciseState;
    }
    const withHistory = prs[0]?.exerciseName;
    if (withHistory && exerciseNames.includes(withHistory)) {
      return withHistory;
    }
    return exerciseNames[0];
  }, [exerciseNames, prs, selectedExerciseState]);

  const summary = useMemo(() => {
    const weekAgo = offsetISODate(-6);
    const monthAgo = offsetISODate(-29);

    let weekTonnage = 0;
    let weekWorkouts = 0;
    let monthTonnage = 0;
    let monthWorkouts = 0;
    let totalTonnage = 0;

    for (const s of sessions) {
      const vol = calculateSessionTonnage(s);
      totalTonnage += vol;
      if (s.date >= weekAgo) {
        weekTonnage += vol;
        weekWorkouts += 1;
      }
      if (s.date >= monthAgo) {
        monthTonnage += vol;
        monthWorkouts += 1;
      }
    }

    return {
      weekTonnage: Math.round(weekTonnage),
      weekWorkouts,
      monthTonnage: Math.round(monthTonnage),
      monthWorkouts,
      totalWorkouts: sessions.length,
      totalTonnage: Math.round(totalTonnage),
    };
  }, [sessions]);

  const series = useMemo(() => {
    if (!selectedExercise) return [];
    return getExerciseProgressionSeries(sessions, selectedExercise);
  }, [sessions, selectedExercise]);

  const selectedDelta = useMemo(() => {
    if (series.length < 2) return null;
    const first = series[0];
    const last = series[series.length - 1];
    return {
      weightDiff: Math.round((last.maxWeight - first.maxWeight) * 10) / 10,
      e1rmDiff: Math.round((last.estimated1RM - first.estimated1RM) * 10) / 10,
      tonnageDiff: Math.round(last.tonnage - first.tonnage),
    };
  }, [series]);

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl bg-[#141822] border border-slate-800 p-8 sm:p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h2 className="text-lg font-bold text-white">Пока нет данных для аналитики</h2>
          <p className="text-sm text-slate-400">
            Завершите хотя бы одну тренировку или загрузите готовый набор демо-данных за 4 недели,
            чтобы увидеть графики прогрессии и личные рекорды.
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Аналитика и прогрессия</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Сводка тренировочного объёма, расчётный 1ПМ по Эпли и личные рекорды.
        </p>
      </div>

      {/* KPI Summary Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-[#141822] border border-slate-800/90 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Тоннаж за 7 дней</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">
            {formatNumber(summary.weekTonnage)} <span className="text-xs font-medium text-slate-400">кг</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Тренировок: <strong className="text-slate-300">{summary.weekWorkouts}</strong>
          </p>
        </div>

        <div className="rounded-2xl bg-[#141822] border border-slate-800/90 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Тоннаж за 30 дней</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">
            {formatNumber(summary.monthTonnage)} <span className="text-xs font-medium text-slate-400">кг</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Тренировок: <strong className="text-slate-300">{summary.monthWorkouts}</strong>
          </p>
        </div>

        <div className="rounded-2xl bg-[#141822] border border-slate-800/90 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Всего тренировок</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">
            {summary.totalWorkouts}
          </p>
          <p className="text-[11px] text-slate-500">
            Общий тоннаж: <strong className="text-slate-300">{formatNumber(summary.totalTonnage)} кг</strong>
          </p>
        </div>

        <div className="rounded-2xl bg-[#141822] border border-slate-800/90 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Упражнений с PR</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">{prs.length}</p>
          <p className="text-[11px] text-slate-500 truncate">
            Топ 1ПМ:{' '}
            <strong className="text-amber-300">
              {prs[0] ? `${prs[0].best1RM} кг` : '—'}
            </strong>
          </p>
        </div>
      </section>

      {/* Exercise Progression Charts */}
      <section className="rounded-2xl bg-[#141822] border border-slate-800/90 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            <label
              htmlFor="analytics-exercise-select"
              className="text-xs font-semibold uppercase tracking-wider text-slate-400 block"
            >
              Упражнение для анализа
            </label>
            <div className="relative max-w-md">
              <Dumbbell className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="analytics-exercise-select"
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0b0e14] border border-slate-700/80 text-sm font-semibold text-white outline-none focus:border-blue-500"
              >
                {exerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: 'Все графики' },
                { id: 'maxWeight', label: 'Макс. вес' },
                { id: 'estimated1RM', label: '1ПМ (Эпли)' },
                { id: 'tonnage', label: 'Тоннаж' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMetricTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  metricTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0b0e14] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progression Delta Badges */}
        {selectedDelta && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-slate-800 text-slate-300">
              Прирост рабочего веса:{' '}
              <strong
                className={
                  selectedDelta.weightDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {selectedDelta.weightDiff >= 0 ? '+' : ''}
                {selectedDelta.weightDiff} кг
              </strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-slate-800 text-slate-300">
              Прирост 1ПМ:{' '}
              <strong
                className={
                  selectedDelta.e1rmDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {selectedDelta.e1rmDiff >= 0 ? '+' : ''}
                {selectedDelta.e1rmDiff} кг
              </strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-slate-800 text-slate-300">
              Прирост тоннажа:{' '}
              <strong
                className={
                  selectedDelta.tonnageDiff >= 0 ? 'text-blue-400' : 'text-rose-400'
                }
              >
                {selectedDelta.tonnageDiff >= 0 ? '+' : ''}
                {formatNumber(selectedDelta.tonnageDiff)} кг
              </strong>
            </span>
          </div>
        )}

        {series.length === 0 ? (
          <div className="rounded-xl bg-[#0b0e14] border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
            Для упражнения «{selectedExercise}» пока нет выполненных подходов в истории.
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              metricTab === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {(metricTab === 'all' || metricTab === 'maxWeight') && (
              <div className="rounded-xl bg-[#0e121b] border border-slate-800/80 p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Максимальный рабочий вес (кг)
                  </h3>
                  <span className="text-xs font-semibold text-blue-400 tabular-nums">
                    Посл.: {series[series.length - 1].maxWeight} кг
                  </span>
                </div>
                <div className="w-full min-w-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        content={<ChartTooltip unit="кг" metricName="Макс. вес" />}
                      />
                      <Area
                        type="monotone"
                        dataKey="maxWeight"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#gradWeight)"
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0e121b' }}
                        activeDot={{ r: 6, fill: '#60a5fa' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {(metricTab === 'all' || metricTab === 'estimated1RM') && (
              <div className="rounded-xl bg-[#0e121b] border border-slate-800/80 p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Расчётный 1ПМ (формула Эпли)
                    </h3>
                    <p className="text-[11px] text-slate-500">вес × (1 + повторения / 30)</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 tabular-nums shrink-0">
                    Посл.: {series[series.length - 1].estimated1RM} кг
                  </span>
                </div>
                <div className="w-full min-w-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad1RM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        content={<ChartTooltip unit="кг" metricName="Расчётный 1ПМ" />}
                      />
                      <Area
                        type="monotone"
                        dataKey="estimated1RM"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#grad1RM)"
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0e121b' }}
                        activeDot={{ r: 6, fill: '#34d399' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {(metricTab === 'all' || metricTab === 'tonnage') && (
              <div
                className={`rounded-xl bg-[#0e121b] border border-slate-800/80 p-3.5 sm:p-4 space-y-2 ${
                  metricTab === 'all' ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Общий тоннаж за тренировку (кг)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Сумма (вес × повторения) по всем выполненным подходам
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-sky-400 tabular-nums">
                    Посл.: {formatNumber(series[series.length - 1].tonnage)} кг
                  </span>
                </div>
                <div className="w-full min-w-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={series} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
                        content={<ChartTooltip unit="кг" metricName="Тоннаж" />}
                      />
                      <Bar
                        dataKey="tonnage"
                        fill="#38bdf8"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={42}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Personal Records Section */}
      <section className="rounded-2xl bg-[#141822] border border-slate-800/90 p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Личные рекорды (PR)</h3>
          </div>
          <span className="text-xs text-slate-500">Нажмите на строку для графика</span>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left border-collapse min-w-[540px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 pr-3 font-semibold">Упражнение</th>
                <th className="py-2.5 px-3 font-semibold">Макс. вес</th>
                <th className="py-2.5 px-3 font-semibold">Расч. 1ПМ</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Дата PR (1ПМ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {prs.map((pr) => {
                const isSelected = pr.exerciseName === selectedExercise;
                return (
                  <tr
                    key={pr.exerciseName}
                    onClick={() => setSelectedExercise(pr.exerciseName)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-blue-500/10' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-white">{pr.exerciseName}</p>
                      <p className="text-xs text-slate-400">
                        {pr.muscleGroup} · {pr.sessionsCount} трен.
                      </p>
                    </td>
                    <td className="py-3 px-3 tabular-nums">
                      <p className="font-bold text-blue-300">{pr.maxWeight} кг</p>
                      <p className="text-[11px] text-slate-500">
                        {pr.bestSetAtMaxWeight} ({formatShortDate(pr.maxWeightDate)})
                      </p>
                    </td>
                    <td className="py-3 px-3 tabular-nums">
                      <p className="font-bold text-emerald-400">{pr.best1RM} кг</p>
                      <p className="text-[11px] text-slate-500">{pr.best1RMSet}</p>
                    </td>
                    <td className="py-3 pl-3 text-right text-xs text-slate-300 whitespace-nowrap">
                      {formatFullDate(pr.best1RMDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: {
      date: string;
      bestSetText: string;
    };
  }>;
  unit: string;
  metricName: string;
}

function ChartTooltip({ active, payload, unit, metricName }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const point = item.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl bg-[#0b0e14]/95 border border-slate-700 px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-slate-200">{formatFullDate(point.date)}</p>
      <p className="text-blue-300 font-bold tabular-nums">
        {metricName}: {formatNumber(item.value ?? 0)} {unit}
      </p>
      <p className="text-slate-400">Лучший подход: {point.bestSetText}</p>
    </div>
  );
}
