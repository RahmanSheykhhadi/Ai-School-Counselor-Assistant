import type { PropsWithChildren, Dispatch, SetStateAction } from 'react';

export type View = 'dashboard' | 'students' | 'student-list' | 'student-detail' | 'calendar' | 'reports' | 'settings' | 'all-sessions' | 'more' | 'grade-nine-quorum' | 'upcoming-sessions' | 'special-students' | 'counseling-needed-students' | 'manual-assign' | 'thinking-lifestyle' | 'classroom-manager' | 'help';

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

export interface StudentGroup {
  id: string;
  name: string;
  classroomId: string;
  studentIds: string[];
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
  notificationsEnabled: boolean;
  fontSize: string;
  sidaBaseUrl: string;
  passwordProtectionEnabled: boolean;
  sessionPasswordHash: string | null;
  supabaseUrl: string;
  supabaseAnonKey: string;
  moreMenuOrder?: View[];
  thinkingClassroomIds?: string[];
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

export interface ThinkingObservation {
  studentId: string;
  // Key is question index (0-19), value is score (1-5)
  scores: Record<number, number>; 
}

export interface ThinkingEvaluation {
  studentId: string;
  activityScore?: number;
  projectScore?: number;
  examScore?: number;
}

export type BackupData = {
  classrooms: Classroom[];
  students: Student[];
  sessions: Session[];
  sessionTypes: SessionType[];
  studentGroups: StudentGroup[];
  workingDays: WorkingDays;
  appSettings: AppSettings;
  specialStudents: SpecialStudentInfo[];
  counselingNeededStudents: CounselingNeededInfo[];
  thinkingObservations?: ThinkingObservation[];
  thinkingEvaluations?: ThinkingEvaluation[];
};

export interface AppContextType {
  classrooms: Classroom[];
  students: Student[];
  sessions: Session[];
  sessionTypes: SessionType[];
  studentGroups: StudentGroup[];
  workingDays: WorkingDays;
  appSettings: AppSettings;
  specialStudents: SpecialStudentInfo[];
  counselingNeededStudents: CounselingNeededInfo[];
  thinkingObservations: ThinkingObservation[];
  thinkingEvaluations: ThinkingEvaluation[];
  setAppSettings: (updaterOrValue: AppSettings | ((prev: AppSettings) => AppSettings)) => Promise<void>;
  setWorkingDays: (updaterOrValue: WorkingDays | ((prev: WorkingDays) => WorkingDays)) => Promise<void>;
  handleAddClassroom: (name: string) => Promise<void>;
  handleUpdateClassroom: (classroom: Classroom) => Promise<void>;
  handleDeleteClassroom: (id: string) => Promise<void>;
  handleAddStudent: (student: Omit<Student, 'id' | 'photoUrl' | 'academicYear'>) => Promise<void>;
  handleUpdateStudent: (student: Student) => Promise<void>;
  handleDeleteStudent: (studentId: string) => Promise<void>;
  handleAddStudentsBatch: (studentsData: Omit<Student, 'id'| 'photoUrl' | 'classroomId' | 'academicYear'>[]) => Promise<void>;
  handleSaveSession: (session: Session | Omit<Session, 'id' | 'academicYear'>) => Promise<void>;
  handleDeleteSession: (sessionId: string) => Promise<void>;
  handleAddSessionType: (name: string) => Promise<void>;
  handleUpdateSessionType: (sessionType: SessionType) => Promise<void>;
  handleDeleteSessionType: (id: string) => Promise<void>;
  handleSaveGroup: (group: Omit<StudentGroup, 'id'>) => Promise<void>;
  handleDeleteGroup: (groupId: string) => Promise<void>;
  handleUpdateSpecialStudentInfo: (info: SpecialStudentInfo) => Promise<void>;
  handleUpdateCounselingNeededInfo: (info: CounselingNeededInfo) => Promise<void>;
  handleUpdateThinkingObservation: (observation: ThinkingObservation) => Promise<void>;
  handleUpdateThinkingEvaluation: (evaluation: ThinkingEvaluation) => Promise<void>;
  handleRestore: (data: BackupData, fromSync?: boolean) => Promise<void>;
  handleBatchUpdateStudentPhotos: (updates: { studentId: string; photoUrl: string }[]) => Promise<void>;
  handleBatchUpdateStudentClassrooms: (updates: { studentId: string; classroomId: string }[]) => Promise<void>;
  handleBatchUpdateStudentDetails: (updates: { studentId: string; data: { classroomId?: string } }[]) => Promise<void>;
  handleBatchCreateClassrooms: (classroomsToCreate: { name: string }[]) => Promise<Classroom[]>;
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