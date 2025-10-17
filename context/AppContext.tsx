import React, { createContext, useContext, ReactNode, useState, useEffect, PropsWithChildren, SetStateAction, Dispatch } from 'react';
import type { Classroom, Student, Session, SessionType, StudentGroup, WorkingDays, AppSettings, BackupData, AppContextType, View, SpecialStudentInfo, CounselingNeededInfo, ThinkingObservation, ThinkingEvaluation, AttendanceRecord, AttendanceNote } from '../types';
import * as db from '../services/db';
import { mockClassrooms, mockStudents, mockSessions, mockSessionTypes, mockWorkingDays, mockAppSettings } from '../data/mockData';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { normalizePersianChars, toPersianDigits } from '../utils/helpers';

const AppContext = createContext<AppContextType | undefined>(undefined);

const getErrorMessage = (error: unknown): string => {
    if (typeof error !== 'object' || error === null) {
        const str = String(error);
        return str === '[object Object]' ? 'An unknown error occurred.' : str;
    }

    if (error instanceof Error) {
        return error.message;
    }

    const errObj = error as Record<string, any>;

    if (typeof errObj.message === 'string' && errObj.message) return errObj.message;
    if (typeof errObj.error_description === 'string' && errObj.error_description) return errObj.error_description;
    if (typeof errObj.error === 'string' && errObj.error) return errObj.error;
    
    if (typeof errObj.error === 'object' && errObj.error !== null) return getErrorMessage(errObj.error);
    if (typeof errObj.data === 'object' && errObj.data !== null) return getErrorMessage(errObj.data);
    
    if (Array.isArray(errObj.errors) && errObj.errors.length > 0) {
        return getErrorMessage(errObj.errors[0]);
    }

    try {
        const jsonString = JSON.stringify(error);
        if (jsonString !== '{}' && jsonString !== 'null') {
            return jsonString;
        }
    } catch {}
    
    return 'An unexpected error occurred with the cloud service.';
};

export const AppContextProvider = ({ children }: PropsWithChildren) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [workingDays, setWorkingDaysState] = useState<WorkingDays>(mockWorkingDays);
  const [appSettings, setAppSettingsState] = useState<AppSettings>(mockAppSettings);
  const [specialStudents, setSpecialStudents] = useState<SpecialStudentInfo[]>([]);
  const [counselingNeededStudents, setCounselingNeededStudents] = useState<CounselingNeededInfo[]>([]);
  const [thinkingObservations, setThinkingObservations] = useState<ThinkingObservation[]>([]);
  const [thinkingEvaluations, setThinkingEvaluations] = useState<ThinkingEvaluation[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceNotes, setAttendanceNotes] = useState<AttendanceNote[]>([]);
  
  const [calendarTargetDate, setCalendarTargetDate] = useState<Date | null>(null);
  const [helpScrollTarget, setHelpScrollTarget] = useState<string | null>(null);
  const [isArchiveUnlocked, setIsArchiveUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase state
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState({ active: false, progress: 0, message: '' });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const seedInitialData = async () => {
    const classroomCount = await db.getCount('classrooms');
    const studentCount = await db.getCount('students');
    if (classroomCount === 0 && studentCount === 0) {
        console.log("Seeding initial data...");
        const academicYear = mockAppSettings.academicYear;
        const initialClassrooms = mockClassrooms.map(c => ({...c, academicYear}));
        const initialStudents = mockStudents.map(s => ({...s, academicYear}));
        const initialSessions = mockSessions.map(s => ({...s, academicYear}));
        
        await db.addClassrooms(initialClassrooms);
        await db.putStudents(initialStudents);
        await db.addSessions(initialSessions);
        await db.addSessionTypes(mockSessionTypes);
        await db.putSetting('workingDays', mockWorkingDays);
        await db.putSetting('appSettings', mockAppSettings);
    }
  };
  
  const setAppSettings = async (updaterOrValue: AppSettings | ((prev: AppSettings) => AppSettings)) => {
    let newSettings: AppSettings;
    if (typeof updaterOrValue === 'function') {
      newSettings = updaterOrValue(appSettings);
    } else {
      newSettings = updaterOrValue;
    }
    await db.putSetting('appSettings', newSettings);
    setAppSettingsState(newSettings);
  };

  const loadData = async (academicYear: string) => {
    setIsLoading(true);
    try {
      await seedInitialData();
      const data = await db.loadInitialData(academicYear);
      
      setClassrooms(data.classrooms || []);
      setStudents(data.students || []);
      setSessions(data.sessions || []);
      setSessionTypes(data.sessionTypes || []);
      setStudentGroups(data.studentGroups || []);
      setWorkingDaysState(data.workingDays || mockWorkingDays);
      setAppSettingsState(data.appSettings || mockAppSettings);
      setSpecialStudents(data.specialStudents || []);
      setCounselingNeededStudents(data.counselingNeededStudents || []);
      setThinkingObservations(data.thinkingObservations || []);
      setThinkingEvaluations(data.thinkingEvaluations || []);
      setAttendanceRecords(data.attendanceRecords || []);
      setAttendanceNotes(data.attendanceNotes || []);
      setLastSyncTime(data.lastSyncTime ? new Date(data.lastSyncTime) : null);
    } catch (error) {
        console.error("CRITICAL: Failed to load application data. App may be unstable.", error);
    } finally {
        setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData(appSettings.academicYear);
  }, [appSettings.academicYear]);
  
  // Supabase client initialization and auth handling
  useEffect(() => {
    if (appSettings.supabaseUrl && appSettings.supabaseAnonKey) {
        const client = createClient(appSettings.supabaseUrl, appSettings.supabaseAnonKey);
        setSupabase(client);
        
        client.auth.getSession().then(({ data: { session } }) => {
            setSupabaseUser(session?.user ?? null);
        });

        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
            setSupabaseUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    } else {
        setSupabase(null);
        setSupabaseUser(null);
    }
  }, [appSettings.supabaseUrl, appSettings.supabaseAnonKey]);


  const setWorkingDays: AppContextType['setWorkingDays'] = async (updaterOrValue) => {
    let newDays: WorkingDays;
    if (typeof updaterOrValue === 'function') {
      newDays = updaterOrValue(workingDays);
    } else {
      newDays = updaterOrValue;
    }
    await db.putSetting('workingDays', newDays);
    setWorkingDaysState(newDays);
  };

  const handleAddClassroom = async (name: string) => {
    const newClassroom = await db.addClassroom({ name, academicYear: appSettings.academicYear });
    setClassrooms(prev => [...prev, newClassroom]);
  };
  
  const handleUpdateClassroom = async (classroom: Classroom) => {
    await db.putClassroom(classroom);
    setClassrooms(prev => prev.map(c => c.id === classroom.id ? classroom : c));
  };
  
  const handleDeleteClassroom = async (id: string) => {
      await db.deleteJustClassroom(id);
      setClassrooms(prev => prev.filter(c => c.id !== id));
      // Update students who were in the deleted class
      setStudents(prev => prev.map(s => s.classroomId === id ? { ...s, classroomId: '' } : s));
  };
  
  const handleAddStudent = async (student: Omit<Student, 'id' | 'photoUrl' | 'academicYear'>) => {
    const newStudent = await db.addStudent({ ...student, photoUrl: '', academicYear: appSettings.academicYear });
    setStudents(prev => [...prev, newStudent]);
  };

  const handleAddStudentsBatch = async (studentsData: Omit<Student, 'id'| 'photoUrl' | 'academicYear'>[]) => {
      const newStudents = await db.addStudents(studentsData.map(s => ({ ...s, photoUrl: '', academicYear: appSettings.academicYear })));
      setStudents(prev => [...prev, ...newStudents]);
  };
  
  const handleUpdateStudent = async (student: Student) => {
    await db.putStudent(student);
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
  };
  
  const handleDeleteStudent = async (studentId: string) => {
    await db.deleteStudent(studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setSessions(prev => prev.filter(s => s.studentId !== studentId));
  };
  
  const handleSaveSession: AppContextType['handleSaveSession'] = async (sessionData) => {
    if ('id' in sessionData) {
      const updatedSession = { ...sessionData, academicYear: appSettings.academicYear };
      await db.putSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    } else {
      const newSession = await db.addSession({ ...sessionData, academicYear: appSettings.academicYear });
      setSessions(prev => [...prev, newSession]);
    }
  };
  
  const handleDeleteSession = async (sessionId: string) => {
    await db.deleteSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };
  
  const handleAddSessionType = async (name: string) => {
    const newType = await db.addSessionType({ name, order: sessionTypes.length });
    setSessionTypes(prev => [...prev, newType]);
  };

  const handleUpdateSessionType = async (sessionType: SessionType) => {
    await db.putSessionType(sessionType);
    setSessionTypes(prev => prev.map(st => st.id === sessionType.id ? sessionType : st));
  };
  
  const handleDeleteSessionType = async (id: string) => {
    if (sessionTypes.length <= 1) {
      alert("حداقل یک نوع جلسه باید وجود داشته باشد.");
      return;
    }
    await db.deleteSessionType(id);
    setSessionTypes(prev => prev.filter(st => st.id !== id));
  };
  
  const handleSaveGroup = async (group: Omit<StudentGroup, 'id'>) => {
    const newGroup = await db.addStudentGroup(group);
    setStudentGroups(prev => [...prev, newGroup]);
  };
  
  const handleUpdateGroup = async (group: StudentGroup) => {
      await db.putStudentGroup(group);
      setStudentGroups(prev => prev.map(g => g.id === group.id ? group : g));
  };
  
  const handleDeleteGroup = async (groupId: string) => {
      await db.deleteStudentGroup(groupId);
      setStudentGroups(prev => prev.filter(g => g.id !== groupId));
  };
  
  const handleMoveStudentToGroup = async (studentId: string, sourceGroupId: string | null, destinationGroupId: string | null) => {
      if (sourceGroupId === destinationGroupId) return;

      const updatedGroups = studentGroups.map(group => {
          let newStudentIds = [...group.studentIds];
          if (group.id === sourceGroupId) {
              newStudentIds = newStudentIds.filter(id => id !== studentId);
          }
          if (group.id === destinationGroupId) {
              if (!newStudentIds.includes(studentId)) {
                  newStudentIds.push(studentId);
              }
          }
          return { ...group, studentIds: newStudentIds };
      });
      
      await db.putStudentGroups(updatedGroups);
      setStudentGroups(updatedGroups);
  };

  const handleReorderStudentGroups = async (reorderedGroups: StudentGroup[]) => {
      const updatedGroups = reorderedGroups.map((group, index) => ({...group, order: index}));
      await db.putStudentGroups(updatedGroups);
      setStudentGroups(updatedGroups);
  };
  
  const handleUpdateSpecialStudentInfo = async (info: SpecialStudentInfo) => {
      await db.putSpecialStudentInfo(info);
      setSpecialStudents(prev => {
          const index = prev.findIndex(s => s.studentId === info.studentId);
          if (index > -1) {
              const newArr = [...prev];
              newArr[index] = info;
              return newArr;
          }
          return [...prev, info];
      });
  };
  
  const handleUpdateCounselingNeededInfo = async (info: CounselingNeededInfo) => {
      await db.putCounselingNeededInfo(info);
      setCounselingNeededStudents(prev => {
          const index = prev.findIndex(s => s.studentId === info.studentId);
          if (index > -1) {
              const newArr = [...prev];
              newArr[index] = info;
              return newArr;
          }
          return [...prev, info];
      });
  };

  const handleUpdateThinkingObservation = async (observation: ThinkingObservation) => {
    await db.putThinkingObservation(observation);
    setThinkingObservations(prev => {
        const index = prev.findIndex(o => o.studentId === observation.studentId);
        if (index > -1) {
            const newArr = [...prev];
            newArr[index] = observation;
            return newArr;
        }
        return [...prev, observation];
    });
  };

  const handleUpdateThinkingEvaluation = async (evaluation: ThinkingEvaluation) => {
    await db.putThinkingEvaluation(evaluation);
    setThinkingEvaluations(prev => {
        const index = prev.findIndex(e => e.studentId === evaluation.studentId);
        if (index > -1) {
            const newArr = [...prev];
            newArr[index] = evaluation;
            return newArr;
        }
        return [...prev, evaluation];
    });
  };
  
  const handleSetAttendance = async (studentId: string, date: string, status: 'absent' | 'tardy' | 'present') => {
      const id = `${studentId}-${date}`;
      try {
          if (status === 'present') {
              await db.deleteAttendanceRecord(id);
          } else {
              const record: AttendanceRecord = { id, studentId, date, status, academicYear: appSettings.academicYear };
              await db.putAttendanceRecord(record);
          }
          // Re-fetch from DB to ensure state consistency and fix persistence bug
          const allRecords = await db.getAttendanceRecords(appSettings.academicYear);
          setAttendanceRecords(allRecords);
      } catch (error) {
          console.error("Failed to update attendance:", error);
          // Optionally show an error to the user
      }
  };
  
  const handleSetAttendanceNote = async (classroomId: string, date: string, notes: string) => {
    const id = `${classroomId}-${date}`;
    const trimmedNotes = notes.trim();

    if (!trimmedNotes) {
        await db.deleteAttendanceNote(id).catch(e => console.error("Failed to delete note", e));
        setAttendanceNotes(prev => prev.filter(n => n.id !== id));
    } else {
        const note: AttendanceNote = { id, classroomId, date, notes: trimmedNotes, academicYear: appSettings.academicYear };
        await db.putAttendanceNote(note);
        setAttendanceNotes(prev => {
            const index = prev.findIndex(n => n.id === id);
            if (index > -1) {
                const newArr = [...prev];
                newArr[index] = note;
                return newArr;
            }
            return [...prev, note];
        });
    }
  };

  const handleRestore: AppContextType['handleRestore'] = async (data, fromSync = false) => {
    await db.clearAllData();
  
    await db.addClassrooms(data.classrooms || []);
    await db.putStudents(data.students || []);
    await db.addSessions(data.sessions || []);
    await db.addSessionTypes(data.sessionTypes || []);
    await db.putStudentGroups(data.studentGroups || []);
    await db.putSpecialStudents(data.specialStudents || []);
    await db.putCounselingNeededStudents(data.counselingNeededStudents || []);
    await db.putThinkingObservations(data.thinkingObservations || []);
    await db.putThinkingEvaluations(data.thinkingEvaluations || []);
    await db.putAttendanceRecords(data.attendanceRecords || []);
    await db.putAttendanceNotes(data.attendanceNotes || []);

    const workingDaysToRestore = (data.workingDays && typeof data.workingDays === 'object') ? data.workingDays : mockWorkingDays;
    
    // FIX: This prevents errors if the backup data is malformed (e.g., appSettings is null or an array).
    const appSettingsFromBackup: Partial<AppSettings> = (data.appSettings && typeof data.appSettings === 'object' && !Array.isArray(data.appSettings)) ? data.appSettings : {};

    const syncCredentials = fromSync 
        ? { 
            supabaseUrl: appSettings.supabaseUrl, 
            supabaseAnonKey: appSettings.supabaseAnonKey 
          } 
        : {};

    // @google/genai-api FIX: Use Object.assign to avoid spread type errors with complex inferred types.
    const finalAppSettings = Object.assign({}, mockAppSettings, appSettingsFromBackup, syncCredentials);
    
    await db.putSetting('workingDays', workingDaysToRestore);
    await db.putSetting('appSettings', finalAppSettings);

    await loadData(finalAppSettings.academicYear);
  };
  
  const handleBatchUpdateStudentPhotos = async (updates: { studentId: string, photoUrl: string }[]) => {
      const studentMap = new Map(students.map(s => [s.id, s]));
      const updatedStudents: Student[] = [];

      updates.forEach(({studentId, photoUrl}) => {
          const student = studentMap.get(studentId);
          if (student) {
              updatedStudents.push({ ...student, photoUrl });
          }
      });

      if (updatedStudents.length > 0) {
          await db.putStudents(updatedStudents);
          setStudents(prev => {
              const updatedMap = new Map(updatedStudents.map(s => [s.id, s]));
              return prev.map(s => updatedMap.get(s.id) || s);
          });
      }
  };
  
    const handleBatchUpdateStudentClassrooms = async (updates: { studentId: string; classroomId: string }[]) => {
        const studentMap = new Map(students.map(s => [s.id, s]));
        const studentsToUpdate: Student[] = [];
        updates.forEach(({ studentId, classroomId }) => {
            const student = studentMap.get(studentId);
            if (student) {
                studentsToUpdate.push({ ...student, classroomId });
            }
        });
        if (studentsToUpdate.length > 0) {
            await db.putStudents(studentsToUpdate);
            const updatedMap = new Map(studentsToUpdate.map(s => [s.id, s]));
            setStudents(prev => prev.map(s => updatedMap.get(s.id) || s));
        }
    };
    
    const handleBatchUpdateStudentDetails = async (updates: { studentId: string; data: Partial<Omit<Student, 'id'>> }[]) => {
        const studentMap = new Map(students.map(s => [s.id, s]));
        const studentsToUpdate: Student[] = [];
        updates.forEach(({ studentId, data }) => {
            const student = studentMap.get(studentId);
            if (student) {
                // @google/genai-api FIX: Replaced spread operator with Object.assign to prevent "Spread types may only be created from object types" error.
                studentsToUpdate.push(Object.assign({}, student, (data && typeof data === 'object' ? data : {})) as Student);
            }
        });
        if (studentsToUpdate.length > 0) {
            await db.putStudents(studentsToUpdate);
            const updatedMap = new Map(studentsToUpdate.map(s => [s.id, s]));
            setStudents(prev => prev.map(s => updatedMap.get(s.id) || s));
        }
    };

    const handleBatchCreateClassrooms = async (classroomsToCreate: { name: string }[]): Promise<Classroom[]> => {
        const newClassroomsData = classroomsToCreate.map(c => ({...c, academicYear: appSettings.academicYear}));
        const createdClassrooms = await db.addMultipleClassrooms(newClassroomsData);
        setClassrooms(prev => [...prev, ...createdClassrooms]);
        return createdClassrooms;
    };
    
    const handleNormalizeChars = async () => {
        const updatedStudents = students.map(s => ({
            ...s,
            firstName: normalizePersianChars(s.firstName),
            lastName: normalizePersianChars(s.lastName),
            fatherName: s.fatherName ? normalizePersianChars(s.fatherName) : undefined,
        }));
        await db.putStudents(updatedStudents);
        setStudents(updatedStudents);
    };

    const handlePrependZero = async () => {
        const updatedStudents = students.map(s => {
            let mobile = s.mobile;
            let nationalId = s.nationalId;
            if (mobile && mobile.length === 10 && !mobile.startsWith('0')) {
                mobile = '0' + mobile;
            }
            if (nationalId && nationalId.length === 9 && !nationalId.startsWith('0')) {
                nationalId = '0' + nationalId;
            }
            // @google/genai-api FIX: Replaced spread operator with Object.assign to prevent "Spread types may only be created from object types" error.
            return Object.assign({}, s, { mobile, nationalId }) as Student;
        });
        await db.putStudents(updatedStudents);
        setStudents(updatedStudents);
    };

  const handleReorderClassrooms = async (reorderedClassrooms: Classroom[]) => {
    const updated = reorderedClassrooms.map((c, index) => ({...c, order: index}));
    await db.putClassrooms(updated);
    setClassrooms(updated);
  };
  
  const handleReorderSessionTypes = async (reorderedSessionTypes: SessionType[]) => {
    const updated = reorderedSessionTypes.map((st, index) => ({...st, order: index}));
    await db.putSessionTypes(updated);
    setSessionTypes(updated);
  };

  const handleReorderMoreMenu = async (reorderedMenu: View[]) => {
    await setAppSettings(prev => ({ ...prev, moreMenuOrder: reorderedMenu }));
  };
  
  const handleFactoryReset = async () => {
    await db.clearAllData();
    // Navigate to root to force a full, clean reload of the application.
    window.location.href = '/';
  };
  
  // Supabase functions
  const supabaseLogin = async (email: string, password: string) => {
    if (!supabase) return { error: { message: 'Supabase connection is not active.' }};
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error && (error.message.includes('User not found') || error.message.includes('Invalid login credentials'))) {
        return supabase.auth.signUp({ email, password });
    }
    return { error };
  };
  
  const supabaseResendConfirmation = async (email: string) => {
    if (!supabase) return { error: { message: 'Supabase connection is not active.' }};
    return supabase.auth.resend({ type: 'signup', email });
  };
  
  const supabaseLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const syncToCloud = async () => {
    if (!supabase || !supabaseUser) {
        setSyncStatus({ active: true, progress: 100, message: 'خطا: ابتدا وارد حساب کاربری خود شوید.' });
        setTimeout(() => setSyncStatus({ active: false, progress: 0, message: '' }), 3000);
        return;
    }

    setSyncStatus({ active: true, progress: 0, message: 'شروع همگام‌سازی...' });

    try {
        setSyncStatus(prev => ({ ...prev, progress: 10, message: 'جمع‌آوری اطلاعات دستگاه...' }));
        
        // @google/genai-api FIX: Avoid rest spread in destructuring to prevent type errors with complex types.
        const settingsToBackup = Object.assign({}, appSettings || mockAppSettings);
        delete (settingsToBackup as Partial<AppSettings>).supabaseUrl;
        delete (settingsToBackup as Partial<AppSettings>).supabaseAnonKey;

        const localData: BackupData = {
            classrooms, students, sessions, sessionTypes, studentGroups, workingDays,
            appSettings: settingsToBackup,
            specialStudents, counselingNeededStudents,
            thinkingObservations, thinkingEvaluations,
            attendanceRecords, attendanceNotes,
        };
        
        // Remove photo data from students before JSON serialization for DB
        const studentsForDb = localData.students.map(({ photoUrl, ...rest }) => rest);
        // @google/genai-api FIX: Replaced spread operator with Object.assign to prevent "Spread types may only be created from object types" error.
        const dataForDb = Object.assign({}, localData, { students: studentsForDb });

        setSyncStatus(prev => ({ ...prev, progress: 20, message: 'ارسال اطلاعات اصلی به ابر...' }));
        
        const { error: updateError } = await supabase.from('profiles').update({ app_data: dataForDb }).eq('id', supabaseUser.id);
        if (updateError) throw updateError;
        
        // --- Photo Sync ---
        setSyncStatus(prev => ({ ...prev, progress: 40, message: 'بررسی عکس‌های پروفایل...' }));

        const studentsWithPhotos = students.filter(s => s.nationalId && s.photoUrl && s.photoUrl.startsWith('data:image'));
        const photoBucket = supabase.storage.from('photos');
        const totalPhotos = studentsWithPhotos.length;
        
        for (const [index, student] of studentsWithPhotos.entries()) {
            const progress = 40 + Math.round(((index + 1) / totalPhotos) * 55);
            setSyncStatus(prev => ({ ...prev, progress, message: `درحال همگام‌سازی عکس ${toPersianDigits(index + 1)} از ${toPersianDigits(totalPhotos)}...` }));
            
            const response = await fetch(student.photoUrl!);
            const blob = await response.blob();
            const filePath = `${supabaseUser.id}/${student.nationalId}.jpg`;

            const { error: uploadError } = await photoBucket.upload(filePath, blob, { upsert: true });
            if (uploadError) {
                console.warn(`Failed to upload photo for ${student.nationalId}:`, uploadError);
            }
        }
        
        const newSyncTime = new Date();
        await db.putSetting('lastSyncTime', newSyncTime.toISOString());
        setLastSyncTime(newSyncTime);

        setSyncStatus({ active: true, progress: 100, message: 'همگام‌سازی با موفقیت انجام شد!' });

    } catch (error) {
        setSyncStatus({ active: true, progress: 100, message: `خطا: ${getErrorMessage(error)}` });
    } finally {
        setTimeout(() => setSyncStatus({ active: false, progress: 0, message: '' }), 3000);
    }
  };
  
  const syncFromCloud = async () => {
    if (!supabase || !supabaseUser) {
        setSyncStatus({ active: true, progress: 100, message: 'خطا: ابتدا وارد حساب کاربری خود شوید.' });
        setTimeout(() => setSyncStatus({ active: false, progress: 0, message: '' }), 3000);
        return;
    }
    
    setSyncStatus({ active: true, progress: 0, message: 'شروع دریافت از ابر...' });

    try {
        setSyncStatus(prev => ({...prev, progress: 10, message: 'دریافت اطلاعات اصلی از ابر...'}));
        const { data, error } = await supabase.from('profiles').select('app_data').eq('id', supabaseUser.id).single();
        if (error) throw error;
        if (!data || !data.app_data) {
            setSyncStatus({ active: true, progress: 100, message: 'هیچ اطلاعاتی در ابر یافت نشد.' });
            setTimeout(() => setSyncStatus({ active: false, progress: 0, message: '' }), 3000);
            return;
        }

        const cloudData = data.app_data as BackupData;
        
        // --- Photo Download ---
        setSyncStatus(prev => ({...prev, progress: 40, message: 'دریافت لیست عکس‌ها...'}));
        const photoBucket = supabase.storage.from('photos');
        const { data: photoList, error: listError } = await photoBucket.list(supabaseUser.id);
        if (listError) console.warn("Could not list photos:", listError);

        const studentsWithPhotos = [...(cloudData.students || [])];
        if (photoList && photoList.length > 0) {
            const totalPhotos = photoList.length;
            for (const [index, photoFile] of photoList.entries()) {
                const progress = 40 + Math.round(((index + 1) / totalPhotos) * 55);
                setSyncStatus(prev => ({ ...prev, progress, message: `درحال دانلود عکس ${toPersianDigits(index + 1)} از ${toPersianDigits(totalPhotos)}...`}));

                const nationalId = photoFile.name.split('.')[0];
                const studentIndex = studentsWithPhotos.findIndex(s => s.nationalId === nationalId);

                if (studentIndex > -1) {
                    const { data: blob, error: downloadError } = await photoBucket.download(`${supabaseUser.id}/${photoFile.name}`);
                    if (blob && !downloadError) {
                         const dataUrl = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        studentsWithPhotos[studentIndex].photoUrl = dataUrl;
                    } else {
                        console.warn(`Failed to download photo for ${nationalId}:`, downloadError);
                    }
                }
            }
        }
        
        cloudData.students = studentsWithPhotos;
        
        setSyncStatus(prev => ({...prev, progress: 95, message: 'اعمال اطلاعات روی دستگاه...'}));
        await handleRestore(cloudData, true);

        setSyncStatus({ active: true, progress: 100, message: 'اطلاعات با موفقیت از ابر دریافت شد!' });

    } catch (error) {
        setSyncStatus({ active: true, progress: 100, message: `خطا: ${getErrorMessage(error)}` });
    } finally {
        setTimeout(() => setSyncStatus({ active: false, progress: 0, message: '' }), 3000);
    }
  };

  return (
    <AppContext.Provider value={{ 
        classrooms, students, sessions, sessionTypes, studentGroups, workingDays, appSettings, specialStudents, counselingNeededStudents, thinkingObservations, thinkingEvaluations, attendanceRecords, attendanceNotes,
        setAppSettings, setWorkingDays,
        handleAddClassroom, handleUpdateClassroom, handleDeleteClassroom,
        handleAddStudent, handleUpdateStudent, handleDeleteStudent, handleAddStudentsBatch,
        handleSaveSession, handleDeleteSession,
        handleAddSessionType, handleUpdateSessionType, handleDeleteSessionType,
        handleSaveGroup, handleUpdateGroup, handleDeleteGroup, handleMoveStudentToGroup, handleReorderStudentGroups,
        handleUpdateSpecialStudentInfo, handleUpdateCounselingNeededInfo,
        handleUpdateThinkingObservation, handleUpdateThinkingEvaluation,
        handleSetAttendance, handleSetAttendanceNote,
        handleRestore,
        handleBatchUpdateStudentPhotos,
        handleBatchUpdateStudentClassrooms,
        handleBatchUpdateStudentDetails,
        handleBatchCreateClassrooms,
        handleNormalizeChars,
        handlePrependZero,
        handleReorderClassrooms,
        handleReorderSessionTypes,
        handleReorderMoreMenu,
        handleFactoryReset,
        isArchiveUnlocked, setIsArchiveUnlocked,
        isLoading,
        calendarTargetDate, setCalendarTargetDate,
        helpScrollTarget, setHelpScrollTarget,
        // Supabase
        supabaseUser, supabaseLogin, supabaseLogout, supabaseResendConfirmation,
        syncToCloud, syncFromCloud,
        syncStatus, lastSyncTime,
     }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
