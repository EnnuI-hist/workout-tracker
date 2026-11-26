import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Database,
  Dumbbell,
  PenLine,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { DataModal } from './components/DataModal.tsx';
import { JournalView } from './components/JournalView.tsx';
import { WorkoutEntryForm } from './components/WorkoutEntryForm.tsx';
import type {
  AppDatabase,
  NavTab,
  ProgramExercise,
  WorkoutDraftState,
  WorkoutEntry,
  WorkoutProgram,
} from './types/workout.ts';
import { createDraftExercises, generateId, getTodayISO } from './utils/calculations.ts';
import { DEFAULT_PROGRAM } from './utils/defaultProgram.ts';
import {
  loadDatabase,
  loadEntryDraft,
  saveDatabase,
  saveEntryDraft,
} from './utils/storage.ts';

function buildFreshDraft(program: ProgramExercise[], entries: WorkoutEntry[]): WorkoutDraftState {
  return {
    date: getTodayISO(),
    notes: '',
    exercises: createDraftExercises(program, entries),
    textMode: false,
    rawText: '',
  };
}

function syncDraftExercises(
  prevDraft: WorkoutDraftState,
  nextProgram: ProgramExercise[],
  entries: WorkoutEntry[]
): WorkoutDraftState {
  const existingByName = new Map(
    prevDraft.exercises
      .filter((ex) => ex.sets.some((s) => s.reps.trim().length > 0))
      .map((ex) => [ex.name.trim().toLowerCase(), ex])
  );
  const fresh = createDraftExercises(nextProgram, entries);
  const merged = fresh.map((row) => existingByName.get(row.name.trim().toLowerCase()) ?? row);
  return {
    ...prevDraft,
    exercises: merged,
  };
}

export function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [draft, setDraft] = useState<WorkoutDraftState>(() => {
    const saved = loadEntryDraft();
    if (saved) {
      const hasEnteredReps = saved.exercises.some((ex) =>
        ex.sets.some((s) => s.reps.trim().length > 0)
      );
      if (hasEnteredReps || saved.rawText.trim().length > 0 || db.program.length > 0) {
        return {
          ...saved,
          date: saved.date || getTodayISO(),
        };
      }
    }
    return buildFreshDraft(db.program, db.entries);
  });
  const [activeTab, setActiveTab] = useState<NavTab>('entry');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  useEffect(() => {
    saveEntryDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message: string) => setToast(message), []);

  /* ─── Handlers ─── */

  const handleSaveEntry = useCallback(
    (entry: WorkoutEntry) => {
      const nextEntries = [entry, ...db.entries];
      setDb((prev) => ({
        ...prev,
        entries: [entry, ...prev.entries],
      }));
      setDraft(buildFreshDraft(db.program, nextEntries));
      showToast('Тренировка сохранена ✓');
      setActiveTab('journal');
    },
    [db.entries, db.program, showToast]
  );

  const handleUpdateEntry = useCallback(
    (updated: WorkoutEntry) => {
      setDb((prev) => ({
        ...prev,
        entries: prev.entries.map((e) => (e.id === updated.id ? updated : e)),
      }));
      showToast('Запись обновлена.');
    },
    [showToast]
  );

  const handleDeleteEntry = useCallback(
    (id: string) => {
      setDb((prev) => ({
        ...prev,
        entries: prev.entries.filter((e) => e.id !== id),
      }));
      showToast('Запись удалена.');
    },
    [showToast]
  );

  const handleImportDatabase = useCallback(
    (imported: AppDatabase) => {
      setDb(imported);
      setDraft(buildFreshDraft(imported.program, imported.entries));
      showToast('База тренировок восстановлена из JSON.');
    },
    [showToast]
  );

  const handleSelectProgram = useCallback(
    (programId: string) => {
      const target = db.programs.find((p) => p.id === programId);
      if (!target) return;
      setDb((prev) => ({
        ...prev,
        activeProgramId: target.id,
        program: target.exercises,
      }));
      setDraft((prevDraft) => ({
        ...prevDraft,
        exercises: createDraftExercises(target.exercises, db.entries),
      }));
    },
    [db.entries, db.programs]
  );

  const handleCreateProgram = useCallback((name: string) => {
    const newProg: WorkoutProgram = {
      id: generateId(),
      name: name.trim() || 'Новая программа',
      exercises: [],
    };
    setDb((prev) => ({
      ...prev,
      programs: [...prev.programs, newProg],
      activeProgramId: newProg.id,
      program: [],
    }));
    setDraft((prevDraft) => ({
      ...prevDraft,
      exercises: [],
    }));
  }, []);

  const handleRenameProgram = useCallback((programId: string, name: string) => {
    setDb((prev) => ({
      ...prev,
      programs: prev.programs.map((p) => (p.id === programId ? { ...p, name } : p)),
    }));
  }, []);

  const handleDeleteProgram = useCallback(
    (programId: string) => {
      const remaining = db.programs.filter((p) => p.id !== programId);
      const nextActive =
        db.activeProgramId === programId
          ? remaining[0] ?? null
          : remaining.find((p) => p.id === db.activeProgramId) ?? remaining[0] ?? null;
      const nextExercises = nextActive ? nextActive.exercises : [];

      setDb((prev) => ({
        ...prev,
        programs: remaining,
        activeProgramId: nextActive ? nextActive.id : null,
        program: nextExercises,
      }));
      setDraft((prevDraft) => ({
        ...prevDraft,
        exercises: createDraftExercises(nextExercises, db.entries),
      }));
    },
    [db.activeProgramId, db.entries, db.programs]
  );

  const handleUpdateProgram = useCallback(
    (nextExercises: ProgramExercise[]) => {
      const currentActiveId = db.activeProgramId ?? db.programs[0]?.id ?? null;

      if (!currentActiveId) {
        const created: WorkoutProgram = {
          id: generateId(),
          name: 'Моя программа',
          exercises: nextExercises,
        };
        setDb((prev) => ({
          ...prev,
          programs: [created],
          activeProgramId: created.id,
          program: nextExercises,
        }));
      } else {
        setDb((prev) => ({
          ...prev,
          programs: prev.programs.map((p) =>
            p.id === currentActiveId ? { ...p, exercises: nextExercises } : p
          ),
          activeProgramId: currentActiveId,
          program: nextExercises,
        }));
      }

      setDraft((prevDraft) => syncDraftExercises(prevDraft, nextExercises, db.entries));
    },
    [db.activeProgramId, db.entries, db.programs]
  );

  const handleResetProgram = useCallback(() => {
    const defaultExercises = DEFAULT_PROGRAM.map((p) => ({ ...p }));
    const defaultName = 'Full-Body (13 упр.)';
    const existingDefault = db.programs.find(
      (p) => p.name.trim().toLowerCase() === defaultName.toLowerCase()
    );

    if (existingDefault) {
      setDb((prev) => ({
        ...prev,
        programs: prev.programs.map((p) =>
          p.id === existingDefault.id ? { ...p, exercises: defaultExercises } : p
        ),
        activeProgramId: existingDefault.id,
        program: defaultExercises,
      }));
    } else {
      const created: WorkoutProgram = {
        id: generateId(),
        name: defaultName,
        exercises: defaultExercises,
      };
      setDb((prev) => ({
        ...prev,
        programs: [...prev.programs, created],
        activeProgramId: created.id,
        program: defaultExercises,
      }));
    }

    setDraft((prevDraft) => ({
      ...prevDraft,
      exercises: createDraftExercises(defaultExercises, db.entries),
    }));
    showToast('Загружена базовая программа (13 упр. Full-Body).');
  }, [db.entries, db.programs, showToast]);

  const handleClearEntries = useCallback(() => {
    setDb((prev) => ({
      ...prev,
      entries: [],
    }));
    setDraft(buildFreshDraft(db.program, []));
  }, [db.program]);

  const handleChangeWeightStep = useCallback((step: 1.25 | 2.5) => {
    setDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, weightStep: step },
    }));
  }, []);

  /* ─── Nav ─── */

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: typeof Dumbbell;
    badge?: number;
  }> = [
    { id: 'entry', label: 'Запись', icon: PenLine },
    { id: 'journal', label: 'Журнал', icon: BookOpen, badge: db.entries.length || undefined },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#090d16]/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
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
                Дневник тренировок
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-[#111827] border border-white/10 p-1 rounded-xl">
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
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                        isActive ? 'bg-blue-500/60 text-white' : 'bg-[#0b0f19] text-slate-300 border border-white/10'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDataModalOpen(true)}
              className="h-9 px-3 rounded-xl bg-[#111827] hover:bg-[#172033] border border-white/10 hover:border-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Программа / JSON</span>
              <span className="sm:hidden">JSON</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 pb-24 md:pb-12">
        {activeTab === 'entry' && (
          <WorkoutEntryForm
            program={db.program}
            entries={db.entries}
            weightStep={db.settings.weightStep}
            draft={draft}
            onChangeDraft={setDraft}
            onLoadDefaultProgram={handleResetProgram}
            onSave={handleSaveEntry}
            onNotify={showToast}
          />
        )}

        {activeTab === 'journal' && (
          <JournalView
            entries={db.entries}
            program={db.program}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onNotify={showToast}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView entries={db.entries} program={db.program} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#090d16]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5">
        <div className="grid grid-cols-3 gap-1 max-w-md mx-auto">
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
                    ? 'text-blue-400 bg-blue-500/12'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center tabular-nums">
                      {item.badge}
                    </span>
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
        <div className="animate-toast-in fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 rounded-2xl bg-[#111827] border border-emerald-400/40 shadow-2xl shadow-black/50 px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-100">
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
        onSelectProgram={handleSelectProgram}
        onCreateProgram={handleCreateProgram}
        onRenameProgram={handleRenameProgram}
        onDeleteProgram={handleDeleteProgram}
        onUpdateProgram={handleUpdateProgram}
        onResetProgram={handleResetProgram}
        onClearEntries={handleClearEntries}
        onChangeWeightStep={handleChangeWeightStep}
      />
    </div>
  );
}

export default App;
