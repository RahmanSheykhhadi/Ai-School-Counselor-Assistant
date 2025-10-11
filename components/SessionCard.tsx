import React, { useState } from 'react';
import type { Session, Student } from '../types';
import { useAppContext } from '../context/AppContext';
import { EditIcon, TrashIcon, LockClosedIcon, ChevronDownIcon } from './icons';
import { toPersianDigits } from '../utils/helpers';
import ProfilePhoto from './ProfilePhoto';

interface SessionCardProps {
    session: Session;
    student?: Student;
    onEdit: (session: Session) => void;
    onDelete: (sessionId: string) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, student, onEdit, onDelete }) => {
    const { sessionTypes, appSettings, isArchiveUnlocked, classrooms } = useAppContext();
    const [isExpanded, setIsExpanded] = useState(false);
    const sessionType = sessionTypes.find(st => st.id === session.typeId);
    const sessionDate = new Date(session.date);
    const formattedDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(sessionDate);
    
    const isPastSession = new Date(session.date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
    const isProtectedAndLocked = appSettings.passwordProtectionEnabled && isPastSession && !isArchiveUnlocked;

    const classroom = student ? classrooms.find(c => c.id === student.classroomId) : null;

    return (
        <div className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 transition-all ${isProtectedAndLocked ? 'bg-slate-50 opacity-70' : ''}`}>
            {isProtectedAndLocked ? (
                <div className="flex items-center justify-center h-full min-h-[100px]">
                    <LockClosedIcon className="w-5 h-5 mr-2 text-slate-500" />
                    <p className="text-slate-500 font-semibold">برای مشاهده جزئیات، آرشیو را باز کنید</p>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                {student && <ProfilePhoto photoUrl={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-10 h-10 rounded-full flex-shrink-0" />}
                                <div>
                                    {student && (
                                        <p className="font-bold text-base text-slate-800">
                                            {student.firstName} {student.lastName} {classroom && <span className="text-sm font-normal text-slate-500">({classroom.name})</span>}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-slate-600">{toPersianDigits(formattedDate)}</p>
                                        {sessionType && <span className="font-semibold bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full">{sessionType.name}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-1 space-x-reverse sm:hidden">
                                <button onClick={() => onEdit(session)} className="p-2 text-slate-500 hover:text-sky-600 rounded-full hover:bg-slate-100" aria-label="ویرایش جلسه"><EditIcon className="w-5 h-5" /></button>
                                <button onClick={() => onDelete(session.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100" aria-label="حذف جلسه"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                        
                        {(session.notes || session.actionItems) && (
                            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center text-sm text-sky-600 font-semibold mt-3 mb-2 py-1">
                                <span>{isExpanded ? ' بستن جزئیات' : 'نمایش جزئیات'}</span>
                                <ChevronDownIcon className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                        
                        {isExpanded && (
                            <div className="space-y-3 pt-2 border-t mt-2">
                                {session.notes && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-slate-600">خلاصه جلسه:</h4>
                                        <p className="text-sm text-slate-500 whitespace-pre-wrap mt-1 text-justify">{session.notes}</p>
                                    </div>
                                )}
                                {session.actionItems && (
                                    <div className="mt-3">
                                        <h4 className="font-semibold text-sm text-slate-600">اقدامات:</h4>
                                        <p className="text-sm text-slate-500 whitespace-pre-wrap mt-1 text-justify">{session.actionItems}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="hidden sm:flex flex-col space-y-2 flex-shrink-0">
                        <button onClick={() => onEdit(session)} className="p-2 text-slate-500 hover:text-sky-600 rounded-full hover:bg-slate-100" aria-label="ویرایش جلسه"><EditIcon className="w-5 h-5" /></button>
                        <button onClick={() => onDelete(session.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100" aria-label="حذف جلسه"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionCard;