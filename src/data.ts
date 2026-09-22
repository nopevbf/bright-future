import { ProgramDetail, TutorProfile, TestimonialItem, FaqItem } from './types';

export const PROGRAMS: ProgramDetail[] = [
  {
    id: 'tk',
    levelTitle: 'TK / PAUD (3 - 6 Th)',
    badge: 'Pondasi Emas',
    name: 'Calistung & Sensorik',
    tagline: 'Stimulasi Fonik & Motorik Halus',
    description: 'Stimulasi fonik membaca ramah anak, dasar berhitung konkret, dan eksplorasi sensori menyenangkan tanpa paksaan.',
    features: [
      'Modul sensori bergambar & flashcard interaktif gratis',
      '70 menit pendampingan privat tanpa rasa bosan',
      'Laporan evaluasi afektif & mood per kedatangan tutor',
    ],
    pricePerSession: 35000,
    durationMinutes: 70,
    monthlySessions: 8,
    monthlyPrice: 280000,
    colorScheme: 'sage',
  },
  {
    id: 'sd',
    levelTitle: 'SD Kelas 1 - 6',
    badge: 'Favorit Ayah & Bunda',
    name: 'Tematik & Asesmen',
    tagline: 'Konsep Matpel & Pendampingan PR',
    description: 'Penguatan konsep Matematika dasar, IPA/IPS tematik Kurikulum Merdeka, dan pendampingan tuntas tugas harian sekolah.',
    features: [
      'Bedah PR & proyek tugas harian sekolah tuntas',
      'LKPD cetak berkala berwarna & panduan konsep',
      'Persiapan Asesmen Nasional (ANBK) & ujian semester',
    ],
    pricePerSession: 35000,
    durationMinutes: 70,
    monthlySessions: 8,
    monthlyPrice: 280000,
    colorScheme: 'terracotta',
  },
  {
    id: 'smp',
    levelTitle: 'SMP Kelas 7 - 9',
    badge: 'Kesiapan ASPD',
    name: 'Sains/Math & ASPD',
    tagline: 'Logika Rumus Cepat & Penalaran',
    description: 'Membongkar kerumitan Aljabar, Fisika, Biologi, dan Bahasa Inggris untuk mengamankan nilai rapor dan seleksi SMA impian.',
    features: [
      'Bank soal kurasi & try out berkala dengan pembahasan',
      'Trik rumus cepat logika praktis tanpa sekadar hafal',
      'Mentoring peminatan dan strategi masuk SMA/SMK unggulan',
    ],
    pricePerSession: 45000,
    durationMinutes: 70,
    monthlySessions: 8,
    monthlyPrice: 360000,
    colorScheme: 'sage',
  },
  {
    id: 'sma',
    levelTitle: 'SMA / SMK (10 - 12)',
    badge: 'Target Kampus Impian',
    name: 'SNBT & UTBK PTN',
    tagline: 'Drilling Skolastik & Literasi',
    description: 'Drilling penalaran skolastik (TPS), literasi Bahasa Indonesia & Inggris, serta matematika penalaran untuk lolos PTN impian.',
    features: [
      'Simulasi CBT prediktif SNBT dengan sistem skor IRT',
      'Analisis peluang jurusan & rasionalisasi nilai rapor',
      'Pemantapan mendalam mata pelajaran peminatan',
    ],
    pricePerSession: 55000,
    durationMinutes: 70,
    monthlySessions: 8,
    monthlyPrice: 440000,
    colorScheme: 'sage',
  },
];

export const PRIMARY_TUTOR: TutorProfile = {
  name: 'Monica Yuliana, S.Pd., Gr.',
  title: 'Pendidik Profesional Bersertifikasi Pendidik (Gr.)',
  role: 'Tutor Spesialis Sains & Tematik SD/SMP',
  rating: 4.9,
  photoUrl: '/tutor-monica.jpg',
  quote:
    'Mengajar dengan pendekatan empati dan penalaran logis membuat siswa tidak sekadar menghafal rumus, namun memahami esensi konsep materi. Bimbingan belajar di rumah memberikan keleluasaan anak bereksplorasi tanpa tekanan.',
  hoursFlight: '1.400+ Jam',
  studentsTrained: 38,
  certification: 'Pedagogik & Psikologi Anak Lulus',
  specialties: ['Matematika Nalaria', 'Eksperimen Sains Sederhana', 'Pendampingan ANBK', 'Metode Belajar Santai'],
};

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    name: 'Ibu Ratna Dewi',
    role: 'Wali Murid Kevin (Kelas 4 SD)',
    location: 'Mertoyudan, Kab. Magelang',
    rating: 5,
    initials: 'RD',
    studentLevel: 'SD Tematik',
    comment:
      'Sebagai ibu bekerja, kekhawatiran terbesar saya adalah anak tidak ada yang mendampingi belajar di rumah. Sejak pakai Bright Future, saya bisa tahu tutor sudah sampai lewat notifikasi rute GPS. Nilai ulangan harian matematika Kevin naik drastis dari 65 jadi 90. Bayar SPP juga tinggal klik QRIS tanpa konfirmasi manual!',
  },
  {
    id: '2',
    name: 'Bpk. Hendra Gunawan',
    role: 'Wali Murid Michelle (Kelas 8 SMP)',
    location: 'Muntilan, Kab. Magelang',
    rating: 5,
    initials: 'HG',
    studentLevel: 'SMP Sains & ASPD',
    comment:
      'Pendekatan tutor sangat sabar saat mengajar materi Fisika SMP yang tadinya ditakuti Michelle. Penjelasan berbasis logika sehari-hari membuat konsepnya nempel. Biaya Rp 45.000 per sesi sangat rasional untuk kualitas private serapi ini dengan modul LKPD fisik yang selalu siap.',
  },
  {
    id: '3',
    name: 'Ibu Farida Utami',
    role: 'Wali Murid Alif (TK B Calistung)',
    location: 'Mungkid, Kab. Magelang',
    rating: 5,
    initials: 'FU',
    studentLevel: 'TK Calistung',
    comment:
      'Alif tipe anak kinestetik yang cepat bosan kalau dipaksa duduk diam. Tutor Bright Future membawa kartu gambar dan balok hitung sehingga Alif antusias sekali setiap jadwal tiba. Dalam 2 bulan sudah lancar membaca dua suku kata.',
  },
];

export const FAQS: FaqItem[] = [
  {
    id: '1',
    category: 'Biaya & Paket',
    question: 'Berapa biaya per sesi belajar dan durasi setiap pertemuan?',
    answer:
      'Investasi belajar di Bright Future sangat transparan dan terjangkau: TK/PAUD & SD Rp 35.000 / sesi, SMP Rp 45.000 / sesi, dan SMA/SMK Rp 55.000 / sesi dengan durasi efektif 70 menit tatap muka 1-on-1 di rumah. Untuk paket reguler 2x seminggu (8 sesi per bulan): TK & SD Rp 280.000/bln, SMP Rp 360.000/bln, dan SMA Rp 440.000/bln sudah termasuk modul LKPD cetak interaktif tanpa biaya transport tutor.',
  },
  {
    id: '2',
    category: 'Operasional',
    question: 'Apakah ada biaya tambahan untuk transportasi tutor ke rumah siswa?',
    answer:
      'Tidak ada biaya tambahan sama sekali. Biaya transportasi sudah terintegrasi penuh ke dalam paket sesi belajar resmi. Sistem kami secara otomatis menugaskan tutor yang berdomisili paling dekat dengan alamat tempat tinggal siswa.',
  },
  {
    id: '3',
    category: 'Jadwal & Izin',
    question: 'Bagaimana jika siswa berhalangan hadir atau sedang sakit?',
    answer:
      'Orang tua cukup memberitahukan minimal 4 jam sebelum jadwal sesi melalui WhatsApp hotline resmi atau portal wali murid. Sesi tidak hangus dan akan dijadwalkan ulang (make-up session) sesuai kesepakatan bersama tutor.',
  },
  {
    id: '4',
    category: 'Pembayaran',
    question: 'Metode pembayaran apa saja yang didukung oleh Midtrans Snap?',
    answer:
      'Midtrans Snap mendukung pembayaran instan tanpa konfirmasi manual melalui QRIS (GoPay, OVO, ShopeePay, BCA Mobile, Dana), Virtual Account bank nasional (BCA, Mandiri, BNI, BRI, Permata), serta transfer bank. Status tagihan otomatis lunas secara real-time via webhook.',
  },
  {
    id: '5',
    category: 'Kurikulum',
    question: 'Apakah materi les disesuaikan dengan kurikulum sekolah murid?',
    answer:
      'Ya, materi bimbingan disinkronkan langsung dengan buku paket dan kurikulum sekolah siswa (Kurikulum Merdeka maupun K-13), mencakup persiapan ulangan harian, Asesmen Nasional (ANBK), hingga persiapan SNBT UTBK.',
  },
  {
    id: '6',
    category: 'Keamanan',
    question: 'Bagaimana standar keamanan dan kredibilitas tutor yang datang ke rumah?',
    answer:
      'Seluruh tutor Bright Future melewati 3 tahapan seleksi ketat: verifikasi berkas akademik/SKCK, micro-teaching berfokus ramah anak, dan asesmen psikologis. Kedatangan tutor juga terlacak presensi geofence radius rumah siswa.',
  },
];

export const COVERAGE_AREAS = [
  'Jakarta Selatan (Cilandak, Kebayoran, Tebet, Jagakarsa)',
  'Jakarta Barat, Pusat, Timur & Utara',
  'Tangerang Selatan (Bintaro, BSD City, Serpong, Pamulang)',
  'Depok (Cinere, Margonda, Sawangan)',
  'Bekasi Kota & Bekasi Barat',
  'Bandung Raya & Kota Cimahi',
  'Sleman & Kota Yogyakarta',
];
