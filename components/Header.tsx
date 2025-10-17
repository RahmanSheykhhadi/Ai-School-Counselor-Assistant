import React from 'react';
import { AppLogoIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import type { View } from '../types';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const getTitle = (view: View): string => {
    const titles: { [key in View]?: string } = {
      'dashboard': 'داشبورد',
      'students': 'کلاس‌ها و دانش‌آموزان',
      'student-detail': 'پرونده دانش‌آموز',
      'calendar': 'تقویم جلسات',
      'reports': 'گزارشات',
      'settings': 'تنظیمات',
      'all-sessions': 'بایگانی جلسات',
      'more': 'بیشتر',
      'grade-nine-quorum': 'حد نصاب نهم',
      'upcoming-sessions': 'جلسات پیش رو',
      'special-students': 'دانش‌آموزان خاص',
      'counseling-needed-students': 'نیازمند مشاوره',
      'manual-assign': 'کلاس‌بندی دستی',
      'thinking-lifestyle': 'تفکر و سبک زندگی',
      'help': 'راهنما',
    };
    return titles[view] || 'همیار مشاور هوشمند';
};

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
    const { appSettings } = useAppContext();
    const title = getTitle(currentView);

    const subPagesOfMore: View[] = ['special-students', 'counseling-needed-students', 'grade-nine-quorum', 'reports', 'settings', 'help'];
    const subPagesOfDashboard: View[] = ['all-sessions', 'upcoming-sessions'];
    const subPagesOfStudents: View[] = ['student-detail', 'manual-assign'];


    const isSubPageOfMore = subPagesOfMore.includes(currentView);
    const isSubPageOfDashboard = subPagesOfDashboard.includes(currentView);
    const isSubPageOfStudents = subPagesOfStudents.includes(currentView);

    const showBackButton = isSubPageOfMore || isSubPageOfDashboard || isSubPageOfStudents;
    
    const handleBack = () => {
        if (isSubPageOfMore) onNavigate('more');
        else if (isSubPageOfDashboard) onNavigate('dashboard');
        else if (isSubPageOfStudents) onNavigate('students');
    };

    return (
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
            {showBackButton ? (
                 <button 
                    onClick={handleBack} 
                    className="bg-green-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-sm hover:bg-green-600 transition-colors"
                >
                    بازگشت
                </button>
            ) : (
                <div className="flex items-center gap-3 md:hidden">
                    <AppLogoIcon iconUrl={appSettings.appIcon} className="w-8 h-8" />
                </div>
            )}
            <h1 className="text-base font-bold text-slate-800 md:text-xl absolute left-1/2 -translate-x-1/2">{title}</h1>
             <div className="w-20"></div> {/* Spacer to balance the header */}
        </header>
    );
};

export default Header;
