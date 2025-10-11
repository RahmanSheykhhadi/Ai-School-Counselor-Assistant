import React, { useState } from 'react';
import Modal from './Modal';
import { useAppContext } from '../context/AppContext';
import type { Student } from '../types';
import * as XLSX from 'xlsx';
import { toPersianDigits, normalizePersianChars } from '../utils/helpers';
import { UploadIcon } from './icons';

interface AutoAssignModalProps {
  onClose: () => void;
}

const AutoAssignModal: React.FC<AutoAssignModalProps> = ({ onClose }) => {
    const { students, classrooms, handleBatchCreateClassrooms, handleBatchUpdateStudentDetails } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [resultMessage, setResultMessage] = useState('');

    const handleFileProcess = async (file: File) => {
        setIsLoading(true);
        setResultMessage('در حال پردازش فایل اکسل...');

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);

            // --- FINAL ROBUST LOGIC ---

            // Step 1: Discover all unique classroom names from sheet names
            setResultMessage('مرحله ۱: شناسایی کلاس‌ها از نام شیت‌ها...');
            const classroomNamesFromExcel = workbook.SheetNames.map(name => normalizePersianChars(name.trim())).filter(Boolean);

            if (classroomNamesFromExcel.length === 0) {
                setResultMessage('هیچ شیت معتبری در فایل اکسل یافت نشد.');
                setIsLoading(false);
                return;
            }

            // Step 2: Create new classrooms if they don't exist
            setResultMessage('مرحله ۲: ایجاد کلاس‌های جدید...');
            const existingClassroomNames = new Set(classrooms.map(c => c.name));
            const classroomsToCreate = classroomNamesFromExcel
                .filter(name => !existingClassroomNames.has(name))
                .map(name => ({ name }));

            const newClassrooms = classroomsToCreate.length > 0
                ? await handleBatchCreateClassrooms(classroomsToCreate)
                : [];

            const allAvailableClassrooms = [...classrooms, ...newClassrooms];
            const classroomIdMap = new Map(allAvailableClassrooms.map(c => [c.name, c.id]));
            
            // Step 3: Match students by National ID and prepare updates
            setResultMessage('مرحله ۳: تطبیق دادن دانش‌آموزان بر اساس کد ملی...');
            // FIX: Explicitly type the Map to ensure correct type inference for `matchedStudent`.
            const studentByNationalId: Map<string, Student> = new Map(students.map(s => [String(s.nationalId || '').trim(), s]));

            const updates: { studentId: string, data: { classroomId?: string } }[] = [];
            let updatedStudentsCount = 0;

            for (const sheetName of workbook.SheetNames) {
                const classroomName = normalizePersianChars(sheetName.trim());
                const classroomId = classroomIdMap.get(classroomName);
                if (!classroomId) continue;

                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                for (let i = 1; i < json.length; i++) {
                    const row = json[i];
                    const nationalId = String(row[0] || '').trim();
                    
                    if (!nationalId) continue;

                    const matchedStudent = studentByNationalId.get(nationalId);
                    
                    if (matchedStudent) {
                        if (matchedStudent.classroomId !== classroomId) {
                            updates.push({
                                studentId: matchedStudent.id,
                                data: { classroomId },
                            });
                        }
                       updatedStudentsCount++;
                    }
                }
            }

            // Step 4: Apply updates
            if (updates.length > 0) {
                setResultMessage(`مرحله ۴: به‌روزرسانی ${toPersianDigits(updates.length)} دانش‌آموز...`);
                await handleBatchUpdateStudentDetails(updates);
            }

            // Step 5: Show summary
            const unassignedInExcel = students.filter(s => s.nationalId && !studentByNationalId.has(String(s.nationalId).trim()));
            
            const summary = [
                `${toPersianDigits(newClassrooms.length)} کلاس جدید ایجاد شد.`,
                `${toPersianDigits(updates.length)} دانش‌آموز کلاس‌بندی شدند.`,
                `${toPersianDigits(updatedStudentsCount - updates.length)} دانش‌آموز از قبل در کلاس صحیح خود بودند.`,
                unassignedInExcel.length > 0 ? `${toPersianDigits(unassignedInExcel.length)} دانش‌آموز در برنامه یافت شدند که در فایل اکسل نبودند و در لیست "کلاس‌بندی دستی" باقی می‌مانند.` : ''
            ].filter(Boolean).join('\n');
            
            setResultMessage(summary);

        } catch (error) {
            console.error("Error processing Excel file:", error);
            setResultMessage('خطا در پردازش فایل. لطفا از صحت فرمت فایل اکسل اطمینان حاصل کنید.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileProcess(file);
        }
        e.target.value = '';
    };

    return (
        <Modal onClose={onClose}>
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">کلاس‌بندی خودکار از طریق اکسل</h2>
                
                {!isLoading && !resultMessage && (
                    <>
                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md space-y-2">
                            <p className="font-semibold">راهنما:</p>
                           <ul className="list-disc list-inside text-justify">
                               <li>نام هر شیت (Sheet) به عنوان نام کلاس جدید در نظر گرفته می‌شود.</li>
                               <li>دانش‌آموزان فقط بر اساس کد ملی (ستون اول) تطبیق داده می‌شوند.</li>
                               <li>دانش‌آموزانی که در برنامه هستند ولی در اکسل نیستند، در بخش «کلاس‌بندی دستی» باقی می‌مانند.</li>
                           </ul>
                        </div>
                        <label
                            htmlFor="excel-upload"
                            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50"
                        >
                            <UploadIcon className="w-10 h-10 text-slate-400" />
                            <span className="mt-2 font-semibold text-slate-700">انتخاب فایل اکسل</span>
                            <input
                                id="excel-upload"
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </>
                )}
                
                {isLoading && (
                     <div className="text-center py-8">
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
                            <div className="bg-sky-600 h-2.5 rounded-full w-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{resultMessage}</p>
                    </div>
                )}
                
                {!isLoading && resultMessage && (
                    <div className="text-center p-4 bg-green-50 text-green-800 rounded-md whitespace-pre-wrap">
                        {resultMessage}
                    </div>
                )}
                
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                        بستن
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AutoAssignModal;
