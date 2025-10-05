import { openDB, DBSchema } from 'idb';
import type { Classroom, Student, Session, SessionType, WorkingDays, AppSettings, SpecialStudentInfo, CounselingNeededInfo } from '../types';
import { mockAppSettings } from '../data/mockData';

const DB_NAME = 'CounselorAppDB';
const DB_VERSION = 4;

interface MyDB extends DBSchema {
  classrooms: {
    key: string;
    value: Classroom;
    indexes: { name: string, academicYear: string };
  };
  students: {
    key: string;
    value: Student;
    indexes: { classroomId: string, lastName: string, nationalId: string, academicYear: string };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: { studentId: string, date: string, academicYear: string };
  };
  sessionTypes: {
    key: string;
    value: SessionType;
  };
  specialStudents: {
    key: string; // studentId
    value: SpecialStudentInfo;
  };
  counselingNeededStudents: {
    key: string; // studentId
    value: CounselingNeededInfo;
  };
  // Key-value store for single objects
  settings: {
    key: string;
    value: any;
  };
}

const dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
  upgrade: async (db, oldVersion, newVersion, transaction) => {
    if (oldVersion < 1) {
      const classroomStore = db.createObjectStore('classrooms', { keyPath: 'id' });
      classroomStore.createIndex('name', 'name');

      const studentStore = db.createObjectStore('students', { keyPath: 'id' });
      studentStore.createIndex('classroomId', 'classroomId');
      studentStore.createIndex('lastName', 'lastName');
      studentStore.createIndex('nationalId', 'nationalId', { unique: true });

      const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
      sessionStore.createIndex('studentId', 'studentId');
      sessionStore.createIndex('date', 'date');
      
      db.createObjectStore('sessionTypes', { keyPath: 'id' });
      db.createObjectStore('settings');
    }
    if (oldVersion < 2) {
        console.log('Upgrading DB to version 2...');
        // Need to get current academic year to backfill old data
        const settingsStore = transaction.objectStore('settings');
        const appSettings = await settingsStore.get('appSettings');
        const currentYear = appSettings?.academicYear || mockAppSettings.academicYear;

        const storesToUpdate: ('classrooms' | 'students' | 'sessions')[] = ['classrooms', 'students', 'sessions'];

        for (const storeName of storesToUpdate) {
            const store = transaction.objectStore(storeName);
            store.createIndex('academicYear', 'academicYear');
            
            let cursor = await store.openCursor();
            while (cursor) {
                const value = { ...cursor.value, academicYear: currentYear };
                await cursor.update(value);
                cursor = await cursor.continue();
            }
        }
        console.log('DB upgrade to version 2 complete.');
    }
    if (oldVersion < 3) {
        console.log('Upgrading DB to version 3...');
        db.createObjectStore('specialStudents', { keyPath: 'studentId' });
        console.log('DB upgrade to version 3 complete.');
    }
    if (oldVersion < 4) {
        console.log('Upgrading DB to version 4...');
        db.createObjectStore('counselingNeededStudents', { keyPath: 'studentId' });
        console.log('DB upgrade to version 4 complete.');
    }
  },
});

// Generic CRUD Operations
export const getAll = async <T extends keyof MyDB>(storeName: T): Promise<MyDB[T]['value'][]> => {
  return (await dbPromise).getAll(storeName);
};

// FIX: Constrain the generic type T to only include object stores that have indexes.
export const getAllFromIndex = async <T extends 'classrooms' | 'students' | 'sessions'>(storeName: T, indexName: keyof MyDB[T]['indexes'], query: IDBValidKey | IDBKeyRange): Promise<MyDB[T]['value'][]> => {
    return (await dbPromise).getAllFromIndex(storeName as string, indexName as string, query);
}

export const getCount = async <T extends keyof MyDB>(storeName: T): Promise<number> => {
    return (await dbPromise).count(storeName);
};

// Settings Specific
// FIX: Add 'lastSyncTime' to the allowed keys for settings.
export const getSetting = async (key: 'appSettings' | 'workingDays' | 'lastSyncTime') => {
    return (await dbPromise).get('settings', key);
};
// FIX: Add 'lastSyncTime' to the allowed keys for settings.
export const putSetting = async (key: 'appSettings' | 'workingDays' | 'lastSyncTime', value: any) => {
    return (await dbPromise).put('settings', value, key);
};


// Classroom Operations
export const addClassroom = async (classroom: Omit<Classroom, 'id'>): Promise<Classroom> => {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  const newClassroom = { ...classroom, id };
  await db.add('classrooms', newClassroom);
  return newClassroom;
};
export const addClassrooms = async (classrooms: Classroom[]) => {
    const db = await dbPromise;
    const tx = db.transaction('classrooms', 'readwrite');
    await Promise.all(classrooms.map(c => tx.store.put(c)));
    await tx.done;
};
export const putClassroom = async (classroom: Classroom) => (await dbPromise).put('classrooms', classroom);
export const putClassrooms = async (classrooms: Classroom[]) => {
    const db = await dbPromise;
    const tx = db.transaction('classrooms', 'readwrite');
    await Promise.all(classrooms.map(c => tx.store.put(c)));
    await tx.done;
};
export const deleteClassroom = async (id: string) => {
    const db = await dbPromise;
    const tx = db.transaction(['classrooms', 'students', 'sessions', 'specialStudents', 'counselingNeededStudents'], 'readwrite');
    
    // Get all students in the classroom
    const studentsInClass = await tx.objectStore('students').index('classroomId').getAll(id);
    const studentIds = studentsInClass.map(s => s.id);

    // Delete sessions for those students
    const sessionStore = tx.objectStore('sessions');
    const studentSessionsPromises = studentIds.map(studentId => 
        sessionStore.index('studentId').getAll(studentId).then(sessionsToDelete => 
            Promise.all(sessionsToDelete.map(s => sessionStore.delete(s.id)))
        )
    );
    await Promise.all(studentSessionsPromises);
    
    // Delete special student info for those students
    const specialStudentStore = tx.objectStore('specialStudents');
    await Promise.all(studentIds.map(studentId => specialStudentStore.delete(studentId)));
    
    // Delete counseling needed info for those students
    const counselingNeededStore = tx.objectStore('counselingNeededStudents');
    await Promise.all(studentIds.map(studentId => counselingNeededStore.delete(studentId)));


    // Delete students
    const studentStore = tx.objectStore('students');
    await Promise.all(studentIds.map(studentId => studentStore.delete(studentId)));

    // Delete classroom
    await tx.objectStore('classrooms').delete(id);
    
    await tx.done;
};


// Student Operations
export const addStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  const newStudent = { ...student, id };
  await db.add('students', newStudent);
  return newStudent;
};
export const addStudents = async (students: Omit<Student, 'id'>[]): Promise<Student[]> => {
    const db = await dbPromise;
    const tx = db.transaction('students', 'readwrite');
    const addedStudents: Student[] = [];
    await Promise.all(students.map(async (s) => {
        const id = crypto.randomUUID();
        const newStudent = { ...s, id };
        await tx.store.add(newStudent);
        addedStudents.push(newStudent);
    }));
    await tx.done;
    return addedStudents;
};
export const putStudent = async (student: Student) => (await dbPromise).put('students', student);
export const putStudents = async (students: Student[]) => {
    const db = await dbPromise;
    const tx = db.transaction('students', 'readwrite');
    await Promise.all(students.map(s => tx.store.put(s)));
    await tx.done;
};
export const deleteStudent = async (id: string) => {
    const db = await dbPromise;
    const tx = db.transaction(['students', 'sessions', 'specialStudents', 'counselingNeededStudents'], 'readwrite');
    
    // Delete sessions for the student
    const sessionStore = tx.objectStore('sessions');
    const sessionsToDelete = await sessionStore.index('studentId').getAll(id);
    await Promise.all(sessionsToDelete.map(s => sessionStore.delete(s.id)));
    
    // Delete special student info
    await tx.objectStore('specialStudents').delete(id);

    // Delete counseling needed info
    await tx.objectStore('counselingNeededStudents').delete(id);

    // Delete the student
    await tx.objectStore('students').delete(id);

    await tx.done;
};

// Session Operations
export const addSession = async (session: Omit<Session, 'id'>): Promise<Session> => {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  const newSession = { ...session, id };
  await db.add('sessions', newSession);
  return newSession;
};
export const addSessions = async (sessions: Session[]) => {
    const db = await dbPromise;
    const tx = db.transaction('sessions', 'readwrite');
    await Promise.all(sessions.map(s => tx.store.put(s)));
    await tx.done;
};
export const putSession = async (session: Session) => (await dbPromise).put('sessions', session);
export const putSessions = async (sessions: Session[]) => {
    const db = await dbPromise;
    const tx = db.transaction('sessions', 'readwrite');
    await Promise.all(sessions.map(s => tx.store.put(s)));
    await tx.done;
};
export const deleteSession = async (id: string) => (await dbPromise).delete('sessions', id);


// SessionType Operations
export const addSessionType = async (sessionType: Omit<SessionType, 'id'>): Promise<SessionType> => {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  const newSessionType = { ...sessionType, id };
  await db.add('sessionTypes', newSessionType);
  return newSessionType;
};

export const putSessionType = async (sessionType: SessionType) => (await dbPromise).put('sessionTypes', sessionType);
export const putSessionTypes = async (sessionTypes: SessionType[]) => {
    const db = await dbPromise;
    const tx = db.transaction('sessionTypes', 'readwrite');
    await Promise.all(sessionTypes.map(st => tx.store.put(st)));
    await tx.done;
};

export const deleteSessionType = async (id: string) => (await dbPromise).delete('sessionTypes', id);

export const addSessionTypes = async (sessionTypes: SessionType[]) => {
    const db = await dbPromise;
    const tx = db.transaction('sessionTypes', 'readwrite');
    // Using .put() is more robust for seeding data, as it won't throw an
    // error if the record already exists. This prevents startup crashes.
    await Promise.all(sessionTypes.map(st => tx.store.put(st)));
    await tx.done;
};

// SpecialStudent Operations
export const putSpecialStudentInfo = async (info: SpecialStudentInfo) => (await dbPromise).put('specialStudents', info);
export const putSpecialStudents = async (infos: SpecialStudentInfo[]) => {
    const db = await dbPromise;
    const tx = db.transaction('specialStudents', 'readwrite');
    await Promise.all(infos.map(info => tx.store.put(info)));
    await tx.done;
};

// CounselingNeeded Operations
export const putCounselingNeededInfo = async (info: CounselingNeededInfo) => (await dbPromise).put('counselingNeededStudents', info);
export const putCounselingNeededStudents = async (infos: CounselingNeededInfo[]) => {
    const db = await dbPromise;
    const tx = db.transaction('counselingNeededStudents', 'readwrite');
    await Promise.all(infos.map(info => tx.store.put(info)));
    await tx.done;
};


// Full Data Management
export const clearAllData = async () => {
    const db = await dbPromise;
    const stores: (keyof MyDB)[] = ['classrooms', 'students', 'sessions', 'sessionTypes', 'settings', 'specialStudents', 'counselingNeededStudents'];
    const tx = db.transaction(stores, 'readwrite');
    await Promise.all(stores.map(storeName => tx.objectStore(storeName).clear()));
    await tx.done;
};