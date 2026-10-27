import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isRegistrationExpired,
  isInvoiceExpired,
  detectExpiredRegistrationPairs,
  REGISTRATION_EXPIRY_MS,
  purgeExpiredRegistrationsAndInvoices,
} from './registrationExpiry';
import { FirestoreRegistrationDoc, FirestoreInvoiceDoc } from '../firebase';

describe('SQA-ISTQB & TDD: Registration & Invoice 24-Hour Expiry Logic', () => {
  const baseTime = new Date('2026-10-27T12:00:00.000Z');

  // Helper untuk membuat timestamp relatif terhadap baseTime
  const makeRelativeIso = (offsetMs: number) => {
    return new Date(baseTime.getTime() + offsetMs).toISOString();
  };

  describe('Boundary Value Analysis (BVA) for isRegistrationExpired', () => {
    // 24 jam dalam milidetik
    const H24 = 24 * 60 * 60 * 1000;

    it('BVA-01: registration created 23h 59m 59s ago with pending status should NOT be expired', () => {
      const reg: FirestoreRegistrationDoc = {
        studentId: 'BF-202610-001',
        studentName: 'Siswa Satu',
        parentName: 'Orang Tua Satu',
        whatsapp: '081234567890',
        homeAddress: 'Alamat 1',
        level: 'sd',
        selectedSchedule: ['Senin'],
        totalSessions: 8,
        appliedDiscount: 0,
        totalAmount: 280000,
        invoiceNumber: 'INV-202610-001',
        paymentMethod: 'midtrans',
        paymentStatus: 'pending',
        createdAt: makeRelativeIso(-H24 + 1000), // 23h 59m 59s ago
      };

      expect(isRegistrationExpired(reg, baseTime)).toBe(false);
    });

    it('BVA-02: registration created exactly 24h 00m 00s ago with pending status SHOULD be expired', () => {
      const reg: FirestoreRegistrationDoc = {
        studentId: 'BF-202610-002',
        studentName: 'Siswa Dua',
        parentName: 'Orang Tua Dua',
        whatsapp: '081234567891',
        homeAddress: 'Alamat 2',
        level: 'sd',
        selectedSchedule: ['Senin'],
        totalSessions: 8,
        appliedDiscount: 0,
        totalAmount: 280000,
        invoiceNumber: 'INV-202610-002',
        paymentMethod: 'midtrans',
        paymentStatus: 'pending',
        createdAt: makeRelativeIso(-H24), // Exactly 24h ago
      };

      expect(isRegistrationExpired(reg, baseTime)).toBe(true);
    });

    it('BVA-03: registration created 24h 00m 01s ago with pending status SHOULD be expired', () => {
      const reg: FirestoreRegistrationDoc = {
        studentId: 'BF-202610-003',
        studentName: 'Siswa Tiga',
        parentName: 'Orang Tua Tiga',
        whatsapp: '081234567892',
        homeAddress: 'Alamat 3',
        level: 'sd',
        selectedSchedule: ['Senin'],
        totalSessions: 8,
        appliedDiscount: 0,
        totalAmount: 280000,
        invoiceNumber: 'INV-202610-003',
        paymentMethod: 'midtrans',
        paymentStatus: 'pending',
        createdAt: makeRelativeIso(-H24 - 1000), // 24h 00m 01s ago
      };

      expect(isRegistrationExpired(reg, baseTime)).toBe(true);
    });
  });

  describe('Equivalence Partitioning (EP) for Registration Status', () => {
    const H48 = 48 * 60 * 60 * 1000;

    it('EP-01: registration older than 24h with status "paid" should NOT be expired', () => {
      const reg: FirestoreRegistrationDoc = {
        studentId: 'BF-202610-004',
        studentName: 'Siswa Empat',
        parentName: 'Orang Tua Empat',
        whatsapp: '081234567893',
        homeAddress: 'Alamat 4',
        level: 'smp',
        selectedSchedule: ['Selasa'],
        totalSessions: 8,
        appliedDiscount: 0,
        totalAmount: 360000,
        invoiceNumber: 'INV-202610-004',
        paymentMethod: 'midtrans',
        paymentStatus: 'paid', // sudah bayar
        createdAt: makeRelativeIso(-H48),
      };

      expect(isRegistrationExpired(reg, baseTime)).toBe(false);
    });

    it('EP-02: registration older than 24h with status "verified" should NOT be expired', () => {
      const reg: FirestoreRegistrationDoc = {
        studentId: 'BF-202610-005',
        studentName: 'Siswa Lima',
        parentName: 'Orang Tua Lima',
        whatsapp: '081234567894',
        homeAddress: 'Alamat 5',
        level: 'sma',
        selectedSchedule: ['Rabu'],
        totalSessions: 8,
        appliedDiscount: 0,
        totalAmount: 440000,
        invoiceNumber: 'INV-202610-005',
        paymentMethod: 'manual_transfer',
        paymentStatus: 'verified', // verifikasi admin
        createdAt: makeRelativeIso(-H48),
      };

      expect(isRegistrationExpired(reg, baseTime)).toBe(false);
    });

    it('EP-03: registration without createdAt or invalid date should NOT be considered expired (safety fallback)', () => {
      const reg: FirestoreRegistrationDoc = {
        studentId: 'BF-202610-006',
        studentName: 'Siswa Enam',
        parentName: 'Orang Tua Enam',
        whatsapp: '081234567895',
        homeAddress: 'Alamat 6',
        level: 'sd',
        selectedSchedule: ['Kamis'],
        totalSessions: 8,
        appliedDiscount: 0,
        totalAmount: 280000,
        invoiceNumber: 'INV-202610-006',
        paymentMethod: 'midtrans',
        paymentStatus: 'pending',
        createdAt: '', // empty
      };

      expect(isRegistrationExpired(reg, baseTime)).toBe(false);
    });
  });

  describe('Invoice Expiry Logic (isInvoiceExpired)', () => {
    const H24 = 24 * 60 * 60 * 1000;

    it('should mark PENDING invoice older than 24h as expired', () => {
      const inv: FirestoreInvoiceDoc = {
        inv: 'INV-202610-007',
        parent: 'Orang Tua Tujuh',
        studentName: 'Siswa Tujuh',
        packageType: 'paket',
        package: 'Paket SD (8 Sesi)',
        channel: 'Midtrans QRIS',
        amount: 280000,
        status: 'PENDING',
        date: '26 Oktober 2026',
        createdAt: makeRelativeIso(-H24 - 5000),
      };

      expect(isInvoiceExpired(inv, baseTime)).toBe(true);
    });

    it('should NOT mark LUNAS invoice older than 24h as expired', () => {
      const inv: FirestoreInvoiceDoc = {
        inv: 'INV-202610-008',
        parent: 'Orang Tua Delapan',
        studentName: 'Siswa Delapan',
        packageType: 'paket',
        package: 'Paket SD (8 Sesi)',
        channel: 'Midtrans QRIS',
        amount: 280000,
        status: 'LUNAS',
        date: '25 Oktober 2026',
        createdAt: makeRelativeIso(-H24 - 100000),
      };

      expect(isInvoiceExpired(inv, baseTime)).toBe(false);
    });
  });

  describe('detectExpiredRegistrationPairs', () => {
    const H24 = 24 * 60 * 60 * 1000;

    it('correctly separates active and expired registrations and paired invoices', () => {
      const expiredReg: FirestoreRegistrationDoc = {
        studentId: 'BF-202610-EXP',
        studentName: 'Siswa Expired',
        parentName: 'Ortu Expired',
        whatsapp: '081200000001',
        homeAddress: 'Alamat Exp',
        level: 'sd',
        selectedSchedule: ['Senin'],
        totalSessions: 8,
        appliedDiscount: 0,
        totalAmount: 280000,
        invoiceNumber: 'INV-202610-EXP',
        paymentMethod: 'midtrans',
        paymentStatus: 'pending',
        createdAt: makeRelativeIso(-H24 - 1000),
      };

      const activeReg: FirestoreRegistrationDoc = {
        studentId: 'BF-202610-ACT',
        studentName: 'Siswa Aktif',
        parentName: 'Ortu Aktif',
        whatsapp: '081200000002',
        homeAddress: 'Alamat Aktif',
        level: 'sd',
        selectedSchedule: ['Selasa'],
        totalSessions: 8,
        appliedDiscount: 0,
        totalAmount: 280000,
        invoiceNumber: 'INV-202610-ACT',
        paymentMethod: 'midtrans',
        paymentStatus: 'pending',
        createdAt: makeRelativeIso(-10000), // Baru dibuat 10 detik lalu
      };

      const expiredInv: FirestoreInvoiceDoc = {
        inv: 'INV-202610-EXP',
        parent: 'Ortu Expired',
        studentName: 'Siswa Expired',
        packageType: 'paket',
        package: 'Paket SD (8 Sesi)',
        channel: 'Midtrans QRIS',
        amount: 280000,
        status: 'PENDING',
        date: '26 Oktober 2026',
        createdAt: makeRelativeIso(-H24 - 1000),
      };

      const activeInv: FirestoreInvoiceDoc = {
        inv: 'INV-202610-ACT',
        parent: 'Ortu Aktif',
        studentName: 'Siswa Aktif',
        packageType: 'paket',
        package: 'Paket SD (8 Sesi)',
        channel: 'Midtrans QRIS',
        amount: 280000,
        status: 'PENDING',
        date: '27 Oktober 2026',
        createdAt: makeRelativeIso(-10000),
      };

      const result = detectExpiredRegistrationPairs(
        [expiredReg, activeReg],
        [expiredInv, activeInv],
        baseTime
      );

      expect(result.expiredRegistrations.map((r) => r.studentId)).toEqual(['BF-202610-EXP']);
      expect(result.activeRegistrations.map((r) => r.studentId)).toEqual(['BF-202610-ACT']);
      expect(result.expiredInvoiceIds).toContain('INV-202610-EXP');
      expect(result.activeInvoices.map((i) => i.inv)).toEqual(['INV-202610-ACT']);
    });
  });

  describe('purgeExpiredRegistrationsAndInvoices', () => {
    it('calls delete callbacks for each expired registration and invoice', async () => {
      const expiredReg: FirestoreRegistrationDoc = {
        studentId: 'BF-202610-EXP-PURGE',
        studentName: 'Siswa Purge',
        parentName: 'Ortu Purge',
        whatsapp: '081200000003',
        homeAddress: 'Alamat Purge',
        level: 'sd',
        selectedSchedule: ['Senin'],
        totalSessions: 8,
        appliedDiscount: 0,
        totalAmount: 280000,
        invoiceNumber: 'INV-202610-EXP-PURGE',
        paymentMethod: 'midtrans',
        paymentStatus: 'pending',
        createdAt: makeRelativeIso(-30 * 60 * 60 * 1000), // 30 jam lalu
      };

      const expiredInv: FirestoreInvoiceDoc = {
        inv: 'INV-202610-EXP-PURGE',
        parent: 'Ortu Purge',
        packageType: 'paket',
        package: 'Paket SD (8 Sesi)',
        channel: 'Midtrans QRIS',
        amount: 280000,
        status: 'PENDING',
        date: '25 Oktober 2026',
        createdAt: makeRelativeIso(-30 * 60 * 60 * 1000),
      };

      const deleteRegMock = vi.fn().mockResolvedValue(undefined);
      const deleteInvMock = vi.fn().mockResolvedValue(undefined);

      const summary = await purgeExpiredRegistrationsAndInvoices({
        registrations: [expiredReg],
        invoices: [expiredInv],
        currentTime: baseTime,
        deleteRegistration: deleteRegMock,
        deleteInvoice: deleteInvMock,
      });

      expect(deleteRegMock).toHaveBeenCalledWith('BF-202610-EXP-PURGE');
      expect(deleteInvMock).toHaveBeenCalledWith('INV-202610-EXP-PURGE');
      expect(summary.deletedRegIds).toEqual(['BF-202610-EXP-PURGE']);
      expect(summary.deletedInvIds).toEqual(['INV-202610-EXP-PURGE']);
    });
  });
});
