import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  Timer,
  Copy,
  Database,
  Sparkles,
  Info
} from 'lucide-react';
import { playTimerFinishSound, triggerVibration } from '../utils/audio';

export const SettingsView: React.FC = () => {
  const { 
    data, 
    updateSettings, 
    exportBackup, 
    importBackup, 
    resetAll 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Импорт данных...');
      await importBackup(file);
      setImportStatus('Данные успешно импортированы!');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка импорта';
      setImportStatus(`Ошибка: ${msg}`);
      setTimeout(() => setImportStatus(null), 4000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTestSound = () => {
    playTimerFinishSound(true);
    triggerVibration([200, 100, 200], true);
  };

  return (
    <div className="pb-28 pt-4 px-3 max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="text-emerald-400" size={22} /> Настройки и Резервные копии
        </h1>
        <p className="text-xs text-slate-400">Управление хранилищем, звуками и автозаполнением</p>
      </div>

      {/* BACKUP & RESTORE SECTION */}
      <div className="rounded-3xl glass-panel p-5 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-emerald-400" />
          <h2 className="text-base font-bold text-white">Резервное копирование и перенос</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Все ваши тренировки, замеры веса и прогресс сохраняются локально в вашем браузере. Вы можете экспортировать JSON файл для сохранения на диск или перенести прогресс на другое устройство.
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <Check size={16} /> {importStatus}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Export Button */}
          <button
            type="button"
            onClick={exportBackup}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-dark-950 transition-colors">
                <Download size={18} />
              </span>
              <span className="text-[10px] text-slate-500 font-mono">.JSON</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Экспорт данных (JSON)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Сохранить резервную копию</div>
            </div>
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/40 text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-dark-950 transition-colors">
                <Upload size={18} />
              </span>
              <span className="text-[10px] text-slate-500 font-mono">.JSON</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Импорт данных (JSON)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Восстановить из файла</div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* TIMER & AUDIO PREFERENCES */}
      <div className="rounded-3xl glass-panel p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer size={18} className="text-amber-400" />
            <h2 className="text-base font-bold text-white">Таймер отдыха и Сигналы</h2>
          </div>
          <button
            onClick={handleTestSound}
            className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <Volume2 size={13} /> Тест звука
          </button>
        </div>

        <div className="space-y-3 divide-y divide-slate-800/80">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-bold text-white">Звуковой сигнал</div>
              <div className="text-[11px] text-slate-400">
                Звуковой сигнал при завершении таймера отдыха и чекбоксе подхода
              </div>
            </div>
            <button
              onClick={() => updateSettings({ soundEnabled: !data.settings.soundEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                data.settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  data.settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vibration Toggle */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-bold text-white">Вибрация устройства</div>
              <div className="text-[11px] text-slate-400">
                Тактильный отклик при окончании отдыха
              </div>
            </div>
            <button
              onClick={() => updateSettings({ vibrationEnabled: !data.settings.vibrationEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                data.settings.vibrationEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  data.settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto-start Timer on Set Complete */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-bold text-white">Автозапуск таймера</div>
              <div className="text-[11px] text-slate-400">
                Автоматически запускать таймер отдыха при отметке подхода
              </div>
            </div>
            <button
              onClick={() => updateSettings({ autoStartRestTimer: !data.settings.autoStartRestTimer })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                data.settings.autoStartRestTimer ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  data.settings.autoStartRestTimer ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Default Rest Duration Preset */}
          <div className="pt-3">
            <div className="text-xs font-bold text-white mb-2">
              Время отдыха по умолчанию:
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[60, 90, 120, 180].map((sec) => (
                <button
                  key={sec}
                  onClick={() => updateSettings({ defaultRestSeconds: sec })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    data.settings.defaultRestSeconds === sec
                      ? 'bg-emerald-500 text-dark-950 border-emerald-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {sec} сек
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TRAINING PREFERENCES */}
      <div className="rounded-3xl glass-panel p-5 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-sky-400" />
          <h2 className="text-base font-bold text-white">Удобство в зале (One-Handed)</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">Автозаполнение из прошлой тренировки</div>
            <div className="text-[11px] text-slate-400">
              Подставлять рабочие веса и повторения с прошлого раза при старте
            </div>
          </div>
          <button
            onClick={() => updateSettings({ autoFillPreviousResults: !data.settings.autoFillPreviousResults })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              data.settings.autoFillPreviousResults ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                data.settings.autoFillPreviousResults ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* RESET TO FACTORY DEFAULTS */}
      <div className="rounded-3xl glass-panel p-5 border border-rose-900/30 space-y-3">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle size={18} />
          <h2 className="text-base font-bold text-white">Сброс данных</h2>
        </div>
        <p className="text-xs text-slate-400">
          Сброс вернет базовую Full-Body программу с 13 упражнениями и демо-историей, удалив все пользовательские изменения.
        </p>

        <button
          onClick={() => setShowResetModal(true)}
          className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={15} /> Сбросить данные к начальным
        </button>
      </div>

      {/* CONFIRM RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-white">Подтверждение сброса</h3>
            </div>
            <p className="text-xs text-slate-300">
              Вы уверены? Рекомендуем предварительно сделать «Экспорт данных (JSON)».
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  resetAll();
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Да, сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
