import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { useAppContext } from '../context/AppContext';
import { mockAppSettings, mockWorkingDays } from '../data/mockData';
import type { Student, BackupData } from '../types';

interface RestoreProgressModalProps {
  file: File;
  onClose: () => void;
}

const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const RestoreProgressModal: React.FC<RestoreProgressModalProps> = ({ file, onClose }) => {
  const { handleRestore } = useAppContext();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('شروع عملیات بازیابی...');

  useEffect(() => {
    const processRestore = async () => {
      try {
        setProgress(10);
        setMessage('در حال خواندن و باز کردن فایل فشرده...');
        const zip = await JSZip.loadAsync(file);
        const backupFile = zip.file("backup.json");
        if (!backupFile) throw new Error("فایل 'backup.json' در فایل پشتیبان یافت نشد.");

        setProgress(25);
        setMessage('در حال پردازش اطلاعات اصلی...');
        const jsonContent = await backupFile.async("string");
        const rawData = JSON.parse(jsonContent);

        // --- INTELLIGENT SETTINGS MERGE ---
        const restoredAppSettings = rawData.appSettings ?? {};
        
        // Ensure all default menu items are present, preserving user order for existing ones.
        // This prevents new menu items from disappearing when restoring an old backup.
        const defaultMenuOrder = mockAppSettings.moreMenuOrder || [];
        const restoredMenuOrder = restoredAppSettings.moreMenuOrder || [];
        const restoredMenuSet = new Set(restoredMenuOrder);
        const finalMenuOrder = [...restoredMenuOrder];

        for (const item of defaultMenuOrder) {
            if (!restoredMenuSet.has(item)) {
                finalMenuOrder.push(item);
            }
        }
        
        const finalAppSettings = {
            ...mockAppSettings, // Start with current app defaults
            ...restoredAppSettings, // Apply all settings from the backup file
            moreMenuOrder: finalMenuOrder, // Explicitly use the merged menu order
        };
        // --- END OF MERGE ---

        const restoredData = {
            classrooms: rawData.classrooms ?? [],
            students: rawData.students ?? [],
            sessions: rawData.sessions ?? [],
            sessionTypes: rawData.sessionTypes ?? [],
            workingDays: rawData.workingDays ?? mockWorkingDays,
            appSettings: finalAppSettings, // Use the merged, robust settings object
            specialStudents: rawData.specialStudents ?? [],
            counselingNeededStudents: rawData.counselingNeededStudents ?? [],
        };

        setProgress(50);
        setMessage('در حال پردازش و بازسازی عکس‌های پروفایل...');
        const photoFiles = zip.folder("photos");
        const photoMap: { [key: string]: string } = {};
        if (photoFiles) {
            const photoPromises: Promise<void>[] = [];
            photoFiles.forEach((relativePath, fileEntry) => {
                const promise = fileEntry.async("blob").then(blob => blobToDataURL(blob))
                    .then(dataUrl => {
                        const nationalId = relativePath.split('.')[0];
                        if (nationalId) photoMap[nationalId] = dataUrl;
                    });
                photoPromises.push(promise);
            });
            await Promise.all(photoPromises);
        }

        setProgress(75);
        setMessage('در حال ترکیب اطلاعات و عکس‌ها...');
        const studentsWithRestoredPhotos: Student[] = restoredData.students.map((student: Student) => {
            if (student.nationalId && photoMap[student.nationalId]) {
                return { ...student, photoUrl: photoMap[student.nationalId] };
            }
            return student;
        });
        
        const finalData: BackupData = { ...restoredData, students: studentsWithRestoredPhotos };
        
        setProgress(90);
        setMessage('در حال به‌روزرسانی برنامه...');
        
        await handleRestore(finalData);

        setProgress(100);
        setMessage('بازیابی با موفقیت انجام شد!');
        
        setTimeout(() => {
            onClose();
        }, 1500);

      } catch (error: unknown) {
        console.error("Restore error:", error);
        
        let errorMessage = 'An unexpected error occurred during restore.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string' && error.length > 0) {
            errorMessage = error;
        } else if (error && typeof error === 'object') {
            const errObj = error as Record<string, any>;
            if (typeof errObj.message === 'string' && errObj.message) {
                errorMessage = errObj.message;
            } else if (typeof errObj.error === 'string' && errObj.error) {
                errorMessage = errObj.error;
            } else if (typeof errObj.error_description === 'string' && errObj.error_description) {
                errorMessage = errObj.error_description;
            } else {
                 try {
                    const jsonString = JSON.stringify(error);
                    if (jsonString !== '{}' && jsonString !== 'null') {
                        errorMessage = jsonString;
                    }
                } catch {
                    // fallthrough to default message
                }
            }
        }
        
        alert(`خطا در بازیابی اطلاعات: ${errorMessage}`);
        onClose();
      }
    };

    processRestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h2 className="text-xl font-bold text-slate-800 mb-4">بازیابی اطلاعات</h2>
        <p className="text-slate-600 mb-2">{message}</p>
        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all duration-500 ease-in-out bg-sky-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-center font-semibold text-slate-700 mt-2">{progress}%</p>
      </div>
    </div>
  );
};

export default RestoreProgressModal;