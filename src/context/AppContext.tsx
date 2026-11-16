import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  AppData, 
  WorkoutSession, 
  WorkoutExercise, 
  WorkoutSet, 
  ExerciseDefinition, 
  UserProfile, 
  BodyMeasurements, 
  AppSettings,
  WorkoutTemplate,
  TemplateExercise
} from '../types';
import { loadAppData, saveAppData, exportDataAsJSON, importDataFromJSON, resetToDefaults } from '../utils/storage';
import { DEFAULT_TEMPLATES } from '../utils/defaultData';
import { checkProgression, getPreviousExerciseSets, calculateWorkoutTonnage } from '../utils/calculations';
import { playTimerFinishSound, playSetCompleteSound, triggerVibration } from '../utils/audio';
import confetti from 'canvas-confetti';

export type TabType = 'workout' | 'calendar' | 'templates' | 'history' | 'profile';

interface AppContextType {
  data: AppData;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Selected date for calendar
  selectedCalendarDate: string;
  setSelectedCalendarDate: (date: string) => void;

  // Active live workout actions
  startWorkout: (templateId?: string) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  addExerciseToActiveWorkout: (def: ExerciseDefinition) => void;
  removeExerciseFromActiveWorkout: (workoutExerciseId: string) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  addSet: (workoutExerciseId: string) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  toggleSetComplete: (workoutExerciseId: string, setId: string) => void;
  
  // Calendar & History actions (save retroactive / custom workout)
  saveWorkoutForDate: (workout: WorkoutSession) => void;
  deleteWorkoutFromHistory: (workoutId: string) => void;

  // Template management actions
  updateTemplate: (templateId: string, updates: Partial<WorkoutTemplate>) => void;
  addExerciseToTemplate: (templateId: string, exercise: ExerciseDefinition) => void;
  removeExerciseFromTemplate: (templateId: string, templateExerciseId: string) => void;
  updateTemplateExercise: (templateId: string, templateExerciseId: string, updates: Partial<TemplateExercise>) => void;
  reorderTemplateExercises: (templateId: string, fromIndex: number, toIndex: number) => void;
  resetTemplateToDefault: (templateId: string) => void;

  // Rest Timer
  restTimerSeconds: number;
  restTimerTotal: number;
  isRestTimerRunning: boolean;
  isRestTimerVisible: boolean;
  setRestTimerVisible: (visible: boolean) => void;
  startRestTimer: (seconds?: number) => void;
  pauseRestTimer: () => void;
  resetRestTimer: () => void;
  adjustRestTimer: (deltaSeconds: number) => void;

  // Profile actions
  updateProfile: (profile: Partial<UserProfile>) => void;
  addWeightEntry: (weight: number, date?: string, note?: string) => void;
  deleteWeightEntry: (id: string) => void;
  addMeasurementEntry: (m: Omit<BodyMeasurements, 'id'>) => void;
  deleteMeasurementEntry: (id: string) => void;

  // Settings & Storage
  updateSettings: (settings: Partial<AppSettings>) => void;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<void>;
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(data.settings.defaultRestSeconds);
  const [restTimerTotal, setRestTimerTotal] = useState<number>(data.settings.defaultRestSeconds);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState<boolean>(false);
  const [isRestTimerVisible, setRestTimerVisible] = useState<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Workout duration counter
  const workoutDurationIntervalRef = useRef<number | null>(null);

  // Sync to localStorage whenever data changes
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // Workout timer ticking
  useEffect(() => {
    if (data.activeWorkout && !data.activeWorkout.isCompleted) {
      if (!workoutDurationIntervalRef.current) {
        workoutDurationIntervalRef.current = window.setInterval(() => {
          setData(prev => {
            if (!prev.activeWorkout || prev.activeWorkout.isCompleted) return prev;
            return {
              ...prev,
              activeWorkout: {
                ...prev.activeWorkout,
                durationSeconds: prev.activeWorkout.durationSeconds + 1
              }
            };
          });
        }, 1000);
      }
    } else {
      if (workoutDurationIntervalRef.current) {
        clearInterval(workoutDurationIntervalRef.current);
        workoutDurationIntervalRef.current = null;
      }
    }

    return () => {
      if (workoutDurationIntervalRef.current) {
        clearInterval(workoutDurationIntervalRef.current);
        workoutDurationIntervalRef.current = null;
      }
    };
  }, [Boolean(data.activeWorkout)]);

  // Rest Timer ticking
  useEffect(() => {
    if (isRestTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setRestTimerSeconds(prev => {
          if (prev <= 1) {
            setIsRestTimerRunning(false);
            playTimerFinishSound(data.settings.soundEnabled);
            triggerVibration([300, 150, 300, 150, 500], data.settings.vibrationEnabled);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRestTimerRunning, data.settings.soundEnabled, data.settings.vibrationEnabled]);

  // Start rest timer
  const startRestTimer = useCallback((seconds?: number) => {
    const dur = seconds !== undefined ? seconds : (restTimerSeconds > 0 ? restTimerSeconds : data.settings.defaultRestSeconds);
    setRestTimerSeconds(dur);
    setRestTimerTotal(dur);
    setIsRestTimerRunning(true);
    setRestTimerVisible(true);
  }, [restTimerSeconds, data.settings.defaultRestSeconds]);

  const pauseRestTimer = useCallback(() => {
    setIsRestTimerRunning(false);
  }, []);

  const resetRestTimer = useCallback(() => {
    setIsRestTimerRunning(false);
    setRestTimerSeconds(data.settings.defaultRestSeconds);
    setRestTimerTotal(data.settings.defaultRestSeconds);
  }, [data.settings.defaultRestSeconds]);

  const adjustRestTimer = useCallback((deltaSeconds: number) => {
    setRestTimerSeconds(prev => {
      const next = Math.max(0, prev + deltaSeconds);
      setRestTimerTotal(Math.max(next, restTimerTotal));
      return next;
    });
    setRestTimerVisible(true);
  }, [restTimerTotal]);

  // Start new live workout session from chosen template
  const startWorkout = useCallback((templateId?: string) => {
    const targetTemplateId = templateId || 'template-day-a';
    const template = data.templates.find(t => t.id === targetTemplateId) || data.templates[0];

    const newExercises: WorkoutExercise[] = template.exercises.map(tex => {
      const progression = checkProgression(tex.exerciseId, tex.minReps, tex.maxReps, data.workoutHistory);
      const prevSets = getPreviousExerciseSets(tex.exerciseId, data.workoutHistory);

      const sets: WorkoutSet[] = Array.from({ length: tex.targetSets }, (_, i) => {
        const prevSet = prevSets && prevSets[i] ? prevSets[i] : (prevSets && prevSets[0] ? prevSets[0] : null);
        return {
          id: `set-${Date.now()}-${tex.exerciseId}-${i + 1}`,
          setNumber: i + 1,
          weight: data.settings.autoFillPreviousResults && prevSet ? prevSet.weight : 0,
          reps: data.settings.autoFillPreviousResults && prevSet ? prevSet.reps : tex.minReps,
          completed: false,
          previousWeight: prevSet ? prevSet.weight : undefined,
          previousReps: prevSet ? prevSet.reps : undefined
        };
      });

      return {
        id: `we-${Date.now()}-${tex.exerciseId}`,
        exerciseId: tex.exerciseId,
        name: tex.name,
        category: tex.category,
        minReps: tex.minReps,
        maxReps: tex.maxReps,
        sets,
        readyForProgression: progression.isReady,
        progressionReason: progression.reason
      };
    });

    const todayDate = new Date().toISOString().split('T')[0];
    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      templateId: template.id,
      title: template.name,
      date: todayDate,
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      exercises: newExercises,
      totalTonnageKg: 0,
      isCompleted: false
    };

    setData(prev => ({
      ...prev,
      activeWorkout: newSession
    }));
    setActiveTab('workout');
  }, [data.templates, data.workoutHistory, data.settings]);

  // Finish active live workout
  const finishWorkout = useCallback(() => {
    if (!data.activeWorkout) return;

    const tonnage = calculateWorkoutTonnage(data.activeWorkout.exercises);
    const completedSession: WorkoutSession = {
      ...data.activeWorkout,
      endedAt: new Date().toISOString(),
      totalTonnageKg: tonnage,
      isCompleted: true
    };

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    setData(prev => {
      // If a workout on the same day with same id exists, replace; else prepend
      const filtered = prev.workoutHistory.filter(w => w.id !== completedSession.id);
      const updatedHistory = [completedSession, ...filtered].sort(
        (a, b) => new Date(b.date || b.startedAt).getTime() - new Date(a.date || a.startedAt).getTime()
      );
      return {
        ...prev,
        activeWorkout: null,
        workoutHistory: updatedHistory
      };
    });

    setIsRestTimerRunning(false);
    setRestTimerVisible(false);
    setActiveTab('history');
  }, [data.activeWorkout]);

  // Cancel active workout
  const cancelWorkout = useCallback(() => {
    setData(prev => ({
      ...prev,
      activeWorkout: null
    }));
    setIsRestTimerRunning(false);
    setRestTimerVisible(false);
  }, []);

  // Add exercise to active live workout
  const addExerciseToActiveWorkout = useCallback((def: ExerciseDefinition) => {
    if (!data.activeWorkout) return;

    const progression = checkProgression(def.id, def.minReps, def.maxReps, data.workoutHistory);
    const prevSets = getPreviousExerciseSets(def.id, data.workoutHistory);

    const sets: WorkoutSet[] = Array.from({ length: def.targetSets }, (_, i) => {
      const prevSet = prevSets && prevSets[i] ? prevSets[i] : (prevSets && prevSets[0] ? prevSets[0] : null);
      return {
        id: `set-${Date.now()}-${def.id}-${i + 1}`,
        setNumber: i + 1,
        weight: prevSet ? prevSet.weight : 0,
        reps: prevSet ? prevSet.reps : def.minReps,
        completed: false,
        previousWeight: prevSet ? prevSet.weight : undefined,
        previousReps: prevSet ? prevSet.reps : undefined
      };
    });

    const newEx: WorkoutExercise = {
      id: `we-${Date.now()}-${def.id}`,
      exerciseId: def.id,
      name: def.name,
      category: def.category,
      minReps: def.minReps,
      maxReps: def.maxReps,
      sets,
      readyForProgression: progression.isReady,
      progressionReason: progression.reason
    };

    setData(prev => {
      if (!prev.activeWorkout) return prev;
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: [...prev.activeWorkout.exercises, newEx]
        }
      };
    });
  }, [data.activeWorkout, data.workoutHistory]);

  const removeExerciseFromActiveWorkout = useCallback((workoutExerciseId: string) => {
    setData(prev => {
      if (!prev.activeWorkout) return prev;
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: prev.activeWorkout.exercises.filter(e => e.id !== workoutExerciseId)
        }
      };
    });
  }, []);

  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
    setData(prev => {
      if (!prev.activeWorkout) return prev;
      const list = [...prev.activeWorkout.exercises];
      if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
        return prev;
      }
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: list
        }
      };
    });
  }, []);

  const addSet = useCallback((workoutExerciseId: string) => {
    setData(prev => {
      if (!prev.activeWorkout) return prev;
      const updatedExercises = prev.activeWorkout.exercises.map(ex => {
        if (ex.id !== workoutExerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `set-${Date.now()}-${ex.exerciseId}-${ex.sets.length + 1}`,
          setNumber: ex.sets.length + 1,
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : ex.minReps,
          completed: false,
          previousWeight: lastSet ? lastSet.previousWeight : undefined,
          previousReps: lastSet ? lastSet.previousReps : undefined
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      });
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: updatedExercises
        }
      };
    });
  }, []);

  const removeSet = useCallback((workoutExerciseId: string, setId: string) => {
    setData(prev => {
      if (!prev.activeWorkout) return prev;
      const updatedExercises = prev.activeWorkout.exercises.map(ex => {
        if (ex.id !== workoutExerciseId) return ex;
        const filtered = ex.sets.filter(s => s.id !== setId);
        const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return {
          ...ex,
          sets: renumbered
        };
      });
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: updatedExercises
        }
      };
    });
  }, []);

  const updateSet = useCallback((workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    setData(prev => {
      if (!prev.activeWorkout) return prev;
      const updatedExercises = prev.activeWorkout.exercises.map(ex => {
        if (ex.id !== workoutExerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(s => (s.id === setId ? { ...s, ...updates } : s))
        };
      });
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: updatedExercises
        }
      };
    });
  }, []);

  const toggleSetComplete = useCallback((workoutExerciseId: string, setId: string) => {
    setData(prev => {
      if (!prev.activeWorkout) return prev;
      let newlyCompleted = false;

      const updatedExercises = prev.activeWorkout.exercises.map(ex => {
        if (ex.id !== workoutExerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(s => {
            if (s.id === setId) {
              const nextState = !s.completed;
              if (nextState) newlyCompleted = true;
              return {
                ...s,
                completed: nextState,
                completedAt: nextState ? new Date().toISOString() : undefined
              };
            }
            return s;
          })
        };
      });

      if (newlyCompleted) {
        playSetCompleteSound(prev.settings.soundEnabled);
        triggerVibration([100], prev.settings.vibrationEnabled);

        if (prev.settings.autoStartRestTimer) {
          setTimeout(() => {
            startRestTimer(prev.settings.defaultRestSeconds);
          }, 150);
        }
      }

      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: updatedExercises
        }
      };
    });
  }, [startRestTimer]);

  // Calendar / Retroactive workout save
  const saveWorkoutForDate = useCallback((workout: WorkoutSession) => {
    const tonnage = calculateWorkoutTonnage(workout.exercises);
    const sessionToSave: WorkoutSession = {
      ...workout,
      totalTonnageKg: tonnage,
      isCompleted: true
    };

    setData(prev => {
      // Remove any existing workout with same ID
      const filtered = prev.workoutHistory.filter(w => w.id !== sessionToSave.id);
      const updated = [sessionToSave, ...filtered].sort(
        (a, b) => new Date(b.date || b.startedAt).getTime() - new Date(a.date || a.startedAt).getTime()
      );
      return {
        ...prev,
        workoutHistory: updated
      };
    });
  }, []);

  // Delete workout from history
  const deleteWorkoutFromHistory = useCallback((workoutId: string) => {
    setData(prev => ({
      ...prev,
      workoutHistory: prev.workoutHistory.filter(w => w.id !== workoutId)
    }));
  }, []);

  // Template management actions
  const updateTemplate = useCallback((templateId: string, updates: Partial<WorkoutTemplate>) => {
    setData(prev => ({
      ...prev,
      templates: prev.templates.map(t => (t.id === templateId ? { ...t, ...updates } : t))
    }));
  }, []);

  const addExerciseToTemplate = useCallback((templateId: string, exercise: ExerciseDefinition) => {
    setData(prev => {
      const template = prev.templates.find(t => t.id === templateId);
      if (!template) return prev;

      const newTemplateEx: TemplateExercise = {
        id: `te-${Date.now()}-${exercise.id}`,
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        targetSets: exercise.targetSets,
        minReps: exercise.minReps,
        maxReps: exercise.maxReps,
        defaultRestSeconds: exercise.defaultRestSeconds || 90
      };

      return {
        ...prev,
        templates: prev.templates.map(t =>
          t.id === templateId ? { ...t, exercises: [...t.exercises, newTemplateEx] } : t
        )
      };
    });
  }, []);

  const removeExerciseFromTemplate = useCallback((templateId: string, templateExerciseId: string) => {
    setData(prev => ({
      ...prev,
      templates: prev.templates.map(t =>
        t.id === templateId
          ? { ...t, exercises: t.exercises.filter(e => e.id !== templateExerciseId) }
          : t
      )
    }));
  }, []);

  const updateTemplateExercise = useCallback(
    (templateId: string, templateExerciseId: string, updates: Partial<TemplateExercise>) => {
      setData(prev => ({
        ...prev,
        templates: prev.templates.map(t =>
          t.id === templateId
            ? {
                ...t,
                exercises: t.exercises.map(e => (e.id === templateExerciseId ? { ...e, ...updates } : e))
              }
            : t
        )
      }));
    },
    []
  );

  const reorderTemplateExercises = useCallback((templateId: string, fromIndex: number, toIndex: number) => {
    setData(prev => {
      const template = prev.templates.find(t => t.id === templateId);
      if (!template) return prev;

      const list = [...template.exercises];
      if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
        return prev;
      }
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);

      return {
        ...prev,
        templates: prev.templates.map(t => (t.id === templateId ? { ...t, exercises: list } : t))
      };
    });
  }, []);

  const resetTemplateToDefault = useCallback((templateId: string) => {
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (!defaultTemplate) return;

    setData(prev => ({
      ...prev,
      templates: prev.templates.map(t => (t.id === templateId ? JSON.parse(JSON.stringify(defaultTemplate)) : t))
    }));
  }, []);

  // Profile actions
  const updateProfile = useCallback((profileUpdates: Partial<UserProfile>) => {
    setData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...profileUpdates
      }
    }));
  }, []);

  const addWeightEntry = useCallback((weight: number, date?: string, note?: string) => {
    const entryDate = date || new Date().toISOString().split('T')[0];
    const newEntry = {
      id: `w-${Date.now()}`,
      date: entryDate,
      weight,
      note
    };

    setData(prev => {
      const history = [...prev.profile.weightHistory.filter(w => w.date !== entryDate), newEntry]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return {
        ...prev,
        profile: {
          ...prev.profile,
          currentWeight: weight,
          weightHistory: history
        }
      };
    });
  }, []);

  const deleteWeightEntry = useCallback((id: string) => {
    setData(prev => {
      const filtered = prev.profile.weightHistory.filter(w => w.id !== id);
      const latest = filtered[filtered.length - 1];
      return {
        ...prev,
        profile: {
          ...prev.profile,
          currentWeight: latest ? latest.weight : prev.profile.currentWeight,
          weightHistory: filtered
        }
      };
    });
  }, []);

  const addMeasurementEntry = useCallback((m: Omit<BodyMeasurements, 'id'>) => {
    const newEntry: BodyMeasurements = {
      ...m,
      id: `m-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        measurementsHistory: [...prev.profile.measurementsHistory, newEntry]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }
    }));
  }, []);

  const deleteMeasurementEntry = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        measurementsHistory: prev.profile.measurementsHistory.filter(m => m.id !== id)
      }
    }));
  }, []);

  // Settings
  const updateSettings = useCallback((settingsUpdates: Partial<AppSettings>) => {
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settingsUpdates
      }
    }));
  }, []);

  const exportBackup = useCallback(() => {
    exportDataAsJSON(data);
  }, [data]);

  const importBackup = useCallback(async (file: File) => {
    const imported = await importDataFromJSON(file);
    setData(imported);
  }, []);

  const resetAll = useCallback(() => {
    const def = resetToDefaults();
    setData(def);
    setIsRestTimerRunning(false);
    setRestTimerVisible(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        selectedCalendarDate,
        setSelectedCalendarDate,
        startWorkout,
        finishWorkout,
        cancelWorkout,
        addExerciseToActiveWorkout,
        removeExerciseFromActiveWorkout,
        reorderExercises,
        addSet,
        removeSet,
        updateSet,
        toggleSetComplete,
        saveWorkoutForDate,
        deleteWorkoutFromHistory,
        updateTemplate,
        addExerciseToTemplate,
        removeExerciseFromTemplate,
        updateTemplateExercise,
        reorderTemplateExercises,
        resetTemplateToDefault,
        restTimerSeconds,
        restTimerTotal,
        isRestTimerRunning,
        isRestTimerVisible,
        setRestTimerVisible,
        startRestTimer,
        pauseRestTimer,
        resetRestTimer,
        adjustRestTimer,
        updateProfile,
        addWeightEntry,
        deleteWeightEntry,
        addMeasurementEntry,
        deleteMeasurementEntry,
        updateSettings,
        exportBackup,
        importBackup,
        resetAll
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
