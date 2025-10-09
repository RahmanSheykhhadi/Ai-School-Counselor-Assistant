import React, { useState } from 'react';
import Modal from './Modal';
import { useAppContext } from '../context/AppContext';
import { toPersianDigits } from '../utils/helpers';
import { FolderIcon } from './icons';
import type { AppSettings } from '../types';

// Helper function to read a file as a Base64 string
const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('File could not be read as a data URL.'));
            }
        };
        reader.onerror = () => reject(reader.error ?? new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
    });
};

type Tab = 'sida' | 'local';

const SidaImportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { students, appSettings, setAppSettings, handleBatchUpdateStudentPhotos } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('sida');

    // State for Sida tab
    const [baseUrl, setBaseUrl] = useState(appSettings.sidaBaseUrl || '');
    const [generatedLinks, setGeneratedLinks] = useState('');

    // State for Local tab
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');

    // Sida link generation
    const handleGenerateLinks = () => {
        // Save the updated base URL
        if (baseUrl !== appSettings.sidaBaseUrl) {
            // FIX: Explicitly type `prev` to avoid spread operator errors.
            setAppSettings((prev: AppSettings) => ({ ...prev, sidaBaseUrl: baseUrl }));
        }

        const studentsToUpdate = students.filter(s => s.nationalId && (!s.photoUrl || s.photoUrl.trim() === ''));
        if (studentsToUpdate.length === 0) {
            setGeneratedLinks('تمام دانش‌آموزان دارای کد ملی، عکس پروفایل دارند.');
            return;
        }

        const links = studentsToUpdate
            .map(student => `${baseUrl}${student.nationalId}.jpg`)
            .join('\n');
        
        setGeneratedLinks(links);
    };

    // Local file import
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // FIX: Explicitly type `imageFiles` as `File[]` to ensure correct type inference from `FileList`.
        const imageFiles: File[] = Array.from(files).filter(file => 
            /\.(jpe?g|png|gif|webp)$/i.test(file.name)
        );

        if (imageFiles.length === 0) {
            alert('هیچ فایل عکس معتبری (jpg, png, gif, webp) در پوشه انتخاب شده یافت نشد.');
            event.target.value = ''; // Reset input
            return;
        }

        setIsLoading(true);
        setProgress(0);
        setMessage('در حال آماده‌سازی...');

        const studentsToUpdate = students.filter(s => s.nationalId && (!s.photoUrl || s.photoUrl.trim() === ''));
        const studentMap = new Map(studentsToUpdate.map(s => [s.nationalId!, s.id]));
        
        const updates: { studentId: string; photoUrl: string }[] = [];
        let successCount = 0;
        let failCount = 0;
        const totalFiles = imageFiles.length;

        for (const [i, file] of imageFiles.entries()) {
            const progressPercentage = Math.round(((i + 1) / totalFiles) * 100);
            setProgress(progressPercentage);
            setMessage(`در حال پردازش فایل ${toPersianDigits(i + 1)} از ${toPersianDigits(totalFiles)}: ${file.name}`);

            const nationalId = file.name.split('.')[0];
            const studentId = studentMap.get(nationalId);

            if (studentId) {
                try {
                    const photoUrl = await fileToDataURL(file);
                    updates.push({ studentId, photoUrl });
                    successCount++;
                } catch (error) {
                    // FIX: The `error` variable in a catch block is of type 'unknown'. Added a type guard
                    // to safely access `.message` and an explicit string conversion for the fallback case,
                    // resolving the "Type 'unknown' is not assignable to type 'string'" error.
                    if (error instanceof Error) {
                        console.error(`Error processing file ${file.name}: ${error.message}`);
                    } else {
                        console.error(`An unknown error occurred while processing ${file.name}: ${String(error)}`);
                    }
                    failCount++;
                }
            } else {
                failCount++;
            }
        }

        if (updates.length > 0) {
            await handleBatchUpdateStudentPhotos(updates);
        }

        setMessage(`عملیات تمام شد. ${toPersianDigits(successCount)} عکس با موفقیت وارد شد. ${toPersianDigits(failCount)} فایل نادیده گرفته شد (کد ملی منطبق یافت نشد).`);
        setProgress(100);
        
        setTimeout(() => {
            setIsLoading(false);
            setProgress(0);
            setMessage('');
        }, 5000); // Reset UI after 5 seconds to show the message

        // Reset file input for next use
        event.target.value = '';
    };

    const TabButton = ({ tab, label }: { tab: Tab, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === tab ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
            {label}
        </button>
    );

    return (
        <Modal onClose={onClose}>
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">دریافت گروهی عکس پروفایل</h2>
                
                <div className="flex border-b">
                    <TabButton tab="sida" label="دریافت از سیدا (تولید لینک)" />
                    <TabButton tab="local" label="ورود از پوشه محلی" />
                </div>
                
                {activeTab === 'sida' && (
                    <div className="space-y-4">
                         <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md space-y-2">
                            <p className="font-semibold">مرحله ۱: تولید لینک‌ها</p>
                            <p className="text-justify">آدرس پایه سامانه سیدا را وارد کرده و روی دکمه «تولید لینک‌ها» کلیک کنید تا لیست آدرس عکس‌ها برای شما ساخته شود.</p>
                        </div>
                        <div>
                            <label htmlFor="sidaBaseUrl" className="block text-sm font-medium text-slate-700 mb-1">آدرس پایه سیدا</label>
                            <input
                                type="text"
                                id="sidaBaseUrl"
                                dir="ltr"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                                placeholder="https://sida.medu.ir/.../"
                            />
                        </div>
                        <button type="button" onClick={handleGenerateLinks} className="w-full px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">
                           تولید لینک‌های دانلود
                        </button>
                        {generatedLinks && (
                            <div className="space-y-2">
                                <label htmlFor="links-output" className="block text-sm font-medium text-slate-700">لینک‌های تولید شده:</label>
                                <textarea
                                    id="links-output"
                                    readOnly
                                    value={generatedLinks}
                                    className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 h-32"
                                    dir="ltr"
                                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                                />
                                <div className="text-sm text-slate-600 bg-amber-50 p-3 rounded-md space-y-2">
                                    <p className="font-semibold">مرحله ۲: دانلود و ورود عکس‌ها</p>
                                    <ul className="list-decimal list-inside text-justify">
                                        <li>تمام متن بالا را کپی کنید.</li>
                                        <li>از یک افزونه مدیریت دانلود (مانند <a href="https://chrome.google.com/webstore/detail/simple-mass-downloader/abdkkocbidpLppjdgcoikihbdealhikg" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline">Simple Mass Downloader</a> برای کروم) برای دانلود تمام عکس‌ها در یک پوشه استفاده کنید.</li>
                                        <li>به تب «ورود از پوشه محلی» در همین پنجره بروید و عکس‌های دانلود شده را انتخاب کنید.</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'local' && (
                     <div className="space-y-4">
                         <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md space-y-2">
                            <p className="font-semibold">راهنما:</p>
                           <ul className="list-disc list-inside text-justify">
                               <li>با کلیک روی دکمه زیر، <strong>پوشه‌ای</strong> که شامل عکس‌های دانش‌آموزان است را انتخاب کنید.</li>
                               <li>برنامه به صورت خودکار تمام فایل‌های عکس (jpg, png, webp, gif) را در پوشه و زیرپوشه‌های آن پیدا می‌کند.</li>
                               <li>نام هر فایل عکس باید <strong>کد ملی</strong> دانش‌آموز باشد (مثال: <code>1234567890.jpg</code>).</li>
                               <li>فقط برای دانش‌آموزانی که کد ملی آن‌ها در سیستم ثبت شده و عکس ندارند، عکس جدید وارد می‌شود.</li>
                           </ul>
                        </div>
                        
                        {isLoading ? (
                            <div className="text-center">
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div className="bg-sky-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                                </div>
                                <p className="mt-2 text-sm text-slate-600">{message}</p>
                            </div>
                        ) : (
                             <label
                                htmlFor="folder-upload"
                                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50"
                            >
                                <FolderIcon className="w-10 h-10 text-slate-400" />
                                <span className="mt-2 font-semibold text-slate-700">انتخاب پوشه عکس‌ها</span>
                                <input
                                    id="folder-upload"
                                    type="file"
                                    // @ts-ignore
                                    webkitdirectory="true"
                                    directory="true"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        )}
                        
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

export default SidaImportModal;
