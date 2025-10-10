import React, { createContext, useContext, ReactNode, useState, useEffect, PropsWithChildren } from 'react';
import type { Classroom, Student, Session, SessionType, StudentGroup, WorkingDays, AppSettings, BackupData, AppContextType, View, SpecialStudentInfo, CounselingNeededInfo, ThinkingObservation, ThinkingEvaluation } from '../types';
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
  const [workingDays, setWorkingDays] = useState<WorkingDays>(mockWorkingDays);
  const [appSettings, setAppSettings] = useState<AppSettings>(mockAppSettings);
  const [specialStudents, setSpecialStudents] = useState<SpecialStudentInfo[]>([]);
  const [counselingNeededStudents, setCounselingNeededStudents] = useState<CounselingNeededInfo[]>([]);
  const [thinkingObservations, setThinkingObservations] = useState<ThinkingObservation[]>([]);
  const [thinkingEvaluations, setThinkingEvaluations] = useState<ThinkingEvaluation[]>([]);
  
  const [calendarTargetDate, setCalendarTargetDate] = useState<Date | null>(null);
  const [isArchiveUnlocked, setIsArchiveUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase state
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState({ active: false, progress: 0, message: '' });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const seedInitialData = async () => {
    // This function will contain the logic to populate DB with mock data.
    // In the new schema, we don't seed classrooms as they are user-defined.
    await db.putStudents(mockStudents);
    await db.addSessions(mockSessions);
    await db.addSessionTypes(mockSessionTypes);
    await db.putSetting('workingDays', mockWorkingDays);
    await db.putSetting('appSettings', mockAppSettings);
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        const studentsCount = await db.getCount('students');
        if (studentsCount === 0) {
          await seedInitialData();
        }
        
        // Consolidated settings load
        let loadedSettings = await db.getSetting('appSettings');
        
        // Ensure settings exist and are valid, and merge with defaults for robustness.
        if (!loadedSettings || typeof loadedSettings !== 'object') {
            loadedSettings = mockAppSettings;
            await db.putSetting('appSettings', loadedSettings); // Persist defaults if missing/invalid
        } else {
            // Merge with defaults to ensure new setting properties from app updates are included.
            loadedSettings = { ...mockAppSettings, ...loadedSettings };
            // FIX: Explicitly check for a null/invalid icon after merging and reset to default if needed.
            // This handles cases where older versions of the app might have stored a null value.
            if (!loadedSettings.appIcon) {
                loadedSettings.appIcon = mockAppSettings.appIcon;
            }
        }

        // The pre-React script sets the favicon from localStorage for speed.
        // We will trust localStorage as the most recent source for the icon
        // to ensure UI consistency and self-heal any mismatch with IndexedDB.
        try {
            const storedIcon = localStorage.getItem('appIcon');
            const isValidIcon = storedIcon && (storedIcon.startsWith('/') || storedIcon.startsWith('data:'));
            
            if (isValidIcon && storedIcon !== loadedSettings.appIcon) {
              loadedSettings.appIcon = storedIcon;
              // Asynchronously update IndexedDB to fix the inconsistency.
              await db.putSetting('appSettings', loadedSettings);
            } else if (!isValidIcon && storedIcon !== null) {
              // Clean up invalid data from localStorage and ensure the correct icon is set from our now-valid settings.
              localStorage.setItem('appIcon', loadedSettings.appIcon);
            } else if (storedIcon === null) {
              // If there's nothing in storage, put the correct icon there.
              localStorage.setItem('appIcon', loadedSettings.appIcon);
            }
        } catch(e) {
            console.error('Could not access localStorage during init', e);
        }
        
        // This is now the single point where settings are loaded into state on startup.
        setAppSettings(loadedSettings);

        // Now load the rest of the data based on the correct academic year from settings.
        await loadDataFromDb(loadedSettings.academicYear);

      } catch (error) {
        console.error("Failed to initialize the application:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  useEffect(() => {
    const { supabaseUrl, supabaseAnonKey } = appSettings;
    if (supabaseUrl && supabaseAnonKey) {
        try {
            const client = createClient(supabaseUrl, supabaseAnonKey);
            setSupabase(client);

            client.auth.getSession().then(({ data: { session } }) => {
                setSupabaseUser(session?.user ?? null);
            });

            const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
                setSupabaseUser(session?.user ?? null);
            });
    
            return () => {
                subscription?.unsubscribe();
            };
        } catch (error) {
            console.error("Failed to create Supabase client with new settings:", error);
            setSupabase(null);
        }
    } else {
        setSupabase(null);
    }
  }, [appSettings.supabaseUrl, appSettings.supabaseAnonKey]);
  
  const loadDataFromDb = async (academicYearToLoad?: string) => {
      const academicYear = academicYearToLoad || appSettings.academicYear;

      const data = await db.loadInitialData(academicYear);

      setClassrooms(data.classrooms.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setStudents(data.students);
      setSessions(data.sessions);
      setSessionTypes(data.sessionTypes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setStudentGroups(data.studentGroups || []);
      setWorkingDays(data.workingDays || mockWorkingDays);
      setSpecialStudents(data.specialStudents || []);
      setCounselingNeededStudents(data.counselingNeededStudents || []);
      setThinkingObservations(data.thinkingObservations || []);
      setThinkingEvaluations(data.thinkingEvaluations || []);
      setLastSyncTime(data.lastSyncTime ? new Date(data.lastSyncTime) : null);
  };

  const setAppSettingsHandler = async (updaterOrValue: AppSettings | ((prev: AppSettings) => AppSettings)) => {
    const oldAcademicYear = appSettings.academicYear;
    const newSettings = await new Promise<AppSettings>(resolve => {
        setAppSettings((current: AppSettings) => {
            const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
            resolve(updated);
            return updated;
        });
    });

    await db.putSetting('appSettings', newSettings);
    
    try {
        if (newSettings.appIcon) {
            localStorage.setItem('appIcon', newSettings.appIcon);
        } else {
            localStorage.removeItem('appIcon');
        }
    } catch(e) {
        console.error('Could not access localStorage to save app icon.', e);
    }

    // After changing a setting that affects the manifest (like the icon),
    // we ask the browser to check for an updated service worker.
    // This encourages it to re-fetch the manifest.json.
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        });
    }

    if (newSettings.academicYear !== oldAcademicYear) {
        setIsLoading(true);
        await loadDataFromDb(newSettings.academicYear);
        setIsLoading(false);
    }
  };

  const setWorkingDaysHandler = async (updaterOrValue: WorkingDays | ((prev: WorkingDays) => WorkingDays)) => {
    const newDays = await new Promise<WorkingDays>(resolve => {
        setWorkingDays((current: WorkingDays) => {
            const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
            resolve(updated);
            return updated;
        });
    });
    await db.putSetting('workingDays', newDays);
  };
  
  const handleAddClassroom = async (name: string) => {
    const newClassroom = await db.addClassroom({ name, academicYear: appSettings.academicYear, order: classrooms.length });
    setClassrooms(prev => [...prev, newClassroom]);
  };

  const handleUpdateClassroom = async (classroom: Classroom) => {
    await db.putClassroom(classroom);
    setClassrooms(prev => prev.map(c => c.id === classroom.id ? classroom : c));
  };

  const handleDeleteClassroom = async (id: string) => {
    await db.deleteJustClassroom(id);
    await loadDataFromDb();
  };
  
  const handleAddStudent = async (student: Omit<Student, 'id' | 'photoUrl' | 'academicYear'>) => {
    const newStudent = await db.addStudent({ ...student, photoUrl: '', academicYear: appSettings.academicYear });
    setStudents(prev => [...prev, newStudent]);
  };
  
  const handleUpdateStudent = async (student: Student) => {
    await db.putStudent(student);
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
  };

  const handleDeleteStudent = async (studentId: string) => {
    await db.deleteStudent(studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setSessions(prev => prev.filter(s => s.studentId !== studentId));
    setSpecialStudents(prev => prev.filter(s => s.studentId !== studentId));
  };

  const handleAddStudentsBatch = async (studentsData: Omit<Student, 'id'| 'photoUrl' | 'classroomId' | 'academicYear'>[]) => {
      const existingNationalIds = new Set(students.map(s => s.nationalId).filter(Boolean));
      const newStudentsData = studentsData.filter(s => s.nationalId && !existingNationalIds.has(s.nationalId));

      if (newStudentsData.length > 0) {
        const studentsToAdd = newStudentsData.map(s => ({
            ...s,
            classroomId: '', // Classroom is not assigned on batch import
            photoUrl: '',
            academicYear: appSettings.academicYear,
        }));
        const addedStudents = await db.addStudents(studentsToAdd);
        setStudents(prev => [...prev, ...addedStudents]);
      }
      alert(`${toPersianDigits(newStudentsData.length)} دانش‌آموز جدید اضافه شد. ${toPersianDigits(studentsData.length - newStudentsData.length)} دانش‌آموز به دلیل کد ملی تکراری نادیده گرفته شد.`);
  };
  
  const handleSaveSession = async (session: Session | Omit<Session, 'id' | 'academicYear'>) => {
      const sessionData = { ...session, academicYear: appSettings.academicYear };
      if ('id' in sessionData) {
          await db.putSession(sessionData);
          setSessions(prev => prev.map(s => s.id === sessionData.id ? sessionData : s));
      } else {
          const newSession = await db.addSession(sessionData);
          setSessions(prev => [...prev, newSession]);
      }
  };

  const handleDeleteSession = async (sessionId: string) => {
      await db.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleAddSessionType = async (name: string) => {
      const order = sessionTypes.length;
      const newType = await db.addSessionType({ name, order });
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

    setStudentGroups(prevGroups => {
        const updatedGroups = JSON.parse(JSON.stringify(prevGroups));

        if (sourceGroupId) {
            const sourceGroup = updatedGroups.find((g: StudentGroup) => g.id === sourceGroupId);
            if (sourceGroup) {
                sourceGroup.studentIds = sourceGroup.studentIds.filter((id: string) => id !== studentId);
            }
        }

        if (destinationGroupId) {
            const destGroup = updatedGroups.find((g: StudentGroup) => g.id === destinationGroupId);
            if (destGroup) {
                if (!destGroup.studentIds.includes(studentId)) {
                    destGroup.studentIds.push(studentId);
                }
            }
        }
        
        db.putStudentGroups(updatedGroups);
        return updatedGroups;
    });
  };
  
  const handleReorderStudentGroups = async (reorderedGroups: StudentGroup[]) => {
    const updatedWithOrder = reorderedGroups.map((g, index) => ({...g, order: index}));
    await db.putStudentGroups(updatedWithOrder);
    setStudentGroups(prev => {
        const updatedMap = new Map(updatedWithOrder.map(g => [g.id, g]));
        const otherGroups = prev.filter(g => !updatedMap.has(g.id));
        return [...otherGroups, ...updatedWithOrder];
    });
  };

  const handleUpdateSpecialStudentInfo = async (info: SpecialStudentInfo) => {
      await db.putSpecialStudentInfo(info);
      setSpecialStudents(prev => {
          const existing = prev.find(s => s.studentId === info.studentId);
          if (existing) {
              return prev.map(s => s.studentId === info.studentId ? info : s);
          }
          return [...prev, info];
      });
  };

  const handleUpdateCounselingNeededInfo = async (info: CounselingNeededInfo) => {
      await db.putCounselingNeededInfo(info);
      setCounselingNeededStudents(prev => {
          const existing = prev.find(s => s.studentId === info.studentId);
          if (existing) {
              return prev.map(s => s.studentId === info.studentId ? info : s);
          }
          return [...prev, info];
      });
  };

  const handleUpdateThinkingObservation = async (observation: ThinkingObservation) => {
    await db.putThinkingObservation(observation);
    setThinkingObservations(prev => {
        const existing = prev.find(s => s.studentId === observation.studentId);
        if (existing) {
            return prev.map(s => s.studentId === observation.studentId ? observation : s);
        }
        return [...prev, observation];
    });
  };

  const handleUpdateThinkingEvaluation = async (evaluation: ThinkingEvaluation) => {
      await db.putThinkingEvaluation(evaluation);
      setThinkingEvaluations(prev => {
          const existing = prev.find(s => s.studentId === evaluation.studentId);
          if (existing) {
              return prev.map(s => s.studentId === evaluation.studentId ? evaluation : s);
          }
// FIX: Corrected a typo where an undefined variable `info` was used instead of `evaluation` when adding a new item to the state.
          return [...prev, evaluation];
      });
  };

  const handleRestore = async (data: BackupData, fromSync = false) => {
    setIsLoading(true);
    
    let studentsToRestore = (data.students || []).filter(s => s && typeof s === 'object').map(s => {
        const { grade, ...rest } = s as any; // Remove grade property if it exists
        return rest;
    });

    if (studentsToRestore.length > 0 && (!data.classrooms || data.classrooms.length === 0)) {
        studentsToRestore = studentsToRestore.map(student => ({
            ...student,
            classroomId: ''
        }));
    }

    const sanitizedClassrooms = (data.classrooms || []).filter(c => c && typeof c === 'object').map(c => {
        const { grade, ...rest } = c as any;
        return rest;
    });

    const targetAcademicYear = data.appSettings?.academicYear || mockAppSettings.academicYear;
    
    // FIX: Safely merge appSettings by checking if it's an object, preventing spread operator errors on non-object types.
    const settingsFromBackup = (data.appSettings && typeof data.appSettings === 'object' && !Array.isArray(data.appSettings)) ? data.appSettings : {};
    const restoredAppSettings = Object.assign({}, mockAppSettings, settingsFromBackup, {
      academicYear: targetAcademicYear
    });
    
    const classroomsWithYear = sanitizedClassrooms
        .filter(c => c && typeof c === 'object')
        .map(c => Object.assign({}, c, { academicYear: targetAcademicYear }) as Classroom);
    
    // FIX: Safely map students, ensuring they are valid objects before processing to avoid spread operator errors.
    const studentsWithYear = studentsToRestore
      .filter(s => s && typeof s === 'object' && !Array.isArray(s))
      .map(s => (Object.assign({}, s, { academicYear: targetAcademicYear }) as Student));
    
    // FIX: Safely map sessions, ensuring they are valid objects before processing to avoid spread operator errors.
    const sessionsWithYear = (data.sessions || [])
        .filter((s): s is Session => !!(s && typeof s === 'object' && !Array.isArray(s) && s.id && s.studentId && s.date && s.typeId))
        .map(s => Object.assign({}, s, { academicYear: targetAcademicYear }));

    await db.clearAllData();
    
    await db.putClassrooms(classroomsWithYear);
    await db.putStudents(studentsWithYear);
    await db.putSessions(sessionsWithYear);
    await db.putSessionTypes(data.sessionTypes || []);
    await db.putStudentGroups(data.studentGroups || []);
    await db.putSpecialStudents(data.specialStudents || []);
    await db.putCounselingNeededStudents(data.counselingNeededStudents || []);
    await db.putThinkingObservations(data.thinkingObservations || []);
    await db.putThinkingEvaluations(data.thinkingEvaluations || []);
    await db.putSetting('workingDays', data.workingDays || mockWorkingDays);
    await db.putSetting('appSettings', restoredAppSettings);

    if (fromSync) {
        const syncTime = new Date();
        await db.putSetting('lastSyncTime', syncTime.toISOString());
    }
    
    try {
        if (restoredAppSettings.appIcon) {
            localStorage.setItem('appIcon', restoredAppSettings.appIcon);
        } else {
            localStorage.removeItem('appIcon');
        }
    } catch (e) {
        console.error('Could not access localStorage during restore.', e);
    }
    
    // FIX: After restoring data to the DB, the React state must be updated.
    // This ensures the UI reflects the restored data without needing a page reload.
    setAppSettings(restoredAppSettings);
    
    await loadDataFromDb(targetAcademicYear);
    setIsLoading(false);
  };
  
  const handleBatchUpdateStudentPhotos = async (updates: { studentId: string, photoUrl: string }[]) => {
      const studentMap = new Map(students.map(s => [s.id, s]));
      const studentsToUpdate = updates.map(update => {
          const student = studentMap.get(update.studentId);
          return student ? { ...student, photoUrl: update.photoUrl } : null;
      }).filter((s): s is Student => s !== null);

      if (studentsToUpdate.length > 0) {
          await db.putStudents(studentsToUpdate);
          setStudents(prev => prev.map(s => {
              const updated = studentsToUpdate.find(u => u.id === s.id);
              return updated || s;
          }));
      }
  };

  const handleBatchUpdateStudentClassrooms = async (updates: { studentId: string; classroomId: string }[]) => {
      const studentMap = new Map(students.map(s => [s.id, s]));
      const studentsToUpdate = updates.map(update => {
          const student = studentMap.get(update.studentId);
          return student ? { ...student, classroomId: update.classroomId } : null;
      }).filter((s): s is Student => s !== null);

      if (studentsToUpdate.length > 0) {
          await db.putStudents(studentsToUpdate);
          setStudents(prev => prev.map(s => {
              const updated = studentsToUpdate.find(u => u.id === s.id);
              return updated || s;
          }));
      }
  };

  const handleBatchUpdateStudentDetails = async (updates: { studentId: string; data: { classroomId?: string } }[]) => {
      const studentMap = new Map(students.map(s => [s.id, s]));
      const studentsToUpdate = updates.map(update => {
          const student = studentMap.get(update.studentId);
          return student ? { ...student, ...update.data } : null;
      }).filter((s): s is Student => s !== null);

      if (studentsToUpdate.length > 0) {
          await db.putStudents(studentsToUpdate);
          setStudents(prev => prev.map(s => {
              const updated = studentsToUpdate.find(u => u.id === s.id);
              return updated || s;
          }));
      }
  };

  const handleBatchCreateClassrooms = async (classroomsToCreate: { name: string }[]): Promise<Classroom[]> => {
    const newClassrooms = classroomsToCreate.map((c, index) => ({
      ...c,
      academicYear: appSettings.academicYear,
      order: classrooms.length + index
    }));
    const createdClassrooms = await db.addMultipleClassrooms(newClassrooms);
    setClassrooms(prev => [...prev, ...createdClassrooms]);
    return createdClassrooms;
  };
  
  const handleNormalizeChars = async () => {
    const updatedStudents = students.map(s => ({
        ...s,
        firstName: normalizePersianChars(s.firstName),
        lastName: normalizePersianChars(s.lastName),
        fatherName: s.fatherName ? normalizePersianChars(s.fatherName) : undefined,
        address: s.address ? normalizePersianChars(s.address) : undefined,
        nationality: s.nationality ? normalizePersianChars(s.nationality) : undefined,
    }));
    await db.putStudents(updatedStudents);
    setStudents(updatedStudents);

    const updatedClassrooms = classrooms.map(c => ({...c, name: normalizePersianChars(c.name)}));
    await db.putClassrooms(updatedClassrooms);
    setClassrooms(updatedClassrooms);
    
    const updatedSessions = sessions.map(s => ({
        ...s,
        notes: s.notes ? normalizePersianChars(s.notes) : undefined,
        actionItems: s.actionItems ? normalizePersianChars(s.actionItems) : undefined,
    }));
    await db.putSessions(updatedSessions);
    setSessions(updatedSessions);

    const updatedSessionTypes = sessionTypes.map(st => ({...st, name: normalizePersianChars(st.name)}));
    await db.putSessionTypes(updatedSessionTypes);
    setSessionTypes(updatedSessionTypes);
  };
  
  const handlePrependZero = async () => {
      const updatedStudents = students.map(s => {
          let needsUpdate = false;
          const newStudent = { ...s };

          if (s.nationalId && s.nationalId.length === 9 && /^\d+$/.test(s.nationalId)) {
              newStudent.nationalId = '0' + s.nationalId;
              needsUpdate = true;
          }
          if (s.mobile && s.mobile.length === 10 && /^\d+$/.test(s.mobile) && s.mobile.startsWith('9')) {
              newStudent.mobile = '0' + s.mobile;
              needsUpdate = true;
          }
          return needsUpdate ? newStudent : s;
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
      await setAppSettingsHandler((prev: AppSettings) => ({ ...prev, moreMenuOrder: reorderedMenu }));
  };

  const handleFactoryReset = async () => {
      setIsLoading(true);
      try {
        localStorage.removeItem('appIcon');
      } catch(e) { console.error('Could not access localStorage during factory reset.', e); }
      await db.clearAllData();
      await seedInitialData();
      await loadDataFromDb();
      setIsLoading(false);
  };

  // Supabase functions
    const supabaseLogin = async (email: string, password: string) => {
        if (!supabase) return { error: { message: "Supabase connection is not active." } };
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError && (signInError.message.includes('Invalid login credentials') || signInError.message.includes('User not found'))) {
             const { error: signUpError } = await supabase.auth.signUp({ email, password });
             return { error: signUpError };
        }
        return { error: signInError };
    };
    const supabaseResendConfirmation = async (email: string) => {
        if (!supabase) return { error: { message: "Supabase connection is not active." } };
        const { error } = await supabase.auth.resend({ type: 'signup', email });
        return { error };
    };
    const supabaseLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
    };
    const syncToCloud = async () => {
        if (!supabase || !supabaseUser) {
            setSyncStatus({ active: true, progress: 100, message: "خطا: لطفا ابتدا به حساب کاربری خود وارد شوید." });
            setTimeout(() => setSyncStatus({ active: false, progress: 0, message: '' }), 4000);
            return;
        }
        setSyncStatus({ active: true, progress: 0, message: 'شروع همگام‌سازی...' });
        try {
            await new Promise(res => setTimeout(res, 200));
            setSyncStatus(prev => ({ ...prev, progress: 10, message: "جمع‌آوری اطلاعات برنامه (شامل عکس‌ها)..."}));
            const backupData = { classrooms, students, sessions, sessionTypes, studentGroups, workingDays, appSettings, specialStudents, counselingNeededStudents, thinkingObservations, thinkingEvaluations };
            setSyncStatus(prev => ({ ...prev, progress: 50, message: "در حال ارسال به فضای ابری..."}));
            const { error } = await supabase.from('profiles').update({ app_data: backupData }).eq('id', supabaseUser.id);
            if (error) throw error;
            setSyncStatus(prev => ({ ...prev, progress: 90, message: "ذخیره زمان همگام‌سازی..."}));
            const syncTime = new Date();
            await db.putSetting('lastSyncTime', syncTime.toISOString());
            setLastSyncTime(syncTime);
            setSyncStatus({ active: true, progress: 100, message: "همگام‌سازی با موفقیت انجام شد."});
            setTimeout(() => setSyncStatus({ active: false, progress: 0, message: '' }), 2000);
        } catch (error: unknown) {
            console.error("Sync to cloud error:", error);
            const errorMessage = getErrorMessage(error);
            setSyncStatus({ active: true, progress: 100, message: `خطا در همگام‌سازی: ${errorMessage}` });
            setTimeout(() => setSyncStatus({ active: false, progress: 0, message: '' }), 5000);
        }
    };
    const syncFromCloud = async () => {
        if (!supabase || !supabaseUser) {
            alert("لطفا ابتدا به حساب کاربری خود وارد شوید.");
            return;
        }
        setSyncStatus({ active: true, progress: 0, message: 'در حال دریافت اطلاعات از فضای ابری...' });
        try {
            const { data, error } = await supabase.from('profiles').select('app_data').eq('id', supabaseUser.id).single();
            if (error) throw error;
            if (!data || !data.app_data) {
                alert("هیچ اطلاعاتی در فضای ابری برای بازیابی یافت نشد.");
                setSyncStatus({ active: false, progress: 0, message: '' });
                return;
            }
            setSyncStatus(prev => ({ ...prev, progress: 50, message: 'در حال بازگردانی اطلاعات...' }));
            const backupData = data.app_data as BackupData;
            await handleRestore(backupData, true);
            setSyncStatus({ active: true, progress: 100, message: 'اطلاعات با موفقیت دریافت شد.' });
            alert("اطلاعات با موفقیت از فضای ابری دریافت و جایگزین شد.");
        } catch (error: unknown) {
            console.error("Sync from cloud error:", error);
            const errorMessage = getErrorMessage(error);
            setSyncStatus({ active: true, progress: 100, message: `خطا در دریافت اطلاعات: ${errorMessage}` });
            alert(`خطا در دریافت اطلاعات: ${errorMessage}`);
        } finally {
            setTimeout(() => setSyncStatus({ active: false, progress: 0, message: '' }), 2000);
        }
    };

  const contextValue: AppContextType = {
    classrooms,
    students,
    sessions,
    sessionTypes,
    studentGroups,
    workingDays,
    appSettings,
    specialStudents,
    counselingNeededStudents,
    thinkingObservations,
    thinkingEvaluations,
    setAppSettings: setAppSettingsHandler,
    setWorkingDays: setWorkingDaysHandler,
    handleAddClassroom,
    handleUpdateClassroom,
    handleDeleteClassroom,
    handleAddStudent,
    handleUpdateStudent,
    handleDeleteStudent,
    handleAddStudentsBatch,
    handleSaveSession,
    handleDeleteSession,
    handleAddSessionType,
    handleUpdateSessionType,
    handleDeleteSessionType,
    handleSaveGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleMoveStudentToGroup,
    handleReorderStudentGroups,
    handleUpdateSpecialStudentInfo,
    handleUpdateCounselingNeededInfo,
    handleUpdateThinkingObservation,
    handleUpdateThinkingEvaluation,
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
    isArchiveUnlocked,
    setIsArchiveUnlocked,
    isLoading,
    calendarTargetDate,
    setCalendarTargetDate,
    supabaseUser,
    supabaseLogin,
    supabaseResendConfirmation,
    supabaseLogout,
    syncToCloud,
    syncFromCloud,
    syncStatus,
    lastSyncTime,
  };

  return (
    <AppContext.Provider value={contextValue}>
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