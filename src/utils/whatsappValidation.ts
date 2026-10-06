import { collection, getDocs } from 'firebase/firestore';
import { db, FirestoreRegistrationDoc } from '../firebase';
import { INITIAL_MANAGED_STUDENTS } from '../components/admin/studentData';

/**
 * Filter text to only allow numeric digits (0-9).
 * Removes any letters, punctuation, whitespace, and special characters.
 */
export function cleanNumericOnly(value: string): string {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '');
}

/**
 * Normalize an Indonesian mobile/WhatsApp phone number into a standard '08...' format.
 * Examples:
 * - '628123456789' -> '08123456789'
 * - '+628123456789' -> '08123456789'
 * - '08123456789' -> '08123456789'
 * - '8123456789' -> '08123456789'
 */
export function normalizeIndonesianPhone(phone: string): string {
  if (!phone) return '';
  let digits = cleanNumericOnly(phone);
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('8')) {
    digits = '0' + digits;
  }
  return digits;
}

/**
 * Compares two phone numbers to verify if they refer to the same WhatsApp number.
 */
export function isSamePhoneNumber(phoneA: string, phoneB: string): boolean {
  const normA = normalizeIndonesianPhone(phoneA);
  const normB = normalizeIndonesianPhone(phoneB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  // If one ends with the other (with at least 9 significant digits)
  if (normA.length >= 9 && normB.length >= 9) {
    if (normA.endsWith(normB) || normB.endsWith(normA)) {
      return true;
    }
  }
  return false;
}

/**
 * Validates the format of an Indonesian WhatsApp number.
 */
export function validateIndonesianWhatsappFormat(phone: string): {
  isValid: boolean;
  error?: string;
} {
  const digits = cleanNumericOnly(phone);

  if (!digits) {
    return { isValid: false, error: 'Nomor WhatsApp wajib diisi.' };
  }

  // Indonesian WhatsApp numbers usually start with 08 or 628
  const normalized = normalizeIndonesianPhone(phone);
  if (!normalized.startsWith('08')) {
    return {
      isValid: false,
      error: 'Nomor WhatsApp tidak valid. Format harus diawali 08 (contoh: 081234567890).',
    };
  }

  if (digits.length < 10) {
    return {
      isValid: false,
      error: `Nomor WhatsApp terlalu pendek (${digits.length} digit). Minimal 10 digit angka.`,
    };
  }

  if (digits.length > 15) {
    return {
      isValid: false,
      error: `Nomor WhatsApp terlalu panjang (${digits.length} digit). Maksimal 15 digit angka.`,
    };
  }

  return { isValid: true };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  studentName?: string;
  studentId?: string;
  source?: 'database' | 'system';
}

/**
 * Checks whether a given WhatsApp number is already registered in:
 * 1. Firestore 'registrations' collection (live registered students)
 * 2. Pre-configured / initial managed students
 */
export async function checkStudentWhatsappDuplicate(
  phone: string
): Promise<DuplicateCheckResult> {
  const normalizedInput = normalizeIndonesianPhone(phone);
  if (!normalizedInput || normalizedInput.length < 9) {
    return { isDuplicate: false };
  }

  // 1. Check in Firestore registrations collection
  try {
    const regCol = collection(db, 'registrations');
    const snapshot = await getDocs(regCol);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as FirestoreRegistrationDoc;
      if (data.whatsapp && isSamePhoneNumber(data.whatsapp, normalizedInput)) {
        return {
          isDuplicate: true,
          studentName: data.studentName || 'Siswa Terdaftar',
          studentId: data.studentId || docSnap.id,
          source: 'database',
        };
      }
    }
  } catch (error) {
    console.warn('Could not query Firestore registrations for WhatsApp check:', error);
  }

  // 2. Check in initial managed students
  for (const student of INITIAL_MANAGED_STUDENTS) {
    if (student.whatsapp && isSamePhoneNumber(student.whatsapp, normalizedInput)) {
      return {
        isDuplicate: true,
        studentName: student.studentName,
        studentId: student.id,
        source: 'system',
      };
    }
  }

  return { isDuplicate: false };
}
