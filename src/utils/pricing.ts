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
export const SIBLING_DISCOUNT_PERCENT = 15;

/**
 * Menghitung biaya bimbingan belajar dengan diskon sibling bundling 15% jika >= 2 anak.
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
 * Format angka numerik ke format Rupiah standar (contoh: Rp 476.000).
 */
export function formatRupiah(amount: number): string {
  const safeAmount = Math.max(0, Math.round(amount || 0));
  return `Rp ${safeAmount.toLocaleString('id-ID')}`;
}
