import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import type { Classroom, Student } from '../types';
import { PlusIcon, UploadIcon, EditIcon, TrashIcon, Bars2Icon } from './icons';
import Modal from './Modal';
import { useAppContext } from '../context/AppContext';
import ConfirmationModal from './ConfirmationModal';
import { toPersianDigits, normalizePersianChars } from '../utils/helpers';

interface ClassroomListProps {
  onViewClass: (classroomId: string) => void;
}

interface ClassroomFormProps {
    onSave: (name: string) => void;
    onCancel: () => void;
    initialName?: string;
    title: string;
}

const ClassroomForm = ({ onSave, onCancel, initialName = '', title }: ClassroomFormProps) => {
    const [name, setName] = useState(initialName);
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) onSave(name.trim());
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">نام کلاس</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(normalizePersianChars(e.target.value))}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            placeholder="مثال: دهم تجربی - کلاس B"
            required
          />
        </div>
        <div className="flex justify-end space-x-reverse space-x-2 pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
            انصراف
          </button>
          <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">
            ذخیره
          </button>
        </div>
      </form>
    );
};

interface ImportStudentsModalProps {
    classroom: Classroom;
    onImport: (studentsData: Omit<Student, 'id' | 'photoUrl' | 'classroomId' | 'academicYear'>[], classroomId: string) => void;
    onClose: () => void;
}

const ImportStudentsModal = ({ classroom, onImport, onClose }: ImportStudentsModalProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');

    const handleDownloadSample = () => {
        const header = ["nationalId", "firstName", "lastName", "fatherName", "birthDate", "grade", "nationality", "mobile"];
        const data = [
            ["373904762", "علیرضا", "آسترکی", "مرتضی", "1390/01/06", "نهم", "ایران", "09109660668"],
            ["374057249", "مهدی", "آقاجانی", "محمدصادق", "1390/09/26", "هشتم", "ایران", "09191955681"],
            ["374290156", "امید", "آقاكوچكي", "امير", "1391/10/09", "هفتم", "ایران", ""],
            ["373654596", "علی اصغر", "ابراهیمی فردوئی", "محمود", "1388/10/08", "نهم", "ایران", "09100789759"],
        ];
        const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, "نمونه_ورود_دانش_آموزان.xlsx");
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (json.length === 0) {
                alert('فایل اکسل خالی است یا داده‌ای در آن یافت نشد.');
                return;
            }
            
            const firstRow = json[0];
            if (!('nationalId' in firstRow) || !('firstName' in firstRow) || !('lastName' in firstRow)) {
                 alert('فایل اکسل باید حتما شامل ستون‌های "nationalId", "firstName" و "lastName" باشد.');
                 return;
            }

            const studentsData = json.map(row => {
                const nationalId = row.nationalId?.toString().trim();
                const firstName = row.firstName?.toString().trim();
                const lastName = row.lastName?.toString().trim();
                
                if (!nationalId || !firstName || !lastName) return null;

                return {
                    nationalId,
                    firstName,
                    lastName,
                    fatherName: row.fatherName?.toString().trim() || undefined,
                    birthDate: row.birthDate?.toString().trim() || undefined,
                    grade: row.grade?.toString().trim() || undefined,
                    nationality: row.nationality?.toString().trim() || undefined,
                    mobile: row.mobile?.toString().trim() || undefined,
                };
            }).filter((s): s is NonNullable<typeof s> => s !== null);


            if (studentsData.length > 0) {
                onImport(studentsData, classroom.id);
            } else {
                alert('هیچ دانش‌آموز معتبری برای ورود یافت نشد. از وجود اطلاعات در ستون‌های الزامی اطمینان حاصل کنید.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Modal onClose={onClose}>
            <div className="space-y-4 text-center">
                <h2 className="text-xl font-bold text-slate-800">ورود دانش‌آموزان برای کلاس: {classroom.name}</h2>
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx, .xls"
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <UploadIcon className="h-8 w-8 mx-auto text-slate-400"/>
                        <p className="mt-2 text-sm text-slate-600">
                            {fileName ? fileName : 'برای انتخاب فایل اکسل کلیک کنید'}
                        </p>
                    </label>
                </div>
                <div className="text-right text-xs text-slate-500 bg-slate-50 p-3 rounded-md space-y-2">
                    <div className="flex justify-between items-center">
                         <p className="font-semibold">راهنما:</p>
                         <button onClick={handleDownloadSample} className="flex items-center text-sky-600 hover:underline text-xs font-semibold">
                             <UploadIcon className="w-4 h-4 ml-1" />
                             دانلود فایل نمونه اکسل
                         </button>
                    </div>
                    <ul className="list-disc list-inside text-justify">
                        <li>فایل شما باید با فرمت اکسل (<code>.xlsx</code>) باشد.</li>
                        <li>ردیف اول فایل باید شامل سربرگ‌های ستون باشد.</li>
                        <li>ستون‌های الزامی: <code>nationalId</code>, <code>firstName</code>, <code>lastName</code>.</li>
                        <li>سایر ستون‌های مجاز (اختیاری): <code>fatherName</code>, <code>birthDate</code>, <code>grade</code>, <code>nationality</code>, <code>mobile</code>.</li>
                        <li>دانش‌آموزان با کد ملی تکراری که از قبل در سیستم موجود باشند، وارد نخواهند شد.</li>
                    </ul>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                        بستن
                    </button>
                </div>
            </div>
        </Modal>
    );
};


export default function ClassroomList({ onViewClass }: ClassroomListProps) {
  const { classrooms: contextClassrooms, students, handleAddClassroom, handleUpdateClassroom, handleDeleteClassroom, handleAddStudentsBatch, handleReorderClassrooms } = useAppContext();
  
  const [localClassrooms, setLocalClassrooms] = useState<Classroom[]>(contextClassrooms);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null);
  const [importTargetClass, setImportTargetClass] = useState<Classroom | null>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setLocalClassrooms(contextClassrooms);
  }, [contextClassrooms]);


  const handleSaveClassroom = (name: string) => {
    if (editingClassroom) {
      handleUpdateClassroom({ ...editingClassroom, name });
    } else {
      handleAddClassroom(name);
    }
    setIsAddModalOpen(false);
    setEditingClassroom(null);
  };

  const confirmDeleteClassroom = () => {
    if(deletingClassroom) {
      handleDeleteClassroom(deletingClassroom.id);
      setDeletingClassroom(null);
    }
  };

  const handleImport = (studentsData: Omit<Student, 'id' | 'photoUrl' | 'classroomId' | 'academicYear'>[], classroomId: string) => {
    handleAddStudentsBatch(studentsData, classroomId);
    setImportTargetClass(null);
  };
  
  const openAddModal = () => {
    setEditingClassroom(null);
    setIsAddModalOpen(true);
  }

  const openEditModal = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setIsAddModalOpen(true);
  }
  
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
        dragItem.current = null;
        dragOverItem.current = null;
        setLocalClassrooms([...localClassrooms]); // Force re-render to remove dragging styles
        return;
    }

    const reorderedClassrooms = [...localClassrooms];
    const draggedItemContent = reorderedClassrooms.splice(dragItem.current, 1)[0];
    reorderedClassrooms.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setLocalClassrooms(reorderedClassrooms);
    handleReorderClassrooms(reorderedClassrooms);
  };

  return (
    <div className="space-y-6">
       <div className="text-center sm:text-right">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">مدیریت کلاس‌ها</h1>
            <p className="text-slate-500 mt-1 text-justify">کلاس‌های مدرسه را ایجاد و دانش‌آموزان را به آن‌ها اضافه کنید.</p>
        </div>

      <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-xl shadow-sm flex items-center transition-shadow hover:shadow-md">
              <div className="p-2.5 bg-teal-100 rounded-full mr-3"><PlusIcon className="w-6 h-6 text-teal-600"/></div>
              <div className="flex-1 text-center sm:text-right">
                  <p className="text-slate-500 text-sm">تعداد کلاس‌ها</p>
                  <p className="text-xl font-bold text-slate-800">{toPersianDigits(contextClassrooms.length)}</p>
              </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm flex items-center transition-shadow hover:shadow-md">
              <div className="p-2.5 bg-sky-100 rounded-full mr-3"><PlusIcon className="w-6 h-6 text-sky-600"/></div>
              <div className="flex-1 text-center sm:text-right">
                  <p className="text-slate-500 text-sm">تعداد دانش‌آموزان</p>
                  <p className="text-xl font-bold text-slate-800">{toPersianDigits(students.length)}</p>
              </div>
          </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localClassrooms.map((c, index) => {
          const studentCount = students.filter(s => s.classroomId === c.id).length;
          return (
            <div
              key={c.id}
              className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between relative group transition-shadow hover:shadow-md ${dragItem.current === index ? 'opacity-50 border-2 border-dashed border-sky-500' : ''}`}
              draggable
              onDragStart={() => (dragItem.current = index)}
              onDragEnter={() => (dragOverItem.current = index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <div onClick={() => onViewClass(c.id)} className="flex-grow flex items-center gap-3 cursor-pointer overflow-hidden">
                <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
                  <h3 className="font-bold text-base text-slate-800 truncate">{c.name}</h3>
                  <p className="text-slate-500 text-sm whitespace-nowrap">
                    ({toPersianDigits(studentCount)} دانش‌آموز)
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-shrink-0 pl-3">
                <div className="flex items-center space-x-1 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setImportTargetClass(c); }}
                    className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 hover:text-sky-600"
                    title="ورود دانش آموزان"
                  >
                    <UploadIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(c); }}
                    className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 hover:text-sky-600"
                    title="ویرایش"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingClassroom(c); }}
                    className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 hover:text-red-600"
                    title="حذف"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div
                  className="cursor-grab p-2"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Bars2Icon className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
        <div
            onClick={openAddModal}
            className="bg-white rounded-xl p-4 flex items-center justify-center text-center cursor-pointer transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-sky-400 border-2 border-dashed border-slate-300 min-h-[68px]"
        >
            <div className="flex items-center gap-2">
                <div className="bg-sky-100 text-sky-600 rounded-full p-2">
                    <PlusIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-sky-700">ایجاد کلاس جدید</h3>
            </div>
        </div>
      </div>
      
      {isAddModalOpen && (
        <Modal onClose={() => { setIsAddModalOpen(false); setEditingClassroom(null); }}>
          <ClassroomForm 
            title={editingClassroom ? 'ویرایش کلاس' : 'ایجاد کلاس جدید'}
            initialName={editingClassroom?.name}
            onSave={handleSaveClassroom} 
            onCancel={() => { setIsAddModalOpen(false); setEditingClassroom(null); }} 
          />
        </Modal>
      )}

      {deletingClassroom && (
        <ConfirmationModal
          title="حذف کلاس"
          message={
            <p>
              آیا از حذف کلاس «<strong>{deletingClassroom.name}</strong>» و تمام دانش‌آموزان آن اطمینان دارید؟
              <br/>
              این عمل غیرقابل بازگشت است.
            </p>
          }
          onConfirm={confirmDeleteClassroom}
          onCancel={() => setDeletingClassroom(null)}
          confirmButtonText="بله، حذف کن"
        />
      )}

      {importTargetClass && (
        <ImportStudentsModal 
            classroom={importTargetClass} 
            onImport={handleImport}
            onClose={() => setImportTargetClass(null)}
        />
      )}
    </div>
  );
}