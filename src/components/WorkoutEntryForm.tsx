import {
  AlertCircle,
  AlignLeft,
  ArrowRightLeft,
  Check,
  Eraser,
  FileText,
  History,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
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
  findPreviousPerformance,
  formatSetsCompact,
  generateId,
  getTodayISO,
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
      return { exercises: [] as Array<ExerciseEntry & { matchedFrom?: string }>, unparsedLines: [] as string[], detectedNotes: undefined as string | undefined };
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

  const filledTableExercisesCount = useMemo(() => {
    return draft.exercises.filter((ex) => ex.name.trim().length > 0 && parseDraftSets(ex.sets).length > 0).length;
  }, [draft.exercises]);

  const activeExercisesCount = draft.textMode
    ? parsedTextPreview.exercises.length
    : filledTableExercisesCount;

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
        // Only fill rows that don't have entered reps yet
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

    onSave({
      id: generateId(),
      date: draft.date || getTodayISO(),
      createdAt: Date.now(),
      exercises,
      notes: finalNotes || undefined,
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Новая запись тренировки</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-Body · {program.length} упр. · Введите повторения или переключитесь на текстовый ввод
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChangeDraft((prev) => ({ ...prev, date: e.target.value }))}
            aria-label="Дата тренировки"
            className="h-9 px-3 rounded-xl bg-[#141822] border border-slate-800 text-xs font-medium text-slate-200 outline-none focus:border-blue-500"
          />

          <div className="inline-flex rounded-xl bg-[#141822] border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => onChangeDraft((prev) => ({ ...prev, textMode: false }))}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                !draft.textMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Таблица</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeDraft((prev) => ({ ...prev, textMode: true }))}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                draft.textMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Быстрый текстовый ввод</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notes + Quick tools */}
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={draft.notes}
          onChange={(e) => onChangeDraft((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Заметка к тренировке (самочувствие, нюансы — необязательно)..."
          className="flex-1 h-9 px-3.5 rounded-xl bg-[#141822] border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500/60"
        />

        {!draft.textMode && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="h-9 px-2.5 rounded-xl bg-[#141822] border border-slate-800/80 text-[11px] font-semibold text-slate-400 flex items-center tabular-nums">
              Заполнено: <span className="text-slate-200 ml-1">{filledTableExercisesCount}</span>/{draft.exercises.length}
            </span>
            {entries.length > 0 && (
              <button
                type="button"
                onClick={handleFillAllFromPrevious}
                title="Заполнить пустые упражнения результатами прошлой тренировки"
                className="h-9 px-2.5 rounded-xl bg-[#141822] hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 transition"
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
              className="h-9 px-2.5 rounded-xl bg-[#141822] hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Очистить</span>
            </button>
            {programDiffersFromDefault && (
              <button
                type="button"
                onClick={onLoadDefaultProgram}
                className="h-9 px-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/35 text-[11px] font-semibold text-emerald-300 flex items-center gap-1 transition"
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
          <div className="rounded-2xl bg-[#141822] border border-slate-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300">
                Вставьте или введите тренировку текстом (1 упражнение = 1 строка):
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleInsertTextTemplate}
                  className="h-7 px-2.5 rounded-lg bg-[#0b0e14] hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-300 transition"
                >
                  Вставить шаблон (13 упр.)
                </button>
                <button
                  type="button"
                  onClick={handleCopyTableToText}
                  className="h-7 px-2.5 rounded-lg bg-[#0b0e14] hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-300 transition"
                >
                  Из таблицы
                </button>
                {draft.rawText && (
                  <button
                    type="button"
                    onClick={() => onChangeDraft((prev) => ({ ...prev, rawText: '' }))}
                    className="h-7 px-2 rounded-lg bg-[#0b0e14] hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-rose-300 transition"
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
              className="w-full bg-[#0b0e14] border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/60 font-mono leading-relaxed resize-y min-h-[160px]"
            />

            <p className="text-[11px] text-slate-500">
              Поддерживаются разделители <code className="text-slate-400">:</code>,{' '}
              <code className="text-slate-400">—</code>, <code className="text-slate-400"> - </code> и записи{' '}
              <code className="text-slate-400">60x10</code>, <code className="text-slate-400">60×10</code>,{' '}
              <code className="text-slate-400">60*10</code> (для упражнений без веса можно писать просто{' '}
              <code className="text-slate-400">15, 15, 14</code>).
            </p>
          </div>

          {/* Live parse preview */}
          {(parsedTextPreview.exercises.length > 0 || parsedTextPreview.unparsedLines.length > 0) && (
            <div className="rounded-2xl bg-[#141822] border border-slate-800/90 p-4 space-y-3">
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
                    className="h-7 px-2.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/35 text-[11px] font-semibold text-blue-300 flex items-center gap-1 transition"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Открыть в таблице
                  </button>
                )}
              </div>

              {parsedTextPreview.exercises.length > 0 && (
                <div className="divide-y divide-slate-800/70 rounded-xl bg-[#0b0e14] border border-slate-800/80">
                  {parsedTextPreview.exercises.map((ex, i) => {
                    const prog = programMap.get(ex.name.toLowerCase());
                    const dp = checkDoubleProgression(ex.sets, prog);
                    return (
                      <div key={`${ex.name}-${i}`} className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-200 font-medium">{ex.name}</span>
                          {ex.matchedFrom && (
                            <span className="text-[10px] text-slate-500">
                              (из «{ex.matchedFrom}»)
                            </span>
                          )}
                          {dp.shouldIncrease && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                              + Вес
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-300 tabular-nums">
                          {formatSetsCompact(ex.sets)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {parsedTextPreview.unparsedLines.length > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-1">
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
        /* ─── Table / Compact Notebook Mode ─── */
        <div className="rounded-2xl bg-[#141822] border border-slate-800/90 divide-y divide-slate-800/70 overflow-hidden">
          {draft.exercises.map((ex, exIdx) => {
            const prog = programMap.get(ex.name.trim().toLowerCase());
            const prev = previousMap.get(ex.name.trim().toLowerCase());
            const isProgramExercise = Boolean(prog);

            const currentSets = parseDraftSets(ex.sets);
            const dp = checkDoubleProgression(currentSets, prog);
            const dpPrev = prev ? checkDoubleProgression(prev, prog) : null;

            const prevMaxW = prev ? Math.max(...prev.map((s) => s.weight)) : 0;
            const currMaxW = currentSets.length > 0 ? Math.max(...currentSets.map((s) => s.weight)) : 0;
            const alreadyRaisedWeight = prev !== undefined && currentSets.length > 0 && currMaxW > prevMaxW;

            const showBadge = dp.shouldIncrease || Boolean(dpPrev?.shouldIncrease && !alreadyRaisedWeight);
            const badgeTitle = dp.shouldIncrease
              ? `${dp.reason}. Нажми, чтобы прибавить +${weightStep} кг`
              : `Прошлая тренировка: ${dpPrev?.reason ?? ''}. Нажми, чтобы прибавить +${weightStep} кг`;

            return (
              <div
                key={`${exIdx}-${isProgramExercise ? ex.name : 'custom'}`}
                className={`px-3 sm:px-4 py-2.5 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 transition-colors ${
                  showBadge ? 'bg-emerald-500/[0.06]' : 'hover:bg-slate-800/20'
                }`}
              >
                {/* Left: Index + Name + Target Range + Badge */}
                <div className="lg:w-[290px] shrink-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[11px] font-mono text-slate-600 w-5 text-right select-none shrink-0">
                    {exIdx + 1}.
                  </span>

                  {isProgramExercise ? (
                    <span className="text-[13px] sm:text-sm font-semibold text-white leading-snug">
                      {ex.name}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 flex-1 min-w-[160px]">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                        placeholder="Название упражнения..."
                        className="flex-1 h-7 px-2 rounded-lg bg-[#0b0e14] border border-slate-700/80 text-xs font-semibold text-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomExercise(exIdx)}
                        title="Удалить упражнение из записи"
                        className="w-6 h-6 rounded text-slate-500 hover:text-rose-400 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {prog && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#0b0e14] border border-slate-800 text-slate-400 tabular-nums shrink-0">
                      {prog.targetSets}×{prog.targetRepMin}-{prog.targetRepMax}
                    </span>
                  )}

                  {showBadge && (
                    <button
                      type="button"
                      onClick={() => bumpRowWeight(exIdx)}
                      title={badgeTitle}
                      className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/45 text-emerald-300 font-bold inline-flex items-center gap-1 transition shrink-0"
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>+ Вес</span>
                    </button>
                  )}
                </div>

                {/* Middle: Compact [Weight] × [Reps] cells + Add Set */}
                <div className="flex-1 flex flex-wrap items-center gap-1.5 pl-7 lg:pl-0">
                  {ex.sets.map((s, sIdx) => {
                    const prevSet = prev?.[sIdx] ?? prev?.[prev.length - 1];
                    const repsPlaceholder = prevSet
                      ? String(prevSet.reps)
                      : prog
                      ? `${prog.targetRepMin}-${prog.targetRepMax}`
                      : 'повт';
                    const hasReps = (parseInt(s.reps.trim(), 10) || 0) > 0;

                    return (
                      <div key={sIdx} className="flex items-center group">
                        <div
                          className={`flex items-center rounded-lg border transition-colors ${
                            hasReps
                              ? 'bg-[#0b0e14] border-blue-500/45'
                              : 'bg-[#0b0e14] border-slate-700/75'
                          } focus-within:border-blue-500`}
                        >
                          <input
                            type="text"
                            inputMode="decimal"
                            value={s.weight}
                            onChange={(e) => updateSet(exIdx, sIdx, 'weight', e.target.value)}
                            placeholder={prevSet ? String(prevSet.weight) : 'кг'}
                            aria-label={`${ex.name || 'Упражнение'}, подход ${sIdx + 1}, вес`}
                            className="w-[48px] h-8 px-1 bg-transparent text-center text-xs font-semibold text-white outline-none tabular-nums placeholder:text-slate-600"
                          />
                          <span className="text-[10px] text-slate-500 select-none">×</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={s.reps}
                            onChange={(e) => updateSet(exIdx, sIdx, 'reps', e.target.value)}
                            placeholder={repsPlaceholder}
                            aria-label={`${ex.name || 'Упражнение'}, подход ${sIdx + 1}, повторения`}
                            className="w-[42px] h-8 px-1 bg-transparent text-center text-xs font-semibold text-white outline-none tabular-nums placeholder:text-slate-600"
                          />
                        </div>
                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSet(exIdx, sIdx)}
                            className="ml-0.5 w-4 h-6 rounded text-slate-600 hover:text-rose-400 opacity-50 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center"
                            aria-label="Удалить подход"
                          >
                            <X className="w-3 h-3" />
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
                    className="w-8 h-8 rounded-lg bg-[#0b0e14] border border-dashed border-slate-700/90 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 flex items-center justify-center transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Right: Previous workout record */}
                <div className="lg:w-[215px] lg:text-right shrink-0 pl-7 lg:pl-0">
                  {prev ? (
                    <button
                      type="button"
                      onClick={() => applyPreviousToRow(exIdx, prev)}
                      title="Нажми, чтобы подставить прошлый результат в эту строку"
                      className="text-[11px] text-slate-500 hover:text-slate-300 transition text-left lg:text-right leading-snug"
                    >
                      Прошлая:{' '}
                      <span className="text-slate-400 font-medium tabular-nums">
                        {formatSetsCompact(prev)}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-600">Прошлая: —</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add ad-hoc exercise */}
          <div className="px-3 sm:px-4 py-2 bg-[#111520]">
            <button
              type="button"
              onClick={addCustomExercise}
              className="text-xs font-semibold text-slate-400 hover:text-blue-400 inline-flex items-center gap-1.5 py-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить дополнительное упражнение</span>
            </button>
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition"
      >
        <Save className="w-4 h-4" />
        <span>
          Сохранить запись{activeExercisesCount > 0 ? ` (${activeExercisesCount} упр.)` : ''}
        </span>
      </button>
    </div>
  );
}
