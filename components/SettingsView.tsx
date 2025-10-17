import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import moment from 'jalali-moment';
import { useAppContext } from '../context/AppContext';
import type { AppSettings, WorkingDays, BackupData, SessionType, View } from '../types';
import { hashPassword, verifyPassword } from '../utils/helpers';
import SidaImportModal from './SidaImportModal';
import BackupProgressModal from './BackupProgressModal';
import { RestoreProgressModal } from './RestoreProgressModal';
import ConfirmationModal from './ConfirmationModal';
import { toPersianDigits, normalizePersianChars } from '../utils/helpers';
import { createClient } from '@supabase/supabase-js';
import { EditIcon, TrashIcon, Bars2Icon, AppLogoIcon, SaveIcon, ChevronDownIcon, QuestionMarkCircleIcon } from './icons';

type Tab = 'general' | 'appearance' | 'workingDays' | 'security' | 'data';

const SupabaseSettings: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    const { 
        appSettings, setAppSettings, 
        supabaseUser, supabaseLogin, supabaseLogout, supabaseResendConfirmation,
        syncToCloud, syncFromCloud,
        syncStatus, lastSyncTime,
        setHelpScrollTarget
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
    
    const handleHelpClick = () => {
        setHelpScrollTarget('#supabase-help-section');
        onNavigate('help');
    };

    return (
        <div className="p-4 border rounded-lg flex flex-col transition-shadow hover:shadow-md mt-6 bg-slate-50">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">همگام‌سازی با Supabase</h3>
                     <button onClick={handleHelpClick} title="راهنمای راه‌اندازی" className="text-sky-500 hover:text-sky-700">
                        <QuestionMarkCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-4 flex-grow text-left">همگام‌سازی بین دستگاه‌ها</p>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">آدرس پروژه Supabase (URL)</label>
                    <input type="text" dir="ltr" value={localSupabaseUrl} onChange={e => setLocalSupabaseUrl(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">کلید عمومی Supabase (Anon Key)</label>
                    <input type="password" dir="ltr" value={localSupabaseAnonKey} onChange={e => setLocalSupabaseAnonKey(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                </div>
                 <div className="flex justify-center pt-2">
                    <button onClick={handleSaveCredentials} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-400">
                        <SaveIcon className="w-5 h-5" />
                        <span>ذخیره و آزمایش</span>
                    </button>
                </div>
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


const SettingsView: React.FC<{ onBack: () => void; onNavigate: (view: View) => void; }> = ({ onBack, onNavigate }) => {
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
    const [isSessionTypesExpanded, setIsSessionTypesExpanded] = useState(false);
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

    // Appearance state
    const iconInputRef = useRef<HTMLInputElement>(null);


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
        await setAppSettings((prev) => ({
            ...prev, 
            academicYear: localAppSettings.academicYear,
            geminiApiKey: localAppSettings.geminiApiKey,
        }));
        showToast('ذخیره شد');
    };

    const handleSaveAppearance = async () => {
        await setAppSettings((prev) => ({...prev, fontSize: localAppSettings.fontSize, appIcon: localAppSettings.appIcon}));
        showToast('ذخیره شد');
    };
    
    const handleSaveWorkingDays = async () => {
        await setWorkingDays(localWorkingDays);
        showToast('ذخیره شد');
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

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 500) { // 500 KB limit
                alert('حجم فایل نباید بیشتر از 500 کیلوبایت باشد.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalAppSettings(prev => ({ ...prev, appIcon: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
        if(e.target) e.target.value = ''; 
    };

    const handleResetIcon = () => {
        setLocalAppSettings(prev => ({ ...prev, appIcon: '' }));
    };

    const handleConfirmNormalize = async () => {
        await handleNormalizeChars();
        setShowNormalizeConfirm(false);
        showToast('اصلاح شد');
    };

    const handleConfirmPrependZero = async () => {
        await handlePrependZero();
        setShowPrependZeroConfirm(false);
        showToast('اصلاح شد');
    };
    
    const handleConfirmFactoryReset = async () => {
        await handleFactoryReset();
        setShowFactoryResetConfirm(false);
        showToast('بازنشانی شد');
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
        
        const { supabaseUrl, supabaseAnonKey, ...settingsToBackup } = appSettings;

        const backupData: BackupData = {
            classrooms: allData.classrooms,
            students: allData.students.map(({ photoUrl, ...rest }) => rest), // Remove photoUrl from JSON
            sessions: allData.sessions,
            sessionTypes: sessionTypes,
            studentGroups: allData.studentGroups,
            workingDays: workingDays,
            appSettings: settingsToBackup,
            specialStudents: allData.specialStudents,
            counselingNeededStudents: allData.counselingNeededStudents,
            thinkingObservations: allData.thinkingObservations,
            thinkingEvaluations: allData.thinkingEvaluations,
            attendanceRecords: allData.attendanceRecords,
            attendanceNotes: allData.attendanceNotes,
        };
        zip.file("backup.json", JSON.stringify(backupData));
        
        onProgress({ progress: 40, message: 'فشرده‌سازی عکس‌ها...' });
        const photoFolder = zip.folder("photos");
        if (photoFolder) {
            allData.students.forEach(student => {
                if (student.photoUrl && student.photoUrl.startsWith('data:') && student.nationalId) {
                    const base64Data = student.photoUrl.split(',')[1];
                    photoFolder.file(`${student.nationalId}.jpg`, base64Data, { base64: true });
                }
            });
        }

        onProgress({ progress: 80, message: 'ساخت فایل نهایی...' });
        const content = await zip.generateAsync({ type: "blob" });
        
        const timestamp = moment().format('jYYYY-jMM-jDD_HH-mm');
        const filename = `SCA-BK_${timestamp}.zip`;

        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);

        onProgress({ progress: 100, message: 'پشتیبان‌گیری با موفقیت انجام شد.' });
    };
    
    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === tab 
                ? 'bg-sky-500 text-white shadow' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="relative text-center hidden md:block">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">تنظیمات</h1>
                <p className="text-slate-500 mt-1">تنظیمات کلی برنامه، ظاهر، امنیت و داده‌ها را مدیریت کنید.</p>
            </div>

            <div className="bg-white p-2 rounded-xl shadow-sm flex flex-wrap gap-1 justify-center sticky top-20 md:top-4 z-10">
                <TabButton tab="general" label="عمومی" />
                <TabButton tab="appearance" label="ظاهری" />
                <TabButton tab="workingDays" label="روزهای کاری" />
                <TabButton tab="security" label="امنیتی" />
                <TabButton tab="data" label="مدیریت داده‌ها" />
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label htmlFor="academicYear" className="block text-sm font-medium text-slate-700 mb-1">سال تحصیلی فعال</label>
                            <input type="text" id="academicYear" name="academicYear" value={localAppSettings.academicYear} onChange={handleAppSettingsChange} className="w-full p-2 border border-slate-300 rounded-md" placeholder="مثال: ۱۴۰۳-۱۴۰۴" />
                        </div>
                        <div>
                            <label htmlFor="geminiApiKey" className="block text-sm font-medium text-slate-700 mb-1">کلید API هوش مصنوعی (Google Gemini)</label>
                            <input type="password" id="geminiApiKey" name="geminiApiKey" value={localAppSettings.geminiApiKey} onChange={handleAppSettingsChange} className="w-full p-2 border border-slate-300 rounded-md" dir="ltr" />
                            <p className="text-xs text-slate-500 mt-1">این کلید برای استفاده از قابلیت‌های هوشمند (خلاصه‌سازی و پیشنهاد اقدام) لازم است.</p>
                        </div>
                        <div className="flex justify-center pt-4">
                            <button onClick={handleSaveGeneral} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
                                <SaveIcon className="w-5 h-5" />
                                <span>ذخیره</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
                         <button onClick={() => setIsSessionTypesExpanded(p => !p)} className="w-full flex justify-between items-center text-right font-semibold text-lg">
                            <span>مدیریت انواع جلسه</span>
                            <ChevronDownIcon className={`w-6 h-6 transition-transform ${isSessionTypesExpanded ? 'rotate-180' : ''}`} />
                        </button>
                         {isSessionTypesExpanded && (
                            <div className="pt-2 border-t">
                                <form onSubmit={handleSessionTypeSubmit} className="flex items-end gap-2 mb-3">
                                    <div className="flex-grow">
                                        <label htmlFor="session-type-name" className="text-sm">نام نوع جلسه</label>
                                        <input type="text" id="session-type-name" value={newSessionTypeName} onChange={e => setNewSessionTypeName(normalizePersianChars(e.target.value))} className="w-full p-2 border rounded-md" />
                                    </div>
                                    <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md">{editingSessionType ? 'ویرایش' : 'افزودن'}</button>
                                    {editingSessionType && <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-slate-200 rounded-md">انصراف</button>}
                                </form>
                                <ul className="space-y-2">
                                    {localSessionTypes.map((st, index) => (
                                        <li key={st.id} draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleSessionTypeDragEnd} onDragOver={e => e.preventDefault()}
                                            className="flex items-center justify-between p-2 bg-slate-50 rounded-md cursor-grab">
                                            <div className="flex items-center gap-2">
                                                <Bars2Icon className="w-5 h-5 text-slate-400" />
                                                <span>{st.name}</span>
                                            </div>
                                            <div>
                                                <button onClick={() => handleEditSessionType(st)} className="p-1"><EditIcon className="w-4 h-4 text-slate-500" /></button>
                                                <button onClick={() => handleDeleteSessionType(st.id)} className="p-1"><TrashIcon className="w-4 h-4 text-slate-500" /></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'appearance' && (
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-4 max-w-2xl mx-auto">
                    <div>
                        <label htmlFor="fontSize" className="block text-sm font-medium text-slate-700 mb-1">اندازه فونت</label>
                        <select id="fontSize" name="fontSize" value={localAppSettings.fontSize} onChange={handleAppSettingsChange} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                            <option value="14">کوچک</option>
                            <option value="16">متوسط</option>
                            <option value="18">بزرگ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">آیکون برنامه</label>
                        <div className="flex items-center gap-4">
                            <AppLogoIcon iconUrl={localAppSettings.appIcon} className="w-12 h-12 rounded-lg border-2 border-slate-200 p-1" />
                            <div className="flex-grow">
                                <button onClick={() => iconInputRef.current?.click()} className="w-full mb-2 px-4 py-2 bg-sky-500 text-white text-sm rounded-md hover:bg-sky-600">انتخاب آیکون</button>
                                <button onClick={handleResetIcon} className="w-full px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-md hover:bg-slate-300">بازنشانی به پیش‌فرض</button>
                                <input type="file" ref={iconInputRef} onChange={handleIconChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">آیکون در صفحه اصلی گوشی و در مرورگر نمایش داده می‌شود (حداکثر حجم: 500 کیلوبایت).</p>
                    </div>
                    <div className="flex justify-center pt-4">
                        <button onClick={handleSaveAppearance} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
                             <SaveIcon className="w-5 h-5" />
                            <span>ذخیره</span>
                        </button>
                    </div>
                </div>
            )}
            
            {activeTab === 'workingDays' && (
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-4 max-w-2xl mx-auto">
                    <h3 className="font-semibold text-lg">روزهای کاری هفته</h3>
                    <p className="text-sm text-slate-500">روزهایی که در مدرسه حضور دارید را انتخاب کنید. تقویم بر این اساس روزهای کاری را مشخص می‌کند.</p>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries({saturday: 'شنبه', sunday: 'یکشنبه', monday: 'دوشنبه', tuesday: 'سه‌شنبه', wednesday: 'چهارشنبه', thursday: 'پنجشنبه', friday: 'جمعه'}).map(([day, label]) => (
                            <div key={day} className="flex items-center p-3 bg-slate-50 rounded-md border">
                                <input type="checkbox" id={day} name={day} checked={localWorkingDays[day as keyof WorkingDays]} onChange={handleWorkingDaysChange} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                                <label htmlFor={day} className="mr-3 text-sm font-medium text-slate-800">{label}</label>
                            </div>
                        ))}
                    </div>
                     <div className="flex justify-center pt-4">
                        <button onClick={handleSaveWorkingDays} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
                             <SaveIcon className="w-5 h-5" />
                            <span>ذخیره</span>
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-4 max-w-2xl mx-auto">
                    <h3 className="font-semibold text-lg">رمز عبور</h3>
                    <p className="text-sm text-slate-500">برای محافظت از آرشیو جلسات و اطلاعات دانش‌آموزان خاص، یک رمز عبور عددی (۴ تا ۸ رقم) تنظیم کنید.</p>
                    
                    {appSettings.sessionPasswordHash && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور فعلی</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded-md" dir="ltr" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{appSettings.sessionPasswordHash ? 'رمز عبور جدید' : 'رمز عبور'}</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded-md" dir="ltr" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">تکرار رمز عبور {appSettings.sessionPasswordHash ? 'جدید' : ''}</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 border rounded-md" dir="ltr" />
                    </div>
                    {securityMessage && <p className={`text-sm text-center ${securityMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{securityMessage.text}</p>}
                    <div className="flex flex-wrap justify-center gap-3 pt-4">
                        <button onClick={handleSetPassword} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
                            {appSettings.sessionPasswordHash ? 'تغییر رمز عبور' : 'تنظیم رمز عبور'}
                        </button>
                        {appSettings.sessionPasswordHash && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                onMouseDown={handleLongPressStart}
                                onMouseUp={handleLongPressEnd}
                                onMouseLeave={handleLongPressEnd}
                                onTouchStart={handleLongPressStart}
                                onTouchEnd={handleLongPressEnd}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                حذف رمز عبور
                            </button>
                        )}
                    </div>
                    {isResetVisible && (
                        <div className="text-center pt-2">
                            <button onClick={() => setShowResetConfirm(true)} className="px-4 py-2 bg-orange-500 text-white text-sm rounded-md">ریست اضطراری رمز</button>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'data' && (
                 <div className="space-y-6">
                    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
                        <h3 className="font-semibold text-lg">ابزارهای داده</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button onClick={() => setShowNormalizeConfirm(true)} className="w-full p-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">اصلاح کاراکترهای عربی (ی, ک)</button>
                            <button onClick={() => setShowPrependZeroConfirm(true)} className="w-full p-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">افزودن صفر به ابتدای کد ملی/موبایل</button>
                        </div>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
                        <h3 className="font-semibold text-lg">پشتیبان‌گیری و بازیابی</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button onClick={() => setIsBackupModalOpen(true)} className="w-full p-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100">تهیه فایل پشتیبان</button>
                            <button onClick={() => restoreInputRef.current?.click()} className="w-full p-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100">بازیابی از فایل پشتیبان</button>
                            <input type="file" ref={restoreInputRef} onChange={(e) => { setBackupFile(e.target.files?.[0] || null); setShowRestoreConfirm(true); e.target.value = ''; }} accept=".zip" className="hidden" />
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm">
                         <h3 className="font-semibold text-lg mb-2">ورود اطلاعات</h3>
                         <button onClick={() => setIsSidaModalOpen(true)} className="w-full p-3 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100">دریافت گروهی عکس پروفایل از سیدا</button>
                    </div>

                    <SupabaseSettings onNavigate={onNavigate} />
                    
                    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-2 border-2 border-red-500">
                         <h3 className="font-semibold text-lg text-red-700">منطقه خطر</h3>
                         <button onClick={() => setShowFactoryResetConfirm(true)} className="w-full p-3 bg-red-50 text-red-700 rounded-md hover:bg-red-100">بازنشانی کارخانه (حذف تمام اطلاعات)</button>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg">
                    {toastMessage}
                </div>
            )}
            
            {showDeleteConfirm && (
                <ConfirmationModal
                    title="حذف رمز عبور"
                    message={<>
                        <p>آیا از حذف رمز عبور اطمینان دارید؟ برای این کار باید رمز عبور فعلی را وارد کنید.</p>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded-md mt-3" dir="ltr" placeholder="رمز عبور فعلی" autoFocus />
                        </>}
                    onConfirm={handleDeletePassword}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
            {showResetConfirm && (
                <ConfirmationModal
                    title="ریست اضطراری رمز"
                    message={<p className="text-red-600 font-bold">هشدار: این کار رمز عبور شما را برای همیشه حذف می‌کند. آیا مطمئن هستید؟</p>}
                    onConfirm={handleConfirmResetPassword} onCancel={() => setShowResetConfirm(false)}
                />
            )}
            
            {showNormalizeConfirm && <ConfirmationModal title="اصلاح کاراکترها" message="این عمل تمام نام‌ها را بررسی کرده و کاراکترهای «ي» و «ك» عربی را با «ی» و «ک» فارسی جایگزین می‌کند. آیا ادامه می‌دهید؟" onConfirm={handleConfirmNormalize} onCancel={() => setShowNormalizeConfirm(false)} confirmButtonText="بله، اصلاح کن" confirmButtonVariant="primary" />}
            {showPrependZeroConfirm && <ConfirmationModal title="افزودن صفر" message="این عمل تمام کدهای ملی ۱۰ رقمی و شماره‌های موبایل ۱۰ رقمی را بررسی کرده و در صورت نیاز، صفر را به ابتدای آنها اضافه می‌کند. آیا ادامه می‌دهید؟" onConfirm={handleConfirmPrependZero} onCancel={() => setShowPrependZeroConfirm(false)} confirmButtonText="بله، اصلاح کن" confirmButtonVariant="primary" />}
            {showFactoryResetConfirm && <ConfirmationModal title="بازنشانی کارخانه" message={<p className="text-red-600 font-bold">هشدار! این عمل تمام اطلاعات برنامه (دانش‌آموزان، جلسات، تنظیمات و...) را برای همیشه حذف می‌کند. این عمل غیرقابل بازگشت است. آیا مطمئن هستید؟</p>} onConfirm={handleConfirmFactoryReset} onCancel={() => setShowFactoryResetConfirm(false)} />}
            
            {isSidaModalOpen && <SidaImportModal onClose={() => setIsSidaModalOpen(false)} />}
            {isBackupModalOpen && <BackupProgressModal onBackup={handleBackup} onClose={() => setIsBackupModalOpen(false)} />}
            {showRestoreConfirm && backupFile && (
                <ConfirmationModal
                    title="بازیابی اطلاعات"
                    message={<p className="font-bold text-red-600">هشدار! این عمل تمام اطلاعات فعلی روی این دستگاه را حذف و با اطلاعات موجود در فایل پشتیبان جایگزین می‌کند. آیا مطمئن هستید؟</p>}
                    onConfirm={() => { setShowRestoreConfirm(false); }} // This will just close the confirm, restore modal will open next
                    onCancel={() => { setShowRestoreConfirm(false); setBackupFile(null); }}
                    confirmButtonText="بله، بازیابی کن"
                />
            )}
            {!showRestoreConfirm && backupFile && <RestoreProgressModal file={backupFile} onClose={() => setBackupFile(null)} />}
        </div>
    );
};

export default SettingsView;