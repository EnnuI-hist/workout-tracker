import {
  BarChart3,
  CheckCircle2,
  Database,
  Dumbbell,
  History,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ActiveWorkoutView } from './components/ActiveWorkoutView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { DataModal } from './components/DataModal.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { TemplatesView } from './components/TemplatesView.tsx';
import type {
  ActiveWorkoutDraft,
  AppDatabase,
  NavTab,
  WeightStep,
  WorkoutSession,
  WorkoutTemplate,
} from './types/workout.ts';
import {
  calculateSessionTonnage,
  evaluateDoubleProgression,
  findPreviousExercisePerformance,
  formatNumber,
  generateId,
  getTodayISODate,
} from './utils/calculations.ts';
import { createDemoDatabase } from './utils/demoData.ts';
import {
  loadActiveDraft,
  loadDatabase,
  saveActiveDraft,
  saveDatabase,
} from './utils/storage.ts';

export function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [activeDraft, setActiveDraft] = useState<ActiveWorkoutDraft | null>(() =>
    loadActiveDraft()
  );
  const [activeTab, setActiveTab] = useState<NavTab>('workout');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  useEffect(() => {
    saveActiveDraft(activeDraft);
  }, [activeDraft]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string) => {
    setToast(message);
  };

  const handleChangeWeightStep = (step: WeightStep) => {
    setDb((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        defaultWeightStep: step,
      },
    }));
  };

  const handleStartFromTemplate = (template: WorkoutTemplate) => {
    if (activeDraft) {
      setActiveTab('workout');
      showToast('Сначала завершите или отмените текущую тренировку.');
      return;
    }

    const exercises = template.exercises.map((tplEx) => {
      const prev = findPreviousExercisePerformance(db.sessions, tplEx.name);
      const sets = Array.from({ length: tplEx.targetSets }, (_, idx) => {
        const prevSet = prev?.sets[idx] ?? prev?.sets[prev.sets.length - 1];
        return {
          id: generateId(),
          weight: prevSet ? prevSet.weight : 20,
          reps: prevSet ? prevSet.reps : tplEx.targetRepMin,
          completed: false,
        };
      });

      return {
        id: generateId(),
        name: tplEx.name,
        muscleGroup: tplEx.muscleGroup,
        targetSets: tplEx.targetSets,
        targetRepMin: tplEx.targetRepMin,
        targetRepMax: tplEx.targetRepMax,
        sets,
      };
    });

    setActiveDraft({
      id: generateId(),
      templateId: template.id,
      name: template.name,
      date: getTodayISODate(),
      startedAt: new Date().toISOString(),
      exercises,
    });
    setActiveTab('workout');
  };

  const handleStartEmpty = () => {
    if (activeDraft) {
      setActiveTab('workout');
      return;
    }
    setActiveDraft({
      id: generateId(),
      name: 'Свободная тренировка',
      date: getTodayISODate(),
      startedAt: new Date().toISOString(),
      exercises: [],
    });
    setActiveTab('workout');
  };

  const handleFinishWorkout = () => {
    if (!activeDraft) return;

    const cleanedExercises = activeDraft.exercises
      .map((ex) => ({
        ...ex,
        sets: ex.sets.filter((s) => s.completed && s.reps > 0),
      }))
      .filter((ex) => ex.sets.length > 0);

    if (cleanedExercises.length === 0) {
      showToast('Отметьте хотя бы один выполненный подход.');
      return;
    }

    const finishedAt = new Date().toISOString();
    const durationMinutes = Math.max(
      1,
      Math.round((Date.now() - new Date(activeDraft.startedAt).getTime()) / 60_000)
    );

    const newSession: WorkoutSession = {
      id: activeDraft.id,
      templateId: activeDraft.templateId,
      name: activeDraft.name.trim() || 'Тренировка',
      date: activeDraft.date || getTodayISODate(),
      startedAt: activeDraft.startedAt,
      finishedAt,
      durationMinutes,
      exercises: cleanedExercises,
      notes: activeDraft.notes,
    };

    const tonnage = Math.round(calculateSessionTonnage(newSession));
    const readyToProgress = cleanedExercises.filter(
      (ex) => evaluateDoubleProgression(ex).shouldIncreaseWeight
    ).length;

    setDb((prev) => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
    }));
    setActiveDraft(null);
    setActiveTab('history');

    const extra =
      readyToProgress > 0
        ? ` · Повысить вес в ${readyToProgress} упр.!`
        : '';
    showToast(`Тренировка сохранена: ${formatNumber(tonnage)} кг тоннажа${extra}`);
  };

  const handleDiscardWorkout = () => {
    setActiveDraft(null);
    showToast('Активная тренировка отменена.');
  };

  const handleSaveTemplate = (template: WorkoutTemplate) => {
    setDb((prev) => {
      const exists = prev.templates.some((t) => t.id === template.id);
      const templates = exists
        ? prev.templates.map((t) => (t.id === template.id ? template : t))
        : [...prev.templates, template];
      return { ...prev, templates };
    });
    showToast(`Шаблон «${template.name}» сохранён.`);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setDb((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== templateId),
    }));
    showToast('Шаблон удалён.');
  };

  const handleUpdateSession = (updated: WorkoutSession) => {
    setDb((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === updated.id ? updated : s)),
    }));
    showToast('Запись тренировки обновлена.');
  };

  const handleDeleteSession = (sessionId: string) => {
    setDb((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
    showToast('Тренировка удалена из истории.');
  };

  const handleLoadDemoData = () => {
    const demo = createDemoDatabase();
    setDb((prev) => ({
      ...demo,
      settings: prev.settings,
    }));
    showToast('Демо-данные загружены: 12 тренировок за 4 недели и 3 шаблона.');
  };

  const handleImportDatabase = (imported: AppDatabase) => {
    setDb(imported);
    showToast('База тренировок успешно восстановлена из JSON.');
  };

  const handleClearAllData = () => {
    setDb((prev) => ({
      ...prev,
      sessions: [],
    }));
  };

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: typeof Dumbbell;
    badge?: boolean;
  }> = [
    { id: 'workout', label: 'Тренировка', icon: Dumbbell, badge: Boolean(activeDraft) },
    { id: 'templates', label: 'Программы', icon: Layers },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'history', label: 'История', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d12] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0b0d12]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Dumbbell className="w-5 h-5 text-slate-950 stroke-[2.4]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-none">
                IronPulse
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                Workout & Progression
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-[#141822] border border-slate-800/90 p-1 rounded-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {db.sessions.length === 0 && (
              <button
                type="button"
                onClick={handleLoadDemoData}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Демо-данные
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDataModalOpen(true)}
              className="h-9 px-3 rounded-xl bg-[#141822] hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Данные / JSON</span>
              <span className="sm:hidden">JSON</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-4 sm:pt-6 pb-24 md:pb-10">
        {activeTab === 'workout' && (
          <ActiveWorkoutView
            draft={activeDraft}
            templates={db.templates}
            sessions={db.sessions}
            defaultWeightStep={db.settings.defaultWeightStep}
            onChangeWeightStep={handleChangeWeightStep}
            onStartFromTemplate={handleStartFromTemplate}
            onStartEmpty={handleStartEmpty}
            onUpdateDraft={setActiveDraft}
            onFinishWorkout={handleFinishWorkout}
            onDiscardWorkout={handleDiscardWorkout}
            onLoadDemoData={handleLoadDemoData}
            onGoToTemplates={() => setActiveTab('templates')}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesView
            templates={db.templates}
            sessions={db.sessions}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onStartTemplate={handleStartFromTemplate}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            sessions={db.sessions}
            templates={db.templates}
            onLoadDemoData={handleLoadDemoData}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            sessions={db.sessions}
            defaultWeightStep={db.settings.defaultWeightStep}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
            onLoadDemoData={handleLoadDemoData}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0e121b]/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1.5">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
                  isActive
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-1 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 rounded-2xl bg-[#161c2a] border border-emerald-500/40 shadow-2xl px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      {/* Data & Settings Modal */}
      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        db={db}
        onImportDatabase={handleImportDatabase}
        onLoadDemoData={handleLoadDemoData}
        onClearAllData={handleClearAllData}
        onChangeWeightStep={handleChangeWeightStep}
      />
    </div>
  );
}

export default App;
