import { Dumbbell, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MuscleGroup, WorkoutSession } from '../types/workout.ts';
import { COMMON_EXERCISES, MUSCLE_GROUPS } from '../utils/calculations.ts';

export interface PickedExerciseConfig {
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
}

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (config: PickedExerciseConfig) => void;
  sessions: WorkoutSession[];
  title?: string;
}

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
  sessions,
  title = 'Добавить упражнение',
}: ExercisePickerModalProps) {
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'Все'>('Все');
  const [customGroup, setCustomGroup] = useState<MuscleGroup>('Грудь');
  const [targetSets, setTargetSets] = useState(3);
  const [targetRepMin, setTargetRepMin] = useState(8);
  const [targetRepMax, setTargetRepMax] = useState(12);

  const catalog = useMemo(() => {
    const map = new Map<string, { name: string; muscleGroup: MuscleGroup }>();
    for (const item of COMMON_EXERCISES) {
      map.set(item.name.toLowerCase(), item);
    }
    for (const session of sessions) {
      for (const ex of session.exercises) {
        const key = ex.name.trim().toLowerCase();
        if (key && !map.has(key)) {
          map.set(key, { name: ex.name.trim(), muscleGroup: ex.muscleGroup });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      const matchesGroup = selectedGroup === 'Все' || item.muscleGroup === selectedGroup;
      const matchesQuery = !q || item.name.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [catalog, query, selectedGroup]);

  const exactExists = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return catalog.some((item) => item.name.toLowerCase() === q);
  }, [catalog, query]);

  if (!isOpen) return null;

  const handleChoose = (name: string, muscleGroup: MuscleGroup) => {
    const safeMin = Math.max(1, Math.min(targetRepMin, targetRepMax));
    const safeMax = Math.max(safeMin, targetRepMax);
    onSelect({
      name: name.trim(),
      muscleGroup,
      targetSets: Math.max(1, targetSets),
      targetRepMin: safeMin,
      targetRepMax: safeMax,
    });
    setQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#141822] border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск или название своего упражнения..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0b0e14] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <label className="flex flex-col gap-1 bg-[#0b0e14] border border-slate-800 rounded-xl px-3 py-2">
              <span className="text-slate-400">Подходов</span>
              <input
                type="number"
                min={1}
                max={12}
                value={targetSets}
                onChange={(e) => setTargetSets(Math.max(1, Number(e.target.value) || 1))}
                className="bg-transparent text-white font-semibold text-sm outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 bg-[#0b0e14] border border-slate-800 rounded-xl px-3 py-2">
              <span className="text-slate-400">От повт.</span>
              <input
                type="number"
                min={1}
                max={100}
                value={targetRepMin}
                onChange={(e) => setTargetRepMin(Math.max(1, Number(e.target.value) || 1))}
                className="bg-transparent text-white font-semibold text-sm outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 bg-[#0b0e14] border border-slate-800 rounded-xl px-3 py-2">
              <span className="text-slate-400">До повт.</span>
              <input
                type="number"
                min={1}
                max={100}
                value={targetRepMax}
                onChange={(e) => setTargetRepMax(Math.max(1, Number(e.target.value) || 1))}
                className="bg-transparent text-white font-semibold text-sm outline-none"
              />
            </label>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['Все', ...MUSCLE_GROUPS] as const).map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedGroup === group
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0b0e14] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {query.trim() && !exactExists && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-blue-300 font-medium">Создать новое упражнение</p>
                  <p className="text-sm font-semibold text-white">{query.trim()}</p>
                </div>
                <select
                  value={customGroup}
                  onChange={(e) => setCustomGroup(e.target.value as MuscleGroup)}
                  className="bg-[#0b0e14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                >
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleChoose(query.trim(), customGroup)}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                Добавить «{query.trim()}»
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">
              Упражнения не найдены. Введите название выше, чтобы создать своё.
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleChoose(item.name, item.muscleGroup)}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-[#1a1f2c] hover:bg-[#222838] border border-slate-800/80 text-left transition active:scale-[0.99]"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.muscleGroup}</p>
                </div>
                <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
