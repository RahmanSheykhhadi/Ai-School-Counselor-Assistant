import type { PropsWithChildren, Dispatch, SetStateAction } from 'react';

export type View = 'dashboard' | 'classrooms' | 'student-list' | 'student-detail' | 'calendar' | 'reports' | 'settings' | 'all-sessions' | 'more' | 'grade-nine-quorum' | 'upcoming-sessions' | 'special-students' | 'counseling-needed-students';

export interface Classroom {
  id: string;
  name: string;
  order?: number;
  academicYear: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  classroomId: string;
  photoUrl: string;
  nationalId?: string;
  address?: string;
  mobile?: string;
  nationality?: string;
  birthDate?: string;
  grade?: string;
  academicYear: string;
}

export interface Session {
  id: string;
  studentId: string;
  date: string; // ISO string
  typeId: string;
  notes?: string;
  actionItems?: string;
  academicYear: string;
}

export interface SessionType {
  id: string;
  name: string;
  order?: number;
}

export interface WorkingDays {
  saturday: boolean;
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
}

export interface AppSettings {
  academicYear: string;
  counselorName: string;
  notificationsEnabled: boolean;
  fontSize: string;
  sidaBaseUrl: string;
  passwordProtectionEnabled: boolean;
  sessionPasswordHash: string | null;
  supabaseUrl: string;
  supabaseAnonKey: string;
  moreMenuOrder?: View[];
}

export interface SpecialStudentInfo {
  studentId: string;
  hasPhysicalProblem?: boolean;
  hasMentalProblem?: boolean;
  isDivorcedParents?: boolean;
  isNeglected?: boolean;
  isUnderCare?: boolean;
  hasDeceasedParent?: boolean;
  hasSeverePoverty?: boolean;
  isOther?: boolean;
  notes?: string;
}

export interface CounselingNeededInfo {
  studentId: string;
  notes?: string;
}

export type BackupData = {
  classrooms: Classroom[];
  students: Student[];
  sessions: Session[];
  sessionTypes: SessionType[];
  workingDays: WorkingDays;
  appSettings: AppSettings;
  specialStudents: SpecialStudentInfo[];
  counselingNeededStudents: CounselingNeededInfo[];
};

export interface AppContextType {
  classrooms: Classroom[];
  students: Student[];
  sessions: Session[];
  sessionTypes: SessionType[];
  workingDays: WorkingDays;
  appSettings: AppSettings;
  specialStudents: SpecialStudentInfo[];
  counselingNeededStudents: CounselingNeededInfo[];
  setAppSettings: (updaterOrValue: AppSettings | ((prev: AppSettings) => AppSettings)) => Promise<void>;
  setWorkingDays: (updaterOrValue: WorkingDays | ((prev: WorkingDays) => WorkingDays)) => Promise<void>;
  handleAddClassroom: (name: string) => Promise<void>;
  handleUpdateClassroom: (classroom: Classroom) => Promise<void>;
  handleDeleteClassroom: (id: string) => Promise<void>;
  handleAddStudent: (student: Omit<Student, 'id' | 'photoUrl' | 'classroomId' | 'academicYear'>, classroomId: string) => Promise<void>;
  handleUpdateStudent: (student: Student) => Promise<void>;
  handleDeleteStudent: (studentId: string) => Promise<void>;
  handleAddStudentsBatch: (studentsData: Omit<Student, 'id'| 'photoUrl' | 'classroomId' | 'academicYear'>[], classroomId: string) => Promise<void>;
  handleSaveSession: (session: Session | Omit<Session, 'id' | 'academicYear'>) => Promise<void>;
  handleDeleteSession: (sessionId: string) => Promise<void>;
  handleAddSessionType: (name: string) => Promise<void>;
  handleUpdateSessionType: (sessionType: SessionType) => Promise<void>;
  handleDeleteSessionType: (id: string) => Promise<void>;
  handleUpdateSpecialStudentInfo: (info: SpecialStudentInfo) => Promise<void>;
  handleUpdateCounselingNeededInfo: (info: CounselingNeededInfo) => Promise<void>;
  handleRestore: (data: BackupData, fromSync?: boolean) => Promise<void>;
  handleBatchUpdateStudentPhotos: (updates: { studentId: string; photoUrl: string }[]) => Promise<void>;
  handleNormalizeChars: () => Promise<void>;
  handlePrependZero: () => Promise<void>;
  handleReorderClassrooms: (reorderedClassrooms: Classroom[]) => Promise<void>;
  handleReorderSessionTypes: (reorderedSessionTypes: SessionType[]) => Promise<void>;
  handleReorderMoreMenu: (reorderedMenu: View[]) => Promise<void>;
  handleFactoryReset: () => Promise<void>;
  isArchiveUnlocked: boolean;
  setIsArchiveUnlocked: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  calendarTargetDate: Date | null;
  setCalendarTargetDate: Dispatch<SetStateAction<Date | null>>;
  // Supabase related
  supabaseUser: any;
  supabaseLogin: (email: string, password: string) => Promise<{ error: any }>;
  supabaseResendConfirmation: (email: string) => Promise<{ error: any }>;
  supabaseLogout: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  syncStatus: {
    active: boolean;
    progress: number;
    message: string;
  };
  lastSyncTime: Date | null;
}