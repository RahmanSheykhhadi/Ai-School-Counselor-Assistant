import React, { useState } from 'react';
import Modal from './Modal';
import { useAppContext } from '../context/AppContext';
import type { Student } from '../types';
import * as XLSX from 'xlsx';
import { toPersianDigits, normalizePersianChars } from '../utils/helpers';
import { UploadIcon, SaveIcon } from './icons';

interface AutoAssignModalProps {
  onClose: () => void;
}

const AutoAssignModal: React.FC<AutoAssignModalProps> = ({ onClose }) => {
    const { students, classrooms, handleBatchCreateClassrooms, handleAddStudentsBatch, handleBatchUpdateStudentDetails } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [resultMessage, setResultMessage] = useState('');

    const generateSampleFile = () => {
        const wb = XLSX.utils.book_new();
        
        // Master student sheet
        const masterSheetData = [
            ['کدملی', 'نام', 'نام خانوادگي', 'نام پدر', 'تاریخ تولد', 'ملیت', 'موبایل'],
            ['0123456789', 'امیر', 'رضایی', 'علی', '1388/05/14', 'ایرانی', '09123456789'],
            ['9876543210', 'سارا', 'احمدی', 'محمد', '1388/11/22', 'ایرانی', '09129876543'],
            ['1122334455', 'نیما', 'صادقی', 'حسین', '1387/01/30', 'ایرانی', '09121122334'],
        ];
        const masterSheet = XLSX.utils.aoa_to_sheet(masterSheetData);
        XLSX.utils.book_append_sheet(wb, masterSheet, 'کل');

        // Class sheet 1
        const class1SheetData = [['کدملی', 'نام', 'نام خانوادگي'], ['0123456789', 'امیر', 'رضایی'], ['9876543210', 'سارا', 'احمدی']];
        const class1Sheet = XLSX.utils.aoa_to_sheet(class1SheetData);
        XLSX.utils.book_append_sheet(wb, class1Sheet, 'هفتم الف');

        // Class sheet 2
        const class2SheetData = [['کدملی', 'نام', 'نام خانوادگي'], ['1122334455', 'نیما', 'صادقی']];
        const class2Sheet = XLSX.utils.aoa_to_sheet(class2SheetData);
        XLSX.utils.book_append_sheet(wb, class2Sheet, 'هفتم ب');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        
        function s2ab(s: string) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }

        const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "SCA_Sample_Import.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileProcess = async (file: File) => {
        setIsLoading(true);
        setResultMessage('در حال پردازش فایل...');

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF:'yyyy/mm/dd' });

            // 1. Validate Master Sheet
            const masterSheetName = 'کل';
            if (!workbook.SheetNames.includes(masterSheetName)) {
                throw new Error(`شیت اصلی با نام «${masterSheetName}» در فایل اکسل یافت نشد.`);
            }
            
            // 2. Process Master Sheet ("کل")
            setResultMessage('مرحله ۱: پردازش لیست کل دانش‌آموزان...');
            const masterSheet = workbook.Sheets[masterSheetName];
            // @google/genai-api FIX: Explicitly type studentsFromExcelRaw as any[] to prevent properties from being inferred as 'unknown'.
            const studentsFromExcelRaw: any[] = XLSX.utils.sheet_to_json(masterSheet, { raw: false });

            const colMappings: { [key in keyof Partial<Student>]: string[] } = {
              nationalId: ['کدملی', 'کد ملی'],
              firstName: ['نام'],
              lastName: ['نام خانوادگی', 'نام خانوادگي'],
              fatherName: ['نام پدر'],
              birthDate: ['تاریخ تولد'],
              nationality: ['ملیت'],
              mobile: ['موبایل'],
            };

            const studentsFromExcel = studentsFromExcelRaw.map((row: any) => {
                const student: Partial<Student> = {};
                for (const key in colMappings) {
                    const propKey = key as keyof typeof colMappings;
                    const possibleHeaders = colMappings[propKey];
                    const header = Object.keys(row).find(h => possibleHeaders.includes(normalizePersianChars(h.trim())));
                    if (header) {
                         student[propKey] = row[header] ? String(row[header]).trim() : undefined;
                    }
                }
                return student;
            }).filter(s => (s.nationalId || (s.firstName && s.lastName)));
            
            const createKey = (s: { firstName?: string, lastName?: string, nationalId?: string }) => [
                normalizePersianChars(s.firstName || '').trim(), 
                normalizePersianChars(s.lastName || '').trim(), 
                normalizePersianChars(s.nationalId || '').trim()
            ].join('|');

            const uniqueExcelStudentsMap = new Map<string, Partial<Student>>();
            for (const student of studentsFromExcel) {
                if ((student.nationalId || (student.firstName && student.lastName))) {
                    uniqueExcelStudentsMap.set(createKey(student), student);
                }
            }
            const uniqueStudentsFromExcel = Array.from(uniqueExcelStudentsMap.values());

            // 3. Process Class Sheets
            setResultMessage('مرحله ۲: شناسایی کلاس‌ها و دانش‌آموزان هر کلاس...');
            const classSheetNames = workbook.SheetNames.filter(name => name !== masterSheetName);
            const classroomNamesFromExcel = classSheetNames.map(name => normalizePersianChars(name.trim())).filter(Boolean);
            
            const existingClassroomNames = new Set(classrooms.map(c => c.name));
            const classroomsToCreate = classroomNamesFromExcel
                .filter(name => !existingClassroomNames.has(name))
                .map(name => ({ name }));

            const newClassrooms = classroomsToCreate.length > 0
                ? await handleBatchCreateClassrooms(classroomsToCreate)
                : [];
            
            const allAvailableClassrooms = [...classrooms, ...newClassrooms];
            const classroomIdMap = new Map(allAvailableClassrooms.map(c => [c.name, c.id]));

            const classAssignmentsByNationalId = new Map<string, string>(); // nationalId -> classroomId
            const classAssignmentsByName = new Map<string, string[]>(); // fullName -> [classroomId, classroomId, ...]

            const createNameKey = (firstName: string, lastName: string) => [
                normalizePersianChars(firstName || '').trim(),
                normalizePersianChars(lastName || '').trim()
            ].join('|');

            for (const sheetName of classSheetNames) {
                const classroomName = normalizePersianChars(sheetName.trim());
                const classroomId = classroomIdMap.get(classroomName);
                if (!classroomId) continue;

                const worksheet = workbook.Sheets[sheetName];
                const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                for (const row of rows) {
                    let nationalId: string | undefined;
                    let firstName: string | undefined;
                    let lastName: string | undefined;
                    
                    const nationalIdHeader = Object.keys(row).find(h => colMappings.nationalId.includes(normalizePersianChars(h.trim())));
                    if (nationalIdHeader) {
                        nationalId = row[nationalIdHeader] ? String(row[nationalIdHeader]).trim() : undefined;
                    }

                    const firstNameHeader = Object.keys(row).find(h => colMappings.firstName.includes(normalizePersianChars(h.trim())));
                    if (firstNameHeader) {
                        firstName = row[firstNameHeader] ? String(row[firstNameHeader]).trim() : undefined;
                    }

                    const lastNameHeader = Object.keys(row).find(h => colMappings.lastName.includes(normalizePersianChars(h.trim())));
                    if (lastNameHeader) {
                        lastName = row[lastNameHeader] ? String(row[lastNameHeader]).trim() : undefined;
                    }

                    if (nationalId) {
                        classAssignmentsByNationalId.set(nationalId, classroomId);
                    }

                    if (firstName && lastName) {
                        const fullNameKey = createNameKey(firstName, lastName);
                        if (!classAssignmentsByName.has(fullNameKey)) {
                            classAssignmentsByName.set(fullNameKey, []);
                        }
                        if (!classAssignmentsByName.get(fullNameKey)!.includes(classroomId)){
                           classAssignmentsByName.get(fullNameKey)!.push(classroomId);
                        }
                    }
                }
            }


            // 4. Compare and prepare DB operations
            setResultMessage('مرحله ۳: مقایسه با اطلاعات موجود و آماده‌سازی تغییرات...');
            const existingStudentsMap = new Map(students.map(s => [createKey(s), s]));
            const studentsToAdd: Omit<Student, 'id' | 'photoUrl' | 'academicYear'>[] = [];
            const studentUpdates: { studentId: string; data: Partial<Omit<Student, 'id'>> }[] = [];

            for (const excelStudent of uniqueStudentsFromExcel) {
                // Determine classroomId with fallback logic
                let assignedClassroomId = '';
                
                // 1. Primary match: National ID
                if (excelStudent.nationalId) {
                    assignedClassroomId = classAssignmentsByNationalId.get(excelStudent.nationalId) || '';
                }

                // 2. Fallback match: Full Name (if primary match failed)
                if (!assignedClassroomId && excelStudent.firstName && excelStudent.lastName) {
                    const fullNameKey = createNameKey(excelStudent.firstName, excelStudent.lastName);
                    const possibleClasses = classAssignmentsByName.get(fullNameKey);

                    if (possibleClasses && possibleClasses.length === 1) {
                        assignedClassroomId = possibleClasses[0];
                    }
                }
                
                const compositeKey = createKey(excelStudent);
                const existingStudent = existingStudentsMap.get(compositeKey);

                if (existingStudent) {
                    const changes: Partial<Omit<Student, 'id'>> = {};
                    if (excelStudent.firstName && existingStudent.firstName !== excelStudent.firstName) changes.firstName = excelStudent.firstName;
                    if (excelStudent.lastName && existingStudent.lastName !== excelStudent.lastName) changes.lastName = excelStudent.lastName;
                    if (excelStudent.fatherName && existingStudent.fatherName !== excelStudent.fatherName) changes.fatherName = excelStudent.fatherName;
                    if (excelStudent.birthDate && existingStudent.birthDate !== excelStudent.birthDate) changes.birthDate = excelStudent.birthDate;
                    if (excelStudent.nationality && existingStudent.nationality !== excelStudent.nationality) changes.nationality = excelStudent.nationality;
                    if (excelStudent.mobile && existingStudent.mobile !== excelStudent.mobile) changes.mobile = excelStudent.mobile;
                    if (existingStudent.classroomId !== assignedClassroomId) changes.classroomId = assignedClassroomId;

                    if (Object.keys(changes).length > 0) {
                        studentUpdates.push({ studentId: existingStudent.id, data: changes });
                    }
                } else {
                     if(excelStudent.firstName && excelStudent.lastName) {
                        studentsToAdd.push({
                            firstName: excelStudent.firstName!,
                            lastName: excelStudent.lastName!,
                            fatherName: excelStudent.fatherName,
                            nationalId: excelStudent.nationalId,
                            birthDate: excelStudent.birthDate,
                            nationality: excelStudent.nationality,
                            mobile: excelStudent.mobile,
                            classroomId: assignedClassroomId,
                        });
                    }
                }
            }

            // 5. Execute DB operations
            setResultMessage('مرحله ۴: اعمال تغییرات در پایگاه داده...');
            if (studentsToAdd.length > 0) {
                await handleAddStudentsBatch(studentsToAdd);
            }
            if (studentUpdates.length > 0) {
                await handleBatchUpdateStudentDetails(studentUpdates);
            }

            // 6. Report results
            setResultMessage([
                `عملیات با موفقیت انجام شد:`,
                `- ${toPersianDigits(newClassrooms.length)} کلاس جدید ایجاد شد.`,
                `- ${toPersianDigits(studentsToAdd.length)} دانش‌آموز جدید اضافه شد.`,
                `- ${toPersianDigits(studentUpdates.length)} دانش‌آموز به‌روزرسانی شدند.`,
            ].join('\n'));

        } catch (error) {
            console.error("Error processing Excel file:", error);
            const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته رخ داد.';
            setResultMessage(`خطا در پردازش فایل: ${errorMessage}`);
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
                <h2 className="text-xl font-bold text-slate-800">ورود و کلاس‌بندی خودکار از اکسل</h2>
                
                {!isLoading && !resultMessage && (
                    <>
                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md space-y-3">
                            <p className="font-semibold">راهنمای فرمت فایل اکسل:</p>
                           <ul className="list-disc list-outside pr-5 space-y-2 text-justify">
                               <li>شیت (صفحه) اول فایل اکسل <strong>باید</strong> <code className="bg-slate-200 px-1 rounded-sm">کل</code> نام داشته باشد و شامل لیست کامل دانش‌آموزان با ستون‌های مشخصات آن‌ها باشد (کدملی، نام، نام خانوادگی و...).</li>
                               <li>سایر شیت‌ها به عنوان کلاس در نظر گرفته می‌شوند. <strong>نام هر شیت، نام کلاس خواهد بود</strong> (مثال: هفتم الف).</li>
                               <li>در شیت‌های کلاس، وجود <strong>کد ملی</strong> دانش‌آموزان (ترجیحا در ستون اول) کافی است تا به آن کلاس اختصاص داده شوند. برای تطبیق بهتر، می‌توانید ستون‌های نام و نام خانوادگی را نیز قرار دهید.</li>
                               <li>برنامه به صورت خودکار دانش‌آموزان جدید را اضافه، اطلاعات دانش‌آموزان موجود را به‌روزرسانی و کلاس‌ها را ایجاد و تخصیص می‌دهد.</li>
                               <li>دانش‌آموزانی که در شیت «کل» هستند ولی در هیچ شیت کلاسی قرار ندارند، به بخش «کلاس‌بندی دستی» منتقل می‌شوند.</li>
                           </ul>
                           <div className="text-center pt-2">
                                <button onClick={generateSampleFile} className="flex items-center gap-2 mx-auto px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-md hover:bg-green-200">
                                    <SaveIcon className="w-4 h-4" />
                                    <span>دانلود فایل نمونه اکسل</span>
                                </button>
                           </div>
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
                        <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{resultMessage}</p>
                    </div>
                )}
                
                {!isLoading && resultMessage && (
                    <div className={`text-center p-4 rounded-md whitespace-pre-wrap ${resultMessage.startsWith('خطا') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
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