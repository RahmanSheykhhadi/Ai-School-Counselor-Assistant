import React from 'react';
import moment from 'jalali-moment';
import type { Session } from '../types';
import Modal from './Modal';
import { useAppContext } from '../context/AppContext';
import { PlusIcon, EditIcon, TrashIcon } from './icons';
import { toPersianDigits } from '../utils/helpers';

interface DayDetailModalProps {
    dayMoment: any;
    sessions: Session[];
    isWorkingDay: boolean;
    onClose: () => void;
    onAddSession: () => void;
    onEditSession: (session: Session) => void;
    onDeleteSession: (session: Session) => void;
}

export default function DayDetailModal({ dayMoment, sessions, isWorkingDay, onClose, onAddSession, onEditSession, onDeleteSession }: DayDetailModalProps) {
    const { students, classrooms, sessionTypes } = useAppContext();
    const sortedSessions = [...sessions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <Modal onClose={onClose}>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">
                        جلسات روز {dayMoment.format('dddd jD jMMMM')}
                    </h2>
                    <button
                        onClick={onAddSession}
                        disabled={!isWorkingDay}
                        title={!isWorkingDay ? "امکان افزودن جلسه در روز غیرکاری وجود ندارد" : "افزودن جلسه جدید"}
                        className="flex items-center text-sm bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-sky-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        <PlusIcon />
                        <span className="mr-2">افزودن جلسه</span>
                    </button>
                </div>

                {!isWorkingDay && (
                    <p className="text-amber-700 bg-amber-50 p-3 rounded-md text-sm font-semibold text-center">
                        توجه: این روز، روز کاری شما نیست.
                    </p>
                )}

                <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
                    {sortedSessions.length > 0 ? (
                        sortedSessions.map(session => {
                            const student = students.find(s => s.id === session.studentId);
                            const classroom = student ? classrooms.find(c => c.id === student.classroomId) : null;
                            const sessionType = sessionTypes.find(st => st.id === session.typeId);

                            return (
                                <div key={session.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800">
                                                {student ? `${student.firstName} ${student.lastName}` : 'دانش‌آموز حذف شده'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {classroom ? classroom.name : 'کلاس نامشخص'}
                                            </p>
                                        </div>
                                        <div className="flex space-x-1 space-x-reverse flex-shrink-0">
                                            <button onClick={() => onEditSession(session)} className="p-1 text-slate-500 hover:text-sky-600" title="ویرایش جلسه"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => onDeleteSession(session)} className="p-1 text-slate-500 hover:text-red-600" title="حذف جلسه"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-xs font-semibold bg-sky-100 text-sky-700 px-2 py-1 rounded-full">
                                            {sessionType?.name || 'جلسه'}
                                        </span>
                                        <p className="text-sm font-semibold text-slate-700">
                                            ساعت {toPersianDigits(moment(session.date).format('HH:mm'))}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-slate-500 py-8">
                            هیچ جلسه‌ای برای این روز ثبت نشده است.
                        </p>
                    )}
                </div>
                 <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                        بستن
                    </button>
                </div>
            </div>
        </Modal>
    );
}