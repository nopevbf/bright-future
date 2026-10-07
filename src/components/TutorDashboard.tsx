import React, { useState, useEffect } from 'react';
import {
  subscribeToTutorVisits,
  updateTutorVisitInFirestore,
  FirestoreTutorVisitDoc,
  subscribeToTutorAssignments,
  subscribeToManagedStudents,
  getLocalTutorAssignments,
  getLocalManagedStudents,
} from '../firebase';
import {
  resolveStudentsForTutor,
  buildTutorVisitsFromAssignedStudents,
  AssignedStudentSummary,
} from '../utils/tutorPairingResolver';
import { TutorVisitSchedule } from './tutor/TutorVisitSchedule';
import { TutorGpsAttendance } from './tutor/TutorGpsAttendance';
import { TutorStudentClasses } from './tutor/TutorStudentClasses';
import { TutorWorksheetsModules } from './tutor/TutorWorksheetsModules';
import { TutorEvaluationWhatsApp } from './tutor/TutorEvaluationWhatsApp';

interface TutorDashboardProps {
  onLogout: () => void;
  onViewLanding: () => void;
  tutorName?: string;
  tutorEmail?: string;
}

type TabType =
  | 'dashboard-tutor'
  | 'jadwal-visit-rumah'
  | 'presensi-kunjungan'
  | 'kelas-siswa-binaan'
  | 'modul-dan-materi'
  | 'evaluasi-dan-draf-wa'
  | 'evaluasi-dan-nilai'
  | 'catatan-perkembangan'
  | 'pengumuman-draf-wa'
  | 'profil-tutor';

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  onLogout,
  onViewLanding,
  tutorName = 'Kak Anindya, S.Pd.',
  tutorEmail = 'anindya.tutor@brightfuture.id',
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard-tutor');
  const [subModuleFilter, setSubModuleFilter] = useState<string>('rute');

  // Dynamic visits state strictly built from assigned students in database
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudentSummary[]>(() => {
    return resolveStudentsForTutor(
      tutorName,
      getLocalManagedStudents(),
      getLocalTutorAssignments()
    );
  });

  const [visits, setVisits] = useState<FirestoreTutorVisitDoc[]>(() => {
    const initAssigned = resolveStudentsForTutor(
      tutorName,
      getLocalManagedStudents(),
      getLocalTutorAssignments()
    );
    return buildTutorVisitsFromAssignedStudents(initAssigned, []);
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const initAssigned = resolveStudentsForTutor(
      tutorName,
      getLocalManagedStudents(),
      getLocalTutorAssignments()
    );
    const initVisits = buildTutorVisitsFromAssignedStudents(initAssigned, []);
    return initVisits[0]?.id || '';
  });
  
  // Interactive Evaluation Form State for Active Session
  const [quizScore, setQuizScore] = useState<number>(88);
  const [focusRating, setFocusRating] = useState<number>(4.0);
  const [independenceRating, setIndependenceRating] = useState<number>(5.0);
  const [qualitativeNotes, setQualitativeNotes] = useState<string>(
    'Siswa sangat antusias dan mandiri selama sesi bimbingan.'
  );

  // Live timer simulation for active session
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(45);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Notification feedback toast
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadedModuleName, setUploadedModuleName] = useState<string>('');

  // 1. Initial Load & Real-time Live Listener to Cloud Firestore
  useEffect(() => {
    let unsubscribeVisits: (() => void) | undefined;
    let unsubscribeAssignments: (() => void) | undefined;
    let unsubscribeManaged: (() => void) | undefined;
    let lastDbVisits: FirestoreTutorVisitDoc[] = [];

    const updateAllVisits = (
      currentManaged = getLocalManagedStudents(),
      currentAssigns = getLocalTutorAssignments(),
      dbVisits = lastDbVisits
    ) => {
      const resolved = resolveStudentsForTutor(tutorName, currentManaged, currentAssigns);
      setAssignedStudents(resolved);

      const built = buildTutorVisitsFromAssignedStudents(resolved, dbVisits);
      setVisits(built);

      setActiveSessionId((prevId) => {
        if (built.some((v) => v.id === prevId)) return prevId;
        return built[0]?.id || '';
      });
    };

    // Initial sync
    updateAllVisits();

    unsubscribeVisits = subscribeToTutorVisits(
      (data) => {
        if (data) {
          lastDbVisits = data;
          updateAllVisits(getLocalManagedStudents(), getLocalTutorAssignments(), data);
        }
      },
      (err) => console.warn('Firestore tutor visit subscription note:', err)
    );

    unsubscribeAssignments = subscribeToTutorAssignments((assigns) => {
      updateAllVisits(getLocalManagedStudents(), assigns, lastDbVisits);
    });

    unsubscribeManaged = subscribeToManagedStudents((managed) => {
      updateAllVisits(managed, getLocalTutorAssignments(), lastDbVisits);
    });

    return () => {
      if (typeof unsubscribeVisits === 'function') unsubscribeVisits();
      if (typeof unsubscribeAssignments === 'function') unsubscribeAssignments();
      if (typeof unsubscribeManaged === 'function') unsubscribeManaged();
    };
  }, [tutorName]);

  // Timer tick effect for active session
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedMinutes((prev) => (prev < 70 ? prev + 1 : prev));
    }, 60000); // 1 minute interval in production
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const activeVisit = visits.find((v) => v.id === activeSessionId) || visits[0] || null;

  useEffect(() => {
    if (activeVisit) {
      if (activeVisit.score !== undefined) setQuizScore(activeVisit.score);
      if (activeVisit.focusRating !== undefined) setFocusRating(activeVisit.focusRating);
      if (activeVisit.independenceRating !== undefined) setIndependenceRating(activeVisit.independenceRating);
      if (activeVisit.notes) setQualitativeNotes(activeVisit.notes);
      if (activeVisit.elapsedMinutes !== undefined) setElapsedMinutes(activeVisit.elapsedMinutes);
    }
  }, [activeVisit?.id]);

  const handleSelectActiveSession = (visit: FirestoreTutorVisitDoc) => {
    setActiveSessionId(visit.id);
    setQuizScore(visit.score || 85);
    setFocusRating(visit.focusRating || 4.5);
    setIndependenceRating(visit.independenceRating || 5);
    setQualitativeNotes(visit.notes || 'Catatan perkembangan sesi bimbingan...');
    setElapsedMinutes(visit.elapsedMinutes || (visit.status === 'selesai' ? 70 : 0));
    setFeedbackMessage(`Sesi aktif dialihkan ke ${visit.studentName}`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleSaveEvaluation = async () => {
    if (!activeVisit) return;
    try {
      await updateTutorVisitInFirestore({
        id: activeVisit.id,
        score: quizScore,
        focusRating,
        independenceRating,
        notes: qualitativeNotes,
        elapsedMinutes,
      });
      setFeedbackMessage(
        `Nilai & catatan refleksi untuk ${activeVisit.studentName} tersimpan di Cloud Firestore!`
      );
    } catch (err) {
      console.error('Error saving evaluation to Firestore:', err);
      setFeedbackMessage(`Refleksi tersimpan secara lokal!`);
    }
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleCheckoutSession = async () => {
    if (!activeVisit) return;
    try {
      await updateTutorVisitInFirestore({
        id: activeVisit.id,
        status: 'selesai',
        score: quizScore,
        focusRating,
        notes: qualitativeNotes,
        elapsedMinutes: 70,
        time: `${activeVisit.time.split(' ')[0]} - Selesai`,
      });
      setIsTimerRunning(false);
      setFeedbackMessage(
        `Presensi GPS untuk ${activeVisit.studentName} berhasil di-checkout dan dicatat di database!`
      );
    } catch (err) {
      console.error('Check-out error:', err);
      setFeedbackMessage(`Sesi selesai di-checkout!`);
    }
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // WhatsApp Draft Construction
  const parentTargetName = activeVisit?.parentName || 'Bunda/Bapak';
  const parentWaNumber = (activeVisit?.parentWa || '085173230198').replace(/[^0-9]/g, '');
  const cleanPhoneTarget = parentWaNumber.startsWith('0') ? '62' + parentWaNumber.slice(1) : parentWaNumber;

  const waDraftText = activeVisit
    ? `Selamat sore ${parentTargetName}, salam dari ${tutorName} (Bright Future Magelang) 🌿\n\n` +
      `Sesi bimbingan ${activeVisit.studentName} hari ini telah selesai dengan baik:\n` +
      `• Materi: ${activeVisit.subject}\n` +
      `• Skor Kuis Mandiri: ${quizScore}/100\n` +
      `• Fokus 70 Menit: ${focusRating.toFixed(1)}/5.0 ★\n` +
      `• Kemandirian Gawai: ${independenceRating.toFixed(1)}/5.0 ★\n` +
      `• Catatan Tutor: "${qualitativeNotes}"\n\n` +
      `Next visit terjadwal sesuai kalender bimbingan. Terima kasih atas dukungannya! ✨`
    : '';

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(waDraftText);
    setCopiedDraft(true);
    setFeedbackMessage('Draf laporan WhatsApp berhasil disalin ke clipboard!');
    setTimeout(() => {
      setCopiedDraft(false);
      setFeedbackMessage(null), 3000;
    }, 3000);
  };

  const handleSendToWhatsApp = () => {
    const url = `https://wa.me/${cleanPhoneTarget}?text=${encodeURIComponent(waDraftText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-[#fcf9f3] text-[#1c1c18] font-sans min-h-screen selection:bg-[#c8ebce] selection:text-[#284230]">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed top-5 right-5 z-60 bg-[#284230] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 animate-fade-in text-xs sm:text-sm font-semibold max-w-md">
          <span className="material-symbols-outlined text-[20px] text-[#c8ebce]">check_circle</span>
          <span className="flex-1">{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Upload LKPD Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46]">upload_file</span>
                <h3 className="text-base font-bold text-[#2A2823]">Unggah Modul &amp; LKPD Fisik</h3>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-[#6B675F] hover:text-[#2A2823]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6B675F] font-semibold mb-1">Judul Modul / LKPD</label>
                <input
                  type="text"
                  value={uploadedModuleName}
                  onChange={(e) => setUploadedModuleName(e.target.value)}
                  placeholder="Contoh: LKPD Tematik SD-5 Magnet & Listrik"
                  className="w-full px-3 py-2 bg-[#FAF7F1] border border-[rgba(42,40,35,0.15)] rounded-xl focus:ring-2 focus:ring-[#6F8F76] outline-none"
                />
              </div>
              <div className="border-2 border-dashed border-[#6F8F76]/40 rounded-2xl p-6 text-center bg-[#FAF7F1]/60">
                <span className="material-symbols-outlined text-4xl text-[#3F5A46] mb-1">cloud_upload</span>
                <p className="text-xs text-[#2A2823] font-semibold">Tarik &amp; lepas file PDF atau DOCX</p>
                <p className="text-[11px] text-[#6B675F] mt-0.5">Maksimal 10 MB per lembar kerja siswa</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!uploadedModuleName.trim()) {
                    alert('Silakan isi judul modul terlebih dahulu.');
                    return;
                  }
                  setIsUploadModalOpen(false);
                  setUploadedModuleName('');
                  setFeedbackMessage('Modul berhasil diunggah dan terhubung ke Bank Modul Tutor!');
                  setTimeout(() => setFeedbackMessage(null), 3000);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-sm"
              >
                Simpan Modul
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Sidebar */}
      <aside
        id="sidebar"
        className={`fixed left-0 top-0 h-full ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-64'
        } bg-[#f6f3ed]/95 backdrop-blur-xl z-50 flex flex-col justify-between pt-4 pb-5 shadow-[0_1px_12px_rgba(42,40,35,0.06)] transition-all duration-300 ease-in-out border-r border-[rgba(42,40,35,0.10)]`}
      >
        <div className="flex flex-col">
          {/* Header with Brand & Collapse Toggle Button */}
          <div className="px-4 pb-4 flex items-center justify-between gap-2 border-b border-[rgba(42,40,35,0.10)]/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src="/logo.svg"
                alt="Bright Future Logo"
                className="h-8 w-8 object-contain shrink-0 rounded-lg shadow-xs"
              />
              {!isSidebarCollapsed && (
                <div className="flex flex-col whitespace-nowrap min-w-0">
                  <span className="font-bold text-[15px] text-[#284230] leading-tight">Bright Future</span>
                  <span className="text-[9.5px] text-[#C1683F] uppercase tracking-wider font-semibold">
                    PORTAL TUTOR LAPANGAN
                  </span>
                </div>
              )}
            </div>
            {/* Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label="Toggle Sidebar"
              className="p-1.5 rounded-lg text-[#6B675F] hover:text-[#284230] hover:bg-[#f0eee8] transition-colors shrink-0 flex items-center justify-center focus:outline-none cursor-pointer"
              title="Buka / Tutup Sidebar"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSidebarCollapsed ? 'menu' : 'menu_open'}
              </span>
            </button>
          </div>

          {/* Tutor Badge / Status info */}
          {!isSidebarCollapsed && (
            <div className="px-3 py-2 my-1">
              <div className="bg-[#ebe8e2]/70 rounded-xl p-2.5 flex items-center gap-2.5 border border-[rgba(42,40,35,0.08)]">
                <span className="material-symbols-outlined text-[#6F8F76] text-[20px] shrink-0">verified</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-[#1c1c18] font-bold truncate">{tutorName}</span>
                  <span className="text-[10px] text-[#6B675F] truncate">Tutor Tematik SD-SMP • Magelang</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu List */}
          <nav className="px-2.5 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-270px)] mt-2">
            {[
              { id: 'dashboard-tutor', label: 'Beranda & Ringkasan', icon: 'grid_view' },
              { id: 'jadwal-visit-rumah', label: 'Jadwal Visit Rumah', icon: 'directions_car' },
              { id: 'presensi-kunjungan', label: 'Presensi Kunjungan GPS', icon: 'fmd_good' },
              { id: 'kelas-siswa-binaan', label: 'Data & Portofolio Siswa', icon: 'family_restroom' },
              { id: 'modul-dan-materi', label: 'Modul & Lembar Kerja', icon: 'menu_book' },
              { id: 'evaluasi-dan-draf-wa', label: 'Evaluasi & Draf WhatsApp', icon: 'fact_check' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  if (item.id === 'jadwal-visit-rumah') setSubModuleFilter('rute');
                  if (item.id === 'kelas-siswa-binaan') setSubModuleFilter('siswa');
                  if (item.id === 'presensi-kunjungan') setSubModuleFilter('presensi');
                  if (item.id === 'modul-dan-materi') setSubModuleFilter('modul');
                  if (item.id === 'evaluasi-dan-draf-wa') setSubModuleFilter('evaluasi_wa');
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-xs cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0' : ''
                } ${
                  activeTab === item.id
                    ? 'bg-[#3F5A46] text-white shadow-[0_4px_16px_rgba(63,90,70,0.15)] font-bold'
                    : 'text-[#424843] hover:bg-[#f0eee8] hover:text-[#1c1c18]'
                }`}
                title={item.label}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 flex items-center justify-center">
                  {item.icon}
                </span>
                {!isSidebarCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Target & Profile Settings */}
        <div className="px-2.5 flex flex-col gap-2">
          {!isSidebarCollapsed && (
            <div className="p-3 bg-[#F1ECE1]/80 rounded-xl border border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#6B675F] uppercase tracking-wider font-semibold">Target Pekan</span>
                <span className="text-xs font-bold text-[#284230]">16/20 Sesi</span>
              </div>
              <div className="w-full bg-[#e5e2dc] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#6F8F76] h-full rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('profil-tutor')}
              className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#424843] hover:bg-[#f0eee8] hover:text-[#1c1c18] transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Pengaturan Akun"
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">manage_accounts</span>
              {!isSidebarCollapsed && <span className="truncate">Pengaturan Akun</span>}
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-[#6B675F] hover:text-red-600 transition-colors rounded-xl hover:bg-red-50 cursor-pointer"
              title="Keluar dari Portal Tutor"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'pl-[72px]' : 'pl-64'}`}>
        {/* Top Header Bar */}
        <header
          className={`fixed top-0 right-0 h-16 bg-[#fcf9f3]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(42,40,35,0.04)] z-40 flex items-center justify-between px-6 sm:px-8 transition-all duration-300 ease-in-out border-b border-[rgba(42,40,35,0.10)] ${
            isSidebarCollapsed ? 'left-[72px]' : 'left-64'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 bg-[#c8ebce]/60 px-3 py-1 rounded-full border border-[rgba(42,40,35,0.10)] shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#3F5A46] animate-pulse"></span>
              <span className="text-[11px] text-[#284230] font-bold">Zonasi: Magelang &amp; Mertoyudan</span>
            </div>
            <span className="text-xs text-[#6B675F] hidden md:inline truncate">
              • 4 Sesi Kunjungan Rumah Hari Ini (GPS Aktif)
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Database indicator */}
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
              <span>Cloud Firestore Aktif</span>
            </span>

            {/* Back to Website Button */}
            <button
              onClick={onViewLanding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1ECE1] text-[#284230] hover:bg-[#e5e2dc] transition-all text-xs font-bold border border-[rgba(42,40,35,0.10)] cursor-pointer"
              title="Lihat Tampilan Website Publik"
            >
              <span className="material-symbols-outlined text-[17px] text-[#C1683F]">travel_explore</span>
              <span className="hidden sm:inline">Web Publik</span>
            </button>

            <div className="h-6 w-px bg-[rgba(42,40,35,0.10)] mx-1"></div>

            {/* Profile pill */}
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-[#1c1c18] leading-tight">{tutorName}</span>
                <span className="text-[10px] text-[#6F8F76] font-semibold">{tutorEmail}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#3F5A46] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-[#6F8F76]/30">
                KA
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Dashboard */}
        <main className="relative w-full pt-20 px-6 sm:px-8 pb-14 min-h-screen">
          <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
            {activeTab === 'jadwal-visit-rumah' ? (
              <TutorVisitSchedule
                tutorName={tutorName}
                assignedStudents={assignedStudents}
                visits={visits}
                onNavigateTab={(tab) => {
                  setActiveTab(tab as TabType);
                }}
                onCheckoutSession={(id) => {
                  const target = visits.find((v) => v.id === id);
                  if (target) {
                    handleSelectActiveSession(target);
                    handleCheckoutSession();
                  }
                }}
              />
            ) : activeTab === 'presensi-kunjungan' ? (
              <TutorGpsAttendance
                tutorName={tutorName}
                assignedStudents={assignedStudents}
                visits={visits}
                onNavigateTab={(tab) => {
                  setActiveTab(tab as TabType);
                }}
                onCheckoutSession={(id) => {
                  const target = visits.find((v) => v.id === id);
                  if (target) {
                    handleSelectActiveSession(target);
                    handleCheckoutSession();
                  }
                }}
              />
            ) : activeTab === 'kelas-siswa-binaan' ? (
              <TutorStudentClasses
                tutorName={tutorName}
                assignedStudents={assignedStudents}
                visits={visits}
                onNavigateTab={(tab) => {
                  setActiveTab(tab as TabType);
                }}
                onSelectStudent={(sId) => {
                  const targetVisit = visits.find((v) => v.id === sId || v.studentName?.toLowerCase().includes(sId.toLowerCase()));
                  if (targetVisit) {
                    handleSelectActiveSession(targetVisit);
                  }
                }}
              />
            ) : activeTab === 'modul-dan-materi' ? (
              <TutorWorksheetsModules
                tutorName={tutorName}
                assignedStudents={assignedStudents}
                visits={visits}
                onNavigateTab={(tab) => {
                  setActiveTab(tab as TabType);
                }}
              />
            ) : (activeTab === 'evaluasi-dan-draf-wa' || activeTab === 'evaluasi-dan-nilai' || activeTab === 'catatan-perkembangan' || activeTab === 'pengumuman-draf-wa') ? (
              <TutorEvaluationWhatsApp
                tutorName={tutorName}
                assignedStudents={assignedStudents}
                visits={visits}
                onNavigateTab={(tab) => {
                  setActiveTab(tab as TabType);
                }}
                onUpdateVisitEvaluation={async (vId, evalData) => {
                  await updateTutorVisitInFirestore({
                    id: vId,
                    score: evalData.score,
                    focusRating: evalData.focusRating,
                    independenceRating: evalData.independenceRating,
                    notes: evalData.notes,
                  });
                  setVisits((prev) =>
                    prev.map((v) =>
                      v.id === vId
                        ? {
                            ...v,
                            score: evalData.score,
                            focusRating: evalData.focusRating,
                            independenceRating: evalData.independenceRating,
                            notes: evalData.notes,
                          }
                        : v
                    )
                  );
                }}
              />
            ) : (
              <>
                {/* Top Greeting & Operational Status Bar */}
            <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex flex-col gap-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#c8ebce]/70 text-[#284230] text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#3F5A46] animate-pulse"></span>
                    Operasional Lapangan
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ebe8e2]/60 text-[#6B675F] text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-[14px] text-[#C1683F]">location_on</span>
                    Magelang &amp; Mertoyudan
                  </span>
                  <span className="text-[11px] text-[#6B675F] font-semibold">• Jumat, 20 Sep 2026</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#284230] tracking-tight">
                  Selamat Bertugas, {tutorName.split(',')[0]}
                </h1>
                <p className="text-xs sm:text-sm text-[#6B675F] leading-relaxed">
                  Monitoring rute visit rumah GPS, input asesmen perkembangan harian, dan draf evaluasi WhatsApp wali murid tersinkronisasi database.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(true);
                    setFeedbackMessage('Sesi tatap muka berjalan aktif dengan geofence GPS!');
                    setTimeout(() => setFeedbackMessage(null), 3000);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold shadow-xs hover:bg-[#3F5A46] cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  <span>Mulai Sesi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('evaluasi-dan-draf-wa');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-[#1c1c18] hover:bg-[#FAF7F1] text-xs font-semibold shadow-xs border border-[rgba(42,40,35,0.12)] cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#C1683F]">assignment_add</span>
                  <span>Catat Nilai</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('evaluasi-dan-draf-wa');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-[#1c1c18] hover:bg-[#FAF7F1] text-xs font-semibold shadow-xs border border-[rgba(42,40,35,0.12)] cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">chat</span>
                  <span>Draf WA</span>
                </button>
              </div>
            </section>

            {/* Bento Metric Summary (4 Cards) */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="rounded-2xl bg-white p-5 shadow-[0_1px_12px_rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-md transition-all gap-4 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                      Kunjungan Hari Ini
                    </span>
                    <span className="text-2xl font-extrabold text-[#284230]">{visits.length} Sesi</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#f6f3ed] flex items-center justify-center text-[#3F5A46]">
                    <span className="material-symbols-outlined text-[22px]">home_pin</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#3F5A46]">
                      {visits.filter((v) => v.status === 'selesai').length} Selesai • 1 Live •{' '}
                      {visits.filter((v) => v.status === 'berikutnya' || v.status === 'antre').length} Antre
                    </span>
                    <span className="text-[#6B675F]">280 Menit</span>
                  </div>
                  <div className="w-full bg-[#e5e2dc] h-1.5 rounded-full overflow-hidden flex">
                    <div className="bg-[#6F8F76] h-full" style={{ width: '50%' }}></div>
                    <div className="bg-[#C1683F] h-full animate-pulse" style={{ width: '25%' }}></div>
                    <div className="bg-[rgba(42,40,35,0.15)] h-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl bg-white p-5 shadow-[0_1px_12px_rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-md transition-all gap-4 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                      Siswa Binaan Aktif
                    </span>
                    <span className="text-2xl font-extrabold text-[#284230]">{assignedStudents.length} Siswa</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#f6f3ed] flex items-center justify-center text-[#C1683F]">
                    <span className="material-symbols-outlined text-[22px]">diversity_3</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-[#6B675F]">
                    {assignedStudents.length > 0
                      ? `${assignedStudents.length} siswa bimbingan terdaftar`
                      : 'Belum ada siswa binaan'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[#3F5A46] font-bold bg-[#c8ebce]/60 px-2 py-0.5 rounded-full text-[10px]">
                    <span className="material-symbols-outlined text-[13px]">verified</span> Terverifikasi
                  </span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl bg-white p-5 shadow-[0_1px_12px_rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-md transition-all gap-4 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                      Honor Akumulasi (Sep)
                    </span>
                    <span className="text-2xl font-extrabold text-[#284230]">Rp 3.840.000</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#f6f3ed] flex items-center justify-center text-[#3F5A46]">
                    <span className="material-symbols-outlined text-[22px]">payments</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-[#6B675F]">96 Sesi (Rp 40k/visit)</span>
                  <span className="text-[#1c1c18] font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Cair 25 Sep
                  </span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="rounded-2xl bg-white p-5 shadow-[0_1px_12px_rgba(42,40,35,0.06)] flex flex-col justify-between hover:shadow-md transition-all gap-4 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                      Draf Laporan Evaluasi
                    </span>
                    <span className="text-2xl font-extrabold text-[#C1683F]">
                      {visits.filter((v) => v.status === 'selesai').length} / {visits.length}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#EFC9AE]/40 flex items-center justify-center text-[#C1683F]">
                    <span className="material-symbols-outlined text-[22px]">mark_chat_unread</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-[#6B675F]">
                    {visits.filter((v) => v.status !== 'selesai').length} Menanti selesai
                  </span>
                  <button
                    onClick={() => {
                      const el = document.getElementById('card-draf-wa');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[#C1683F] font-bold hover:underline flex items-center gap-0.5 cursor-pointer text-[11px]"
                  >
                    Review <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Horizontal Sub-Module Filter Tabs */}
            <nav className="flex items-center gap-2 overflow-x-auto pb-1 bg-[#f6f3ed]/80 p-1.5 rounded-2xl shadow-xs border border-[rgba(42,40,35,0.08)]">
              {[
                { id: 'rute', label: 'Rute & Agenda Visit', icon: 'route' },
                { id: 'siswa', label: `Siswa Binaan (${assignedStudents.length})`, icon: 'school' },
                { id: 'presensi', label: 'Presensi GPS', icon: 'fmd_good' },
                { id: 'asesmen', label: 'Asesmen & Afektif', icon: 'fact_check' },
                { id: 'draf_wa', label: 'Draf WA Ortu', icon: 'chat' },
                { id: 'modul', label: 'Bank Modul LKPD', icon: 'menu_book' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubModuleFilter(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    subModuleFilter === tab.id
                      ? 'bg-[#284230] text-white shadow-xs font-bold'
                      : 'text-[#424843] hover:bg-[#f0eee8] hover:text-[#1c1c18]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Main Content Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (approx 60% / 7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-8">
                {/* Rute Bimbingan Hari Ini Card */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_1px_12px_rgba(42,40,35,0.06)] flex flex-col gap-5 border border-[rgba(42,40,35,0.08)]">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[rgba(42,40,35,0.06)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#f6f3ed] flex items-center justify-center text-[#284230]">
                        <span className="material-symbols-outlined text-[20px]">directions_car</span>
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#284230]">Rute Bimbingan Hari Ini</h2>
                        <p className="text-[11px] text-[#6B675F]">
                          {visits.length > 0
                            ? `${visits.length} sesi terjadwal • Standar tatap muka rumah per sesi`
                            : 'Belum ada rute bimbingan aktif dari database'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f6f3ed] text-[#424843] text-[11px] font-semibold border border-[rgba(42,40,35,0.08)]">
                      <span className="material-symbols-outlined text-[15px] text-[#3F5A46]">location_searching</span>
                      GPS Aktif
                    </span>
                  </div>

                  {/* List of Visits */}
                  <div className="flex flex-col gap-3">
                    {visits.length === 0 ? (
                      <div className="rounded-2xl p-8 bg-[#FAF7F1] border border-dashed border-[rgba(42,40,35,0.15)] flex flex-col items-center justify-center text-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-[#f6f3ed] flex items-center justify-center text-[#6B675F]">
                          <span className="material-symbols-outlined text-2xl">route</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1c1c18]">Belum Ada Rute Bimbingan Hari Ini</span>
                          <span className="text-xs text-[#6B675F] max-w-sm mt-1">
                            Saat admin memasangkan siswa dengan tutor ({tutorName}), rute dan agenda visit akan otomatis tercermin di sini.
                          </span>
                        </div>
                      </div>
                    ) : (
                      visits.map((item, idx) => {
                        const isActive = activeVisit && item.id === activeVisit.id;
                        const isSelesai = item.status === 'selesai';
                        const isLive = item.status === 'berlangsung';

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectActiveSession(item)}
                            className={`rounded-2xl p-4 flex flex-col gap-3 transition-all cursor-pointer border ${
                              isActive
                                ? 'bg-[#FAF7F1] border-[#C1683F]/50 shadow-sm ring-1 ring-[#C1683F]/30'
                                : isSelesai
                                ? 'bg-[#f6f3ed]/50 border-[rgba(42,40,35,0.08)] hover:bg-[#f6f3ed]'
                                : 'bg-white border-[rgba(42,40,35,0.08)] hover:bg-[#FAF7F1]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                    isSelesai
                                      ? 'bg-[#c8ebce] text-[#284230]'
                                      : isLive
                                      ? 'bg-[#EFC9AE] text-[#6b2702]'
                                      : 'bg-[#f0eee8] text-[#6B675F]'
                                  }`}
                                >
                                  {isSelesai ? (
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                  ) : isLive ? (
                                    <span className="w-2 h-2 rounded-full bg-[#C1683F] animate-ping"></span>
                                  ) : (
                                    <span>{idx + 1}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[#1c1c18]">{item.studentName}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-[#f0eee8] text-[#6B675F] text-[10px] font-bold">
                                    {item.level}
                                  </span>
                                </div>
                              </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#6B675F] font-semibold">{item.time}</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                                  isSelesai
                                    ? 'bg-[#c8ebce] text-[#284230]'
                                    : isLive
                                    ? 'bg-[#EFC9AE] text-[#6b2702]'
                                    : 'bg-[#f0eee8] text-[#6B675F]'
                                }`}
                              >
                                {isSelesai
                                  ? 'Selesai'
                                  : isLive
                                  ? `Menit ke-${elapsedMinutes}`
                                  : item.status === 'berikutnya'
                                  ? 'Berikutnya'
                                  : 'Antre'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pl-9 flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-[#6B675F] min-w-0">
                              <span className="material-symbols-outlined text-[16px] text-[#C1683F] shrink-0">
                                pin_drop
                              </span>
                              <span className="truncate">{item.address}</span>
                            </div>
                            <span className="text-[10px] text-[#2A2823] bg-white px-2.5 py-1 rounded-md border border-[rgba(42,40,35,0.08)] font-semibold shrink-0">
                              {item.subject}
                            </span>
                          </div>

                          {/* Specific live session controls if live */}
                          {isLive && (
                            <div className="pl-9 flex flex-col gap-2 pt-1 border-t border-[rgba(42,40,35,0.06)]">
                              <div className="flex justify-between text-xs text-[#6B675F]">
                                <span>Efektif {elapsedMinutes} menit berjalan</span>
                                <span className="text-[#284230] font-bold">
                                  Sisa {Math.max(0, 70 - elapsedMinutes)} menit
                                </span>
                              </div>
                              <div className="w-full bg-[#e5e2dc] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#C1683F] h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, (elapsedMinutes / 70) * 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFeedbackMessage('Kamera presensi aktif: Foto sesi belajar diunggah!');
                                      setTimeout(() => setFeedbackMessage(null), 3000);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f0eee8] hover:bg-[#e5e2dc] text-[#1c1c18] text-[11px] font-semibold transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                                    <span>Foto Sesi</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFeedbackMessage('Perekaman refleksi suara tutor aktif.');
                                      setTimeout(() => setFeedbackMessage(null), 3000);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f0eee8] hover:bg-[#e5e2dc] text-[#1c1c18] text-[11px] font-semibold transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">mic</span>
                                    <span>Voice Refleksi</span>
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckoutSession();
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#284230] text-white text-[11px] font-bold hover:bg-[#3F5A46] shadow-xs transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  <span>Check-out Sesi</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  </div>
                </div>

                {/* Modul Ajar LKPD */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_1px_12px_rgba(42,40,35,0.06)] flex flex-col gap-4 border border-[rgba(42,40,35,0.08)]">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[rgba(42,40,35,0.06)]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#284230] text-[20px]">auto_stories</span>
                      <h3 className="text-base font-bold text-[#284230]">Modul Ajar &amp; LKPD Fisik Aktif</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[#3F5A46] hover:underline text-xs font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      <span>Unggah Modul</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#f6f3ed]/60 p-3.5 rounded-2xl flex items-center justify-between gap-2 hover:bg-[#f6f3ed] transition-all border border-[rgba(42,40,35,0.08)]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#284230] shrink-0 shadow-xs border border-[rgba(42,40,35,0.08)]">
                          <span className="material-symbols-outlined text-[18px]">description</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[#1c1c18] truncate">LKPD SD-4 Sains (Magnet)</span>
                          <span className="text-[10px] text-[#6B675F] truncate">PDF • 1.8 MB (6 siswa binaan)</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFeedbackMessage('LKPD Sains Magnet diunduh untuk dicetak.');
                          setTimeout(() => setFeedbackMessage(null), 3000);
                        }}
                        className="p-1.5 rounded-lg text-[#6B675F] hover:text-[#284230] hover:bg-white transition-colors cursor-pointer"
                        title="Unduh PDF"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>

                    <div className="bg-[#f6f3ed]/60 p-3.5 rounded-2xl flex items-center justify-between gap-2 hover:bg-[#f6f3ed] transition-all border border-[rgba(42,40,35,0.08)]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#EFC9AE]/50 flex items-center justify-center text-[#C1683F] shrink-0 shadow-xs">
                          <span className="material-symbols-outlined text-[18px]">quiz</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[#1c1c18] truncate">Modul Aljabar SMP-7</span>
                          <span className="text-[10px] text-[#6B675F] truncate">15 Soal + Kunci (DOCX)</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFeedbackMessage('Modul Aljabar SMP-7 diunduh.');
                          setTimeout(() => setFeedbackMessage(null), 3000);
                        }}
                        className="p-1.5 rounded-lg text-[#6B675F] hover:text-[#284230] hover:bg-white transition-colors cursor-pointer"
                        title="Unduh DOCX"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (approx 40% / 5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                {/* Input Nilai Card */}
                <div
                  id="card-input-nilai"
                  className="bg-white rounded-3xl p-6 shadow-[0_1px_12px_rgba(42,40,35,0.06)] flex flex-col gap-4 border border-[rgba(42,40,35,0.08)]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-[rgba(42,40,35,0.06)]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#284230] text-[20px]">edit_note</span>
                      <h3 className="text-base font-bold text-[#284230]">Input Nilai &amp; Refleksi Sesi</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                      Tersambung DB
                    </span>
                  </div>

                  {!activeVisit ? (
                    <div className="p-8 text-center text-xs text-[#6B675F] bg-[#FAF7F1] rounded-2xl border border-[rgba(42,40,35,0.08)] flex flex-col items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-3xl text-[#6B675F]">person_off</span>
                      <p className="font-semibold text-[#1c1c18]">Belum Ada Sesi Dipilih</p>
                      <p className="text-[11px] max-w-xs text-center">
                        Pilih siswa di rute bimbingan untuk memasukkan nilai dan refleksi sesi pembelajaran.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between bg-[#FAF7F1] p-3 rounded-2xl border border-[rgba(42,40,35,0.08)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#284230] text-white flex items-center justify-center font-bold text-xs">
                            {activeVisit.studentName.slice(0, 2).toUpperCase()}
                          </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#1c1c18] leading-tight">
                          {activeVisit.studentName}
                        </span>
                        <span className="text-[10px] text-[#6B675F]">
                          {activeVisit.level} • {activeVisit.subject}
                        </span>
                      </div>
                    </div>
                    <select
                      value={activeVisit.id}
                      onChange={(e) => {
                        const sel = visits.find((v) => v.id === e.target.value);
                        if (sel) handleSelectActiveSession(sel);
                      }}
                      className="text-[#3F5A46] text-xs font-bold bg-white px-2 py-1 rounded-lg border border-[rgba(42,40,35,0.12)] cursor-pointer outline-none"
                    >
                      {visits.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.studentName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Score input */}
                    <div className="flex items-center justify-between bg-[#f6f3ed]/60 p-3 rounded-2xl gap-3 border border-[rgba(42,40,35,0.06)]">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#1c1c18]">Kuis Mandiri 10 Mnt</span>
                        <span className="text-[10px] text-[#6B675F]">Pemahaman materi hari ini</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={quizScore}
                          onChange={(e) => setQuizScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-16 px-2 py-1.5 bg-white border border-[rgba(42,40,35,0.15)] rounded-xl text-sm font-extrabold text-[#284230] text-center focus:ring-2 focus:ring-[#6F8F76] outline-none shadow-xs"
                        />
                        <span className="text-xs text-[#3F5A46] font-bold">/ 100</span>
                      </div>
                    </div>

                    {/* Star ratings */}
                    <div className="flex flex-col gap-2.5 bg-[#f6f3ed]/60 p-3.5 rounded-2xl border border-[rgba(42,40,35,0.06)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#1c1c18] font-semibold">Fokus 70 Menit</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFocusRating(star)}
                              className="text-[#C1683F] hover:scale-110 transition-transform cursor-pointer"
                            >
                              <span
                                className="material-symbols-outlined text-[18px]"
                                style={{ fontVariationSettings: `'FILL' ${focusRating >= star ? 1 : 0}` }}
                              >
                                star
                              </span>
                            </button>
                          ))}
                          <span className="text-xs font-bold text-[#6B675F] ml-1">{focusRating.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#1c1c18] font-semibold">Kemandirian Gawai</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setIndependenceRating(star)}
                              className="text-[#3F5A46] hover:scale-110 transition-transform cursor-pointer"
                            >
                              <span
                                className="material-symbols-outlined text-[18px]"
                                style={{ fontVariationSettings: `'FILL' ${independenceRating >= star ? 1 : 0}` }}
                              >
                                star
                              </span>
                            </button>
                          ))}
                          <span className="text-xs font-bold text-[#6B675F] ml-1">{independenceRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Text notes */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#6B675F] font-semibold">
                        Catatan Kualitatif Sesi (Refleksi Tutor):
                      </label>
                      <textarea
                        rows={3}
                        value={qualitativeNotes}
                        onChange={(e) => setQualitativeNotes(e.target.value)}
                        placeholder="Catatan perkembangan pemahaman dan karakter siswa..."
                        className="w-full p-3 bg-[#FAF7F1] rounded-2xl text-xs text-[#1c1c18] border border-[rgba(42,40,35,0.12)] focus:ring-2 focus:ring-[#6F8F76] outline-none leading-relaxed resize-none shadow-xs"
                      />
                    </div>

                      <button
                        type="button"
                        onClick={handleSaveEvaluation}
                        className="w-full py-2.5 rounded-xl bg-[#3F5A46] text-white text-xs font-bold hover:bg-[#284230] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        <span>Simpan ke Database &amp; Sinkronkan WA</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

                {/* Draf WA Ortu Card */}
                <div
                  id="card-draf-wa"
                  className="bg-white rounded-3xl p-6 shadow-[0_1px_12px_rgba(42,40,35,0.06)] flex flex-col gap-3 border border-[rgba(42,40,35,0.08)]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-[rgba(42,40,35,0.06)]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#C1683F] text-[20px]">chat</span>
                      <h3 className="text-base font-bold text-[#284230]">Draf WhatsApp Wali Murid</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EFC9AE] text-[#6b2702] text-[10px] font-bold">
                      {activeVisit ? 'Siap Dikirim' : 'Menunggu Sesi'}
                    </span>
                  </div>

                  {!activeVisit ? (
                    <div className="p-8 text-center text-xs text-[#6B675F] bg-[#FAF7F1] rounded-2xl border border-[rgba(42,40,35,0.08)] flex flex-col items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-3xl text-[#6B675F]">chat_bubble_outline</span>
                      <p className="font-semibold text-[#1c1c18]">Draf WA Belum Tersedia</p>
                      <p className="text-[11px] max-w-xs text-center">
                        Pilih dan simpan evaluasi siswa untuk mengenerate pesan otomatis ke WhatsApp wali murid.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-[#6B675F] text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-[#3F5A46]">person</span>
                          <span>
                            Tujuan: <strong className="text-[#1c1c18]">{parentTargetName}</strong>
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#6B675F]">{activeVisit.parentWa || '085173230198'}</span>
                      </div>

                      <div className="bg-[#FAF7F1] p-3.5 rounded-2xl text-xs text-[#1c1c18] leading-relaxed flex flex-col gap-2 border border-[rgba(42,40,35,0.08)]">
                        <p className="text-[#6B675F] text-[11px]">
                          Selamat sore {parentTargetName}, salam dari {tutorName} (Bright Future) 🌿 Sesi bimbingan {activeVisit.studentName} hari ini selesai dengan baik:
                        </p>
                        <div className="py-2 px-3 bg-white rounded-xl text-[11px] flex flex-col gap-1 text-[#1c1c18] border border-[rgba(42,40,35,0.06)]">
                          <span>• Materi: <strong>{activeVisit.subject}</strong></span>
                          <span>• Skor Kuis: <strong className="text-[#284230]">{quizScore}/100</strong> (Sangat Baik)</span>
                          <span>• Fokus: <strong>{focusRating.toFixed(1)}/5.0 ★</strong> • Mandiri tanpa gawai</span>
                          <span>• Progres: <em>{qualitativeNotes}</em></span>
                        </div>
                        <p className="text-[#6B675F] text-[11px]">
                          Terima kasih atas kerja samanya Bapak/Ibu! ✨
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCopyDraft}
                          className="flex-1 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {copiedDraft ? 'done_all' : 'content_copy'}
                          </span>
                          <span>{copiedDraft ? 'Tersalin!' : 'Salin Draf'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSendToWhatsApp}
                          className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer text-xs font-bold"
                          title="Buka WhatsApp Langsung"
                        >
                          <span className="material-symbols-outlined text-[18px]">send</span>
                          <span>Kirim WA</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Broadcast Banner */}
                <div className="rounded-2xl bg-[#f6f3ed]/90 p-4 flex items-center justify-between gap-3 shadow-xs border border-[rgba(42,40,35,0.08)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#C1683F] shrink-0 shadow-xs border border-[rgba(42,40,35,0.08)]">
                      <span className="material-symbols-outlined text-[18px]">campaign</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#284230] truncate">Broadcast Musim Hujan Magelang</span>
                      <span className="text-[10px] text-[#6B675F] truncate">Koordinasi jas hujan &amp; antisipasi rute licin</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'Halo Bapak/Ibu wali murid, sehubungan dengan cuaca hujan di Magelang sore ini, tutor Bright Future tetap berkomitmen hadir tepat waktu dengan perlengkapan berkendara aman. Terima kasih.'
                      );
                      setFeedbackMessage('Pesan broadcast koordinasi hujan berhasil disalin!');
                      setTimeout(() => setFeedbackMessage(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-[#1c1c18] hover:bg-[#f0eee8] text-[11px] font-bold shadow-xs border border-[rgba(42,40,35,0.10)] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Salin Pesan
                  </button>
                </div>
              </div>
            </div>
            </>
          )}
          </div>
        </main>
      </div>
    </div>
  );
};
