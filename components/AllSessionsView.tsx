import React, { useMemo, useState, useEffect } from 'react';
import moment from 'jalali-moment';
import { useAppContext } from '../context/AppContext';
import { Session, Student } from '../types';
import SessionCard from './SessionCard';
import SessionModal from './SessionModal';
import ConfirmationModal from './ConfirmationModal';
import { toPersianDigits, verifyPassword } from '../utils/helpers';
import { SearchIcon, LockClosedIcon } from './icons';

export default function AllSessionsView({ onBack }: { onBack: () => void }) {
    const { sessions, students, handleSaveSession, handleDeleteSession, appSettings, isArchiveUnlocked, setIsArchiveUnlocked } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

    const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

    // --- Security State ---
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);

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

    const isProtectedAndLocked = appSettings.passwordProtectionEnabled && !isArchiveUnlocked;

    const pastSessions = useMemo(() => {
        return sessions
            .filter(s => new Date(s.date) < new Date())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sessions]);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const filteredSessions = useMemo(() => {
        if (!searchTerm.trim()) {
            return pastSessions;
        }
        const lowercasedSearch = searchTerm.toLowerCase();
        const matchingStudentIds = new Set(
            students
                .filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(lowercasedSearch))
                .map(s => s.id)
        );
        return pastSessions.filter(s => matchingStudentIds.has(s.studentId));
    }, [searchTerm, pastSessions, students]);

    const sessionsByMonth = useMemo<Map<string, Session[]>>(() => {
        const groups = new Map<string, Session[]>();
        filteredSessions.forEach(session => {
            const monthKey = moment(session.date).locale('fa').format('jMMMM jYYYY');
            if (!groups.has(monthKey)) {
                groups.set(monthKey, []);
            }
            groups.get(monthKey)!.push(session);
        });
        return groups;
    }, [filteredSessions]);
    
    useEffect(() => {
        const firstMonthKey = sessionsByMonth.keys().next().value;
        // FIX: Add an explicit type check for firstMonthKey to ensure it's a string before using it as a computed property name.
        if (typeof firstMonthKey === 'string' && !searchTerm) {
             setExpandedMonths({ [firstMonthKey]: true });
        } else if (searchTerm) {
            const allMonthKeys = Array.from(sessionsByMonth.keys());
            const allExpanded: Record<string, boolean> = {};
            for (const key of allMonthKeys) {
                // FIX: Explicitly type check 'key' to resolve "Type 'unknown' cannot be used as an index type" error.
                if (typeof key === 'string') {
                    allExpanded[key] = true;
                }
            }
            setExpandedMonths(allExpanded);
        }
    }, [sessionsByMonth, searchTerm]);


    const toggleMonth = (monthKey: string) => {
        setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
    };

    const handleEdit = (session: Session) => {
        setSessionToEdit(session);
    };

    const handleDeleteRequest = (sessionId: string) => {
        const session = pastSessions.find(s => s.id === sessionId);
        if(session) {
            setSessionToDelete(session);
        }
    };

    const handleSaveAndClose = (sessionData: Session | Omit<Session, 'id'>) => {
        handleSaveSession(sessionData);
        setSessionToEdit(null);
    };
    
    const confirmDelete = () => {
        if (sessionToDelete) {
            handleDeleteSession(sessionToDelete.id);
            setSessionToDelete(null);
        }
    };

    const monthKeys: string[] = Array.from(sessionsByMonth.keys());

    if (isProtectedAndLocked) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl shadow-sm">
                <LockClosedIcon className="w-12 h-12 text-slate-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">آرشیو محافظت شده</h2>
                <p className="text-slate-500 my-2">برای دسترسی به آرشیو جلسات گذشته، لطفا رمز عبور را وارد کنید.</p>
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
                        {isUnlocking ? 'در حال بررسی...' : 'باز کردن'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="text-sm text-sky-600 hover:underline mb-2">&larr; بازگشت به داشبورد</button>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">آرشیو جلسات گذشته</h1>
            </div>
            
            <div className="relative">
                <input
                    type="text"
                    placeholder="جستجوی نام دانش‌آموز..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-3">
                {monthKeys.length > 0 ? monthKeys.map(monthKey => {
                    const monthSessions = sessionsByMonth.get(monthKey)!;
                    const isExpanded = !!expandedMonths[monthKey];
                    return (
                        <div key={monthKey} className="bg-white rounded-xl shadow-sm transition-shadow hover:shadow-md">
                            <button
                                onClick={() => toggleMonth(monthKey)}
                                className={`w-full p-4 text-right flex justify-between items-center transition-colors hover:bg-slate-50 ${isExpanded ? 'rounded-t-xl' : 'rounded-xl'}`}
                            >
                                <p className="font-bold text-lg text-slate-800">{monthKey}</p>
                                <div className="flex items-center">
                                    <span className="text-sm font-semibold bg-sky-100 text-sky-700 px-3 py-1 rounded-full">
                                        {toPersianDigits(monthSessions.length)} جلسه
                                    </span>
                                    <span className={`ml-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                        ▼
                                    </span>
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50 rounded-b-xl">
                                    {monthSessions.map(session => {
                                        const student = studentMap.get(session.studentId);
                                        if (!student) return null;
                                        return (
                                            <SessionCard
                                                key={session.id}
                                                session={session}
                                                student={student}
                                                onEdit={handleEdit}
                                                onDelete={handleDeleteRequest}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )
                }) : (
                     <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                        <p className="text-slate-500">
                            {searchTerm ? `هیچ جلسه گذشته‌ای برای "${searchTerm}" یافت نشد.` : 'هنوز هیچ جلسه‌ای به آرشیو اضافه نشده است.'}
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
            
            {sessionToDelete && (
                <ConfirmationModal
                    title="حذف جلسه"
                    message="آیا از حذف این جلسه اطمینان دارید؟"
                    onConfirm={confirmDelete}
                    onCancel={() => setSessionToDelete(null)}
                    confirmButtonText="بله، حذف کن"
                />
            )}
        </div>
    );
}