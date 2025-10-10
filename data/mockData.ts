import type { Classroom } from '../types';
import type { Student } from '../types';
import type { Session } from '../types';
import type { SessionType } from '../types';
import type { WorkingDays } from '../types';
import type { AppSettings } from '../types';
import moment from 'jalali-moment';

const currentJalaliYear = moment().jYear();
const currentAcademicYear = `${currentJalaliYear}-${currentJalaliYear + 1}`;

export const mockClassrooms: Classroom[] = [];

export const mockStudents: Student[] = [];

export const mockSessionTypes: SessionType[] = [
    { id: 'st1', name: 'مشاوره تحصیلی' },
    { id: 'st2', name: 'مشاوره فردی' },
    { id: 'st3', name: 'مشاوره خانواده' },
];

export const mockSessions: Session[] = [];

export const mockWorkingDays: WorkingDays = {
    saturday: true,
    sunday: true,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: false,
    friday: false,
};

export const mockAppSettings: AppSettings = {
    academicYear: currentAcademicYear,
    notificationsEnabled: true,
    fontSize: '16',
    sidaBaseUrl: 'https://sida.medu.ir/ImageStudent/25/2537/95096250/',
    passwordProtectionEnabled: false,
    sessionPasswordHash: null,
    supabaseUrl: '',
    supabaseAnonKey: '',
    moreMenuOrder: ['special-students', 'counseling-needed-students', 'thinking-lifestyle', 'grade-nine-quorum', 'reports', 'settings', 'help'],
    thinkingClassroomIds: [],
    appIcon: '',
    geminiApiKey: '',
    hasAcceptedDisclaimer: false,
};