import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { toPersianDigits } from '../utils/helpers';
import ProfilePhoto from './ProfilePhoto';
import { SaveIcon, ArrowRightIcon } from './icons';

interface ManualAssignViewProps {
  onBack: () => void;
}

const ManualAssignView: React.FC<ManualAssignViewProps> = ({ onBack }) => {
    const { students, classrooms, handleBatchUpdateStudentDetails } = useAppContext();
    const [assignments, setAssignments] = useState<Record<string, string>>({});
    const [toastMessage, setToastMessage] = useState('');

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
            setAssignments({});
            setToastMessage('تغییرات با موفقیت ذخیره شد.');
            setTimeout(() => setToastMessage(''), 3000);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} title="بازگشت به لیست دانش‌آموزان" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-sky-600 transition-colors mb-2">
                    <ArrowRightIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">کلاس‌بندی دستی</h1>
                <p className="text-slate-500 mt-1">دانش‌آموزان بدون کلاس را به کلاس مربوطه اختصاص دهید.</p>
            </div>
            
            {unassignedStudents.length > 0 ? (
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm">
                    <div className="space-y-3">
                        {unassignedStudents.map(student => (
                            <div key={student.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <ProfilePhoto photoUrl={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-slate-800">{student.firstName} {student.lastName}</p>
                                    </div>
                                </div>
                                <div>
                                    <select
                                        value={assignments[student.id] || ''}
                                        onChange={(e) => handleAssignmentChange(student.id, e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-sky-500 focus:border-sky-500"
                                    >
                                        <option value="">-- انتخاب کلاس --</option>
                                        {classrooms.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="flex justify-end mt-6">
                        <button
                            onClick={handleSaveChanges}
                            disabled={Object.keys(assignments).length === 0}
                            title="ذخیره تغییرات"
                            className="p-2 bg-sky-500 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            <SaveIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                    <p className="text-slate-500">تمام دانش‌آموزان دارای کلاس هستند.</p>
                </div>
            )}
             {toastMessage && (
                <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default ManualAssignView;