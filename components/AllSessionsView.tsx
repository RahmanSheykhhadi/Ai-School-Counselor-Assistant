import React, { useMemo, useState, useEffect } from 'react';
import moment from 'jalali-moment';
// FIX: Import useAppContext as a named import.
import { useAppContext } from '../context/AppContext';
import { Session, Student } from '../types';
import SessionCard from './SessionCard';
import SessionModal from './SessionModal';
import ConfirmationModal from './ConfirmationModal';
import { toPersianDigits, verifyPassword, normalizePersianChars } from '../utils/helpers';
import { SearchIcon, LockClosedIcon } from './icons';

export default function AllSessionsView({ onBack }: { onBack: () => void }) {
    const { sessions, students, handleSaveSession, handleDeleteSession, appSettings, isArchiveUnlocked, setIsArchiveUnlocked } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

    const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
    const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);
    
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const pastSessions = useMemo(() => {
        const now = moment();
        return sessions.filter(s => moment(s.date).isBefore(now));
    }, [sessions]);

    const filteredSessions = useMemo(() => {
        const normalizedSearch = normalizePersianChars(searchTerm.toLowerCase());
        if (!normalizedSearch) return pastSessions;

        return pastSessions.filter(session => {
            const student = studentMap.get(session.studentId);
            if (!student) return false;
            
            const studentName = normalizePersianChars(`${student.firstName} ${student.lastName}`).toLowerCase();
            return studentName.includes(normalizedSearch);
        });
    }, [pastSessions, searchTerm, studentMap]);

    const sessionsByMonth = useMemo(() => {
        const groups: { [key: string]: Session[] } = {};
        filteredSessions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .forEach(session => {
                const monthKey = moment(session.date).locale('fa').format('jMMMM jYYYY');
                if (!groups[monthKey]) {
                    groups[monthKey] = [];
                }
                groups[monthKey].push(session);
            });
        return groups;
    }, [filteredSessions]);

    useEffect(() => {
        // Automatically expand the most recent month on initial load if not searching
        if (!searchTerm) {
            const firstMonth = Object.keys(sessionsByMonth)[0];
            if (firstMonth) {
                setExpandedMonths({ [firstMonth]: true });
            }
        }
    }, []); // Run only once

    const toggleMonth = (month: string) => {
        setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
    };
    
    const handleUnlockArchive = async (password: string): Promise<boolean> => {
        if (!appSettings.sessionPasswordHash) {
            setIsArchiveUnlocked(true);
            return true;
        }
        const success = await verifyPassword(password, appSettings.sessionPasswordHash);
        if (success) {
            setIsArchiveUnlocked(true);
        }
        return success;
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        setError('');
        setIsUnlocking(true);
        const success = await handleUnlockArchive(password);
        if (!success) {
            setError('رمز عبور اشتباه است.');
            setPassword('');
        }
        setIsUnlocking(false);
    };

    const handleSaveAndClose = (sessionData: Session | Omit<Session, 'id' | 'academicYear'>) => {
        handleSaveSession(sessionData);
        setSessionToEdit(null);
    };
    
    const confirmDelete = () => {
        if(sessionToDeleteId) {
            handleDeleteSession(sessionToDeleteId);
            setSessionToDeleteId(null);
        }
    };

    if (appSettings.passwordProtectionEnabled && !isArchiveUnlocked) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl shadow-sm">
                <LockClosedIcon className="w-12 h-12 text-slate-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">بایگانی جلسات قفل است</h2>
                <p className="text-slate-500 my-2">برای مشاهده تاریخچه جلسات، لطفا رمز عبور را وارد کنید.</p>
                <form onSubmit={handlePasswordSubmit} className="mt-4 w-full max-w-xs">
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md text-center"
                        placeholder="رمز عبور"
                        autoFocus
                        dir="ltr"
                        disabled={isUnlocking}
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <button type="submit" disabled={isUnlocking} className="mt-3 w-full px-6 py-2 bg-sky-500 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-600 transition-colors disabled:bg-slate-400">
                        {isUnlocking ? 'در حال بررسی...' : 'باز کردن بایگانی'}
                    </button>
                     <button type="button" onClick={onBack} className="mt-4 text-sm text-sky-600 hover:underline">بازگشت به داشبورد</button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center md:text-right">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">بایگانی جلسات گذشته</h1>
            </div>
             <div className="relative">
                <input
                    type="text"
                    placeholder="جستجوی دانش‌آموز..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 pr-10 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                />
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-4">
                {Object.entries(sessionsByMonth).map(([month, sessionsInMonth]: [string, Session[]]) => (
                    <div key={month} className="bg-white p-4 rounded-xl shadow-sm">
                        <button onClick={() => toggleMonth(month)} className="w-full flex justify-between items-center text-right font-bold text-lg text-slate-800">
                            <span>{toPersianDigits(month)}</span>
                            <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                {toPersianDigits(sessionsInMonth.length)} جلسه
                            </span>
                        </button>
                        {(expandedMonths[month] || searchTerm) && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                                {sessionsInMonth.map(session => (
                                    <SessionCard 
                                        key={session.id}
                                        session={session} 
                                        student={studentMap.get(session.studentId)}
                                        onEdit={setSessionToEdit}
                                        onDelete={setSessionToDeleteId}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                 {Object.keys(sessionsByMonth).length === 0 && (
                    <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                         <p className="text-slate-500">
                            {searchTerm ? 'هیچ جلسه‌ای برای این دانش‌آموز یافت نشد.' : 'هنوز هیچ جلسه‌ای در گذشته ثبت نشده است.'}
                        </p>
                    </div>
                )}
            </div>
            
            {sessionToEdit && (
                <SessionModal 
                    student={studentMap.get(sessionToEdit.studentId)!}
                    session={sessionToEdit}
                    onClose={() => setSessionToEdit(null)}
                    onSave={handleSaveAndClose}
                />
            )}
            
            {sessionToDeleteId && (
                <ConfirmationModal
                    title="حذف جلسه"
                    message="آیا از حذف این جلسه اطمینان دارید؟"
                    onConfirm={confirmDelete}
                    onCancel={() => setSessionToDeleteId(null)}
                    confirmButtonText="بله، حذف کن"
                />
            )}
        </div>
    );
}