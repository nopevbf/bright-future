import React, { useState, useEffect } from 'react';
import {
  db,
  doc,
  getDoc,
  setDoc,
} from '../firebase';

interface StudentDashboardProps {
  onLogout: () => void;
  onViewLanding: () => void;
  studentName?: string;
  studentId?: string;
}

type TabType =
  | 'beranda'
  | 'jadwal-visit'
  | 'kelas-mata-pelajaran'
  | 'materi-lkpd'
  | 'latihan-kuis-tryout'
  | 'nilai-rapor'
  | 'presensi-70-menit'
  | 'prestasi-badge'
  | 'video-pembelajaran'
  | 'profil-siswa'
  | 'pengaturan-akun';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const SAMPLE_QUIZ: QuizQuestion[] = [
  {
    question: 'Berapa lama waktu yang dibutuhkan bumi untuk satu kali rotasi penuh pada porosnya?',
    options: ['12 Jam', '24 Jam (1 Hari)', '30 Hari', '365 Hari (1 Tahun)'],
    correctAnswer: 1,
    explanation: 'Rotasi bumi memerlukan waktu 23 jam 56 menit 4 detik (dibulatkan menjadi 24 jam) yang menyebabkan terjadinya siang dan malam.',
  },
  {
    question: 'Gerakan bumi berputar mengelilingi matahari disebut dengan...',
    options: ['Rotasi Bumi', 'Revolusi Bumi', 'Gerhana Matahari', 'Gravitasi'],
    correctAnswer: 1,
    explanation: 'Revolusi bumi adalah peredaran bumi mengelilingi matahari selama kurang lebih 365,25 hari (1 tahun).',
  },
  {
    question: 'Peristiwa yang terjadi akibat dari rotasi bumi adalah...',
    options: ['Pergantian musim', 'Perbedaan waktu & pergantian siang-malam', 'Tahun kabisat', 'Gerhana bulan total'],
    correctAnswer: 1,
    explanation: 'Rotasi bumi mengakibatkan pergantian siang dan malam serta perbedaan waktu di berbagai belahan bumi.',
  },
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onLogout,
  onViewLanding,
  studentName = 'Rayhan Kusuma',
  studentId = 'BF-2026-09-8812',
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('beranda');
  const [isTableReady, setIsTableReady] = useState<boolean>(false);
  const [xpPoints, setXpPoints] = useState<number>(1420);
  const [streakDays, setStreakDays] = useState<number>(7);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Interactive Quick Quiz Modal State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // LKPD Viewer Modal State
  const [isLkpdModalOpen, setIsLkpdModalOpen] = useState<boolean>(false);

  // Load student progress from Firestore
  useEffect(() => {
    async function loadStudentProgress() {
      try {
        const studentRef = doc(db, 'portal_credentials', 'siswa_rayhan');
        const snap = await getDoc(studentRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.xp) setXpPoints(data.xp);
          if (data.streak) setStreakDays(data.streak);
        }
      } catch (err) {
        console.warn('Could not load student progress from Firestore:', err);
      }
    }
    loadStudentProgress();
  }, []);

  const handleToggleTableReady = () => {
    const nextState = !isTableReady;
    setIsTableReady(nextState);
    if (nextState) {
      setFeedbackToast('Meja belajar siap! Ruangan nyaman dan buku sudah tertata ✨');
    } else {
      setFeedbackToast('Status meja belajar diperbarui.');
    }
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleStartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setQuizFinished(false);
    setIsQuizModalOpen(true);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === SAMPLE_QUIZ[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex + 1 < SAMPLE_QUIZ.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz finished
      setQuizFinished(true);
      const bonusXp = 50;
      const newTotalXp = xpPoints + bonusXp;
      setXpPoints(newTotalXp);

      // Save XP to Firestore
      try {
        await setDoc(
          doc(db, 'portal_credentials', 'siswa_rayhan'),
          {
            xp: newTotalXp,
            lastQuizScore: Math.round(((quizScore + (selectedOption === SAMPLE_QUIZ[currentQuestionIndex].correctAnswer ? 1 : 0)) / SAMPLE_QUIZ.length) * 100),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Error saving quiz XP to Firestore:', err);
      }

      setFeedbackToast(`Keren! Kamu menyelesaikan kuis dan mendapatkan +${bonusXp} XP Prestasi! ⭐`);
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  return (
    <div className="bg-[#fcf9f3] font-sans text-[#1c1c18] antialiased min-h-screen selection:bg-[#c8ebce] selection:text-[#284230]">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-60 bg-[#284230] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 animate-fade-in text-xs sm:text-sm font-semibold max-w-md">
          <span className="material-symbols-outlined text-[20px] text-[#c8ebce]">stars</span>
          <span className="flex-1">{feedbackToast}</span>
          <button onClick={() => setFeedbackToast(null)} className="text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* LKPD Preview Modal */}
      {isLkpdModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-2xl w-full rounded-3xl bg-white p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#3F5A46] text-2xl">menu_book</span>
                <div>
                  <h3 className="text-base font-bold text-[#2A2823]">
                    LKPD Praktikum Miniatur Bumi &amp; Rotasi
                  </h3>
                  <p className="text-xs text-[#6B675F]">IPAS Bab 4 • Eksperimen Globe &amp; Senter Tatap Muka</p>
                </div>
              </div>
              <button onClick={() => setIsLkpdModalOpen(false)} className="text-[#6B675F] hover:text-[#2A2823]">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#2A2823] leading-relaxed">
              <div className="p-4 bg-[#FAF7F1] rounded-2xl border border-[rgba(42,40,35,0.08)] space-y-2">
                <h4 className="font-bold text-sm text-[#3F5A46]">🎯 Tujuan Pembelajaran:</h4>
                <ul className="list-disc list-inside space-y-1 text-[#6B675F]">
                  <li>Membuktikan terjadinya siang dan malam melalui miniatur bola dunia dan sumber cahaya senter.</li>
                  <li>Mengamati arah putaran rotasi bumi dari barat ke timur secara visual.</li>
                  <li>Mencatat hasil observasi zona waktu Indonesia (WIB, WITA, WIT) pada lembar kerja praktikum.</li>
                </ul>
              </div>

              <div className="p-4 bg-[#c8ebce]/30 rounded-2xl border border-[#c8ebce] space-y-2">
                <h4 className="font-bold text-sm text-[#284230]">🔬 Alat &amp; Bahan Eksperimen (Tutor Siapkan):</h4>
                <div className="grid grid-cols-2 gap-2 text-[#284230] font-semibold">
                  <div>• 1 Miniatur Globe (Bola Dunia)</div>
                  <div>• 1 Senter LED Fokus Tajam</div>
                  <div>• Spidol Penghapus &amp; Sticky Note</div>
                  <div>• Lembar Observasi 4 Halaman</div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackToast('File LKPD Praktikum berhasil diunduh dalam format PDF!');
                    setIsLkpdModalOpen(false);
                    setTimeout(() => setFeedbackToast(null), 3000);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#284230] hover:bg-[#3F5A46] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Unduh File Lengkap (PDF 4 Halaman)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Quick Quiz Modal */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C1683F] text-2xl">quiz</span>
                <span className="text-sm font-bold text-[#2A2823]">
                  Kuis Kilat Astronomi ({currentQuestionIndex + 1}/{SAMPLE_QUIZ.length})
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EFC9AE] text-[#6b2702] font-bold text-[11px]">
                +50 XP
              </span>
            </div>

            {!quizFinished ? (
              <div className="space-y-4">
                <p className="text-sm font-bold text-[#2A2823] leading-snug">
                  {SAMPLE_QUIZ[currentQuestionIndex].question}
                </p>

                <div className="space-y-2">
                  {SAMPLE_QUIZ[currentQuestionIndex].options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === SAMPLE_QUIZ[currentQuestionIndex].correctAnswer;

                    let btnClass = 'border-[rgba(42,40,35,0.12)] bg-[#FAF7F1] text-[#2A2823] hover:bg-[#F1ECE1]';
                    if (isSelected && !isAnswerSubmitted) {
                      btnClass = 'border-[#284230] bg-[#c8ebce] text-[#284230] font-bold';
                    } else if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnClass = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                      } else if (isSelected) {
                        btnClass = 'border-red-500 bg-red-100 text-red-900 font-semibold';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerSubmitted}
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {isAnswerSubmitted && isCorrect && (
                          <span className="material-symbols-outlined text-emerald-700 text-[18px]">
                            check_circle
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation feedback */}
                {isAnswerSubmitted && (
                  <div className="p-3 bg-[#FAF7F1] rounded-xl text-xs text-[#2A2823] border border-[rgba(42,40,35,0.08)] leading-relaxed">
                    <p className="font-bold text-[#3F5A46] mb-0.5">Penjelasan Tutor:</p>
                    <p>{SAMPLE_QUIZ[currentQuestionIndex].explanation}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  {!isAnswerSubmitted ? (
                    <button
                      type="button"
                      disabled={selectedOption === null}
                      onClick={handleSubmitAnswer}
                      className="px-5 py-2.5 rounded-xl bg-[#284230] hover:bg-[#3F5A46] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Kirim Jawaban
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <span>
                        {currentQuestionIndex + 1 < SAMPLE_QUIZ.length ? 'Pertanyaan Berikutnya' : 'Selesaikan Kuis'}
                      </span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#c8ebce] text-[#284230] flex items-center justify-center mx-auto text-3xl font-bold shadow-md">
                  🎉
                </div>
                <h4 className="text-base font-bold text-[#284230]">Kuis Astronomi Berhasil Diselesaikan!</h4>
                <p className="text-xs text-[#6B675F] max-w-sm mx-auto">
                  Skor kamu: <strong>{quizScore}/{SAMPLE_QUIZ.length}</strong> pertanyaan benar. Koin XP bertambah sebesar <strong>+50 XP</strong> dan tersinkron ke database!
                </p>
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-sm transition-all cursor-pointer"
                >
                  Tutup &amp; Lihat Ranking
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Sidebar */}
      <aside
        id="sidebar-main"
        className={`fixed left-0 top-0 h-full ${
          isSidebarCollapsed ? 'w-20' : 'w-80'
        } bg-[#f6f3ed]/95 backdrop-blur-xl z-50 flex flex-col shadow-[0_1px_12px_rgba(42,40,35,0.06)] overflow-y-auto transition-all duration-300 border-r border-[rgba(42,40,35,0.10)]`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center gap-3 border-b border-[rgba(42,40,35,0.10)]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              <img
                alt="Bright Future Logo"
                className="h-9 w-9 shrink-0 object-contain rounded-lg"
                src="/logo.svg"
              />
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0 transition-opacity">
                  <span className="text-base text-[#284230] font-bold tracking-tight leading-none truncate">
                    Bright Future
                  </span>
                  <span className="text-[10px] text-[#C1683F] uppercase tracking-wider font-semibold mt-1 truncate">
                    Portal Siswa Magelang
                  </span>
                </div>
              )}
            </div>
            <button
              aria-label="Buka/Tutup Sidebar"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-[#6B675F] hover:text-[#284230] hover:bg-[#f0eee8] transition-all shrink-0 flex items-center justify-center cursor-pointer"
              title="Ciutkan / Buka Sidebar"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSidebarCollapsed ? 'menu' : 'left_panel_close'}
              </span>
            </button>
          </div>
        </div>

        {/* Profile Card */}
        {!isSidebarCollapsed ? (
          <div className="mx-3.5 my-2.5 p-3.5 rounded-2xl bg-[#f0eee8]/80 backdrop-blur-md shadow-xs border border-[rgba(42,40,35,0.08)]">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full bg-[#3F5A46] text-[#b1d0b7] flex items-center justify-center font-bold text-sm shadow-xs shrink-0"
                title={`${studentName} (Penjelajah Sains)`}
              >
                RK
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-[#1c1c18] truncate">{studentName}</h4>
                <p className="text-[11px] text-[#6B675F] truncate">SD Kelas 5 • SD Mertoyudan 1</p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[rgba(42,40,35,0.08)] flex flex-col gap-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[#6B675F]">ID Murid</span>
                <span className="font-mono font-bold text-[#1c1c18]">{studentId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B675F]">Tingkat Belajar</span>
                <span className="text-[#47654f] font-bold">Penjelajah Sains</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B675F]">Akumulasi Bintang</span>
                <span className="text-[#C1683F] font-extrabold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]">stars</span>
                  <span>{xpPoints.toLocaleString('id-ID')} XP</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="my-3 flex justify-center">
            <div
              className="w-10 h-10 rounded-full bg-[#3F5A46] text-[#b1d0b7] flex items-center justify-center font-bold text-xs shadow-xs"
              title={`${studentName} • ${xpPoints} XP`}
            >
              RK
            </div>
          </div>
        )}

        {/* Section Label */}
        {!isSidebarCollapsed && (
          <div className="px-4 py-1">
            <span className="text-[10px] uppercase tracking-wider text-[#6B675F] font-bold">
              Navigasi Belajar
            </span>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-2.5 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-290px)]">
          {[
            { id: 'beranda', label: 'Beranda & Ruang Belajar', icon: 'home' },
            { id: 'jadwal-visit', label: 'Jadwal & Visit Tutor', icon: 'calendar_month' },
            { id: 'kelas-mata-pelajaran', label: 'Kelas & Mata Pelajaran', icon: 'menu_book' },
            { id: 'materi-lkpd', label: 'Materi & LKPD Interaktif', icon: 'assignment' },
            { id: 'latihan-kuis-tryout', label: 'Latihan, Kuis & Try Out', icon: 'quiz' },
            { id: 'nilai-rapor', label: 'Nilai & Rapor Belajar', icon: 'analytics' },
            { id: 'presensi-70-menit', label: 'Presensi Belajar 70 Mnt', icon: 'timer' },
            { id: 'prestasi-badge', label: 'Prestasi & Badge Juara', icon: 'military_tech' },
            { id: 'video-pembelajaran', label: 'Video Pembelajaran', icon: 'play_circle' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`flex items-center px-3 py-2.5 rounded-xl transition-all font-semibold text-xs cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              } ${
                activeTab === item.id
                  ? 'bg-[#3F5A46] text-white shadow-xs font-bold'
                  : 'text-[#424843] hover:bg-[#f0eee8] hover:text-[#1c1c18]'
              }`}
              title={item.label}
            >
              <span className="material-symbols-outlined text-[19px] shrink-0">{item.icon}</span>
              {!isSidebarCollapsed && <span className="ml-3 truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Nav Settings & Logout */}
        <div className="p-2.5 border-t border-[rgba(42,40,35,0.10)] flex flex-col gap-1 bg-[#f0eee8]/40">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('profil-siswa')}
              className={`flex-1 flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18] transition-all cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Profil Siswa"
            >
              <span className="material-symbols-outlined text-[19px] text-[#6B675F] shrink-0">
                account_circle
              </span>
              {!isSidebarCollapsed && <span className="ml-3 truncate">Profil Siswa</span>}
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-[#6B675F] hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              title="Keluar dari Portal Siswa"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Wrapper */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'pl-20' : 'pl-80'
        }`}
      >
        {/* Top Navbar */}
        <header
          className={`fixed top-0 right-0 h-16 bg-[#fcf9f3]/85 backdrop-blur-xl z-40 flex items-center justify-between px-6 sm:px-8 shadow-[0_1px_8px_rgba(42,40,35,0.04)] transition-all duration-300 border-b border-[rgba(42,40,35,0.10)] ${
            isSidebarCollapsed ? 'left-20' : 'left-80'
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-[#6B675F]">
              <span className="hover:text-[#1c1c18] cursor-pointer">Portal Siswa</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-semibold text-[#1c1c18]">Beranda &amp; Ruang Belajar</span>
            </div>
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8ebce]/60 text-[#284230] text-[11px] font-semibold border border-[rgba(42,40,35,0.08)]">
              <span className="w-2 h-2 rounded-full bg-[#3F5A46] animate-pulse"></span>
              <span>Kunjungan Rumah Hari Ini: 13:30 WIB bersama Kak Anindya, S.Pd.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Database sync badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
              <span>Cloud Firestore Aktif</span>
            </span>

            {/* Streak Belajar Pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFC9AE]/50 text-[#C1683F] text-xs font-bold shadow-2xs"
              title="Streak Belajar Aktif"
            >
              <span className="material-symbols-outlined text-[17px]">local_fire_department</span>
              <span>{streakDays} Hari</span>
            </div>

            {/* Koin XP Pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1ECE1] text-[#284230] text-xs font-bold shadow-2xs border border-[rgba(42,40,35,0.08)]"
              title="Koin XP Prestasi"
            >
              <span className="material-symbols-outlined text-[17px] text-[#C1683F]">stars</span>
              <span>{xpPoints.toLocaleString('id-ID')} XP</span>
            </div>

            {/* Back to Website Button */}
            <button
              onClick={onViewLanding}
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-[#284230] hover:bg-[#FAF7F1] text-xs font-bold border border-[rgba(42,40,35,0.12)] transition-all cursor-pointer"
              title="Lihat Tampilan Website Publik"
            >
              <span className="material-symbols-outlined text-[16px] text-[#C1683F]">travel_explore</span>
              <span>Web Publik</span>
            </button>

            {/* Avatar Pill */}
            <div className="w-8 h-8 rounded-full bg-[#284230] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-[#6F8F76]/30">
              RK
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative pt-20 w-full px-6 sm:px-8 py-6 flex-1 max-w-7xl mx-auto space-y-6">
          {/* Hero Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f6f3ed] via-[#f0eee8] to-[#F1ECE1] p-6 sm:p-8 shadow-sm border border-[rgba(42,40,35,0.08)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex flex-col gap-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8ebce]/70 text-[#284230] text-[11px] font-bold w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#3F5A46] animate-pulse"></span>
                  <span>Kunjungan Rumah • Hari Ini 13:30 WIB (70 Menit Tatap Muka)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#284230] tracking-tight mt-1">
                  Semangat Siang, Rayhan! 🚀
                </h1>
                <p className="text-xs sm:text-sm text-[#424843] leading-relaxed">
                  Kak Anindya, S.Pd. segera tiba untuk eksperimen{' '}
                  <span className="font-bold text-[#1c1c18]">IPAS Bab 4: Rotasi &amp; Revolusi Bumi</span>. Meja
                  belajarmu sudah siap?
                </p>
              </div>
              <div className="shrink-0 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleTableReady}
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer border ${
                    isTableReady
                      ? 'bg-[#c8ebce] text-[#284230] border-[#284230]/20'
                      : 'bg-white text-[#1c1c18] border-[rgba(42,40,35,0.12)] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isTableReady ? 'check_circle' : 'table_restaurant'}
                  </span>
                  <span>{isTableReady ? 'Meja Belajar Siap! ✨' : 'Siapkan Meja Belajar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLkpdModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#3F5A46] hover:bg-[#284230] text-white font-bold text-xs shadow-md transition-all transform active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  <span>Buka LKPD Hari Ini</span>
                </button>
              </div>
            </div>
          </section>

          {/* 3 Metric Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Metric 1 */}
            <div className="rounded-3xl p-5 bg-white shadow-xs border border-[rgba(42,40,35,0.08)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#c8ebce]/60 text-[#284230] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">verified_user</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B675F] tracking-wider block">
                  Kehadiran Belajar
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-[#284230]">100%</span>
                  <span className="text-xs text-[#3F5A46] font-bold">16/16 Sesi</span>
                </div>
                <span className="text-[11px] text-[#6B675F] block mt-0.5">Disiplin &amp; Bebas Gawai</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="rounded-3xl p-5 bg-white shadow-xs border border-[rgba(42,40,35,0.08)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EFC9AE]/50 text-[#C1683F] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">trending_up</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B675F] tracking-wider block">
                  Nilai Rata-Rata
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-[#1c1c18]">91.2</span>
                  <span className="text-[10px] text-[#C1683F] font-bold px-1.5 py-0.5 rounded bg-[#EFC9AE]/60">
                    Grade A
                  </span>
                </div>
                <span className="text-[11px] text-[#6B675F] block mt-0.5">8 Kuis &amp; 12 LKPD</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="rounded-3xl p-5 bg-white shadow-xs border border-[rgba(42,40,35,0.08)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F1ECE1] text-[#284230] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">military_tech</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#6B675F] tracking-wider block">
                  Peringkat Belajar
                </span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-2xl font-extrabold text-[#284230]">Level 6</span>
                  <span className="text-xs font-bold text-[#C1683F]">{xpPoints} XP</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#e5e2dc] mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6F8F76] to-[#C1683F]"
                    style={{ width: '78%' }}
                  ></div>
                </div>
              </div>
            </div>
          </section>

          {/* Two-Column Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7 cols): Schedule & Today's LKPD */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Jadwal Kunjungan Pekan Ini */}
              <div className="rounded-3xl bg-white p-6 shadow-xs border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#1c1c18]">Jadwal Kunjungan Pekan Ini</h3>
                    <p className="text-xs text-[#6B675F] mt-0.5">Tatap Muka 70 Menit • Tutor Datang ke Rumah</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#ebe8e2] text-[#424843]">
                    2 Sesi / Pekan
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Active Session: Hari Ini */}
                  <div className="p-4 rounded-2xl bg-[#3F5A46] text-white flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase">Kam</span>
                        <span className="text-base font-bold leading-none">25</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white">IPAS: Rotasi &amp; Revolusi Bumi</h4>
                          <span className="px-2 py-0.5 rounded-full bg-[#C1683F] text-white text-[10px] font-bold">
                            Hari Ini
                          </span>
                        </div>
                        <p className="text-xs text-white/80 mt-0.5">13:30 - 14:40 WIB • Eksperimen Globe &amp; Senter</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[24px] text-[#EFC9AE]">schedule</span>
                  </div>

                  {/* Selesai: Senin Lalu */}
                  <div className="p-4 rounded-2xl bg-[#f6f3ed]/60 hover:bg-[#f6f3ed] transition-all flex items-center justify-between gap-3 border border-[rgba(42,40,35,0.06)]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#ebe8e2] text-[#3F5A46] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase">Sen</span>
                        <span className="text-base font-bold leading-none">22</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#1c1c18]">
                            IPAS: Ekosistem &amp; Rantai Makanan
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                            Selesai
                          </span>
                        </div>
                        <p className="text-xs text-[#6B675F] mt-0.5">Nilai LKPD Praktikum: 88/100 • Fokus 5 Bintang</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#3F5A46] text-[24px]">check_circle</span>
                  </div>

                  {/* Upcoming: Senin Depan */}
                  <div className="p-4 rounded-2xl bg-[#f6f3ed]/60 hover:bg-[#f6f3ed] transition-all flex items-center justify-between gap-3 border border-[rgba(42,40,35,0.06)]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#ebe8e2] text-[#6B675F] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase">Sen</span>
                        <span className="text-base font-bold leading-none">29</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#1c1c18]">
                            Matematika: Operasi Pecahan
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-[#e5e2dc] text-[#6B675F] text-[10px] font-bold">
                            Terjadwal
                          </span>
                        </div>
                        <p className="text-xs text-[#6B675F] mt-0.5">13:30 - 14:40 WIB • Persiapan Kuis Tengah Semester</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#6B675F] text-[22px]">event</span>
                  </div>
                </div>
              </div>

              {/* Kartu Fokus Materi & LKPD Hari Ini */}
              <div className="rounded-3xl bg-white p-6 shadow-xs border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#1c1c18]">Lembar Kerja Peserta Didik (LKPD)</h3>
                    <p className="text-xs text-[#6B675F] mt-0.5">Modul eksperimen praktikum hari ini</p>
                  </div>
                  <button
                    onClick={() => setIsLkpdModalOpen(true)}
                    className="text-xs font-bold text-[#C1683F] hover:underline cursor-pointer"
                  >
                    Modul Lengkap
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#f6f3ed]/80 flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-[rgba(42,40,35,0.06)]">
                  <div className="w-full sm:w-28 h-20 rounded-xl overflow-hidden bg-[#e5e2dc] shrink-0 relative flex items-center justify-center text-[#284230]">
                    <span className="material-symbols-outlined text-4xl">public</span>
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#284230] text-white text-[9px] font-bold">
                      Wajib
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1c1c18] truncate">
                      LKPD Praktikum Miniatur Bumi &amp; Rotasi
                    </h4>
                    <p className="text-xs text-[#6B675F] mt-0.5">
                      4 Halaman PDF • Dilengkapi lembar observasi &amp; kuis refleksi
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => setIsLkpdModalOpen(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-[#3F5A46] hover:bg-[#284230] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">menu_book</span>
                      <span>Buka LKPD</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Quiz, Tutor Note, & Badges */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Kuis Kilat Hari Ini */}
              <div className="rounded-3xl bg-gradient-to-br from-[#EFC9AE]/20 via-white to-[#F1ECE1] p-6 shadow-xs border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C1683F] text-white text-[10px] font-bold">
                    Tantangan Hari Ini
                  </span>
                  <span className="text-xs font-bold text-[#C1683F] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">stars</span>
                    +50 XP
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1c1c18]">Kuis Astronomi: Rotasi Bumi</h3>
                <p className="text-xs text-[#6B675F] mt-1 leading-relaxed">
                  3 pertanyaan pemanasan sebelum tutor tiba untuk menguji pemahaman rotasi bumi.
                </p>
                <div className="flex items-center gap-3 my-3 text-[11px] text-[#6B675F]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#284230]">quiz</span> 3 Soal
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#C1683F]">timer</span> 3 Menit
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#47654f]">bar_chart</span> Sedang
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white text-xs font-bold text-center shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  <span>Mulai Kuis Kilat Sekarang</span>
                </button>
              </div>

              {/* Catatan Tutor Kak Anindya */}
              <div className="rounded-3xl bg-white p-6 shadow-xs flex flex-col gap-3 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3F5A46] text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-[#6F8F76]/30">
                    KA
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1c1c18]">Catatan dari Kak Anindya, S.Pd.</h4>
                    <span className="text-[10px] text-[#3F5A46] font-semibold">Hari ini pukul 11:20 WIB</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F1ECE1]/80 border border-[rgba(42,40,35,0.06)]">
                  <p className="text-xs text-[#2A2823] leading-relaxed italic">
                    “Hebat Rayhan! Catatan rotasi bumi kemarin rapi sekali. Siang ini kita langsung coba simulasi
                    siang-malam dengan mini globe &amp; senter ya! 🌍🔦”
                  </p>
                </div>
              </div>

              {/* Koleksi Lencana */}
              <div className="rounded-3xl bg-white p-6 shadow-xs border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#1c1c18]">Koleksi Lencana</h3>
                  <span className="text-xs font-bold text-[#3F5A46]">Lihat Semua (8)</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-[#c8ebce]/40 flex flex-col items-center text-center gap-1.5 border border-[#c8ebce]/50">
                    <div className="w-9 h-9 rounded-full bg-[#47654f] text-white flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[18px]">timer</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#1c1c18] truncate w-full">Disiplin</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-[#EFC9AE]/40 flex flex-col items-center text-center gap-1.5 border border-[#EFC9AE]/50">
                    <div className="w-9 h-9 rounded-full bg-[#C1683F] text-white flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[18px]">biotech</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#1c1c18] truncate w-full">Detektif Sains</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-[#F1ECE1] flex flex-col items-center text-center gap-1.5 border border-[rgba(42,40,35,0.08)]">
                    <div className="w-9 h-9 rounded-full bg-[#3F5A46] text-white flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[18px]">bolt</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#1c1c18] truncate w-full">Kuis Master</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
