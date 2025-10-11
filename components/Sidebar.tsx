import React from 'react';
import type { View } from '../types';
import { HomeIcon, UserIcon, CalendarIcon, Squares2X2Icon, AppLogoIcon, BookIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { toPersianDigits } from '../utils/helpers';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const navItems: { view: View; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { view: 'dashboard', label: 'داشبورد', icon: HomeIcon },
  { view: 'students', label: 'کلاس‌ها', icon: UserIcon },
  { view: 'calendar', label: 'تقویم', icon: CalendarIcon },
  { view: 'thinking-lifestyle', label: 'تفکر', icon: BookIcon },
  { view: 'more', label: 'بیشتر', icon: Squares2X2Icon },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { appSettings } = useAppContext();
  
  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isMoreSectionActive = ['more', 'reports', 'settings', 'grade-nine-quorum', 'special-students', 'counseling-needed-students'].includes(currentView);
    const isStudentsSectionActive = ['students', 'student-detail', 'manual-assign', 'classroom-manager'].includes(currentView);
    
    let isActive = currentView === item.view;
    if (item.view === 'more' && isMoreSectionActive) {
        isActive = true;
    }
    if (item.view === 'students' && isStudentsSectionActive) {
        isActive = true;
    }
    
    return (
      <button
        onClick={() => onNavigate(item.view)}
        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-center
                    ${isActive
                        ? 'bg-sky-100 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
      >
        <item.icon className="w-6 h-6 mb-1" />
        <span className="text-xs font-semibold">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden flex justify-around items-center bg-white border-t border-slate-200 p-1 z-20" dir="rtl">
        {navItems.map(item => <NavLink key={item.view} item={item} />)}
      </nav>

      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-l border-slate-200 p-4" dir="rtl">
        <div className="flex flex-col items-center mb-8">
            <AppLogoIcon iconUrl={appSettings.appIcon} className="w-12 h-12" />
             <h1 className="text-xl font-bold text-slate-800 mt-4">همیار مشاور هوشمند</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          {navItems.map(item => {
            const isMoreSectionActive = ['more', 'reports', 'settings', 'grade-nine-quorum', 'special-students', 'counseling-needed-students'].includes(currentView);
            const isStudentsSectionActive = ['students', 'student-detail', 'manual-assign', 'classroom-manager'].includes(currentView);
            
            let isActive = currentView === item.view;
            if (item.view === 'more' && isMoreSectionActive) {
                isActive = true;
            }
            if (item.view === 'students' && isStudentsSectionActive) {
                isActive = true;
            }
            
            return (
              <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={`flex items-center p-3 rounded-lg transition-colors text-right
                      ${isActive
                          ? 'bg-sky-500 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-sky-600'
                      }`}
              >
                  <item.icon className="w-6 h-6 ml-3" />
                  <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;