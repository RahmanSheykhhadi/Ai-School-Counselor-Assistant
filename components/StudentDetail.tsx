import React, { useState, useRef, useEffect } from 'react';
import type { Student, Session, View } from '../types';
import { useAppContext } from '../context/AppContext';
import SessionModal from './SessionModal';
import SessionCard from './SessionCard';
import ConfirmationModal from './ConfirmationModal';
import { PlusIcon, EditIcon, TrashIcon, UploadIcon } from './icons';
import { toPersianDigits } from '../utils/helpers';
import ProfilePhoto from './ProfilePhoto';
import EditStudentModal from './EditStudentModal';

interface StudentDetailProps {
  studentId: string;
  onBack: () => void;
  onNavigate: (view: View) => void;
}

export default function StudentDetail({ studentId, onBack }: StudentDetailProps) {
  const { students, classrooms, sessions, handleSaveSession, handleDeleteSession, handleUpdateStudent, handleDeleteStudent } = useAppContext();
  
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isDeletePhotoConfirmOpen, setIsDeletePhotoConfirmOpen] = useState(false);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  const student = students.find(s => s.id === studentId);
  const classroom = student ? classrooms.find(c => c.id === student.classroomId) : null;
  const studentSessions = sessions
    .filter(s => s.studentId === studentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Mobile number interaction logic
  const handleMobileInteractionStart = () => {
    isLongPress.current = false;
    longPressTimer.current = window.setTimeout(() => {
        if (student?.mobile) {
            navigator.clipboard.writeText(student.mobile);
            showToast('شماره موبایل کپی شد.');
            isLongPress.current = true;
        }
    }, 700);
  };

  const handleMobileInteractionEnd = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
      }
  };

  const handleMobileClick = (e: React.MouseEvent) => {
      if (isLongPress.current) {
          e.preventDefault();
      }
  };


  // Photo management logic
  const handlePhotoLongPressStart = () => {
    longPressTimer.current = window.setTimeout(() => {
      setIsPhotoMenuOpen(true);
    }, 700);
  };

  const handlePhotoLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (photoMenuRef.current && !photoMenuRef.current.contains(event.target as Node)) {
        setIsPhotoMenuOpen(false);
      }
    };
    if (isPhotoMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPhotoMenuOpen]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setIsPhotoMenuOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && student) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        handleUpdateStudent({ ...student, photoUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    setIsDeletePhotoConfirmOpen(true);
    setIsPhotoMenuOpen(false);
  };

  const confirmDeletePhoto = () => {
    if (student) {
        handleUpdateStudent({ ...student, photoUrl: '' });
        setIsDeletePhotoConfirmOpen(false);
    }
  };

  if (!student) {
    return (
      <div className="text-center p-8">
        <p>دانش‌آموز یافت نشد. ممکن است حذف شده باشد.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-md">بازگشت</button>
      </div>
    );
  }
  
  const handleAddSession = () => {
    setSessionToEdit(null);
    setIsSessionModalOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setSessionToEdit(session);
    setIsSessionModalOpen(true);
  };
  
  const handleDeleteSessionRequest = (sessionId: string) => {
    setSessionToDeleteId(sessionId);
  };

  const confirmDeleteSession = () => {
      if (sessionToDeleteId) {
          handleDeleteSession(sessionToDeleteId);
          setSessionToDeleteId(null);
      }
  };

  const handleSaveAndCloseSession = (sessionData: Session | Omit<Session, 'id'>) => {
    handleSaveSession(sessionData);
    setIsSessionModalOpen(false);
    setSessionToEdit(null);
  };

  const handleConfirmDeleteStudent = () => {
    handleDeleteStudent(student.id);
    setIsDeleteConfirmOpen(false);
    onBack(); // Go back after deleting
  };

  const handleSaveStudent = (updatedStudent: Student) => {
      handleUpdateStudent(updatedStudent);
      setIsEditModalOpen(false);
  };

  const InfoItem = ({ label, value, className = '' }: { label: string, value?: string | number, className?: string }) => (
    value ? <div className={className}><span className="font-semibold text-slate-600">{label}:</span> {toPersianDigits(value)}</div> : null
  );

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="text-sm text-sky-600 hover:underline mb-2">&larr; بازگشت به لیست دانش‌آموزان</button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <div 
                className="relative"
                onMouseDown={handlePhotoLongPressStart}
                onMouseUp={handlePhotoLongPressEnd}
                onMouseLeave={handlePhotoLongPressEnd}
                onTouchStart={handlePhotoLongPressStart}
                onTouchEnd={handlePhotoLongPressEnd}
            >
                <ProfilePhoto 
                    photoUrl={student.photoUrl} 
                    alt={`${student.firstName} ${student.lastName}`} 
                    className="w-20 h-20 rounded-full border-4 border-white shadow-md ml-4 flex-shrink-0 cursor-pointer"
                />
                {isPhotoMenuOpen && (
                    <div ref={photoMenuRef} className="absolute top-0 right-0 mt-2 mr-2 w-40 bg-white rounded-md shadow-lg z-10 p-1 border border-slate-200">
                        <button onClick={handleUploadClick} className="w-full text-right px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md flex items-center">
                            <UploadIcon className="w-4 h-4 ml-2" />
                            <span>{student.photoUrl ? 'تغییر عکس' : 'افزودن عکس'}</span>
                        </button>
                        {student.photoUrl && (
                            <button onClick={handleDeletePhoto} className="w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center">
                                <TrashIcon className="w-4 h-4 ml-2" />
                                <span>حذف عکس</span>
                            </button>
                        )}
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept="image/png, image/jpeg, image/webp"
                />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{`${student.firstName} ${student.lastName}`}</h1>
              <p className="text-slate-500 mt-1">{classroom?.name || 'کلاس نامشخص'}</p>
            </div>
          </div>
           <div className="flex items-center gap-2 self-center flex-shrink-0 flex-wrap">
                <button onClick={handleAddSession} className="flex items-center bg-sky-500 text-white font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-sky-600 transition-colors text-sm">
                    <PlusIcon className="w-4 h-4" />
                    <span className="mr-2">ثبت جلسه</span>
                </button>
                <button onClick={() => setIsEditModalOpen(true)} className="flex items-center bg-amber-500 text-white font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-amber-600 transition-colors text-sm">
                    <EditIcon className="w-4 h-4" />
                    <span className="mr-2">ویرایش</span>
                </button>
                <button onClick={() => setIsDeleteConfirmOpen(true)} className="flex items-center bg-red-500 text-white font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-red-600 transition-colors text-sm">
                    <TrashIcon className="w-4 h-4" />
                    <span className="mr-2">حذف</span>
                </button>
            </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm transition-shadow hover:shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">اطلاعات دانش‌آموز</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm text-slate-800">
            <InfoItem label="نام پدر" value={student.fatherName} />
            <InfoItem label="کد ملی" value={student.nationalId} />
            <InfoItem label="تاریخ تولد" value={student.birthDate} />
            <InfoItem label="پایه تحصیلی" value={student.grade} />
            <InfoItem label="ملیت" value={student.nationality} />
            <div>
              <span className="font-semibold text-slate-600">موبایل:</span>{' '}
              {student.mobile ? (
                  <a
                      href={`tel:${student.mobile}`}
                      onMouseDown={handleMobileInteractionStart}
                      onMouseUp={handleMobileInteractionEnd}
                      onMouseLeave={handleMobileInteractionEnd}
                      onTouchStart={handleMobileInteractionStart}
                      onTouchEnd={handleMobileInteractionEnd}
                      onClick={handleMobileClick}
                      className="text-sky-600 hover:text-sky-700 underline"
                      dir="ltr"
                  >
                      {toPersianDigits(student.mobile)}
                  </a>
              ) : null}
            </div>
            <InfoItem label="آدرس" value={student.address} className="col-span-2 md:col-span-3 lg:col-span-4" />
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm transition-shadow hover:shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">تاریخچه جلسات</h2>
        <div className="space-y-3">
          {studentSessions.length > 0 ? (
            studentSessions.map(session => (
              <SessionCard key={session.id} session={session} student={student} onEdit={handleEditSession} onDelete={handleDeleteSessionRequest} />
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">هنوز جلسه‌ای برای این دانش‌آموز ثبت نشده است.</p>
          )}
        </div>
      </div>

      {isSessionModalOpen && (
        <SessionModal 
            student={student} 
            session={sessionToEdit} 
            onClose={() => setIsSessionModalOpen(false)} 
            onSave={handleSaveAndCloseSession}
        />
      )}

      {sessionToDeleteId && (
        <ConfirmationModal
            title="حذف جلسه"
            message="آیا از حذف این جلسه اطمینان دارید؟ این عمل غیرقابل بازگشت است."
            onConfirm={confirmDeleteSession}
            onCancel={() => setSessionToDeleteId(null)}
            confirmButtonText="بله، حذف کن"
        />
      )}

      {isEditModalOpen && student && (
        <EditStudentModal 
            student={student} 
            onClose={() => setIsEditModalOpen(false)} 
            onSave={handleSaveStudent}
        />
      )}

      {isDeleteConfirmOpen && student && (
          <ConfirmationModal
              title="حذف دانش‌آموز"
              message={<p>آیا از حذف <strong>{student.firstName} {student.lastName}</strong> و <strong>تمام جلسات</strong> او اطمینان دارید؟ این عمل غیرقابل بازگشت است.</p>}
              onConfirm={handleConfirmDeleteStudent}
              onCancel={() => setIsDeleteConfirmOpen(false)}
              confirmButtonText="بله، حذف کن"
          />
      )}
      
      {isDeletePhotoConfirmOpen && (
        <ConfirmationModal
            title="حذف عکس پروفایل"
            message="آیا از حذف عکس پروفایل این دانش‌آموز اطمینان دارید؟"
            onConfirm={confirmDeletePhoto}
            onCancel={() => setIsDeletePhotoConfirmOpen(false)}
            confirmButtonText="بله، حذف کن"
        />
       )}

      {toastMessage && (
          <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg z-50">
              {toastMessage}
          </div>
      )}
    </div>
  );
}