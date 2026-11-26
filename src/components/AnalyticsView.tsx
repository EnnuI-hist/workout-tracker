import {
  ArrowUpRight,
  Award,
  BarChart3,
  Calendar,
  Dumbbell,
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
import type { ProgramExercise, WorkoutEntry } from '../types/workout.ts';
import {
  allExerciseNames,
  computeAnalyticsSummary,
  formatFullDate,
  formatNum,
  formatShortDate,
  getAllPRs,
  getProgressionSeries,
  getProgressionSummary,
  getTodayISO,
} from '../utils/calculations.ts';

interface AnalyticsViewProps {
  entries: WorkoutEntry[];
  program: ProgramExercise[];
}

type MetricTab = 'maxWeight' | 'reps' | 'estimated1RM' | 'tonnage';

export function AnalyticsView({ entries, program }: AnalyticsViewProps) {
  const [todayISO] = useState(() => getTodayISO());

  const exerciseNames = useMemo(
    () => allExerciseNames(entries, program.map((p) => p.name)),
    [entries, program]
  );

  const prs = useMemo(() => getAllPRs(entries), [entries]);
  const progressionRows = useMemo(() => getProgressionSummary(entries, program), [entries, program]);

  const [selectedExerciseState, setSelectedExercise] = useState('');
  const [metricTab, setMetricTab] = useState<MetricTab>('maxWeight');

  const selectedExercise = useMemo(() => {
    if (exerciseNames.length === 0) return '';
    if (selectedExerciseState && exerciseNames.includes(selectedExerciseState)) {
      return selectedExerciseState;
    }
    return exerciseNames[0];
  }, [exerciseNames, selectedExerciseState]);

  const series = useMemo(
    () => (selectedExercise ? getProgressionSeries(entries, selectedExercise) : []),
    [entries, selectedExercise]
  );

  const summary = useMemo(
    () => computeAnalyticsSummary(entries, todayISO),
    [entries, todayISO]
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-[#111827] border border-slate-800 p-10 text-center space-y-2">
        <BarChart3 className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="text-sm font-medium text-slate-300">
          Пока нет данных для аналитики.
        </p>
        <p className="text-xs text-slate-500">
          Сохраните хотя бы одну тренировку во вкладке «Запись», чтобы увидеть графики и статус прогрессии.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Аналитика и прогрессия</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Автоматический анализ записей, двойная прогрессия и рекорды
        </p>
      </div>

      {/* KPI */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#111827] border border-slate-800/90 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Всего тренировок</span>
              <Calendar className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{summary.total}</p>
            <p className="text-[11px] text-slate-500">в журнале</p>
          </div>
          <div className="rounded-2xl bg-[#111827] border border-slate-800/90 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Регулярность</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{summary.avgPerWeek}</p>
            <p className="text-[11px] text-slate-500">трен. в неделю в среднем</p>
          </div>
          <div className="rounded-2xl bg-[#111827] border border-slate-800/90 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Тоннаж за месяц</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {formatNum(summary.monthTonnage)} кг
            </p>
            <p className="text-[11px] text-slate-500">за последние 30 дней</p>
          </div>
        </div>
      )}

      {/* Exercise chart */}
      <section className="rounded-2xl bg-[#111827] border border-slate-800/90 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              График прогрессии по упражнению
            </label>
            <div className="relative max-w-md">
              <Dumbbell className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#0b0f19] border border-slate-700/80 text-sm font-semibold text-white outline-none focus:border-blue-500"
              >
                {exerciseNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'maxWeight', label: 'Рабочий вес' },
                { id: 'reps', label: 'Повторения' },
                { id: 'estimated1RM', label: 'Расч. 1ПМ' },
                { id: 'tonnage', label: 'Тоннаж' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMetricTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  metricTab === t.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#0b0f19] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {series.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-8">
            Нет записей для упражнения «{selectedExercise}»
          </p>
        ) : metricTab === 'tonnage' ? (
          <div className="w-full min-w-0">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={series} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip mode="tonnage" />} cursor={{ fill: 'rgba(56,189,248,0.08)' }} />
                <Bar dataKey="tonnage" fill="#38bdf8" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : metricTab === 'reps' ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa]" />
                1-й подход (повт.)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                Все подходы (сумма повт.)
              </span>
            </div>
            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRepsTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRepsFirst" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip mode="reps" />} />
                  <Area
                    type="monotone"
                    dataKey="repsTotal"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#gradRepsTotal)"
                    dot={{ r: 3.5, fill: '#38bdf8', strokeWidth: 2, stroke: '#0e121b' }}
                    activeDot={{ r: 5.5, fill: '#7dd3fc' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="repsFirst"
                    stroke="#a78bfa"
                    strokeWidth={2.5}
                    fill="url(#gradRepsFirst)"
                    dot={{ r: 4, fill: '#a78bfa', strokeWidth: 2, stroke: '#0e121b' }}
                    activeDot={{ r: 6, fill: '#c4b5fd' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="w-full min-w-0">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricTab === 'estimated1RM' ? '#10b981' : '#3b82f6'} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={metricTab === 'estimated1RM' ? '#10b981' : '#3b82f6'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<ChartTooltip mode={metricTab} />} />
                <Area
                  type="monotone"
                  dataKey={metricTab}
                  stroke={metricTab === 'estimated1RM' ? '#10b981' : '#3b82f6'}
                  strokeWidth={2.5}
                  fill="url(#gradMain)"
                  dot={{ r: 4, fill: metricTab === 'estimated1RM' ? '#10b981' : '#3b82f6', strokeWidth: 2, stroke: '#0e121b' }}
                  activeDot={{ r: 6, fill: metricTab === 'estimated1RM' ? '#34d399' : '#60a5fa' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Progression summary table */}
      <section className="rounded-2xl bg-[#111827] border border-slate-800/90 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Статус прогрессии по программе</h3>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Нажми на строку, чтобы открыть график
          </span>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-3 font-semibold">Упражнение</th>
                <th className="py-2 px-2 font-semibold">Цель</th>
                <th className="py-2 px-2 font-semibold">Прошлая</th>
                <th className="py-2 px-2 font-semibold">Текущая</th>
                <th className="py-2 px-2 font-semibold">Дельта</th>
                <th className="py-2 pl-2 font-semibold">Рекомендация</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {progressionRows.map((row) => (
                <tr
                  key={row.name}
                  onClick={() => setSelectedExercise(row.name)}
                  className={`cursor-pointer transition ${
                    selectedExercise === row.name ? 'bg-blue-500/10' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-2.5 pr-3 font-medium text-slate-200">{row.name}</td>
                  <td className="py-2.5 px-2 text-slate-400 tabular-nums whitespace-nowrap">
                    {row.targetRange}
                  </td>
                  <td className="py-2.5 px-2 text-slate-400 font-mono tabular-nums whitespace-nowrap">
                    {row.prevSets}
                  </td>
                  <td className="py-2.5 px-2 text-slate-200 font-mono tabular-nums font-semibold whitespace-nowrap">
                    {row.currSets}
                  </td>
                  <td className="py-2.5 px-2 tabular-nums whitespace-nowrap">
                    <span
                      className={
                        row.deltaTone === 'positive'
                          ? 'text-emerald-400 font-bold'
                          : row.deltaTone === 'negative'
                          ? 'text-rose-400 font-semibold'
                          : 'text-slate-500'
                      }
                    >
                      {row.delta}
                    </span>
                  </td>
                  <td className="py-2.5 pl-2 whitespace-nowrap">
                    {row.shouldIncrease ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-bold text-[11px]">
                        + Вес · Пора повышать
                      </span>
                    ) : (
                      <span className="text-slate-400">{row.recommendation}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRs */}
      <section className="rounded-2xl bg-[#111827] border border-slate-800/90 p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Личные рекорды (PR)</h3>
        </div>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left border-collapse min-w-[460px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-2 font-semibold">Упражнение</th>
                <th className="py-2 px-2 font-semibold">Макс. вес</th>
                <th className="py-2 px-2 font-semibold">Расч. 1ПМ / Повт.</th>
                <th className="py-2 pl-2 font-semibold text-right">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {prs.map((pr) => (
                <tr
                  key={pr.name}
                  onClick={() => setSelectedExercise(pr.name)}
                  className={`cursor-pointer transition ${
                    selectedExercise === pr.name ? 'bg-blue-500/10' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-2.5 pr-2">
                    <p className="font-semibold text-white">{pr.name}</p>
                    <p className="text-[11px] text-slate-500">{pr.sessions} трен.</p>
                  </td>
                  <td className="py-2.5 px-2 tabular-nums">
                    {pr.maxWeight > 0 ? (
                      <>
                        <p className="font-bold text-blue-300">{pr.maxWeight} кг</p>
                        <p className="text-[11px] text-slate-500">{pr.maxWeightSet}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-blue-300">Свой вес</p>
                        <p className="text-[11px] text-slate-500">{pr.maxRepsSet}</p>
                      </>
                    )}
                  </td>
                  <td className="py-2.5 px-2 tabular-nums">
                    {pr.best1RM > 0 ? (
                      <>
                        <p className="font-bold text-emerald-400">{pr.best1RM} кг</p>
                        <p className="text-[11px] text-slate-500">{pr.best1RMSet}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-emerald-400">{pr.maxReps} повт.</p>
                        <p className="text-[11px] text-slate-500">макс. за подход</p>
                      </>
                    )}
                  </td>
                  <td className="py-2.5 pl-2 text-right text-xs text-slate-300 whitespace-nowrap">
                    {formatShortDate(pr.best1RMDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ─── Custom tooltip ─── */

function ChartTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: {
      date: string;
      maxWeight: number;
      estimated1RM: number;
      tonnage: number;
      repsFirst: number;
      repsTotal: number;
      repsAll: string;
      bestSetText: string;
    };
  }>;
  mode: MetricTab;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  if (!point) return null;

  return (
    <div className="rounded-xl bg-[#0b0f19]/95 border border-slate-700 px-3 py-2.5 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-slate-200">{formatFullDate(point.date)}</p>
      {mode === 'maxWeight' && (
        <p className="text-blue-300 font-bold tabular-nums">
          Рабочий вес: {formatNum(point.maxWeight)} кг
        </p>
      )}
      {mode === 'estimated1RM' && (
        <p className="text-emerald-300 font-bold tabular-nums">
          Расч. 1ПМ: {formatNum(point.estimated1RM)} кг
        </p>
      )}
      {mode === 'tonnage' && (
        <p className="text-sky-300 font-bold tabular-nums">
          Тоннаж: {formatNum(point.tonnage)} кг
        </p>
      )}
      {mode === 'reps' && (
        <div className="space-y-0.5 tabular-nums">
          <p className="text-violet-300 font-bold">1-й подход: {point.repsFirst} повт.</p>
          <p className="text-sky-300 font-bold">Все подходы: {point.repsTotal} повт.</p>
        </div>
      )}
      <p className="text-slate-400">Лучший подход: {point.bestSetText}</p>
      <p className="text-slate-500">По подходам: {point.repsAll}</p>
    </div>
  );
}
