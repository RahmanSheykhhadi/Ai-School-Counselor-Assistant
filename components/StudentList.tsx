import React, { useState } from 'react';
import type { Classroom, Student } from '../types';
import { PlusIcon } from './icons';
import Modal from './Modal';
import { useAppContext } from '../context/AppContext';
import { toPersianDigits, normalizePersianChars } from '../utils/helpers';
import ProfilePhoto from './ProfilePhoto';

interface StudentListProps {
  students: Student[];
  classroom: Classroom;
  onSelectStudent: (studentId: string) => void;
  onBack: () => void;
}

interface AddStudentFormProps {
    onAdd: (student: Omit<Student, 'id' | 'photoUrl' | 'classroomId' | 'academicYear'>) => void;
    onCancel: () => void;
}

const AddStudentForm = ({ onAdd, onCancel }: AddStudentFormProps) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [nationality, setNationality] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [grade, setGrade] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (firstName.trim() && lastName.trim()) {
            onAdd({ 
                firstName,
                lastName,
                ...(fatherName.trim() && { fatherName }),
                ...(nationalId.trim() && { nationalId }),
                ...(address.trim() && { address }),
                ...(mobile.trim() && { mobile }),
                ...(nationality.trim() && { nationality }),
                ...(birthDate.trim() && { birthDate }),
                ...(grade.trim() && { grade }),
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">افزودن دانش‌آموز جدید</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                    <label htmlFor="studentFirstName" className="block text-sm font-medium text-slate-700 mb-1">نام <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="studentFirstName"
                        value={firstName}
                        onChange={(e) => setFirstName(normalizePersianChars(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        placeholder="مثال: علی"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="studentLastName" className="block text-sm font-medium text-slate-700 mb-1">نام خانوادگی <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="studentLastName"
                        value={lastName}
                        onChange={(e) => setLastName(normalizePersianChars(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        placeholder="مثال: رضایی"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="fatherName" className="block text-sm font-medium text-slate-700 mb-1">نام پدر</label>
                    <input
                        type="text"
                        id="fatherName"
                        value={fatherName}
                        onChange={(e) => setFatherName(normalizePersianChars(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        placeholder="(اختیاری)"
                    />
                </div>
                 <div>
                    <label htmlFor="nationalId" className="block text-sm font-medium text-slate-700 mb-1">کد ملی</label>
                    <input
                        type="text"
                        id="nationalId"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        placeholder="(اختیاری)"
                    />
                </div>
                <div>
                    <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-1">پایه تحصیلی</label>
                    <input
                        type="text"
                        id="grade"
                        value={grade}
                        onChange={(e) => setGrade(normalizePersianChars(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        placeholder="(اختیاری)"
                    />
                </div>
                <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 mb-1">تاریخ تولد</label>
                    <input
                        type="text"
                        id="birthDate"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        placeholder="مثال: ۱۳۸۸/۰۵/۱۵"
                    />
                </div>
                <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-slate-700 mb-1">شماره موبایل</label>
                    <input
                        type="text"
                        id="mobile"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        placeholder="(اختیاری)"
                    />
                </div>
                 <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-slate-700 mb-1">ملیت</label>
                    <input
                        type="text"
                        id="nationality"
                        value={nationality}
                        onChange={(e) => setNationality(normalizePersianChars(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        placeholder="(اختیاری)"
                    />
                </div>
                <div className="col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">آدرس</label>
                    <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(normalizePersianChars(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        rows={2}
                        placeholder="(اختیاری)"
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-reverse space-x-2 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                    انصراف
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">
                    افزودن
                </button>
            </div>
        </form>
    );
};


export default function StudentList({ students, classroom, onSelectStudent, onBack }: StudentListProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { handleAddStudent: onAddStudent } = useAppContext();

    const handleAddStudent = (student: Omit<Student, 'id' | 'photoUrl' | 'classroomId' | 'academicYear'>) => {
        onAddStudent(student, classroom.id);
        setIsAddModalOpen(false);
    };

    const sortedStudents = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, 'fa'));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <button onClick={onBack} className="text-sm text-sky-600 hover:underline mb-2">&larr; بازگشت به کلاس‌ها</button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">دانش‌آموزان کلاس: {classroom.name}</h1>
                    <p className="text-slate-500 mt-1 text-justify">{toPersianDigits(students.length)} دانش‌آموز در این کلاس ثبت شده است.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-sky-600 transition-colors flex-shrink-0 whitespace-nowrap"
                >
                    <PlusIcon />
                    <span className="mr-2">افزودن دانش‌آموز</span>
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedStudents.map(student => (
                    <div
                        key={student.id}
                        onClick={() => onSelectStudent(student.id)}
                        className="bg-white rounded-xl shadow-sm p-3 text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-sky-400"
                    >
                        <ProfilePhoto 
                            photoUrl={student.photoUrl} 
                            alt={`${student.firstName} ${student.lastName}`} 
                            className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-slate-200" 
                        />
                        <h3 className="font-bold text-base text-slate-800">{`${student.firstName} ${student.lastName}`}</h3>
                        {student.fatherName && <p className="text-sm text-slate-500">فرزند {student.fatherName}</p>}
                    </div>
                ))}
            </div>
            
            {students.length === 0 && (
                <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                    <p className="text-slate-500">هنوز هیچ دانش‌آموزی به این کلاس اضافه نشده است.</p>
                </div>
            )}

            {isAddModalOpen && (
                <Modal onClose={() => setIsAddModalOpen(false)}>
                    <AddStudentForm onAdd={handleAddStudent} onCancel={() => setIsAddModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
}