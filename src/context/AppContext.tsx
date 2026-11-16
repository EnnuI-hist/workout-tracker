import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppData, WorkoutSession, WorkoutExercise, WorkoutSet, ExerciseDefinition, UserProfile, BodyMeasurements, AppSettings } from '../types';
import { loadAppData, saveAppData, exportDataAsJSON, importDataFromJSON, resetToDefaults } from '../utils/storage';
import { checkProgression, getPreviousExerciseSets, calculateWorkoutTonnage } from '../utils/calculations';
import { playTimerFinishSound, playSetCompleteSound, triggerVibration } from '../utils/audio';
import confetti from 'canvas-confetti';

export type TabType = 'workout' | 'history' | 'profile' | 'settings';

interface AppContextType {
  data: AppData;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Active workout actions
  startWorkout: () => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  addExerciseToActiveWorkout: (def: ExerciseDefinition) => void;
  removeExerciseFromActiveWorkout: (workoutExerciseId: string) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  addSet: (workoutExerciseId: string) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  toggleSetComplete: (workoutExerciseId: string, setId: string) => void;
  deleteWorkoutFromHistory: (workoutId: string) => void;

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
            // Timer finished!
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

  // Start new workout session from template
  const startWorkout = useCallback(() => {
    const newExercises: WorkoutExercise[] = data.exercises.map(ex => {
      // Check progression & previous sets
      const progression = checkProgression(ex.id, ex.minReps, ex.maxReps, data.workoutHistory);
      const prevSets = getPreviousExerciseSets(ex.id, data.workoutHistory);

      // Create target sets with prefilled previous hints
      const sets: WorkoutSet[] = Array.from({ length: ex.targetSets }, (_, i) => {
        const prevSet = prevSets && prevSets[i] ? prevSets[i] : (prevSets && prevSets[0] ? prevSets[0] : null);
        return {
          id: `set-${Date.now()}-${ex.id}-${i + 1}`,
          setNumber: i + 1,
          weight: data.settings.autoFillPreviousResults && prevSet ? prevSet.weight : 0,
          reps: data.settings.autoFillPreviousResults && prevSet ? prevSet.reps : ex.minReps,
          completed: false,
          previousWeight: prevSet ? prevSet.weight : undefined,
          previousReps: prevSet ? prevSet.reps : undefined
        };
      });

      return {
        id: `we-${Date.now()}-${ex.id}`,
        exerciseId: ex.id,
        name: ex.name,
        category: ex.category,
        minReps: ex.minReps,
        maxReps: ex.maxReps,
        sets,
        readyForProgression: progression.isReady,
        progressionReason: progression.reason
      };
    });

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      title: 'Full-Body Силовая',
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
  }, [data.exercises, data.workoutHistory, data.settings]);

  // Finish active workout
  const finishWorkout = useCallback(() => {
    if (!data.activeWorkout) return;

    const tonnage = calculateWorkoutTonnage(data.activeWorkout.exercises);
    const completedSession: WorkoutSession = {
      ...data.activeWorkout,
      endedAt: new Date().toISOString(),
      totalTonnageKg: tonnage,
      isCompleted: true
    };

    // Confetti celebration!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    setData(prev => ({
      ...prev,
      activeWorkout: null,
      workoutHistory: [completedSession, ...prev.workoutHistory]
    }));

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

  // Add exercise to active workout
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

  // Remove exercise from active workout
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

  // Reorder exercises in active workout
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

  // Add set to exercise in active workout
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

  // Remove set from exercise in active workout
  const removeSet = useCallback((workoutExerciseId: string, setId: string) => {
    setData(prev => {
      if (!prev.activeWorkout) return prev;
      const updatedExercises = prev.activeWorkout.exercises.map(ex => {
        if (ex.id !== workoutExerciseId) return ex;
        const filtered = ex.sets.filter(s => s.id !== setId);
        // Renumber sets
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

  // Update set values
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

  // Toggle set completed checkbox
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
              if (nextState) {
                newlyCompleted = true;
              }
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

  // Delete workout from history
  const deleteWorkoutFromHistory = useCallback((workoutId: string) => {
    setData(prev => ({
      ...prev,
      workoutHistory: prev.workoutHistory.filter(w => w.id !== workoutId)
    }));
  }, []);

  // Profile management
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
        deleteWorkoutFromHistory,
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
