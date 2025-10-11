import React from 'react';
import { AppLogoIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import type { View } from '../types';

interface HeaderProps {
  currentView: View;
}

const getTitle = (view: View): string => {
    const titles: { [key in View]?: string } = {
      'dashboard': 'به همیار مشاور خوش آمدید!',
      'students': 'کلاس‌ها و دانش‌آموزان',
      'student-detail': 'پرونده دانش‌آموز',
      'calendar': 'تقویم جلسات',
      'reports': 'گزارشات',
      'settings': 'تنظیمات',
      'all-sessions': 'آرشیو جلسات',
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

const Header: React.FC<HeaderProps> = ({ currentView }) => {
    const { appSettings } = useAppContext();
    const title = getTitle(currentView);

    return (
        <header className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <AppLogoIcon iconUrl={appSettings.appIcon} className="w-8 h-8" />
                <h1 className="text-base font-bold text-slate-800">{title}</h1>
            </div>
        </header>
    );
};

export default Header;