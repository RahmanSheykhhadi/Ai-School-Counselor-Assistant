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
      'classroom-manager': 'مدیریت کلاس‌ها',
      'help': 'راهنما',
    };
    return titles[view] || 'همیار مشاور هوشمند';
};

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
    const { appSettings } = useAppContext();
    const title = getTitle(currentView);

    const subPagesOfMore: View[] = ['special-students', 'counseling-needed-students', 'grade-nine-quorum', 'reports', 'settings', 'help'];
    const isSubPage = subPagesOfMore.includes(currentView);

    return (
        <header className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
            {isSubPage ? (
                <button onClick={() => onNavigate('more')} className="bg-green-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-sm hover:bg-green-600 transition-colors">
                    بازگشت
                </button>
            ) : (
                <div className="flex items-center gap-3">
                    <AppLogoIcon iconUrl={appSettings.appIcon} className="w-8 h-8" />
                    <h1 className="text-base font-bold text-slate-800">{title}</h1>
                </div>
            )}
        </header>
    );
};

export default Header;