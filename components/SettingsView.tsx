import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import moment from 'jalali-moment';
import { useAppContext } from '../context/AppContext';
import type { AppSettings, WorkingDays, BackupData, SessionType, View, CounselingNeededInfo } from '../types';
import { hashPassword, verifyPassword } from '../utils/helpers';
import SidaImportModal from './SidaImportModal';
import BackupProgressModal from './BackupProgressModal';
import { RestoreProgressModal } from './RestoreProgressModal';
import ConfirmationModal from './ConfirmationModal';
import { toPersianDigits, normalizePersianChars } from '../utils/helpers';
import { createClient } from '@supabase/supabase-js';
import { EditIcon, TrashIcon, Bars2Icon } from './icons';

type Tab = 'general' | 'appearance' | 'workingDays' | 'security' | 'data';

const SupabaseSettings = () => {
    const { 
        appSettings, setAppSettings, 
        supabaseUser, supabaseLogin, supabaseLogout, supabaseResendConfirmation,
        syncToCloud, syncFromCloud,
        syncStatus, lastSyncTime
    } = useAppContext();
    
    const [localSupabaseUrl, setLocalSupabaseUrl] = useState(appSettings.supabaseUrl);
    const [localSupabaseAnonKey, setLocalSupabaseAnonKey] = useState(appSettings.supabaseAnonKey);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showResend, setShowResend] = useState(false);
    const [showSyncFromConfirm, setShowSyncFromConfirm] = useState(false);
    const [showSyncToConfirm, setShowSyncToConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSaveCredentials = async () => {
        setIsSaving(true);
        setSaveMessage(null);
        try {
            // Attempt to create a client to validate credentials
            createClient(localSupabaseUrl, localSupabaseAnonKey);

            // If it doesn't throw, credentials are valid. Save them.
            await setAppSettings(prev => ({
                ...prev,
                supabaseUrl: localSupabaseUrl,
                supabaseAnonKey: localSupabaseAnonKey,
            }));
            setSaveMessage({ type: 'success', text: 'اتصال موفق بود. اطلاعات ذخیره شد.' });
        } catch (error) {
            console.error("Supabase connection test failed:", error);
            setSaveMessage({ type: 'error', text: 'اتصال ناموفق بود. آدرس یا کلید نامعتبر است.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthMessage(null);
        setShowResend(false);
        const { error } = await supabaseLogin(email, password);
        if (error) {
            let userFriendlyMessage = 'خطایی در ورود یا ثبت‌نام رخ داد.';
            if (error.message.toLowerCase().includes('email not confirmed')) {
                userFriendlyMessage = 'خطای ورود: ایمیل شما هنوز تایید نشده است. لطفا صندوق ورودی ایمیل خود را برای یافتن لینک تایید بررسی کنید. اگر ایمیل را پیدا نمی‌کنید، از دکمه زیر برای ارسال مجدد استفاده کنید.';
                setShowResend(true);
            } else if (error.message.includes('Password should be at least')) {
                userFriendlyMessage = 'رمز عبور باید حداقل ۶ کارکتر باشد.';
            } else if (error.message === 'Invalid login credentials') {
                userFriendlyMessage = 'ایمیل یا رمز عبور اشتباه است.';
            } else if (error.message.toLowerCase().includes('user already registered')) {
                userFriendlyMessage = 'حسابی با این ایمیل از قبل وجود دارد. لطفا رمز عبور خود را بررسی کنید یا اگر ثبت‌نام کرده‌اید، ایمیل خود را تایید کنید.';
            } else if (error.message.includes('Supabase connection is not active')) {
                userFriendlyMessage = 'اتصال به Supabase برقرار نیست. لطفا ابتدا اطلاعات اتصال را ذخیره کنید.';
            } else {
                console.error("Supabase auth error:", error); // Log the original error for debugging
            }
            setAuthMessage({ type: 'error', text: userFriendlyMessage });
        } else {
            setAuthMessage({ type: 'success', text: 'عملیات با موفقیت انجام شد. اگر برای اولین بار است، لطفا ایمیل خود را برای تایید بررسی کنید.' });
            setEmail('');
            setPassword('');
        }
    };

    const handleResendConfirmation = async () => {
        if (!email) {
            setAuthMessage({ type: 'error', text: 'لطفا ابتدا ایمیل خود را در کادر بالا وارد کنید.' });
            return;
        }
        setAuthMessage(null);
        const { error } = await supabaseResendConfirmation(email);
        if (error) {
            console.error("Resend confirmation error:", error);
            setAuthMessage({ type: 'error', text: 'خطا در ارسال مجدد ایمیل تایید.' });
        } else {
            setAuthMessage({ type: 'success', text: 'ایمیل تایید مجددا ارسال شد. لطفا صندوق ورودی خود را بررسی کنید.' });
            setShowResend(false);
        }
    };
    
    const handleSyncToCloud = () => {
        setShowSyncToConfirm(false);
        syncToCloud();
    };

    return (
        <div className="p-4 border rounded-lg flex flex-col transition-shadow hover:shadow-md mt-6 bg-slate-50">
            <h3 className="font-semibold mb-2 text-lg">همگام‌سازی با Supabase</h3>
            <p className="text-sm text-slate-500 mb-4 flex-grow">اطلاعات خود را بین دستگاه‌های مختلف با استفاده از Supabase همگام‌سازی کنید.</p>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">آدرس پروژه Supabase (URL)</label>
                    <input type="text" dir="ltr" value={localSupabaseUrl} onChange={e => setLocalSupabaseUrl(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">کلید عمومی Supabase (Anon Key)</label>
                    <input type="password" dir="ltr" value={localSupabaseAnonKey} onChange={e => setLocalSupabaseAnonKey(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                </div>
                <button onClick={handleSaveCredentials} disabled={isSaving} className="px-4 py-2 bg-slate-600 text-white text-sm rounded-md hover:bg-slate-700 disabled:bg-slate-400">
                    {isSaving ? 'در حال آزمایش...' : 'ذخیره و آزمایش اتصال'}
                </button>
                {saveMessage && <p className={`text-sm mt-2 ${saveMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{saveMessage.text}</p>}

                {appSettings.supabaseUrl && appSettings.supabaseAnonKey && (
                    <div className="pt-4 border-t mt-4 space-y-4">
                        {supabaseUser ? (
                            <div>
                                <p className="text-sm text-green-700 bg-green-100 p-2 rounded-md">متصل شده به عنوان: <span className="font-bold">{supabaseUser.email}</span></p>
                                <button onClick={supabaseLogout} className="mt-2 px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600">خروج از حساب</button>
                            </div>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-3 p-3 border rounded-md">
                                <h4 className="font-semibold text-slate-700">ورود / ثبت‌نام</h4>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ایمیل" required className="w-full p-2 border border-slate-300 rounded-md" />
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="رمز عبور" required className="w-full p-2 border border-slate-300 rounded-md" />
                                <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">ورود / ثبت‌نام</button>
                                {authMessage && <p className={`text-sm text-center ${authMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{authMessage.text}</p>}
                                {showResend && (
                                    <button type="button" onClick={handleResendConfirmation} className="w-full mt-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600">
                                        ارسال مجدد ایمیل تایید
                                    </button>
                                )}
                            </form>
                        )}

                        {supabaseUser && (
                            <div className="pt-4 border-t mt-4 space-y-3">
                                 <h4 className="font-semibold text-slate-700">عملیات همگام‌سازی</h4>
                                 
                                {syncStatus.active ? (
                                    <div className="space-y-2 py-2">
                                        <p className="text-sm text-slate-600 text-center h-5">{syncStatus.message}</p>
                                        <div className="w-full bg-slate-200 rounded-full h-4 relative">
                                            <div 
                                                className={`h-4 rounded-full transition-all duration-300 ${syncStatus.message.includes('خطا') ? 'bg-red-500' : 'bg-sky-600'}`}
                                                style={{width: `${syncStatus.progress}%`}}>
                                            </div>
                                             <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                                                {toPersianDigits(syncStatus.progress)}٪
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button onClick={() => setShowSyncToConfirm(true)} disabled={syncStatus.active} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-slate-400">
                                            ارسال به فضای ابری
                                        </button>
                                        <button onClick={() => setShowSyncFromConfirm(true)} disabled={syncStatus.active} className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-slate-400">
                                            دریافت از فضای ابری
                                        </button>
                                    </div>
                                )}
                                 
                                 {lastSyncTime && !syncStatus.active && (
                                    <p className="text-xs text-slate-500 text-center pt-1">
                                        آخرین ارسال موفق به ابر: {toPersianDigits(new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(lastSyncTime))}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showSyncToConfirm && (
                <ConfirmationModal
                    title="ارسال به فضای ابری"
                    message={<>
                        <p>این عمل، تمام اطلاعات موجود در فضای ابری را با اطلاعات فعلی دستگاه شما (شامل عکس‌ها) جایگزین می‌کند.</p>
                        <p className="font-bold text-amber-600 mt-2">توجه: همگام‌سازی عکس‌ها ممکن است زمان‌بر باشد و حجم اینترنت بیشتری مصرف کند.</p>
                        <p className="mt-2">آیا مطمئن هستید؟</p>
                    </>}
                    onConfirm={handleSyncToCloud}
                    onCancel={() => setShowSyncToConfirm(false)}
                    confirmButtonText="بله، ارسال کن"
                    confirmButtonVariant="primary"
                />
            )}
            {showSyncFromConfirm && (
                <ConfirmationModal
                    title="دریافت از فضای ابری"
                    message={<p className="font-bold text-red-600">هشدار! این عمل تمام اطلاعات فعلی روی این دستگاه را حذف و با اطلاعات موجود در فضای ابری جایگزین می‌کند. این عمل غیرقابل بازگشت است. آیا مطمئن هستید؟</p>}
                    onConfirm={() => { syncFromCloud(); setShowSyncFromConfirm(false); }}
                    onCancel={() => setShowSyncFromConfirm(false)}
                    confirmButtonText="بله، دریافت و جایگزین کن"
                    confirmButtonVariant="danger"
                />
            )}
        </div>
    );
};


const SettingsView: React.FC = () => {
    const { 
        appSettings, setAppSettings, workingDays, setWorkingDays, 
        sessionTypes, handleAddSessionType, handleUpdateSessionType, handleDeleteSessionType,
        handleReorderSessionTypes,
        handleNormalizeChars,
        handlePrependZero,
        handleFactoryReset,
        ...allData 
    } = useAppContext();
    
    const [activeTab, setActiveTab] = useState<Tab>('general');
    
    const [localAppSettings, setLocalAppSettings] = useState<AppSettings>(appSettings);
    const [localWorkingDays, setLocalWorkingDays] = useState<WorkingDays>(workingDays);

    // Session Type state
    const [localSessionTypes, setLocalSessionTypes] = useState<SessionType[]>(sessionTypes);
    const [newSessionTypeName, setNewSessionTypeName] = useState('');
    const [editingSessionType, setEditingSessionType] = useState<SessionType | null>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    
    useEffect(() => {
        setLocalSessionTypes(sessionTypes);
    }, [sessionTypes]);

    // Security state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityMessage, setSecurityMessage] = useState<{type: 'success'|'error', text:string}|null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isResetVisible, setIsResetVisible] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const longPressTimer = useRef<number | null>(null);

    // Data management state
    const [isSidaModalOpen, setIsSidaModalOpen] = useState(false);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const [backupFile, setBackupFile] = useState<File | null>(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const restoreInputRef = useRef<HTMLInputElement>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showNormalizeConfirm, setShowNormalizeConfirm] = useState(false);
    const [showPrependZeroConfirm, setShowPrependZeroConfirm] = useState(false);
    const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);


    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleAppSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalAppSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleWorkingDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setLocalWorkingDays(prev => ({ ...prev, [name]: checked }));
    };

    const handleSaveGeneral = async () => {
        await setAppSettings((prev) => ({...prev, academicYear: localAppSettings.academicYear}));
        showToast('تنظیمات عمومی با موفقیت ذخیره شد.');
    };

    const handleSaveAppearance = async () => {
        await setAppSettings((prev) => ({...prev, fontSize: localAppSettings.fontSize}));
        showToast('تنظیمات ظاهری با موفقیت ذخیره شد.');
    };
    
    const handleSaveWorkingDays = async () => {
        await setWorkingDays(localWorkingDays);
        showToast('روزهای کاری با موفقیت ذخیره شد.');
    }
    
    const handleSessionTypeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newSessionTypeName.trim();
        if (!name) return;

        if (editingSessionType) {
            handleUpdateSessionType({ ...editingSessionType, name });
            setEditingSessionType(null);
        } else {
            handleAddSessionType(name);
        }
        setNewSessionTypeName('');
    };

    const handleEditSessionType = (st: SessionType) => {
        setEditingSessionType(st);
        setNewSessionTypeName(st.name);
    };

    const handleCancelEdit = () => {
        setEditingSessionType(null);
        setNewSessionTypeName('');
    };
    
    const handleSessionTypeDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            setLocalSessionTypes([...localSessionTypes]);
            return;
        }
        
        const reorderedItems = [...localSessionTypes];
        const draggedItemContent = reorderedItems.splice(dragItem.current, 1)[0];
        reorderedItems.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;
        
        setLocalSessionTypes(reorderedItems);
        handleReorderSessionTypes(reorderedItems);
    };

    const handleConfirmNormalize = async () => {
        await handleNormalizeChars();
        setShowNormalizeConfirm(false);
        showToast('نویسه‌های عربی با موفقیت اصلاح شدند.');
    };

    const handleConfirmPrependZero = async () => {
        await handlePrependZero();
        setShowPrependZeroConfirm(false);
        showToast('عملیات افزودن صفر با موفقیت انجام شد.');
    };
    
    const handleConfirmFactoryReset = async () => {
        await handleFactoryReset();
        setShowFactoryResetConfirm(false);
        showToast('برنامه با موفقیت به تنظیمات کارخانه بازنشانی شد.');
    };

    const handleSetPassword = async () => {
        setSecurityMessage(null);
        // Validate input
        if (newPassword.length < 4 || newPassword.length > 8) {
            setSecurityMessage({type: 'error', text: 'رمز عبور باید بین ۴ تا ۸ رقم باشد.'});
            return;
        }
        if (newPassword !== confirmPassword) {
            setSecurityMessage({type: 'error', text: 'رمزهای عبور جدید با هم مطابقت ندارند.'});
            return;
        }

        // If a password is already set, verify the current one
        if (appSettings.sessionPasswordHash) {
            const isMatch = await verifyPassword(currentPassword, appSettings.sessionPasswordHash);
            if (!isMatch) {
                setSecurityMessage({type: 'error', text: 'رمز عبور فعلی اشتباه است.'});
                return;
            }
        }
        
        // Hash and save the new password
        const passwordHash = await hashPassword(newPassword);
        await setAppSettings((prev) => ({...prev, passwordProtectionEnabled: true, sessionPasswordHash: passwordHash}));
        setSecurityMessage({type: 'success', text: 'رمز عبور با موفقیت تنظیم/تغییر یافت.'});
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };
    
    const handleDeletePassword = async () => {
        setSecurityMessage(null);
        if (!appSettings.sessionPasswordHash) return;
    
        const isMatch = await verifyPassword(currentPassword, appSettings.sessionPasswordHash);
        if (!isMatch) {
            setSecurityMessage({type: 'error', text: 'رمز عبور فعلی اشتباه است.'});
            setShowDeleteConfirm(false);
            return;
        }
    
        await setAppSettings((prev) => ({...prev, passwordProtectionEnabled: false, sessionPasswordHash: null}));
        setSecurityMessage({type: 'success', text: 'رمز عبور با موفقیت حذف شد.'});
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowDeleteConfirm(false);
    };

    const handleLongPressStart = () => {
        longPressTimer.current = window.setTimeout(() => {
            setIsResetVisible(true);
        }, 15000); // 15 seconds
    };

    const handleLongPressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleConfirmResetPassword = async () => {
        await setAppSettings((prev) => ({...prev, passwordProtectionEnabled: false, sessionPasswordHash: null}));
        setSecurityMessage({type: 'success', text: 'رمز عبور با موفقیت ریست شد.'});
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowResetConfirm(false);
        setIsResetVisible(false); // Hide the button after use
    };

    const handleBackup = async (onProgress: (update: { progress: number; message: string }) => void) => {
        onProgress({ progress: 0, message: 'شروع پشتیبان‌گیری...' });
        const zip = new JSZip();

        onProgress({ progress: 10, message: 'جمع‌آوری اطلاعات اصلی...' });
        const backupData: BackupData = {
            classrooms: allData.classrooms,
            students: allData.students,
            sessions: allData.sessions,
            sessionTypes: sessionTypes,
            studentGroups: allData.studentGroups,
            workingDays: workingDays,
            appSettings: appSettings,
            specialStudents: allData.specialStudents,
            counselingNeededStudents: allData.counselingNeededStudents,
            thinkingObservations: allData.thinkingObservations,
            thinkingEvaluations: allData.thinkingEvaluations,
        };
        zip.file("backup.json", JSON.stringify(backupData, null, 2));

        onProgress({ progress: 30, message: 'جمع‌آوری عکس‌های پروفایل...' });
        const photoFolder = zip.folder("photos");
        if (photoFolder) {
            const photoPromises = allData.students
                .filter(s => s.nationalId && s.photoUrl && s.photoUrl.startsWith('data:image'))
                .map(async student => {
                    const response = await fetch(student.photoUrl);
                    const blob = await response.blob();
                    photoFolder.file(`${student.nationalId}.jpg`, blob);
                });
            await Promise.all(photoPromises);
        }

        onProgress({ progress: 80, message: 'ایجاد فایل پشتیبان...' });
        const content = await zip.generateAsync({ type: "blob" });
        
        onProgress({ progress: 95, message: 'آماده‌سازی برای دانلود...' });
        const link = document.createElement("a");
        const date = moment().locale('fa').format('YYYY-MM-DD');
        link.download = `SCA-BK-(${date}).zip`;
        link.href = URL.createObjectURL(content);
        link.click();
        URL.revokeObjectURL(link.href);

        onProgress({ progress: 100, message: 'پشتیبان‌گیری با موفقیت انجام شد!' });
    };

    const handleRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
                setBackupFile(file);
                setShowRestoreConfirm(true);
            } else {
                alert('لطفا یک فایل پشتیبان با فرمت .zip انتخاب کنید.');
            }
            e.target.value = ''; // Reset input
        }
    };
    
    const TabButton = ({ tab, label }: { tab: Tab, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-2 sm:px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
        >
            {label}
        </button>
    );

    const workingDaysMap: { key: keyof WorkingDays, label: string }[] = [
        { key: 'saturday', label: 'شنبه' }, { key: 'sunday', label: 'یکشنبه' },
        { key: 'monday', label: 'دوشنبه' }, { key: 'tuesday', label: 'سه‌شنبه' },
        { key: 'wednesday', label: 'چهارشنبه' }, { key: 'thursday', label: 'پنج‌شنبه' },
        { key: 'friday', label: 'جمعه' },
    ];

    const academicYears = React.useMemo(() => {
        const currentJalaliYear = moment().jYear();
        return Array.from({ length: 5 }, (_, i) => {
          const startYear = currentJalaliYear + i;
          return `${startYear}-${startYear + 1}`;
        });
    }, []);
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">تنظیمات</h1>
                <p className="text-slate-500 mt-1">تنظیمات کلی برنامه، ظاهر و گزینه‌های امنیتی را مدیریت کنید.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-2 sm:p-4">
                <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-6">
                    <TabButton tab="general" label="عمومی" />
                    <TabButton tab="appearance" label="ظاهری" />
                    <TabButton tab="workingDays" label="روزهای کاری" />
                    <TabButton tab="security" label="امنیتی" />
                    <TabButton tab="data" label="مدیریت داده‌ها" />
                </div>

                <div className="p-2 sm:p-4">
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">تنظیمات عمومی</h2>
                             <div className="grid grid-cols-1 gap-4">
                                 <div>
                                    <label htmlFor="academicYear" className="block text-sm font-medium text-slate-700 mb-1">سال تحصیلی فعال</label>
                                    <select name="academicYear" id="academicYear" value={localAppSettings.academicYear} onChange={handleAppSettingsChange} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                                        {academicYears.map(year => (
                                            <option key={year} value={year}>{toPersianDigits(year)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-4 mt-4 border-t border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-700 mb-3">مدیریت انواع جلسه</h3>
                                <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
                                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {localSessionTypes.map((st, index) => (
                                            <li 
                                                key={st.id} 
                                                className={`flex items-center justify-between p-2 bg-white rounded-md border group ${dragItem.current === index ? 'opacity-50 border-dashed border-sky-500' : ''}`}
                                                draggable
                                                onDragStart={() => (dragItem.current = index)}
                                                onDragEnter={() => (dragOverItem.current = index)}
                                                onDragEnd={handleSessionTypeDragEnd}
                                                onDragOver={(e) => e.preventDefault()}
                                            >
                                                <div className="flex items-center">
                                                    <Bars2Icon className="w-5 h-5 text-slate-400 cursor-grab mr-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                    <span className="text-slate-700">{st.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEditSessionType(st)} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-sky-600" title="ویرایش"><EditIcon className="w-4 h-4" /></button>
                                                    <button
                                                        onClick={() => handleDeleteSessionType(st.id)}
                                                        disabled={localSessionTypes.length <= 1}
                                                        title={localSessionTypes.length <= 1 ? "حداقل یک نوع جلسه باید وجود داشته باشد" : "حذف"}
                                                        className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <form onSubmit={handleSessionTypeSubmit} className="flex flex-col sm:flex-row items-end gap-3 pt-3 border-t">
                                        <div className="flex-grow w-full">
                                            <label htmlFor="sessionTypeName" className="block text-sm font-medium text-slate-700 mb-1">
                                                {editingSessionType ? `ویرایش نام:` : 'افزودن نوع جدید:'}
                                            </label>
                                            <input
                                                type="text"
                                                id="sessionTypeName"
                                                value={newSessionTypeName}
                                                onChange={e => setNewSessionTypeName(normalizePersianChars(e.target.value))}
                                                placeholder="مثال: مشاوره فردی"
                                                className="w-full p-2 border border-slate-300 rounded-md"
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                                            {editingSessionType && (
                                                <button type="button" onClick={handleCancelEdit} className="w-full sm:w-auto px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                                                    لغو
                                                </button>
                                            )}
                                            <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                                                {editingSessionType ? 'ذخیره' : 'افزودن'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={handleSaveGeneral} className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">ذخیره تنظیمات عمومی</button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'appearance' && (
                        <div className="space-y-4">
                             <h2 className="text-xl font-bold text-slate-800 mb-4">تنظیمات ظاهری</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                    <label htmlFor="fontSize" className="block text-sm font-medium text-slate-700 mb-1">اندازه فونت (پیکسل)</label>
                                    <input type="number" name="fontSize" value={localAppSettings.fontSize} onChange={handleAppSettingsChange} className="w-full p-2 border border-slate-300 rounded-md" placeholder="مثال: 16" />
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-700">اصلاح نویسه‌ها</h3>
                                <p className="text-sm text-slate-500 mt-1 mb-3 text-justify">
                                    این ابزار تمام حروف «ی» و «ک» عربی را در کل برنامه (نام دانش‌آموزان، کلاس‌ها، یادداشت‌ها و...) به معادل فارسی آن‌ها تبدیل می‌کند.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowNormalizeConfirm(true)}
                                    className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-md hover:bg-amber-600"
                                >
                                    شروع عملیات اصلاح
                                </button>
                            </div>
                            <div className="pt-4 mt-4 border-t border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-700">افزودن صفر به ابتدا</h3>
                                <p className="text-sm text-slate-500 mt-1 mb-3 text-justify">
                                    این ابزار به ابتدای شماره‌های موبایل ۱۰ رقمی (که با ۰ شروع نشده‌اند) و کدهای ملی ۹ رقمی، عدد صفر «۰» را اضافه می‌کند. این کار برای اصلاح داده‌هایی که صفر ابتدای آن‌ها حذف شده، مفید است.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowPrependZeroConfirm(true)}
                                    className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600"
                                >
                                    شروع عملیات افزودن صفر
                                </button>
                            </div>
                             <div className="flex justify-end pt-4">
                                <button type="button" onClick={handleSaveAppearance} className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">ذخیره تنظیمات ظاهری</button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'workingDays' && (
                         <div className="space-y-4">
                             <h2 className="text-xl font-bold text-slate-800 mb-4">روزهای کاری هفته</h2>
                             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                                {workingDaysMap.map(({key, label}) => (
                                     <div key={key} className="flex items-center p-2 bg-slate-50 rounded-md">
                                        <input type="checkbox" id={key} name={key} checked={localWorkingDays[key]} onChange={handleWorkingDaysChange} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"/>
                                        <label htmlFor={key} className="mr-2 text-sm font-medium text-slate-700">{label}</label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={handleSaveWorkingDays} className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">ذخیره روزهای کاری</button>
                            </div>
                        </div>
                    )}
                     {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">تنظیمات امنیتی</h2>
                            <p className="text-sm text-slate-500 -mt-4">برای آرشیو جلسات گذشته یک رمز عبور تنظیم کنید.</p>
                            
                            <div className="p-4 border rounded-md bg-slate-50 space-y-4">
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور فعلی</label>
                                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder={appSettings.sessionPasswordHash ? "برای تغییر یا حذف، رمز فعلی را وارد کنید" : "رمز عبوری تنظیم نشده است"} className="w-full p-2 border border-slate-300 rounded-md" />
                                    <p className="text-xs text-slate-400 mt-1">اگر برای اولین بار رمز تنظیم می‌کنید، این فیلد را خالی بگذارید.</p>
                                </div>
                                <hr/>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور جدید</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="رمز جدید (بین ۴ تا ۸ رقم)" className="w-full p-2 border border-slate-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">تکرار رمز عبور جدید</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="تکرار رمز جدید" className="w-full p-2 border border-slate-300 rounded-md" />
                                </div>

                                {securityMessage && (
                                    <p className={`text-sm font-semibold ${securityMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                        {securityMessage.text}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end items-center gap-4">
                                <div
                                    className="flex-grow"
                                    onMouseDown={handleLongPressStart}
                                    onMouseUp={handleLongPressEnd}
                                    onMouseLeave={handleLongPressEnd}
                                    onTouchStart={handleLongPressStart}
                                    onTouchEnd={handleLongPressEnd}
                                >&nbsp;</div>
                               {appSettings.sessionPasswordHash && isResetVisible && (
                                <button
                                    type="button"
                                    onClick={() => setShowResetConfirm(true)}
                                    className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
                                >
                                    ریست رمز عبور
                                </button>
                               )}
                               {appSettings.sessionPasswordHash && (
                                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                                    حذف رمز عبور
                                </button>
                               )}
                                <button type="button" onClick={handleSetPassword} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
                                    {appSettings.sessionPasswordHash ? 'تغییر رمز' : 'تنظیم رمز'}
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'data' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">مدیریت داده‌ها</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 border rounded-lg flex flex-col transition-shadow hover:shadow-md text-center">
                                    <h3 className="font-semibold mb-3 flex-grow">پشتیبان‌گیری</h3>
                                    <button type="button" onClick={() => setIsBackupModalOpen(true)} className="w-full mt-auto px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 text-sm">
                                        تهیه پشتیبان
                                    </button>
                                </div>
                                <div className="p-3 border rounded-lg flex flex-col transition-shadow hover:shadow-md text-center">
                                    <h3 className="font-semibold mb-3 flex-grow">بازیابی پشتیبان</h3>
                                    <input type="file" ref={restoreInputRef} onChange={handleRestoreChange} accept=".zip" className="hidden"/>
                                    <button type="button" onClick={() => restoreInputRef.current?.click()} className="w-full mt-auto px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm">
                                        انتخاب پشتیبان
                                    </button>
                                </div>
                                <div className="p-3 border rounded-lg flex flex-col transition-shadow hover:shadow-md text-center">
                                    <h3 className="font-semibold mb-3 flex-grow">دریافت عکس از سیدا</h3>
                                    <button type="button" onClick={() => setIsSidaModalOpen(true)} className="w-full mt-auto px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 text-sm">
                                        شروع
                                    </button>
                                </div>
                                 <div className="p-3 border border-red-200 bg-red-50 rounded-lg flex flex-col transition-shadow hover:shadow-md text-center">
                                    <h3 className="font-semibold mb-3 flex-grow text-red-800">حذف داده‌ها</h3>
                                    <button type="button" onClick={() => setShowFactoryResetConfirm(true)} className="w-full mt-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                                        شروع حذف
                                    </button>
                                </div>
                            </div>
                            <SupabaseSettings />
                        </div>
                    )}
                </div>
            </div>
            
            {toastMessage && (
                <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg">
                    {toastMessage}
                </div>
            )}
            {showDeleteConfirm && (
                <ConfirmationModal
                    title="حذف رمز عبور"
                    message="برای حذف رمز عبور، لطفا رمز فعلی خود را در فیلد «رمز عبور فعلی» وارد کرده و سپس روی دکمه «تایید حذف» کلیک کنید."
                    onConfirm={handleDeletePassword}
                    onCancel={() => setShowDeleteConfirm(false)}
                    confirmButtonText="تایید حذف"
                />
            )}
            {showResetConfirm && (
                <ConfirmationModal
                    title="ریست کردن رمز عبور"
                    message="آیا از ریست کردن رمز عبور اطمینان دارید؟ این عمل قفل امنیتی را به طور کامل غیرفعال می‌کند."
                    onConfirm={handleConfirmResetPassword}
                    onCancel={() => setShowResetConfirm(false)}
                    confirmButtonText="بله، ریست کن"
                    confirmButtonVariant="danger"
                />
            )}
            {showNormalizeConfirm && (
                <ConfirmationModal
                    title="اصلاح نویسه‌های عربی"
                    message="آیا از تبدیل تمام حروف «ی» و «ک» عربی به فارسی در کل برنامه اطمینان دارید؟ این عمل غیرقابل بازگشت است."
                    onConfirm={handleConfirmNormalize}
                    onCancel={() => setShowNormalizeConfirm(false)}
                    confirmButtonText="بله، اصلاح کن"
                    confirmButtonVariant="primary"
                />
            )}
            {showPrependZeroConfirm && (
                <ConfirmationModal
                    title="افزودن صفر به ابتدا"
                    message="آیا از افزودن صفر به ابتدای شماره‌های موبایل ۱۰ رقمی و کدهای ملی ۹ رقمی اطمینان دارید؟ این عمل غیرقابل بازگشت است."
                    onConfirm={handleConfirmPrependZero}
                    onCancel={() => setShowPrependZeroConfirm(false)}
                    confirmButtonText="بله، اضافه کن"
                    confirmButtonVariant="primary"
                />
            )}
            {showFactoryResetConfirm && (
                 <ConfirmationModal
                    title="حذف داده‌ها"
                    message={<p><strong>هشدار!</strong> این عمل تمام اطلاعات شامل کلاس‌ها، دانش‌آموزان، و جلسات را برای همیشه حذف خواهد کرد. این عمل غیرقابل بازگشت است. آیا مطمئن هستید؟</p>}
                    onConfirm={handleFactoryReset}
                    onCancel={() => setShowFactoryResetConfirm(false)}
                    confirmButtonText="بله، همه چیز را پاک کن"
                    confirmButtonVariant="danger"
                />
            )}
            {isSidaModalOpen && <SidaImportModal onClose={() => setIsSidaModalOpen(false)} />}
            {isBackupModalOpen && <BackupProgressModal onBackup={handleBackup} onClose={() => setIsBackupModalOpen(false)} />}
            {showRestoreConfirm && backupFile && (
                <ConfirmationModal
                    title="بازیابی اطلاعات"
                    message={
                        <p>
                            آیا از بازیابی اطلاعات از فایل <strong>{backupFile.name}</strong> اطمینان دارید؟
                            <br/>
                            <strong className="text-red-600">تمام اطلاعات فعلی شما پاک خواهد شد.</strong>
                        </p>
                    }
                    onConfirm={() => { setShowRestoreConfirm(false); /* The modal will be shown by backupFile state change */ }}
                    onCancel={() => { setBackupFile(null); setShowRestoreConfirm(false); }}
                    confirmButtonText="بله، بازیابی کن"
                />
            )}
            {/* This modal is now triggered only after confirmation */}
            {!showRestoreConfirm && backupFile && <RestoreProgressModal file={backupFile} onClose={() => setBackupFile(null)} />}

        </div>
    );
};

export default SettingsView;