import { describe, it, expect } from 'vitest';
import { calculateTutoringFee, formatRupiah } from './pricing';

describe('Pricing & Sibling Bundling Calculator (REQ-01)', () => {
  it('menghitung biaya standar untuk 1 anak (tanpa diskon sibling)', () => {
    // 8 sesi = 8 * 35.000 = 280.000
    const result = calculateTutoringFee({
      totalSessions: 8,
      registeredChildrenCount: 1,
    });

    expect(result.sessionRate).toBe(35000);
    expect(result.subtotal).toBe(280000);
    expect(result.discountPercentage).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.grandTotal).toBe(280000);
  });

  it('mengaplikasikan diskon saudara kandung (sibling discount) 15% jika anak >= 2', () => {
    // 16 sesi (2 anak @ 8 sesi) = 16 * 35.000 = 560.000, diskon 15% = 84.000, total = 476.000
    const result = calculateTutoringFee({
      totalSessions: 16,
      registeredChildrenCount: 2,
    });

    expect(result.subtotal).toBe(560000);
    expect(result.discountPercentage).toBe(15);
    expect(result.discountAmount).toBe(84000);
    expect(result.grandTotal).toBe(476000);
  });

  it('mengaplikasikan diskon 15% untuk 3 anak atau lebih', () => {
    // 24 sesi (3 anak @ 8 sesi) = 24 * 35.000 = 840.000, diskon 15% = 126.000, total = 714.000
    const result = calculateTutoringFee({
      totalSessions: 24,
      registeredChildrenCount: 3,
    });

    expect(result.discountPercentage).toBe(15);
    expect(result.discountAmount).toBe(126000);
    expect(result.grandTotal).toBe(714000);
  });

  it('menangani boundary value analysis (BVA): 0 sesi dan 0 anak', () => {
    const result = calculateTutoringFee({
      totalSessions: 0,
      registeredChildrenCount: 0,
    });

    expect(result.subtotal).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  it('menangani boundary input negatif secara aman', () => {
    const result = calculateTutoringFee({
      totalSessions: -5,
      registeredChildrenCount: -1,
    });

    expect(result.subtotal).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  it('memformat angka ke mata uang Rupiah dengan benar', () => {
    expect(formatRupiah(476000)).toBe('Rp 476.000');
    expect(formatRupiah(0)).toBe('Rp 0');
  });
});
