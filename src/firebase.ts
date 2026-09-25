import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { SubmittedRegistration } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export interface FirestoreRegistrationDoc {
  studentId: string;
  studentName: string;
  level: string;
  parentName: string;
  whatsapp: string;
  homeAddress: string;
  selectedSchedule: string[];
  totalSessions: number;
  totalAmount: number;
  appliedDiscount: number;
  invoiceNumber: string;
  paymentStatus: 'pending' | 'paid' | 'verified';
  createdAt: string;
}

export interface AdminCredentialDoc {
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'admin' | 'finance' | 'academic';
  lastLogin?: string;
  updatedAt?: string;
  databaseStatus?: string;
}

export interface PortalCredentialDoc {
  identifier: string;
  password: string;
  role: 'admin' | 'tutor' | 'siswa' | 'orang_tua';
  name: string;
  summary: string;
  updatedAt?: string;
}

export const DEFAULT_ADMIN_CREDENTIAL: AdminCredentialDoc = {
  email: 'admin@brightfuture.id',
  password: 'Bismillah@01',
  name: 'Monica Yuliana, S.Pd., Gr.',
  role: 'super_admin',
  databaseStatus: 'Active Firestore Synchronized',
};

export const DEFAULT_PORTAL_CREDENTIALS: Record<string, PortalCredentialDoc> = {
  tutor: {
    identifier: 'monica.tutor@brightfuture.id',
    password: 'Tutor@2026',
    role: 'tutor',
    name: 'Kak Monica Yuliana, S.Pd.',
    summary: 'Jadwal Hari Ini: 2 Kunjungan (Naufal - 16:00, Michelle - 18:30) • LKPD Terunggah',
  },
  siswa: {
    identifier: 'BF-2026-09-8492',
    password: 'Siswa@2026',
    role: 'siswa',
    name: 'Kevin Pratama',
    summary: 'Akun Siswa: Kevin Pratama • Kelas 4 SD • Poin Rajin Belajar: 120 XP',
  },
  orang_tua: {
    identifier: '085173230198',
    password: 'Wali@2026',
    role: 'orang_tua',
    name: 'Ibu Deasy (Wali Kevin Pratama)',
    summary: 'Wali Murid: Ibu Deasy • Status SPP: LUNAS • Jadwal Selanjutnya: Rabu 16:00',
  },
};

/**
 * Ensures default credentials exist in Cloud Firestore so the application
 * can authenticate admin and landing page users directly from the database.
 */
export async function ensureDefaultCredentialsInFirestore(): Promise<void> {
  try {
    // 1. Ensure Admin credential exists in Firestore
    const adminRef = doc(db, 'admin_credentials', 'admin');
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        ...DEFAULT_ADMIN_CREDENTIAL,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Ensure Portal multi-role credentials exist in Firestore
    for (const [key, cred] of Object.entries(DEFAULT_PORTAL_CREDENTIALS)) {
      const portalRef = doc(db, 'portal_credentials', key);
      const portalSnap = await getDoc(portalRef);
      if (!portalSnap.exists()) {
        await setDoc(portalRef, {
          ...cred,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.warn('Note: initializing default credentials to Firestore encountered:', error);
  }
}

// Automatically seed on module load
ensureDefaultCredentialsInFirestore();

/**
 * Verifies admin login credentials directly against Cloud Firestore.
 */
export async function verifyAdminCredentialsFromFirestore(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; admin?: AdminCredentialDoc; error?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  try {
    // Make sure seed exists
    await ensureDefaultCredentialsInFirestore();

    const adminRef = doc(db, 'admin_credentials', 'admin');
    const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
      const data = adminSnap.data() as AdminCredentialDoc;
      if (data.email.toLowerCase() === cleanEmail && data.password === cleanPassword) {
        const lastLoginTime = new Date().toISOString();
        // Update last login in database
        await updateDoc(adminRef, { lastLogin: lastLoginTime }).catch(() => {});
        return {
          success: true,
          admin: { ...data, lastLogin: lastLoginTime },
        };
      }
    }

    // Check all docs in admin_credentials collection
    const colRef = collection(db, 'admin_credentials');
    const allAdmins = await getDocs(colRef);
    for (const d of allAdmins.docs) {
      const data = d.data() as AdminCredentialDoc;
      if (data.email && data.email.toLowerCase() === cleanEmail && data.password === cleanPassword) {
        const lastLoginTime = new Date().toISOString();
        await updateDoc(d.ref, { lastLogin: lastLoginTime }).catch(() => {});
        return {
          success: true,
          admin: { ...data, lastLogin: lastLoginTime },
        };
      }
    }

    return {
      success: false,
      error: 'Email atau kata sandi admin tidak cocok dengan basis data Firestore.',
    };
  } catch (error) {
    console.error('Firestore verifyAdminCredentials error:', error);
    // Resilient fallback to default admin credentials if database read fails
    if (
      cleanEmail === DEFAULT_ADMIN_CREDENTIAL.email.toLowerCase() &&
      cleanPassword === DEFAULT_ADMIN_CREDENTIAL.password
    ) {
      return { success: true, admin: DEFAULT_ADMIN_CREDENTIAL };
    }
    return {
      success: false,
      error: 'Terjadi kendala saat memeriksa kredensial ke database Firestore.',
    };
  }
}

/**
 * Verifies portal credentials (admin, tutor, siswa, orang tua) against Firestore database.
 * For 'siswa' and 'orang_tua', it also cross-checks live student registrations in Firestore!
 */
export async function verifyPortalCredentialsFromFirestore(
  role: 'admin' | 'tutor' | 'siswa' | 'orang_tua',
  identifierInput: string,
  passwordInput: string
): Promise<{
  success: boolean;
  user?: {
    identifier: string;
    name: string;
    role: string;
    summary: string;
    source: 'firestore_credentials' | 'firestore_registrations';
  };
  error?: string;
}> {
  const cleanId = identifierInput.trim();
  const cleanPassword = passwordInput.trim();

  if (role === 'admin') {
    const adminRes = await verifyAdminCredentialsFromFirestore(cleanId, cleanPassword);
    if (adminRes.success && adminRes.admin) {
      return {
        success: true,
        user: {
          identifier: adminRes.admin.email,
          name: adminRes.admin.name,
          role: 'admin',
          summary: 'Super Admin: Akses Master Operasional • Cloud Firestore Terhubung',
          source: 'firestore_credentials',
        },
      };
    }
    return { success: false, error: adminRes.error };
  }

  try {
    await ensureDefaultCredentialsInFirestore();

    // 1. Check portal_credentials collection in Firestore
    const portalRef = doc(db, 'portal_credentials', role);
    const portalSnap = await getDoc(portalRef);

    if (portalSnap.exists()) {
      const data = portalSnap.data() as PortalCredentialDoc;
      if (
        data.identifier.toLowerCase() === cleanId.toLowerCase() &&
        data.password === cleanPassword
      ) {
        return {
          success: true,
          user: {
            identifier: data.identifier,
            name: data.name,
            role: data.role,
            summary: data.summary,
            source: 'firestore_credentials',
          },
        };
      }
    }

    // 2. Cross-check registrations collection for students (siswa)
    if (role === 'siswa') {
      const regDocRef = doc(db, 'registrations', cleanId);
      const regDocSnap = await getDoc(regDocRef);
      if (regDocSnap.exists()) {
        const regData = regDocSnap.data() as FirestoreRegistrationDoc;
        return {
          success: true,
          user: {
            identifier: regData.studentId,
            name: regData.studentName,
            role: 'siswa',
            summary: `Akun Siswa Terverifikasi: ${regData.studentName} • Jenjang: ${regData.level.toUpperCase()} • Status: ${regData.paymentStatus.toUpperCase()}`,
            source: 'firestore_registrations',
          },
        };
      }
    }

    // 3. Cross-check registrations collection for parents (orang tua) via WhatsApp number
    if (role === 'orang_tua') {
      const normalizedPhone = cleanId.replace(/[^0-9]/g, '');
      const colRef = collection(db, 'registrations');
      const allRegs = await getDocs(colRef);
      for (const d of allRegs.docs) {
        const regData = d.data() as FirestoreRegistrationDoc;
        const regPhone = (regData.whatsapp || '').replace(/[^0-9]/g, '');
        if (regPhone && (regPhone === normalizedPhone || regPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(regPhone))) {
          return {
            success: true,
            user: {
              identifier: regData.whatsapp,
              name: `${regData.parentName} (Wali ${regData.studentName})`,
              role: 'orang_tua',
              summary: `Wali Murid: ${regData.parentName} • Siswa: ${regData.studentName} (${regData.level.toUpperCase()}) • Status Tagihan: ${regData.paymentStatus.toUpperCase()}`,
              source: 'firestore_registrations',
            },
          };
        }
      }
    }

    // 4. Fallback check against default mock data
    const defaultCred = DEFAULT_PORTAL_CREDENTIALS[role];
    if (defaultCred && defaultCred.identifier.toLowerCase() === cleanId.toLowerCase() && defaultCred.password === cleanPassword) {
      return {
        success: true,
        user: {
          identifier: defaultCred.identifier,
          name: defaultCred.name,
          role: defaultCred.role,
          summary: defaultCred.summary,
          source: 'firestore_credentials',
        },
      };
    }

    return {
      success: false,
      error: `Identitas (${cleanId}) atau kata sandi tidak ditemukan pada basis data ${role.replace('_', ' ')}.`,
    };
  } catch (err) {
    console.error('Error verifying portal credentials:', err);
    // Fallback
    const defaultCred = DEFAULT_PORTAL_CREDENTIALS[role];
    if (defaultCred && defaultCred.identifier.toLowerCase() === cleanId.toLowerCase() && defaultCred.password === cleanPassword) {
      return {
        success: true,
        user: {
          identifier: defaultCred.identifier,
          name: defaultCred.name,
          role: defaultCred.role,
          summary: defaultCred.summary,
          source: 'firestore_credentials',
        },
      };
    }
    return {
      success: false,
      error: 'Gagal menghubungi database Firestore.',
    };
  }
}

/**
 * Fetches the current Admin credential details from Cloud Firestore.
 */
export async function fetchAdminCredentialFromFirestore(): Promise<AdminCredentialDoc> {
  try {
    await ensureDefaultCredentialsInFirestore();
    const adminRef = doc(db, 'admin_credentials', 'admin');
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      return adminSnap.data() as AdminCredentialDoc;
    }
  } catch (error) {
    console.warn('Could not fetch admin credential from Firestore:', error);
  }
  return DEFAULT_ADMIN_CREDENTIAL;
}

/**
 * Updates the Admin password directly in Cloud Firestore.
 */
export async function updateAdminPasswordInFirestore(
  currentPasswordInput: string,
  newPasswordInput: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminRef = doc(db, 'admin_credentials', 'admin');
    const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
      const data = adminSnap.data() as AdminCredentialDoc;
      if (data.password !== currentPasswordInput.trim()) {
        return { success: false, error: 'Kata sandi lama yang Anda masukkan tidak sesuai.' };
      }
      await updateDoc(adminRef, {
        password: newPasswordInput.trim(),
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    } else {
      // If doc did not exist, create it with new password
      await setDoc(adminRef, {
        ...DEFAULT_ADMIN_CREDENTIAL,
        password: newPasswordInput.trim(),
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to update admin password in Firestore:', error);
    return { success: false, error: 'Gagal memperbarui kata sandi di Firestore.' };
  }
}

/**
 * Fetches a list of all database-backed accounts for display in the Admin Dashboard.
 */
export async function fetchConnectedDatabaseAccounts(): Promise<{
  admin: AdminCredentialDoc;
  portalAccounts: PortalCredentialDoc[];
  totalRegisteredStudents: number;
}> {
  try {
    const admin = await fetchAdminCredentialFromFirestore();
    const portalCol = collection(db, 'portal_credentials');
    const portalSnap = await getDocs(portalCol);
    const portalAccounts: PortalCredentialDoc[] = [];
    portalSnap.forEach((d) => portalAccounts.push(d.data() as PortalCredentialDoc));

    const regCol = collection(db, 'registrations');
    const regSnap = await getDocs(regCol);
    const totalRegisteredStudents = regSnap.size;

    return {
      admin,
      portalAccounts,
      totalRegisteredStudents,
    };
  } catch (error) {
    console.error('Error fetching connected database accounts:', error);
    return {
      admin: DEFAULT_ADMIN_CREDENTIAL,
      portalAccounts: Object.values(DEFAULT_PORTAL_CREDENTIALS),
      totalRegisteredStudents: 0,
    };
  }
}

/**
 * Saves a new student registration to Firestore in the 'registrations' collection.
 */
export async function saveRegistrationToFirestore(registration: SubmittedRegistration): Promise<void> {
  const docPath = `registrations/${registration.studentId}`;
  try {
    const docRef = doc(db, 'registrations', registration.studentId);
    await setDoc(docRef, {
      studentId: registration.studentId,
      studentName: registration.studentName,
      level: registration.level,
      parentName: registration.parentName,
      whatsapp: registration.whatsapp,
      homeAddress: registration.homeAddress,
      selectedSchedule: registration.selectedSchedule,
      totalSessions: 8,
      totalAmount: registration.totalAmount,
      appliedDiscount: registration.hasSiblingDiscount ? 10 : 0,
      invoiceNumber: registration.invoiceNumber,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

/**
 * Fetches all student registrations from Firestore for the Admin Dashboard.
 */
export async function fetchRegistrationsFromFirestore(): Promise<FirestoreRegistrationDoc[]> {
  try {
    const colRef = collection(db, 'registrations');
    const snapshot = await getDocs(colRef);
    const results: FirestoreRegistrationDoc[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as FirestoreRegistrationDoc);
    });
    // sort by createdAt descending
    results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return results;
  } catch (error) {
    console.error('Error fetching registrations from Firestore:', error);
    return [];
  }
}

/**
 * Listens in real-time to student registrations in Firestore.
 * Automatically notifies listeners whenever a new student registers or status changes.
 */
export function subscribeToRegistrations(
  onUpdate: (registrations: FirestoreRegistrationDoc[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const colRef = collection(db, 'registrations');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const results: FirestoreRegistrationDoc[] = [];
      snapshot.forEach((docSnap) => {
        results.push(docSnap.data() as FirestoreRegistrationDoc);
      });
      results.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      onUpdate(results);
    },
    (error) => {
      console.error('Realtime Firestore registrations error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Updates verification or payment status of a registration in Firestore.
 */
export async function updateRegistrationStatusInFirestore(
  studentId: string,
  newStatus: 'pending' | 'paid' | 'verified'
): Promise<void> {
  const docPath = `registrations/${studentId}`;
  try {
    const docRef = doc(db, 'registrations', studentId);
    await updateDoc(docRef, { paymentStatus: newStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}
