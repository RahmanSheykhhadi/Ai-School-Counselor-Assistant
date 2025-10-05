import type { Classroom } from '../types';
import type { Student } from '../types';
import type { Session } from '../types';
import type { SessionType } from '../types';
import type { WorkingDays } from '../types';
import type { AppSettings } from '../types';

const currentAcademicYear = '1403-1404';

export const mockClassrooms: Classroom[] = [
    { id: 'c1', name: 'دهم تجربی', academicYear: currentAcademicYear },
    { id: 'c2', name: 'یازدهم ریاضی', academicYear: currentAcademicYear },
    { id: 'c3', name: 'دوازدهم انسانی', academicYear: currentAcademicYear },
];

export const mockStudents: Student[] = [
    { id: 's1', firstName: 'علی', lastName: 'رضایی', classroomId: 'c1', photoUrl: '', nationalId: '1234567890', fatherName: 'محمد', academicYear: currentAcademicYear },
    { id: 's2', firstName: 'مریم', lastName: 'محمدی', classroomId: 'c1', photoUrl: '', nationalId: '0987654321', fatherName: 'حسین', academicYear: currentAcademicYear },
    { id: 's3', firstName: 'حسین', lastName: 'احمدی', classroomId: 'c2', photoUrl: '', nationalId: '1122334455', fatherName: 'عباس', academicYear: currentAcademicYear },
    { id: 's4', firstName: 'فاطمه', lastName: 'کریمی', classroomId: 'c3', photoUrl: '', nationalId: '5566778899', fatherName: 'علی', academicYear: currentAcademicYear },
];

export const mockSessionTypes: SessionType[] = [
    { id: 'st1', name: 'مشاوره تحصیلی' },
    { id: 'st2', name: 'مشاوره فردی' },
    { id: 'st3', name: 'مشاوره خانواده' },
];

export const mockSessions: Session[] = [
    { id: 'sess1', studentId: 's1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), typeId: 'st1', notes: 'صحبت در مورد روش‌های مطالعه', actionItems: 'برنامه‌ریزی هفتگی انجام شود.', academicYear: currentAcademicYear },
    { id: 'sess2', studentId: 's2', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), typeId: 'st2', notes: 'بررسی مسائل مربوط به استرس امتحان', academicYear: currentAcademicYear },
];

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
    counselorName: 'فلانی',
    notificationsEnabled: true,
    fontSize: '16',
    sidaBaseUrl: 'https://sida.medu.ir/ImageStudent/25/2537/95096250/',
    passwordProtectionEnabled: false,
    sessionPasswordHash: null,
    supabaseUrl: '',
    supabaseAnonKey: '',
    moreMenuOrder: ['special-students', 'counseling-needed-students', 'grade-nine-quorum', 'reports', 'settings'],
};