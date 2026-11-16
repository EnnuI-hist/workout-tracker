import React from 'react';
import { useApp, TabType } from '../context/AppContext';
import { Dumbbell, TrendingUp, User, Settings, LucideIcon } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, data } = useApp();
  const isWorkoutActive = Boolean(data.activeWorkout);

  const tabs: Array<{ id: TabType; label: string; icon: LucideIcon }> = [
    { id: 'workout', label: 'Тренировка', icon: Dumbbell },
    { id: 'history', label: 'Прогресс', icon: TrendingUp },
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'settings', label: 'Настройки', icon: Settings }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-dark-950/90 backdrop-blur-xl border-t border-slate-800/80 pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showActiveWorkoutBadge = tab.id === 'workout' && isWorkoutActive;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                {showActiveWorkoutBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
                {showActiveWorkoutBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-tight mt-1 ${
                isActive ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
