import React, { useState, useMemo } from 'react';
import moment from 'jalali-moment';
import { useAppContext } from '../context/AppContext';
import type { View } from '../types';
import { toPersianDigits } from '../utils/helpers';
import { LockClosedIcon, LockOpenIcon, FolderIcon, GeminiLogo } from './icons';
import PasswordPromptModal from './PasswordPromptModal';
import { verifyPassword } from '../utils/helpers';
import ProfilePhoto from './ProfilePhoto';

const Dashboard: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    const { 
        sessions,
        students,
        classrooms,
        sessionTypes,
        appSettings,
        isArchiveUnlocked,
        setIsArchiveUnlocked,
        setCalendarTargetDate,
    } = useAppContext();
    
    const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);

    const upcomingSessions = useMemo(() => {
        const now = moment();
        return sessions
            .filter(s => moment(s.date).isAfter(now))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [sessions]);

    const handleUnlockArchive = async (password: string): Promise<boolean> => {
        if (!appSettings.sessionPasswordHash) {
            setIsArchiveUnlocked(true);
            setIsPasswordPromptOpen(false);
            return true;
        }
        const success = await verifyPassword(password, appSettings.sessionPasswordHash);
        if (success) {
            setIsArchiveUnlocked(true);
            setIsPasswordPromptOpen(false);
        }
        return success;
    };
    
    const toggleLock = () => {
        if (isArchiveUnlocked) {
            setIsArchiveUnlocked(false);
        } else {
            if (appSettings.passwordProtectionEnabled && appSettings.sessionPasswordHash) {
                setIsPasswordPromptOpen(true);
            }
        }
    };
    
    const handleSessionClick = (sessionDate: string) => {
        setCalendarTargetDate(new Date(sessionDate));
        onNavigate('calendar');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-3">
                <GeminiLogo className="w-10 h-10 text-sky-600 flex-shrink-0" />
                <div className="flex-grow text-center">
                    <h1 className="text-base sm:text-lg font-bold text-slate-800">
                        به همیار مشاور هوشمند خوش آمدی!
                    </h1>
                    {/* CRITICAL: The following credit line must not be removed or altered as per user requirements. */}
                    <p className="text-xs text-slate-500 mt-1">
                        (طراحی: رحمان شیخ‌هادی - منطقه کهک؛ <span dir="ltr">{toPersianDigits(appSettings.academicYear)}</span>)
                    </p>
                </div>
            </div>
            
            <div 
                className="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex items-center justify-between transition-shadow hover:shadow-md"
            >
                <div onClick={() => onNavigate('all-sessions')} className="flex-grow flex items-center cursor-pointer">
                    <div className="p-2.5 bg-slate-100 rounded-full mr-3"><FolderIcon className="w-6 h-6 text-slate-600"/></div>
                    <div>
                        <p className="text-base sm:text-lg font-bold text-slate-800">آرشیو جلسات</p>
                    </div>
                </div>
                <div 
                    onClick={appSettings.passwordProtectionEnabled ? toggleLock : undefined} 
                    className={`flex items-center space-x-2 space-x-reverse border-r pr-4 ${appSettings.passwordProtectionEnabled ? 'cursor-pointer' : ''}`}
                >
                    {!appSettings.passwordProtectionEnabled ? (
                        <>
                            <LockClosedIcon className="w-5 h-5 text-slate-400"/>
                            <span className="text-sm font-bold text-slate-400">
                                قفل: تنظیم نشده
                            </span>
                        </>
                    ) : isArchiveUnlocked ? (
                        <>
                            <LockOpenIcon className="w-5 h-5 text-green-600"/>
                            <span className="text-sm font-bold text-green-600">
                                باز است
                            </span>
                        </>
                    ) : (
                        <>
                            <LockClosedIcon className="w-5 h-5 text-red-600"/>
                            <span className="text-sm font-bold text-red-600">
                                قفل است
                            </span>
                        </>
                    )}
                </div>
            </div>
            
            {/* Upcoming Sessions */}
            <div className="bg-white p-3 sm:p-5 rounded-xl shadow-sm transition-shadow hover:shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => onNavigate('upcoming-sessions')} className="text-right group">
                        <h2 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">جلسات پیش رو</h2>
                    </button>
                    <button onClick={() => onNavigate('upcoming-sessions')} className="text-sm font-semibold text-sky-600 hover:underline">
                        مشاهده همه
                    </button>
                </div>
                <div className="space-y-3">
                    {upcomingSessions.length > 0 ? (
                        upcomingSessions.slice(0, 5).map(session => {
                            const student = students.find(s => s.id === session.studentId);
                            const classroom = student ? classrooms.find(c => c.id === student.classroomId) : null;
                            const sessionType = sessionTypes.find(st => st.id === session.typeId);
                             const sessionMoment = moment(session.date);
                            return (
                                <button
                                    key={session.id}
                                    onClick={() => handleSessionClick(session.date)}
                                    className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-right hover:bg-sky-50 hover:border-sky-200 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {student && <ProfilePhoto photoUrl={student.photoUrl} alt={student.firstName} className="w-10 h-10 rounded-full" />}
                                            <div>
                                                <p className="font-semibold text-slate-800">{student ? `${student.firstName} ${student.lastName}` : 'دانش‌آموز حذف شده'}</p>
                                                <p className="text-[13px] text-slate-500">
                                                    {classroom ? `${classroom.name} • ` : ''}{sessionType?.name || 'جلسه'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold text-sky-600 text-left flex-shrink-0">
                                            <span>{toPersianDigits(sessionMoment.fromNow())} ({toPersianDigits(sessionMoment.format('jD jMMMM'))})</span>
                                            <span className="block text-xs text-slate-500 font-normal">ساعت {toPersianDigits(sessionMoment.format('HH:mm'))}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 text-center py-4">جلسه برنامه‌ریزی شده‌ای وجود ندارد.</p>
                    )}
                </div>
            </div>
            
            {isPasswordPromptOpen && (
                <PasswordPromptModal 
                    onClose={() => setIsPasswordPromptOpen(false)}
                    onConfirm={handleUnlockArchive}
                />
            )}
        </div>
    );
};

export default Dashboard;