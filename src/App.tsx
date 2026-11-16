import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { WorkoutHomeView } from './components/WorkoutHomeView';
import { ActiveWorkoutView } from './components/ActiveWorkoutView';
import { CalendarView } from './components/CalendarView';
import { TemplateEditorView } from './components/TemplateEditorView';
import { ProgressHistoryView } from './components/ProgressHistoryView';
import { ProfileView } from './components/ProfileView';
import { RestTimer } from './components/RestTimer';

const AppContent: React.FC = () => {
  const { activeTab, data } = useApp();

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col justify-between">
      <main className="flex-1 w-full">
        {activeTab === 'workout' && (
          data.activeWorkout ? <ActiveWorkoutView /> : <WorkoutHomeView />
        )}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'templates' && <TemplateEditorView />}
        {activeTab === 'history' && <ProgressHistoryView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Floating Rest Timer */}
      <RestTimer />

      {/* Fixed Mobile Bottom Bar */}
      <Navigation />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
