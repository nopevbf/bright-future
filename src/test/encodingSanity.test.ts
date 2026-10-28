import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { cleanMojibake, sanitizeWhatsAppText } from '../utils/textEncoding';

describe('Encoding & Mojibake Sanity Suite (TDD - Eliminating Corrupted Characters)', () => {
  describe('cleanMojibake & sanitizeWhatsAppText Utility', () => {
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

    it('TC-ENC-007 (Replacement Character & WhatsApp Sanitization): should strip  (\\uFFFD), ZWJ (\\u200D), and VS16 (\\uFE0F)', () => {
      const corruptedInput = 'Siswa: Rayhan  â€” Catatan: â€œBagusâ€  🗓️ 🧑‍🎓 👩‍🏫 👨‍👩‍👧';
      const cleaned = sanitizeWhatsAppText(corruptedInput);
      expect(cleaned).not.toContain('\uFFFD');
      // checked via \uFFFD below
      expect(cleaned).not.toContain('\u200D'); // No ZWJ
      expect(cleaned).not.toContain('\uFE0F'); // No VS16
      expect(cleaned).toContain('Siswa: Rayhan — Catatan: “Bagus”');
    });

    it('TC-ENC-009: should sanitize problematic emojis into clean bullet points • and strip  characters', () => {
      const userExample = 'KONFIRMASI PENUGASAN TUTOR BRIGHT FUTURE Halo Bapak/Ibu Monica, Kabar baik! Kami telah memasangkan tutor terdekat & terakreditasi untuk mendampingi bimbingan belajar Ananda Siswa Tes: \uFFFD Nama Tutor: Monica Yuliana \uFFFD Latar Belakang: S1 \uFFFD Keahlian: SD \uFFFD Jadwal Kunjungan: senin, kamis, jumat, rabu \uFFFD Alamat Kunjungan: Kajoran Tutor kami akan segera menghubungi Bapak/Ibu untuk koordinasi sesi perdana dengan SOP 70 Menit Meja Belajar Bebas Distraksi. Terima kasih telah mempercayakan pendidikan ananda bersama Bright Future Magelang! \uFFFD';
      const cleaned = sanitizeWhatsAppText(userExample);
      expect(cleaned).not.toContain('\uFFFD');

      const emojiTemplate = '🎓 *Nama Tutor:* Monica\n🏫 *Latar Belakang:* S1\n📖 *Keahlian:* SD\n⏰ *Jadwal Kunjungan:* Senin\n📍 *Alamat Kunjungan:* Kajoran\nTerima kasih! ✨';
      const safeSanitized = sanitizeWhatsAppText(emojiTemplate);
      expect(safeSanitized).not.toContain('🎓');
      expect(safeSanitized).not.toContain('🏫');
      expect(safeSanitized).not.toContain('📖');
      expect(safeSanitized).not.toContain('⏰');
      expect(safeSanitized).not.toContain('📍');
      expect(safeSanitized).not.toContain('✨');
      expect(safeSanitized).toContain('• *Nama Tutor:* Monica');
      expect(safeSanitized).toContain('• *Latar Belakang:* S1');
      expect(safeSanitized).toContain('• *Keahlian:* SD');
      expect(safeSanitized).toContain('• *Jadwal Kunjungan:* Senin');
      expect(safeSanitized).toContain('• *Alamat Kunjungan:* Kajoran');
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
      'src/utils/tutorDispatch.ts',
      'src/utils/tutorManagement.ts',
      'src/components/tutor/TutorEvaluationWhatsApp.tsx',
      'vite.config.ts',
    ];

    const corruptedPatterns = [
      'â€œ', 'â€ ', 'â€”', 'â€“', 'âœ“', 'â˜…', 'â€¢', 'ðŸ', 'â­ ', 'â °',
      'Ã—', 'Ã', '\uFFFD',
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

    it('TC-ENC-008: WhatsApp message generator files must not contain composite ZWJ or VS16 that render as  in WA Web', () => {
      const waFiles = [
        'src/utils/whatsapp.ts',
        'src/utils/tutorDispatch.ts',
        'src/utils/tutorManagement.ts',
        'src/components/tutor/TutorEvaluationWhatsApp.tsx',
      ];

      const brokenCodePoints = [
        { name: 'ZWJ (\\u200D)', code: '\u200D' },
        { name: 'VS16 (\\uFE0F)', code: '\uFE0F' },
      ];

      const violations: { file: string; issue: string }[] = [];

      for (const relPath of waFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          for (const bp of brokenCodePoints) {
            if (content.includes(bp.code)) {
              violations.push({ file: relPath, issue: bp.name });
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
