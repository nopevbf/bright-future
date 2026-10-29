export interface TutoringFeeParams {
  totalSessions: number;
  registeredChildrenCount: number;
  sessionRate?: number;
}

export interface TutoringFeeResult {
  sessionRate: number;
  totalSessions: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  grandTotal: number;
}

export const STANDARD_SESSION_RATE = 35000;
export const SIBLING_DISCOUNT_PERCENT = 10;

export const LEVEL_PRICING: Record<string, number> = {
  tk: 35000,
  sd: 35000,
  smp: 45000,
  sma: 55000,
};

/**
 * Menghitung biaya bimbingan belajar dengan diskon sibling bundling 15% jika >= 2 anak.
 * Digunakan untuk kompatibilitas riwayat pendaftaran sebelumnya.
 */
export function calculateTutoringFee(params: TutoringFeeParams): TutoringFeeResult {
  const sessionRate = params.sessionRate ?? STANDARD_SESSION_RATE;
  const sessions = Math.max(0, params.totalSessions);
  const childrenCount = Math.max(0, params.registeredChildrenCount);

  const subtotal = sessions * sessionRate;

  // Sibling discount berlaku bila mendaftarkan 2 anak atau lebih
  const discountPercentage = childrenCount >= 2 ? SIBLING_DISCOUNT_PERCENT : 0;
  const discountAmount = Math.round((subtotal * discountPercentage) / 100);
  const grandTotal = subtotal - discountAmount;

  return {
    sessionRate,
    totalSessions: sessions,
    subtotal,
    discountPercentage,
    discountAmount,
    grandTotal,
  };
}

/**
 * Mengekstrak estimasi jumlah sesi belajar per minggu dari array jadwal pilihan.
 * Menangani hari tunggal, preset multi-hari (Senin-Rabu, dsb), maupun kombinasi.
 */
export function parseSessionsPerWeek(selectedSchedule: string[]): number {
  if (!Array.isArray(selectedSchedule) || selectedSchedule.length === 0) {
    return 0;
  }

  let total = 0;
  for (const item of selectedSchedule) {
    if (!item) continue;
    const normalized = item.trim().toLowerCase();
    if (
      normalized.includes('senin - rabu') ||
      normalized === 'senin-rabu' ||
      normalized.includes('selasa - kamis') ||
      normalized === 'selasa-kamis' ||
      normalized.includes('jumat - sabtu') ||
      normalized === 'jumat-sabtu' ||
      normalized.includes('sabtu - minggu') ||
      normalized === 'weekend' ||
      normalized === 'sabtu-minggu'
    ) {
      total += 2;
    } else if (
      normalized.includes('senin - rabu - jumat') ||
      normalized === '3x-seminggu'
    ) {
      total += 3;
    } else {
      total += 1;
    }
  }

  return Math.max(0, total);
}

export interface DynamicTutoringFeeParams {
  level: string;
  sessionsPerWeek: number;
  hasSiblingDiscount?: boolean;
}

export interface DynamicTutoringFeeResult {
  sessionRate: number;
  sessionsPerWeek: number;
  sessionsPerMonth: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  grandTotal: number;
}

/**
 * Menghitung biaya les bulanan dinamis berdasarkan jenjang pendidikan,
 * frekuensi sesi per minggu (4 minggu per bulan), dan diskon saudara kandung (10%).
 */
export function calculateDynamicTutoringFee(
  params: DynamicTutoringFeeParams
): DynamicTutoringFeeResult {
  const normalizedLevel = (params.level || '').toLowerCase();
  const sessionRate = LEVEL_PRICING[normalizedLevel] ?? 0;
  const sessionsPerWeek = Math.max(0, params.sessionsPerWeek);
  const sessionsPerMonth = sessionsPerWeek * 4;
  const subtotal = sessionsPerMonth * sessionRate;

  const discountPercentage = params.hasSiblingDiscount && subtotal > 0 ? SIBLING_DISCOUNT_PERCENT : 0;
  const discountAmount = Math.round((subtotal * discountPercentage) / 100);
  const grandTotal = subtotal - discountAmount;

  return {
    sessionRate,
    sessionsPerWeek,
    sessionsPerMonth,
    subtotal,
    discountPercentage,
    discountAmount,
    grandTotal,
  };
}

/**
 * Format angka numerik ke format Rupiah standar (contoh: Rp 476.000).
 */
export function formatRupiah(amount: number): string {
  const safeAmount = Math.max(0, Math.round(amount || 0));
  return `Rp ${safeAmount.toLocaleString('id-ID')}`;
}
