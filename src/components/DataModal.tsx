import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  FolderPlus,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { AppDatabase, ProgramExercise } from '../types/workout.ts';
import { exportJson, parseImportedJson } from '../utils/storage.ts';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: AppDatabase;
  onImportDatabase: (nextDb: AppDatabase) => void;
  onSelectProgram: (programId: string) => void;
  onCreateProgram: (name: string) => void;
  onRenameProgram: (programId: string, name: string) => void;
  onDeleteProgram: (programId: string) => void;
  onUpdateProgram: (nextProgram: ProgramExercise[]) => void;
  onResetProgram: () => void;
  onClearEntries: () => void;
  onChangeWeightStep: (step: 1.25 | 2.5) => void;
}

function NumericField({
  value,
  min = 1,
  max = 100,
  title,
  onCommit,
}: {
  value: number;
  min?: number;
  max?: number;
  title: string;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft ?? String(value)}
      title={title}
      onFocus={(e) => {
        setDraft(String(value));
        e.target.select();
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
          onCommit(parsed);
        }
      }}
      onBlur={() => {
        if (draft !== null) {
          const parsed = parseInt(draft, 10);
          if (!Number.isNaN(parsed)) {
            onCommit(Math.min(max, Math.max(min, parsed)));
          }
          setDraft(null);
        }
      }}
      className="w-10 h-8 px-1 rounded-lg bg-[#111827] border border-slate-800 text-center text-xs text-white tabular-nums outline-none focus:border-blue-500"
    />
  );
}

export function DataModal({
  isOpen,
  onClose,
  db,
  onImportDatabase,
  onSelectProgram,
  onCreateProgram,
  onRenameProgram,
  onDeleteProgram,
  onUpdateProgram,
  onResetProgram,
  onClearEntries,
  onChangeWeightStep,
}: DataModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showProgramEditor, setShowProgramEditor] = useState(true);
  const [newProgramName, setNewProgramName] = useState('');

  if (!isOpen) return null;

  const activeProgram =
    db.programs.find((p) => p.id === db.activeProgramId) ?? db.programs[0] ?? null;
  const exercises = activeProgram ? activeProgram.exercises : db.program;

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedDb = parseImportedJson(text);
      onImportDatabase(parsedDb);
      setStatusMessage({
        type: 'success',
        text: `База импортирована: ${parsedDb.entries.length} трен., ${parsedDb.programs.length} прогр.`,
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Не удалось прочитать JSON-файл.',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleCreateProgramClick = () => {
    const label = newProgramName.trim() || `Программа ${db.programs.length + 1}`;
    onCreateProgram(label);
    setNewProgramName('');
    setShowProgramEditor(true);
    setStatusMessage({
      type: 'success',
      text: `Создана программа «${label}». Добавьте упражнения ниже.`,
    });
  };

  const updateProgramItem = (idx: number, patch: Partial<ProgramExercise>) => {
    const next = exercises.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onUpdateProgram(next);
  };

  const removeProgramItem = (idx: number) => {
    onUpdateProgram(exercises.filter((_, i) => i !== idx));
  };

  const addProgramItem = () => {
    onUpdateProgram([
      ...exercises,
      { name: '', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
    ]);
  };

  const clearProgramExercises = () => {
    onUpdateProgram([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-[#111827] border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Программа, данные и настройки</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Current DB stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#0b0f19] border border-slate-800 p-3">
              <p className="text-xs text-slate-400">Записей в журнале</p>
              <p className="text-xl font-bold text-white tabular-nums mt-0.5">
                {db.entries.length}
              </p>
            </div>
            <div className="rounded-xl bg-[#0b0f19] border border-slate-800 p-3">
              <p className="text-xs text-slate-400">Упражнений в активной</p>
              <p className="text-xl font-bold text-white tabular-nums mt-0.5">
                {exercises.length}
              </p>
            </div>
          </div>

          {/* Program section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Программы тренировок ({db.programs.length})
              </p>
              {activeProgram && (
                <button
                  type="button"
                  onClick={() => setShowProgramEditor((v) => !v)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  <span>{showProgramEditor ? 'Скрыть список' : 'Редактировать список'}</span>
                  {showProgramEditor ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Create new program */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newProgramName}
                onChange={(e) => setNewProgramName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateProgramClick();
                  }
                }}
                placeholder="Название новой программы (например, Верх / Низ)..."
                className="flex-1 h-10 px-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleCreateProgramClick}
                className="h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Создать</span>
              </button>
            </div>

            {/* Program switcher pills */}
            {db.programs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {db.programs.map((prog) => {
                  const isActive = activeProgram?.id === prog.id;
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      onClick={() => onSelectProgram(prog.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                          : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{prog.name || 'Без названия'}</span>
                      <span className="text-[10px] opacity-70 tabular-nums">
                        ({prog.exercises.length})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active program rename + delete */}
            {activeProgram && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={activeProgram.name}
                  onChange={(e) => onRenameProgram(activeProgram.id, e.target.value)}
                  placeholder="Название программы..."
                  aria-label="Название активной программы"
                  className="flex-1 h-9 px-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-xs font-semibold text-white outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    onDeleteProgram(activeProgram.id);
                    setStatusMessage({
                      type: 'success',
                      text: `Программа «${activeProgram.name || 'Без названия'}» удалена.`,
                    });
                  }}
                  title="Удалить эту программу"
                  className="h-9 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Удалить программу</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onResetProgram();
                setShowProgramEditor(true);
                setStatusMessage({
                  type: 'success',
                  text: 'Загружена базовая программа (13 упражнений Full-Body).',
                });
              }}
              className="w-full h-11 px-4 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/35 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Загрузить мою программу (13 упр. Full-Body)
            </button>

            {/* Exercise list for active program */}
            {activeProgram && showProgramEditor && (
              <div className="rounded-xl bg-[#0b0f19] border border-slate-800 p-3 space-y-2">
                {exercises.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">
                    В этой программе пока нет упражнений.
                  </p>
                ) : (
                  exercises.map((p, idx) => (
                    <div
                      key={`${activeProgram.id}-${idx}`}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 pb-2 border-b border-slate-800/70 last:border-b-0 last:pb-0"
                    >
                      <span className="text-[11px] font-mono text-slate-600 w-5 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={p.name}
                        placeholder="Название упражнения..."
                        onChange={(e) => updateProgramItem(idx, { name: e.target.value })}
                        className="flex-1 min-w-[140px] h-8 px-2 rounded-lg bg-[#111827] border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                      />
                      <div className="flex items-center gap-1 shrink-0 text-[11px] text-slate-400">
                        <NumericField
                          value={p.targetSets}
                          min={1}
                          max={20}
                          title="Подходы"
                          onCommit={(val) => updateProgramItem(idx, { targetSets: val })}
                        />
                        <span>×</span>
                        <NumericField
                          value={p.targetRepMin}
                          min={1}
                          max={100}
                          title="Мин. повторений"
                          onCommit={(val) => updateProgramItem(idx, { targetRepMin: val })}
                        />
                        <span>-</span>
                        <NumericField
                          value={p.targetRepMax}
                          min={1}
                          max={100}
                          title="Макс. повторений"
                          onCommit={(val) => updateProgramItem(idx, { targetRepMax: val })}
                        />
                        <button
                          type="button"
                          onClick={() => removeProgramItem(idx)}
                          title="Удалить упражнение"
                          aria-label="Удалить упражнение"
                          className="w-7 h-8 rounded-lg text-slate-500 hover:text-rose-400 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={addProgramItem}
                    className="flex-1 h-9 px-3 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Добавить упражнение
                  </button>
                  {exercises.length > 0 && (
                    <button
                      type="button"
                      onClick={clearProgramExercises}
                      className="h-9 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Очистить список
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Default Weight Step */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Шаг прибавки веса (по клику на «+ Вес»)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([2.5, 1.25] as const).map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => onChangeWeightStep(step)}
                  className={`h-11 rounded-xl border text-sm font-semibold transition ${
                    db.settings.weightStep === step
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  + {step} кг
                </button>
              ))}
            </div>
          </div>

          {/* Export / Import */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Резервное копирование (JSON)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  exportJson(db);
                  setStatusMessage({
                    type: 'success',
                    text: 'Файл резервной копии JSON скачан.',
                  });
                }}
                className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Экспорт в JSON
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-4 rounded-xl bg-[#0b0f19] hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                Импорт из JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileSelected}
                className="hidden"
              />
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs font-medium border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Очистить всю историю тренировок
              </button>
            ) : (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/35 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-rose-200 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Удалить все записи тренировок? Программы сохранятся.</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearEntries();
                      setConfirmClear(false);
                      setStatusMessage({
                        type: 'success',
                        text: 'Журнал записей очищен.',
                      });
                    }}
                    className="flex-1 h-9 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    Да, очистить
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 h-9 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
