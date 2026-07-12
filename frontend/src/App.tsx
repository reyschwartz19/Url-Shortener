import { useState, useEffect } from 'react';
import { ViewType } from './types';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import AnalyticsPage from './components/AnalyticsPage';
import { refreshAuthToken } from './lib/api';

export default function App() {
  const [view, setView] = useState<ViewType>('landing');
  const [userEmail, setUserEmail] = useState('');
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { email } = await refreshAuthToken();
        if (email) setUserEmail(email);
        setView('dashboard');
      } catch (err) {
        // ignore, user is not logged in
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  if (isInitializing) {
    return <div className="min-h-screen bg-background text-white flex items-center justify-center font-mono">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {view === 'landing' && (
        <LandingPage setView={setView} />
      )}
      {view === 'auth' && (
        <AuthPage
          setView={setView}
          setUserEmail={setUserEmail}
        />
      )}
      {view === 'dashboard' && (
        <Dashboard
          setView={setView}
          userEmail={userEmail}
          setSelectedLinkId={setSelectedLinkId}
        />
      )}
      {view === 'analytics' && (
        <AnalyticsPage
          setView={setView}
          activeLinkId={selectedLinkId}
          userEmail={userEmail}
        />
      )}
    </div>
  );
}
