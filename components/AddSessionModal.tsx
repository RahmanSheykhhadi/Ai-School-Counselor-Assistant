import React, { useState, useRef, useEffect } from 'react';
import type { Student, Session } from '../types';
import Modal from './Modal';
import PersianDatePicker from './PersianDatePicker';
import { useAppContext } from '../context/AppContext';
import { normalizePersianChars } from '../utils/helpers';

interface AddSessionModalProps {
    preselectedDate: Date;
    onClose: () => void;
    onSave: (session: Omit<Session, 'id' | 'academicYear'>) => void;
}

export default function AddSessionModal({ preselectedDate, onClose, onSave }: AddSessionModalProps) {
    const { students, classrooms, sessionTypes } = useAppContext();
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState<Date>(preselectedDate);
    const [typeId, setTypeId] = useState<string>(sessionTypes[0]?.id || '');
    const [notes, setNotes] = useState('');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredStudents = students.filter(student =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId) {
            alert('لطفا یک دانش‌آموز را انتخاب کنید.');
            return;
        }
        if (!typeId) {
            alert('لطفا نوع جلسه را انتخاب کنید.');
            return;
        }

        onSave({
            studentId: selectedStudentId,
            date: date.toISOString(),
            typeId,
            notes: notes,
        });
    };
    
    const handleSelectStudent = (student: Student) => {
        const classroom = classrooms.find(c => c.id === student.classroomId);
        const studentDisplayName = [
            `${student.firstName} ${student.lastName}`,
            classroom ? ` - ${classroom.name}` : ''
        ].join('');

        // FIX: Defer state updates to the next event loop cycle.
        // This prevents a race condition where the dropdown item (the event target)
        // is removed from the DOM before the document's mousedown listener
        // (in Modal.tsx) can verify that the click occurred inside the modal.
        // Without this, the listener would see a detached element and incorrectly
        // trigger the modal's onClose behavior.
        setTimeout(() => {
            setSelectedStudentId(student.id);
            setSearchTerm(studentDisplayName);
            setIsDropdownOpen(false);
        }, 0);
    };

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">افزودن جلسه جدید</h2>
                
                <div>
                    <label htmlFor="student-search" className="block text-sm font-medium text-slate-700 mb-1">دانش‌آموز</label>
                    <div className="relative" ref={searchRef}>
                        <input
                            type="text"
                            id="student-search"
                            placeholder="جستجو و انتخاب دانش‌آموز..."
                            value={searchTerm}
                            onChange={e => {
                                const normalized = normalizePersianChars(e.target.value);
                                setSearchTerm(normalized);
                                if (selectedStudentId) setSelectedStudentId('');
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                            autoComplete="off"
                        />
                        {isDropdownOpen && searchTerm && filteredStudents.length > 0 && !selectedStudentId && (
                            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                {filteredStudents.map(student => {
                                    const classroom = classrooms.find(c => c.id === student.classroomId);
                                    return (
                                        <li
                                            key={student.id}
                                            className="p-2 hover:bg-sky-100 cursor-pointer"
                                            onMouseDown={() => handleSelectStudent(student)}
                                        >
                                            {`${student.firstName} ${student.lastName}`}
                                            {student.fatherName && <span className="text-xs text-slate-500 mr-1">(فرزند {student.fatherName})</span>}
                                            {classroom && <span className="text-sm text-slate-600"> - {classroom.name}</span>}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                         {isDropdownOpen && searchTerm && filteredStudents.length === 0 && !selectedStudentId && (
                            <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 p-2 text-slate-500">
                                دانش‌آموزی یافت نشد.
                            </div>
                         )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">تاریخ و ساعت جلسه</label>
                    <PersianDatePicker selectedDate={date} onChange={setDate} />
                </div>

                <div>
                    <label htmlFor="sessionType" className="block text-sm font-medium text-slate-700 mb-1">نوع جلسه</label>
                     {sessionTypes.length > 0 ? (
                        <select
                            id="sessionType"
                            value={typeId}
                            onChange={e => setTypeId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md bg-white"
                            required
                        >
                            <option value="" disabled>یک گزینه را انتخاب کنید</option>
                            {sessionTypes.map(st => (
                                <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="w-full p-2 border border-amber-300 rounded-md bg-amber-50 text-amber-800 text-sm">
                            ابتدا باید در بخش «تنظیمات» یک نوع جلسه تعریف کنید.
                        </div>
                    )}
                </div>
                
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">خلاصه و نتایج جلسه (اختیاری)</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={e => setNotes(normalizePersianChars(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-md"
                        rows={4}
                        placeholder="مشاهدات، موارد مطرح شده، توافقات و..."
                    />
                </div>

                <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                        انصراف
                    </button>
                    <button type="submit" disabled={sessionTypes.length === 0} className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        ذخیره جلسه
                    </button>
                </div>
            </form>
        </Modal>
    );
}
