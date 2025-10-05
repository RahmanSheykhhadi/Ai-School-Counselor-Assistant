import React, { useState, useEffect } from 'react';
import { AppContextProvider, useAppContext } from './context/AppContext';
import type { View } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClassroomList from './components/ClassroomList';
import StudentList from './components/StudentList';
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
import { GeminiLogo } from './components/icons';

function AppContent() {
  const { students, classrooms, appSettings, setIsArchiveUnlocked, isLoading } = useAppContext();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    // Apply font size from settings
    const root = document.documentElement;
    
    // Handle font size
    const sizeValue = parseInt(appSettings.fontSize, 10);
    if (!isNaN(sizeValue) && sizeValue > 0) {
        root.style.fontSize = `${sizeValue}px`;
    } else {
        const sizeMap: { [key: string]: string } = { 'small': '14px', 'medium': '16px', 'large': '18px' };
        root.style.fontSize = sizeMap[appSettings.fontSize] || '16px';
    }
  }, [appSettings.fontSize]);

  // Effect to handle view validation and automatic navigation
  useEffect(() => {
    // Do not run validation logic until all data is loaded to prevent race conditions.
    if (isLoading) {
      return;
    }

    // --- Student Detail View Validation ---
    if (currentView === 'student-detail') {
      const student = selectedStudentId ? students.find(s => s.id === selectedStudentId) : undefined;
      
      // If student doesn't exist, we must navigate away. This is a critical failure state.
      if (!student) {
        const classroom = selectedClassroomId ? classrooms.find(c => c.id === selectedClassroomId) : undefined;
        if (classroom) {
          setCurrentView('student-list');
          setSelectedStudentId(null);
        } else {
          setCurrentView('classrooms');
          setSelectedClassroomId(null);
          setSelectedStudentId(null);
        }
        return; // Stop processing after correcting the state.
      }
      
      // If student exists, but classroomId is out of sync, correct it.
      if (student.classroomId !== selectedClassroomId) {
        setSelectedClassroomId(student.classroomId);
        return; // Stop processing.
      }
    }

    // --- Student List View Validation ---
    if (currentView === 'student-list') {
      const classroom = selectedClassroomId ? classrooms.find(c => c.id === selectedClassroomId) : undefined;
      
      // If classroom doesn't exist, navigate to the top level.
      if (!classroom) {
        setCurrentView('classrooms');
        setSelectedClassroomId(null);
        setSelectedStudentId(null);
        return; // Stop processing.
      }
    }
  }, [currentView, selectedClassroomId, selectedStudentId, students, classrooms, isLoading]);


  const navigate = (view: View) => {
    // Reset selections on main navigation
    if (['dashboard', 'classrooms', 'calendar', 'more'].includes(view)) {
      setSelectedClassroomId(null);
      setSelectedStudentId(null);
    }
    // Automatically lock archive when navigating away from protected views
    if(['all-sessions', 'student-detail', 'special-students', 'counseling-needed-students'].includes(currentView)) {
        setIsArchiveUnlocked(false);
    }
    setCurrentView(view);
  };
  
  const viewClassroom = (id: string) => {
      setSelectedClassroomId(id);
      navigate('student-list');
  };
  
  const viewStudent = (id: string) => {
      setSelectedStudentId(id);
      navigate('student-detail');
  };
  
  const backToClassrooms = () => {
      setSelectedClassroomId(null);
      setSelectedStudentId(null);
      navigate('classrooms');
  }
  
  const backToStudentList = () => {
      setSelectedStudentId(null);
      navigate('student-list');
  }
  
   const backToDashboard = () => {
      setSelectedClassroomId(null);
      setSelectedStudentId(null);
      navigate('dashboard');
  }

  const backToMore = () => {
      navigate('more');
  }

  const renderCurrentView = () => {
      switch (currentView) {
          case 'dashboard':
              return <Dashboard onNavigate={navigate} onViewClassroom={viewClassroom} />;
          case 'classrooms':
              return <ClassroomList onViewClass={viewClassroom} />;
          case 'student-list': {
              const classroom = classrooms.find(c => c.id === selectedClassroomId);
              // This guard prevents rendering with invalid data for the brief moment before the useEffect corrects the view state.
              if (!classroom) return null;
              
              const classroomStudents = students.filter(s => s.classroomId === selectedClassroomId);
              return <StudentList classroom={classroom} students={classroomStudents} onSelectStudent={viewStudent} onBack={backToClassrooms} />;
            }
          case 'student-detail': {
              // This guard is also important for the frame before the effect runs.
              if (!selectedStudentId) return null;
              return <StudentDetail studentId={selectedStudentId} onBack={backToStudentList} onNavigate={navigate} />;
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
          case 'special-students':
              return <SpecialStudentsView onBack={backToMore} />;
          case 'counseling-needed-students':
              return <CounselingNeededStudentsView onBack={backToMore} />;
          default:
              return <Dashboard onNavigate={navigate} onViewClassroom={viewClassroom} />;
      }
  };
  
  if (isLoading) {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-slate-100 text-slate-600">
            <GeminiLogo className="w-20 h-20 text-sky-600 animate-pulse" />
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