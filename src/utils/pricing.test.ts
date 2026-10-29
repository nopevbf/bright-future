import { describe, it, expect } from 'vitest';
import {
  calculateTutoringFee,
  formatRupiah,
  LEVEL_PRICING,
  parseSessionsPerWeek,
  calculateDynamicTutoringFee,
} from './pricing';

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

  it('mengaplikasikan diskon saudara kandung (sibling discount) 10% jika anak >= 2', () => {
    // 16 sesi (2 anak @ 8 sesi) = 16 * 35.000 = 560.000, diskon 10% = 56.000, total = 504.000
    const result = calculateTutoringFee({
      totalSessions: 16,
      registeredChildrenCount: 2,
    });

    expect(result.subtotal).toBe(560000);
    expect(result.discountPercentage).toBe(10);
    expect(result.discountAmount).toBe(56000);
    expect(result.grandTotal).toBe(504000);
  });

  it('mengaplikasikan diskon 10% untuk 3 anak atau lebih', () => {
    // 24 sesi (3 anak @ 8 sesi) = 24 * 35.000 = 840.000, diskon 10% = 84.000, total = 756.000
    const result = calculateTutoringFee({
      totalSessions: 24,
      registeredChildrenCount: 3,
    });

    expect(result.discountPercentage).toBe(10);
    expect(result.discountAmount).toBe(84000);
    expect(result.grandTotal).toBe(756000);
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

describe('Dynamic Schedule & Level Pricing (ISTQB & TDD)', () => {
  describe('LEVEL_PRICING constants', () => {
    it('memiliki tarif yang tepat per jenjang', () => {
      expect(LEVEL_PRICING.tk).toBe(35000);
      expect(LEVEL_PRICING.sd).toBe(35000);
      expect(LEVEL_PRICING.smp).toBe(45000);
      expect(LEVEL_PRICING.sma).toBe(55000);
    });
  });

  describe('parseSessionsPerWeek', () => {
    it('menghitung 1 sesi/minggu untuk pilihan 1 hari (kurang dari 2 sesi)', () => {
      expect(parseSessionsPerWeek(['senin'])).toBe(1);
      expect(parseSessionsPerWeek(['Sabtu'])).toBe(1);
    });

    it('menghitung 2 sesi/minggu untuk pilihan 2 hari atau preset 2 hari (standar 2 sesi)', () => {
      expect(parseSessionsPerWeek(['senin', 'rabu'])).toBe(2);
      expect(parseSessionsPerWeek(['senin-rabu'])).toBe(2);
      expect(parseSessionsPerWeek(['Senin - Rabu'])).toBe(2);
      expect(parseSessionsPerWeek(['selasa-kamis'])).toBe(2);
      expect(parseSessionsPerWeek(['weekend'])).toBe(2);
    });

    it('menghitung > 2 sesi/minggu untuk pilihan 3 hari atau 4 hari (lebih dari 2 sesi)', () => {
      expect(parseSessionsPerWeek(['senin', 'rabu', 'jumat'])).toBe(3);
      expect(parseSessionsPerWeek(['senin', 'selasa', 'kamis', 'jumat'])).toBe(4);
      expect(parseSessionsPerWeek(['senin-rabu', 'selasa-kamis'])).toBe(4);
      expect(parseSessionsPerWeek(['senin-rabu', 'jumat'])).toBe(3);
    });

    it('menangani input array kosong secara aman', () => {
      expect(parseSessionsPerWeek([])).toBe(0);
    });
  });

  describe('calculateDynamicTutoringFee', () => {
    it('TC-REG-SCH-001 (EP-1): menghitung biaya bila dalam 1 minggu < 2 sesi (1 sesi/mgg = 4 sesi/bln)', () => {
      // SD @ 35k * 4 = 140.000
      const fee = calculateDynamicTutoringFee({
        level: 'sd',
        sessionsPerWeek: 1,
        hasSiblingDiscount: false,
      });

      expect(fee.sessionRate).toBe(35000);
      expect(fee.sessionsPerWeek).toBe(1);
      expect(fee.sessionsPerMonth).toBe(4);
      expect(fee.subtotal).toBe(140000);
      expect(fee.discountAmount).toBe(0);
      expect(fee.grandTotal).toBe(140000);
    });

    it('TC-REG-SCH-002 (EP-2): menghitung biaya bila dalam 1 minggu 2 sesi (standar 2 sesi/mgg = 8 sesi/bln)', () => {
      // SD @ 35k * 8 = 280.000
      const fee = calculateDynamicTutoringFee({
        level: 'sd',
        sessionsPerWeek: 2,
        hasSiblingDiscount: false,
      });

      expect(fee.sessionRate).toBe(35000);
      expect(fee.sessionsPerWeek).toBe(2);
      expect(fee.sessionsPerMonth).toBe(8);
      expect(fee.subtotal).toBe(280000);
      expect(fee.grandTotal).toBe(280000);
    });

    it('TC-REG-SCH-003 (EP-3): menghitung biaya bila dalam 1 minggu > 2 sesi (3 sesi = 12 sesi/bln, 4 sesi = 16 sesi/bln)', () => {
      // SMP @ 45k * 12 = 540.000
      const feeSMP = calculateDynamicTutoringFee({
        level: 'smp',
        sessionsPerWeek: 3,
        hasSiblingDiscount: false,
      });
      expect(feeSMP.sessionRate).toBe(45000);
      expect(feeSMP.sessionsPerMonth).toBe(12);
      expect(feeSMP.grandTotal).toBe(540000);

      // SMA @ 55k * 16 = 880.000
      const feeSMA = calculateDynamicTutoringFee({
        level: 'sma',
        sessionsPerWeek: 4,
        hasSiblingDiscount: false,
      });
      expect(feeSMA.sessionRate).toBe(55000);
      expect(feeSMA.sessionsPerMonth).toBe(16);
      expect(feeSMA.grandTotal).toBe(880000);
    });

    it('TC-REG-SCH-004: mengaplikasikan diskon saudara kandung 10% bila diaktifkan', () => {
      // SD @ 35k * 8 sesi = 280.000. Diskon 10% = 28.000. Total = 252.000
      const fee = calculateDynamicTutoringFee({
        level: 'sd',
        sessionsPerWeek: 2,
        hasSiblingDiscount: true,
      });

      expect(fee.subtotal).toBe(280000);
      expect(fee.discountPercentage).toBe(10);
      expect(fee.discountAmount).toBe(28000);
      expect(fee.grandTotal).toBe(252000);
    });

    it('menangani boundary value analysis (0 sesi atau level kosong)', () => {
      const fee = calculateDynamicTutoringFee({
        level: '',
        sessionsPerWeek: 0,
      });
      expect(fee.subtotal).toBe(0);
      expect(fee.grandTotal).toBe(0);
    });
  });
});
