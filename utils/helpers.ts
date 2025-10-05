import type { Classroom } from '../types';

export const toPersianDigits = (n: number | string): string => {
  if (n === null || n === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/[0-9]/g, (d: string) => persianDigits[parseInt(d)]);
};

/**
 * Normalizes common Arabic characters to their Persian equivalents.
 * @param text The string to normalize.
 * @returns The normalized string with Persian characters.
 */
export const normalizePersianChars = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  // Replace Arabic kaf with Persian kaf, and Arabic yeh with Persian yeh
  return text.replace(/ك/g, 'ک').replace(/ي/g, 'ی');
};

/**
 * Sorts classrooms based on a predefined grade order.
 * @param classrooms The array of classrooms to sort.
 * @returns A new array of sorted classrooms.
 */
export const sortClassrooms = (classrooms: Classroom[]): Classroom[] => {
  const gradeOrder = ['هفتم', 'هشتم', 'نهم', 'دهم', 'یازدهم', 'دوازدهم'];

  const getGradeOrderIndex = (name: string): number => {
    for (let i = 0; i < gradeOrder.length; i++) {
      const regex = new RegExp(`\\b${gradeOrder[i]}\\b`);
      if (regex.test(name)) {
        return i;
      }
    }
    return gradeOrder.length; // Fallback for names without a grade
  };

  return [...classrooms].sort((a, b) => {
    const orderA = getGradeOrderIndex(a.name);
    const orderB = getGradeOrderIndex(b.name);

    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // If grade is the same or not found, sort by full name
    return a.name.localeCompare(b.name, 'fa');
  });
};


// --- Password Hashing Utilities using browser's native Crypto API ---

/**
 * Hashes a password using SHA-256.
 * @param password The plain-text password to hash.
 * @returns A Promise that resolves to the hex-encoded hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verifies a password against a stored hash.
 * @param password The plain-text password to verify.
 * @param storedHash The hex-encoded hash string from storage.
 * @returns A Promise that resolves to `true` if the password is correct, `false` otherwise.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === storedHash;
}