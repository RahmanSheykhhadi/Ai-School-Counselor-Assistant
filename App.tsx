import React, { useState, useEffect } from 'react';
import { AppContextProvider, useAppContext } from './context/AppContext';
import type { View } from './types';
import Sidebar from './components/Sidebar';
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
import ManualAssignView from './components/ManualAssignView';
import { ThinkingLifestyleView } from './components/ThinkingLifestyleView';
import ClassroomManagerView from './components/ClassroomManagerView';
import { AppLogoIcon } from './components/icons';

function AppContent() {
  const { students, appSettings, setIsArchiveUnlocked, isLoading } = useAppContext();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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
    if (['dashboard', 'students', 'calendar', 'more'].includes(view)) {
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
              return <ReportsView />;
          case 'settings':
              return <SettingsView />;
          case 'all-sessions':
              return <AllSessionsView onBack={backToDashboard} />;
          case 'upcoming-sessions':
              return <UpcomingSessionsView onBack={backToDashboard} onNavigate={navigate} />;
          case 'more':
              return <MoreView onNavigate={navigate} />;
          case 'grade-nine-quorum':
              return <GradeNineQuorumView onBack={backToMore} />;
          case 'thinking-lifestyle':
              return <ThinkingLifestyleView onBack={backToMore} />;
          case 'special-students':
              return <SpecialStudentsView onBack={backToMore} />;
          case 'counseling-needed-students':
              return <CounselingNeededStudentsView onBack={backToMore} />;
          case 'manual-assign':
              return <ManualAssignView onBack={backToStudents} />;
          case 'classroom-manager':
              return <ClassroomManagerView onBack={backToStudents} />;
          default:
              return <Dashboard onNavigate={navigate} />;
      }
  };
  
  if (isLoading) {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-slate-100 text-slate-600">
            <AppLogoIcon className="w-20 h-20 animate-pulse" />
            <p className="mt-4 text-lg font-semibold">در حال بارگذاری اطلاعات...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full font-sans bg-slate-100" dir="rtl">
        <Sidebar currentView={currentView} onNavigate={navigate} />
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto mb-16 md:mb-0">
            {renderCurrentView()}
        </main>
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