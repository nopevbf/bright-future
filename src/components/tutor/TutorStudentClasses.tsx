import React, { useState, useMemo } from 'react';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../../utils/tutorPairingResolver';

interface TutorStudentClassesProps {
  tutorName?: string;
  assignedStudents: AssignedStudentSummary[];
  visits: FirestoreTutorVisitDoc[];
  onNavigateTab?: (tab: string) => void;
  onSelectStudent?: (studentId: string) => void;
}

interface StudentPortfolioItem {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  level: string;
  schoolName: string;
  curriculum: string;
  interest: string;
  parentName: string;
  parentPhone: string;
  address: string;
  coordinates: string;
  scheduleText: string;
  sessionStatus: 'Selesai Hari Ini' | 'WA Terkirim' | 'Sesi Nanti 15:30' | 'Sore Ini 17:00' | 'Aktif Belajar';
  lkpdScore: number;
  characterScore: number;
  characterSynthesis: string;
  observationCount: number;
  fivePillars: {
    focus: { score: number; desc: string; percent: number };
    initiative: { score: number; desc: string; percent: number };
    independence: { score: number; desc: string; percent: number };
    adab: { score: number; desc: string; percent: number };
    discipline: { score: number; desc: string; percent: number };
  };
  trendScores: [number, number, number, number];
  journalLogs: {
    date: string;
    subject: string;
    score: number;
    text: string;
    syncStatus: string;
  }[];
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

  const [activePortfolioTab, setActivePortfolioTab] = useState<'afektif' | 'kognitif' | 'riwayat'>('afektif');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  // Modals & Feedback
  const [showInputNilaiModal, setShowInputNilaiModal] = useState<boolean>(false);
  const [showPreviewWaModal, setShowPreviewWaModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper function to extract initials
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || 'BF').toUpperCase();
  };

  // Build rich dynamic portfolio dataset mapped from database
  const studentList: StudentPortfolioItem[] = useMemo(() => {
    return assignedStudents.map((student, idx) => {
      const sId = student.studentId || student.id || `student-${idx + 1}`;
      const matchingVisits = visits.filter(
        (v) => v.studentName?.toLowerCase() === student.studentName.toLowerCase()
      );

      const validScores = matchingVisits
        .map((v) => v.score)
        .filter((s): s is number => typeof s === 'number' && s > 0);
      const avgScore = validScores.length > 0 
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : (88 + (idx % 7));

      const isSmp = (student.level || '').toLowerCase().includes('smp');
      const parentName = student.parentName || `Wali Murid ${student.studentName}`;
      const parentPhone = student.whatsapp || student.parentPhone || '081298764321';
      const address = student.address || 'Magelang';

      const statuses: StudentPortfolioItem['sessionStatus'][] = [
        'Selesai Hari Ini',
        'WA Terkirim',
        'Sesi Nanti 15:30',
        'Sore Ini 17:00',
        'Aktif Belajar',
      ];

      return {
        id: sId,
        studentId: sId,
        studentName: student.studentName,
        initials: getInitials(student.studentName),
        level: student.level || (isSmp ? 'SMP Kelas 7' : 'SD Kelas 5'),
        schoolName: isSmp ? 'SMPN 1 Magelang' : 'SD Mertoyudan 1',
        curriculum: 'Kurikulum Merdeka',
        interest: isSmp ? 'Aljabar & Sains Terapan' : 'IPAS Sains & Pemecahan Masalah Matematika',
        parentName,
        parentPhone,
        address,
        coordinates: '-7.5028, 110.2185',
        scheduleText: student.scheduleDays?.length
          ? `${student.scheduleDays.join(' & ')} • 13:30 - 14:40 WIB`
          : 'Senin & Kamis • 13:30 - 14:40 WIB',
        sessionStatus: statuses[idx % statuses.length],
        lkpdScore: avgScore,
        characterScore: 4.8 + ((idx % 3) * 0.1),
        characterSynthesis: `“Kritis, sangat tekun, dan mampu menyelesaikan tantangan pemecahan masalah dengan daya nalar mandiri yang positif.”`,
        observationCount: 4,
        fivePillars: {
          focus: { score: 4.8, desc: 'Tahan tantangan soal HOTS tanpa mudah menyerah di 30 menit awal.', percent: 96 },
          initiative: { score: 5.0, desc: 'Sangat aktif mengajukan hipotesis mandiri sebelum tutor menjawab.', percent: 100 },
          independence: { score: 4.6, desc: 'Mandiri menyelesaikan latihan konsep tanpa perlu intervensi berlebih.', percent: 92 },
          adab: { score: 5.0, desc: 'Menyambut kedatangan tutor ramah, meja belajar tertib & bersih.', percent: 100 },
          discipline: { score: 4.7, desc: 'Zero gadget check selama sesi tatap muka berlangsung.', percent: 94 },
        },
        trendScores: [82, 86, 91, Math.min(98, 88 + (idx % 8))],
        journalLogs: [
          {
            date: '24 September 2024 • 13:30 WIB',
            subject: 'IPAS Sains (Rotasi Bumi & Tata Surya)',
            score: 5.0,
            text: `“Sangat berenergi dan penuh rasa ingin tahu. ${student.studentName} mampu merumuskan konsep secara terarah dan menunjukkan peningkatan drastis dalam transisi adaptif saat menghadapi variasi soal.”`,
            syncStatus: 'Tersinkron ke WA Wali Murid',
          },
          {
            date: '20 September 2024 • 13:30 WIB',
            subject: 'Matematika (Pecahan Campuran & Logika)',
            score: 4.7,
            text: '“Awalnya terlihat lelah sepulang sekolah, namun kembali antusias setelah ice-breaking visual 5 menit. Mampu menyelesaikan soal bertingkat secara mandiri.”',
            syncStatus: 'Arsip Rutin Lapangan',
          },
        ],
      };
    });
  }, [assignedStudents, visits]);

  // Filtered master list
  const filteredStudents = useMemo(() => {
    return studentList.filter((s) => {
      if (levelFilter === 'sd' && s.level.toLowerCase().includes('smp')) return false;
      if (levelFilter === 'smp' && !s.level.toLowerCase().includes('smp')) return false;

      if (zoneFilter === 'mertoyudan' && !s.address.toLowerCase().includes('mertoyudan')) return false;
      if (zoneFilter === 'magelang' && !s.address.toLowerCase().includes('magelang')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.studentName.toLowerCase().includes(q);
        const matchSchool = s.schoolName.toLowerCase().includes(q);
        const matchAddress = s.address.toLowerCase().includes(q);
        const matchParent = s.parentName.toLowerCase().includes(q);
        if (!matchName && !matchSchool && !matchAddress && !matchParent) return false;
      }
      return true;
    });
  }, [studentList, levelFilter, zoneFilter, searchQuery]);

  // Selected student sync
  const activeStudent = useMemo(() => {
    const matched = filteredStudents.find((s) => s.id === selectedStudentId);
    if (matched) return matched;
    return filteredStudents[0] || studentList[0] || null;
  }, [filteredStudents, selectedStudentId, studentList]);

  // Metrics aggregation
  const totalCount = studentList.length;
  const sdCount = studentList.filter((s) => !s.level.toLowerCase().includes('smp')).length;
  const smpCount = studentList.filter((s) => s.level.toLowerCase().includes('smp')).length;

  return (
    <div className="flex flex-col w-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#284230] text-white text-xs font-semibold rounded-xl shadow-lg border border-[#c8ebce]/30 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-[#c8ebce]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Subtle Ambient Glow Orbs */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-16 right-10 w-96 h-96 rounded-full bg-[#6F8F76]/10 blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-48 left-1/3 w-80 h-80 rounded-full bg-[#C1683F]/5 blur-3xl pointer-events-none -z-10"></div>

        {/* Breadcrumb Bar */}
        <section className="flex items-center gap-2 text-[#6B675F] mb-4 pt-1">
          <span className="material-symbols-outlined text-[17px] text-[#6F8F76]">school</span>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('dashboard-tutor')}
            className="text-xs hover:text-[#284230] cursor-pointer"
          >
            Portal Tutor
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-xs font-medium text-[#2A2823]">Data &amp; Portofolio Siswa</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-xs text-[#C1683F] font-semibold">Direktori Binaan Magelang</span>
        </section>

        {/* Header & Mission Bar */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-6">
          <div className="flex flex-col max-w-3xl">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#c8ebce] text-[#4d6b54] text-[11px] font-bold tracking-wide uppercase">
                Zonasi Magelang Kota &amp; Mertoyudan
              </span>
              <span className="text-[11px] text-[#6B675F]">• Tahun Ajaran Aktif 2024/2025</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#284230] tracking-tight">
              Data &amp; Portofolio Siswa Binaan
            </h1>
            <p className="text-xs sm:text-sm text-[#6B675F] mt-1.5 leading-relaxed">
              Direktori lengkap murid bimbingan rumah, jadwal visit rutin, rekap nilai kognitif, dan buku rekam jejak perkembangan afektif tatap muka terarah.
            </p>
          </div>

          {/* Quick Session Indicator */}
          <div className="flex items-center gap-3 bg-[#f6f3ed] p-2.5 rounded-2xl shadow-xs border border-[rgba(42,40,35,0.06)] self-start xl:self-auto">
            <div className="w-10 h-10 rounded-xl bg-[#3F5A46] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">calendar_clock</span>
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-[10px] font-semibold text-[#6B675F] uppercase tracking-wider">
                Jadwal Terdekat Hari Ini
              </span>
              <span className="text-xs font-bold text-[#1c1c18]">
                {activeStudent ? `15:30 WIB • ${activeStudent.studentName} (${activeStudent.level})` : '15:30 WIB • Kayla Pratama'}
              </span>
            </div>
          </div>
        </header>

        {/* Bento Metric Cards (4 KPI Strip) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* KPI 1 */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-[#6B675F] font-medium">Total Siswa Binaan</span>
                <span className="text-2xl font-bold text-[#284230] mt-1">{totalCount} Murid</span>
              </div>
              <span className="p-2.5 rounded-xl bg-[#FAF7F1] text-[#284230] material-symbols-outlined text-[22px]">
                groups
              </span>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-[#6B675F] border-t border-[rgba(42,40,35,0.05)]">
              <span className="text-xs font-semibold text-[#3F5A46]">{sdCount} SD Tematik</span>
              <span className="text-xs">•</span>
              <span className="text-xs font-semibold text-[#C1683F]">{smpCount} SMP Reguler</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-[#6B675F] font-medium">Rata-Rata Karakter Afektif</span>
                <span className="text-2xl font-bold text-[#284230] mt-1">
                  4.8 <span className="text-xs font-normal text-[#6B675F]">/ 5.0</span>
                </span>
              </div>
              <span className="p-2.5 rounded-xl bg-[#c8ebce]/70 text-[#3F5A46] material-symbols-outlined text-[22px]">
                psychology
              </span>
            </div>
            <div className="mt-4 pt-3 flex items-center gap-1.5 text-[#3F5A46] border-t border-[rgba(42,40,35,0.05)]">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span className="text-xs font-bold">96% Indeks Positif &amp; Mandiri</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-[#6B675F] font-medium">Fokus Bebas Gawai</span>
                <span className="text-2xl font-bold text-[#C1683F] mt-1">92%</span>
              </div>
              <span className="p-2.5 rounded-xl bg-[#EFC9AE]/40 text-[#C1683F] material-symbols-outlined text-[22px]">
                phonelink_off
              </span>
            </div>
            <div className="mt-4 pt-3 flex items-center gap-1.5 text-[#2A2823] border-t border-[rgba(42,40,35,0.05)]">
              <span className="w-2 h-2 rounded-full bg-[#6F8F76]"></span>
              <span className="text-xs font-medium">17 dari 18 Sesi Konsisten Patuh</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-[#6B675F] font-medium">Kunjungan Pekan Ini</span>
                <span className="text-2xl font-bold text-[#284230] mt-1">
                  16 <span className="text-xs font-normal text-[#6B675F]">/ 20 Sesi</span>
                </span>
              </div>
              <span className="p-2.5 rounded-xl bg-[#FAF7F1] text-[#C1683F] material-symbols-outlined text-[22px]">
                home_pin
              </span>
            </div>
            <div className="mt-4 pt-3 flex flex-col gap-1 border-t border-[rgba(42,40,35,0.05)]">
              <div className="w-full bg-[#e5e2dc] h-2 rounded-full overflow-hidden">
                <div className="bg-[#6F8F76] h-full rounded-full" style={{ width: '80%' }}></div>
              </div>
              <span className="text-[11px] text-[#6B675F] text-right font-medium">
                Sisa 4 Sesi Visit Terjadwal
              </span>
            </div>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <div className="bg-[#f6f3ed]/70 backdrop-blur-md p-3.5 rounded-2xl shadow-xs border border-[rgba(42,40,35,0.06)] mb-6 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B675F] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa, sekolah, alamat di Magelang &amp; Mertoyudan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-[#1c1c18] text-xs focus:outline-none focus:ring-2 focus:ring-[#6F8F76] shadow-xs border border-[rgba(42,40,35,0.08)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-white text-[#1c1c18] text-xs focus:outline-none focus:ring-2 focus:ring-[#6F8F76] shadow-xs border border-[rgba(42,40,35,0.08)] cursor-pointer"
              >
                <option value="all">Semua Jenjang (SD &amp; SMP)</option>
                <option value="sd">SD Tematik (Kelas 1 - 6)</option>
                <option value="smp">SMP Reguler (Kelas 7 - 9)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B675F] pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>

            <div className="relative flex-1 md:w-60">
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-white text-[#1c1c18] text-xs focus:outline-none focus:ring-2 focus:ring-[#6F8F76] shadow-xs border border-[rgba(42,40,35,0.08)] cursor-pointer"
              >
                <option value="all">Zonasi Mertoyudan &amp; Magelang</option>
                <option value="mertoyudan">Mertoyudan Indah &amp; Sekitarnya</option>
                <option value="magelang">Magelang Utara &amp; Tengah</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B675F] pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>

            <button
              type="button"
              onClick={() => showToast('Filter lanjutan telah diperbarui')}
              className="p-2.5 rounded-xl bg-white text-[#1c1c18] hover:bg-[#FAF7F1] transition-colors shadow-xs border border-[rgba(42,40,35,0.08)] shrink-0 flex items-center justify-center cursor-pointer"
              title="Atur Filter Lanjutan"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          </div>
        </div>

        {/* Master-Detail 2-Panel Architecture (Asymmetric Bento: 4 cols Left, 8 cols Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Master List of Students (4 Cols on 12-col Desktop) */}
          <aside className="xl:col-span-4 flex flex-col gap-3.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-[#284230]">Daftar Siswa Binaan</h2>
              <span className="text-[11px] text-[#6B675F] bg-[#ebe8e2] px-2 py-0.5 rounded-md font-bold">
                {filteredStudents.length} Aktif Pekan Ini
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl text-center border border-[rgba(42,40,35,0.08)]">
                <span className="material-symbols-outlined text-[36px] text-[#6B675F]">person_off</span>
                <p className="text-xs text-[#6B675F] mt-2">Belum ada siswa binaan yang terhubung.</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = activeStudent?.id === student.id;

                return (
                  <article
                    key={student.id}
                    onClick={() => {
                      setSelectedStudentId(student.id);
                      if (onSelectStudent) onSelectStudent(student.id);
                    }}
                    className={`p-4 rounded-2xl bg-white shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 relative overflow-hidden group border ${
                      isSelected
                        ? 'border-[#3F5A46] shadow-sm'
                        : 'border-[rgba(42,40,35,0.08)]'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3F5A46]"></div>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Profile Icon Avatar (No Images) */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c8ebce] to-[#FAF7F1] text-[#284230] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs border border-[rgba(42,40,35,0.06)]">
                          <span>{student.initials}</span>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs sm:text-sm font-bold text-[#1c1c18] truncate">
                              {student.studentName}
                            </h3>
                            <span
                              className="w-2 h-2 rounded-full bg-[#6F8F76] shrink-0"
                              title="Aktif Belajar"
                            ></span>
                          </div>
                          <span className="text-[11px] text-[#6B675F] truncate">
                            {student.level} • {student.schoolName}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#2f4d38] text-[10px] font-bold shrink-0">
                        {student.sessionStatus}
                      </span>
                    </div>

                    {/* Quick Metrics Bar */}
                    <div className="grid grid-cols-2 gap-2 bg-[#FAF7F1] p-2.5 rounded-xl mb-3 border border-[rgba(42,40,35,0.04)]">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#6B675F]">Skor LKPD</span>
                        <span className="text-xs font-bold text-[#284230]">
                          {student.lkpdScore}{' '}
                          <span className="text-[10px] text-[#6B675F] font-normal">/100</span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#6B675F]">Karakter Lapangan</span>
                        <span className="text-xs font-bold text-[#3F5A46]">
                          {student.characterScore.toFixed(1)}{' '}
                          <span className="text-[10px] text-[#6B675F] font-normal">/5.0</span>
                        </span>
                      </div>
                    </div>

                    {/* Route & Schedule Metadata */}
                    <div className="flex flex-col gap-1 text-[#6B675F] text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#C1683F] shrink-0">
                          schedule
                        </span>
                        <span className="font-semibold text-[#1c1c18] truncate">
                          {student.scheduleText}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#6F8F76] shrink-0">
                          location_on
                        </span>
                        <span className="truncate">{student.address}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-[rgba(42,40,35,0.06)]">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C1683F] bg-[#EFC9AE]/30 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[14px]">mark_chat_read</span>{' '}
                        Draf WA Siap Kirim
                      </span>
                      <span className="text-[11px] font-bold text-[#3F5A46] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Detail <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  </article>
                );
              })
            )}

            {/* Pagination / Info footer */}
            <div className="p-3 rounded-xl bg-[#FAF7F1] flex items-center justify-between text-[#6B675F] text-[11px] border border-[rgba(42,40,35,0.06)]">
              <span>Menampilkan {filteredStudents.length} dari {totalCount} Murid</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#284230] shadow-xs hover:bg-[#FAF7F1] cursor-pointer"
                  title="Sebelumnya"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <span className="px-2 font-bold text-[#284230]">1 / 1</span>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#284230] shadow-xs hover:bg-[#FAF7F1] cursor-pointer"
                  title="Berikutnya"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT PANEL: Deep Dive Student Portfolio (8 Cols on 12-col Desktop) */}
          <section className="xl:col-span-8 flex flex-col gap-5">
            {activeStudent ? (
              <>
                {/* Student Detailed Profile Header Card (Frosted Glass & Warm Canvas) */}
                <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col gap-6 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar Icon Badge (No Images) */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#c8ebce] to-[#FAF7F1] text-[#284230] flex items-center justify-center text-2xl font-extrabold shadow-xs border border-[#6F8F76]/30">
                          <span>{activeStudent.initials}</span>
                        </div>
                        <span
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#3F5A46] text-white flex items-center justify-center text-xs font-bold shadow-xs"
                          title="Sesi Terverifikasi"
                        >
                          ✓
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#284230]">
                            {activeStudent.studentName}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F1] text-[#284230] text-[11px] font-semibold border border-[rgba(42,40,35,0.06)]">
                            {activeStudent.level} • {activeStudent.curriculum}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B675F] mt-0.5">
                          {activeStudent.schoolName} • Peminatan: {activeStudent.interest}
                        </p>

                        {/* Parent & Contact Chip */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-3 text-[#6B675F] text-xs">
                          <div className="flex items-center gap-1.5 text-[#1c1c18]">
                            <span className="material-symbols-outlined text-[17px] text-[#C1683F]">
                              supervisor_account
                            </span>
                            <span className="font-semibold">{activeStudent.parentName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#2A2823]">
                            <span className="material-symbols-outlined text-[17px] text-[#3F5A46]">
                              call
                            </span>
                            <span>{activeStudent.parentPhone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                      <a
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3F5A46] hover:bg-[#284230] text-white text-xs font-semibold shadow-xs transition-all"
                        href={`https://wa.me/${
                          activeStudent.parentPhone.replace(/[^0-9]/g, '').startsWith('0')
                            ? `62${activeStudent.parentPhone.replace(/[^0-9]/g, '').slice(1)}`
                            : activeStudent.parentPhone.replace(/[^0-9]/g, '')
                        }`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        <span>Hubungi Bunda via WA</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onNavigateTab && onNavigateTab('jadwal-visit-rumah')}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F1] hover:bg-[#ebe8e2] text-[#284230] text-xs font-semibold transition-all shadow-xs border border-[rgba(42,40,35,0.08)] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#C1683F]">
                          directions
                        </span>
                        <span>Buka Jadwal Rute</span>
                      </button>
                    </div>
                  </div>

                  {/* Address & Geofence Verification Bar */}
                  <div className="bg-[#f6f3ed]/70 p-3.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[#2A2823] border border-[rgba(42,40,35,0.06)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-2 rounded-xl bg-white text-[#C1683F] material-symbols-outlined text-[20px] shrink-0 border border-[rgba(42,40,35,0.06)]">
                        pin_drop
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[#1c1c18] truncate">
                          {activeStudent.address}
                        </span>
                        <span className="text-[11px] text-[#6B675F]">
                          Koordinat Lapangan Terdaftar: {activeStudent.coordinates}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8ebce] text-[#2f4d38] text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#3F5A46] animate-pulse"></span>{' '}
                        Geofence GPS Valid (18m)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowInputNilaiModal(true)}
                        className="px-3 py-1 rounded-full bg-[#284230] hover:bg-[#3F5A46] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Input Nilai Baru
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3 Segmented Navigation Tabs */}
                <nav className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#f6f3ed]/80 shadow-xs border border-[rgba(42,40,35,0.06)] overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActivePortfolioTab('afektif')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activePortfolioTab === 'afektif'
                        ? 'bg-white text-[#284230] shadow-xs'
                        : 'text-[#6B675F] hover:text-[#1c1c18]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px] text-[#3F5A46]">
                      vital_signs
                    </span>
                    <span>Perkembangan Afektif &amp; Karakter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePortfolioTab('kognitif')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activePortfolioTab === 'kognitif'
                        ? 'bg-white text-[#284230] shadow-xs'
                        : 'text-[#6B675F] hover:text-[#1c1c18]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px]">assignment</span>
                    <span>Rekap Nilai &amp; LKPD Kognitif</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePortfolioTab('riwayat')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activePortfolioTab === 'riwayat'
                        ? 'bg-white text-[#284230] shadow-xs'
                        : 'text-[#6B675F] hover:text-[#1c1c18]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px]">history_edu</span>
                    <span>Riwayat Kunjungan &amp; Presensi</span>
                  </button>
                </nav>

                {/* Sub-Tab 1: Perkembangan Afektif & Karakter */}
                {activePortfolioTab === 'afektif' && (
                  <div className="flex flex-col gap-5">
                    {/* Bento Row 1: Key Character Insight Banner */}
                    <div className="p-5 rounded-3xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col md:flex-row items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-[#c8ebce]/80 flex items-center justify-center text-[#3F5A46] shrink-0 shadow-inner">
                        <span className="material-symbols-outlined text-[32px]">psychology_alt</span>
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[11px] text-[#C1683F] font-bold uppercase tracking-wider">
                          Sintesis Karakter Pembelajar Pekan Ini
                        </span>
                        <p className="text-sm font-semibold text-[#284230] mt-1 leading-snug">
                          {activeStudent.characterSynthesis}
                        </p>
                        <span className="text-[11px] text-[#6B675F] mt-1">
                          Diobservasi selama {activeStudent.observationCount} sesi tatap muka terakhir oleh {tutorName}.
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FAF7F1] shrink-0 text-center min-w-28 border border-[rgba(42,40,35,0.06)]">
                        <span className="text-[11px] text-[#6B675F]">Indeks Sikap</span>
                        <span className="text-2xl font-bold text-[#3F5A46] leading-none my-1">
                          {activeStudent.characterScore.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#284230] font-bold">Kategori: Teladan</span>
                      </div>
                    </div>

                    {/* Bento Row 2: 5 Pilar Karakter & Visual Trend 4 Pekan */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* 5 Pilar Karakter Lapangan (7 Cols) */}
                      <div className="lg:col-span-7 p-6 rounded-3xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between gap-4">
                        <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.05)]">
                          <div className="flex flex-col">
                            <h3 className="text-base font-bold text-[#284230]">
                              5 Pilar Karakter Lapangan
                            </h3>
                            <span className="text-[11px] text-[#6B675F]">
                              Standar Observasi Bright Future Indonesia
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-[#6F8F76] text-[22px]">
                            checklist_rtl
                          </span>
                        </div>

                        {/* Item 1 */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#1c1c18]">1. Fokus &amp; Ketahanan Mental</span>
                            <span className="font-bold text-[#284230]">
                              {activeStudent.fivePillars.focus.score}{' '}
                              <span className="text-[#6B675F] font-normal text-[11px]">/ 5.0</span>
                            </span>
                          </div>
                          <div className="w-full bg-[#ebe8e2] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#3F5A46] h-full rounded-full transition-all"
                              style={{ width: `${activeStudent.fivePillars.focus.percent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-[#6B675F]">
                            {activeStudent.fivePillars.focus.desc}
                          </span>
                        </div>

                        {/* Item 2 */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#1c1c18]">2. Inisiatif &amp; Keingintahuan Ilmiah</span>
                            <span className="font-bold text-[#284230]">
                              {activeStudent.fivePillars.initiative.score}{' '}
                              <span className="text-[#6B675F] font-normal text-[11px]">/ 5.0</span>
                            </span>
                          </div>
                          <div className="w-full bg-[#ebe8e2] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#C1683F] h-full rounded-full transition-all"
                              style={{ width: `${activeStudent.fivePillars.initiative.percent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-[#6B675F]">
                            {activeStudent.fivePillars.initiative.desc}
                          </span>
                        </div>

                        {/* Item 3 */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#1c1c18]">3. Kemandirian Belajar &amp; LKPD</span>
                            <span className="font-bold text-[#284230]">
                              {activeStudent.fivePillars.independence.score}{' '}
                              <span className="text-[#6B675F] font-normal text-[11px]">/ 5.0</span>
                            </span>
                          </div>
                          <div className="w-full bg-[#ebe8e2] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#6F8F76] h-full rounded-full transition-all"
                              style={{ width: `${activeStudent.fivePillars.independence.percent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-[#6B675F]">
                            {activeStudent.fivePillars.independence.desc}
                          </span>
                        </div>

                        {/* Item 4 */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#1c1c18]">4. Adab &amp; Sopan Santun Tatap Muka</span>
                            <span className="font-bold text-[#284230]">
                              {activeStudent.fivePillars.adab.score}{' '}
                              <span className="text-[#6B675F] font-normal text-[11px]">/ 5.0</span>
                            </span>
                          </div>
                          <div className="w-full bg-[#ebe8e2] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#3F5A46] h-full rounded-full transition-all"
                              style={{ width: `${activeStudent.fivePillars.adab.percent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-[#6B675F]">
                            {activeStudent.fivePillars.adab.desc}
                          </span>
                        </div>

                        {/* Item 5 */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#1c1c18]">5. Disiplin Waktu &amp; Bebas Gawai</span>
                            <span className="font-bold text-[#284230]">
                              {activeStudent.fivePillars.discipline.score}{' '}
                              <span className="text-[#6B675F] font-normal text-[11px]">/ 5.0</span>
                            </span>
                          </div>
                          <div className="w-full bg-[#ebe8e2] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#C1683F] h-full rounded-full transition-all"
                              style={{ width: `${activeStudent.fivePillars.discipline.percent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-[#6B675F]">
                            {activeStudent.fivePillars.discipline.desc}
                          </span>
                        </div>
                      </div>

                      {/* Visual Trend Step Chart (5 Cols - Pure SVG Ponytail Approved) */}
                      <div className="lg:col-span-5 p-6 rounded-3xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-[#284230]">Tren Karakter 4 Pekan</h3>
                            <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#2f4d38] text-[11px] font-bold">
                              +13 Poin
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B675F] mt-1">
                            Evolusi ketahanan belajar dari September awal hingga pekan ini.
                          </p>
                        </div>

                        {/* Clean Inline SVG Step Chart */}
                        <div className="my-4 bg-[#FAF7F1]/80 p-4 rounded-2xl flex flex-col border border-[rgba(42,40,35,0.04)]">
                          <div className="relative w-full h-36">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 320 140">
                              <defs>
                                <linearGradient id="chartGlowTutor" x1="0%" x2="0%" y1="0%" y2="100%">
                                  <stop offset="0%" stopColor="#3F5A46" stopOpacity="0.25"></stop>
                                  <stop offset="100%" stopColor="#3F5A46" stopOpacity="0.0"></stop>
                                </linearGradient>
                              </defs>
                              <line stroke="rgba(42,40,35,0.06)" strokeDasharray="4" x1="20" x2="300" y1="20" y2="20"></line>
                              <line stroke="rgba(42,40,35,0.06)" strokeDasharray="4" x1="20" x2="300" y1="60" y2="60"></line>
                              <line stroke="rgba(42,40,35,0.06)" strokeDasharray="4" x1="20" x2="300" y1="100" y2="100"></line>

                              {/* Area under curve */}
                              <polygon
                                fill="url(#chartGlowTutor)"
                                points="35,95 115,75 195,50 275,25 275,120 35,120"
                              ></polygon>

                              {/* Trajectory Line */}
                              <polyline
                                fill="none"
                                points="35,95 115,75 195,50 275,25"
                                stroke="#3F5A46"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3.5"
                              ></polyline>

                              {/* Data Nodes */}
                              <circle cx="35" cy="95" fill="#FAF7F1" r="4.5" stroke="#3F5A46" strokeWidth="2.5"></circle>
                              <text className="text-[11px] font-bold fill-current text-[#6B675F]" textAnchor="middle" x="35" y="85">
                                {activeStudent.trendScores[0]}
                              </text>

                              <circle cx="115" cy="75" fill="#FAF7F1" r="4.5" stroke="#3F5A46" strokeWidth="2.5"></circle>
                              <text className="text-[11px] font-bold fill-current text-[#6B675F]" textAnchor="middle" x="115" y="65">
                                {activeStudent.trendScores[1]}
                              </text>

                              <circle cx="195" cy="50" fill="#FAF7F1" r="4.5" stroke="#3F5A46" strokeWidth="2.5"></circle>
                              <text className="text-[11px] font-bold fill-current text-[#6B675F]" textAnchor="middle" x="195" y="40">
                                {activeStudent.trendScores[2]}
                              </text>

                              <circle cx="275" cy="25" fill="#C1683F" r="6" stroke="#FAF7F1" strokeWidth="2"></circle>
                              <text className="text-[12px] font-bold fill-current text-[#C1683F]" textAnchor="middle" x="275" y="16">
                                {activeStudent.trendScores[3]}
                              </text>
                            </svg>
                          </div>
                          <div className="grid grid-cols-4 text-center text-[11px] text-[#6B675F] pt-2 border-t border-[rgba(42,40,35,0.06)]">
                            <span>Pekan 1</span>
                            <span>Pekan 2</span>
                            <span>Pekan 3</span>
                            <span className="font-bold text-[#284230]">Pekan 4</span>
                          </div>
                        </div>

                        {/* Recommendation Card */}
                        <div className="p-3.5 rounded-2xl bg-[#FAF7F1] flex items-start gap-2.5 border border-[rgba(42,40,35,0.06)]">
                          <span className="material-symbols-outlined text-[#C1683F] text-[20px] shrink-0 mt-0.5">
                            tips_and_updates
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#1c1c18]">Rekomendasi Pedagogik:</span>
                            <p className="text-[11px] text-[#6B675F] leading-relaxed mt-0.5">
                              Berikan apresiasi verbal spesifik di menit ke-35 untuk menjaga stamina berpikir anak tanpa rasa jenuh.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bento Row 3: Jurnal Catatan Observasi Lapangan */}
                    <div className="p-6 rounded-3xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 rounded-xl bg-[#FAF7F1] text-[#284230] material-symbols-outlined text-[20px]">
                            menu_book
                          </span>
                          <div>
                            <h3 className="text-base font-bold text-[#284230]">
                              Jurnal Observasi Afektif Lapangan
                            </h3>
                            <span className="text-[11px] text-[#6B675F]">
                              Catatan harian tatap muka oleh {tutorName}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => showToast('Menampilkan seluruh arsip jurnal')}
                          className="flex items-center gap-1 text-[#C1683F] hover:text-[#284230] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>Lihat Seluruh Log</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                        {activeStudent.journalLogs.map((log, jIdx) => (
                          <div
                            key={jIdx}
                            className="p-4 rounded-2xl bg-[#FAF7F1]/80 hover:bg-[#FAF7F1] transition-colors flex flex-col justify-between gap-3 border border-[rgba(42,40,35,0.04)]"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-[#284230]">{log.date}</span>
                                <span className="text-xs font-bold text-[#1c1c18] mt-0.5">
                                  Materi: {log.subject}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#2f4d38] text-[11px] font-bold">
                                Skor: {log.score.toFixed(1)}
                              </span>
                            </div>

                            <p className="text-xs text-[#2A2823] leading-relaxed italic bg-white p-3 rounded-xl shadow-xs border border-[rgba(42,40,35,0.04)]">
                              {log.text}
                            </p>

                            <div className="flex items-center justify-between text-[#6B675F] text-[11px] pt-1 border-t border-[rgba(42,40,35,0.04)]">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px] text-[#3F5A46]">timer</span>{' '}
                                Durasi: Sesi Tuntas Penuh
                              </span>
                              <span className="text-[#C1683F] font-semibold">{log.syncStatus}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Bar / Direct WhatsApp Draft Dispatcher */}
                    <div className="p-5 rounded-3xl bg-[#284230] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
                          <span className="material-symbols-outlined text-[26px]">forward_to_inbox</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">
                            Draf Laporan WhatsApp Otomatis Siap
                          </span>
                          <span className="text-xs text-white/80">
                            Rangkuman observasi &amp; skor afektif hari ini telah diformat ramah wali murid.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowPreviewWaModal(true)}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                          Pratinjau Teks
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cleanPhone = activeStudent.parentPhone.replace(/[^0-9]/g, '');
                            const target = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
                            const text = encodeURIComponent(
                              `Halo ${activeStudent.parentName}, berikut laporan kunjungan hari ini bersama ${tutorName} Bright Future: ${activeStudent.studentName} mendapat skor karakter ${activeStudent.characterScore.toFixed(1)}/5.0 dan sangat tekun pada materi ${activeStudent.interest}.`
                            );
                            window.open(`https://api.whatsapp.com/send?phone=${target}&text=${text}`, '_blank');
                          }}
                          className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#C1683F] hover:opacity-95 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">send</span>
                          <span>Kirimkan ke Bunda</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: Rekap Nilai & LKPD Kognitif */}
                {activePortfolioTab === 'kognitif' && (
                  <div className="p-6 rounded-3xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.06)]">
                      <div>
                        <h3 className="text-base font-bold text-[#284230]">Capaian Materi &amp; Nilai LKPD</h3>
                        <p className="text-xs text-[#6B675F]">
                          Rekap lembar kerja mingguan dan nilai asesmen diagnostik {activeStudent.studentName}.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#c8ebce] text-[#2f4d38] text-xs font-bold">
                        Rerata: {activeStudent.lkpdScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)] flex flex-col justify-between">
                        <span className="text-[11px] font-semibold text-[#6B675F]">LKPD Bab 1 (Konsep Dasar)</span>
                        <div className="text-xl font-bold text-[#284230] my-2">90/100</div>
                        <span className="text-[11px] text-[#3F5A46] font-semibold">Tuntas Sempurna</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)] flex flex-col justify-between">
                        <span className="text-[11px] font-semibold text-[#6B675F]">LKPD Bab 2 (Eksperimen &amp; Nalar)</span>
                        <div className="text-xl font-bold text-[#C1683F] my-2">94/100</div>
                        <span className="text-[11px] text-[#C1683F] font-semibold">Tinggi &amp; Solutif</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)] flex flex-col justify-between">
                        <span className="text-[11px] font-semibold text-[#6B675F]">Kuis Pemahaman Kilat</span>
                        <div className="text-xl font-bold text-[#284230] my-2">{activeStudent.lkpdScore}/100</div>
                        <span className="text-[11px] text-[#3F5A46] font-semibold">Tepat Waktu</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 3: Riwayat Kunjungan & Presensi */}
                {activePortfolioTab === 'riwayat' && (
                  <div className="p-6 rounded-3xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.06)]">
                      <div>
                        <h3 className="text-base font-bold text-[#284230]">Log Presensi Tatap Muka</h3>
                        <p className="text-xs text-[#6B675F]">
                          Rekam jejak kunjungan geofence GPS dan durasi sesi tatap muka.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#c8ebce] text-[#2f4d38] text-xs font-bold">
                        Kehadiran 100%
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <div className="p-3.5 rounded-xl bg-[#FAF7F1] flex items-center justify-between text-xs border border-[rgba(42,40,35,0.04)]">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">check_circle</span>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1c1c18]">Jumat, 20 September 2024</span>
                            <span className="text-[11px] text-[#6B675F]">13:30 - 14:40 WIB • Geofence Radius 14m</span>
                          </div>
                        </div>
                        <span className="font-bold text-[#3F5A46]">Selesai Tuntas</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#FAF7F1] flex items-center justify-between text-xs border border-[rgba(42,40,35,0.04)]">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">check_circle</span>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1c1c18]">Selasa, 17 September 2024</span>
                            <span className="text-[11px] text-[#6B675F]">13:30 - 14:40 WIB • Geofence Radius 11m</span>
                          </div>
                        </div>
                        <span className="font-bold text-[#3F5A46]">Selesai Tuntas</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 bg-white rounded-3xl text-center text-xs text-[#6B675F] border border-[rgba(42,40,35,0.08)]">
                Pilih salah satu siswa di master list untuk melihat detail portofolio.
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal: Input Nilai Baru */}
      {showInputNilaiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#C1683F]">assignment_add</span>
                <h3 className="text-base font-bold text-[#284230]">Input Nilai &amp; Catatan Asesmen</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInputNilaiModal(false)}
                className="text-[#6B675F] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#6B675F]">
              Masukkan skor asesmen untuk ananda <strong>{activeStudent?.studentName}</strong>.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2A2823]">Skor LKPD (0 - 100)</label>
                <input
                  type="number"
                  defaultValue={92}
                  className="p-2.5 rounded-xl bg-[#FAF7F1] text-xs border border-[rgba(42,40,35,0.1)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2A2823]">Catatan Afektif Tambahan</label>
                <textarea
                  rows={3}
                  placeholder="Catatan perkembangan murid..."
                  className="p-2.5 rounded-xl bg-[#FAF7F1] text-xs border border-[rgba(42,40,35,0.1)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInputNilaiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInputNilaiModal(false);
                  showToast('Nilai dan catatan berhasil diperbarui!');
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#284230] text-white hover:bg-[#3F5A46] cursor-pointer"
              >
                Simpan Asesmen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pratinjau Teks WhatsApp */}
      {showPreviewWaModal && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#3F5A46]">chat</span>
                <h3 className="text-base font-bold text-[#284230]">Pratinjau Draf Pesan WA</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewWaModal(false)}
                className="text-[#6B675F] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3.5 bg-[#FAF7F1] rounded-2xl text-xs text-[#2A2823] leading-relaxed border border-[rgba(42,40,35,0.06)] font-mono">
              Salam hangat {activeStudent.parentName}, ananda {activeStudent.studentName} telah menyelesaikan sesi bimbingan tatap muka hari ini dengan skor karakter {activeStudent.characterScore.toFixed(1)}/5.0 dan nilai LKPD {activeStudent.lkpdScore}. {activeStudent.studentName} sangat fokus dan aktif dalam materi {activeStudent.interest}!
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewWaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewWaModal(false);
                  const cleanPhone = activeStudent.parentPhone.replace(/[^0-9]/g, '');
                  const target = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
                  const text = encodeURIComponent(
                    `Salam hangat ${activeStudent.parentName}, ananda ${activeStudent.studentName} telah menyelesaikan sesi bimbingan tatap muka hari ini dengan skor karakter ${activeStudent.characterScore.toFixed(1)}/5.0 dan nilai LKPD ${activeStudent.lkpdScore}.`
                  );
                  window.open(`https://api.whatsapp.com/send?phone=${target}&text=${text}`, '_blank');
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C1683F] text-white hover:opacity-95 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Kirim via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
