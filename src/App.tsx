import React, { useEffect } from 'react';
import { useAppStore } from './store';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { ElectionsView } from './views/ElectionsView';
import { ResultsView } from './views/ResultsView';
import { IncidentsView } from './views/IncidentsView';
import { LocationsView } from './views/LocationsView';
import { PartiesView } from './views/PartiesView';
import { ProfileView } from './views/ProfileView';

// Modals
import { SubmitResultModal } from './components/modals/SubmitResultModal';
import { ReportIncidentModal } from './components/modals/ReportIncidentModal';
import { DraftsQueueModal } from './components/modals/DraftsQueueModal';
import { ResultDetailModal } from './components/modals/ResultDetailModal';
import { IncidentDetailModal } from './components/modals/IncidentDetailModal';
import { LoginView } from './views/LoginView';
import { ErrorBoundary } from './components/ErrorBoundary';

export const AppContent: React.FC = () => {
  const { isAuthenticated, activeTab, pulseActive, stepPulse } = useAppStore();

  // Live Pulse ticker interval (15s polling simulation as specified in PRD Part 4)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (pulseActive && isAuthenticated) {
      interval = setInterval(() => {
        stepPulse();
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [pulseActive, isAuthenticated, stepPulse]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#070C09] text-[#F1F7F3] flex flex-col font-sans selection:bg-[#10B981] selection:text-black overflow-x-clip">
      {/* Top Header */}
      <Header />

      {/* Main Navigation Bar */}
      <Navigation />

      {/* Viewport Content */}
      <main className="flex-1 max-w-[1536px] w-full min-w-0 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'elections' && <ElectionsView />}
        {activeTab === 'results' && <ResultsView />}
        {activeTab === 'incidents' && <IncidentsView />}
        {activeTab === 'locations' && <LocationsView />}
        {activeTab === 'parties' && <PartiesView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Modals & Slide-overs */}
      <SubmitResultModal />
      <ReportIncidentModal />
      <DraftsQueueModal />
      <ResultDetailModal />
      <IncidentDetailModal />

      {/* Footer */}
      {/* Footer */}
<footer className="border-t border-[#1C2E24] bg-[#0E1712] py-6 px-4 text-center text-xs text-[#718579]">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
    <div className="flex items-center gap-2">
      <span className="font-extrabold text-white">iAQUILA</span>
      <span>• Independent Election Monitoring &amp; Parallel Collation System</span>
    </div>
    
    <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
      <a href="https://iaquila.com.ng/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">Privacy Policy</a>
      <span>•</span>
      <a href="https://iaquila.com.ng/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">Terms &amp; Conditions</a>
      <span>•</span>
      <a href="https://iaquila.com.ng/deletion.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">Data Deletion</a>
      <span>•</span>
      <a href="https://iaquila.com.ng/support.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">Support</a>
      <span>•</span>
      <span>Federal Republic of Nigeria</span>
    </div>
  </div>
</footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
