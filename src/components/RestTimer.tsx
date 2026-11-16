import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, RotateCcw, Plus, Minus, Volume2, VolumeX, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { formatDuration } from '../utils/calculations';

export const RestTimer: React.FC = () => {
  const {
    restTimerSeconds,
    restTimerTotal,
    isRestTimerRunning,
    isRestTimerVisible,
    setRestTimerVisible,
    startRestTimer,
    pauseRestTimer,
    resetRestTimer,
    adjustRestTimer,
    data,
    updateSettings
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!isRestTimerVisible && restTimerSeconds === 0) {
    return null;
  }

  // Calculate progress percentage
  const progressPercent = restTimerTotal > 0 
    ? Math.min(100, Math.max(0, ((restTimerTotal - restTimerSeconds) / restTimerTotal) * 100))
    : 0;

  const presets = [60, 90, 120, 180];

  return (
    <div className={`fixed bottom-20 left-0 right-0 px-3 z-40 transition-all duration-300 pointer-events-none`}>
      <div className={`max-w-md mx-auto pointer-events-auto rounded-2xl glass-panel-elevated shadow-2xl border ${
        isRestTimerRunning ? 'border-emerald-500/50 timer-active-glow' : 'border-slate-700/60'
      } overflow-hidden transition-all duration-200`}>
        
        {/* Progress bar line on top */}
        <div className="w-full bg-slate-800/80 h-1.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-linear ${
              restTimerSeconds === 0 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Collapsed Bar / Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/60">
          <div 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="flex items-center gap-2.5 cursor-pointer select-none flex-1"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${isRestTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Таймер отдыха</span>
            <span className={`text-base font-mono font-bold ${
              restTimerSeconds === 0 ? 'text-amber-400 font-extrabold animate-bounce' : isRestTimerRunning ? 'text-emerald-400' : 'text-slate-200'
            }`}>
              {restTimerSeconds === 0 ? 'Отдых окончен!' : formatDuration(restTimerSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound toggle button */}
            <button
              onClick={() => updateSettings({ soundEnabled: !data.settings.soundEnabled })}
              className={`p-1.5 rounded-lg transition-colors ${
                data.settings.soundEnabled ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-500 hover:bg-slate-800'
              }`}
              title={data.settings.soundEnabled ? 'Звук включен' : 'Звук выключен'}
            >
              {data.settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Quick Play/Pause on header */}
            <button
              onClick={isRestTimerRunning ? pauseRestTimer : () => startRestTimer()}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              {isRestTimerRunning ? <Pause size={15} /> : <Play size={15} />}
            </button>

            {/* Expand / Collapse toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {isExpanded ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
            </button>

            {/* Close */}
            <button
              onClick={() => setRestTimerVisible(false)}
              className="p-1 text-slate-500 hover:text-slate-300 text-xs ml-1"
              title="Скрыть"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="p-3.5 space-y-3 bg-slate-900/90 border-t border-slate-800/80">
            {/* Quick preset buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map(sec => (
                <button
                  key={sec}
                  onClick={() => startRestTimer(sec)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${
                    restTimerTotal === sec && isRestTimerRunning
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                  }`}
                >
                  {sec} сек
                </button>
              ))}
            </div>

            {/* Fine adjustment +/- 15s and Play/Pause/Reset */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => adjustRestTimer(-15)}
                  disabled={restTimerSeconds <= 15}
                  className="flex items-center gap-0.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Minus size={13} /> 15с
                </button>
                <button
                  onClick={() => adjustRestTimer(15)}
                  className="flex items-center gap-0.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus size={13} /> 15с
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={resetRestTimer}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Сбросить таймер"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  onClick={isRestTimerRunning ? pauseRestTimer : () => startRestTimer()}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-md ${
                    isRestTimerRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isRestTimerRunning ? (
                    <>
                      <Pause size={14} /> Пауза
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Старт
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
