import React, { useState, useMemo, useEffect } from 'react';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../../utils/tutorPairingResolver';
import {
  LearningMaterial,
  fetchLearningMaterials,
  subscribeToLearningMaterials,
  saveLearningMaterial,
  resubmitLearningMaterial,
  MaterialType,
} from '../../utils/learningMaterials';

interface TutorWorksheetsModulesProps {
  tutorName?: string;
  assignedStudents: AssignedStudentSummary[];
  visits: FirestoreTutorVisitDoc[];
  onNavigateTab?: (tab: string) => void;
}

export const TutorWorksheetsModules: React.FC<TutorWorksheetsModulesProps> = ({
  tutorName = 'Kak Anindya, S.Pd.',
  assignedStudents,
  visits,
  onNavigateTab,
}) => {
  const [learningMaterials, setLearningMaterials] = useState<LearningMaterial[]>(() =>
    fetchLearningMaterials()
  );
  const [selectedPill, setSelectedPill] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'modul' | 'lembar_kerja'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  // Modals
  const [previewMaterial, setPreviewMaterial] = useState<LearningMaterial | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showDownloadPackageModal, setShowDownloadPackageModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload Form State
  const [uploadType, setUploadType] = useState<MaterialType>('modul');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadLevel, setUploadLevel] = useState<string>('SD Kelas 4 - 6');
  const [uploadFormat, setUploadFormat] = useState<string>('PDF Cetak');
  const [uploadSubject, setUploadSubject] = useState<string>('IPAS');
  const [uploadDesc, setUploadDesc] = useState<string>('');

  // Revision Modal State
  const [revisingItem, setRevisingItem] = useState<LearningMaterial | null>(null);
  const [revisionDesc, setRevisionDesc] = useState<string>('');
  const [revisionFileName, setRevisionFileName] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeToLearningMaterials((data) => {
      setLearningMaterials(data);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const cleanTutorName = (tutorName || '').toLowerCase().trim();

  // Accessible materials: published universal or owned by this tutor
  const accessibleMaterials = useMemo(() => {
    return learningMaterials.filter((m) => {
      const isOwner = (m.uploadedBy || '').toLowerCase().includes(cleanTutorName);
      const isPublished = m.status === 'published';
      return isPublished || isOwner;
    });
  }, [learningMaterials, cleanTutorName]);

  const filteredMaterials = useMemo(() => {
    return accessibleMaterials.filter((m) => {
      // Type filter
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;

      // Pill filter
      if (selectedPill === 'sd' && !m.level.toLowerCase().includes('sd') && !m.category?.includes('sd')) return false;
      if (selectedPill === 'smp' && !m.level.toLowerCase().includes('smp') && !m.category?.includes('smp')) return false;
      if (selectedPill === 'eksperimen' && m.category !== 'eksperimen' && !m.title.toLowerCase().includes('eksperimen')) return false;
      if (selectedPill === 'flashcard' && m.category !== 'flashcard' && !m.title.toLowerCase().includes('flashcard')) return false;

      // Subject filter
      if (subjectFilter !== 'all') {
        const sub = (m.subject || '').toLowerCase();
        if (subjectFilter === 'ipas' && !sub.includes('ipas') && !sub.includes('sains')) return false;
        if (subjectFilter === 'matematika' && !sub.includes('matematika') && !sub.includes('aljabar')) return false;
        if (subjectFilter === 'bahasa' && !sub.includes('bahasa')) return false;
        if (subjectFilter === 'fonik' && !sub.includes('fonik') && !sub.includes('literasi')) return false;
      }

      // Format filter
      if (formatFilter !== 'all') {
        const fmt = (m.fileName || '').toLowerCase();
        if (formatFilter === 'pdf' && !fmt.endsWith('.pdf')) return false;
        if (formatFilter === 'flashcard' && !m.title.toLowerCase().includes('flashcard')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchSubject = (m.subject || '').toLowerCase().includes(q);
        const matchDesc = (m.description || '').toLowerCase().includes(q);
        const matchLevel = (m.level || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchDesc && !matchLevel) return false;
      }

      return true;
    });
  }, [accessibleMaterials, typeFilter, selectedPill, subjectFilter, formatFilter, searchQuery]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert('Silakan isi judul materi.');
      return;
    }

    try {
      await saveLearningMaterial({
        type: uploadType,
        title: uploadTitle.trim(),
        level: uploadLevel,
        subject: uploadSubject,
        description: uploadDesc.trim() || 'Materi tematik kontekstual untuk sesi bimbingan Magelang.',
        uploadedBy: tutorName,
        uploaderRole: 'tutor',
        fileName: `${uploadTitle.replace(/\s+/g, '_')}.pdf`,
        fileSize: '2.4 MB',
      });

      setShowUploadModal(false);
      setUploadTitle('');
      setUploadDesc('');
      showToast(
        `Berkas "${uploadTitle}" berhasil diunggah! Status: Under Review (Menunggu review Admin).`
      );
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Gagal mengunggah materi.');
    }
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingItem) return;

    try {
      await resubmitLearningMaterial(revisingItem.id, {
        description: revisionDesc.trim() || revisingItem.description,
        fileName: revisionFileName.trim() || revisingItem.fileName,
      });

      setRevisingItem(null);
      setRevisionDesc('');
      setRevisionFileName('');
      showToast('Revisi berhasil dikirimkan kembali ke Admin untuk ditinjau ulang!');
    } catch (err) {
      console.error('Revision error:', err);
      showToast('Gagal mengirimkan revisi.');
    }
  };

  const handleOpenWhatsAppAdmin = () => {
    const text = encodeURIComponent(
      `Halo Tim Akademik Bright Future. Saya ${tutorName}, ingin mengajukan kebutuhan alat peraga / modul adaptif lapangan untuk kunjungan Magelang.`
    );
    window.open(`https://api.whatsapp.com/send?phone=6285173230198&text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col w-full relative space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#284230] text-white text-xs font-semibold rounded-xl shadow-lg border border-[#c8ebce]/30 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-[#c8ebce]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Context Header & Actions */}
      <header className="flex flex-col gap-6">
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
              Katalog materi universal dan lembar kerja fisik/digital. Modul ajar yang disetujui Admin berlaku universal bagi seluruh tutor di Magelang.
            </p>
          </div>

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
              onClick={() => {
                setUploadType('modul');
                setShowUploadModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3F5A46] text-white hover:bg-[#284230] transition-all shadow-xs text-xs font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Upload Materi/LKPD Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Bento KPI Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                Total Tersedia
              </span>
              <div className="w-8 h-8 rounded-full bg-[#c8ebce] flex items-center justify-center text-[#3F5A46]">
                <span className="material-symbols-outlined text-[18px]">auto_stories</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-[#284230]">{accessibleMaterials.length} Modul &amp; LKPD</div>
              <p className="text-xs text-[#6B675F] mt-0.5">32 SD Tematik • 16 SMP Sains/Mat</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between">
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

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between">
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

          {/* Card 4 */}
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col justify-between">
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

        {/* Primary Type Split Bar (Modul Ajar vs Lembar Kerja) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl shadow-xs border border-[rgba(42,40,35,0.06)]">
          <div className="flex rounded-xl bg-[#FAF7F1] p-1 border border-[rgba(42,40,35,0.08)]">
            <button
              type="button"
              onClick={() => {
                setTypeFilter('all');
                setSelectedPill('all');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all' && selectedPill === 'all'
                  ? 'bg-[#284230] text-white shadow-xs'
                  : 'text-[#6B675F] hover:text-[#284230]'
              }`}
            >
              Semua Materi ({accessibleMaterials.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('modul');
                setSelectedPill('all');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                typeFilter === 'modul'
                  ? 'bg-[#284230] text-white shadow-xs'
                  : 'text-[#6B675F] hover:text-[#284230]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>Modul Ajar (Universal)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('lembar_kerja');
                setSelectedPill('all');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                typeFilter === 'lembar_kerja'
                  ? 'bg-[#284230] text-white shadow-xs'
                  : 'text-[#6B675F] hover:text-[#284230]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              <span>Lembar Kerja (LKPD)</span>
            </button>
          </div>

          {/* Quick Filter Pills (SD, SMP, Eksperimen, Flashcard) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedPill('sd')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPill === 'sd'
                  ? 'bg-[#3F5A46] text-white shadow-xs font-bold'
                  : 'bg-[#FAF7F1] text-[#1c1c18] hover:bg-[#ebe8e2]'
              }`}
            >
              SD Tematik (32)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPill('smp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPill === 'smp'
                  ? 'bg-[#3F5A46] text-white shadow-xs font-bold'
                  : 'bg-[#FAF7F1] text-[#1c1c18] hover:bg-[#ebe8e2]'
              }`}
            >
              SMP Sains &amp; Mat (16)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPill('eksperimen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPill === 'eksperimen'
                  ? 'bg-[#3F5A46] text-white shadow-xs font-bold'
                  : 'bg-[#FAF7F1] text-[#1c1c18] hover:bg-[#ebe8e2]'
              }`}
            >
              LKPD Eksperimen (14)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPill('flashcard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPill === 'flashcard'
                  ? 'bg-[#3F5A46] text-white shadow-xs font-bold'
                  : 'bg-[#FAF7F1] text-[#1c1c18] hover:bg-[#ebe8e2]'
              }`}
            >
              Flashcard &amp; Games (8)
            </button>
          </div>
        </div>

        {/* Search Bar & Dropdown Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white rounded-2xl shadow-xs border border-[rgba(42,40,35,0.06)]">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B675F] text-[18px]">
              search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul modul, bab, jenjang, atau topik kurikulum..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF7F1] text-xs text-[#1c1c18] placeholder:text-[#6B675F] focus:outline-none focus:ring-2 focus:ring-[#3F5A46] border border-[rgba(42,40,35,0.06)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAF7F1] text-xs text-[#1c1c18] border border-[rgba(42,40,35,0.06)] focus:outline-none"
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
              className="px-3 py-2 rounded-xl bg-[#FAF7F1] text-xs text-[#1c1c18] border border-[rgba(42,40,35,0.06)] focus:outline-none"
            >
              <option value="all">Format: Semua</option>
              <option value="pdf">PDF Cetak</option>
              <option value="flashcard">Flashcard Fisik</option>
            </select>
          </div>
        </div>
      </header>

      {/* 2-Column Balanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Modul & LKPD Catalog (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#C1683F]"></span>
              <h2 className="text-base font-bold text-[#284230]">
                Katalog Materi &amp; Lembar Kerja Siswa
              </h2>
            </div>
            <span className="text-[11px] text-[#6B675F] font-semibold">
              {filteredMaterials.length} Berkas Ditemukan
            </span>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl text-center border border-[rgba(42,40,35,0.08)]">
              <span className="material-symbols-outlined text-[36px] text-[#6B675F]">menu_book</span>
              <p className="text-xs text-[#6B675F] mt-2">Tidak ada materi yang cocok dengan filter pencarian.</p>
            </div>
          ) : (
            filteredMaterials.map((item) => {
              const isUnderReview = item.status === 'under_review';
              const isPublished = item.status === 'published';
              const isRejected = item.status === 'rejected';

              return (
                <article
                  key={item.id}
                  className={`p-6 rounded-2xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col gap-4 border ${
                    isUnderReview
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : isRejected
                      ? 'border-rose-300 ring-2 ring-rose-100'
                      : 'border-[rgba(42,40,35,0.06)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#c8ebce] flex items-center justify-center text-[#3F5A46] shrink-0">
                        <span className="material-symbols-outlined text-[26px]">
                          {item.type === 'modul' ? 'menu_book' : 'description'}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#2f4d38] text-[10px] font-bold">
                            {item.level}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FAF7F1] text-[#284230] text-[10px] font-semibold border border-[rgba(42,40,35,0.06)]">
                            {item.curriculum || 'Kurikulum Merdeka'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.type === 'modul'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.type === 'modul' ? 'Modul Ajar' : 'Lembar Kerja'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#1c1c18]">{item.title}</h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="self-start sm:self-auto shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          isUnderReview
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isPublished
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isUnderReview ? 'hourglass_top' : isPublished ? 'verified' : 'cancel'}
                        </span>
                        <span>
                          {isUnderReview ? 'Under Review' : isPublished ? 'Published' : 'Perlu Revisi'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#6B675F] leading-relaxed">{item.description}</p>

                  {/* Under Review Notice */}
                  {isUnderReview && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">
                        hourglass_top
                      </span>
                      <span>
                        Materi sedang dalam proses review oleh Admin sebelum dapat diakses universal.
                      </span>
                    </div>
                  )}

                  {/* Rejection Reason Notice */}
                  {isRejected && item.rejectionReason && (
                    <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800">
                        <span className="material-symbols-outlined text-[16px]">assignment_late</span>
                        <span>Catatan Penolakan Admin:</span>
                      </div>
                      <p className="italic leading-relaxed">"{item.rejectionReason}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-[#6B675F] pt-2 border-t border-[rgba(42,40,35,0.06)] flex-wrap gap-2">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">person</span>
                      <span>Oleh: {item.uploadedBy}</span>
                    </span>
                    <span>Berkas: {item.fileName || 'dokumen.pdf'}</span>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[rgba(42,40,35,0.06)]">
                    {isRejected ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRevisingItem(item);
                          setRevisionDesc(item.description);
                          setRevisionFileName(item.fileName || '');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#284230] text-white hover:bg-[#3F5A46] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_document</span>
                        <span>Revisi &amp; Unggah Ulang</span>
                      </button>
                    ) : isUnderReview ? (
                      <div className="w-full text-center py-2 text-xs text-amber-800 font-semibold bg-amber-50/70 rounded-xl border border-amber-200/60">
                        Sedang Ditinjau Admin
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewMaterial(item)}
                          className="flex-1 py-2 rounded-xl bg-[#FAF7F1] hover:bg-[#ebe8e2] text-[#284230] text-xs font-semibold border border-[rgba(42,40,35,0.08)] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>Pratinjau</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => showToast(`Mengunduh ${item.fileName || item.title}...`)}
                          className="flex-1 py-2 rounded-xl bg-[#284230] hover:bg-[#3F5A46] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          <span>Unduh</span>
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Checklist Cetak & Academic Support (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Checklist Box */}
          <div className="p-6 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3F5A46] text-[20px]">checklist</span>
              <h3 className="text-sm font-bold text-[#1c1c18]">Checklist Cetak LKPD Kunjungan</h3>
            </div>
            <p className="text-xs text-[#6B675F] leading-relaxed">
              Pastikan seluruh lembar kerja mandiri siswa sudah dicetak dan siap di dalam map bimbingan sebelum berangkat ke rumah siswa.
            </p>
            <div className="space-y-2 text-xs text-[#1c1c18]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_box</span>
                <span>Modul IPAS Rotasi Bumi (Rayhan Kusuma)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_box</span>
                <span>LKPD Matematika Aljabar (Dimas Pratama)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_box</span>
                <span>Flashcard Fonik Dongeng (Alifa &amp; Kayla)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                showToast('Menyiapkan pencetakan berkas bimbingan...');
                window.print();
              }}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#FAF7F1] hover:bg-[#ebe8e2] text-[#284230] text-xs font-bold border border-[rgba(42,40,35,0.1)] cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Cetak Ulang Semua Lembar Hari Ini</span>
            </button>
          </div>

          {/* Academic Coordinator Support Box */}
          <div className="p-6 rounded-2xl bg-white shadow-xs border border-[rgba(42,40,35,0.06)] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C1683F] text-[20px]">support_agent</span>
              <h3 className="text-sm font-bold text-[#1c1c18]">Dukungan Modul Khusus</h3>
            </div>
            <p className="text-xs text-[#6B675F] leading-relaxed">
              Butuh penyesuaian materi remedial atau alat peraga sains khusus untuk siswa berkebutuhan spesifik?
            </p>
            <button
              type="button"
              onClick={handleOpenWhatsAppAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-[#284230] hover:bg-[#3F5A46] text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Hubungi Admin Akademik</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Upload Materi / LKPD Baru */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#3F5A46]">upload_file</span>
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

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3.5 text-xs">
              {/* Type Selection: Modul vs Lembar Kerja */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#2A2823]">
                  Pilih Tipe Dokumen <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2" data-testid="upload-type-selector">
                  <button
                    type="button"
                    onClick={() => setUploadType('modul')}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      uploadType === 'modul'
                        ? 'bg-[#284230] text-white border-[#284230] shadow-xs'
                        : 'bg-[#FAF7F1] text-[#6B675F] border-[rgba(42,40,35,0.1)] hover:bg-[#ebe8e2]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                    <span>Modul Ajar (Universal)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('lembar_kerja')}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      uploadType === 'lembar_kerja'
                        ? 'bg-[#284230] text-white border-[#284230] shadow-xs'
                        : 'bg-[#FAF7F1] text-[#6B675F] border-[rgba(42,40,35,0.1)] hover:bg-[#ebe8e2]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span>Lembar Kerja (LKPD)</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#2A2823]">
                  Judul Modul / LKPD <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: LKPD Matematika Pecahan Bab 3..."
                  className="p-2.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.1)] focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#2A2823]">Jenjang</label>
                  <select
                    value={uploadLevel}
                    onChange={(e) => setUploadLevel(e.target.value)}
                    className="p-2.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.1)] focus:outline-none"
                  >
                    <option>SD Kelas 1 - 3</option>
                    <option>SD Kelas 4 - 6</option>
                    <option>SMP Kelas 7 - 9</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#2A2823]">Format</label>
                  <select
                    value={uploadFormat}
                    onChange={(e) => setUploadFormat(e.target.value)}
                    className="p-2.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.1)] focus:outline-none"
                  >
                    <option>PDF Cetak</option>
                    <option>Interaktif Digital</option>
                    <option>Flashcard</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#2A2823]">Deskripsi &amp; Petunjuk Pembelajaran</label>
                <textarea
                  rows={3}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Deskripsikan tujuan materi dan aktivitas siswa..."
                  className="p-2.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.1)] focus:outline-none focus:ring-2 focus:ring-[#3F5A46] resize-none"
                />
              </div>

              <div className="p-4 border-2 border-dashed border-[rgba(42,40,35,0.15)] rounded-2xl flex flex-col items-center justify-center text-center bg-[#FAF7F1]/60">
                <span className="material-symbols-outlined text-[28px] text-[#3F5A46] mb-1">cloud_upload</span>
                <span className="font-semibold text-[#1c1c18]">Klik untuk pilih file PDF / Dokumen</span>
                <span className="text-[10px] text-[#6B675F] mt-0.5">Maksimal 10 MB per berkas</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(42,40,35,0.06)]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#284230] text-white hover:bg-[#3F5A46] shadow-sm cursor-pointer"
                >
                  Unggah Berkas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revisi & Unggah Ulang */}
      {revisingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#C1683F]">edit_document</span>
                <h3 className="text-base font-bold text-[#284230]">Revisi &amp; Unggah Ulang Materi</h3>
              </div>
              <button
                type="button"
                onClick={() => setRevisingItem(null)}
                className="text-[#6B675F] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRevisionSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
                <div className="flex items-center gap-1 font-bold text-rose-800">
                  <span className="material-symbols-outlined text-[15px]">info</span>
                  <span>Catatan Penolakan Admin:</span>
                </div>
                <p className="italic">"{revisingItem.rejectionReason}"</p>
              </div>

              <div>
                <span className="font-bold text-[#284230] block">{revisingItem.title}</span>
                <span className="text-[11px] text-[#6B675F]">
                  {revisingItem.type === 'modul' ? 'Modul Ajar' : 'Lembar Kerja'} • {revisingItem.level}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#2A2823]">Perbaikan / Catatan Revisi Baru</label>
                <textarea
                  rows={3}
                  required
                  value={revisionDesc}
                  onChange={(e) => setRevisionDesc(e.target.value)}
                  placeholder="Jelaskan bagian yang telah diperbaiki sesuai catatan admin..."
                  className="p-2.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.1)] focus:outline-none focus:ring-2 focus:ring-[#3F5A46] resize-none"
                />
              </div>

              <div className="p-4 border-2 border-dashed border-[#6F8F76]/40 rounded-2xl flex flex-col items-center justify-center text-center bg-[#FAF7F1]/60">
                <span className="material-symbols-outlined text-[28px] text-[#3F5A46] mb-1">cloud_upload</span>
                <span className="font-semibold text-[#1c1c18]">Unggah Berkas Baru yang Telah Direvisi</span>
                <span className="text-[10px] text-[#6B675F] mt-0.5">Format PDF / DOCX</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(42,40,35,0.06)]">
                <button
                  type="button"
                  onClick={() => setRevisingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#284230] text-white hover:bg-[#3F5A46] shadow-sm cursor-pointer"
                >
                  Kirim Ulang Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pratinjau Materi */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46]">description</span>
                <h3 className="text-base font-bold text-[#284230]">Pratinjau Lembar Kerja Siswa</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                className="text-[#6B675F] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-[#1c1c18]">{previewMaterial.title}</h4>
              <p className="text-xs text-[#6B675F] leading-relaxed bg-[#FAF7F1] p-3 rounded-xl border border-[rgba(42,40,35,0.06)]">
                {previewMaterial.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)]">
                <span className="text-[10px] text-[#6B675F] uppercase font-bold">Tipe &amp; Jenjang</span>
                <p className="font-semibold text-[#284230] mt-0.5">
                  {previewMaterial.type === 'modul' ? 'Modul Ajar' : 'LKPD'} • {previewMaterial.level}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.04)]">
                <span className="text-[10px] text-[#6B675F] uppercase font-bold">Pengunggah</span>
                <p className="font-semibold text-[#284230] mt-0.5">{previewMaterial.uploadedBy}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(42,40,35,0.06)]">
              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewMaterial(null);
                  showToast(`Mengunduh ${previewMaterial.title}...`);
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

      {/* Modal: Unduh Paket Cetak Pekan Ini */}
      {showDownloadPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] flex flex-col gap-4">
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
              Paket ini berisi kumpulan berkas modul &amp; LKPD berstatus published yang siap dicetak untuk kunjungan rumah di Magelang Kota dan Mertoyudan.
            </p>

            <div className="p-3.5 bg-[#FAF7F1] rounded-2xl flex flex-col gap-2 text-xs border border-[rgba(42,40,35,0.06)]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1c1c18]">Ukuran Berkas:</span>
                <span className="font-semibold text-[#3F5A46]">8.4 MB (PDF A4 Siap Cetak)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1c1c18]">Status:</span>
                <span className="font-semibold text-[#284230]">Tersinkron Database</span>
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
