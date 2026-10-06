import { describe, it, expect, vi } from 'vitest';
import {
  cleanNumericOnly,
  normalizeIndonesianPhone,
  isSamePhoneNumber,
  validateIndonesianWhatsappFormat,
  checkStudentWhatsappDuplicate,
} from './whatsappValidation';

describe('WhatsApp Validation for Student Registration Form', () => {
  describe('cleanNumericOnly (Tidak menerima huruf)', () => {
    it('removes all alphabet characters from input', () => {
      expect(cleanNumericOnly('0812abc345def')).toBe('0812345');
      expect(cleanNumericOnly('Nomor WA: 0851-7323-0198')).toBe('085173230198');
      expect(cleanNumericOnly('HelloWorld')).toBe('');
    });

    it('removes special characters and whitespace', () => {
      expect(cleanNumericOnly('+62 812-3456-7890')).toBe('6281234567890');
      expect(cleanNumericOnly('0812 3456 7890')).toBe('081234567890');
    });

    it('handles empty input gracefully', () => {
      expect(cleanNumericOnly('')).toBe('');
    });
  });

  describe('normalizeIndonesianPhone', () => {
    it('normalizes 62 prefix to 08', () => {
      expect(normalizeIndonesianPhone('628123456789')).toBe('08123456789');
      expect(normalizeIndonesianPhone('+628123456789')).toBe('08123456789');
    });

    it('normalizes 8 prefix to 08', () => {
      expect(normalizeIndonesianPhone('81234567890')).toBe('081234567890');
    });

    it('keeps 08 prefix intact', () => {
      expect(normalizeIndonesianPhone('085173230198')).toBe('085173230198');
    });
  });

  describe('isSamePhoneNumber', () => {
    it('identifies identical numbers in different formats', () => {
      expect(isSamePhoneNumber('085173230198', '6285173230198')).toBe(true);
      expect(isSamePhoneNumber('0851-7323-0198', '085173230198')).toBe(true);
      expect(isSamePhoneNumber('+62 851 7323 0198', '085173230198')).toBe(true);
    });

    it('returns false for different numbers', () => {
      expect(isSamePhoneNumber('085173230198', '081228945671')).toBe(false);
    });
  });

  describe('validateIndonesianWhatsappFormat', () => {
    it('accepts valid 10-15 digit Indonesian WhatsApp numbers', () => {
      expect(validateIndonesianWhatsappFormat('085173230198').isValid).toBe(true);
      expect(validateIndonesianWhatsappFormat('6281234567890').isValid).toBe(true);
      expect(validateIndonesianWhatsappFormat('08123456789').isValid).toBe(true);
    });

    it('rejects numbers shorter than 10 digits', () => {
      const result = validateIndonesianWhatsappFormat('08123456');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('terlalu pendek');
    });

    it('rejects numbers not starting with 08 or 628', () => {
      const result = validateIndonesianWhatsappFormat('0217654321');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('harus diawali 08');
    });

    it('rejects empty string', () => {
      expect(validateIndonesianWhatsappFormat('').isValid).toBe(false);
    });
  });

  describe('checkStudentWhatsappDuplicate', () => {
    it('detects existing number from system database or Firestore', async () => {
      const result = await checkStudentWhatsappDuplicate('085173230198');
      expect(result.isDuplicate).toBe(true);
      expect(result.studentName).toBeTruthy();
    });

    it('detects existing number even when formatted with +62', async () => {
      const result = await checkStudentWhatsappDuplicate('+62 812-2894-5671');
      expect(result.isDuplicate).toBe(true);
      expect(result.studentName).toBe('Michelle Gunawan');
    });

    it('returns isDuplicate false for an unregistered phone number', async () => {
      const result = await checkStudentWhatsappDuplicate('089999988887');
      expect(result.isDuplicate).toBe(false);
    });
  });
});
