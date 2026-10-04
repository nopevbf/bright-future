import { calculateHaversineDistance } from './geofence';
import { getDistrictCoordinates } from './magelangCoordinates';
import { formatWhatsAppNumber } from './whatsapp';

export interface DispatchableStudent {
  id: string;
  studentName: string;
  level: string; // e.g. "SD UMUM", "Calistung", "SMP", "SMA UTBK"
  grade?: string;
  district: string;
  address: string;
  whatsapp: string;
  parentName: string;
  subjects?: string[];
  selectedSchedule?: string[];
}

export interface DispatchableTutor {
  id?: string;
  name: string;
  district?: string;
  spec: string;
  univ?: string;
  status?: string;
  rating?: number;
  phone?: string;
}

export interface TutorMatchEvaluation {
  tutor: DispatchableTutor;
  distanceKm: number;
  isSubjectMatch: boolean;
  subjectFitScore: number; // 0 - 100
  proximityScore: number; // 0 - 100
  workloadScore: number; // 0 - 100
  matchScore: number; // 0 - 100
  recommendationReason: string;
}

/**
 * Menghitung jarak perkiraan dalam kilometer (km) antar dua kecamatan di Magelang
 * menggunakan rumus Haversine native.
 */
export function calculateDistrictDistanceKm(districtA?: string | null, districtB?: string | null): number {
  const normA = (districtA || '').toLowerCase().trim();
  const normB = (districtB || '').toLowerCase().trim();

  if (normA && normB && (normA === normB || normA.includes(normB) || normB.includes(normA))) {
    // Berada di kecamatan yang sama
    return 0.5;
  }

  const coordA = getDistrictCoordinates(districtA);
  const coordB = getDistrictCoordinates(districtB);

  const distanceMeters = calculateHaversineDistance(coordA, coordB);
  if (distanceMeters === Infinity || isNaN(distanceMeters)) {
    return 10.0; // Fallback rata-rata radius Magelang
  }

  return Math.round((distanceMeters / 1000) * 10) / 10;
}

/**
 * Memeriksa kecocokan jenjang pendidikan dan mata pelajaran antara kebutuhan siswa dan spesialisasi tutor.
 */
export function evaluateSubjectFit(
  studentLevel: string,
  studentSubjects: string[] = [],
  tutorSpec: string
): { isMatch: boolean; score: number; reason: string } {
  const sLevelNorm = studentLevel.toLowerCase();
  const tSpecNorm = tutorSpec.toLowerCase();
  const sSubsNorm = studentSubjects.map((s) => s.toLowerCase());

  let isMatch = false;
  let score = 40; // Base score bila ada kecocokan umum
  let reason = 'Spesialisasi umum pengajar';

  // 1. Calistung & TK
  if (sLevelNorm.includes('calistung') || sLevelNorm.includes('tk')) {
    if (tSpecNorm.includes('calistung') || tSpecNorm.includes('fonik') || tSpecNorm.includes('kelas rendah') || tSpecNorm.includes('pgsd')) {
      isMatch = true;
      score = 100;
      reason = 'Spesialis Calistung Fonik & Usia Dini Terakreditasi';
    } else if (tSpecNorm.includes('sd')) {
      isMatch = true;
      score = 75;
      reason = 'Pengajar jenjang SD (Bisa mendampingi Calistung)';
    } else {
      score = 25;
      reason = 'Spesialisasi berbeda (Tutor berfokus jenjang lebih tinggi)';
    }
  }
  // 2. SD UMUM
  else if (sLevelNorm.includes('sd')) {
    if (tSpecNorm.includes('sd') || tSpecNorm.includes('tematik') || tSpecNorm.includes('pgsd') || tSpecNorm.includes('olimpiade')) {
      isMatch = true;
      score = 100;
      reason = 'Pakar Kurikulum Merdeka & Tematik SD Magelang';
    } else if (tSpecNorm.includes('sains') || tSpecNorm.includes('matematika') || tSpecNorm.includes('bahasa')) {
      isMatch = true;
      score = 80;
      reason = 'Keahlian mapel selaras dengan kebutuhan siswa';
    } else {
      score = 40;
      reason = 'Tutor terbiasa jenjang lanjutan';
    }
  }
  // 3. SMP
  else if (sLevelNorm.includes('smp')) {
    if (tSpecNorm.includes('smp') || tSpecNorm.includes('fisika') || tSpecNorm.includes('aljabar') || tSpecNorm.includes('ipa') || tSpecNorm.includes('sains')) {
      isMatch = true;
      score = 100;
      reason = 'Spesialis Saintek & Bahasa SMP';
    } else if (tSpecNorm.includes('sma') || tSpecNorm.includes('matematika')) {
      isMatch = true;
      score = 85;
      reason = 'Kompeten mengajar materi persiapan jenjang menengah';
    } else {
      score = 35;
      reason = 'Fokus materi berbeda';
    }
  }
  // 4. SMA / UTBK
  else if (sLevelNorm.includes('sma') || sLevelNorm.includes('utbk')) {
    if (tSpecNorm.includes('sma') || tSpecNorm.includes('utbk') || tSpecNorm.includes('snbt') || tSpecNorm.includes('tps') || tSpecNorm.includes('literasi') || tSpecNorm.includes('fisika') || tSpecNorm.includes('kimia')) {
      isMatch = true;
      score = 100;
      reason = 'Spesialis UTBK SNBT & Pemantapan SMA';
    } else {
      score = 30;
      reason = 'Belum terfokus pada materi tingkat tinggi SMA/UTBK';
    }
  }
  // Default general match
  else {
    const hasAnySubMatch = sSubsNorm.some((sub) => tSpecNorm.includes(sub));
    if (hasAnySubMatch) {
      isMatch = true;
      score = 90;
      reason = 'Mata pelajaran bimbingan relevan';
    } else {
      isMatch = true;
      score = 70;
      reason = 'Tutor berpengalaman pengajaran lintas jenjang';
    }
  }

  return { isMatch, score, reason };
}

/**
 * Menghitung skor kedekatan geografis (Proximity Score 0 - 100).
 */
export function calculateProximityScore(distanceKm: number): number {
  if (distanceKm <= 1.5) return 100; // Satu kecamatan / sangat dekat
  if (distanceKm <= 5.0) return 90;
  if (distanceKm <= 10.0) return 75;
  if (distanceKm <= 15.0) return 55;
  if (distanceKm <= 20.0) return 35;
  return 15;
}

/**
 * Menghitung skor ketersediaan / beban mengajar tutor (0 - 100).
 */
export function calculateWorkloadScore(tutorStatus?: string): number {
  if (!tutorStatus) return 80;
  const s = tutorStatus.toLowerCase();
  if (s.includes('tersedia')) return 100;
  if (s.includes('siap')) return 95;
  if (s.includes('on-duty')) return 60;
  return 75;
}

/**
 * Menghitung skor kecocokan komprehensif antara siswa dan calon tutor.
 * Formula:
 * Match Score = (SubjectFit * 0.50) + (Proximity * 0.40) + (Workload * 0.10)
 */
export function calculateTutorMatchScore(
  student: DispatchableStudent,
  tutor: DispatchableTutor
): TutorMatchEvaluation {
  const distanceKm = calculateDistrictDistanceKm(student.district, tutor.district);
  const proximityScore = calculateProximityScore(distanceKm);

  const { isMatch, score: subjectFitScore, reason: subjectReason } = evaluateSubjectFit(
    student.level,
    student.subjects || [],
    tutor.spec
  );

  const workloadScore = calculateWorkloadScore(tutor.status);

  // Bobot: Subjek 50%, Jarak 40%, Beban 10%
  const matchScore = Math.round(
    subjectFitScore * 0.5 + proximityScore * 0.4 + workloadScore * 0.1
  );

  let recommendationReason = `${subjectReason} • Jarak ~${distanceKm} km (${tutor.district || 'Magelang'})`;
  if (distanceKm <= 2.0 && isMatch) {
    recommendationReason = `Pilihan Terbaik: Satu wilayah zonasi (${student.district}) & spesialisasi ${student.level} sangat cocok!`;
  }

  return {
    tutor,
    distanceKm,
    isSubjectMatch: isMatch,
    subjectFitScore,
    proximityScore,
    workloadScore,
    matchScore,
    recommendationReason,
  };
}

/**
 * Mengurutkan calon-calon tutor berdasarkan Match Score tertinggi untuk siswa yang ditentukan.
 */
export function rankTutorsForStudent(
  student: DispatchableStudent,
  tutors: DispatchableTutor[]
): TutorMatchEvaluation[] {
  const evaluations = tutors.map((tutor) => calculateTutorMatchScore(student, tutor));
  return evaluations.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Menghasilkan link tautan WhatsApp (wa.me) resmi untuk Dispatch Penugasan ke Tutor.
 */
export function generateTutorDispatchWhatsAppUrl(
  student: DispatchableStudent,
  tutor: DispatchableTutor,
  visitScheduleText: string = 'Sesuai kesepakatan'
): string {
  const tutorPhone = formatWhatsAppNumber(tutor.phone || '085173230198');
  const scheduleLine = student.selectedSchedule?.length
    ? student.selectedSchedule.join(', ')
    : visitScheduleText;

  const message =
    `*PENUGASAN RESMI TUTOR BRIGHT FUTURE*\n` +
    `Halo ${tutor.name},\n\n` +
    `Anda telah dipasangkan & ditugaskan sebagai tutor privat untuk siswa baru berikut:\n\n` +
    `👤 *Nama Siswa:* ${student.studentName}\n` +
    `📚 *Jenjang / Kelas:* ${student.level} (${student.grade || 'Reguler'})\n` +
    `📍 *Wilayah / Kecamatan:* Kec. ${student.district}\n` +
    `🏠 *Alamat Kunjungan:* ${student.address}\n` +
    `⏰ *Jadwal Belajar:* ${scheduleLine}\n` +
    `👨‍👩‍👧 *Wali Murid:* ${student.parentName} (${student.whatsapp})\n\n` +
    `*SOP Kunjungan Meja Belajar Bright Future:*\n` +
    `1. Validasi presensi GPS Geofence (< 25m) setibanya di rumah siswa.\n` +
    `2. Terapkan SOP Meja Belajar 70 Menit Tatap Muka Murni (Kantong HP Anti-Distraksi).\n` +
    `3. Isi evaluasi 4 Pilar Karakter & kirim draf laporan ke wali murid.\n\n` +
    `Mohon konfirmasi kesiapan penugasan ini dengan membalas pesan ini. Semangat membimbing! 🌟`;

  return `https://wa.me/${tutorPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Menghasilkan link tautan WhatsApp (wa.me) resmi untuk konfirmasi ke Wali Murid bahwa tutor telah dipasangkan.
 */
export function generateParentDispatchConfirmationWhatsAppUrl(
  student: DispatchableStudent,
  tutor: DispatchableTutor,
  visitScheduleText: string = 'Sesuai jadwal pilihan'
): string {
  const parentPhone = formatWhatsAppNumber(student.whatsapp);
  const scheduleLine = student.selectedSchedule?.length
    ? student.selectedSchedule.join(', ')
    : visitScheduleText;

  const message =
    `*KONFIRMASI PENUGASAN TUTOR BRIGHT FUTURE*\n` +
    `Halo Bapak/Ibu ${student.parentName},\n\n` +
    `Kabar baik! Kami telah memasangkan tutor terdekat & terakreditasi untuk mendampingi bimbingan belajar Ananda *${student.studentName}*:\n\n` +
    `🎓 *Nama Tutor:* ${tutor.name}\n` +
    `🏫 *Latar Belakang:* ${tutor.univ || 'Tenaga Pendidik Terakreditasi Bright Future'}\n` +
    `📖 *Keahlian:* ${tutor.spec}\n` +
    `⏰ *Jadwal Kunjungan:* ${scheduleLine}\n` +
    `📍 *Alamat Kunjungan:* ${student.address}\n\n` +
    `Tutor kami akan segera menghubungi Bapak/Ibu untuk koordinasi sesi perdana dengan SOP 70 Menit Meja Belajar Bebas Distraksi.\n\n` +
    `Terima kasih telah mempercayakan pendidikan ananda bersama Bright Future Magelang! ✨`;

  return `https://wa.me/${parentPhone}?text=${encodeURIComponent(message)}`;
}
