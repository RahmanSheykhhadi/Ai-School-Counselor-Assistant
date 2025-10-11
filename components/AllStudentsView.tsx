import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { View, Student, Classroom } from '../types';
import { toPersianDigits, normalizePersianChars } from '../utils/helpers';
import { PlusIcon, SearchIcon, PrintIcon } from './icons';
import AutoAssignModal from './AutoAssignModal';
import ProfilePhoto from './ProfilePhoto';
import Modal from './Modal';
import moment from 'jalali-moment';

interface AllStudentsViewProps {
  onViewStudent: (id: string) => void;
  onNavigate: (view: View) => void;
}

interface AddStudentFormProps {
    onAdd: (student: Omit<Student, 'id' | 'photoUrl' | 'academicYear'>) => void;
    onCancel: () => void;
    classrooms: Classroom[];
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onAdd, onCancel, classrooms }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [mobile, setMobile] = useState('');
    const [classroomId, setClassroomId] = useState('');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (firstName.trim() && lastName.trim()) {
            onAdd({ 
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                classroomId,
                ...(fatherName.trim() && { fatherName: fatherName.trim() }),
                ...(nationalId.trim() && { nationalId: nationalId.trim() }),
                ...(mobile.trim() && { mobile: mobile.trim() }),
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">افزودن دانش‌آموز جدید</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                    <label htmlFor="studentFirstName" className="block text-sm font-medium text-slate-700 mb-1">نام <span className="text-red-500">*</span></label>
                    <input type="text" id="studentFirstName" value={firstName} onChange={(e) => setFirstName(normalizePersianChars(e.target.value))} className="w-full p-2 border border-slate-300 rounded-md" required />
                </div>
                 <div>
                    <label htmlFor="studentLastName" className="block text-sm font-medium text-slate-700 mb-1">نام خانوادگی <span className="text-red-500">*</span></label>
                    <input type="text" id="studentLastName" value={lastName} onChange={(e) => setLastName(normalizePersianChars(e.target.value))} className="w-full p-2 border border-slate-300 rounded-md" required />
                </div>
                <div>
                    <label htmlFor="fatherName" className="block text-sm font-medium text-slate-700 mb-1">نام پدر</label>
                    <input type="text" id="fatherName" value={fatherName} onChange={(e) => setFatherName(normalizePersianChars(e.target.value))} className="w-full p-2 border border-slate-300 rounded-md" />
                </div>
                 <div>
                    <label htmlFor="nationalId" className="block text-sm font-medium text-slate-700 mb-1">کد ملی</label>
                    <input type="text" id="nationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                </div>
                 <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-slate-700 mb-1">شماره موبایل</label>
                    <input type="text" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                </div>
                 <div>
                    <label htmlFor="classroomId" className="block text-sm font-medium text-slate-700 mb-1">کلاس</label>
                    <select id="classroomId" value={classroomId} onChange={(e) => setClassroomId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                        <option value="">-- بدون کلاس --</option>
                        {classrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-reverse space-x-2 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">انصراف</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">افزودن</button>
            </div>
        </form>
    );
};

const AllStudentsView: React.FC<AllStudentsViewProps> = ({ onViewStudent, onNavigate }) => {
    const { students, classrooms, handleAddStudent } = useAppContext();
    const [isAutoAssignModalOpen, setIsAutoAssignModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClassroomId, setFilterClassroomId] = useState('all');

    const filteredStudents = useMemo(() => {
        let result = [...students];

        if (filterClassroomId !== 'all') {
            if (filterClassroomId === 'none') {
                result = result.filter(s => !s.classroomId);
            } else {
                result = result.filter(s => s.classroomId === filterClassroomId);
            }
        }

        if (searchTerm.trim()) {
            const normalizedSearch = normalizePersianChars(searchTerm.toLowerCase());
            result = result.filter(s => 
                normalizePersianChars(`${s.firstName} ${s.lastName}`).toLowerCase().includes(normalizedSearch) ||
                (s.nationalId && s.nationalId.includes(normalizedSearch))
            );
        }

        return result.sort((a, b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [students, searchTerm, filterClassroomId]);

    const handleAdd = (studentData: Omit<Student, 'id' | 'photoUrl' | 'academicYear'>) => {
        handleAddStudent(studentData);
        setIsAddModalOpen(false);
    };

    const handleExportClassList = () => {
        if (filterClassroomId === 'all' || filterClassroomId === 'none') return;
    
        const classroom = classrooms.find(c => c.id === filterClassroomId);
        if (!classroom) return;
    
        const studentsInClass = students
            .filter(s => s.classroomId === filterClassroomId)
            .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fa'));
    
        if (studentsInClass.length === 0) {
            alert('کلاس انتخاب شده دانش‌آموزی ندارد.');
            return;
        }
    
        const sanitize = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const userIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;
    
        const studentRows = studentsInClass.map((student, index) => {
            const photoContent = student.photoUrl 
                ? `<img class="profile-photo" src="${student.photoUrl}" alt="photo">`
                : `<div class="profile-photo icon-placeholder">${userIconSvg}</div>`;
            return `<tr>
                <td>${toPersianDigits(index + 1)}</td>
                <td class="student-cell">${photoContent}<span>${sanitize(student.firstName)} ${sanitize(student.lastName)}</span></td>
                ${'<td class="day-cell"></td>'.repeat(31)}
            </tr>`
        }).join('');

        const today = moment().locale('fa');
        const monthName = today.format('jMMMM');
        const year = today.format('jYYYY');
        const daysInMonth = 31;
    
        let headerHtml = `<tr><th style="width: 25px;">#</th><th class="student-name-header" style="text-align: center;">اسامی دانش‌آموزان</th>`;
        for (let i = 1; i <= daysInMonth; i++) {
            headerHtml += `<th class="day-col">${toPersianDigits(i)}</th>`;
        }
        headerHtml += '</tr>';
    
        const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>لیست حضور و غیاب کلاس ${sanitize(classroom.name)}</title>
                <style>
                    @font-face {
                        font-family: 'B Yekan';
                        src: url('https://cdn.jsdelivr.net/gh/s-amir-p/F fonts/BYekan/BYekan+.woff2') format('woff2');
                    }
                    body { font-family: 'B Yekan', sans-serif; direction: rtl; background: #f0f2f5; }
                    .container { max-width: 98%; width: 1400px; margin: 1em auto; background: white; padding: 1em; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; }
                    h1 { text-align: center; color: #333; }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                    th, td { border: 1px solid #ccc; padding: 4px; text-align: center; height: 28px; }
                    thead th { background-color: #e9ecef; position: sticky; top: 0; z-index: 1; }
                    .student-name-header { text-align: right; padding-right: 10px; width: 200px; }
                    .student-cell { display: flex; align-items: center; text-align: right; }
                    .day-col { width: 25px; }
                    .profile-photo { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; margin-left: 5px; flex-shrink: 0; }
                    .icon-placeholder { background: #e9ecef; display:flex; align-items:center; justify-content:center; }
                    .controls { padding: 10px; background: #343a40; color: white; text-align: center; border-radius: 8px; margin-bottom: 1em; }
                    .controls button { background: #6c757d; color: white; border: none; padding: 5px 10px; margin: 0 5px; cursor: pointer; border-radius: 3px; }
                    .controls button:hover { background: #5a6268; }
                    .controls label { margin: 0 10px; }

                    @page { size: A4 landscape; margin: 1cm; }
                    @media print {
                        body { background: none; font-size: 7.5pt; }
                        .container { box-shadow: none; padding: 0; margin: 0; width: 100%; max-width: 100%; }
                        .controls { display: none; }
                        td, th { padding: 2px; height: 22px; }
                        .student-name-header { width: 150px; }
                        .day-col { width: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="controls non-printable-area">
                        <label>اندازه فونت:</label>
                        <button id="font-dec">-</button>
                        <span id="font-size-display" style="margin: 0 5px;">10</span>pt
                        <button id="font-inc">+</button>
                    </div>
                    <h1>لیست حضور و غیاب کلاس ${sanitize(classroom.name)} - ${monthName} ${toPersianDigits(year)}</h1>
                    <div style="overflow-x: auto;">
                        <table id="attendance-table">
                            <thead>${headerHtml}</thead>
                            <tbody>${studentRows}</tbody>
                        </table>
                    </div>
                </div>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        const table = document.getElementById('attendance-table');
                        const display = document.getElementById('font-size-display');
                        let currentSize = 10;
                        
                        function updateFontSize() {
                            if(table) table.style.fontSize = currentSize + 'pt';
                            if(display) display.textContent = currentSize;
                        }

                        const fontIncBtn = document.getElementById('font-inc');
                        if (fontIncBtn) {
                            fontIncBtn.addEventListener('click', () => { currentSize++; updateFontSize(); });
                        }
                        
                        const fontDecBtn = document.getElementById('font-dec');
                        if (fontDecBtn) {
                            fontDecBtn.addEventListener('click', () => { if (currentSize > 6) currentSize--; updateFontSize(); });
                        }
                        
                        updateFontSize();
                    });
                </script>
            </body>
            </html>
        `;
    
        const blob = new Blob([htmlTemplate], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `attendance-list-${classroom.name}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="space-y-6">
            <div className="text-center md:hidden">
                <p className="text-slate-500 mt-1">تعداد کل: {toPersianDigits(students.length)} دانش‌آموز</p>
            </div>
             <div className="text-center hidden md:block">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">لیست کل دانش‌آموزان</h1>
                <p className="text-slate-500 mt-1">تعداد کل: {toPersianDigits(students.length)} دانش‌آموز</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
                 <button onClick={() => setIsAutoAssignModalOpen(true)} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 transition-colors text-sm">
                    ورود اکسل
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-sky-500 text-white font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-sky-600 transition-colors text-sm">
                    <PlusIcon className="w-4 h-4" />
                    <span className="mr-2">افزودن</span>
                </button>
                <button onClick={() => onNavigate('classroom-manager')} className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-600 transition-colors text-sm">
                    مدیریت کلاس‌ها
                </button>
                 <button onClick={() => onNavigate('manual-assign')} className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg shadow-sm hover:bg-amber-600 transition-colors text-sm">
                    کلاس‌بندی دستی
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="جستجوی نام یا کد ملی..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 pr-10 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    />
                    <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={filterClassroomId}
                        onChange={e => setFilterClassroomId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-sky-500 focus:border-sky-500"
                    >
                        <option value="all">همه کلاس‌ها</option>
                        <option value="none">دانش‌آموزان بدون کلاس</option>
                        {classrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleExportClassList}
                        disabled={filterClassroomId === 'all' || filterClassroomId === 'none'}
                        title="دریافت خروجی HTML از کلاس انتخاب شده"
                        className="p-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                        <PrintIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredStudents.map(student => {
                    const classroom = classrooms.find(c => c.id === student.classroomId);
                    return (
                        <div
                            key={student.id}
                            onClick={() => onViewStudent(student.id)}
                            className="bg-white rounded-xl shadow-sm p-3 text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-sky-400"
                        >
                            <ProfilePhoto 
                                photoUrl={student.photoUrl} 
                                alt={`${student.firstName} ${student.lastName}`} 
                                className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-slate-200" 
                            />
                            <h3 className="font-bold text-base text-slate-800">{`${student.firstName} ${student.lastName}`}</h3>
                            {student.fatherName && <p className="text-sm text-slate-500">فرزند {student.fatherName}</p>}
                            <p className="text-[13px] text-slate-500 mt-1">{classroom ? classroom.name : 'بدون کلاس'}</p>
                        </div>
                    );
                })}
            </div>
            
            {filteredStudents.length === 0 && (
                <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                    <p className="text-slate-500">
                        {students.length === 0 
                            ? 'دانش‌آموزان و کلاس‌ها را وارد کنید.' 
                            : 'دانش‌آموزی با این مشخصات یافت نشد.'}
                    </p>
                </div>
            )}

            {isAutoAssignModalOpen && <AutoAssignModal onClose={() => setIsAutoAssignModalOpen(false)} />}
            {isAddModalOpen && <Modal onClose={() => setIsAddModalOpen(false)}><AddStudentForm onAdd={handleAdd} onCancel={() => setIsAddModalOpen(false)} classrooms={classrooms} /></Modal>}
        </div>
    );
};

export default AllStudentsView;