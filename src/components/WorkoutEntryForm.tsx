import {
  Activity,
  AlertCircle,
  AlignLeft,
  ArrowRightLeft,
  Check,
  Dumbbell,
  Eraser,
  FileText,
  Flame,
  History,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  DraftExercise,
  ExerciseEntry,
  ProgramExercise,
  SetEntry,
  WorkoutDraftState,
  WorkoutEntry,
} from '../types/workout.ts';
import {
  checkDoubleProgression,
  createDraftExercises,
  entryTonnage,
  findPreviousPerformance,
  formatFullDate,
  formatNum,
  formatSetsCompact,
  generateId,
  getTodayISO,
  sortEntriesNewestFirst,
} from '../utils/calculations.ts';
import { DEFAULT_PROGRAM } from '../utils/defaultProgram.ts';
import { matchToProgramName, parseWorkoutTextDetailed } from '../utils/textParser.ts';

interface WorkoutEntryFormProps {
  program: ProgramExercise[];
  entries: WorkoutEntry[];
  weightStep: 1.25 | 2.5;
  draft: WorkoutDraftState;
  onChangeDraft: (updater: (prev: WorkoutDraftState) => WorkoutDraftState) => void;
  onLoadDefaultProgram: () => void;
  onSave: (entry: WorkoutEntry) => void;
  onNotify: (message: string) => void;
}

function parseDraftSets(sets: Array<{ weight: string; reps: string }>): SetEntry[] {
  const result: SetEntry[] = [];
  for (const s of sets) {
    const reps = parseInt(s.reps.trim(), 10);
    if (Number.isNaN(reps) || reps <= 0) continue;
    const rawW = s.weight.trim().replace(',', '.');
    const weight = rawW === '' ? 0 : parseFloat(rawW);
    if (Number.isNaN(weight) || weight < 0) continue;
    result.push({ weight: Math.round(weight * 100) / 100, reps });
  }
  return result;
}

export function WorkoutEntryForm({
  program,
  entries,
  weightStep,
  draft,
  onChangeDraft,
  onLoadDefaultProgram,
  onSave,
  onNotify,
}: WorkoutEntryFormProps) {
  const [isSavingAnim, setIsSavingAnim] = useState(false);

  const programMap = useMemo(() => {
    const map = new Map<string, ProgramExercise>();
    for (const p of program) map.set(p.name.toLowerCase(), p);
    return map;
  }, [program]);

  const programNames = useMemo(() => program.map((p) => p.name), [program]);

  const previousMap = useMemo(() => {
    const map = new Map<string, SetEntry[]>();
    for (const p of program) {
      const prev = findPreviousPerformance(entries, p.name);
      if (prev) map.set(p.name.toLowerCase(), prev);
    }
    return map;
  }, [entries, program]);

  const lastWorkout = useMemo(() => {
    if (entries.length === 0) return null;
    return sortEntriesNewestFirst(entries)[0] ?? null;
  }, [entries]);

  const programDiffersFromDefault = useMemo(() => {
    if (program.length !== DEFAULT_PROGRAM.length) return true;
    return program.some(
      (p, i) =>
        p.name !== DEFAULT_PROGRAM[i].name ||
        p.targetSets !== DEFAULT_PROGRAM[i].targetSets ||
        p.targetRepMin !== DEFAULT_PROGRAM[i].targetRepMin ||
        p.targetRepMax !== DEFAULT_PROGRAM[i].targetRepMax
    );
  }, [program]);

  const parsedTextPreview = useMemo(() => {
    if (!draft.textMode || !draft.rawText.trim()) {
      return {
        exercises: [] as Array<ExerciseEntry & { matchedFrom?: string }>,
        unparsedLines: [] as string[],
        detectedNotes: undefined as string | undefined,
      };
    }
    const res = parseWorkoutTextDetailed(draft.rawText);
    const mapped = res.exercises.map((ex) => {
      const matched = matchToProgramName(ex.name, programNames);
      return {
        name: matched ?? ex.name,
        sets: ex.sets,
        matchedFrom: matched && matched.toLowerCase() !== ex.name.trim().toLowerCase() ? ex.name : undefined,
      };
    });
    return { exercises: mapped, unparsedLines: res.unparsedLines, detectedNotes: res.detectedNotes };
  }, [draft.textMode, draft.rawText, programNames]);

  /* ─── Live summary metrics (real-time for both modes) ─── */

  const liveSummary = useMemo(() => {
    let completedSets = 0;
    let totalTonnage = 0;
    let filledExercises = 0;
    const progressionHints: Array<{ name: string; source: 'current' | 'previous' }> = [];

    if (draft.textMode) {
      filledExercises = parsedTextPreview.exercises.length;
      for (const ex of parsedTextPreview.exercises) {
        completedSets += ex.sets.length;
        for (const s of ex.sets) {
          totalTonnage += s.weight * s.reps;
        }
        const prog = programMap.get(ex.name.trim().toLowerCase());
        if (checkDoubleProgression(ex.sets, prog).shouldIncrease) {
          progressionHints.push({ name: ex.name, source: 'current' });
        }
      }
    } else {
      for (const ex of draft.exercises) {
        const name = ex.name.trim();
        const currentSets = parseDraftSets(ex.sets);
        if (name && currentSets.length > 0) {
          filledExercises++;
          completedSets += currentSets.length;
          for (const s of currentSets) {
            totalTonnage += s.weight * s.reps;
          }
        }

        if (name) {
          const prog = programMap.get(name.toLowerCase());
          const prev = previousMap.get(name.toLowerCase());
          const dp = checkDoubleProgression(currentSets, prog);
          const dpPrev = prev ? checkDoubleProgression(prev, prog) : null;
          const prevMaxW = prev ? Math.max(...prev.map((s) => s.weight)) : 0;
          const currMaxW = currentSets.length > 0 ? Math.max(...currentSets.map((s) => s.weight)) : 0;
          const alreadyRaised = prev !== undefined && currentSets.length > 0 && currMaxW > prevMaxW;

          if (dp.shouldIncrease) {
            progressionHints.push({ name, source: 'current' });
          } else if (dpPrev?.shouldIncrease && !alreadyRaised) {
            progressionHints.push({ name, source: 'previous' });
          }
        }
      }
    }

    const totalTarget = draft.textMode
      ? Math.max(program.length, filledExercises)
      : draft.exercises.length;
    const progressPct = totalTarget > 0 ? Math.min(100, Math.round((filledExercises / totalTarget) * 100)) : 0;

    return {
      filledExercises,
      totalTarget,
      progressPct,
      completedSets,
      totalTonnage: Math.round(totalTonnage),
      progressionHints,
    };
  }, [draft.textMode, draft.exercises, parsedTextPreview.exercises, program.length, programMap, previousMap]);

  /* ─── Handlers ─── */

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    onChangeDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)) }
          : ex
      ),
    }));
  };

  const updateExerciseName = (exIdx: number, name: string) => {
    onChangeDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => (i === exIdx ? { ...ex, name } : ex)),
    }));
  };

  const addSet = (exIdx: number) => {
    onChangeDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  weight: ex.sets[ex.sets.length - 1]?.weight ?? '',
                  reps: '',
                },
              ],
            }
          : ex
      ),
    }));
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    onChangeDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === exIdx && ex.sets.length > 1
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex
      ),
    }));
  };

  const addCustomExercise = () => {
    onChangeDraft((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          name: '',
          sets: [
            { weight: '', reps: '' },
            { weight: '', reps: '' },
          ],
        },
      ],
    }));
  };

  const removeCustomExercise = (exIdx: number) => {
    onChangeDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== exIdx),
    }));
  };

  const applyPreviousToRow = (exIdx: number, prevSets: SetEntry[]) => {
    onChangeDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: prevSets.map((s) => ({
                weight: String(s.weight),
                reps: String(s.reps),
              })),
            }
          : ex
      ),
    }));
  };

  const bumpRowWeight = (exIdx: number) => {
    onChangeDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            const cur = parseFloat(s.weight.replace(',', '.'));
            const next = Number.isNaN(cur) ? weightStep : Math.round((cur + weightStep) * 100) / 100;
            return { ...s, weight: String(next) };
          }),
        };
      }),
    }));
    onNotify(`Вес увеличен на +${weightStep} кг`);
  };

  const handleFillAllFromPrevious = () => {
    onChangeDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        const prevSets = findPreviousPerformance(entries, ex.name);
        if (!prevSets || prevSets.length === 0) return ex;
        if (parseDraftSets(ex.sets).length > 0) return ex;
        return {
          ...ex,
          sets: prevSets.map((s) => ({
            weight: String(s.weight),
            reps: String(s.reps),
          })),
        };
      }),
    }));
    onNotify('Подставлены подходы с прошлой тренировки.');
  };

  const handleClearTable = () => {
    onChangeDraft((prev) => ({
      ...prev,
      notes: '',
      exercises: createDraftExercises(program, entries),
    }));
  };

  const handleInsertTextTemplate = () => {
    const lines = program.map((p) => {
      const prev = previousMap.get(p.name.toLowerCase());
      if (prev && prev.length > 0) {
        const weightsHint = prev.map((s) => `${s.weight}x`).join(', ');
        return `${p.name}: ${weightsHint}`;
      }
      return `${p.name}: `;
    });
    onChangeDraft((prev) => ({
      ...prev,
      rawText: lines.join('\n'),
    }));
  };

  const handleCopyTableToText = () => {
    const lines: string[] = [];
    for (const ex of draft.exercises) {
      const parsed = parseDraftSets(ex.sets);
      if (ex.name.trim() && parsed.length > 0) {
        lines.push(`${ex.name.trim()}: ${formatSetsCompact(parsed)}`);
      }
    }
    if (lines.length === 0) {
      handleInsertTextTemplate();
      return;
    }
    onChangeDraft((prev) => ({
      ...prev,
      rawText: lines.join('\n'),
    }));
    onNotify('Заполненные строки перенесены в текст.');
  };

  const handleApplyTextToTable = () => {
    if (parsedTextPreview.exercises.length === 0) {
      onNotify('Нет распознанных упражнений для переноса.');
      return;
    }
    const parsedByName = new Map<string, SetEntry[]>();
    const extras: ExerciseEntry[] = [];
    for (const ex of parsedTextPreview.exercises) {
      const key = ex.name.toLowerCase();
      if (programMap.has(key)) {
        parsedByName.set(key, ex.sets);
      } else {
        extras.push({ name: ex.name, sets: ex.sets });
      }
    }

    onChangeDraft((prev) => {
      const baseRows: DraftExercise[] = program.map((p) => {
        const matched = parsedByName.get(p.name.toLowerCase());
        if (matched) {
          return {
            name: p.name,
            sets: matched.map((s) => ({ weight: String(s.weight), reps: String(s.reps) })),
          };
        }
        const existing = prev.exercises.find((e) => e.name.toLowerCase() === p.name.toLowerCase());
        if (existing) return existing;
        const prevPerf = previousMap.get(p.name.toLowerCase());
        return {
          name: p.name,
          sets: Array.from({ length: p.targetSets }, (_, i) => {
            const ps = prevPerf?.[i] ?? prevPerf?.[prevPerf.length - 1];
            return { weight: ps ? String(ps.weight) : '', reps: '' };
          }),
        };
      });

      for (const extra of extras) {
        baseRows.push({
          name: extra.name,
          sets: extra.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps) })),
        });
      }

      return {
        ...prev,
        notes: prev.notes || parsedTextPreview.detectedNotes || '',
        textMode: false,
        exercises: baseRows,
      };
    });
    onNotify(`Перенесено в таблицу: ${parsedTextPreview.exercises.length} упр.`);
  };

  const handleSave = () => {
    let exercises: ExerciseEntry[];
    let finalNotes = draft.notes.trim();

    if (draft.textMode) {
      exercises = parsedTextPreview.exercises.map(({ name, sets }) => ({ name, sets }));
      if (!finalNotes && parsedTextPreview.detectedNotes) {
        finalNotes = parsedTextPreview.detectedNotes;
      }
    } else {
      exercises = draft.exercises
        .map((ex) => ({
          name: ex.name.trim(),
          sets: parseDraftSets(ex.sets),
        }))
        .filter((ex) => ex.name.length > 0 && ex.sets.length > 0);
    }

    if (exercises.length === 0) {
      onNotify('Введите хотя бы одно упражнение с количеством повторений.');
      return;
    }

    setIsSavingAnim(true);
    window.setTimeout(() => setIsSavingAnim(false), 320);

    onSave({
      id: generateId(),
      date: draft.date || getTodayISO(),
      createdAt: Date.now(),
      exercises,
      notes: finalNotes || undefined,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Новая запись тренировки
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {program.length > 0
              ? `Активная программа · ${program.length} упр.`
              : 'Свободная запись · выберите или создайте программу в «Программа / JSON»'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChangeDraft((prev) => ({ ...prev, date: e.target.value }))}
            aria-label="Дата тренировки"
            className="h-9 px-3 rounded-xl bg-[#111827] border border-white/10 text-xs font-medium text-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition"
          />

          <div className="inline-flex rounded-xl bg-[#111827] border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => onChangeDraft((prev) => ({ ...prev, textMode: false }))}
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                !draft.textMode
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Таблица</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeDraft((prev) => ({ ...prev, textMode: true }))}
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                draft.textMode
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Быстрый текстовый ввод</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Desktop Layout (70% / 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-5 items-start">
        {/* ─── Left Column: Workout Cards / Quick Text ─── */}
        <div className="space-y-3.5 min-w-0">
          {/* Notes + Quick tools */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={draft.notes}
              onChange={(e) => onChangeDraft((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Заметка к тренировке (самочувствие, нюансы — необязательно)..."
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#111827] border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:bg-[#0b0f19] focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30 transition"
            />

            {!draft.textMode && (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {entries.length > 0 && draft.exercises.length > 0 && (
                  <button
                    type="button"
                    onClick={handleFillAllFromPrevious}
                    title="Заполнить пустые упражнения результатами прошлой тренировки"
                    className="h-10 px-3 rounded-xl bg-[#111827] hover:bg-[#172033] border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Как в прошлый раз</span>
                    <span className="sm:hidden">Прошлая</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearTable}
                  title="Очистить введённые повторения"
                  className="h-10 px-3 rounded-xl bg-[#111827] hover:bg-[#172033] border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Очистить</span>
                </button>
                {programDiffersFromDefault && (
                  <button
                    type="button"
                    onClick={onLoadDefaultProgram}
                    className="h-10 px-3 rounded-xl bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-400/35 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Загрузить мою программу</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {draft.textMode ? (
            /* ─── Quick Text Input Mode ─── */
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#111827] border border-white/10 p-4 sm:p-5 space-y-3 shadow-lg shadow-black/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Вставьте или введите тренировку текстом (1 упражнение = 1 строка):
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {program.length > 0 && (
                      <button
                        type="button"
                        onClick={handleInsertTextTemplate}
                        className="h-7 px-2.5 rounded-lg bg-[#0b0f19] hover:bg-slate-800 border border-white/10 text-[11px] font-semibold text-slate-300 transition"
                      >
                        Вставить шаблон ({program.length} упр.)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyTableToText}
                      className="h-7 px-2.5 rounded-lg bg-[#0b0f19] hover:bg-slate-800 border border-white/10 text-[11px] font-semibold text-slate-300 transition"
                    >
                      Из таблицы
                    </button>
                    {draft.rawText && (
                      <button
                        type="button"
                        onClick={() => onChangeDraft((prev) => ({ ...prev, rawText: '' }))}
                        className="h-7 px-2 rounded-lg bg-[#0b0f19] hover:bg-slate-800 border border-white/10 text-[11px] text-slate-400 hover:text-rose-300 transition"
                      >
                        Очистить
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={draft.rawText}
                  onChange={(e) => onChangeDraft((prev) => ({ ...prev, rawText: e.target.value }))}
                  rows={13}
                  placeholder={`Тяга вертикального блока: 60x10, 60x9, 60x8\nЖим гантелей на наклонной скамье: 20x10, 20x9\nТяга в рычажном хаммере: 50x12, 50x10, 50x10\nСкручивания: 15, 15, 15\n...`}
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30 font-mono leading-relaxed resize-y min-h-[180px] transition"
                />

                <p className="text-[11px] text-slate-500">
                  Поддерживаются разделители <code className="text-slate-400">:</code>,{' '}
                  <code className="text-slate-400">—</code>, <code className="text-slate-400"> - </code> и записи{' '}
                  <code className="text-slate-400">60x10</code>, <code className="text-slate-400">60×10</code>,{' '}
                  <code className="text-slate-400">60*10</code> (для упражнений без веса можно писать просто{' '}
                  <code className="text-slate-400">15, 15, 14</code>).
                </p>
              </div>

              {(parsedTextPreview.exercises.length > 0 || parsedTextPreview.unparsedLines.length > 0) && (
                <div className="rounded-2xl bg-[#111827] border border-white/10 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        Распознано упражнений: {parsedTextPreview.exercises.length}
                      </span>
                    </div>
                    {parsedTextPreview.exercises.length > 0 && (
                      <button
                        type="button"
                        onClick={handleApplyTextToTable}
                        className="h-7 px-2.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-400/35 text-[11px] font-semibold text-blue-300 flex items-center gap-1 transition"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        Открыть в таблице
                      </button>
                    )}
                  </div>

                  {parsedTextPreview.exercises.length > 0 && (
                    <div className="divide-y divide-white/5 rounded-xl bg-[#0b0f19] border border-white/10">
                      {parsedTextPreview.exercises.map((ex, i) => {
                        const prog = programMap.get(ex.name.toLowerCase());
                        const dp = checkDoubleProgression(ex.sets, prog);
                        return (
                          <div
                            key={`${ex.name}-${i}`}
                            className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-slate-200 font-medium">{ex.name}</span>
                              {ex.matchedFrom && (
                                <span className="text-[10px] text-slate-500">
                                  (из «{ex.matchedFrom}»)
                                </span>
                              )}
                              {dp.shouldIncrease && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">
                                  + Вес
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-slate-200 tabular-nums">
                              {formatSetsCompact(ex.sets)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {parsedTextPreview.unparsedLines.length > 0 && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Не распознаны строки ({parsedTextPreview.unparsedLines.length}):</span>
                      </div>
                      <ul className="text-[11px] text-amber-200/80 font-mono space-y-0.5 pl-5 list-disc">
                        {parsedTextPreview.unparsedLines.map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ─── Card-per-exercise list ─── */
            <div className="flex flex-col gap-3">
              {draft.exercises.length === 0 ? (
                <div className="rounded-2xl bg-[#111827] border border-dashed border-white/15 p-8 text-center space-y-3">
                  <Dumbbell className="w-7 h-7 text-slate-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-200">
                      Список упражнений пока пуст
                    </p>
                    <p className="text-xs text-slate-400">
                      Добавьте упражнения вручную, создайте программу в разделе «Программа / JSON» или загрузите базовую.
                    </p>
                  </div>
                </div>
              ) : (
                draft.exercises.map((ex, exIdx) => {
                  const prog = programMap.get(ex.name.trim().toLowerCase());
                  const prev = previousMap.get(ex.name.trim().toLowerCase());
                  const isProgramExercise = Boolean(prog);

                  const currentSets = parseDraftSets(ex.sets);
                  const dp = checkDoubleProgression(currentSets, prog);
                  const dpPrev = prev ? checkDoubleProgression(prev, prog) : null;

                  const prevMaxW = prev ? Math.max(...prev.map((s) => s.weight)) : 0;
                  const currMaxW = currentSets.length > 0 ? Math.max(...currentSets.map((s) => s.weight)) : 0;
                  const alreadyRaisedWeight =
                    prev !== undefined && currentSets.length > 0 && currMaxW > prevMaxW;

                  const showBadge =
                    dp.shouldIncrease || Boolean(dpPrev?.shouldIncrease && !alreadyRaisedWeight);
                  const badgeTitle = dp.shouldIncrease
                    ? `${dp.reason}. Нажми, чтобы прибавить +${weightStep} кг`
                    : `Прошлая тренировка: ${dpPrev?.reason ?? ''}. Нажми, чтобы прибавить +${weightStep} кг`;

                  const hasAnyFilled = currentSets.length > 0;

                  return (
                    <div
                      key={`${exIdx}-${isProgramExercise ? ex.name : 'custom'}`}
                      className={`rounded-2xl border p-4 transition-all duration-200 ${
                        showBadge
                          ? 'bg-gradient-to-br from-emerald-500/[0.08] via-[#111827] to-[#111827] border-emerald-400/35 hover:border-emerald-400/55 shadow-lg shadow-emerald-950/20'
                          : hasAnyFilled
                          ? 'bg-[#111827] border-blue-400/30 hover:border-blue-400/45 shadow-md shadow-black/20'
                          : 'bg-[#111827] border-white/10 hover:border-white/20 hover:bg-[#141c2e]'
                      }`}
                    >
                      {/* Top row: Exercise title + colored pill below + Previous badge on right */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <span className="mt-1 text-[11px] font-mono font-semibold text-slate-500 select-none shrink-0">
                              {String(exIdx + 1).padStart(2, '0')}
                            </span>

                            {isProgramExercise ? (
                              <h3 className="text-base font-semibold text-white leading-snug tracking-tight">
                                {ex.name}
                              </h3>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-1">
                                <input
                                  type="text"
                                  value={ex.name}
                                  onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                                  placeholder="Название упражнения..."
                                  className="flex-1 h-9 px-3 rounded-xl bg-[#0b0f19] border border-white/10 text-sm font-semibold text-white placeholder:text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomExercise(exIdx)}
                                  title="Удалить упражнение из записи"
                                  className="w-8 h-8 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Colored pills cleanly below the name */}
                          {(prog || showBadge) && (
                            <div className="mt-2 pl-6 flex flex-wrap items-center gap-1.5">
                              {prog && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-500/12 border border-blue-400/25 text-[11px] font-semibold text-blue-300 tabular-nums">
                                  {prog.targetSets} × {prog.targetRepMin}-{prog.targetRepMax} повт.
                                </span>
                              )}
                              {showBadge && (
                                <button
                                  type="button"
                                  onClick={() => bumpRowWeight(exIdx)}
                                  title={badgeTitle}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-[11px] font-bold text-emerald-300 shadow-sm shadow-emerald-500/10 active:scale-95 transition"
                                >
                                  <TrendingUp className="w-3 h-3" />
                                  <span>+ Вес (+{weightStep} кг)</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right: Previous workout badge */}
                        <div className="pl-6 sm:pl-0 shrink-0">
                          {prev ? (
                            <button
                              type="button"
                              onClick={() => applyPreviousToRow(exIdx, prev)}
                              title="Нажми, чтобы подставить прошлый результат в эту карточку"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0b0f19] hover:bg-[#0e1525] border border-white/10 hover:border-white/25 text-[11px] transition group"
                            >
                              <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition shrink-0" />
                              <span className="text-slate-400">Прошлая:</span>
                              <span className="font-mono font-semibold text-slate-200 tabular-nums">
                                {formatSetsCompact(prev)}
                              </span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0b0f19]/60 border border-white/5 text-[11px] text-slate-500">
                              <History className="w-3 h-3 text-slate-600 shrink-0" />
                              <span>Нет прошлых</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom row: Set cells [Weight] × [Reps] + Add Set */}
                      <div className="mt-3.5 pl-0 sm:pl-6 flex flex-wrap items-center gap-2">
                        {ex.sets.map((s, sIdx) => {
                          const prevSet = prev?.[sIdx] ?? prev?.[prev.length - 1];
                          const repsPlaceholder = prevSet
                            ? String(prevSet.reps)
                            : prog
                            ? `${prog.targetRepMin}-${prog.targetRepMax}`
                            : 'повт';
                          const hasReps = (parseInt(s.reps.trim(), 10) || 0) > 0;

                          const cellClasses = hasReps
                            ? showBadge
                              ? 'bg-emerald-500/[0.12] border-emerald-400/50 focus-within:ring-2 focus-within:ring-emerald-400/45 focus-within:border-emerald-400'
                              : 'bg-blue-500/[0.12] border-blue-400/50 focus-within:ring-2 focus-within:ring-blue-400/45 focus-within:border-blue-400'
                            : showBadge
                            ? 'bg-[#0b0f19] border-white/10 hover:border-emerald-400/35 focus-within:ring-2 focus-within:ring-emerald-400/40 focus-within:border-emerald-400'
                            : 'bg-[#0b0f19] border-white/10 hover:border-white/20 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-400';

                          return (
                            <div key={sIdx} className="flex items-center group animate-set-pop">
                              <div
                                className={`flex items-center h-10 rounded-xl border transition-all duration-150 ${cellClasses}`}
                              >
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={s.weight}
                                  onChange={(e) => updateSet(exIdx, sIdx, 'weight', e.target.value)}
                                  placeholder={prevSet ? String(prevSet.weight) : 'кг'}
                                  aria-label={`${ex.name || 'Упражнение'}, подход ${sIdx + 1}, вес`}
                                  className="w-[56px] h-full px-1.5 bg-transparent text-center text-sm font-bold text-white outline-none tabular-nums placeholder:text-slate-600"
                                />
                                <span className="text-xs font-semibold text-slate-500 select-none">
                                  ×
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={s.reps}
                                  onChange={(e) => updateSet(exIdx, sIdx, 'reps', e.target.value)}
                                  placeholder={repsPlaceholder}
                                  aria-label={`${ex.name || 'Упражнение'}, подход ${sIdx + 1}, повторения`}
                                  className="w-[50px] h-full px-1.5 bg-transparent text-center text-sm font-bold text-white outline-none tabular-nums placeholder:text-slate-600"
                                />
                              </div>

                              {ex.sets.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSet(exIdx, sIdx)}
                                  className="ml-0.5 w-5 h-7 rounded-md text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition flex items-center justify-center"
                                  aria-label="Удалить подход"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => addSet(exIdx)}
                          title="Добавить дополнительный подход"
                          aria-label="Добавить подход"
                          className="h-10 w-10 rounded-xl bg-[#0b0f19] border border-dashed border-white/15 text-slate-400 hover:text-blue-300 hover:border-blue-400/60 hover:bg-blue-500/10 active:scale-95 flex items-center justify-center transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Add ad-hoc exercise */}
              <button
                type="button"
                onClick={addCustomExercise}
                className="w-full h-11 rounded-2xl bg-[#111827] hover:bg-[#151e30] border border-dashed border-white/15 hover:border-blue-400/40 text-xs font-semibold text-slate-300 hover:text-blue-300 inline-flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить дополнительное упражнение</span>
              </button>
            </div>
          )}

          {/* Mobile Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className={`lg:hidden w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition ${
              isSavingAnim ? 'scale-[0.98] ring-4 ring-emerald-400/30' : ''
            }`}
          >
            <Save className="w-4 h-4" />
            <span>
              Сохранить запись
              {liveSummary.filledExercises > 0 ? ` (${liveSummary.filledExercises} упр.)` : ''}
            </span>
          </button>
        </div>

        {/* ─── Right Sidebar (30%): Live Summary & Last Workout ─── */}
        <aside className="lg:sticky lg:top-20 space-y-4">
          {/* Live Current Workout Summary */}
          <div className="rounded-2xl bg-[#111827] border border-white/10 p-4 sm:p-5 space-y-4 shadow-xl shadow-black/25">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-400/25 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Сводка текущей тренировки</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                {liveSummary.filledExercises}/{liveSummary.totalTarget}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-[#0b0f19] border border-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${liveSummary.progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Выполнено упражнений: <span className="text-slate-200 font-semibold">{liveSummary.progressPct}%</span>
              </p>
            </div>

            {/* Real-time stats */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-[#0b0f19] border border-white/10 p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Подходы</span>
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <p className="text-xl font-bold text-white tabular-nums">
                  {liveSummary.completedSets}
                </p>
              </div>

              <div className="rounded-xl bg-[#0b0f19] border border-white/10 p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Тоннаж</span>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-xl font-bold text-white tabular-nums">
                  {formatNum(liveSummary.totalTonnage)}{' '}
                  <span className="text-xs font-medium text-slate-400">кг</span>
                </p>
              </div>
            </div>

            {/* Progression hint */}
            <div className="rounded-xl bg-[#0b0f19] border border-white/10 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Подсказка по прогрессии</span>
              </div>

              {liveSummary.progressionHints.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-emerald-300/90">
                    Пора поднять вес ({liveSummary.progressionHints.length} упр.):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {liveSummary.progressionHints.slice(0, 4).map((hint) => (
                      <span
                        key={hint.name}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 font-medium truncate max-w-full"
                      >
                        + {hint.name}
                      </span>
                    ))}
                    {liveSummary.progressionHints.length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                        +{liveSummary.progressionHints.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {liveSummary.completedSets > 0
                    ? 'Продолжайте добирать повторения до верхней границы диапазона.'
                    : 'Введите повторения — здесь появятся тоннаж и сигналы на повышение веса.'}
                </p>
              )}
            </div>

            {/* Desktop Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className={`hidden lg:flex w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] text-white font-semibold text-sm items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all ${
                isSavingAnim ? 'scale-[0.97] ring-4 ring-emerald-400/35' : ''
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                Сохранить запись
                {liveSummary.filledExercises > 0 ? ` (${liveSummary.filledExercises})` : ''}
              </span>
            </button>
          </div>

          {/* Last Workout Reference Mini-Card */}
          <div className="rounded-2xl bg-[#111827] border border-white/10 p-4 sm:p-5 space-y-3 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <History className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-white">Последняя тренировка</h3>
              </div>
              {lastWorkout && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0b0f19] border border-white/10 text-slate-300 tabular-nums">
                  {formatNum(Math.round(entryTonnage(lastWorkout)))} кг
                </span>
              )}
            </div>

            {lastWorkout ? (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-400 capitalize flex items-center justify-between">
                  <span>{formatFullDate(lastWorkout.date)}</span>
                  <span className="text-[11px] text-slate-500">
                    {lastWorkout.exercises.length} упр.
                  </span>
                </div>

                {lastWorkout.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-[#0b0f19] border border-white/5 rounded-lg px-2.5 py-1.5">
                    📝 {lastWorkout.notes}
                  </p>
                )}

                <div className="space-y-1.5 rounded-xl bg-[#0b0f19] border border-white/10 p-3">
                  {lastWorkout.exercises.slice(0, 6).map((ex, i) => (
                    <div
                      key={`${ex.name}-${i}`}
                      className="flex items-baseline justify-between gap-2 text-[11px] leading-snug"
                    >
                      <span className="text-slate-300 truncate">{ex.name}</span>
                      <span className="font-mono text-slate-400 shrink-0 tabular-nums">
                        {formatSetsCompact(ex.sets)}
                      </span>
                    </div>
                  ))}
                  {lastWorkout.exercises.length > 6 && (
                    <p className="text-[10px] text-slate-500 pt-0.5">
                      + ещё {lastWorkout.exercises.length - 6} упр. в журнале
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">
                Сохранённых тренировок пока нет. После первой записи здесь появится быстрый ориентир.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
