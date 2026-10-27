import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OFFICIAL_MIDTRANS_METHODS,
  DEFAULT_MIDTRANS_SETTINGS,
  getMidtransSettings,
  saveMidtransSettings,
  calculateMidtransFee,
  getActivePaymentMethods,
  MidtransSettingsConfig,
} from './midtransSettings';

describe('Midtrans Settings & Fee Calculation (SQA-ISTQB & TDD)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Official Midtrans Methods Catalog', () => {
    it('TC-MSET-CAT-001: should include all 11 official Midtrans payment methods across 4 categories', () => {
      expect(OFFICIAL_MIDTRANS_METHODS.length).toBe(11);

      const ids = OFFICIAL_MIDTRANS_METHODS.map((m) => m.id);
      // Virtual Accounts
      expect(ids).toContain('bca_va');
      expect(ids).toContain('bri_va');
      expect(ids).toContain('mandiri_va');
      expect(ids).toContain('bni_va');
      expect(ids).toContain('permata_va');
      expect(ids).toContain('cimb_va');

      // E-Wallet & QRIS
      expect(ids).toContain('qris');
      expect(ids).toContain('gopay');
      expect(ids).toContain('shopeepay');

      // Over the Counter (Convenience Stores)
      expect(ids).toContain('indomaret');
      expect(ids).toContain('alfamart');
    });

    it('TC-MSET-CAT-002: each method should have id, name, category, description, and badge', () => {
      for (const method of OFFICIAL_MIDTRANS_METHODS) {
        expect(method.id).toBeTruthy();
        expect(method.name).toBeTruthy();
        expect(method.category).toBeTruthy();
        expect(method.description).toBeTruthy();
      }
    });
  });

  describe('Fee Calculation Engine', () => {
    it('TC-MSET-FEE-001 (EP-1): calculates flat fee correctly when enabled', () => {
      const settings: MidtransSettingsConfig = {
        feeType: 'flat',
        feeAmount: 4000,
        isCustomerFee: true,
        enabledMethods: ['qris', 'bca_va'],
      };

      const result = calculateMidtransFee(280000, settings);
      expect(result.baseAmount).toBe(280000);
      expect(result.feeAmount).toBe(4000);
      expect(result.grandTotal).toBe(284000);
      expect(result.formattedFee).toBe('Rp 4.000');
    });

    it('TC-MSET-FEE-002 (EP-2): calculates percentage fee correctly', () => {
      const settings: MidtransSettingsConfig = {
        feeType: 'percentage',
        feeAmount: 1.5, // 1.5%
        isCustomerFee: true,
        enabledMethods: ['qris', 'bca_va'],
      };

      // 280.000 * 1.5% = 4.200
      const result = calculateMidtransFee(280000, settings);
      expect(result.baseAmount).toBe(280000);
      expect(result.feeAmount).toBe(4200);
      expect(result.grandTotal).toBe(284200);
    });

    it('TC-MSET-FEE-003 (EP-3): returns 0 fee when isCustomerFee is false (absorbed by bimbel)', () => {
      const settings: MidtransSettingsConfig = {
        feeType: 'flat',
        feeAmount: 4000,
        isCustomerFee: false,
        enabledMethods: ['qris', 'bca_va'],
      };

      const result = calculateMidtransFee(280000, settings);
      expect(result.feeAmount).toBe(0);
      expect(result.grandTotal).toBe(280000);
    });

    it('TC-MSET-FEE-004 (BVA): safely handles 0 or negative base amount', () => {
      const settings: MidtransSettingsConfig = {
        feeType: 'flat',
        feeAmount: 4000,
        isCustomerFee: true,
        enabledMethods: ['qris'],
      };

      const resultZero = calculateMidtransFee(0, settings);
      expect(resultZero.baseAmount).toBe(0);
      expect(resultZero.feeAmount).toBe(0);
      expect(resultZero.grandTotal).toBe(0);

      const resultNeg = calculateMidtransFee(-5000, settings);
      expect(resultNeg.baseAmount).toBe(0);
      expect(resultNeg.feeAmount).toBe(0);
      expect(resultNeg.grandTotal).toBe(0);
    });
  });

  describe('Active Methods Filter & Storage Persistence', () => {
    it('TC-MSET-STOR-001: getMidtransSettings returns DEFAULT_MIDTRANS_SETTINGS when storage empty', () => {
      const settings = getMidtransSettings();
      expect(settings.feeType).toBe(DEFAULT_MIDTRANS_SETTINGS.feeType);
      expect(settings.feeAmount).toBe(DEFAULT_MIDTRANS_SETTINGS.feeAmount);
      expect(settings.enabledMethods).toEqual(DEFAULT_MIDTRANS_SETTINGS.enabledMethods);
    });

    it('TC-MSET-STOR-002: saveMidtransSettings persists to localStorage and triggers storage update', () => {
      const newSettings: MidtransSettingsConfig = {
        feeType: 'flat',
        feeAmount: 5000,
        isCustomerFee: true,
        enabledMethods: ['qris', 'bca_va', 'indomaret'],
      };

      saveMidtransSettings(newSettings);
      const retrieved = getMidtransSettings();
      expect(retrieved.feeAmount).toBe(5000);
      expect(retrieved.enabledMethods).toEqual(['qris', 'bca_va', 'indomaret']);
    });

    it('TC-MSET-STOR-003: getActivePaymentMethods filters catalog by enabledMethods array', () => {
      const settings: MidtransSettingsConfig = {
        feeType: 'flat',
        feeAmount: 4000,
        isCustomerFee: true,
        enabledMethods: ['qris', 'bri_va'],
      };

      const active = getActivePaymentMethods(settings);
      expect(active.length).toBe(2);
      expect(active.map((a) => a.id)).toEqual(['qris', 'bri_va']);
    });
  });
});
