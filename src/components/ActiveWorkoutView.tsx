import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Check, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight,
  Info,
  Timer as TimerIcon
} from 'lucide-react';
import { formatDuration, formatTonnage, calculateWorkoutTonnage } from '../utils/calculations';
import { ExerciseDefinition } from '../types';

export const ActiveWorkoutView: React.FC = () => {
  const {
    data,
    finishWorkout,
    cancelWorkout,
    removeExerciseFromActiveWorkout,
    reorderExercises,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    addExerciseToActiveWorkout,
    startRestTimer
  } = useApp();

  const workout = data.activeWorkout;
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [infoModalContent, setInfoModalContent] = useState<string | null>(null);

  if (!workout) return null;

  const currentTonnage = calculateWorkoutTonnage(workout.exercises);
  const totalCompletedSets = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );
  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  // Available exercises to add
  const existingExIds = new Set(workout.exercises.map(e => e.exerciseId));
  const availableToAdd = data.exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Все' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Все', 'Спина', 'Грудь', 'Ноги', 'Плечи', 'Руки', 'Пресс'];

  return (
    <div className="pb-36 pt-2 px-3 max-w-2xl mx-auto">
      {/* Sticky Top Status Bar */}
      <div className="sticky top-0 z-30 mb-4 pt-2 pb-3 bg-dark-950/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-lg font-bold text-white tracking-tight">{workout.title}</h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <Clock size={13} className="text-emerald-400" />
                {formatDuration(workout.durationSeconds)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Flame size={13} className="text-amber-400" />
                {formatTonnage(currentTonnage)}
              </span>
              <span>•</span>
              <span>{totalCompletedSets}/{totalSets} подходов</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={() => setShowFinishModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-1.5"
            >
              <Check size={15} /> Завершить
            </button>
          </div>
        </div>

        {/* Progress meter */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${totalSets > 0 ? (totalCompletedSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {workout.exercises.map((ex, exIndex) => (
          <div 
            key={ex.id}
            className={`rounded-2xl glass-panel p-3.5 transition-all duration-200 border ${
              ex.readyForProgression ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'
            }`}
          >
            {/* Exercise Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {ex.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Цель: {ex.minReps}–{ex.maxReps} повт.
                  </span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {exIndex + 1}. {ex.name}
                </h3>
              </div>

              {/* Move up/down & delete exercise */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => reorderExercises(exIndex, exIndex - 1)}
                  disabled={exIndex === 0}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Поднять выше"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => reorderExercises(exIndex, exIndex + 1)}
                  disabled={exIndex === workout.exercises.length - 1}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Опустить ниже"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => removeExerciseFromActiveWorkout(ex.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Удалить упражнение"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Smart Progression Badge if ready */}
            {ex.readyForProgression && (
              <div 
                onClick={() => setInfoModalContent(ex.progressionReason || 'Отличный прогресс на прошлой тренировке!')}
                className="mb-3.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-emerald-900/40 to-slate-900 border border-emerald-500/50 flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500 text-dark-950">
                    <Sparkles size={15} className="animate-spin text-dark-950" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-300 tracking-wide uppercase flex items-center gap-1">
                      ⚡ Пора повысить вес
                    </div>
                    <div className="text-[11px] text-slate-300 line-clamp-1">
                      {ex.progressionReason}
                    </div>
                  </div>
                </div>
                <Info size={15} className="text-emerald-400 flex-shrink-0 ml-2" />
              </div>
            )}

            {/* Sets Header */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              <div className="col-span-1 text-center">Сет</div>
              <div className="col-span-4 text-center">Вес (кг)</div>
              <div className="col-span-4 text-center">Повторения</div>
              <div className="col-span-3 text-center">Выполнено</div>
            </div>

            {/* Sets rows */}
            <div className="space-y-2">
              {ex.sets.map((set) => {
                const isOverMax = set.reps >= ex.maxReps && set.completed;
                return (
                  <div 
                    key={set.id}
                    className={`rounded-xl p-2 transition-all border ${
                      set.completed 
                        ? 'bg-emerald-950/20 border-emerald-500/30' 
                        : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Set Number */}
                      <div className="col-span-1 text-center font-bold text-sm text-slate-300">
                        {set.setNumber}
                      </div>

                      {/* Weight Control */}
                      <div className="col-span-4">
                        <div className="flex items-center justify-center bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateSet(ex.id, set.id, { weight: Math.max(0, set.weight - 2.5) })}
                            className="px-2 py-2 text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 font-bold text-sm select-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step="0.5"
                            value={set.weight === 0 ? '' : set.weight}
                            placeholder="0"
                            onChange={(e) => updateSet(ex.id, set.id, { weight: parseFloat(e.target.value) || 0 })}
                            className="w-full text-center bg-transparent py-1.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateSet(ex.id, set.id, { weight: set.weight + 2.5 })}
                            className="px-2 py-2 text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 font-bold text-sm select-none"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Reps Control */}
                      <div className="col-span-4">
                        <div className="flex items-center justify-center bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateSet(ex.id, set.id, { reps: Math.max(0, set.reps - 1) })}
                            className="px-2 py-2 text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 font-bold text-sm select-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={set.reps === 0 ? '' : set.reps}
                            placeholder="0"
                            onChange={(e) => updateSet(ex.id, set.id, { reps: parseInt(e.target.value, 10) || 0 })}
                            className="w-full text-center bg-transparent py-1.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateSet(ex.id, set.id, { reps: set.reps + 1 })}
                            className="px-2 py-2 text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 font-bold text-sm select-none"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Checkbox button */}
                      <div className="col-span-3 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleSetComplete(ex.id, set.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            set.completed
                              ? 'bg-emerald-500 text-dark-950 shadow-lg shadow-emerald-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <Check size={20} className={set.completed ? 'stroke-[3]' : 'stroke-2'} />
                        </button>

                        {/* Delete set button if sets > 1 */}
                        {ex.sets.length > 1 && (
                          <button
                            onClick={() => removeSet(ex.id, set.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 text-xs"
                            title="Удалить подход"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hint with previous results */}
                    {set.previousWeight !== undefined && set.previousReps !== undefined && (
                      <div className="mt-1.5 px-2 flex items-center justify-between text-[11px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            updateSet(ex.id, set.id, {
                              weight: set.previousWeight,
                              reps: set.previousReps
                            });
                          }}
                          className="hover:text-emerald-400 underline decoration-dotted transition-colors text-left"
                          title="Нажмите, чтобы скопировать результат"
                        >
                          Прошлый раз: <span className="text-slate-300 font-semibold">{set.previousWeight} кг × {set.previousReps} повт.</span>
                        </button>

                        {isOverMax && (
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            Верхняя граница достигнута!
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Set Actions: Add Set, Quick Rest Timer */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => addSet(ex.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus size={14} /> Добавить подход
              </button>

              <button
                type="button"
                onClick={() => startRestTimer(90)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
              >
                <TimerIcon size={14} /> Отдых (90с)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Exercise Floating / Bottom Button */}
      <div className="mt-6 mb-8 text-center">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300 hover:text-emerald-400 font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Добавить упражнение в тренировку
        </button>
      </div>

      {/* Floating Finish Bottom Bar */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-md mx-auto z-20 pointer-events-none">
        <button
          type="button"
          onClick={() => setShowFinishModal(true)}
          className="pointer-events-auto w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-emerald-950/70 border border-emerald-400/40 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2">
            <Check size={18} className="stroke-[3]" />
            <span>Завершить тренировку</span>
          </div>
          <span className="text-xs bg-emerald-700/80 px-2.5 py-1 rounded-lg font-mono">
            {formatTonnage(currentTonnage)}
          </span>
        </button>
      </div>

      {/* ADD EXERCISE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-dark-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Добавить упражнение</h3>
                <p className="text-xs text-slate-400">Выберите из базы или создайте новое</p>
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
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
              {availableToAdd.map((def) => {
                const isAlreadyInWorkout = existingExIds.has(def.id);
                return (
                  <div
                    key={def.id}
                    onClick={() => {
                      addExerciseToActiveWorkout(def);
                      setShowAddModal(false);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isAlreadyInWorkout 
                        ? 'bg-slate-900/40 border-slate-800/50 opacity-60' 
                        : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {def.category}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {def.targetSets} × {def.minReps}–{def.maxReps}
                        </span>
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

      {/* CONFIRM CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle size={28} />
              <h3 className="text-lg font-bold text-white">Отменить тренировку?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Все введенные результаты текущей тренировки будут сброшены и не сохранятся в историю.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium"
              >
                Продолжить тренировку
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  cancelWorkout();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-950/60"
              >
                Да, отменить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM FINISH MODAL */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-dark-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                <Check size={28} className="stroke-[3]" />
              </div>
              <h3 className="text-lg font-bold text-white">Завершить тренировку?</h3>
              <p className="text-xs text-slate-400">Результаты сохранятся в историю прогресса</p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Длительность:</span>
                <span className="font-mono text-white font-bold">{formatDuration(workout.durationSeconds)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Общий тоннаж:</span>
                <span className="font-mono text-emerald-400 font-bold">{formatTonnage(currentTonnage)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Выполнено подходов:</span>
                <span className="font-mono text-white font-bold">{totalCompletedSets} из {totalSets}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Вернуться
              </button>
              <button
                onClick={() => {
                  setShowFinishModal(false);
                  finishWorkout();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60"
              >
                Сохранить в историю
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INFO MODAL FOR PROGRESSION */}
      {infoModalContent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-emerald-500/40 rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles size={20} />
              <h4 className="text-base font-bold text-white">Логика умной прогрессии</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {infoModalContent}
            </p>
            <div className="pt-2 text-right">
              <button
                onClick={() => setInfoModalContent(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
