import React from 'react';
import { useAppContext } from '../context/AppContext';
import moment from 'jalali-moment';
import type { View } from '../types';
import { toPersianDigits } from '../utils/helpers';
import ProfilePhoto from './ProfilePhoto';

interface UpcomingSessionsViewProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

const UpcomingSessionsView: React.FC<UpcomingSessionsViewProps> = ({ onBack, onNavigate }) => {
  const { sessions, students, classrooms, sessionTypes, setCalendarTargetDate } = useAppContext();
  
  const upcomingSessions = React.useMemo(() => {
    const now = moment();
    return sessions
        .filter(s => moment(s.date).isAfter(now))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions]);
  
  const handleSessionClick = (sessionDate: string) => {
    setCalendarTargetDate(new Date(sessionDate));
    onNavigate('calendar');
  };

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="text-sm text-sky-600 hover:underline mb-2">&larr; بازگشت به داشبورد</button>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">تمام جلسات پیش رو</h1>
      </div>
      
      <div className="bg-white p-3 sm:p-5 rounded-xl shadow-sm">
        <div className="space-y-3">
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map(session => {
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
                                <p className="text-xs text-slate-500">
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
            <p className="text-slate-500 text-center py-8">جلسه برنامه‌ریزی شده‌ای وجود ندارد.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingSessionsView;