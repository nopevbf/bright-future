import { formatWhatsAppNumber } from './whatsapp';

export type TutorApplicationStatus =
  | 'pending_review'
  | 'interview'
  | 'accepted'
  | 'rejected';

export interface TutorApplication {
  id: string;
  fullName: string;
  whatsapp: string;
  education: string;
  subjects: string;
  district: string;
  experienceNotes?: string;
  status: TutorApplicationStatus;
  createdAt: string;
  interviewDate?: string;
  interviewNotes?: string;
}

/**
 * Filter pendaftar tutor berdasarkan pencarian (nama, mapel, kecamatan) dan status
 */
export function filterTutorApplications(
  applications: TutorApplication[],
  searchQuery: string,
  statusFilter: string
): TutorApplication[] {
  const query = searchQuery.trim().toLowerCase();

  return applications.filter((app) => {
    // 1. Filter status
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }

    // 2. Filter search query
    if (!query) return true;

    const matchName = app.fullName.toLowerCase().includes(query);
    const matchSubjects = app.subjects.toLowerCase().includes(query);
    const matchDistrict = app.district.toLowerCase().includes(query);
    const matchEducation = app.education.toLowerCase().includes(query);

    return matchName || matchSubjects || matchDistrict || matchEducation;
  });
}

/**
 * Generator URL WhatsApp untuk undangan wawancara & microteaching
 */
export function generateTutorInterviewWhatsAppUrl(
  tutor: TutorApplication,
  details: { date: string; time: string; location: string }
): string {
  const cleanPhone = formatWhatsAppNumber(tutor.whatsapp);

  const message = [
    `Halo ${tutor.fullName}, salam hangat dari Tim Akademik Bright Future Magelang 🌿`,
    '',
    `Terima kasih telah mendaftar sebagai Calon Pengajar Bimbel House-to-House Bright Future.`,
    `Berkas pendaftaran Anda telah kami review dan Anda kami undang untuk mengikuti tahap selanjutnya:`,
    '',
    `📌 *Agenda:* Wawancara & Microteaching SOP 70 Menit`,
    `🗓️ *Hari/Tanggal:* ${details.date}`,
    `⏰ *Pukul:* ${details.time}`,
    `📍 *Lokasi:* ${details.location}`,
    '',
    `*Hal yang perlu disiapkan:*`,
    `1. Rencana pembelajaran mikro (Microteaching) 15 menit untuk mapel: ${tutor.subjects}`,
    `2. KTP & Ijazah/Transkrip Nilai asli`,
    `3. Pakaian rapi sopan khas pendidik`,
    '',
    `Mohon konfirmasi kesediaan kehadiran Anda dengan membalas pesan ini. Terima kasih! 🙏`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generator URL WhatsApp untuk konfirmasi penerimaan tutor
 */
export function generateTutorAcceptanceWhatsAppUrl(tutor: TutorApplication): string {
  const cleanPhone = formatWhatsAppNumber(tutor.whatsapp);

  const message = [
    `Assalamu'alaikum / Selamat Pagi/Sore ${tutor.fullName},`,
    '',
    `🎉 *Selamat! Anda Diterima sebagai Tutor Resmi Bright Future Magelang!*`,
    '',
    `Berdasarkan hasil seleksi berkas dan microteaching SOP 70 Menit, profil Anda dinyatakan terakreditasi untuk mengajar siswa di zonasi: *${tutor.district}*.`,
    '',
    `*Langkah Selanjutnya (Orientasi Pendidik):*`,
    `1. Pengambilan Pouch No-Gadget & Starter Pack Modul LKPD di kantor kami.`,
    `2. Aktivasi akun Portal Tutor Lapangan di sistem Bright Future.`,
    `3. Penyesuaian jadwal penugasan rute siswa perdana.`,
    '',
    `Selamat bergabung di keluarga besar Bright Future. Mari bersama mendampingi anak-anak Magelang meraih masa depan gemilang! 🌟`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generator URL WhatsApp untuk penolakan ramah
 */
export function generateTutorRejectionWhatsAppUrl(tutor: TutorApplication): string {
  const cleanPhone = formatWhatsAppNumber(tutor.whatsapp);

  const message = [
    `Yth. ${tutor.fullName},`,
    '',
    `Terima kasih atas antusiasme dan waktu Anda telah mendaftar sebagai Calon Tutor Bright Future Magelang.`,
    '',
    `Setelah mempertimbangkan kuota zonasi dan kecocokan bidang saat ini, mohon maaf kami belum dapat melanjutkan ke tahap penugasan aktif untuk periode ini.`,
    '',
    `Data profil Anda tetap kami simpan di database calon tutor kami untuk pertimbangan prioritas pada pembukaan kuota sesi berikutnya.`,
    '',
    `Apresiasi setinggi-tingginya kami sampaikan atas dedikasi dan kualifikasi Anda di dunia pendidikan. Sukses selalu dalam karier Anda! 🌿`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
