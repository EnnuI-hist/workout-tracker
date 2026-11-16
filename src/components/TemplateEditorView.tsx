import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Layers, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  RotateCcw, 
  Check, 
  Dumbbell, 
  Sparkles,
  Edit2
} from 'lucide-react';
import { ExerciseDefinition } from '../types';

export const TemplateEditorView: React.FC = () => {
  const { 
    data, 
    updateTemplate, 
    addExerciseToTemplate, 
    removeExerciseFromTemplate, 
    updateTemplateExercise, 
    reorderTemplateExercises, 
    resetTemplateToDefault,
    startWorkout 
  } = useApp();

  const [activeTemplateId, setActiveTemplateId] = useState<string>('template-day-a');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  const activeTemplate = data.templates.find(t => t.id === activeTemplateId) || data.templates[0];
  const isDayA = activeTemplate.type === 'day-a';

  const categories = ['Все', 'Спина', 'Грудь', 'Ноги', 'Плечи', 'Руки', 'Пресс'];

  const filteredExercises = data.exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Все' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddExercise = (def: ExerciseDefinition) => {
    addExerciseToTemplate(activeTemplate.id, def);
    setShowAddModal(false);
    showToast();
  };

  const showToast = () => {
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  return (
    <div className="pb-28 pt-3 px-3 max-w-2xl mx-auto space-y-5">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Программы тренировок
        </span>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Layers size={20} className="text-emerald-400" /> Редактор шаблонов
        </h1>
        <p className="text-xs text-slate-400">
          Настройте упражнения, подходы и повторения для Дня А и Дня Б
        </p>
      </div>

      {/* Template Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
        {data.templates.map((tpl) => {
          const isSelected = tpl.id === activeTemplateId;
          const isA = tpl.type === 'day-a';
          return (
            <button
              key={tpl.id}
              onClick={() => setActiveTemplateId(tpl.id)}
              className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex flex-col items-center gap-1 ${
                isSelected
                  ? isA 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60' 
                    : 'bg-sky-600 text-white shadow-lg shadow-sky-950/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>{tpl.name}</span>
              <span className={`text-[10px] font-normal ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                {tpl.exercises.length} упражнений
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Template Overview Banner */}
      <div className={`p-4 rounded-3xl border shadow-xl transition-all ${
        isDayA 
          ? 'bg-emerald-950/20 border-emerald-500/40' 
          : 'bg-sky-950/20 border-sky-500/40'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isDayA ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
              }`}>
                {activeTemplate.name}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeTemplate.description || 'Программа Full-Body для сбалансированной нагрузки.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                if (confirm(`Сбросить шаблон «${activeTemplate.name}» к исходному состоянию?`)) {
                  resetTemplateToDefault(activeTemplate.id);
                  showToast();
                }
              }}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              title="Сбросить к исходным"
            >
              <RotateCcw size={15} />
            </button>

            <button
              onClick={() => startWorkout(activeTemplate.id)}
              className={`px-3 py-2 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 ${
                isDayA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              <Play size={14} className="fill-current" /> Старт
            </button>
          </div>
        </div>

        {isSavedToast && (
          <div className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
            <Check size={14} /> Шаблон успешно обновлен и сохранен в памяти!
          </div>
        )}
      </div>

      {/* Exercises List in Template */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Список упражнений ({activeTemplate.exercises.length})
          </span>
          <span className="text-xs text-slate-500">
            Нажимайте стрелочки для изменения порядка
          </span>
        </div>

        {activeTemplate.exercises.map((tex, index) => (
          <div
            key={tex.id}
            className="p-3.5 rounded-2xl glass-panel border border-slate-800 hover:border-slate-700 transition-all space-y-3"
          >
            {/* Header: Name, Category, Order buttons, Delete */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold font-mono text-slate-300 flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                      {tex.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {tex.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => reorderTemplateExercises(activeTemplate.id, index, index - 1)}
                  disabled={index === 0}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Поднять выше"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => reorderTemplateExercises(activeTemplate.id, index, index + 1)}
                  disabled={index === activeTemplate.exercises.length - 1}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Опустить ниже"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeExerciseFromTemplate(activeTemplate.id, tex.id);
                    showToast();
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Удалить из шаблона"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Editable Controls: Sets, Min Reps, Max Reps */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              {/* Target Sets */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Подходы:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      updateTemplateExercise(activeTemplate.id, tex.id, {
                        targetSets: Math.max(1, tex.targetSets - 1)
                      });
                      showToast();
                    }}
                    className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-xs font-mono text-white">
                    {tex.targetSets}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      updateTemplateExercise(activeTemplate.id, tex.id, {
                        targetSets: tex.targetSets + 1
                      });
                      showToast();
                    }}
                    className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Reps Range */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Повторения:</span>
                <div className="flex items-center gap-1 text-xs font-mono">
                  <input
                    type="number"
                    value={tex.minReps}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      updateTemplateExercise(activeTemplate.id, tex.id, { minReps: val });
                      showToast();
                    }}
                    className="w-8 py-0.5 text-center bg-slate-900 border border-slate-700 rounded text-white font-bold focus:outline-none"
                  />
                  <span className="text-slate-500">–</span>
                  <input
                    type="number"
                    value={tex.maxReps}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || tex.minReps;
                      updateTemplateExercise(activeTemplate.id, tex.id, { maxReps: val });
                      showToast();
                    }}
                    className="w-8 py-0.5 text-center bg-slate-900 border border-slate-700 rounded text-white font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Exercise Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300 hover:text-emerald-400 font-semibold text-xs transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Добавить упражнение в «{activeTemplate.name}»
        </button>
      </div>

      {/* ADD EXERCISE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-dark-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Добавить в шаблон</h3>
                <p className="text-xs text-slate-400">{activeTemplate.name}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Filter Categories */}
            <div className="p-3 border-b border-slate-800/80 space-y-2">
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-emerald-500 text-dark-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {filteredExercises.map((def) => {
                const isAlreadyInTemplate = activeTemplate.exercises.some(e => e.exerciseId === def.id);
                return (
                  <div
                    key={def.id}
                    onClick={() => handleAddExercise(def)}
                    className="p-3 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {def.category}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {def.targetSets} × {def.minReps}–{def.maxReps}
                        </span>
                        {isAlreadyInTemplate && (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            (уже в шаблоне)
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-white">{def.name}</div>
                    </div>
                    <div className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg">
                      <Plus size={18} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
