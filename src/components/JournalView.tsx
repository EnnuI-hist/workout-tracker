import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Edit3,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ExerciseEntry, ProgramExercise, WorkoutEntry } from '../types/workout.ts';
import {
  checkDoubleProgression,
  entryTonnage,
  formatEntryAsText,
  formatFullDate,
  formatNum,
  formatSetsCompact,
  sortEntriesNewestFirst,
} from '../utils/calculations.ts';

interface JournalViewProps {
  entries: WorkoutEntry[];
  program: ProgramExercise[];
  onUpdateEntry: (entry: WorkoutEntry) => void;
  onDeleteEntry: (id: string) => void;
  onNotify: (message: string) => void;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function JournalView({
  entries,
  program,
  onUpdateEntry,
  onDeleteEntry,
  onNotify,
}: JournalViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<WorkoutEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const programMap = useMemo(() => {
    const map = new Map<string, ProgramExercise>();
    for (const p of program) map.set(p.name.toLowerCase(), p);
    return map;
  }, [program]);

  const sorted = useMemo(() => sortEntriesNewestFirst(entries), [entries]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (entry) =>
        entry.date.includes(q) ||
        formatFullDate(entry.date).toLowerCase().includes(q) ||
        (entry.notes && entry.notes.toLowerCase().includes(q)) ||
        entry.exercises.some((ex) => ex.name.toLowerCase().includes(q))
    );
  }, [sorted, searchQuery]);

  const handleCopy = async (entry: WorkoutEntry) => {
    const text = formatEntryAsText(entry);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedId(entry.id);
      onNotify('Запись скопирована в буфер обмена.');
      window.setTimeout(() => setCopiedId((prev) => (prev === entry.id ? null : prev)), 2000);
    } else {
      onNotify('Не удалось скопировать текст.');
    }
  };

  const handleSaveEdit = (cleaned: WorkoutEntry) => {
    onUpdateEntry(cleaned);
    setEditingEntry(null);
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-[#141822] border border-dashed border-slate-800 p-10 text-center space-y-2">
        <p className="text-sm font-medium text-slate-300">Журнал записей пуст.</p>
        <p className="text-xs text-slate-500">
          Перейдите во вкладку «Запись» и сохраните первую тренировку.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Журнал записей</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {sorted.length} трен. в ленте · формат заметок
          </p>
        </div>

        {sorted.length > 2 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по дате, упражнению..."
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#141822] border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500/60"
            />
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#141822] border border-slate-800 p-8 text-center text-xs text-slate-400">
          Ничего не найдено по запросу «{searchQuery}».
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              programMap={programMap}
              isCopied={copiedId === entry.id}
              isConfirmDelete={confirmDeleteId === entry.id}
              onCopy={() => handleCopy(entry)}
              onEdit={() =>
                setEditingEntry({
                  ...entry,
                  exercises: entry.exercises.map((ex) => ({
                    ...ex,
                    sets: ex.sets.map((s) => ({ ...s })),
                  })),
                })
              }
              onDelete={() => setConfirmDeleteId(entry.id)}
              onConfirmDelete={() => {
                onDeleteEntry(entry.id);
                setConfirmDeleteId(null);
              }}
              onCancelDelete={() => setConfirmDeleteId(null)}
            />
          ))}
        </div>
      )}

      {editingEntry && (
        <EditModal
          entry={editingEntry}
          program={program}
          onSave={handleSaveEdit}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

/* ─── Single note-style entry card ─── */

function EntryCard({
  entry,
  programMap,
  isCopied,
  isConfirmDelete,
  onCopy,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  entry: WorkoutEntry;
  programMap: Map<string, ProgramExercise>;
  isCopied: boolean;
  isConfirmDelete: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const totalSets = entry.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const tonnage = Math.round(entryTonnage(entry));

  return (
    <article className="rounded-2xl bg-[#141822] border border-slate-800/90 overflow-hidden">
      {/* Note Header */}
      <div className="px-4 py-3 bg-[#111520] border-b border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white capitalize">
              {formatFullDate(entry.date)}
            </h3>
            <span className="text-[11px] text-slate-400 tabular-nums">
              {entry.exercises.length} упр. · {totalSets} подх.
              {tonnage > 0 ? ` · ${formatNum(tonnage)} кг` : ''}
            </span>
          </div>
          {entry.notes && (
            <p className="text-xs text-slate-400 italic">📝 {entry.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onCopy}
            title="Скопировать запись текстом"
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              isCopied
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                : 'bg-[#0b0e14] hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isCopied ? 'Скопировано' : 'Скопировать запись текстом'}
            </span>
            <span className="sm:hidden">{isCopied ? 'Готово' : 'Копия'}</span>
          </button>

          <button
            type="button"
            onClick={onEdit}
            title="Редактировать запись"
            aria-label="Редактировать запись"
            className="w-8 h-8 rounded-lg bg-[#0b0e14] hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {isConfirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/35 rounded-lg px-2 h-8">
              <button
                type="button"
                onClick={onConfirmDelete}
                className="text-[11px] font-semibold text-rose-300 px-1 hover:text-rose-200"
              >
                Удалить
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="text-[11px] text-slate-400 px-1 hover:text-white"
              >
                Нет
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              title="Удалить запись"
              aria-label="Удалить запись"
              className="w-8 h-8 rounded-lg bg-[#0b0e14] hover:bg-rose-500/10 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Развернуть' : 'Свернуть'}
            aria-label={collapsed ? 'Развернуть запись' : 'Свернуть запись'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 transition"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Note Body — full exercise list in clean note lines */}
      {!collapsed && (
        <div className="px-4 py-3 space-y-1 font-sans">
          {entry.exercises.map((ex, i) => {
            const prog = programMap.get(ex.name.trim().toLowerCase());
            const dp = checkDoubleProgression(ex.sets, prog);
            return (
              <div
                key={`${ex.name}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-0.5 text-xs sm:text-[13px] border-b border-slate-800/35 last:border-b-0"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-slate-300 font-medium">{ex.name}</span>
                  {dp.shouldIncrease && (
                    <span className="text-[10px] px-1.5 py-0 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-bold">
                      + Вес
                    </span>
                  )}
                </div>
                <span className="tabular-nums font-mono text-slate-200">
                  {formatSetsCompact(ex.sets)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

/* ─── Edit modal with string-backed set inputs ─── */

interface EditableSet {
  weight: string;
  reps: string;
}

interface EditableExercise {
  name: string;
  sets: EditableSet[];
}

function EditModal({
  entry,
  program,
  onSave,
  onClose,
}: {
  entry: WorkoutEntry;
  program: ProgramExercise[];
  onSave: (cleaned: WorkoutEntry) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(entry.date);
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [exercises, setExercises] = useState<EditableExercise[]>(() =>
    entry.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps) })),
    }))
  );

  const updateExSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)),
            }
          : ex
      )
    );
  };

  const addExSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { weight: last?.weight ?? '0', reps: last?.reps ?? '' }],
        };
      })
    );
  };

  const removeExSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx && ex.sets.length > 1
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex
      )
    );
  };

  const removeExercise = (exIdx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));
  };

  const addExercise = () => {
    setExercises((prev) => [
      ...prev,
      {
        name: '',
        sets: [{ weight: '0', reps: '' }],
      },
    ]);
  };

  const handleSave = () => {
    const cleanedExercises: ExerciseEntry[] = exercises
      .map((ex) => ({
        name: ex.name.trim(),
        sets: ex.sets
          .map((s) => {
            const reps = parseInt(s.reps.trim(), 10);
            const rawW = s.weight.trim().replace(',', '.');
            const weight = rawW === '' ? 0 : parseFloat(rawW);
            return {
              weight: Number.isNaN(weight) || weight < 0 ? 0 : Math.round(weight * 100) / 100,
              reps: Number.isNaN(reps) || reps < 0 ? 0 : reps,
            };
          })
          .filter((s) => s.reps > 0),
      }))
      .filter((ex) => ex.name.length > 0 && ex.sets.length > 0);

    if (cleanedExercises.length === 0) return;

    onSave({
      ...entry,
      date: date || entry.date,
      notes: notes.trim() || undefined,
      exercises: cleanedExercises,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl bg-[#141822] border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Редактировать запись</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <datalist id="edit-program-exercises">
          {program.map((p) => (
            <option key={p.name} value={p.name} />
          ))}
        </datalist>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Дата</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 px-3 rounded-xl bg-[#0b0e14] border border-slate-700/80 text-sm text-white outline-none focus:border-blue-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Заметка</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Необязательно..."
                className="h-10 px-3 rounded-xl bg-[#0b0e14] border border-slate-700/80 text-sm text-white outline-none focus:border-blue-500"
              />
            </label>
          </div>

          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="rounded-xl bg-[#0e121b] border border-slate-800 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  list="edit-program-exercises"
                  value={ex.name}
                  placeholder="Выберите или введите упражнение..."
                  onChange={(e) =>
                    setExercises((prev) =>
                      prev.map((ex2, i) => (i === exIdx ? { ...ex2, name: e.target.value } : ex2))
                    )
                  }
                  className="flex-1 bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeExercise(exIdx)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {ex.sets.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-0 group">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s.weight}
                      onChange={(e) => updateExSet(exIdx, sIdx, 'weight', e.target.value)}
                      placeholder="0"
                      className="w-[50px] h-8 px-1.5 rounded-l-lg bg-[#141822] border border-slate-700/80 border-r-0 text-center text-xs font-semibold text-white outline-none focus:border-blue-500 tabular-nums"
                    />
                    <span className="h-8 flex items-center px-0.5 bg-[#141822] border-y border-slate-700/80 text-[10px] text-slate-500">
                      ×
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={s.reps}
                      onChange={(e) => updateExSet(exIdx, sIdx, 'reps', e.target.value)}
                      placeholder="повт"
                      className="w-[42px] h-8 px-1.5 rounded-r-lg bg-[#141822] border border-slate-700/80 border-l-0 text-center text-xs font-semibold text-white outline-none focus:border-blue-500 tabular-nums"
                    />
                    {ex.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExSet(exIdx, sIdx)}
                        className="ml-0.5 w-5 h-5 rounded text-slate-600 hover:text-rose-400 opacity-50 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addExSet(exIdx)}
                  className="w-7 h-7 rounded-lg bg-[#141822] border border-dashed border-slate-700 text-slate-400 hover:text-blue-400 flex items-center justify-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addExercise}
            className="w-full h-10 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Добавить упражнение
          </button>
        </div>

        <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
