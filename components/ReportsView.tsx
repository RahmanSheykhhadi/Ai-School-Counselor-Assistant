import React, { useState, useMemo } from 'react';
import moment from 'jalali-moment';
import { useAppContext } from '../context/AppContext';
import PersianDatePicker from './PersianDatePicker';
import { sortClassrooms, toPersianDigits } from '../utils/helpers';

export default function ReportsView() {
    const { sessions, sessionTypes, students, classrooms } = useAppContext();
    const [startDate, setStartDate] = useState(() => moment().locale('fa').startOf('jMonth').toDate());
    const [endDate, setEndDate] = useState(() => moment().locale('fa').endOf('jMonth').toDate());
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');

    const filteredSessions = useMemo(() => {
        const start = moment(startDate).startOf('day');
        const end = moment(endDate).endOf('day');

        return sessions.filter(s => {
            const sessionMoment = moment(s.date);
            const isInDateRange = sessionMoment.isBetween(start, end, undefined, '[]');
            if (!isInDateRange) return false;

            if (selectedClassroomId === 'all') return true;
            
            const student = students.find(stud => stud.id === s.studentId);
            return student?.classroomId === selectedClassroomId;
        });
    }, [startDate, endDate, sessions, selectedClassroomId, students]);

    const reportData = useMemo(() => {
        const total = filteredSessions.length;
        if (total === 0) return null;

        const counts = filteredSessions.reduce((acc, session) => {
            acc[session.typeId] = (acc[session.typeId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const details = sessionTypes
            .map(type => ({
                id: type.id,
                name: type.name,
                count: counts[type.id] || 0,
            }))
            .filter(item => item.count > 0)
            .sort((a,b) => b.count - a.count);

        return { total, details };
    }, [filteredSessions, sessionTypes]);
    
    const sortedClassrooms = sortClassrooms(classrooms);
    
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">گزارشات</h1>
            <p className="text-slate-500 mt-1 text-justify">تحلیل فراوانی انواع جلسات در بازه‌های زمانی دلخواه.</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-4 transition-shadow hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-700">فیلترهای گزارش</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">از تاریخ:</label>
                    <PersianDatePicker selectedDate={startDate} onChange={setStartDate} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">تا تاریخ:</label>
                    <PersianDatePicker selectedDate={endDate} onChange={setEndDate} />
                </div>
                 <div>
                    <label htmlFor="classroom-filter" className="block text-sm font-medium text-slate-600 mb-1">فیلتر بر اساس کلاس:</label>
                    <select id="classroom-filter" value={selectedClassroomId} onChange={e => setSelectedClassroomId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-sky-500 focus:border-sky-500">
                        <option value="all">همه کلاس‌ها</option>
                        {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm transition-shadow hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">نتایج گزارش</h2>
            {!reportData ? (
                <p className="text-slate-500 text-center py-8">هیچ جلسه‌ای با فیلترهای انتخابی یافت نشد.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-center">
                        <thead className="border-b bg-slate-50">
                            <tr>
                                <th scope="col" className="text-sm font-bold text-slate-800 px-6 py-3">نوع جلسه</th>
                                <th scope="col" className="text-sm font-bold text-slate-800 px-6 py-3">تعداد (فراوانی)</th>
                                <th scope="col" className="text-sm font-bold text-slate-800 px-6 py-3">درصد</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.details.map(item => {
                                const percentage = ((item.count / reportData.total) * 100).toFixed(1);
                                return (
                                <tr key={item.id} className="border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{toPersianDigits(item.count)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        <div className="flex items-center justify-center gap-2">
                                            <span>%{toPersianDigits(percentage)}</span>
                                            <div className="w-24 bg-slate-200 rounded-full h-2.5">
                                                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-slate-100">
                                <td className="px-6 py-3">مجموع</td>
                                <td className="px-6 py-3">{toPersianDigits(reportData.total)}</td>
                                <td className="px-6 py-3">{toPersianDigits('100')}%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
}