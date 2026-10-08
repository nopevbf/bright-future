import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  Firestore,
} from 'firebase/firestore';

export interface CleanupClassificationResult {
  action: 'retain' | 'delete';
  reason: string;
}

/**
 * Mengklasifikasikan apakah sebuah dokumen dalam koleksi tertentu harus dipertahankan atau dihapus.
 */
export function classifyDocumentForCleanup(
  collectionName: string,
  docId: string,
  data: Record<string, any>
): CleanupClassificationResult {
  // 1. Koleksi operasional harus selalu dibersihkan
  const operationalCollections = [
    'registrations',
    'invoices',
    'tutor_visits',
    'tutor_registrations',
    'tutor_assignments',
    'managed_students',
  ];

  if (operationalCollections.includes(collectionName)) {
    return {
      action: 'delete',
      reason: `Koleksi operasional (${collectionName}) ditandai untuk dibersihkan.`,
    };
  }

  // 2. Koleksi portal_credentials: retain jika role adalah admin atau super_admin
  if (collectionName === 'portal_credentials') {
    const role = (data.role || '').toLowerCase();
    if (role === 'admin' || role === 'super_admin') {
      return {
        action: 'retain',
        reason: `Akun portal dengan peran ${role} dipertahankan.`,
      };
    }
    return {
      action: 'delete',
      reason: `Akun portal non-admin (${role || 'tanpa peran'}) ditandai untuk dihapus.`,
    };
  }

  // 3. Koleksi admin_credentials: retain master dan official admins, delete akun uji/temp
  if (collectionName === 'admin_credentials') {
    const isMaster = docId === 'admin';
    const isTest =
      docId.startsWith('admin_test_') ||
      docId.startsWith('temp_test_') ||
      (data.email && data.email.includes('test_'));

    if (isTest && !isMaster) {
      return {
        action: 'delete',
        reason: `Dokumen sisa uji coba (${docId}) ditandai untuk dihapus.`,
      };
    }

    return {
      action: 'retain',
      reason: `Akun admin resmi (${docId}) dipertahankan.`,
    };
  }

  return {
    action: 'delete',
    reason: `Dokumen tidak dikenal di koleksi ${collectionName}.`,
  };
}

/**
 * Memfilter dokumen portal_credentials menjadi daftar yang dipertahankan dan yang dihapus.
 */
export function filterPortalCredentialsForRetention<T extends { id?: string; role?: string }>(
  docs: T[]
): { retain: T[]; remove: T[] } {
  const retain: T[] = [];
  const remove: T[] = [];

  for (const item of docs) {
    const role = (item.role || '').toLowerCase();
    if (role === 'admin' || role === 'super_admin') {
      retain.push(item);
    } else {
      remove.push(item);
    }
  }

  return { retain, remove };
}

/**
 * Memfilter dokumen admin_credentials menjadi daftar yang dipertahankan dan yang dihapus.
 */
export function filterAdminCredentialsForRetention<T extends { id?: string; email?: string }>(
  docs: T[]
): { retain: T[]; remove: T[] } {
  const retain: T[] = [];
  const remove: T[] = [];

  for (const item of docs) {
    const docId = item.id || '';
    const email = (item.email || '').toLowerCase();
    const isMaster = docId === 'admin';
    const isTest =
      docId.startsWith('admin_test_') ||
      docId.startsWith('temp_test_') ||
      email.includes('test_');

    if (isTest && !isMaster) {
      remove.push(item);
    } else {
      retain.push(item);
    }
  }

  return { retain, remove };
}

export interface DatabaseCleanupSummary {
  deletedCount: number;
  retainedCount: number;
  details: {
    collection: string;
    deletedDocIds: string[];
    retainedDocIds: string[];
  }[];
}

/**
 * Mengeksekusi pembersihan database Firestore dengan aturan retensi akun admin yang ketat.
 */
export async function executeDatabaseCleanup(
  db: Firestore,
  options?: { clearLocalStorage?: boolean }
): Promise<DatabaseCleanupSummary> {
  const collectionsToProcess = [
    'registrations',
    'invoices',
    'tutor_visits',
    'tutor_registrations',
    'tutor_assignments',
    'managed_students',
    'portal_credentials',
    'admin_credentials',
  ];

  const summary: DatabaseCleanupSummary = {
    deletedCount: 0,
    retainedCount: 0,
    details: [],
  };

  for (const colName of collectionsToProcess) {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    const deletedDocIds: string[] = [];
    const retainedDocIds: string[] = [];

    for (const docSnap of snapshot.docs) {
      const docId = docSnap.id;
      const data = docSnap.data();
      const classification = classifyDocumentForCleanup(colName, docId, data);

      if (classification.action === 'delete') {
        await deleteDoc(doc(db, colName, docId));
        deletedDocIds.push(docId);
        summary.deletedCount++;
      } else {
        retainedDocIds.push(docId);
        summary.retainedCount++;
      }
    }

    summary.details.push({
      collection: colName,
      deletedDocIds,
      retainedDocIds,
    });
  }

  // Bersihkan cache LocalStorage jika opsi aktif dan berada di lingkungan browser
  if (options?.clearLocalStorage && typeof window !== 'undefined') {
    const cacheKeys = [
      'bf_tutor_registrations_cache',
      'bright_future_tutor_assignments_cache',
      'bright_future_managed_students_cache',
    ];
    cacheKeys.forEach((key) => localStorage.removeItem(key));
  }

  return summary;
}
