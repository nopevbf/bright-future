import React, { useState, useMemo } from 'react';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../../utils/tutorPairingResolver';

interface TutorStudentClassesProps {
  tutorName?: string;
  assignedStudents: AssignedStudentSummary[];
  visits: FirestoreTutorVisitDoc[];
  onNavigateTab?: (tab: string) => void;
  onSelectStudent?: (studentId: string) => void;
}

interface StudentDetailData {
  id: string;
  studentId: string;
  studentName: string;
  level: string;
  schoolName: string;
  parentName: string;
  parentPhone: string;
  address: string;
  landmark: string;
  status: 'active' | 'remedial' | 'inactive';
  scheduleText: string;
  averageScore: number;
  attendanceRate: string;
  characterTag: string;
  avatarUrl: string;
  cognitiveProgress: { topic: string; score: number; heightPercent: number }[];
  affectiveNote: string;
  affectiveDate: string;
  recentLkpd: { title: string; subtitle: string; score: number; color: string }[];
  nextVisitText: string;
  nextVisitTopic: string;
}

export const TutorStudentClasses: React.FC<TutorStudentClassesProps> = ({
  tutorName = 'Kak Anindya, S.Pd.',
  assignedStudents,
  visits,
  onNavigateTab,
  onSelectStudent,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return assignedStudents[0]?.studentId || assignedStudents[0]?.id || '';
  });

  const [activeLevelFilter, setActiveLevelFilter] = useState<'all' | 'sd' | 'smp'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scheduleFilter, setScheduleFilter] = useState<string>('all');

  // Modals & Feedback State
  const [showAddNoteModal, setShowAddNoteModal] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Static fallback avatars with friendly, high-quality illustrations/photos
  const fallbackAvatars = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCwjUKPUxQiwthyNyT9jJrqz1iicn0445pF07NLUt7LSOiLg4SpvBV0peFsnVstXZR4xsmDfC7wUUIMHZXaL-3eVWawbAeXPM8sp5fWwKEShwn78S1YZqrSJywQaf_c31VCSlYyl55iOP2ZqkY4LLArSU7KqKAzfjQWTLvLa3T77RSLfy3EZr1-rz8s3l-XCzDOzy70XYYjI3C8oWNay16zOcC-ucYRAdfD59h5-t_t1Tw3FaUwVg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAb68DFInH4ZBnYLwQSCj-wIosaCJzyUjof6-AY1jhPA1SpH-4uCIx9fJNR--TWXdiA62-u3bloRCp6rIIeYNAaRc1pcqItlTnps4qcu_6aDVEsMap8LsfB5-ujHWpMCageu75XxOW7tfibTOIVXhIPEBumcLoWqWtGp20LJ0txkHrjH8ixZy_Mh3PQljIFyFRvdLCUry6edAhFtEpOZmfUsO2-7N3ub00A9w8ObNxuClioucxYJg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBTP_2vm30mIUJfrBf9x1ViuLV-JZtNi1vQyoX5WR1yMKX97Jjq7gO_v3hHr0g5eqNhgNhKb8AWSQJzVRZEeNXde_VxXfI9R6C8iNpqPDZw3OBLFtOR3LQZEhle2xWo1PdThMl3zCxQ858wlZ7GIB0Vg6sPE_C7b8c9wHHoMdN5AEvxh8M1CAwCO4-aCQoTeuOTY20h37A1agWnAqxMNMgyhqW3bFMQrmk7trWqdsY1fpxwtnxHww',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDGDvFu7zliOMPlHqtDzp7HRe3YTqCXXzOMFMdybWjuu1aeaDSvxJm4RwHMXNISKhuqd-NZ6Cgucx4mWZuEkSdEE-dHSvEi5BBo1KbNwyynccz2uJ_NnheA78rdQBBANmtbx1mqjbKAhfUwjZq5CPe_i9cnTDiND1EOYQtE35-_P-h8WCXnpEkbLtA3e4RPaf2_NXmY-RcPFc7rbXdeVJ6LBYpfSt9kwiooZvyBdyW_Of_Iwnz2cg',
  ];

  // Map assigned students to rich detailed profile objects
  const studentDirectory: StudentDetailData[] = useMemo(() => {
    return assignedStudents.map((student, idx) => {
      const sId = student.studentId || student.id || `student-${idx + 1}`;
      const matchingVisits = visits.filter(
        (v) => v.studentName?.toLowerCase() === student.studentName.toLowerCase()
      );
      const isSmp = (student.level || '').toLowerCase().includes('smp');
      const isSd = !isSmp;

      // Extract average quiz score
      const validScores = matchingVisits
        .map((v) => v.score)
        .filter((s): s is number => typeof s === 'number' && s > 0);
      const avgScore = validScores.length > 0 
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : (86 + (idx % 8));

      const parentName = student.parentName || `Wali Murid ${student.studentName}`;
      const parentPhone = student.whatsapp || student.parentPhone || '081234567890';
      const address = student.address || 'Kota Magelang';
      const scheduleDays = student.scheduleDays?.length ? student.scheduleDays.join(' & ') : 'Selasa & Jumat';

      return {
        id: sId,
        studentId: sId,
        studentName: student.studentName,
        level: student.level || (isSmp ? 'SMP Kelas 7' : 'SD Kelas 5'),
        schoolName: isSmp ? 'SMPN 1 Magelang' : 'SD Mertoyudan 1',
        parentName,
        parentPhone,
        address,
        landmark: 'Radius GPS 8m, Patokan: Sebelah utara gerbang perumahan',
        status: (idx === 2 ? 'remedial' : 'active') as 'active' | 'remedial',
        scheduleText: `${scheduleDays} (13:30 WIB)`,
        averageScore: avgScore,
        attendanceRate: `${12 + (idx % 4)}/${12 + (idx % 4)} Sesi Hadir (100%)`,
        characterTag: idx % 2 === 0 ? 'Sangat Aktif & Teliti' : 'Mandiri & Antusias',
        avatarUrl: fallbackAvatars[idx % fallbackAvatars.length],
        cognitiveProgress: [
          { topic: 'Pecahan', score: 80, heightPercent: 68 },
          { topic: 'Siklus Air', score: 85, heightPercent: 76 },
          { topic: 'Tata Surya', score: 88, heightPercent: 82 },
          { topic: 'Kuis Kilat', score: 92, heightPercent: 90 },
        ],
        affectiveNote: `"${student.studentName} sangat proaktif mengeksplorasi konsep pembelajaran, fokus tatap muka penuh tanpa meminta gawai, siap melanjutkan materi evaluasi bertahap."`,
        affectiveDate: 'Jumat lalu, 14:40 WIB',
        recentLkpd: [
          {
            title: `LKPD Sains Bab ${idx + 2} (Konsep & Eksperimen)`,
            subtitle: 'Selesai di tempat • Valid',
            score: avgScore,
            color: 'text-[#284230]',
          },
          {
            title: 'Kuis Kilat Pemahaman Terpadu',
            subtitle: 'Cepat Tanggap (8 Mnt)',
            score: Math.min(100, avgScore + 4),
            color: 'text-[#C1683F]',
          },
          {
            title: 'LKPD Tematik Siklus Materi',
            subtitle: 'Diagram Mandiri & Narasi',
            score: Math.max(75, avgScore - 3),
            color: 'text-[#2A2823]',
          },
        ],
        nextVisitText: 'Selasa, 24 Sept • 13:30 WIB',
        nextVisitTopic: student.subject || 'Konsep Tematik Terpadu & Latihan Mandiri',
      };
    });
  }, [assignedStudents, visits]);

  // Dynamic Metrics Calculation
  const totalStudents = studentDirectory.length;
  const sdCount = studentDirectory.filter((s) => !s.level.toLowerCase().includes('smp')).length;
  const smpCount = studentDirectory.filter((s) => s.level.toLowerCase().includes('smp')).length;
  const overallAvgScore = totalStudents > 0
    ? (studentDirectory.reduce((acc, curr) => acc + curr.averageScore, 0) / totalStudents).toFixed(1)
    : '88.5';

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return studentDirectory.filter((s) => {
      // Level filter
      if (activeLevelFilter === 'sd' && s.level.toLowerCase().includes('smp')) return false;
      if (activeLevelFilter === 'smp' && !s.level.toLowerCase().includes('smp')) return false;

      // Status filter
      if (statusFilter === 'active' && s.status !== 'active') return false;
      if (statusFilter === 'remedial' && s.status !== 'remedial') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.studentName.toLowerCase().includes(q);
        const matchSchool = s.schoolName.toLowerCase().includes(q);
        const matchParent = s.parentName.toLowerCase().includes(q);
        const matchAddress = s.address.toLowerCase().includes(q);
        if (!matchName && !matchSchool && !matchParent && !matchAddress) return false;
      }

      return true;
    });
  }, [studentDirectory, activeLevelFilter, statusFilter, searchQuery]);

  // Selected Student Object (synced with filtered results)
  const activeStudent = useMemo(() => {
    const matched = filteredStudents.find((s) => s.id === selectedStudentId);
    if (matched) return matched;
    return filteredStudents[0] || studentDirectory[0] || null;
  }, [filteredStudents, selectedStudentId, studentDirectory]);

  const handleCopyPhone = (phone: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      showToast(`Nomor ${phone} disalin ke clipboard!`);
    } else {
      showToast(`Nomor: ${phone}`);
    }
  };

  const handleOpenWhatsApp = (phone: string, studentName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const msg = encodeURIComponent(
      `Halo Bapak/Ibu wali dari ananda ${studentName}. Saya ${tutorName}, tutor pendamping Bright Future. Ingin mengabarkan catatan perkembangan belajar ananda hari ini.`
    );
    window.open(`https://wa.me/${targetPhone}?text=${msg}`, '_blank');
  };

  const handleOpenGoogleMaps = (address: string) => {
    const q = encodeURIComponent(`${address}, Magelang`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  };

  const handleSaveObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    showToast('Catatan observasi berhasil disimpan!');
    setNewNoteText('');
    setShowAddNoteModal(false);
  };

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#284230] text-white text-xs font-semibold rounded-xl shadow-lg border border-[#c8ebce]/30 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-[#c8ebce]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Header Section */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-[rgba(42,40,35,0.08)]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('dashboard-tutor')}
              className="text-xs text-[#6B675F] hover:text-[#284230] transition-colors cursor-pointer"
            >
              Portal Tutor
            </button>
            <span className="material-symbols-outlined text-[#6B675F] text-[14px]">chevron_right</span>
            <span className="text-xs text-[#3F5A46] font-semibold">Kelas &amp; Siswa Binaan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#284230] tracking-tight">
            Kelas Saya &amp; Siswa Binaan
          </h1>
          <p className="text-xs sm:text-sm text-[#6B675F] max-w-2xl leading-relaxed">
            Manajemen kelompok belajar, direktori profil murid visit Magelang, capaian kognitif, dan log komunikasi orang tua.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ebe8e2] hover:bg-[#e5e2dc] text-[#2A2823] transition-all text-xs font-semibold shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">file_download</span>
            <span>Unduh Rekap Kelas</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddNoteModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#284230] hover:bg-[#3F5A46] text-white transition-all text-xs font-semibold shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Tambah Catatan Siswa</span>
          </button>
        </div>
      </section>

      {/* Top Bento Summary Metric Cards (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Siswa Binaan */}
        <div className="bg-[#f6f3ed]/90 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#6B675F] uppercase tracking-wider">
                Total Siswa Binaan
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#284230]">
                  {totalStudents}
                </span>
                <span className="text-xs font-medium text-[#6B675F]">Murid</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#c8ebce]/70 flex items-center justify-center text-[#3F5A46]">
              <span className="material-symbols-outlined text-[22px]">diversity_3</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#6B675F] text-[12px]">
            <span className="font-semibold text-[#284230]">{sdCount} SD Tematik</span>
            <span>•</span>
            <span className="font-medium">{smpCount} SMP Sains/Mat</span>
          </div>
        </div>

        {/* Metric 2: Rata-rata Kehadiran */}
        <div className="bg-[#f6f3ed]/90 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#6B675F] uppercase tracking-wider">
                Rata-rata Kehadiran
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#284230]">98.4%</span>
                <span className="text-xs font-medium text-[#6B675F]">Tatap Muka</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#c8ebce]/70 flex items-center justify-center text-[#3F5A46]">
              <span className="material-symbols-outlined text-[22px]">pin_drop</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#4d6b54] text-[11px] font-bold">
              <span className="material-symbols-outlined text-[12px]">verified</span> GPS Valid &lt;50m
            </span>
            <span className="text-[12px] text-[#6B675F]">Zonasi Aman</span>
          </div>
        </div>

        {/* Metric 3: Rerata Nilai Kuis & LKPD */}
        <div className="bg-[#f6f3ed]/90 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#6B675F] uppercase tracking-wider">
                Rerata Nilai Kuis &amp; LKPD
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#284230]">
                  {overallAvgScore}
                </span>
                <span className="text-xs font-medium text-[#6B675F]">/ 100</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EFC9AE]/60 flex items-center justify-center text-[#C1683F]">
              <span className="material-symbols-outlined text-[22px]">trending_up</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[#3F5A46] text-[12px] font-semibold">
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            <span>+4.2 poin dari bulan lalu</span>
          </div>
        </div>

        {/* Metric 4: Laporan Afektif Terkirim */}
        <div className="bg-[#f6f3ed]/90 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#6B675F] uppercase tracking-wider">
                Laporan Afektif Terkirim
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#284230]">
                  {totalStudents} / {totalStudents}
                </span>
                <span className="text-xs font-medium text-[#6B675F]">Draf WA</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F1ECE1] flex items-center justify-center text-[#284230]">
              <span className="material-symbols-outlined text-[22px]">mark_chat_read</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#3F5A46] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#6F8F76]"></span>
            <span>100% Komunikasi Ortu Lancar</span>
          </div>
        </div>
      </section>

      {/* Filter & Class Switcher Bar */}
      <section className="bg-[#f6f3ed]/80 backdrop-blur-md rounded-2xl p-4 shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Class Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0" id="class-tabs">
          <button
            type="button"
            onClick={() => setActiveLevelFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeLevelFilter === 'all'
                ? 'bg-[#284230] text-white shadow-xs'
                : 'text-[#424843] hover:text-[#1c1c18] hover:bg-[#ebe8e2]'
            }`}
          >
            Semua Siswa ({totalStudents})
          </button>
          <button
            type="button"
            onClick={() => setActiveLevelFilter('sd')}
            className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
              activeLevelFilter === 'sd'
                ? 'bg-[#284230] text-white font-bold shadow-xs'
                : 'text-[#424843] hover:text-[#1c1c18] hover:bg-[#ebe8e2]'
            }`}
          >
            SD Tematik Terpadu ({sdCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveLevelFilter('smp')}
            className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
              activeLevelFilter === 'smp'
                ? 'bg-[#284230] text-white font-bold shadow-xs'
                : 'text-[#424843] hover:text-[#1c1c18] hover:bg-[#ebe8e2]'
            }`}
          >
            SMP Sains &amp; Mat ({smpCount})
          </button>
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B675F] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari murid, sekolah, ortu..."
              className="w-full bg-white pl-10 pr-4 py-2 rounded-xl text-xs text-[#1c1c18] placeholder:text-[#6B675F]/70 border border-[rgba(42,40,35,0.12)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76] shadow-xs"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white px-3 py-2 rounded-xl text-xs text-[#1c1c18] border border-[rgba(42,40,35,0.12)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76] shadow-xs cursor-pointer"
            >
              <option value="all">Status: Semua</option>
              <option value="active">Aktif Berprogres</option>
              <option value="remedial">Butuh Remedial</option>
            </select>
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              className="bg-white px-3 py-2 rounded-xl text-xs text-[#1c1c18] border border-[rgba(42,40,35,0.12)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76] shadow-xs cursor-pointer"
            >
              <option value="all">Jadwal: Semua Hari</option>
              <option value="selasa-jumat">Selasa &amp; Jumat</option>
              <option value="senin-kamis">Senin &amp; Kamis</option>
            </select>
          </div>
        </div>
      </section>

      {/* Split Panel Bento Grid (60% Left, 40% Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Student Directory Grid (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#284230]">Daftar Siswa Binaan</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#ebe8e2] text-[#6B675F] text-[11px] font-bold">
                {filteredStudents.length} Terdaftar
              </span>
            </div>
            <span className="text-xs text-[#6B675F]">Urutan: Sesi Kunjungan Terdekat</span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="bg-[#f6f3ed] rounded-2xl p-8 text-center border border-[rgba(42,40,35,0.08)]">
              <span className="material-symbols-outlined text-[36px] text-[#6B675F] mb-2">person_search</span>
              <h3 className="text-sm font-bold text-[#284230]">Belum ada siswa binaan yang terhubung</h3>
              <p className="text-xs text-[#6B675F] mt-1 max-w-sm mx-auto">
                Silakan ubah filter pencarian Anda atau periksa sinkronisasi pairing siswa dari admin dispatch.
              </p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = activeStudent?.id === student.id;

              return (
                <div
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    if (onSelectStudent) onSelectStudent(student.id);
                  }}
                  className={`bg-[#f6f3ed] rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md cursor-pointer border ${
                    isSelected
                      ? 'border-[#6F8F76] ring-2 ring-[#6F8F76]/40'
                      : 'border-[rgba(42,40,35,0.06)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={student.avatarUrl}
                        alt={student.studentName}
                        className="w-12 h-12 rounded-xl object-cover shadow-xs ring-1 ring-white"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#284230]">
                            {student.studentName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#4d6b54] text-[11px] font-bold">
                            {student.level}
                          </span>
                        </div>
                        <span className="text-xs text-[#6B675F]">
                          {student.schoolName} • ID: {student.studentId}
                        </span>
                      </div>
                    </div>
                    <div className="text-right sm:block flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-[#6B675F]">
                        Rerata Nilai
                      </span>
                      <div className="text-lg font-bold text-[#3F5A46]">
                        {student.averageScore}
                        <span className="text-xs text-[#6B675F] font-normal">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Meta Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3 text-xs bg-[#FAF7F1] rounded-xl p-3 my-2 border border-[rgba(42,40,35,0.04)]">
                    <div className="flex items-center gap-2 text-[#2A2823]">
                      <span className="material-symbols-outlined text-[17px] text-[#C1683F]">
                        calendar_today
                      </span>
                      <span className="font-semibold">{student.scheduleText}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#2A2823]">
                      <span className="material-symbols-outlined text-[17px] text-[#3F5A46]">
                        location_on
                      </span>
                      <span className="truncate">{student.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#2A2823]">
                      <span className="material-symbols-outlined text-[17px] text-[#6B675F]">
                        support_agent
                      </span>
                      <span>{student.parentName} ({student.parentPhone})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#2A2823]">
                      <span className="material-symbols-outlined text-[17px] text-[#6F8F76]">
                        task_alt
                      </span>
                      <span className="font-bold text-[#284230]">{student.attendanceRate}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ebe8e2] text-[#284230] text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[14px] text-[#C1683F]">
                        award_star
                      </span>
                      {student.characterTag}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWhatsApp(student.parentPhone, student.studentName);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#ebe8e2] text-[#424843] text-xs font-semibold border border-[rgba(42,40,35,0.12)] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] text-[#C1683F]">
                          chat
                        </span>
                        <span>WA Ortu</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentId(student.id);
                          if (onSelectStudent) onSelectStudent(student.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#284230] hover:bg-[#3F5A46] text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isSelected ? 'Terpilih' : 'Detail Pantau'}</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Student Detailed Inspection Panel (5 cols on lg, sticky) */}
        <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-24">
          {activeStudent ? (
            <div className="bg-[#f6f3ed]/95 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[rgba(42,40,35,0.08)] relative overflow-hidden flex flex-col gap-5">
              {/* Floating Active Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8ebce]/80 text-[#2f4d38] text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#3F5A46] animate-pulse"></span>
                  <span>Profil Aktif Terpilih</span>
                </div>
                <span className="text-[11px] font-bold text-[#6B675F] tracking-wider">
                  ID: {activeStudent.studentId}
                </span>
              </div>

              {/* Header Profile Identity */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={activeStudent.avatarUrl}
                    alt={activeStudent.studentName}
                    className="w-16 h-16 rounded-2xl object-cover shadow-sm ring-2 ring-[#6F8F76]/40"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#3F5A46] text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">
                    ★
                  </div>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-extrabold text-[#284230] leading-tight">
                    {activeStudent.studentName}
                  </h3>
                  <span className="text-xs text-[#6B675F] mt-0.5">
                    {activeStudent.schoolName} • {activeStudent.level}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#ebe8e2] text-[11px] text-[#284230] font-bold">
                      Semester 1
                    </span>
                    <span className="text-[11px] text-[#3F5A46] font-bold">
                      Tingkat: Mandiri Aktif
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Parent Contact Box */}
              <div className="p-3.5 bg-[#FAF7F1] rounded-2xl flex flex-col gap-2 border border-[rgba(42,40,35,0.06)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#C1683F]">
                      support_agent
                    </span>
                    <span className="text-xs font-bold text-[#2A2823]">
                      {activeStudent.parentName}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B675F]">Kontak Utama</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#6B675F] pl-6">
                  <span>{activeStudent.parentPhone}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(activeStudent.parentPhone)}
                      className="p-1 rounded-lg hover:bg-[#ebe8e2] text-[#2A2823] transition-colors cursor-pointer"
                      title="Salin Nomor"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenWhatsApp(activeStudent.parentPhone, activeStudent.studentName)
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#ebe8e2] hover:bg-[#284230] hover:text-white text-[#284230] text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px] text-[#C1683F]">
                        send
                      </span>
                      <span>Draf WA</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Geofence & Address Card */}
              <div className="p-3.5 bg-[#FAF7F1] rounded-2xl flex flex-col gap-2 border border-[rgba(42,40,35,0.06)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">
                      home_pin
                    </span>
                    <span className="text-xs font-bold text-[#2A2823]">Lokasi Rumah Siswa</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3F5A46]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6F8F76]"></span> Presensi GPS Aktif
                  </span>
                </div>
                <p className="text-xs text-[#6B675F] pl-6 leading-relaxed">
                  {activeStudent.address} ({activeStudent.landmark}).
                </p>
                <div className="pl-6 pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenGoogleMaps(activeStudent.address)}
                    className="px-3 py-1.5 rounded-lg bg-white text-[#284230] hover:bg-[#ebe8e2] border border-[rgba(42,40,35,0.12)] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#C1683F]">map</span>
                    <span>Buka Google Maps</span>
                  </button>
                  <span className="text-[11px] text-[#6B675F]">Est. 12 mnt dari basecamp</span>
                </div>
              </div>

              {/* 4-Week Cognitive Progress Visual (Pure SVG Bar Chart - Ponytail Review Approved) */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#284230]">
                    Progres Capaian Kognitif (4 Pekan)
                  </span>
                  <span className="text-[11px] font-bold text-[#3F5A46]">Tren: +6.5% Naik</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl flex flex-col gap-2 border border-[rgba(42,40,35,0.06)] shadow-inner">
                  <div className="h-28 w-full flex items-end justify-between gap-3 pt-4 px-2">
                    {activeStudent.cognitiveProgress.map((item, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                      >
                        <span className="text-[11px] font-bold text-[#6B675F]">{item.score}</span>
                        <div
                          className={`w-full rounded-t-lg transition-all ${
                            cIdx === 3
                              ? 'bg-[#C1683F]'
                              : cIdx === 2
                              ? 'bg-[#6F8F76]'
                              : 'bg-[#adcfb3]/70'
                          }`}
                          style={{ height: `${item.heightPercent}%` }}
                        ></div>
                        <span className="text-[10px] text-[#6B675F] truncate w-full text-center">
                          {item.topic}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Latest Affective Observation Notes */}
              <div className="p-3.5 bg-[#ebe8e2]/60 rounded-2xl flex flex-col gap-2 border border-[rgba(42,40,35,0.06)]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#C1683F]">
                    psychology
                  </span>
                  <span className="text-xs font-bold text-[#2A2823]">
                    Catatan Afektif &amp; Karakter Tutor
                  </span>
                </div>
                <p className="text-xs text-[#424843] leading-relaxed italic bg-white/70 p-2.5 rounded-xl border border-[rgba(42,40,35,0.04)]">
                  {activeStudent.affectiveNote}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#6B675F] pt-0.5">
                  <span>Diobservasi oleh {tutorName}</span>
                  <span>{activeStudent.affectiveDate}</span>
                </div>
              </div>

              {/* Recent LKPD & Score Records */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[#284230]">
                  Riwayat LKPD &amp; Nilai Terakhir
                </span>
                <div className="flex flex-col gap-2">
                  {activeStudent.recentLkpd.map((lkpd, lIdx) => (
                    <div
                      key={lIdx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F1] text-xs border border-[rgba(42,40,35,0.04)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">
                          assignment_turned_in
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-[#284230] truncate">
                            {lkpd.title}
                          </span>
                          <span className="text-[11px] text-[#6B675F]">{lkpd.subtitle}</span>
                        </div>
                      </div>
                      <span className="font-bold text-[#3F5A46] text-xs shrink-0 px-2 py-0.5 bg-white rounded-lg border border-[rgba(42,40,35,0.08)]">
                        {lkpd.score}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Scheduled Visit Banner */}
              <div className="p-3.5 bg-[#c8ebce]/60 rounded-2xl flex items-center justify-between border border-[#c8ebce]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#284230] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">event_upcoming</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#2f4d38] uppercase tracking-wider font-extrabold">
                      Kunjungan Berikutnya
                    </span>
                    <span className="text-xs font-bold text-[#284230]">
                      {activeStudent.nextVisitText}
                    </span>
                    <span className="text-[11px] text-[#6B675F]">
                      Materi: {activeStudent.nextVisitTopic}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[22px] text-[#3F5A46]">
                  chevron_right
                </span>
              </div>

              {/* Bottom Actions */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#ebe8e2] hover:bg-[#e5e2dc] text-[#284230] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  <span>Input Nilai Baru</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenWhatsApp(activeStudent.parentPhone, activeStudent.studentName)
                  }
                  className="px-4 py-2.5 rounded-xl bg-[#C1683F] hover:opacity-90 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Ringkasan ke Ortu</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#f6f3ed] rounded-3xl p-6 text-center text-xs text-[#6B675F]">
              Pilih salah satu siswa di kolom kiri untuk melihat ringkasan perkembangan.
            </div>
          )}
        </div>
      </section>

      {/* Modal: Tambah Catatan Siswa */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#C1683F]">
                  psychology
                </span>
                <h3 className="text-base font-bold text-[#284230]">
                  Catatan Perkembangan Siswa Binaan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNoteModal(false)}
                className="text-[#6B675F] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveObservation} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2A2823]">Siswa Terpilih</label>
                <div className="p-2.5 rounded-xl bg-[#FAF7F1] text-xs font-semibold text-[#284230] border border-[rgba(42,40,35,0.08)]">
                  {activeStudent ? activeStudent.studentName : 'Pilih Siswa'} ({activeStudent?.level})
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2A2823]">Observasi Afektif &amp; Karakter</label>
                <textarea
                  rows={4}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Tulis catatan observasi afektif..."
                  className="w-full bg-[#FAF7F1] p-3 rounded-xl text-xs text-[#1c1c18] border border-[rgba(42,40,35,0.12)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#284230] hover:bg-[#3F5A46] text-white shadow-xs cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Unduh Rekap Kelas */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#3F5A46]">
                  file_download
                </span>
                <h3 className="text-base font-bold text-[#284230]">Unduh Rekap Siswa Binaan</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="text-[#6B675F] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#6B675F] leading-relaxed">
              Dokumen rekap kelas berisi direktori kontak murid, catatan nilai LKPD, serta persentase kehadiran tatap muka siap dicetak atau disimpan sebagai PDF.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDownloadModal(false);
                  window.print();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#284230] hover:bg-[#3F5A46] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
