import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { toPersianDigits, sortClassrooms } from '../utils/helpers';
import ProfilePhoto from './ProfilePhoto';
import { SaveIcon, ArrowRightIcon } from './icons';

interface ManualAssignViewProps {
  onBack: () => void;
}

export const ManualAssignView: React.FC<ManualAssignViewProps> = ({ onBack }) => {
    const { students, classrooms, handleBatchUpdateStudentDetails } = useAppContext();
    const [assignments, setAssignments] = useState<Record<string, string>>({});
    const [toastMessage, setToastMessage] = useState('');

    const sortedClassrooms = useMemo(() => sortClassrooms(classrooms), [classrooms]);

    const unassignedStudents = useMemo(() => {
        return students.filter(s => !s.classroomId)
            .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [students]);

    const handleAssignmentChange = (studentId: string, classroomId: string) => {
        setAssignments(prev => ({ ...prev, [studentId]: classroomId }));
    };

    const handleSaveChanges = async () => {
        const updates = Object.entries(assignments)
            .filter(([, classroomId]) => classroomId) // Ensure we don't send empty updates
            .map(([studentId, classroomId]) => ({
                studentId,
                data: { classroomId }
            }));

        if (updates.length > 0) {
            await handleBatchUpdateStudentDetails(updates);
            setToastMessage(`${toPersianDigits(updates.length)} دانش‌آموز با موفقیت کلاس‌بندی شدند.`);
            setTimeout(() => setToastMessage(''), 3000);
            setAssignments({});
        } else {
            setToastMessage('هیچ تغییری برای ذخیره وجود ندارد.');
            setTimeout(() => setToastMessage(''), 3000);
        }
    };
    
    return (
        <div className="space-y-6">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="hidden md:block">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">کلاس‌بندی دستی</h1>
                        <p className="text-slate-500 mt-1">دانش‌آموزان بدون کلاس را به کلاس‌های مربوطه اختصاص دهید.</p>
                    </div>
                    <button
                        onClick={handleSaveChanges}
                        disabled={Object.keys(assignments).length === 0}
                        className="self-center sm:self-auto flex items-center bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors disabled:bg-slate-400"
                    >
                        <SaveIcon className="w-5 h-5" />
                        <span className="mr-2">ذخیره تغییرات</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm">
                {unassignedStudents.length > 0 ? (
                    <div className="space-y-4">
                        {unassignedStudents.map(student => (
                            <div key={student.id} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <ProfilePhoto photoUrl={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-slate-800">{student.firstName} {student.lastName}</p>
                                        {student.fatherName && <p className="text-sm text-slate-500">فرزند {student.fatherName}</p>}
                                    </div>
                                </div>
                                <div className="mt-3 sm:mt-0 w-full sm:w-auto sm:max-w-xs">
                                    <select
                                        value={assignments[student.id] || ''}
                                        onChange={(e) => handleAssignmentChange(student.id, e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-sky-500 focus:border-sky-500"
                                    >
                                        <option value="">-- انتخاب کلاس --</option>
                                        {sortedClassrooms.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-8">
                        تمام دانش‌آموزان کلاس‌بندی شده‌اند.
                    </p>
                )}
            </div>

            {toastMessage && (
                <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};