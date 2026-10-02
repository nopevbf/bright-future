import { describe, it, expect } from 'vitest';
import {
  formatWhatsAppNumber,
  generateSessionReportWhatsAppUrl,
  generateInvoiceWhatsAppUrl,
  SessionReportParams,
} from './whatsapp';

describe('WhatsApp Click-to-Chat Generator (REQ-05)', () => {
  it('menstandarisasi nomor telepon lokal 08xx ke format internasional 628xx', () => {
    expect(formatWhatsAppNumber('0851-7323-0198')).toBe('6285173230198');
    expect(formatWhatsAppNumber('+62 812 3456 7890')).toBe('6281234567890');
    expect(formatWhatsAppNumber('6285173230198')).toBe('6285173230198');
  });

  it('menghasilkan tautan wa.me yang valid untuk draf laporan evaluasi 70 menit', () => {
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
    expect(url).toContain(encodeURIComponent('Rayhan Pratama'));
    expect(url).toContain(encodeURIComponent('70 Menit'));
    expect(url).toContain(encodeURIComponent('Pecahan Senilai'));
  });

  it('menghasilkan tautan wa.me untuk penagihan invoice SPP bulanan', () => {
    const url = generateInvoiceWhatsAppUrl({
      parentPhone: '08123456789',
      parentName: 'Bpk. Bambang',
      invoiceNumber: 'INV-2026-10-001',
      studentNames: ['Rayhan', 'Kayla'],
      totalSessions: 16,
      subtotal: 560000,
      discountAmount: 84000,
      grandTotal: 476000,
      dueDateStr: '10 Oktober 2026',
    });

    expect(url).toContain('https://wa.me/628123456789?text=');
    expect(url).toContain(encodeURIComponent('INV-2026-10-001'));
    expect(url).toContain(encodeURIComponent('Rp 476.000'));
    expect(url).toContain(encodeURIComponent('Diskon Saudara Kandung 15%'));
  });
});
