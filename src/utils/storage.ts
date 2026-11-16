import { AppData } from '../types';
import { INITIAL_APP_DATA } from './defaultData';

const STORAGE_KEY = 'rus_iron_tracker_data_v1';

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAppData(INITIAL_APP_DATA);
      return INITIAL_APP_DATA;
    }
    const parsed = JSON.parse(raw) as Partial<AppData>;
    
    // Ensure backwards compatibility and all required fields exist
    return {
      version: parsed.version || 1,
      profile: parsed.profile || INITIAL_APP_DATA.profile,
      exercises: parsed.exercises && parsed.exercises.length > 0 ? parsed.exercises : INITIAL_APP_DATA.exercises,
      activeWorkout: parsed.activeWorkout || null,
      workoutHistory: parsed.workoutHistory || INITIAL_APP_DATA.workoutHistory,
      settings: {
        ...INITIAL_APP_DATA.settings,
        ...(parsed.settings || {})
      }
    };
  } catch (err) {
    console.error('Failed to load app data from localStorage:', err);
    return INITIAL_APP_DATA;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save app data to localStorage:', err);
  }
}

export function exportDataAsJSON(data: AppData): void {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `iron-tracker-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export data:', err);
    alert('Ошибка при экспорте данных');
  }
}

export function importDataFromJSON(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as AppData;
        
        // Basic validation
        if (!parsed || !parsed.exercises || !parsed.profile) {
          throw new Error('Некорректный формат файла резервной копии');
        }

        saveAppData(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}

export function resetToDefaults(): AppData {
  saveAppData(INITIAL_APP_DATA);
  return INITIAL_APP_DATA;
}
