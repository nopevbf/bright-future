import { describe, it, expect } from 'vitest';
import {
  formatWhatsAppNumber,
  generateSessionReportWhatsAppUrl,
  generateInvoiceWhatsAppUrl,
  SessionReportParams,
} from './whatsapp';

describe('WhatsApp Click-to-Chat Generator (REQ-05 & ISTQB Encoding Standards)', () => {
  it('menstandarisasi nomor telepon lokal 08xx ke format internasional 628xx', () => {
    expect(formatWhatsAppNumber('0851-7323-0198')).toBe('6285173230198');
    expect(formatWhatsAppNumber('+62 812 3456 7890')).toBe('6281234567890');
    expect(formatWhatsAppNumber('6285173230198')).toBe('6285173230198');
  });

  it('TC-WA-ENC-001 (Happy Path): menghasilkan tautan wa.me yang valid dan bebas dari karakter rusak , ZWJ, dan VS16', () => {
    const report: SessionReportParams = {
      parentPhone: '085173230198',
      parentName: 'Ibu Ratna Dewi',
      studentName: 'Rayhan Pratama',
      tutorName: 'Kak Anindya',
      dateStr: '2 Oktober 2026',
      durationMinutes: 70,
      topic: 'Pecahan Senilai & Soal Cerita HOTS',
      affectiveScores: {
        fokus: 5,
        dayaJuang: 4,
        kerapian: 5,
        adab: 5,
      },
      tutorNotes: 'Rayhan sangat antusias berlatih tanpa gawai (kantong anti-distraksi sukses).',
    };

    const url = generateSessionReportWhatsAppUrl(report);
    expect(url).toContain('https://wa.me/6285173230198?text=');
    
    const decodedMessage = decodeURIComponent(url.split('?text=')[1]);
    // Tidak boleh mengandung karakter replacement  (U+FFFD)
    expect(decodedMessage).not.toContain('\uFFFD');
    // checked via \uFFFD below
    // Tidak boleh mengandung Zero Width Joiner (ZWJ) yang pecah jadi  di WA Web
    expect(decodedMessage).not.toContain('\u200D');
    // Tidak boleh mengandung Variation Selector (VS16) yang pecah jadi  di WA Web
    expect(decodedMessage).not.toContain('\uFE0F');

    expect(decodedMessage).toContain('Rayhan Pratama');
    expect(decodedMessage).toContain('70 Menit');
    expect(decodedMessage).toContain('Pecahan Senilai');
  });

  it('TC-WA-ENC-002 (Edge Case - Dirty Inputs): membersihkan input yang mengandung karakter  atau mojibake', () => {
    const dirtyReport: SessionReportParams = {
      parentPhone: '085173230198',
      parentName: 'Ibu Ratna  Dewi',
      studentName: 'Rayhan â€œKusumaâ€  ',
      tutorName: 'Kak Anindya S.Pd. ',
      dateStr: '2 â€“ 3 Oktober 2026',
      durationMinutes: 70,
      topic: 'IPAS â€” Rotasi Bumi ',
      affectiveScores: { fokus: 5, dayaJuang: 4, kerapian: 5, adab: 5 },
      tutorNotes: 'Catatan afektif: â€œSangat mandiri 5.0 â˜…â€ ',
    };

    const url = generateSessionReportWhatsAppUrl(dirtyReport);
    const decodedMessage = decodeURIComponent(url.split('?text=')[1]);

    // checked via \uFFFD below
    expect(decodedMessage).not.toContain('\uFFFD');
    expect(decodedMessage).not.toContain('â€œ');
    expect(decodedMessage).not.toContain('â€”');
    expect(decodedMessage).toContain('“Kusuma”');
    expect(decodedMessage).toContain('IPAS — Rotasi Bumi');
  });

  it('TC-WA-ENC-003: menghasilkan tautan wa.me tagihan SPP bulanan bebas karakter rusak , ZWJ, dan VS16', () => {
    const url = generateInvoiceWhatsAppUrl({
      parentPhone: '08123456789',
      parentName: 'Bpk. Bambang',
      invoiceNumber: 'INV-2026-10-001',
      studentNames: ['Rayhan ', 'Kayla'],
      totalSessions: 16,
      subtotal: 560000,
      discountAmount: 84000,
      grandTotal: 476000,
      dueDateStr: '10 Oktober 2026',
    });

    const decodedMessage = decodeURIComponent(url.split('?text=')[1]);
    // checked via \uFFFD below
    expect(decodedMessage).not.toContain('\uFFFD');
    expect(decodedMessage).not.toContain('\u200D');
    expect(decodedMessage).not.toContain('\uFE0F');
    expect(decodedMessage).toContain('INV-2026-10-001');
    expect(decodedMessage).toContain('Rp 476.000');
    expect(decodedMessage).toContain('Diskon Saudara Kandung 15%');
  });
});
