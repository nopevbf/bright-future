import { FirestoreRegistrationDoc, FirestoreInvoiceDoc } from '../firebase';

/**
 * Batas waktu toleransi pendaftaran siswa baru tanpa pembaharuan status (24 jam dalam milidetik).
 * 24 jam = 24 * 60 * 60 * 1000 = 86.400.000 ms.
 */
export const REGISTRATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Memeriksa apakah data pendaftaran siswa telah kadaluarsa:
 * - Belum ada pembaharuan status (paymentStatus masih 'pending')
 * - Berusia >= 24 jam sejak createdAt
 */
export function isRegistrationExpired(
  reg: FirestoreRegistrationDoc,
  currentTime: Date = new Date()
): boolean {
  // Hanya pendaftaran dengan status 'pending' (belum ada pembaharuan status) yang dapat kadaluarsa
  if (!reg || reg.paymentStatus !== 'pending') {
    return false;
  }

  // Safety fallback: jika tidak ada tanggal dibuat atau format tidak valid, jangan dihapus sembarangan
  if (!reg.createdAt) {
    return false;
  }

  const createdTime = new Date(reg.createdAt).getTime();
  if (isNaN(createdTime)) {
    return false;
  }

  const nowTime = currentTime.getTime();
  return (nowTime - createdTime) >= REGISTRATION_EXPIRY_MS;
}

/**
 * Memeriksa apakah data invoice pendaftaran telah kadaluarsa:
 * - Status masih 'PENDING'
 * - Berusia >= 24 jam sejak createdAt
 */
export function isInvoiceExpired(
  inv: FirestoreInvoiceDoc,
  currentTime: Date = new Date()
): boolean {
  if (!inv) {
    return false;
  }

  const normalizedStatus = (inv.status || '').toUpperCase();
  if (normalizedStatus !== 'PENDING') {
    return false;
  }

  if (!inv.createdAt) {
    return false;
  }

  const createdTime = new Date(inv.createdAt).getTime();
  if (isNaN(createdTime)) {
    return false;
  }

  const nowTime = currentTime.getTime();
  return (nowTime - createdTime) >= REGISTRATION_EXPIRY_MS;
}

export interface ExpiredPairsResult {
  activeRegistrations: FirestoreRegistrationDoc[];
  expiredRegistrations: FirestoreRegistrationDoc[];
  activeInvoices: FirestoreInvoiceDoc[];
  expiredInvoiceIds: string[];
}

/**
 * Memilah data pendaftaran siswa dan invoice terkait menjadi data aktif dan data kadaluarsa.
 */
export function detectExpiredRegistrationPairs(
  registrations: FirestoreRegistrationDoc[],
  invoices: FirestoreInvoiceDoc[],
  currentTime: Date = new Date()
): ExpiredPairsResult {
  const activeRegistrations: FirestoreRegistrationDoc[] = [];
  const expiredRegistrations: FirestoreRegistrationDoc[] = [];
  const expiredInvNumSet = new Set<string>();

  for (const reg of registrations) {
    if (isRegistrationExpired(reg, currentTime)) {
      expiredRegistrations.push(reg);
      if (reg.invoiceNumber) {
        expiredInvNumSet.add(reg.invoiceNumber);
      }
    } else {
      activeRegistrations.push(reg);
    }
  }

  const activeInvoices: FirestoreInvoiceDoc[] = [];
  const expiredInvoiceIds: string[] = [];

  for (const inv of invoices) {
    const isDirectlyExpired = isInvoiceExpired(inv, currentTime);
    const isPairedToExpiredReg =
      expiredInvNumSet.has(inv.inv) && (inv.status || '').toUpperCase() === 'PENDING';

    if (isDirectlyExpired || isPairedToExpiredReg) {
      expiredInvoiceIds.push(inv.inv);
    } else {
      activeInvoices.push(inv);
    }
  }

  return {
    activeRegistrations,
    expiredRegistrations,
    activeInvoices,
    expiredInvoiceIds,
  };
}

export interface PurgeExpiredOptions {
  registrations: FirestoreRegistrationDoc[];
  invoices: FirestoreInvoiceDoc[];
  currentTime?: Date;
  deleteRegistration: (studentId: string) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
}

export interface PurgeExpiredSummary {
  deletedRegIds: string[];
  deletedInvIds: string[];
}

/**
 * Mengeksekusi penghapusan pendaftaran dan invoice kadaluarsa dari sistem.
 */
export async function purgeExpiredRegistrationsAndInvoices({
  registrations,
  invoices,
  currentTime = new Date(),
  deleteRegistration,
  deleteInvoice,
}: PurgeExpiredOptions): Promise<PurgeExpiredSummary> {
  const { expiredRegistrations, expiredInvoiceIds } = detectExpiredRegistrationPairs(
    registrations,
    invoices,
    currentTime
  );

  const deletedRegIds: string[] = [];
  const deletedInvIds: string[] = [];

  const regDeletePromises = expiredRegistrations.map(async (reg) => {
    try {
      await deleteRegistration(reg.studentId);
      deletedRegIds.push(reg.studentId);
    } catch (err) {
      console.error(`Gagal menghapus registrasi kadaluarsa ${reg.studentId}:`, err);
    }
  });

  const invDeletePromises = expiredInvoiceIds.map(async (invId) => {
    try {
      await deleteInvoice(invId);
      deletedInvIds.push(invId);
    } catch (err) {
      console.error(`Gagal menghapus invoice kadaluarsa ${invId}:`, err);
    }
  });

  await Promise.allSettled([...regDeletePromises, ...invDeletePromises]);

  return {
    deletedRegIds,
    deletedInvIds,
  };
}
