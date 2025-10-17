import React, { useState, useEffect } from 'react';
import { AppContextProvider, useAppContext } from './context/AppContext';
import type { View } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AllStudentsView from './components/AllStudentsView';
import StudentDetail from './components/StudentDetail';
import CalendarView from './components/CalendarView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import AllSessionsView from './components/AllSessionsView';
import MoreView from './components/MoreView';
import GradeNineQuorumView from './components/GradeNineQuorumView';
import UpcomingSessionsView from './components/UpcomingSessionsView';
import SpecialStudentsView from './components/SpecialStudentsView';
import CounselingNeededStudentsView from './components/CounselingNeededStudentsView';
import { ManualAssignView } from './components/ManualAssignView';
import { ThinkingLifestyleView } from './components/ThinkingLifestyleView';
import { HelpView } from './components/HelpView';
import { AppLogoIcon } from './components/icons';
import DisclaimerModal from './components/DisclaimerModal';
import InstallPwaBanner from './components/InstallPwaBanner';

function AppContent() {
  const { students, appSettings, setAppSettings, setIsArchiveUnlocked, isLoading } = useAppContext();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showHelpInDisclaimer, setShowHelpInDisclaimer] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> }) => {
        // Prevent the default browser prompt
        e.preventDefault();
        // Store the event so it can be triggered later.
        setInstallPrompt(e);
        // Show our custom install banner if the app is not already installed
        // @ts-ignore: 'standalone' is a valid but non-standard property for navigator
        if (!window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone) {
            setShowInstallBanner(true);
        }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);


  useEffect(() => {
    const root = document.documentElement;
    const sizeValue = parseInt(appSettings.fontSize, 10);
    if (!isNaN(sizeValue) && sizeValue > 0) {
        root.style.fontSize = `${sizeValue}px`;
    } else {
        const sizeMap: { [key: string]: string } = { 'small': '14px', 'medium': '16px', 'large': '18px' };
        root.style.fontSize = sizeMap[appSettings.fontSize] || '16px';
    }
  }, [appSettings.fontSize]);

    useEffect(() => {
        // This effect updates the live favicon and forces a manifest refetch
        // when the icon changes in settings. The service worker handles the
        // dynamic manifest generation.
        const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
        const manifestLink = document.getElementById('manifest-link') as HTMLLinkElement | null;
        const iconUrl = appSettings.appIcon;

        if (iconUrl && favicon) {
            favicon.href = iconUrl;
        }

        if (manifestLink) {
            // By changing the href with a timestamp, we force the browser to re-fetch the manifest,
            // bypassing any potential cache and ensuring the service worker intercept runs.
            manifestLink.href = `/manifest.json?v=${new Date().getTime()}`;
        }
    }, [appSettings.appIcon]);

  useEffect(() => {
    if (isLoading) return;

    if (currentView === 'student-detail' && selectedStudentId) {
      const studentExists = students.some(s => s.id === selectedStudentId);
      if (!studentExists) {
        setCurrentView('students');
        setSelectedStudentId(null);
      }
    }
  }, [currentView, selectedStudentId, students, isLoading]);


  const navigate = (view: View) => {
    if (['dashboard', 'students', 'calendar', 'thinking-lifestyle', 'more'].includes(view)) {
      setSelectedStudentId(null);
    }
    if(['all-sessions', 'student-detail', 'special-students', 'counseling-needed-students'].includes(currentView)) {
        setIsArchiveUnlocked(false);
    }
    setCurrentView(view);
  };
  
  const viewStudent = (id: string) => {
      setSelectedStudentId(id);
      navigate('student-detail');
  };
  
  const backToStudents = () => {
      setSelectedStudentId(null);
      navigate('students');
  }
  
   const backToDashboard = () => {
      setSelectedStudentId(null);
      navigate('dashboard');
  }

  const backToMore = () => {
      navigate('more');
  }
  
  const handleAcceptDisclaimer = () => {
    setAppSettings(prev => ({ ...prev, hasAcceptedDisclaimer: true }));
  };
  
  const handleInstallClick = () => {
    if (!installPrompt) return;
    // Show the browser's install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
        } else {
            console.log('User dismissed the A2HS prompt');
        }
        // We can't use the prompt again, so clear it.
        setInstallPrompt(null);
        setShowInstallBanner(false);
    });
  };

  const handleDismissInstallBanner = () => {
    setShowInstallBanner(false);
  };


  const renderCurrentView = () => {
      switch (currentView) {
          case 'dashboard':
              return <Dashboard onNavigate={navigate} />;
          case 'students':
              return <AllStudentsView onViewStudent={viewStudent} onNavigate={navigate} />;
          case 'student-detail': {
              if (!selectedStudentId) return null;
              return <StudentDetail studentId={selectedStudentId} onBack={backToStudents} onNavigate={navigate} />;
            }
          case 'calendar':
              return <CalendarView />;
          case 'reports':
              return <ReportsView onBack={backToMore} />;
          case 'settings':
              return <SettingsView onBack={backToMore} onNavigate={navigate} />;
          case 'all-sessions':
              return <AllSessionsView onBack={backToDashboard} />;
          case 'upcoming-sessions':
              return <UpcomingSessionsView onBack={backToDashboard} onNavigate={navigate} />;
          case 'more':
              return <MoreView onNavigate={navigate} />;
          case 'grade-nine-quorum':
              return <GradeNineQuorumView onBack={backToMore} />;
          case 'thinking-lifestyle':
              return <ThinkingLifestyleView />;
          case 'special-students':
              return <SpecialStudentsView onBack={backToMore} />;
          case 'counseling-needed-students':
              return <CounselingNeededStudentsView onBack={backToMore} />;
          case 'manual-assign':
              return <ManualAssignView onBack={backToStudents} />;
          case 'help':
              return <HelpView onBack={backToMore} />;
          default:
              return <Dashboard onNavigate={navigate} />;
      }
  };
  
  if (isLoading) {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-slate-100 text-slate-600">
            <AppLogoIcon iconUrl={appSettings.appIcon} className="w-20 h-20 animate-pulse" />
            <p className="mt-4 text-lg font-semibold">در حال بارگذاری اطلاعات...</p>
        </div>
    );
  }
  
  if (!appSettings.hasAcceptedDisclaimer) {
      return (
        <>
            {showHelpInDisclaimer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-2 sm:p-4">
                    <div className="bg-white rounded-lg h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
                         <HelpView onBack={() => setShowHelpInDisclaimer(false)} />
                    </div>
                </div>
            )}
            <DisclaimerModal onAccept={handleAcceptDisclaimer} onShowHelp={() => setShowHelpInDisclaimer(true)} />
        </>
      );
  }

  return (
    <div className="flex flex-col md:flex-row h-full font-sans bg-slate-100" dir="rtl">
        {showInstallBanner && <InstallPwaBanner onInstall={handleInstallClick} onDismiss={handleDismissInstallBanner} />}
        <Sidebar currentView={currentView} onNavigate={navigate} />
        <div className="flex-1 flex flex-col min-h-0">
            <Header currentView={currentView} onNavigate={navigate} />
            <main className="flex-1 overflow-y-auto mb-16 md:mb-0 force-scrollbar-right">
                <div className="p-3 sm:p-6 md:p-8">
                    {renderCurrentView()}
                </div>
            </main>
        </div>
    </div>
  );
}

function App() {
  return (
    <AppContextProvider>
        <AppContent />
    </AppContextProvider>
  );
}

export default App;
