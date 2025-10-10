import React, { useState, useMemo, useEffect, useCallback } from 'react';
import moment from 'jalali-moment';
import { useAppContext } from '../context/AppContext';
import type { Session, WorkingDays } from '../types';
import DayDetailModal from './DayDetailModal';
import AddSessionModal from './AddSessionModal';
import ConfirmationModal from './ConfirmationModal';
import SessionModal from './SessionModal';
import { toPersianDigits } from '../utils/helpers';

export default function CalendarView() {
    const { sessions, workingDays, handleSaveSession, handleDeleteSession, calendarTargetDate, setCalendarTargetDate } = useAppContext();
    const [currentMoment, setCurrentMoment] = useState(() => moment().locale('fa'));

    const [dayDetail, setDayDetail] = useState<{ dayMoment: any; sessions: Session[]; isWorkingDay: boolean } | null>(null);
    const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
    const [preselectedDateForAdd, setPreselectedDateForAdd] = useState(new Date());

    const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
    
    const dayMap: (keyof WorkingDays)[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    const sessionsByDay = useMemo(() => {
        const map = new Map<string, Session[]>();
        sessions.forEach(session => {
            const dayKey = moment(session.date).locale('fa').format('jYYYY/jM/jD');
            if (!map.has(dayKey)) {
                map.set(dayKey, []);
            }
            map.get(dayKey)!.push(session);
        });
        return map;
    }, [sessions]);
    
    const handleDayClick = useCallback((dayMoment: any) => {
        const dayKey = dayMoment.format('jYYYY/jM/jD');
        const daySessions = sessionsByDay.get(dayKey) || [];
        const dayIndex = dayMoment.day(); // jalali-moment: Saturday=6, Sunday=0, ... Friday=5
        const mappedDayIndex = (dayIndex + 1) % 7; // Convert to: Saturday=0, Sunday=1, ... Friday=6
        const dayKeyEng = dayMap[mappedDayIndex];
        const isWorking = workingDays[dayKeyEng];
        setDayDetail({ dayMoment, sessions: daySessions, isWorkingDay: isWorking });
    }, [sessionsByDay, workingDays, dayMap]);

    // Effect to handle navigation from other views (e.g., Upcoming Sessions)
    useEffect(() => {
        if (calendarTargetDate) {
            const targetMoment = moment(calendarTargetDate).locale('fa');
            setCurrentMoment(targetMoment); // Navigate to the correct month
            handleDayClick(targetMoment);  // Open the detail modal for the specific day
            setCalendarTargetDate(null);   // Consume the target date so it doesn't trigger again
        }
    }, [calendarTargetDate, setCalendarTargetDate, handleDayClick]);


    const calendarGrid = useMemo(() => {
        const startOfMonth = currentMoment.clone().startOf('jMonth');
        const endOfMonth = currentMoment.clone().endOf('jMonth');
        const days = [];
        let day = startOfMonth.clone().startOf('week');
        
        while (day.isSameOrBefore(endOfMonth.clone().endOf('week'))) {
            days.push(day.clone());
            day.add(1, 'day');
        }
        return days;
    }, [currentMoment]);

    const changeMonth = (amount: number) => {
        setCurrentMoment(prev => prev.clone().add(amount, 'jMonth'));
    };
    
    const handleOpenAddSessionFromDetail = () => {
        if(dayDetail) {
            setPreselectedDateForAdd(dayDetail.dayMoment.toDate());
            setIsAddSessionModalOpen(true);
            setDayDetail(null);
        }
    };

    const handleEditSessionFromDetail = (session: Session) => {
        setSessionToEdit(session);
        setDayDetail(null);
    };

    const handleDeleteSessionFromDetail = (session: Session) => {
        setSessionToDelete(session);
        setDayDetail(null);
    };

    const handleSaveAndClose = (sessionData: Session | Omit<Session, 'id'>) => {
        handleSaveSession(sessionData);
        setIsAddSessionModalOpen(false);
        setSessionToEdit(null);
    };
    
    const confirmDelete = () => {
        if(sessionToDelete) {
            handleDeleteSession(sessionToDelete.id);
            setSessionToDelete(null);
        }
    };
    
    const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">تقویم جلسات</h1>
                <p className="text-slate-500 mt-1">جلسات مشاوره خود را در این تقویم مشاهده و مدیریت کنید.</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100">&larr;</button>
                    <span className="text-lg font-bold text-slate-800">{currentMoment.format('jMMMM jYYYY')}</span>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100">&rarr;</button>
                </div>
                <div className="max-w-sm mx-auto">
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {weekDays.map(day => <div key={day} className="font-semibold text-slate-600 py-2">{day}</div>)}
                        {calendarGrid.map((dayMoment, index) => {
                            const isCurrentMonth = dayMoment.isSame(currentMoment, 'jMonth');
                            const dayKey = dayMoment.format('jYYYY/jM/jD');
                            const daySessions = sessionsByDay.get(dayKey) || [];
                            
                             const dayIndex = dayMoment.day(); // jalali-moment: Saturday=6, Sunday=0, ... Friday=5
                             const mappedDayIndex = (dayIndex + 1) % 7; // Convert to: Saturday=0, Sunday=1, ... Friday=6
                             const dayKeyEng = dayMap[mappedDayIndex];
                             const isWorking = workingDays[dayKeyEng];
                            
                            return (
                                <div
                                    key={index}
                                    onClick={() => handleDayClick(dayMoment)}
                                    className={`aspect-square w-full p-0 border border-transparent flex flex-col items-center justify-center cursor-pointer transition-colors rounded-md
                                    ${isCurrentMonth ? (isWorking ? 'bg-white hover:bg-sky-50' : 'bg-slate-50 hover:bg-slate-100 text-slate-500') : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                                    ${moment().isSame(dayMoment, 'day') ? 'ring-2 ring-sky-500' : ''}
                                    `}
                                >
                                    <span className={`text-sm font-semibold`}>
                                        {toPersianDigits(dayMoment.format('jD'))}
                                    </span>
                                    {daySessions.length > 0 && (
                                        <div className="w-5 h-5 mt-0.5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full">
                                            {toPersianDigits(daySessions.length)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {dayDetail && (
                <DayDetailModal 
                    dayMoment={dayDetail.dayMoment}
                    sessions={dayDetail.sessions}
                    isWorkingDay={dayDetail.isWorkingDay}
                    onClose={() => setDayDetail(null)}
                    onAddSession={handleOpenAddSessionFromDetail}
                    onEditSession={handleEditSessionFromDetail}
                    onDeleteSession={handleDeleteSessionFromDetail}
                />
            )}
            {isAddSessionModalOpen && (
                <AddSessionModal 
                    preselectedDate={preselectedDateForAdd}
                    onClose={() => setIsAddSessionModalOpen(false)}
                    onSave={handleSaveAndClose}
                />
            )}
            {sessionToEdit && (
                <SessionModal 
                    student={useAppContext().students.find(s => s.id === sessionToEdit.studentId)!}
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