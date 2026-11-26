import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
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
  onUpdateProgram: (nextProgram: ProgramExercise[]) => void;
  onResetProgram: () => void;
  onClearEntries: () => void;
  onChangeWeightStep: (step: 1.25 | 2.5) => void;
}

export function DataModal({
  isOpen,
  onClose,
  db,
  onImportDatabase,
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
  const [showProgramEditor, setShowProgramEditor] = useState(false);

  if (!isOpen) return null;

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedDb = parseImportedJson(text);
      onImportDatabase(parsedDb);
      setStatusMessage({
        type: 'success',
        text: `База импортирована: ${parsedDb.entries.length} трен., ${parsedDb.program.length} упр. в программе.`,
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

  const updateProgramItem = (
    idx: number,
    patch: Partial<ProgramExercise>
  ) => {
    const next = db.program.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onUpdateProgram(next);
  };

  const removeProgramItem = (idx: number) => {
    if (db.program.length <= 1) return;
    onUpdateProgram(db.program.filter((_, i) => i !== idx));
  };

  const addProgramItem = () => {
    onUpdateProgram([
      ...db.program,
      { name: 'Новое упражнение', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-[#141822] border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
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
            <div className="rounded-xl bg-[#0e121b] border border-slate-800 p-3">
              <p className="text-xs text-slate-400">Записей в журнале</p>
              <p className="text-xl font-bold text-white tabular-nums mt-0.5">
                {db.entries.length}
              </p>
            </div>
            <div className="rounded-xl bg-[#0e121b] border border-slate-800 p-3">
              <p className="text-xs text-slate-400">Упражнений в программе</p>
              <p className="text-xl font-bold text-white tabular-nums mt-0.5">
                {db.program.length}
              </p>
            </div>
          </div>

          {/* Program section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Программа тренировок
              </p>
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
            </div>

            <button
              type="button"
              onClick={() => {
                onResetProgram();
                setStatusMessage({
                  type: 'success',
                  text: 'Загружена ваша базовая программа (13 упражнений Full-Body).',
                });
              }}
              className="w-full h-11 px-4 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/35 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Загрузить мою программу (13 упр. Full-Body)
            </button>

            {showProgramEditor && (
              <div className="rounded-xl bg-[#0e121b] border border-slate-800 p-3 space-y-2">
                {db.program.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 pb-2 border-b border-slate-800/70 last:border-b-0 last:pb-0"
                  >
                    <span className="text-[11px] font-mono text-slate-600 w-5 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => updateProgramItem(idx, { name: e.target.value })}
                      className="flex-1 min-w-[140px] h-8 px-2 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-1 shrink-0 text-[11px] text-slate-400">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={p.targetSets}
                        onChange={(e) =>
                          updateProgramItem(idx, {
                            targetSets: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        title="Подходы"
                        className="w-10 h-8 px-1 rounded-lg bg-[#141822] border border-slate-800 text-center text-xs text-white tabular-nums outline-none focus:border-blue-500"
                      />
                      <span>×</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={p.targetRepMin}
                        onChange={(e) =>
                          updateProgramItem(idx, {
                            targetRepMin: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        title="Мин. повторений"
                        className="w-10 h-8 px-1 rounded-lg bg-[#141822] border border-slate-800 text-center text-xs text-white tabular-nums outline-none focus:border-blue-500"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={p.targetRepMax}
                        onChange={(e) =>
                          updateProgramItem(idx, {
                            targetRepMax: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        title="Макс. повторений"
                        className="w-10 h-8 px-1 rounded-lg bg-[#141822] border border-slate-800 text-center text-xs text-white tabular-nums outline-none focus:border-blue-500"
                      />
                      {db.program.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProgramItem(idx)}
                          className="w-7 h-8 rounded-lg text-slate-500 hover:text-rose-400 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProgramItem}
                  className="w-full h-9 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Добавить упражнение в программу
                </button>
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
                      : 'bg-[#0e121b] border-slate-800 text-slate-400 hover:text-slate-200'
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
                className="h-11 px-4 rounded-xl bg-[#0e121b] hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition"
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
                  <span>Удалить все записи тренировок? Программа сохранится.</span>
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
