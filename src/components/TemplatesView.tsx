import {
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  Layers,
  Play,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { TemplateExercise, WorkoutSession, WorkoutTemplate } from '../types/workout.ts';
import { generateId } from '../utils/calculations.ts';
import { ExercisePickerModal, type PickedExerciseConfig } from './ExercisePickerModal.tsx';

interface TemplatesViewProps {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  onSaveTemplate: (template: WorkoutTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onStartTemplate: (template: WorkoutTemplate) => void;
}

export function TemplatesView({
  templates,
  sessions,
  onSaveTemplate,
  onDeleteTemplate,
  onStartTemplate,
}: TemplatesViewProps) {
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openCreateModal = () => {
    const now = new Date().toISOString();
    setEditingTemplate({
      id: generateId(),
      name: '',
      description: '',
      exercises: [],
      createdAt: now,
      updatedAt: now,
    });
  };

  const openEditModal = (tpl: WorkoutTemplate) => {
    setEditingTemplate({
      ...tpl,
      exercises: tpl.exercises.map((e) => ({ ...e })),
    });
  };

  const handleDuplicate = (tpl: WorkoutTemplate) => {
    const now = new Date().toISOString();
    onSaveTemplate({
      ...tpl,
      id: generateId(),
      name: `${tpl.name} (копия)`,
      exercises: tpl.exercises.map((e) => ({ ...e, id: generateId() })),
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleAddExerciseToDraft = (config: PickedExerciseConfig) => {
    if (!editingTemplate) return;
    const newEx: TemplateExercise = {
      id: generateId(),
      name: config.name,
      muscleGroup: config.muscleGroup,
      targetSets: config.targetSets,
      targetRepMin: config.targetRepMin,
      targetRepMax: config.targetRepMax,
    };
    setEditingTemplate({
      ...editingTemplate,
      exercises: [...editingTemplate.exercises, newEx],
    });
  };

  const handleUpdateDraftExercise = (exId: string, patch: Partial<TemplateExercise>) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      exercises: editingTemplate.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)),
    });
  };

  const handleMoveDraftExercise = (index: number, direction: -1 | 1) => {
    if (!editingTemplate) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= editingTemplate.exercises.length) return;
    const next = [...editingTemplate.exercises];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setEditingTemplate({ ...editingTemplate, exercises: next });
  };

  const handleRemoveDraftExercise = (exId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      exercises: editingTemplate.exercises.filter((e) => e.id !== exId),
    });
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    const trimmedName = editingTemplate.name.trim() || 'Новый шаблон';
    const normalizedExercises = editingTemplate.exercises.map((ex) => {
      const sets = Math.max(1, Math.min(20, ex.targetSets || 3));
      const min = Math.max(1, Math.min(100, ex.targetRepMin || 8));
      const max = Math.max(min, Math.min(100, ex.targetRepMax || min));
      return {
        ...ex,
        targetSets: sets,
        targetRepMin: min,
        targetRepMax: max,
      };
    });

    onSaveTemplate({
      ...editingTemplate,
      name: trimmedName,
      description: editingTemplate.description?.trim() || undefined,
      exercises: normalizedExercises,
      updatedAt: new Date().toISOString(),
    });
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Шаблоны программ</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Настройте сплиты (например, Full-Body A/B/C) и целевые диапазоны для двойной прогрессии.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Создать шаблон
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl bg-[#141822] border border-dashed border-slate-800 p-10 text-center space-y-3">
          <Layers className="w-9 h-9 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">
            Нет сохранённых шаблонов. Создайте программу, чтобы запускать тренировки в один тап.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <article
              key={tpl.id}
              className="rounded-2xl bg-[#141822] border border-slate-800/90 p-4 sm:p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{tpl.name}</h3>
                    {tpl.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{tpl.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(tpl)}
                      title="Дублировать"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(tpl)}
                      title="Редактировать"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {confirmDeleteId === tpl.id ? (
                      <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 rounded-lg px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTemplate(tpl.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-[11px] font-semibold text-rose-300 px-1"
                        >
                          Удалить
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[11px] text-slate-400 px-1"
                        >
                          Нет
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(tpl.id)}
                        title="Удалить"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-800/70 rounded-xl bg-[#0e121b] border border-slate-800/80 px-3">
                  {tpl.exercises.length === 0 ? (
                    <p className="py-3 text-xs text-slate-500">В шаблоне нет упражнений</p>
                  ) : (
                    tpl.exercises.map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-500 font-mono text-xs w-4 shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="text-slate-200 font-medium truncate">{ex.name}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-blue-300 font-semibold text-xs tabular-nums shrink-0">
                          {ex.targetSets} × {ex.targetRepMin}–{ex.targetRepMax}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartTemplate(tpl)}
                className="w-full h-11 rounded-xl bg-blue-600/15 hover:bg-blue-600 border border-blue-500/35 hover:border-blue-500 text-blue-300 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                Запустить тренировку
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl bg-[#141822] border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {templates.some((t) => t.id === editingTemplate.id)
                  ? 'Редактировать шаблон'
                  : 'Новый шаблон'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-400">Название программы</span>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, name: e.target.value })
                    }
                    placeholder="Например: Full-Body A"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#0b0e14] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-400">
                    Описание (необязательно)
                  </span>
                  <input
                    type="text"
                    value={editingTemplate.description ?? ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, description: e.target.value })
                    }
                    placeholder="Акцент на грудь и спину"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#0b0e14] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Упражнения ({editingTemplate.exercises.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="h-9 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/35 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Добавить упражнение
                  </button>
                </div>

                {editingTemplate.exercises.length === 0 ? (
                  <div className="rounded-xl bg-[#0b0e14] border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                    Добавьте упражнения в шаблон и задайте целевые подходы и повторения.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {editingTemplate.exercises.map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="rounded-xl bg-[#0e121b] border border-slate-800 p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                            <p className="text-[11px] text-slate-400">{ex.muscleGroup}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveDraftExercise(idx, -1)}
                              disabled={idx === 0}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDraftExercise(idx, 1)}
                              disabled={idx === editingTemplate.exercises.length - 1}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftExercise(ex.id)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <label className="flex flex-col gap-1 bg-[#141822] border border-slate-800 rounded-lg px-2.5 py-1.5">
                            <span className="text-[11px] text-slate-400">Подходы</span>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={ex.targetSets}
                              onChange={(e) =>
                                handleUpdateDraftExercise(ex.id, {
                                  targetSets: Number(e.target.value) || 1,
                                })
                              }
                              className="bg-transparent text-white font-semibold outline-none"
                            />
                          </label>
                          <label className="flex flex-col gap-1 bg-[#141822] border border-slate-800 rounded-lg px-2.5 py-1.5">
                            <span className="text-[11px] text-slate-400">Мин. повт.</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={ex.targetRepMin}
                              onChange={(e) =>
                                handleUpdateDraftExercise(ex.id, {
                                  targetRepMin: Number(e.target.value) || 1,
                                })
                              }
                              className="bg-transparent text-white font-semibold outline-none"
                            />
                          </label>
                          <label className="flex flex-col gap-1 bg-[#141822] border border-slate-800 rounded-lg px-2.5 py-1.5">
                            <span className="text-[11px] text-slate-400">Макс. повт.</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={ex.targetRepMax}
                              onChange={(e) =>
                                handleUpdateDraftExercise(ex.id, {
                                  targetRepMax: Number(e.target.value) || 1,
                                })
                              }
                              className="bg-transparent text-white font-semibold outline-none"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
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
                Сохранить шаблон
              </button>
            </div>
          </div>
        </div>
      )}

      <ExercisePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleAddExerciseToDraft}
        sessions={sessions}
      />
    </div>
  );
}
