import React, { useState, useMemo } from 'react';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../../utils/tutorPairingResolver';

interface TutorWorksheetsModulesProps {
  tutorName?: string;
  assignedStudents: AssignedStudentSummary[];
  visits: FirestoreTutorVisitDoc[];
  onNavigateTab?: (tab: string) => void;
}

interface ModuleItem {
  id: string;
  title: string;
  category: 'sd' | 'smp' | 'eksperimen' | 'flashcard';
  level: string;
  subject: 'ipas' | 'matematika' | 'bahasa' | 'fonik';
  subjectLabel: string;
  curriculum: string;
  durationLabel: string;
  description: string;
  format: 'pdf' | 'digital' | 'flashcard';
  formatLabel: string;
  completeness: string;
  targetStudent: string;
  size: string;
  statusBadge: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
}

export const TutorWorksheetsModules: React.FC<TutorWorksheetsModulesProps> = ({
  tutorName = 'Kak Anindya, S.Pd.',
  assignedStudents,
  visits,
  onNavigateTab,
}) => {
  const [selectedPill, setSelectedPill] = useState<'all' | 'sd' | 'smp' | 'eksperimen' | 'flashcard'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  // Modals
  const [previewModule, setPreviewModule] = useState<ModuleItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showDownloadPackageModal, setShowDownloadPackageModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Static rich database of worksheets & modules
  const modulesDatabase: ModuleItem[] = [
    {
      id: 'mod-01',
      title: 'LKPD Sains Bab 4: Gerak Rotasi & Revolusi Bumi',
      category: 'sd',
      level: 'SD Kelas 5',
      subject: 'ipas',
      subjectLabel: 'IPAS SD 5',
      curriculum: 'Kurikulum Merdeka',
      durationLabel: '25 Menit Tatap Muka',
      description: 'Panduan observasi bayangan matahari & lembar pengerjaan 5 butir pemahaman zona waktu WIB/WITA/WIT.',
      format: 'pdf',
      formatLabel: 'PDF Cetak (4 Hlm)',
      completeness: 'Kunci & Rubrik Kognitif',
      targetStudent: 'Rayhan K. (Mertoyudan)',
      size: '2.4 MB',
      statusBadge: 'Siap Cetak',
      iconName: 'public',
      iconBg: 'bg-[#c8ebce]',
      iconColor: 'text-[#3F5A46]',
    },
    {
      id: 'mod-02',
      title: 'Flashcard Fonik & Lembar Motorik Cerita Rakyat',
      category: 'flashcard',
      level: 'SD Kelas 2 & TK-B',
      subject: 'fonik',
      subjectLabel: 'Literasi Fonik',
      curriculum: 'Literasi Dasar',
      durationLabel: '20 Menit Sesi Awal',
      description: 'Set 24 kartu raba huruf vokal & konsonan rangkap dipadukan aktivitas menebalkan jalur ilustrasi Si Kancil.',
      format: 'flashcard',
      formatLabel: 'Kartu Bergambar + LK',
      completeness: 'Calistung Terbimbing',
      targetStudent: 'Kayla Pratama & Alifa',
      size: '1.8 MB',
      statusBadge: 'Fisik Tersedia',
      iconName: 'style',
      iconBg: 'bg-[#EFC9AE]/50',
      iconColor: 'text-[#C1683F]',
    },
    {
      id: 'mod-03',
      title: 'Modul Persamaan Linier Satu Variabel & Masalah Kontekstual',
      category: 'smp',
      level: 'SMP Kelas 7',
      subject: 'matematika',
      subjectLabel: 'Matematika SMP 7',
      curriculum: 'Matematika Aljabar',
      durationLabel: '30 Menit Drill',
      description: '8 Halaman materi konsep neraca timbangan, 10 soal drill bertingkat (mudah, sedang, HOTS cerita pedagang Pasar Rejowinangun).',
      format: 'pdf',
      formatLabel: 'PDF Cetak (8 Hlm)',
      completeness: 'Kunci & Pembahasan HOTS',
      targetStudent: 'Dimas Pratama (Pecinan)',
      size: '3.1 MB',
      statusBadge: 'Siap Bawa',
      iconName: 'calculate',
      iconBg: 'bg-[#ebe8e2]',
      iconColor: 'text-[#284230]',
    },
    {
      id: 'mod-04',
      title: 'Siklus Air & Keberlangsungan Ekosistem',
      category: 'eksperimen',
      level: 'SD Kelas 4',
      subject: 'ipas',
      subjectLabel: 'IPAS SD 4',
      curriculum: 'Kurikulum Merdeka',
      durationLabel: '20 Menit Tatap Muka',
      description: 'Eksperimen kantong plastik evaporasi di jendela rumah dan diagram daur air presipitasi.',
      format: 'pdf',
      formatLabel: 'PDF Cetak (2 Hlm)',
      completeness: 'Kunci Lengkap',
      targetStudent: 'Kevin Pratama (Pahlawan)',
      size: '1.5 MB',
      statusBadge: 'Siap Cetak',
      iconName: 'water_drop',
      iconBg: 'bg-[#c8ebce]',
      iconColor: 'text-[#3F5A46]',
    },
    {
      id: 'mod-05',
      title: 'Menulis Narasi Pengalaman Liburan',
      category: 'sd',
      level: 'SD Kelas 4',
      subject: 'bahasa',
      subjectLabel: 'B. Indonesia SD 4',
      curriculum: 'Kurikulum Merdeka',
      durationLabel: '25 Menit Tatap Muka',
      description: 'Lembar struktur 5W+1H dengan pemandu kata sambung urutan waktu dan rubric penilaian ejaan.',
      format: 'pdf',
      formatLabel: 'PDF Cetak (2 Hlm)',
      completeness: 'Contoh Karangan',
      targetStudent: 'Kevin Pratama & Rayhan',
      size: '1.2 MB',
      statusBadge: 'Siap Cetak',
      iconName: 'edit_note',
      iconBg: 'bg-[#FAF7F1]',
      iconColor: 'text-[#284230]',
    },
    {
      id: 'mod-06',
      title: 'Gerak Lurus Beraturan (GLB & GLBB)',
      category: 'smp',
      level: 'SMP Kelas 7',
      subject: 'ipas',
      subjectLabel: 'Fisika SMP 7',
      curriculum: 'Kurikulum Merdeka',
      durationLabel: '30 Menit Tatap Muka',
      description: 'Analisis grafik v-t, konsep kecepatan vs kelajuan, dan 6 latihan soal kasus perjalanan Magelang - Jogja.',
      format: 'pdf',
      formatLabel: 'PDF Cetak (4 Hlm)',
      completeness: 'Pembahasan Step-by-Step',
      targetStudent: 'Dimas Pratama',
      size: '2.0 MB',
      statusBadge: 'Siap Cetak',
      iconName: 'speed',
      iconBg: 'bg-[#ebe8e2]',
      iconColor: 'text-[#3F5A46]',
    },
    {
      id: 'mod-07',
      title: 'Operasi Pecahan & Bilangan Desimal',
      category: 'sd',
      level: 'SD Kelas 5',
      subject: 'matematika',
      subjectLabel: 'Matematika SD 5',
      curriculum: 'Kurikulum Merdeka',
      durationLabel: '25 Menit Tatap Muka',
      description: 'Metode balok visual pecahan dan konversi persentase untuk Kevin Pratama (Pahlawan, Magelang).',
      format: 'pdf',
      formatLabel: 'PDF Cetak (3 Hlm)',
      completeness: 'Kunci & Penilaian',
      targetStudent: 'Kevin Pratama',
      size: '1.7 MB',
      statusBadge: 'Siap Cetak',
      iconName: 'percent',
      iconBg: 'bg-[#c8ebce]',
      iconColor: 'text-[#284230]',
    },
  ];

  // Filter modules
  const filteredModules = useMemo(() => {
    return modulesDatabase.filter((item) => {
      // Category pill filter
      if (selectedPill === 'sd' && item.category !== 'sd') return false;
      if (selectedPill === 'smp' && item.category !== 'smp') return false;
      if (selectedPill === 'eksperimen' && item.category !== 'eksperimen') return false;
      if (selectedPill === 'flashcard' && item.category !== 'flashcard') return false;

      // Subject dropdown filter
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false;

      // Format dropdown filter
      if (formatFilter !== 'all' && item.format !== formatFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchLevel = item.level.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchStudent = item.targetStudent.toLowerCase().includes(q);
        if (!matchTitle && !matchLevel && !matchDesc && !matchStudent) return false;
      }

      return true;
    });
  }, [modulesDatabase, selectedPill, subjectFilter, formatFilter, searchQuery]);

  // Featured and general collections
  const featuredModules = useMemo(() => {
    return filteredModules.slice(0, 3);
  }, [filteredModules]);

  const generalCollection = useMemo(() => {
    return filteredModules.slice(3);
  }, [filteredModules]);

  const handleOpenWhatsAppAdmin = () => {
    const text = encodeURIComponent(
      `Halo Kak Firman Aji, Koordinator Kurikulum Bright Future. Saya ${tutorName}, ingin mengajukan kebutuhan alat peraga / modul adaptif lapangan untuk kunjungan Magelang.`
    );
    window.open(`https://api.whatsapp.com/send?phone=6285173230198&text=${text}`, '_blank');
  };

  const handleShareToParent = (modTitle: string) => {
    const text = encodeURIComponent(
      `Halo Bapak/Ibu, berikut tautan lembar kerja ananda: "${modTitle}". Mohon dapat dipersiapkan meja belajar yang tenang untuk sesi tatap muka nanti.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#284230] text-white text-xs font-semibold rounded-xl shadow-lg border border-[#c8ebce]/30 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-[#c8ebce]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Context Header & Actions */}
      <header className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#6B675F] text-[11px] font-semibold mb-2">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('dashboard-tutor')}
                className="hover:text-[#284230] cursor-pointer"
              >
                Portal Tutor
              </button>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#284230] font-bold">Modul &amp; Lembar Kerja</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#284230] tracking-tight">
              Modul Ajar &amp; Lembar Kerja Siswa (LKPD)
            </h1>
            <p className="text-xs sm:text-sm text-[#6B675F] max-w-3xl mt-1.5 leading-relaxed">
              Katalog materi cetak &amp; digital siap ajar untuk sesi kunjungan rumah tatap muka terarah, panduan eksperimen, dan lembar refleksi karakter siswa di zonasi Magelang &amp; Mertoyudan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowDownloadPackageModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1c1c18] hover:bg-[#FAF7F1] transition-all shadow-xs border border-[rgba(42,40,35,0.08)] text-xs font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">print</span>
              <span>Unduh Paket Cetak Pekan Ini</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3F5A46] text-white hover:bg-[#284230] transition-all shadow-xs text-xs font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Upload Materi/LKPD Baru</span>
            </button>
          </div>
        </div>

        {/* Bento Ringkasan Metrik (4 Cards) */}
        <section aria-label="Ringkasan Modul &amp; Berkas" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {/* Metric 1 */}
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between relative overflow-hidden group hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                Total Tersedia
              </span>
              <div className="w-8 h-8 rounded-full bg-[#c8ebce] flex items-center justify-center text-[#3F5A46]">
                <span className="material-symbols-outlined text-[18px]">auto_stories</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-[#284230]">48 Modul &amp; LKPD</div>
              <p className="text-xs text-[#6B675F] mt-0.5">32 SD Tematik • 16 SMP Sains/Mat</p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between relative overflow-hidden group hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                Cetak Fisik Siap Bawa
              </span>
              <div className="w-8 h-8 rounded-full bg-[#EFC9AE]/50 flex items-center justify-center text-[#C1683F]">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-[#284230]">12 Berkas Siap</div>
              <p className="text-xs text-[#6B675F] mt-0.5">Pekan 15–21 Sep • Magelang Kota &amp; Mertoyudan</p>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between relative overflow-hidden group hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                Paling Sering Dipakai
              </span>
              <div className="w-8 h-8 rounded-full bg-[#FAF7F1] flex items-center justify-center text-[#3F5A46]">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-base font-bold text-[#284230] truncate">IPAS Bab 4: Bumi &amp; Antariksa</div>
              <p className="text-xs text-[#3F5A46] font-semibold mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">event_repeat</span> 8 Sesi Aktif Pekan Ini
              </p>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between relative overflow-hidden group hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                Offline PWA Sync
              </span>
              <div className="w-8 h-8 rounded-full bg-[#c8ebce] flex items-center justify-center text-[#3F5A46]">
                <span className="material-symbols-outlined text-[18px]">cloud_done</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-[#284230] flex items-center gap-2">
                100%
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#2f4d38] font-bold">
                  Aman Offline
                </span>
              </div>
              <p className="text-xs text-[#6B675F] mt-0.5">Dapat dibuka tanpa sinyal di rumah siswa</p>
            </div>
          </div>
        </section>

        {/* Search & Filter Ribbon */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3 bg-white rounded-2xl shadow-xs border border-[rgba(42,40,35,0.06)] mt-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B675F] text-[20px]">
              search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul modul, bab, jenjang, atau topik kurikulum..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F1] text-xs text-[#1c1c18] placeholder:text-[#6B675F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6F8F76] transition-all border border-[rgba(42,40,35,0.06)]"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => setSelectedPill('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPill === 'all'
                  ? 'bg-[#3F5A46] text-white shadow-xs'
                  : 'bg-[#FAF7F1] text-[#1c1c18] hover:bg-[#ebe8e2]'
              }`}
            >
              Semua Materi ({modulesDatabase.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedPill('sd')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPill === 'sd'
                  ? 'bg-[#3F5A46] text-white shadow-xs'
                  : 'bg-[#FAF7F1] text-[#1c1c18] hover:bg-[#ebe8e2]'
              }`}
            >
              SD Tematik (32)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPill('smp')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPill === 'smp'
                  ? 'bg-[#3F5A46] text-white shadow-xs'
                  : 'bg-[#FAF7F1] text-[#1c1c18] hover:bg-[#ebe8e2]'
              }`}
            >
              SMP Sains &amp; Mat (16)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPill('eksperimen')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPill === 'eksperimen'
                  ? 'bg-[#3F5A46] text-white shadow-xs'
                  : 'bg-[#FAF7F1] text-[#1c1c18] hover:bg-[#ebe8e2]'
              }`}
            >
              LKPD Eksperimen (14)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPill('flashcard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPill === 'flashcard'
                  ? 'bg-[#3F5A46] text-white shadow-xs'
                  : 'bg-[#FAF7F1] text-[#1c1c18] hover:bg-[#ebe8e2]'
              }`}
            >
              Flashcard &amp; Games (8)
            </button>
          </div>

          {/* Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAF7F1] text-xs text-[#1c1c18] border border-[rgba(42,40,35,0.06)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76] cursor-pointer"
            >
              <option value="all">Mapel: Semua</option>
              <option value="ipas">IPAS / Sains</option>
              <option value="matematika">Matematika</option>
              <option value="bahasa">Bahasa Indonesia</option>
              <option value="fonik">Literasi Fonik</option>
            </select>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAF7F1] text-xs text-[#1c1c18] border border-[rgba(42,40,35,0.06)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76] cursor-pointer"
            >
              <option value="all">Format: Semua</option>
              <option value="pdf">PDF Cetak</option>
              <option value="digital">Interaktif Digital</option>
              <option value="flashcard">Flashcard Fisik</option>
            </select>
          </div>
        </div>
      </header>

      {/* 2-Column Balanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Modul & LKPD Catalog (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Section 1: Siap Digunakan Pekan Ini */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#C1683F]"></span>
                <h2 className="text-base font-bold text-[#284230]">
                  Siap Digunakan Pekan Ini (Sesi Aktif Magelang)
                </h2>
              </div>
              <span className="text-[11px] text-[#6B675F] font-semibold">
                {featuredModules.length} Berkas Prioritas
              </span>
            </div>

            {featuredModules.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl text-center border border-[rgba(42,40,35,0.08)]">
                <span className="material-symbols-outlined text-[36px] text-[#6B675F]">menu_book</span>
                <p className="text-xs text-[#6B675F] mt-2">Tidak ada materi yang cocok dengan filter pencarian.</p>
              </div>
            ) : (
              featuredModules.map((item) => (
                <article
                  key={item.id}
                  className="p-6 rounded-2xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col gap-4 border border-[rgba(42,40,35,0.06)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center ${item.iconColor} shrink-0`}>
                        <span className="material-symbols-outlined text-[26px]">{item.iconName}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#2f4d38] text-[10px] font-bold">
                            {item.level}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FAF7F1] text-[#284230] text-[10px] font-semibold border border-[rgba(42,40,35,0.06)]">
                            {item.curriculum}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#EFC9AE]/60 text-[#C1683F] text-[10px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">timer</span>{' '}
                            {item.durationLabel}
                          </span>
                        </div>
                        <h3 className="text-base text-[#1c1c18] font-bold leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#6B675F] mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F1] text-[#3F5A46] text-[11px] font-bold flex items-center gap-1 self-start shrink-0 border border-[rgba(42,40,35,0.06)]">
                      <span className="material-symbols-outlined text-[15px]">verified</span>{' '}
                      {item.statusBadge}
                    </span>
                  </div>

                  {/* Feature Details & Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAF7F1] text-xs border border-[rgba(42,40,35,0.04)]">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#6B675F] uppercase font-bold">Format</span>
                      <span className="font-semibold text-[#284230] mt-0.5">{item.formatLabel}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#6B675F] uppercase font-bold">Kelengkapan</span>
                      <span className="font-semibold text-[#284230] mt-0.5">{item.completeness}</span>
                    </div>
                    <div className="flex flex-col col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-[#6B675F] uppercase font-bold">Siswa Terjadwal</span>
                      <span className="font-semibold text-[#C1683F] truncate mt-0.5">{item.targetStudent}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[rgba(42,40,35,0.06)]">
                    <div className="flex items-center gap-2 text-[#6B675F] text-[11px]">
                      <span className="material-symbols-outlined text-[16px] text-[#3F5A46]">
                        offline_pin
                      </span>
                      <span>Tersimpan di Penyimpanan HP ({item.size})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewModule(item)}
                        className="px-3.5 py-2 rounded-xl bg-[#FAF7F1] hover:bg-[#ebe8e2] text-[#1c1c18] transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        <span>Pratinjau</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast(`Mengunduh berkas ${item.title}...`)}
                        className="px-3.5 py-2 rounded-xl bg-[#3F5A46] text-white hover:bg-[#284230] transition-all shadow-xs text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span>Unduh PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareToParent(item.title)}
                        className="p-2 rounded-xl bg-[#FAF7F1] hover:bg-[#ebe8e2] text-[#1c1c18] transition-colors cursor-pointer"
                        title="Tugaskan ke Siswa"
                      >
                        <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          {/* Section 2: Koleksi Modul Berdasarkan Mata Pelajaran */}
          <section className="flex flex-col gap-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#6F8F76]"></span>
                <h2 className="text-base font-bold text-[#284230]">
                  Koleksi Lembar Kerja per Mata Pelajaran
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPill('all')}
                className="text-xs text-[#C1683F] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua ({modulesDatabase.length})</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generalCollection.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-3 border border-[rgba(42,40,35,0.06)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F1] text-[#284230] font-bold border border-[rgba(42,40,35,0.06)]">
                        {item.subjectLabel}
                      </span>
                      <span className="text-[11px] text-[#6B675F]">{item.durationLabel}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#1c1c18] leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#6B675F] mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(42,40,35,0.06)]">
                    <span className="text-[11px] text-[#3F5A46] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">done_all</span>{' '}
                      {item.completeness}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleShareToParent(item.title)}
                        className="p-1.5 rounded-lg text-[#6B675F] hover:text-[#284230] hover:bg-[#FAF7F1] transition-colors cursor-pointer"
                        title="Kirim WA ke Orang Tua"
                      >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast(`Mengunduh ${item.title}...`)}
                        className="p-1.5 rounded-lg text-[#6B675F] hover:text-[#284230] hover:bg-[#FAF7F1] transition-colors cursor-pointer"
                        title="Unduh Modul"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Panels & Field Guidelines (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card 1: Checklist Kelengkapan Modul Hari Ini */}
          <section className="p-6 rounded-2xl bg-white shadow-xs flex flex-col gap-4 border border-[rgba(42,40,35,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46] text-[22px]">fact_check</span>
                <h3 className="text-base font-bold text-[#284230]">Checklist Fisik Sesi Hari Ini</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#2f4d38] font-bold">
                Jumat, 20 Sep
              </span>
            </div>
            <p className="text-xs text-[#6B675F] leading-relaxed">
              Pastikan semua berkas cetak dan kit peraga telah masuk ke dalam tas ransel lapangan sebelum keberangkatan pukul 13.30 WIB.
            </p>

            {/* Student Items Checklist */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between p-3 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#3F5A46] text-[20px] mt-0.5">
                    check_circle
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1c1c18]">Kevin Pratama (SD 4, Pahlawan)</span>
                    <span className="text-[11px] text-[#6B675F]">Lembar LKPD Pecahan Desimal (3 lembar)</span>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#c8ebce] text-[#2f4d38] font-bold shrink-0">
                  Siap
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#3F5A46] text-[20px] mt-0.5">
                    check_circle
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1c1c18]">Rayhan Kusuma (SD 5, Mertoyudan)</span>
                    <span className="text-[11px] text-[#6B675F]">Kit Modul IPAS Rotasi Bumi + Bola Peraga</span>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#c8ebce] text-[#2f4d38] font-bold shrink-0">
                  Siap
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#3F5A46] text-[20px] mt-0.5">
                    check_circle
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1c1c18]">Kayla Pratama (SD 2, Pahlawan)</span>
                    <span className="text-[11px] text-[#6B675F]">Flashcard Fonik Raba Huruf + Pensil Warna</span>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#c8ebce] text-[#2f4d38] font-bold shrink-0">
                  Siap
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)]">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#3F5A46] text-[20px] mt-0.5">
                    check_circle
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1c1c18]">Dimas Pratama (SMP 7, Pecinan)</span>
                    <span className="text-[11px] text-[#6B675F]">Modul Aljabar SMP Bab 3 + Soal Cerita HOTS</span>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#c8ebce] text-[#2f4d38] font-bold shrink-0">
                  Siap
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                showToast('Mencetak ulang 4 lembar checklist hari ini...');
                window.print();
              }}
              className="w-full mt-1 py-2.5 rounded-xl bg-[#FAF7F1] hover:bg-[#ebe8e2] text-[#284230] text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[rgba(42,40,35,0.08)]"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Cetak Ulang Semua Lembar Hari Ini (4 Berkas)</span>
            </button>
          </section>

          {/* Card 2: Panduan Integrasi Alokasi Waktu Sesi Belajar Rumah */}
          <section className="p-6 rounded-2xl bg-white shadow-xs flex flex-col gap-4 border border-[rgba(42,40,35,0.06)]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C1683F] text-[22px]">schedule</span>
              <h3 className="text-base font-bold text-[#284230]">Panduan Integrasi Alokasi Waktu Sesi</h3>
            </div>
            <p className="text-xs text-[#6B675F] leading-relaxed">
              Standar operasional pembelajaran Bright Future di rumah siswa agar waktu optimal dan anak tidak kelelahan.
            </p>

            {/* Timeline Graphic */}
            <div className="flex flex-col gap-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e5e2dc]">
              {/* Step 1 */}
              <div className="flex items-start gap-3 relative pl-1">
                <div className="w-6 h-6 rounded-full bg-[#c8ebce] text-[#2f4d38] flex items-center justify-center shrink-0 text-[11px] font-bold z-10">
                  1
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1c1c18]">10 Menit: Apersepsi &amp; Relaksasi</span>
                    <span className="text-[10px] text-[#6B675F] font-semibold bg-[#FAF7F1] px-1.5 py-0.5 rounded">Awal</span>
                  </div>
                  <p className="text-[12px] text-[#6B675F] leading-relaxed mt-0.5">
                    Tanya kabar hari ini di sekolah, review singkat catatan materi pekan lalu, siapkan meja belajar yang tenang.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 relative pl-1">
                <div className="w-6 h-6 rounded-full bg-[#3F5A46] text-white flex items-center justify-center shrink-0 text-[11px] font-bold z-10">
                  2
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1c1c18]">35 Menit: Konsep &amp; Lembar Modul</span>
                    <span className="text-[10px] text-[#C1683F] font-bold bg-[#EFC9AE]/50 px-1.5 py-0.5 rounded">Inti</span>
                  </div>
                  <p className="text-[12px] text-[#6B675F] leading-relaxed mt-0.5">
                    Penyampaian teori interaktif menggunakan alat peraga / cerita kontekstual sesuai lembar kerja terpilih.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 relative pl-1">
                <div className="w-6 h-6 rounded-full bg-[#EFC9AE] text-[#C1683F] flex items-center justify-center shrink-0 text-[11px] font-bold z-10">
                  3
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1c1c18]">15 Menit: Latihan Terbimbing (LKPD)</span>
                    <span className="text-[10px] text-[#6B675F] font-semibold bg-[#FAF7F1] px-1.5 py-0.5 rounded">Drill</span>
                  </div>
                  <p className="text-[12px] text-[#6B675F] leading-relaxed mt-0.5">
                    Pengerjaan mandiri 3–5 butir soal di LKPD fisik. Tutor mendampingi tanpa mendikte jawaban langsung.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 relative pl-1">
                <div className="w-6 h-6 rounded-full bg-[#e5e2dc] text-[#2A2823] flex items-center justify-center shrink-0 text-[11px] font-bold z-10">
                  4
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1c1c18]">10 Menit: Evaluasi, Afektif &amp; WA Ortu</span>
                    <span className="text-[10px] text-[#3F5A46] font-bold bg-[#c8ebce] px-1.5 py-0.5 rounded">Penutup</span>
                  </div>
                  <p className="text-[12px] text-[#6B675F] leading-relaxed mt-0.5">
                    Pemberian stiker karakter bintang, review bersama, dan penyusunan draf pesan WhatsApp untuk orang tua.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Card 3: Ajukan Kebutuhan Alat Peraga / Modul Khusus */}
          <section className="p-6 rounded-2xl bg-[#F1ECE1]/70 shadow-xs flex flex-col gap-4 border border-[rgba(42,40,35,0.06)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C1683F] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#284230]">Kebutuhan Peraga &amp; Modul Khusus</h3>
                <p className="text-xs text-[#6B675F] mt-1 leading-relaxed">
                  Perlu materi adaptif untuk anak berkebutuhan khusus atau cetak fisik ukuran A3 di Basecamp Magelang?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white flex items-center justify-between border border-[rgba(42,40,35,0.06)]">
              <div className="flex items-center gap-2.5">
                {/* Profile Icon Avatar (No Images) */}
                <div className="w-9 h-9 rounded-full bg-[#3F5A46] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-[#284230]/20">
                  <span>FA</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1c1c18]">Firman Aji, S.Pd.</span>
                  <span className="text-[11px] text-[#6B675F]">Koordinator Kurikulum Lapangan</span>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#6F8F76] animate-pulse" title="Online Fast Response"></span>
            </div>

            <button
              type="button"
              onClick={handleOpenWhatsAppAdmin}
              className="w-full py-2.5 rounded-xl bg-[#284230] text-white hover:bg-[#3F5A46] transition-all shadow-xs text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Hubungi Admin Akademik (WA Fast Response)</span>
            </button>
          </section>
        </div>
      </div>

      {/* Modal: Pratinjau Modul */}
      {previewModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#3F5A46]">description</span>
                <h3 className="text-base font-bold text-[#284230]">Pratinjau Lembar Kerja Siswa</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModule(null)}
                className="text-[#6B675F] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#C1683F] uppercase">{previewModule.level} • {previewModule.curriculum}</span>
              <h4 className="text-base font-bold text-[#1c1c18]">{previewModule.title}</h4>
              <p className="text-xs text-[#6B675F] leading-relaxed bg-[#FAF7F1] p-3 rounded-xl border border-[rgba(42,40,35,0.06)]">
                {previewModule.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)]">
                <span className="text-[10px] text-[#6B675F] uppercase font-bold">Format</span>
                <p className="font-semibold text-[#284230] mt-0.5">{previewModule.formatLabel}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)]">
                <span className="text-[10px] text-[#6B675F] uppercase font-bold">Kelengkapan</span>
                <p className="font-semibold text-[#284230] mt-0.5">{previewModule.completeness}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(42,40,35,0.06)]">
              <button
                type="button"
                onClick={() => setPreviewModule(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewModule(null);
                  showToast(`Mengunduh ${previewModule.title}...`);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3F5A46] text-white hover:bg-[#284230] cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Unduh Berkas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upload Materi / LKPD Baru */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#C1683F]">upload_file</span>
                <h3 className="text-base font-bold text-[#284230]">Unggah Materi atau LKPD Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-[#6B675F] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowUploadModal(false);
                showToast('Modul berhasil diunggah ke arsip tutor!');
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2A2823]">Judul Modul / LKPD</label>
                <input
                  type="text"
                  placeholder="Contoh: LKPD Matematika Pecahan Bab 3..."
                  className="p-2.5 rounded-xl bg-[#FAF7F1] text-xs border border-[rgba(42,40,35,0.1)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#2A2823]">Jenjang</label>
                  <select className="p-2.5 rounded-xl bg-[#FAF7F1] text-xs border border-[rgba(42,40,35,0.1)] focus:outline-none">
                    <option>SD Kelas 1 - 3</option>
                    <option>SD Kelas 4 - 6</option>
                    <option>SMP Kelas 7 - 9</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#2A2823]">Format</label>
                  <select className="p-2.5 rounded-xl bg-[#FAF7F1] text-xs border border-[rgba(42,40,35,0.1)] focus:outline-none">
                    <option>PDF Cetak</option>
                    <option>Interaktif Digital</option>
                    <option>Flashcard</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-2 border-dashed border-[rgba(42,40,35,0.15)] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#FAF7F1]">
                <span className="material-symbols-outlined text-[32px] text-[#3F5A46] mb-1">cloud_upload</span>
                <span className="text-xs font-semibold text-[#1c1c18]">Klik untuk pilih file PDF / Dokumen</span>
                <span className="text-[10px] text-[#6B675F] mt-0.5">Maksimal 10 MB per berkas</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3F5A46] text-white hover:bg-[#284230] cursor-pointer"
                >
                  Unggah Berkas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Unduh Paket Cetak Pekan Ini */}
      {showDownloadPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#3F5A46]">inventory_2</span>
                <h3 className="text-base font-bold text-[#284230]">Paket Cetak Pekan 15–21 Sep</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadPackageModal(false)}
                className="text-[#6B675F] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#6B675F] leading-relaxed">
              Paket ini berisi gabungan 12 lembar LKPD &amp; modul prioritas untuk seluruh jadwal kunjungan rumah di Magelang Kota dan Mertoyudan pekan ini.
            </p>

            <div className="p-3.5 bg-[#FAF7F1] rounded-2xl flex flex-col gap-2 text-xs border border-[rgba(42,40,35,0.06)]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1c1c18]">Ukuran Gabungan:</span>
                <span className="font-semibold text-[#3F5A46]">8.4 MB (PDF A4 Siap Cetak)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1c1c18]">Total Berkas:</span>
                <span className="font-semibold text-[#284230]">12 Lembar Kerja + Rubrik</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDownloadPackageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDownloadPackageModal(false);
                  showToast('Mengunduh paket cetak PDF pekan ini...');
                  window.print();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3F5A46] text-white hover:bg-[#284230] cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak / Unduh Paket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
