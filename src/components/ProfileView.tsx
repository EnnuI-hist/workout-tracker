import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { 
  User, 
  Scale, 
  Target, 
  Plus, 
  Ruler, 
  Trash2, 
  TrendingUp, 
  Check,
  Settings,
  Database
} from 'lucide-react';
import { SettingsView } from './SettingsView';

export const ProfileView: React.FC = () => {
  const { 
    data, 
    updateProfile, 
    addWeightEntry, 
    deleteWeightEntry, 
    addMeasurementEntry, 
    deleteMeasurementEntry 
  } = useApp();

  const [profileSubTab, setProfileSubTab] = useState<'body' | 'settings'>('body');
  const profile = data.profile;

  // New weight entry form state
  const [newWeight, setNewWeight] = useState<string>(profile.currentWeight.toString());
  const [newWeightDate, setNewWeightDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newWeightNote, setNewWeightNote] = useState<string>('');
  const [isWeightSavedToast, setIsWeightSavedToast] = useState<boolean>(false);

  // Target weight editing state
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [targetWeightInput, setTargetWeightInput] = useState<string>(
    profile.targetWeight.toString()
  );

  // New measurement form state
  const [showMeasurementModal, setShowMeasurementModal] = useState<boolean>(false);
  const [mDate, setMDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mChest, setMChest] = useState<string>('');
  const [mWaist, setMWaist] = useState<string>('');
  const [mHips, setMHips] = useState<string>('');
  const [mBiceps, setMBiceps] = useState<string>('');
  const [mNeck, setMNeck] = useState<string>('');

  // Weight progression chart
  const weightChartData = useMemo(() => {
    const sorted = [...profile.weightHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sorted.map(w =>
      new Date(w.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    );
    const weights = sorted.map(w => w.weight);

    return {
      labels,
      datasets: [
        {
          label: 'Вес тела (кг)',
          data: weights,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#0a0f1d',
          pointBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          tension: 0.3
        }
      ]
    };
  }, [profile.weightHistory]);

  const weightChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        padding: 10,
        callbacks: {
          label: (ctx) => `Вес: ${ctx.parsed.y} кг`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeight);
    if (!isNaN(val) && val > 30 && val < 300) {
      addWeightEntry(val, newWeightDate, newWeightNote);
      setNewWeightNote('');
      setIsWeightSavedToast(true);
      setTimeout(() => setIsWeightSavedToast(false), 2000);
    }
  };

  const handleSaveTargetWeight = () => {
    const val = parseFloat(targetWeightInput);
    if (!isNaN(val) && val > 30 && val < 300) {
      updateProfile({ targetWeight: val });
      setIsEditingTarget(false);
    }
  };

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    addMeasurementEntry({
      date: mDate,
      chest: mChest ? parseFloat(mChest) : undefined,
      waist: mWaist ? parseFloat(mWaist) : undefined,
      hips: mHips ? parseFloat(mHips) : undefined,
      biceps: mBiceps ? parseFloat(mBiceps) : undefined,
      neck: mNeck ? parseFloat(mNeck) : undefined
    });
    setShowMeasurementModal(false);
    setMChest('');
    setMWaist('');
    setMHips('');
    setMBiceps('');
    setMNeck('');
  };

  const weightDiff = Math.round((profile.targetWeight - profile.currentWeight) * 10) / 10;

  return (
    <div className="pb-28 pt-4 px-3 max-w-2xl mx-auto space-y-5">
      {/* Subtab Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Личный кабинет
          </span>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="text-emerald-400" size={22} /> Профиль и Настройки
          </h1>
        </div>

        {/* Subtabs toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setProfileSubTab('body')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              profileSubTab === 'body'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Тело и Замеры
          </button>
          <button
            onClick={() => setProfileSubTab('settings')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              profileSubTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Резервные копии
          </button>
        </div>
      </div>

      {profileSubTab === 'settings' ? (
        <SettingsView />
      ) : (
        <>
          {/* Main Weight & Target Card */}
          <div className="rounded-3xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale size={14} className="text-emerald-400" /> Текущий вес
                </span>
                <div className="text-3xl font-black text-white font-mono mt-1">
                  {profile.currentWeight} <span className="text-base font-normal text-slate-400">кг</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-end gap-1.5">
                  <Target size={14} className="text-amber-400" /> Цель
                </span>
                {isEditingTarget ? (
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <input
                      type="number"
                      step="0.1"
                      value={targetWeightInput}
                      onChange={(e) => setTargetWeightInput(e.target.value)}
                      className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-white rounded text-sm text-center font-mono"
                    />
                    <button
                      onClick={handleSaveTargetWeight}
                      className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditingTarget(true)}
                    className="text-2xl font-black text-amber-400 font-mono mt-1 cursor-pointer hover:underline"
                    title="Нажмите, чтобы изменить цель"
                  >
                    {profile.targetWeight} <span className="text-xs font-normal text-slate-400">кг</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {weightDiff === 0 ? (
                    <span className="text-emerald-400 font-semibold">Цель достигнута!</span>
                  ) : weightDiff > 0 ? (
                    <span>+{weightDiff} кг до цели</span>
                  ) : (
                    <span>{weightDiff} кг до цели</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Weight Input Bar */}
            <form onSubmit={handleSaveWeight} className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="text-xs font-bold text-slate-300">Быстрая запись веса:</div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setNewWeight((prev) => (Math.max(30, parseFloat(prev || '0') - 0.5)).toFixed(1))}
                    className="px-2.5 py-2 text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 text-xs font-bold"
                  >
                    -0.5
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="75.0"
                    className="w-full text-center bg-transparent py-2 text-sm font-bold text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNewWeight((prev) => (parseFloat(prev || '0') + 0.5).toFixed(1))}
                    className="px-2.5 py-2 text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 text-xs font-bold"
                  >
                    +0.5
                  </button>
                </div>

                <input
                  type="date"
                  value={newWeightDate}
                  onChange={(e) => setNewWeightDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 text-xs focus:outline-none font-mono"
                />

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 flex-shrink-0"
                >
                  Записать
                </button>
              </div>

              <input
                type="text"
                value={newWeightNote}
                onChange={(e) => setNewWeightNote(e.target.value)}
                placeholder="Заметка к весу (напр. утро натощак, после тренировки)..."
                className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-700"
              />

              {isWeightSavedToast && (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                  <Check size={14} /> Вес успешно сохранен в историю!
                </div>
              )}
            </form>
          </div>

          {/* Weight History Chart */}
          <div className="rounded-3xl glass-panel p-4 border border-slate-800 space-y-3 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" /> График изменения веса
            </h2>

            <div className="h-48 w-full pt-1">
              {profile.weightHistory.length > 0 ? (
                <Line data={weightChartData} options={weightChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Нет сохраненных записей веса
                </div>
              )}
            </div>

            {/* Recent Weight Records List */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {[...profile.weightHistory].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-900/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{entry.date}</span>
                    {entry.note && <span className="text-slate-500 italic">({entry.note})</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white">{entry.weight} кг</span>
                    <button
                      onClick={() => deleteWeightEntry(entry.id)}
                      className="text-slate-600 hover:text-rose-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BODY MEASUREMENTS SECTION */}
          <div className="rounded-3xl glass-panel p-4 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Ruler size={18} className="text-sky-400" /> Базовые замеры тела
                </h2>
                <p className="text-xs text-slate-400">Обхваты груди, талии, бёдер, бицепса и шеи (см)</p>
              </div>
              <button
                onClick={() => setShowMeasurementModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold"
              >
                <Plus size={14} /> Добавить
              </button>
            </div>

            {profile.measurementsHistory.length > 0 ? (
              (() => {
                const latest = profile.measurementsHistory[profile.measurementsHistory.length - 1];
                return (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-400">
                      Последний замер от: <b className="text-slate-200">{latest.date}</b>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">Грудь</div>
                        <div className="text-sm font-bold text-white font-mono mt-0.5">
                          {latest.chest ?? '—'}
                        </div>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">Талия</div>
                        <div className="text-sm font-bold text-white font-mono mt-0.5">
                          {latest.waist ?? '—'}
                        </div>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">Бёдра</div>
                        <div className="text-sm font-bold text-white font-mono mt-0.5">
                          {latest.hips ?? '—'}
                        </div>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">Бицепс</div>
                        <div className="text-sm font-bold text-white font-mono mt-0.5">
                          {latest.biceps ?? '—'}
                        </div>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">Шея</div>
                        <div className="text-sm font-bold text-white font-mono mt-0.5">
                          {latest.neck ?? '—'}
                        </div>
                      </div>
                    </div>

                    {/* Log history table */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                      {[...profile.measurementsHistory].reverse().map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs"
                        >
                          <span className="font-mono text-slate-400">{m.date}</span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-300">
                            {m.chest && <span>Гр: {m.chest}</span>}
                            {m.waist && <span>Тал: {m.waist}</span>}
                            {m.biceps && <span>Биц: {m.biceps}</span>}
                          </div>
                          <button
                            onClick={() => deleteMeasurementEntry(m.id)}
                            className="text-slate-600 hover:text-rose-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                Нет сохраненных замеров тела. Нажмите «Добавить», чтобы зафиксировать объемы!
              </div>
            )}
          </div>

          {/* ADD MEASUREMENT MODAL */}
          {showMeasurementModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <form 
                onSubmit={handleSaveMeasurement}
                className="bg-dark-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Ruler size={18} className="text-sky-400" /> Замер тела
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowMeasurementModal(false)}
                    className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Дата замера</label>
                    <input
                      type="date"
                      value={mDate}
                      onChange={(e) => setMDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Грудь (см)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="104"
                        value={mChest}
                        onChange={(e) => setMChest(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Талия (см)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="82"
                        value={mWaist}
                        onChange={(e) => setMWaist(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Бёдра (см)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="99"
                        value={mHips}
                        onChange={(e) => setMHips(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Бицепс (см)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="38.5"
                        value={mBiceps}
                        onChange={(e) => setMBiceps(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Шея (см)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="39.5"
                      value={mNeck}
                      onChange={(e) => setMNeck(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMeasurementModal(false)}
                    className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};
