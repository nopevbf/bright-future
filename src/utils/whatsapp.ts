import { formatRupiah } from './pricing';

export interface AffectiveScores {
  fokus: number;
  dayaJuang: number;
  kerapian: number;
  adab: number;
}

export interface SessionReportParams {
  parentPhone: string;
  parentName: string;
  studentName: string;
  tutorName: string;
  dateStr: string;
  durationMinutes: number;
  topic: string;
  affectiveScores: AffectiveScores;
  tutorNotes: string;
}

export interface InvoiceReportParams {
  parentPhone: string;
  parentName: string;
  invoiceNumber: string;
  studentNames: string[];
  totalSessions: number;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  dueDateStr: string;
}

/**
 * Menstandarisasi nomor HP/WA ke format internasional (misal 0851xxx -> 62851xxx).
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Buang karakter spasi, strip, tanda kurung, dsb.
  let cleaned = phone.replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Membuat tautan wa.me untuk draf laporan berkala sesi 70 menit tatap muka meja belajar.
 */
export function generateSessionReportWhatsAppUrl(params: SessionReportParams): string {
  const cleanPhone = formatWhatsAppNumber(params.parentPhone);

  const starRating = (score: number) => '⭐'.repeat(Math.max(1, Math.min(5, score)));

  const message = [
    `Assalamu'alaikum / Selamat Pagi/Sore ${params.parentName},`,
    '',
    `Berikut laporan berkala sesi belajar Bright Future house-to-house:`,
    `🧑‍🎓 *Siswa:* ${params.studentName}`,
    `👩‍🏫 *Tutor:* ${params.tutorName}`,
    `🗓️ *Waktu:* ${params.dateStr} (Durasi: ${params.durationMinutes} Menit Tatap Muka Murni)`,
    `📖 *Materi Pokok:* ${params.topic}`,
    '',
    `*Evaluasi 4 Pilar Karakter Meja Belajar:*`,
    `• Fokus & Konsentrasi: ${starRating(params.affectiveScores.fokus)} (${params.affectiveScores.fokus}/5)`,
    `• Daya Juang Soal Latihan: ${starRating(params.affectiveScores.dayaJuang)} (${params.affectiveScores.dayaJuang}/5)`,
    `• Kerapian Catatan/LKPD: ${starRating(params.affectiveScores.kerapian)} (${params.affectiveScores.kerapian}/5)`,
    `• Adab & Sikap Belajar: ${starRating(params.affectiveScores.adab)} (${params.affectiveScores.adab}/5)`,
    '',
    `📝 *Catatan Tutor:*`,
    `"${params.tutorNotes}"`,
    '',
    `Terima kasih atas kepercayaan Ayah/Bunda mendampingi ananda belajar bersama Bright Future Magelang.`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Membuat tautan wa.me untuk draf notifikasi tagihan SPP bulanan.
 */
export function generateInvoiceWhatsAppUrl(params: InvoiceReportParams): string {
  const cleanPhone = formatWhatsAppNumber(params.parentPhone);
  const studentsText = params.studentNames.join(' & ');

  const discountLine =
    params.discountAmount > 0
      ? `• Diskon Saudara Kandung 15%: -${formatRupiah(params.discountAmount)}\n`
      : '';

  const message = [
    `Yth. ${params.parentName},`,
    '',
    `Kami sampaikan invoice tagihan bimbingan belajar Bright Future:`,
    `📄 *No. Invoice:* ${params.invoiceNumber}`,
    `👶 *Siswa:* ${studentsText}`,
    `🎯 *Total Sesi:* ${params.totalSessions} sesi bimbingan`,
    `💵 *Subtotal:* ${formatRupiah(params.subtotal)}`,
    discountLine +
    `⭐ *Total Tagihan:* *${formatRupiah(params.grandTotal)}*`,
    `⏰ *Batas Pembayaran:* ${params.dueDateStr}`,
    '',
    `Pembayaran dapat dilakukan melalui portal orang tua (Midtrans Snap: QRIS, Transfer VA BCA/Mandiri/BNI).`,
    `Terima kasih atas kerja samanya. 🙏`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
