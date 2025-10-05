import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student, CounselingNeededInfo } from '../types';
import Modal from './Modal';
import ProfilePhoto from './ProfilePhoto';
import { toPersianDigits, verifyPassword, normalizePersianChars } from '../utils/helpers';
import { EditIcon, LockClosedIcon, TrashIcon, SearchIcon, ClipboardDocumentListIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

const EditCounselingInfoModal: React.FC<{
    student: Student;
    info: CounselingNeededInfo | undefined;
    onSave: (info: CounselingNeededInfo) => void;
    onClose: () => void;
}> = ({ student, info, onSave, onClose }) => {
    const [notes, setNotes] = useState(info?.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ studentId: student.id, notes });
    };

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">ویرایش اطلاعات دانش‌آموز نیازمند مشاوره</h2>
                <div className="flex items-center gap-3">
                    <ProfilePhoto photoUrl={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-12 h-12 rounded-full"/>
                    <p className="font-semibold">{student.firstName} {student.lastName}</p>
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">دلایل و توضیحات</label>
                    <textarea 
                        id="notes" 
                        value={notes} 
                        onChange={(e) => setNotes(normalizePersianChars(e.target.value))}
                        rows={5}
                        className="w-full p-2 border border-slate-300 rounded-md"
                        placeholder="دلایل نیاز به مشاوره، اقدامات مورد نیاز و..."
                        autoFocus
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

const CounselingNeededStudentsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { 
        students, 
        counselingNeededStudents, 
        classrooms, 
        handleUpdateCounselingNeededInfo,
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

    const counselingNeededData = useMemo(() => {
        return counselingNeededStudents
            .map(info => {
                 const hasInfo = info.notes && info.notes.trim() !== '';
                 if (!hasInfo) return null;
                 const student = students.find(s => s.id === info.studentId);
                 if (!student) return null;
                 return { student, info };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => a.student.lastName.localeCompare(b.student.lastName, 'fa'));
    }, [students, counselingNeededStudents]);
    
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

    const handleSave = (info: CounselingNeededInfo) => {
        handleUpdateCounselingNeededInfo(info);
        setEditingStudent(null);
    };

    const handleDeleteRequest = (student: Student) => {
        setDeletingStudentInfo(student);
    };

    const confirmDelete = () => {
        if (deletingStudentInfo) {
            handleUpdateCounselingNeededInfo({ studentId: deletingStudentInfo.id, notes: '' });
            setDeletingStudentInfo(null);
        }
    };
    
    const counselingNeededMap = useMemo(() => new Map(counselingNeededStudents.map(s => [s.studentId, s])), [counselingNeededStudents]);

    if (isProtectedAndLocked) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl shadow-sm">
                <LockClosedIcon className="w-12 h-12 text-slate-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">بخش محافظت شده</h2>
                <p className="text-slate-500 my-2">برای دسترسی به این بخش، لطفا رمز عبور را وارد کنید.</p>
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
            <div>
                <button onClick={onBack} className="text-sm text-sky-600 hover:underline mb-2">&larr; بازگشت به بیشتر</button>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">دانش‌آموزان نیازمند مشاوره</h1>
                <p className="text-slate-500 mt-1">لیست دانش‌آموزانی که باید برای آن‌ها جلسه مشاوره تنظیم شود.</p>
            </div>
            
            <div 
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white cursor-pointer hover:border-sky-400 flex items-center transition-colors"
            >
                <SearchIcon className="w-5 h-5 text-slate-400" />
                <span className="mr-3 text-slate-500">جستجو برای افزودن یا ویرایش دانش‌آموز...</span>
            </div>

            {counselingNeededData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {counselingNeededData.map(({ student, info }) => {
                        const classroom = classrooms.find(c => c.id === student.classroomId);
                        return (
                            <div key={student.id} className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                         <ProfilePhoto photoUrl={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-slate-800">
                                                {student.firstName} {student.lastName} {student.grade && `(${toPersianDigits(student.grade)})`}
                                            </p>
                                            <p className="text-sm text-slate-500">{classroom?.name || 'کلاس نامشخص'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => setEditingStudent(student)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-sky-600 transition-colors" title="ویرایش">
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                         <button onClick={() => handleDeleteRequest(student)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-red-600 transition-colors" title="حذف از لیست">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded-md whitespace-pre-wrap">{info.notes}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                    <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">
                        هنوز هیچ دانش‌آموزی به این لیست اضافه نشده است.
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
                <EditCounselingInfoModal 
                    student={editingStudent}
                    info={counselingNeededMap.get(editingStudent.id)}
                    onClose={() => setEditingStudent(null)}
                    onSave={handleSave}
                />
            )}

            {deletingStudentInfo && (
                <ConfirmationModal
                    title="حذف از لیست نیازمند مشاوره"
                    message={<p>آیا از حذف <strong>{deletingStudentInfo.firstName} {deletingStudentInfo.lastName}</strong> از این لیست اطمینان دارید؟ (دانش‌آموز از سیستم حذف نخواهد شد، فقط از این لیست پاک می‌شود)</p>}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeletingStudentInfo(null)}
                    confirmButtonText="بله، حذف کن"
                />
            )}
        </div>
    );
};

export default CounselingNeededStudentsView;