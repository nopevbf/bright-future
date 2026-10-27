import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { cleanMojibake } from '../utils/textEncoding';

describe('Encoding & Mojibake Sanity Suite (TDD - Eliminating Corrupted Characters)', () => {
  describe('cleanMojibake Utility', () => {
    it('TC-ENC-001: should fix quotation marks â€œ and â€  / â€ into proper typography', () => {
      const input = 'â€œRayhan sangat antusias membuktikan bayangan tongkat.â€ ';
      const result = cleanMojibake(input);
      expect(result).toBe('“Rayhan sangat antusias membuktikan bayangan tongkat.”');
    });

    it('TC-ENC-002: should fix em-dash â€” and en-dash â€“ and checkmark âœ“ and star â˜…', () => {
      const input = 'SD â€” IPAS (13:30 â€“ 14:40 WIB) âœ“ Akun Aktif 5.0 â˜…';
      const result = cleanMojibake(input);
      expect(result).toBe('SD — IPAS (13:30 – 14:40 WIB) ✓ Akun Aktif 5.0 ★');
    });

    it('TC-ENC-003 (Edge Case): should safely handle empty string, plain text, and non-corrupted text without changes', () => {
      expect(cleanMojibake('')).toBe('');
      expect(cleanMojibake('Belajar Menyenangkan')).toBe('Belajar Menyenangkan');
      expect(cleanMojibake('“Sudah Benar” — Tetap Benar ✓')).toBe('“Sudah Benar” — Tetap Benar ✓');
    });

    it('TC-ENC-004 (Edge Case): should handle null or undefined safely if passed as non-string', () => {
      // @ts-expect-error testing invalid type tolerance
      expect(cleanMojibake(null)).toBe('');
      // @ts-expect-error testing invalid type tolerance
      expect(cleanMojibake(undefined)).toBe('');
    });

    it('TC-ENC-006: should fix multiplication sign mojibake Ã— into × and Latin-1 accented mojibake', () => {
      const input = '(4 Ã— Rp 35.000) dan cafÃ©';
      const result = cleanMojibake(input);
      expect(result).toBe('(4 × Rp 35.000) dan café');
    });
  });

  describe('Source Files Sanity Check', () => {
    const targetFiles = [
      'src/components/AdminDashboard.tsx',
      'src/components/ParentDashboard.tsx',
      'src/components/admin/RegistrationSlipModal.tsx',
      'src/firebase.ts',
      'src/utils/generateInvoicePdf.ts',
      'src/utils/whatsapp.ts',
      'vite.config.ts',
    ];

    const corruptedPatterns = [
      'â€œ', // Left double quotation mark
      'â€ ', // Right double quotation mark
      'â€”', // Em dash
      'â€“', // En dash
      'âœ“', // Check mark
      'â˜…', // Star
      'â€¢', // Bullet
      'ðŸ',  // Corrupted UTF-8 4-byte emoji prefix
      'â­ ', // Corrupted star emoji
      'â °', // Corrupted clock emoji
      'Ã—',  // Corrupted multiplication sign (×)
      'Ã',   // Corrupted Latin-1 / UTF-8 two-byte prefix
    ];

    it('TC-ENC-005: should not contain any corrupted mojibake patterns in target source files', () => {
      const violations: { file: string; pattern: string }[] = [];

      for (const relPath of targetFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          for (const pattern of corruptedPatterns) {
            if (content.includes(pattern)) {
              violations.push({ file: relPath, pattern });
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
