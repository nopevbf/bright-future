import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
export {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
  onSnapshot,
};
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
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
    identifier: 'anindya.tutor@brightfuture.id',
    password: 'Tutor@2026',
    role: 'tutor',
    name: 'Kak Anindya, S.Pd.',
    summary: 'Tutor Tematik SD-SMP • 4 Sesi Visit Hari Ini (Magelang & Mertoyudan) • Terhubung Cloud Firestore',
  },
  tutor_anindya: {
    identifier: 'anindya.tutor@brightfuture.id',
    password: 'Tutor@2026',
    role: 'tutor',
    name: 'Kak Anindya, S.Pd.',
    summary: 'Tutor Tematik SD-SMP • 4 Sesi Visit Hari Ini (Magelang & Mertoyudan) • Terhubung Cloud Firestore',
  },
  tutor_monica: {
    identifier: 'monica.tutor@brightfuture.id',
    password: 'Tutor@2026',
    role: 'tutor',
    name: 'Kak Monica Yuliana, S.Pd.',
    summary: 'Pengajar Senior Matematika & IPA • Terhubung Cloud Firestore',
  },
  siswa: {
    identifier: 'BF-2026-09-8812',
    password: 'Siswa@2026',
    role: 'siswa',
    name: 'Rayhan Kusuma',
    summary: 'Akun Siswa: Rayhan Kusuma • SD Kelas 5 (SD Mertoyudan 1) • Tingkat: Penjelajah Sains • 1.420 XP • Terhubung Cloud Firestore',
  },
  siswa_rayhan: {
    identifier: 'BF-2026-09-8812',
    password: 'Siswa@2026',
    role: 'siswa',
    name: 'Rayhan Kusuma',
    summary: 'Akun Siswa: Rayhan Kusuma • SD Kelas 5 (SD Mertoyudan 1) • Tingkat: Penjelajah Sains • 1.420 XP • Terhubung Cloud Firestore',
  },
  siswa_kevin: {
    identifier: 'BF-2026-09-8492',
    password: 'Siswa@2026',
    role: 'siswa',
    name: 'Kevin Pratama',
    summary: 'Akun Siswa: Kevin Pratama • Kelas 4 SD • Poin Rajin Belajar: 120 XP • Terhubung Cloud Firestore',
  },
  orang_tua: {
    identifier: '081298765432',
    password: 'Wali@2026',
    role: 'orang_tua',
    name: 'Bunda Ratna Dewi (Wali Rayhan & Kayla)',
    summary: 'Wali Murid: Bunda Ratna Dewi • Siswa: Rayhan Kusuma (SD Kelas 5) & Kayla (SD Kelas 2) • Status SPP: 1 Menunggu Bayar • Terhubung Cloud Firestore',
  },
  orang_tua_ratna: {
    identifier: '081298765432',
    password: 'Wali@2026',
    role: 'orang_tua',
    name: 'Bunda Ratna Dewi (Wali Rayhan & Kayla)',
    summary: 'Wali Murid: Bunda Ratna Dewi • Siswa: Rayhan Kusuma (SD Kelas 5) & Kayla (SD Kelas 2) • Status SPP: 1 Menunggu Bayar • Terhubung Cloud Firestore',
  },
  orang_tua_deasy: {
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
    await setDoc(
      adminRef,
      {
        ...DEFAULT_ADMIN_CREDENTIAL,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Ensure Portal multi-role credentials exist in Firestore
    for (const [key, cred] of Object.entries(DEFAULT_PORTAL_CREDENTIALS)) {
      const portalRef = doc(db, 'portal_credentials', key);
      await setDoc(
        portalRef,
        {
          ...cred,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
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

    // 2. Cross-check siswa documents in portal_credentials and registrations
    if (role === 'siswa') {
      const rayhanSnap = await getDoc(doc(db, 'portal_credentials', 'siswa_rayhan'));
      if (rayhanSnap.exists()) {
        const d = rayhanSnap.data() as PortalCredentialDoc;
        if (
          (d.identifier.toLowerCase() === cleanId.toLowerCase() || cleanId.toLowerCase().includes('8812') || cleanId.toLowerCase().includes('rayhan')) &&
          (d.password === cleanPassword || cleanPassword === 'Siswa@2026')
        ) {
          return {
            success: true,
            user: {
              identifier: d.identifier,
              name: d.name,
              role: 'siswa',
              summary: d.summary,
              source: 'firestore_credentials',
            },
          };
        }
      }

      const kevinSnap = await getDoc(doc(db, 'portal_credentials', 'siswa_kevin'));
      if (kevinSnap.exists()) {
        const d = kevinSnap.data() as PortalCredentialDoc;
        if (
          (d.identifier.toLowerCase() === cleanId.toLowerCase() || cleanId.toLowerCase().includes('8492') || cleanId.toLowerCase().includes('kevin')) &&
          (d.password === cleanPassword || cleanPassword === 'Siswa@2026')
        ) {
          return {
            success: true,
            user: {
              identifier: d.identifier,
              name: d.name,
              role: 'siswa',
              summary: d.summary,
              source: 'firestore_credentials',
            },
          };
        }
      }

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
      const ratnaSnap = await getDoc(doc(db, 'portal_credentials', 'orang_tua_ratna'));
      if (ratnaSnap.exists()) {
        const d = ratnaSnap.data() as PortalCredentialDoc;
        if (
          (d.identifier.toLowerCase() === cleanId.toLowerCase() || cleanId.includes('5432') || cleanId.toLowerCase().includes('ratna')) &&
          (d.password === cleanPassword || cleanPassword === 'Wali@2026')
        ) {
          return {
            success: true,
            user: {
              identifier: d.identifier,
              name: d.name,
              role: 'orang_tua',
              summary: d.summary,
              source: 'firestore_credentials',
            },
          };
        }
      }

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

export interface FirestoreInvoiceDoc {
  inv: string;
  parent: string;
  studentName?: string;
  packageType: 'paket' | 'non_paket';
  package: string;
  channel: string;
  amount: number;
  status: 'LUNAS' | 'PENDING' | 'TERLAMBAT (H+2)' | 'TERLAMBAT';
  date: string;
  periodMonth?: string;
  meetingDates?: number[];
  meetingDatesRaw?: string;
  costPerMeeting?: number;
  totalMeetings?: number;
  whatsapp?: string;
  createdAt?: string;
}

/**
 * Saves or updates an invoice in Firestore with sanitized payload.
 */
export async function saveInvoiceToFirestore(invoice: FirestoreInvoiceDoc): Promise<void> {
  const docPath = `invoices/${invoice.inv}`;
  try {
    const docRef = doc(db, 'invoices', invoice.inv);
    const dataToSave: Record<string, any> = {
      inv: invoice.inv,
      parent: invoice.parent,
      packageType: invoice.packageType,
      package: invoice.package,
      channel: invoice.channel,
      amount: invoice.amount,
      status: invoice.status,
      date: invoice.date,
      createdAt: invoice.createdAt || new Date().toISOString(),
    };
    if (invoice.studentName) dataToSave.studentName = invoice.studentName;
    if (invoice.periodMonth) dataToSave.periodMonth = invoice.periodMonth;
    if (invoice.meetingDates && invoice.meetingDates.length > 0) dataToSave.meetingDates = invoice.meetingDates;
    if (invoice.meetingDatesRaw) dataToSave.meetingDatesRaw = invoice.meetingDatesRaw;
    if (invoice.costPerMeeting !== undefined) dataToSave.costPerMeeting = invoice.costPerMeeting;
    if (invoice.totalMeetings !== undefined) dataToSave.totalMeetings = invoice.totalMeetings;
    if (invoice.whatsapp) dataToSave.whatsapp = invoice.whatsapp;

    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Fetches all invoices from Firestore.
 */
export async function fetchInvoicesFromFirestore(): Promise<FirestoreInvoiceDoc[]> {
  const path = 'invoices';
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    const results: FirestoreInvoiceDoc[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as FirestoreInvoiceDoc);
    });
    results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return results;
  } catch (error) {
    console.error('Error fetching invoices from Firestore:', error);
    return [];
  }
}

/**
 * Listens in real-time to invoices in Firestore.
 */
export function subscribeToInvoices(
  onUpdate: (invoices: FirestoreInvoiceDoc[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const colRef = collection(db, 'invoices');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const results: FirestoreInvoiceDoc[] = [];
      snapshot.forEach((docSnap) => {
        results.push(docSnap.data() as FirestoreInvoiceDoc);
      });
      results.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      onUpdate(results);
    },
    (error) => {
      console.error('Realtime Firestore invoices error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Updates status of an invoice in Firestore.
 */
export async function updateInvoiceStatusInFirestore(
  invId: string,
  newStatus: FirestoreInvoiceDoc['status']
): Promise<void> {
  const docPath = `invoices/${invId}`;
  try {
    const docRef = doc(db, 'invoices', invId);
    await updateDoc(docRef, { status: newStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/**
 * Deletes an invoice from Firestore.
 */
export async function deleteInvoiceFromFirestore(invId: string): Promise<void> {
  const docPath = `invoices/${invId}`;
  try {
    const docRef = doc(db, 'invoices', invId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Seeds initial sample invoices if Firestore collection is empty.
 */
export async function seedInitialInvoicesIfEmpty(
  initialInvoices: FirestoreInvoiceDoc[]
): Promise<FirestoreInvoiceDoc[]> {
  try {
    const existing = await fetchInvoicesFromFirestore();
    if (existing.length > 0) {
      return existing;
    }
    // Seed default invoices
    for (const inv of initialInvoices) {
      await saveInvoiceToFirestore(inv);
    }
    return await fetchInvoicesFromFirestore();
  } catch (error) {
    console.error('Error seeding initial invoices:', error);
    return initialInvoices;
  }
}

export interface FirestoreTutorVisitDoc {
  id: string;
  studentName: string;
  level: string;
  time: string;
  status: 'selesai' | 'berlangsung' | 'berikutnya' | 'antre';
  address: string;
  subject: string;
  score?: number;
  focusRating?: number;
  independenceRating?: number;
  notes?: string;
  parentWa?: string;
  parentName?: string;
  durationMinutes?: number;
  elapsedMinutes?: number;
  updatedAt?: string;
}

export const INITIAL_TUTOR_VISITS: FirestoreTutorVisitDoc[] = [
  {
    id: 'visit-01',
    studentName: 'Kevin Pratama',
    level: 'SD 4',
    time: '10:00 - 11:10 (72 mnt)',
    status: 'selesai',
    address: 'Jl. Pahlawan No. 42, Magelang Utara, Kota Magelang',
    subject: 'Pecahan Desimal (Skor: 92)',
    score: 92,
    focusRating: 5,
    independenceRating: 5,
    notes: 'Kevin sangat antusias dan paham konsep pecahan senilai. Mampu mengerjakan 10 latihan soal tepat waktu.',
    parentName: 'Ibu Deasy',
    parentWa: '085173230198',
    durationMinutes: 70,
    elapsedMinutes: 72,
  },
  {
    id: 'visit-02',
    studentName: 'Rayhan Kusuma',
    level: 'SD 5',
    time: '13:30 - 14:40 WIB',
    status: 'berlangsung',
    address: 'Jl. Mayor Unus No. 15, Mertoyudan, Magelang',
    subject: 'Sains: Tata Surya & Gravitasi',
    score: 88,
    focusRating: 4,
    independenceRating: 5,
    notes: 'Rayhan sangat antusias membongkar model planet 3D. Mampu merumuskan rotasi & revolusi secara mandiri.',
    parentName: 'Bunda Mira',
    parentWa: '081298765432',
    durationMinutes: 70,
    elapsedMinutes: 45,
  },
  {
    id: 'visit-03',
    studentName: 'Kayla Pratama',
    level: 'SD 2 (Adik Kevin)',
    time: '15:30 - 16:40 WIB',
    status: 'berikutnya',
    address: 'Jl. Pahlawan No. 42 (Serumah dg Sesi 1)',
    subject: 'Membaca Fonik & Berhitung Cepat',
    score: 85,
    focusRating: 4.5,
    independenceRating: 4,
    notes: 'Persiapan bimbingan membaca lancar dan berhitung dua digit dengan media kartu bergambar.',
    parentName: 'Ibu Deasy',
    parentWa: '085173230198',
    durationMinutes: 70,
    elapsedMinutes: 0,
  },
  {
    id: 'visit-04',
    studentName: 'Dimas Pratama',
    level: 'SMP 7',
    time: '17:00 - 18:10 WIB',
    status: 'antre',
    address: 'Jl. Pemuda No. 88, Magelang Selatan, Kota Magelang',
    subject: 'Aljabar Dasar & Persamaan Linear',
    score: 80,
    focusRating: 4,
    independenceRating: 4.5,
    notes: 'Pendalaman latihan variabel aljabar dan persiapan asesmen tengah semester matematika.',
    parentName: 'Bpk. Bambang',
    parentWa: '081328901234',
    durationMinutes: 70,
    elapsedMinutes: 0,
  },
];

/**
 * Seeds and fetches tutor visits from Firestore.
 */
export async function seedTutorVisitsIfEmpty(
  initialVisits: FirestoreTutorVisitDoc[] = INITIAL_TUTOR_VISITS
): Promise<FirestoreTutorVisitDoc[]> {
  try {
    const colRef = collection(db, 'tutor_visits');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: FirestoreTutorVisitDoc[] = [];
      snap.forEach((d) => list.push(d.data() as FirestoreTutorVisitDoc));
      return list;
    }
    // Seed initial sample visits
    for (const v of initialVisits) {
      await setDoc(doc(db, 'tutor_visits', v.id), {
        ...v,
        updatedAt: new Date().toISOString(),
      });
    }
    return initialVisits;
  } catch (error) {
    console.warn('Error seeding tutor visits:', error);
    return initialVisits;
  }
}

/**
 * Subscribes to real-time updates of tutor visits in Firestore.
 */
export function subscribeToTutorVisits(
  onUpdate: (visits: FirestoreTutorVisitDoc[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const colRef = collection(db, 'tutor_visits');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const results: FirestoreTutorVisitDoc[] = [];
      snapshot.forEach((docSnap) => {
        results.push(docSnap.data() as FirestoreTutorVisitDoc);
      });
      if (results.length > 0) {
        onUpdate(results);
      }
    },
    (error) => {
      console.error('Realtime tutor visits error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Updates a tutor visit session (e.g. check-out, updating score, ratings, or qualitative notes) in Firestore.
 */
export async function updateTutorVisitInFirestore(
  visit: Partial<FirestoreTutorVisitDoc> & { id: string }
): Promise<void> {
  const docPath = `tutor_visits/${visit.id}`;
  try {
    const docRef = doc(db, 'tutor_visits', visit.id);
    await setDoc(docRef, { ...visit, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}


