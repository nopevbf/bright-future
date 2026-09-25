import jsPDF from 'jspdf';
import { AdminInvoiceItem } from '../components/AdminDashboard';

export const generateAndDownloadInvoicePdf = (invoice: AdminInvoiceItem) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background banner
  doc.setFillColor(40, 66, 48); // #284230 Brand Green
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BRIGHT FUTURE LEARNING CENTER', 15, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 235, 206);
  doc.text('Lembaga Bimbingan Belajar Privat House-to-House • Kab. Magelang', 15, 23);
  doc.text('Kec. Secang, Mungkid, Muntilan & Sekitarnya | WhatsApp: 0851-7323-0198', 15, 29);

  // INVOICE Title on right side of banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('INVOICE TAGIHAN', pageWidth - 15, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(239, 201, 174);
  doc.text(`No: ${invoice.inv}`, pageWidth - 15, 26, { align: 'right' });

  // Reset text color for body
  doc.setTextColor(42, 40, 35);

  // Meta Box (Tanggal, Status, Kanal Bayar)
  const metaBoxY = 42;
  const channelText = invoice.channel || 'Midtrans Gateway';
  const channelMaxWidth = 55; // mm
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const channelLines: string[] = doc.splitTextToSize(channelText, channelMaxWidth);

  // Dynamic height if channel text wraps to 2+ lines
  const metaBoxHeight = Math.max(24, 18 + channelLines.length * 4.5);

  doc.setFillColor(250, 247, 241);
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(15, metaBoxY, pageWidth - 30, metaBoxHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(107, 103, 95);
  doc.setFont('helvetica', 'normal');
  doc.text('TANGGAL TERBIT', 20, metaBoxY + 7);
  doc.text('STATUS PEMBAYARAN', 72, metaBoxY + 7);
  doc.text('KANAL PEMBAYARAN', 135, metaBoxY + 7);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 40, 35);
  doc.text(invoice.date || 'Hari Ini', 20, metaBoxY + 14);

  // Status with colored indicator
  if (invoice.status === 'LUNAS') {
    doc.setTextColor(40, 66, 48); // Green
    doc.text('LUNAS (VERIFIED)', 72, metaBoxY + 14);
  } else if (invoice.status.includes('TERLAMBAT')) {
    doc.setTextColor(180, 40, 40); // Red
    doc.text(invoice.status, 72, metaBoxY + 14);
  } else {
    doc.setTextColor(193, 104, 63); // Amber
    doc.text('MENUNGGU PEMBAYARAN', 72, metaBoxY + 14);
  }

  // Kanal Pembayaran: automatically wrap to new lines if text is long
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 40, 35);
  doc.text(channelLines, 135, metaBoxY + 14, { lineHeightFactor: 1.25 });

  // Ditagihkan Kepada (Bill To) - dynamically offset by metaBoxHeight
  let yPos = metaBoxY + metaBoxHeight + 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 66, 48);
  doc.text('DITAGIHKAN KEPADA:', 15, yPos);

  yPos += 6;
  doc.setFontSize(12);
  doc.setTextColor(42, 40, 35);
  doc.text(invoice.parent || '-', 15, yPos);

  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 103, 95);
  if (invoice.studentName) {
    doc.text(`Nama Siswa: ${invoice.studentName}`, 15, yPos);
    yPos += 5;
  }
  if (invoice.whatsapp) {
    doc.text(`Nomor WhatsApp: ${invoice.whatsapp}`, 15, yPos);
    yPos += 5;
  }

  yPos += 5;

  // Table Header
  doc.setFillColor(40, 66, 48);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DESKRIPSI & RINCIAN BELAJAR', 20, yPos + 5.5);
  doc.text('SESI / TANGGAL', 115, yPos + 5.5, { align: 'center' });
  doc.text('TARIF PER SESI', 150, yPos + 5.5, { align: 'right' });
  doc.text('SUBTOTAL', pageWidth - 20, yPos + 5.5, { align: 'right' });

  yPos += 8;

  // Table Row
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 215, 205);

  const rowHeight = invoice.packageType === 'non_paket' ? 32 : 18;
  doc.rect(15, yPos, pageWidth - 30, rowHeight, 'FD');

  doc.setTextColor(42, 40, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);

  if (invoice.packageType === 'non_paket') {
    doc.text('Bimbingan Belajar Non Paket (Sesi Fleksibel)', 20, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 103, 95);
    doc.text(`Periode Bulan: ${invoice.periodMonth || 'September 2026'}`, 20, yPos + 13);

    const datesStr = invoice.meetingDatesRaw || invoice.meetingDates?.join(', ') || '-';
    doc.text(`Tanggal Pertemuan: Tgl ${datesStr}`, 20, yPos + 19);

    doc.setFontSize(8);
    doc.setTextColor(63, 90, 70);
    doc.text('Format House-to-House (Durasi 70 Menit per Pertemuan)', 20, yPos + 25);

    // Quantity / Sesi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(42, 40, 35);
    const totalSessions = invoice.totalMeetings || invoice.meetingDates?.length || 0;
    doc.text(`${totalSessions} Pertemuan`, 115, yPos + 10, { align: 'center' });

    // Rate per meeting
    doc.text(`Rp ${(invoice.costPerMeeting || 35000).toLocaleString('id-ID')}`, 150, yPos + 10, {
      align: 'right',
    });

    // Subtotal
    doc.setTextColor(40, 66, 48);
    doc.text(`Rp ${invoice.amount.toLocaleString('id-ID')}`, pageWidth - 20, yPos + 10, {
      align: 'right',
    });
  } else {
    doc.text(invoice.package || 'Paket 8 Sesi SD UMUM', 20, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 103, 95);
    doc.text('Paket Belajar Reguler Bulanan • House-to-House (70 Menit)', 20, yPos + 13);

    // Sesi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(42, 40, 35);
    doc.text('8 Sesi', 115, yPos + 9, { align: 'center' });

    // Rate
    doc.text('-', 150, yPos + 9, { align: 'right' });

    // Subtotal
    doc.setTextColor(40, 66, 48);
    doc.text(`Rp ${invoice.amount.toLocaleString('id-ID')}`, pageWidth - 20, yPos + 9, {
      align: 'right',
    });
  }

  yPos += rowHeight;

  // Grand Total Box
  doc.setFillColor(250, 247, 241);
  doc.rect(15, yPos, pageWidth - 30, 14, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(42, 40, 35);
  doc.text('TOTAL PEMBAYARAN:', 110, yPos + 9, { align: 'right' });

  doc.setFontSize(13);
  doc.setTextColor(40, 66, 48);
  doc.text(`Rp ${invoice.amount.toLocaleString('id-ID')}`, pageWidth - 20, yPos + 9.5, {
    align: 'right',
  });

  yPos += 22;

  // Payment instructions / Midtrans notice
  doc.setFillColor(245, 242, 235);
  doc.roundedRect(15, yPos, pageWidth - 30, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 66, 48);
  doc.text('INSTRUKSI PEMBAYARAN RESMI (MIDTRANS / TRANSFER):', 20, yPos + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 77, 70);
  doc.text('1. Pembayaran dapat diselesaikan melalui Midtrans Snap (QRIS Gopay/ShopeePay, BCA VA, Mandiri VA).', 20, yPos + 13);
  doc.text('2. Konfirmasi bukti bayar otomatis terverifikasi ke sistem Operational Hub Bright Future.', 20, yPos + 18);
  doc.text('3. Jika memerlukan bantuan atau jadwal penyesuaian, hubungi Head Admin via WA di 0851-7323-0198.', 20, yPos + 23);

  // Footer signoff
  yPos += 35;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 103, 95);
  doc.text('Magelang, ' + (invoice.date || 'September 2026'), pageWidth - 25, yPos, { align: 'right' });

  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 66, 48);
  doc.text('Bright Future Learning Center', pageWidth - 25, yPos, { align: 'right' });

  yPos += 14;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 40, 35);
  doc.text('Monica Yuliana, S.Pd., Gr.', pageWidth - 25, yPos, { align: 'right' });

  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 103, 95);
  doc.text('Owner & Operational Head', pageWidth - 25, yPos, { align: 'right' });

  // System Watermark / Bottom note
  doc.setFontSize(7);
  doc.setTextColor(160, 155, 145);
  doc.text(
    `Dokumen resmi ini diterbitkan secara elektronik oleh Sistem Operational Hub Bright Future Learning Center (${invoice.inv}).`,
    15,
    doc.internal.pageSize.getHeight() - 10
  );

  // Save/Download PDF
  const filename = `Invoice_${invoice.inv.replace(/[^a-zA-Z0-9_-]/g, '_')}_${(invoice.studentName || 'Siswa').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};
