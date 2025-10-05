import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student, SpecialStudentInfo } from '../types';
import Modal from './Modal';
import ProfilePhoto from './ProfilePhoto';
import { toPersianDigits, verifyPassword, normalizePersianChars } from '../utils/helpers';
import { EditIcon, StarIcon, LockClosedIcon, TrashIcon, SearchIcon, PrintIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

// A map for checkbox labels and corresponding property names
const specialInfoMap: { key: keyof SpecialStudentInfo; label:string }[] = [
    { key: 'hasPhysicalProblem', label: 'مشکل جسمی' },
    { key: 'hasMentalProblem', label: 'مشکل روحی/روانی' },
    { key: 'isDivorcedParents', label: 'والدین مطلقه' },
    { key: 'isNeglected', label: 'بی‌سرپرست/بدسرپرست' },
    { key: 'isUnderCare', label: 'تحت پوشش نهاد حمایتی' },
    { key: 'hasDeceasedParent', label: 'والد/والدین مرحوم' },
    { key: 'hasSeverePoverty', label: 'فقر شدید' },
    { key: 'isOther', label: 'سایر موارد' },
];

const EditSpecialInfoModal: React.FC<{
    student: Student;
    info: SpecialStudentInfo | undefined;
    onSave: (info: SpecialStudentInfo) => void;
    onClose: () => void;
}> = ({ student, info, onSave, onClose }) => {
    const [localInfo, setLocalInfo] = useState<SpecialStudentInfo>(
        info || { studentId: student.id }
    );

    const handleCheckboxChange = (key: keyof SpecialStudentInfo) => {
        setLocalInfo(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };
    
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalInfo(prev => ({...prev, notes: normalizePersianChars(e.target.value)}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(localInfo);
    };

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">ویرایش اطلاعات دانش‌آموز خاص</h2>
                <div className="flex items-center gap-3">
                    <ProfilePhoto photoUrl={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-12 h-12 rounded-full"/>
                    <p className="font-semibold">{student.firstName} {student.lastName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {specialInfoMap.map(({ key, label }) => (
                         <div key={key} className="flex items-center p-2 bg-slate-50 rounded-md">
                            <input
                                type="checkbox"
                                id={key}
                                checked={!!localInfo[key]}
                                onChange={() => handleCheckboxChange(key)}
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <label htmlFor={key} className="mr-2 text-sm font-medium text-slate-700">{label}</label>
                        </div>
                    ))}
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">توضیحات تکمیلی</label>
                    <textarea 
                        id="notes" 
                        value={localInfo.notes || ''} 
                        onChange={handleNotesChange}
                        rows={3}
                        className="w-full p-2 border border-slate-300 rounded-md"
                    />
                </div>
                 <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">انصراف</button>
                    <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">ذخیره</button>
                </div>
            </form>
        </Modal>
    );
};

const StudentSearchModal: React.FC<{
    onClose: () => void;
    onSelectStudent: (student: Student) => void;
}> = ({ onClose, onSelectStudent }) => {
    const { students, classrooms } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const lowercased = normalizePersianChars(searchTerm.toLowerCase());
        return students.filter(student =>
            normalizePersianChars(`${student.firstName} ${student.lastName}`).toLowerCase().includes(lowercased)
        ).slice(0, 20); // Limit results for performance
    }, [searchTerm, students]);

    return (
        <Modal onClose={onClose}>
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">جستجوی دانش‌آموز</h2>
                <input
                    type="text"
                    placeholder="نام دانش‌آموز را وارد کنید..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                    autoFocus
                />
                <ul className="max-h-80 overflow-y-auto space-y-1">
                    {filteredStudents.map(student => {
                        const classroom = classrooms.find(c => c.id === student.classroomId);
                        return (
                            <li 
                                key={student.id} 
                                onClick={() => onSelectStudent(student)}
                                className="p-3 hover:bg-sky-50 rounded-md cursor-pointer flex items-center gap-3"
                            >
                                <ProfilePhoto photoUrl={student.photoUrl} alt={student.firstName} className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-slate-800">
                                        {student.firstName} {student.lastName}
                                        {student.fatherName && <span className="text-xs font-normal text-slate-500 mr-1">({student.fatherName})</span>}
                                    </p>
                                    <p className="text-xs text-slate-500">{classroom?.name || 'بدون کلاس'}</p>
                                </div>
                            </li>
                        );
                    })}
                    {searchTerm && filteredStudents.length === 0 && (
                        <li className="p-3 text-center text-slate-500">دانش‌آموزی یافت نشد.</li>
                    )}
                </ul>
            </div>
        </Modal>
    );
};

const SpecialStudentsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { 
        students, 
        specialStudents, 
        classrooms, 
        handleUpdateSpecialStudentInfo,
        appSettings,
        isArchiveUnlocked,
        setIsArchiveUnlocked
    } = useAppContext();

    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [deletingStudentInfo, setDeletingStudentInfo] = useState<Student | null>(null);
    
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);

    const specialStudentData = useMemo(() => {
        return specialStudents
            .map(info => {
                 const hasInfo = specialInfoMap.some(({ key }) => info[key]) || (info.notes && info.notes.trim() !== '');
                 if (!hasInfo) return null;
                 const student = students.find(s => s.id === info.studentId);
                 if (!student) return null;
                 return { student, info };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => a.student.lastName.localeCompare(b.student.lastName, 'fa'));
    }, [students, specialStudents]);
    
    const handleUnlockArchive = async (password: string): Promise<boolean> => {
        if (!appSettings.sessionPasswordHash) {
            setIsArchiveUnlocked(true);
            return true;
        }
        const success = await verifyPassword(password, appSettings.sessionPasswordHash);
        if (success) {
            setIsArchiveUnlocked(true);
        }
        return success;
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        setError('');
        setIsUnlocking(true);
        const success = await handleUnlockArchive(password);
        if (!success) {
            setError('رمز عبور اشتباه است.');
            setPassword('');
        }
        setIsUnlocking(false);
    };
    
    const isProtectedAndLocked = appSettings.passwordProtectionEnabled && !isArchiveUnlocked;

    const handleSave = (info: SpecialStudentInfo) => {
        handleUpdateSpecialStudentInfo(info);
        setEditingStudent(null);
    };

    const handleDeleteRequest = (student: Student) => {
        setDeletingStudentInfo(student);
    };

    const confirmDelete = () => {
        if (deletingStudentInfo) {
            handleUpdateSpecialStudentInfo({ studentId: deletingStudentInfo.id });
            setDeletingStudentInfo(null);
        }
    };
    
    const specialStudentMap = useMemo(() => new Map(specialStudents.map(s => [s.studentId, s])), [specialStudents]);

    const handleExportHtml = () => {
        const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
        const content = specialStudentData.map(({ student, info }) => {
            const reasons = specialInfoMap
                .filter(({ key }) => info[key])
                .map(({ label }) => `<span class="reason-tag">${label}</span>`)
                .join(' ');

            const studentName = `${student.firstName} ${student.lastName} ${student.grade ? `(${toPersianDigits(student.grade)})` : ''}`.trim();

            return `
                <div class="student-card">
                    <img src="${student.photoUrl || ''}" alt="عکس دانش‌آموز" class="student-photo">
                    <div class="student-info">
                        <div class="student-header">
                            <h2>${studentName}</h2>
                            <p>${classroomMap.get(student.classroomId) || 'کلاس نامشخص'}</p>
                        </div>
                        <div class="reasons">
                            <strong>موارد:</strong> ${reasons || '<em>موردی ثبت نشده</em>'}
                        </div>
                        ${info.notes ? `<div class="notes"><strong>توضیحات:</strong> ${info.notes.replace(/\n/g, '<br>')}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>گزارش دانش‌آموزان خاص</title>
                <style>
                    @font-face {
                      font-family: 'B Yekan';
                      src: url('https://cdn.jsdelivr.net/gh/s-amir-p/F fonts/BYekan/BYekan+.woff2') format('woff2');
                      font-weight: normal;
                      font-style: normal;
                      font-display: swap;
                    }
                    @font-face {
                      font-family: 'B Yekan';
                      src: url('https://cdn.jsdelivr.net/gh/s-amir-p/F fonts/BYekan/BYekan+ Bold.woff2') format('woff2');
                      font-weight: bold;
                      font-style: normal;
                      font-display: swap;
                    }
                    body { font-family: 'B Yekan', sans-serif; background-color: #f8f9fa; color: #333; }
                    @page { size: A4 portrait; margin: 1.5cm; }
                    .container { padding: 20px; }
                    h1 { text-align: center; margin-bottom: 2rem; color: #0056b3; }
                    .student-card {
                        display: flex;
                        align-items: flex-start;
                        gap: 15px;
                        background-color: #fff;
                        border: 1px solid #dee2e6;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 1rem;
                        page-break-inside: avoid;
                    }
                    .student-photo {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        object-fit: cover;
                        border: 2px solid #ced4da;
                    }
                    .student-info { flex-grow: 1; }
                    .student-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 8px;
                        margin-bottom: 8px;
                    }
                    .student-header h2 { margin: 0; font-size: 1.2rem; color: #343a40; }
                    .student-header p { margin: 0; font-size: 0.9rem; color: #6c757d; }
                    .reasons { font-size: 0.9rem; margin-bottom: 8px; }
                    .reasons strong { color: #495057; margin-left: 4px; }
                    .notes {
                        font-size: 0.9rem;
                        line-height: 1.6;
                        text-align: justify;
                    }
                    .notes strong {
                        color: #495057;
                        margin-left: 4px;
                    }
                    .reason-tag {
                        background-color: #fff3cd;
                        color: #856404;
                        padding: 3px 8px;
                        border-radius: 12px;
                        font-size: 0.8rem;
                        margin: 2px;
                        display: inline-block;
                    }
                    .footer {
                        position: fixed;
                        bottom: 0.5cm;
                        left: 0;
                        right: 0;
                        text-align: center;
                        font-size: 9pt;
                        color: #777;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>گزارش دانش‌آموزان نیازمند توجه ویژه</h1>
                    ${content}
                </div>
                <div class="footer">
                    تهیه شده توسط اپلیکیشن همیار مشاور هوشمند <strong>(اجرا: جمنای؛ طراحی: رحمان شیخ‌هادی)</strong>
                </div>
            </body>
            </html>
        `;
        const blob = new Blob([htmlTemplate], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'special-students-report.html';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    if (isProtectedAndLocked) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl shadow-sm">
                <LockClosedIcon className="w-12 h-12 text-slate-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">بخش محافظت شده</h2>
                <p className="text-slate-500 my-2">برای دسترسی به اطلاعات دانش‌آموزان خاص، لطفا رمز عبور را وارد کنید.</p>
                <form onSubmit={handlePasswordSubmit} className="mt-4 w-full max-w-xs">
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md text-center"
                        placeholder="رمز عبور"
                        autoFocus
                        dir="ltr"
                        disabled={isUnlocking}
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <button type="submit" disabled={isUnlocking} className="mt-3 w-full px-6 py-2 bg-sky-500 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-600 transition-colors disabled:bg-slate-400">
                        {isUnlocking ? 'در حال بررسی...' : 'باز کردن'}
                    </button>
                </form>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                 <div>
                    <button onClick={onBack} className="text-sm text-sky-600 hover:underline mb-2">&larr; بازگشت به بیشتر</button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">دانش‌آموزان نیازمند توجه ویژه</h1>
                    <p className="text-slate-500 mt-1">لیست دانش‌آموزانی که بر اساس اطلاعات ثبت شده نیازمند توجه ویژه هستند.</p>
                </div>
                <button
                    onClick={handleExportHtml}
                    disabled={specialStudentData.length === 0}
                    className="flex items-center bg-teal-500 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-teal-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    <PrintIcon className="w-5 h-5" />
                    <span className="mr-2">دریافت خروجی HTML</span>
                </button>
            </div>
            
            <div 
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white cursor-pointer hover:border-sky-400 flex items-center transition-colors"
            >
                <SearchIcon className="w-5 h-5 text-slate-400" />
                <span className="mr-3 text-slate-500">جستجو برای افزودن یا ویرایش دانش‌آموز...</span>
            </div>

            {specialStudentData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {specialStudentData.map(({ student, info }) => {
                        const classroom = classrooms.find(c => c.id === student.classroomId);
                        const reasons = specialInfoMap
                            .filter(({ key }) => info[key])
                            .map(({ label }) => label);

                        return (
                            <div key={student.id} className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-slate-800">
                                            {student.firstName} {student.lastName} {student.grade && `(${toPersianDigits(student.grade)})`}
                                        </p>
                                        <p className="text-sm text-slate-500">{classroom?.name || 'کلاس نامشخص'}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => setEditingStudent(student)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-sky-600 transition-colors" title="ویرایش">
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                         <button onClick={() => handleDeleteRequest(student)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-red-600 transition-colors" title="حذف از لیست خاص">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 pt-3 border-t border-slate-100">
                                    <ProfilePhoto photoUrl={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-14 h-14 rounded-full flex-shrink-0" />
                                    <div className="flex-grow min-w-0">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 mb-1">موارد ثبت شده:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {reasons.map(reason => (
                                                    <span key={reason} className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-1 rounded-full">{reason}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {info.notes && (
                                            <div className="mt-2">
                                                <p className="text-xs font-semibold text-slate-600 mb-1">توضیحات:</p>
                                                <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-md whitespace-pre-wrap">{info.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                    <StarIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">
                        {'هنوز هیچ دانش‌آموز خاصی ثبت نشده است.'}
                    </p>
                    <p className="text-sm text-slate-400 mt-4">
                        برای افزودن دانش‌آموز به این لیست، از کادر جستجوی بالا استفاده کنید.
                    </p>
                </div>
            )}
            
            {isSearchModalOpen && (
                <StudentSearchModal
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelectStudent={(student) => {
                        setIsSearchModalOpen(false);
                        setEditingStudent(student);
                    }}
                />
            )}

            {editingStudent && (
                <EditSpecialInfoModal 
                    student={editingStudent}
                    info={specialStudentMap.get(editingStudent.id)}
                    onClose={() => setEditingStudent(null)}
                    onSave={handleSave}
                />
            )}

            {deletingStudentInfo && (
                <ConfirmationModal
                    title="حذف از لیست دانش‌آموزان خاص"
                    message={<p>آیا از حذف <strong>{deletingStudentInfo.firstName} {deletingStudentInfo.lastName}</strong> از این لیست اطمینان دارید؟ (دانش‌آموز از سیستم حذف نخواهد شد، فقط اطلاعات خاص او پاک می‌شود)</p>}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeletingStudentInfo(null)}
                    confirmButtonText="بله، حذف کن"
                />
            )}
        </div>
    );
};

export default SpecialStudentsView;