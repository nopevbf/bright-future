import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeToTutorAssignments,
  subscribeToManagedStudents,
  subscribeToTutorVisits,
  getLocalTutorAssignments,
  getLocalManagedStudents,
  FirestoreTutorVisitDoc,
} from '../firebase';
import { resolveTutorForStudent, AssignedTutorSummary } from '../utils/tutorPairingResolver';
import { ManagedStudent } from './admin/studentData';
import {
  resolveStudentProfile,
  calculateStudentMetrics,
  getStudentQuizPasses,
  recordStudentQuizPass,
  getStudentCustomProfile,
} from '../utils/studentDataResolver';
import {
  LearningMaterial,
  getLocalLearningMaterials,
  subscribeToLearningMaterials,
} from '../utils/learningMaterials';

// Modular Student Tabs
import { StudentHomeTab } from './student/StudentHomeTab';
import { StudentVisitsTab } from './student/StudentVisitsTab';
import { StudentClassesTab } from './student/StudentClassesTab';
import { StudentMaterialsTab } from './student/StudentMaterialsTab';
import { StudentAttendanceTab } from './student/StudentAttendanceTab';
import { StudentReportTab } from './student/StudentReportTab';
import { StudentProfileTab } from './student/StudentProfileTab';

interface StudentDashboardProps {
  onLogout: () => void;
  onViewLanding: () => void;
  studentName?: string;
  studentId?: string;
}

export type StudentTabType =
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
    explanation:
      'Rotasi bumi memerlukan waktu 23 jam 56 menit 4 detik (dibulatkan menjadi 24 jam) yang menyebabkan terjadinya siang dan malam.',
  },
  {
    question: 'Gerakan bumi berputar mengelilingi matahari disebut dengan...',
    options: ['Rotasi Bumi', 'Revolusi Bumi', 'Gerhana Matahari', 'Gravitasi'],
    correctAnswer: 1,
    explanation:
      'Revolusi bumi adalah peredaran bumi mengelilingi matahari selama kurang lebih 365,25 hari (1 tahun).',
  },
  {
    question: 'Peristiwa yang terjadi akibat dari rotasi bumi adalah...',
    options: [
      'Pergantian musim',
      'Perbedaan waktu & pergantian siang-malam',
      'Tahun kabisat',
      'Gerhana bulan total',
    ],
    correctAnswer: 1,
    explanation:
      'Rotasi bumi mengakibatkan pergantian siang dan malam serta perbedaan waktu di berbagai belahan bumi.',
  },
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onLogout,
  onViewLanding,
  studentName = 'Rayhan Kusuma',
  studentId = 'BF-2026-09-8812',
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<StudentTabType>('beranda');
  const [isTableReady, setIsTableReady] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Firestore / Local State Collections
  const [managedStudents, setManagedStudents] = useState<ManagedStudent[]>(() =>
    getLocalManagedStudents()
  );
  const [tutorAssignments, setTutorAssignments] = useState(() => getLocalTutorAssignments());
  const [tutorVisits, setTutorVisits] = useState<FirestoreTutorVisitDoc[]>([]);
  const [learningMaterials, setLearningMaterials] = useState<LearningMaterial[]>(() =>
    getLocalLearningMaterials()
  );

  // Quiz Modal State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [activeQuizTitle, setActiveQuizTitle] = useState<string>('Kuis Bab: Rotasi & Revolusi Bumi');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // LKPD Modal State
  const [isLkpdModalOpen, setIsLkpdModalOpen] = useState<boolean>(false);

  // Real-time Subscriptions
  useEffect(() => {
    const unsubAssignments = subscribeToTutorAssignments((assigns) => {
      setTutorAssignments(assigns);
    });

    const unsubManaged = subscribeToManagedStudents((managed) => {
      setManagedStudents(managed);
    });

    const unsubVisits = subscribeToTutorVisits((visits) => {
      setTutorVisits(visits);
    });

    const unsubMaterials = subscribeToLearningMaterials((mats) => {
      setLearningMaterials(mats);
    });

    return () => {
      if (typeof unsubAssignments === 'function') unsubAssignments();
      if (typeof unsubManaged === 'function') unsubManaged();
      if (typeof unsubVisits === 'function') unsubVisits();
      if (typeof unsubMaterials === 'function') unsubMaterials();
    };
  }, []);

  // Resolve Active Student
  const currentStudent = useMemo(() => {
    return resolveStudentProfile(studentId, studentName, managedStudents);
  }, [studentId, studentName, managedStudents]);

  // Resolve Assigned Tutor
  const assignedTutor: AssignedTutorSummary | null = useMemo(() => {
    return resolveTutorForStudent(
      currentStudent.id || currentStudent.studentName,
      managedStudents,
      tutorAssignments
    );
  }, [currentStudent, managedStudents, tutorAssignments]);

  const displayTutorName = assignedTutor?.tutorName || currentStudent.tutorName || '';

  // Passed Quizzes
  const [passedQuizIds, setPassedQuizIds] = useState<string[]>(() =>
    getStudentQuizPasses(currentStudent.id)
  );

  // Recalculate passed quizzes when student changes
  useEffect(() => {
    setPassedQuizIds(getStudentQuizPasses(currentStudent.id));
  }, [currentStudent.id]);

  // Calculate Metrics deterministically:
  // XP = (completedSessions * 100) + (avgScore * 5) + (passedQuizzesCount * 50)
  const metrics = useMemo(() => {
    return calculateStudentMetrics(currentStudent, tutorVisits, passedQuizIds.length);
  }, [currentStudent, tutorVisits, passedQuizIds.length]);

  // Student Custom Profile (avatar, etc)
  const customProfile = useMemo(() => {
    return getStudentCustomProfile(currentStudent.id);
  }, [currentStudent.id]);

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

  const handleStartQuiz = (quizTitle?: string) => {
    setActiveQuizTitle(quizTitle || 'Kuis Bab: Rotasi & Revolusi Bumi');
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

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < SAMPLE_QUIZ.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz finished
      setQuizFinished(true);
      const finalScoreCount = quizScore + (selectedOption === SAMPLE_QUIZ[currentQuestionIndex].correctAnswer ? 1 : 0);
      const scorePercentage = Math.round((finalScoreCount / SAMPLE_QUIZ.length) * 100);

      const quizKey = `quiz-${(activeQuizTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const isNewPass = recordStudentQuizPass(currentStudent.id, quizKey, scorePercentage);

      if (isNewPass) {
        setPassedQuizIds(getStudentQuizPasses(currentStudent.id));
        setFeedbackToast(
          `Hebat! Nilaimu ${scorePercentage} (Tuntas). Selamat, kamu mendapatkan reward +50 XP Prestasi! ⭐`
        );
      } else if (scorePercentage >= 70) {
        setFeedbackToast(
          `Bagus! Nilaimu ${scorePercentage}. Kuis ini sudah pernah kamu tuntaskan sebelumnya.`
        );
      } else {
        setFeedbackToast(
          `Nilaimu ${scorePercentage}. Pelajari kembali materi modul dan coba lagi untuk meraih nilai tuntas (≥ 70).`
        );
      }
      setTimeout(() => setFeedbackToast(null), 4500);
    }
  };

  const isCurrentQuizPassed = passedQuizIds.includes(
    `quiz-${(activeQuizTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`
  );

  // Student Initials
  const studentInitials = (currentStudent.studentName || 'BF')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

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

      {/* LKPD Modal */}
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
                  <p className="text-xs text-[#6B675F]">{currentStudent.grade} • Tatap Muka 70 Menit</p>
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
                  <li>Membuktikan terjadinya siang dan malam melalui miniatur bola dunia dan senter.</li>
                  <li>Mengamati arah perputaran rotasi bumi dari barat ke timur.</li>
                  <li>Mencatat zona perbedaan waktu (WIB, WITA, WIT) pada lembar observasi.</li>
                </ul>
              </div>

              <div className="p-4 bg-[#c8ebce]/30 rounded-2xl border border-[#c8ebce] space-y-2">
                <h4 className="font-bold text-sm text-[#284230]">🔬 Perlengkapan Praktikum (Disiapkan Kak Tutor):</h4>
                <div className="grid grid-cols-2 gap-2 text-[#284230] font-semibold">
                  <div>• 1 Miniatur Globe (Bola Dunia)</div>
                  <div>• 1 Senter LED Praktikum</div>
                  <div>• Sticky Notes &amp; Spidol Warna</div>
                  <div>• Lembar Observasi Mandiri</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[rgba(42,40,35,0.08)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLkpdModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLkpdModalOpen(false);
                  handleStartQuiz('Kuis Praktikum Miniatur Bumi & Rotasi');
                }}
                className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46]"
              >
                Lanjut Kuis Pemahaman (+50 XP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Quiz Modal */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-xl w-full rounded-3xl bg-white p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#C1683F] text-2xl">quiz</span>
                <div>
                  <h3 className="text-base font-bold text-[#1c1c18]">{activeQuizTitle}</h3>
                  <p className="text-xs text-[#6B675F]">
                    Pertanyaan {currentQuestionIndex + 1} dari {SAMPLE_QUIZ.length}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsQuizModalOpen(false)} className="text-[#6B675F] hover:text-[#1c1c18]">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {!quizFinished ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#1c1c18] leading-relaxed">
                  {SAMPLE_QUIZ[currentQuestionIndex].question}
                </p>

                <div className="space-y-2">
                  {SAMPLE_QUIZ[currentQuestionIndex].options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === SAMPLE_QUIZ[currentQuestionIndex].correctAnswer;

                    let btnStyle = 'bg-[#FAF7F1] border-[rgba(42,40,35,0.12)] text-[#1c1c18] hover:bg-[#f0eee8]';
                    if (isSelected && !isAnswerSubmitted) {
                      btnStyle = 'bg-[#c8ebce]/50 border-[#284230] text-[#284230] font-bold';
                    } else if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-rose-100 border-rose-400 text-rose-900 font-medium';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerSubmitted}
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswerSubmitted && isCorrect && (
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                        )}
                        {isAnswerSubmitted && isSelected && !isCorrect && (
                          <span className="material-symbols-outlined text-rose-600 text-[18px]">cancel</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswerSubmitted && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                    <strong className="block font-bold">💡 Pembahasan:</strong>
                    <p>{SAMPLE_QUIZ[currentQuestionIndex].explanation}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-[rgba(42,40,35,0.08)] flex justify-end gap-2">
                  {!isAnswerSubmitted ? (
                    <button
                      type="button"
                      disabled={selectedOption === null}
                      onClick={handleSubmitAnswer}
                      className="px-5 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] disabled:opacity-50 cursor-pointer"
                    >
                      Kirim Jawaban
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] cursor-pointer"
                    >
                      {currentQuestionIndex + 1 < SAMPLE_QUIZ.length ? 'Pertanyaan Berikutnya' : 'Selesaikan Kuis'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#c8ebce] text-[#284230] mx-auto flex items-center justify-center text-3xl">
                  🎉
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1c1c18]">Kuis Selesai!</h4>
                  <p className="text-xs text-[#6B675F] mt-1">
                    Skor: <strong>{quizScore}</strong> dari {SAMPLE_QUIZ.length} pertanyaan benar (
                    {Math.round((quizScore / SAMPLE_QUIZ.length) * 100)}%).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46]"
                >
                  Kembali ke Portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-[#fcf9f3] border-r border-[rgba(42,40,35,0.10)] z-50 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-80'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[rgba(42,40,35,0.10)] bg-[#f6f3ed]/60">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#284230] text-[#c8ebce] flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
                BF
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm text-[#284230] leading-none truncate">
                  Bright Future
                </span>
                <span className="text-[10px] text-[#6B675F] tracking-wide uppercase font-semibold">
                  Portal Siswa
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-xl text-[#6B675F] hover:bg-[#ebe8e2] transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Buka Sidebar' : 'Ciutkan Sidebar'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isSidebarCollapsed ? 'menu_open' : 'menu'}
            </span>
          </button>
        </div>

        {/* Student Mini Profile Header */}
        {!isSidebarCollapsed && (
          <div className="p-4 mx-3 my-3 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#284230] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {customProfile.avatarUrl ? '🚀' : studentInitials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-bold text-[#1c1c18] truncate leading-tight">
                  {currentStudent.studentName}
                </h2>
                <p className="text-[10px] text-[#6B675F] truncate mt-0.5">
                  {currentStudent.grade} • {currentStudent.schoolOrigin}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-2.5 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-290px)]">
          {[
            { id: 'beranda', label: 'Beranda & Ruang Belajar', icon: 'home' },
            { id: 'jadwal-visit', label: 'Jadwal & Visit Tutor', icon: 'calendar_month' },
            { id: 'kelas-mata-pelajaran', label: 'Kelas & Mata Pelajaran', icon: 'menu_book' },
            { id: 'materi-lkpd', label: 'Materi & LKPD Interaktif', icon: 'assignment' },
            { id: 'presensi-70-menit', label: 'Presensi Belajar 70 Mnt', icon: 'timer' },
            { id: 'nilai-rapor', label: 'Nilai & Rapor Belajar', icon: 'analytics' },
            { id: 'latihan-kuis-tryout', label: 'Latihan & Try Out', icon: 'quiz' },
            { id: 'prestasi-badge', label: 'Prestasi & Badge', icon: 'military_tech' },
            { id: 'video-pembelajaran', label: 'Video Pembelajaran', icon: 'play_circle' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as StudentTabType)}
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
              } ${activeTab === 'profil-siswa' ? 'bg-[#3F5A46] text-white font-bold' : ''}`}
              title="Profil Siswa"
            >
              <span className="material-symbols-outlined text-[19px] shrink-0">
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

      {/* Main Content Layout */}
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
              <span className="hover:text-[#1c1c18] cursor-pointer" onClick={() => setActiveTab('beranda')}>
                Portal Siswa
              </span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-semibold text-[#1c1c18] capitalize">
                {activeTab.replace(/-/g, ' ')}
              </span>
            </div>
            {displayTutorName && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8ebce]/60 text-[#284230] text-[11px] font-semibold border border-[rgba(42,40,35,0.08)]">
                <span className="w-2 h-2 rounded-full bg-[#3F5A46] animate-pulse"></span>
                <span>Tutor Pengampu: {displayTutorName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Realtime database status pill */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
              <span>Data Realtime Aktif</span>
            </span>

            {/* Streak Pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFC9AE]/50 text-[#C1683F] text-xs font-bold shadow-2xs"
              title="Streak Belajar Aktif"
            >
              <span className="material-symbols-outlined text-[17px]">local_fire_department</span>
              <span>{metrics.streakDays} Hari</span>
            </div>

            {/* XP Pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1ECE1] text-[#284230] text-xs font-bold shadow-2xs border border-[rgba(42,40,35,0.08)]"
              title="Koin XP Prestasi"
            >
              <span className="material-symbols-outlined text-[17px] text-[#C1683F]">stars</span>
              <span>{metrics.xpPoints.toLocaleString('id-ID')} XP</span>
            </div>

            {/* Back to Web */}
            <button
              onClick={onViewLanding}
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-[#284230] hover:bg-[#FAF7F1] text-xs font-bold border border-[rgba(42,40,35,0.12)] transition-all cursor-pointer"
              title="Lihat Tampilan Website Publik"
            >
              <span className="material-symbols-outlined text-[16px] text-[#C1683F]">travel_explore</span>
              <span>Web Publik</span>
            </button>

            {/* Avatar Pill */}
            <div
              onClick={() => setActiveTab('profil-siswa')}
              className="w-8 h-8 rounded-full bg-[#284230] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-[#6F8F76]/30 cursor-pointer"
              title="Buka Profil"
            >
              {studentInitials}
            </div>
          </div>
        </header>

        {/* Dynamic Main Body per Active Tab */}
        <main className="relative pt-20 w-full px-6 sm:px-8 py-6 flex-1 max-w-7xl mx-auto">
          {activeTab === 'beranda' && (
            <StudentHomeTab
              student={currentStudent}
              tutorName={displayTutorName}
              visits={tutorVisits}
              metrics={metrics}
              isTableReady={isTableReady}
              onToggleTableReady={handleToggleTableReady}
              onOpenQuiz={() => handleStartQuiz()}
              onOpenLkpd={() => setIsLkpdModalOpen(true)}
              isQuizPassed={isCurrentQuizPassed}
            />
          )}

          {activeTab === 'jadwal-visit' && (
            <StudentVisitsTab
              student={currentStudent}
              tutorName={displayTutorName}
              visits={tutorVisits}
            />
          )}

          {activeTab === 'kelas-mata-pelajaran' && (
            <StudentClassesTab
              student={currentStudent}
              metrics={metrics}
            />
          )}

          {activeTab === 'materi-lkpd' && (
            <StudentMaterialsTab
              student={currentStudent}
              materials={learningMaterials}
              onOpenQuizForMaterial={(matTitle) => handleStartQuiz(`Kuis: ${matTitle}`)}
              passedQuizIds={passedQuizIds}
            />
          )}

          {activeTab === 'presensi-70-menit' && (
            <StudentAttendanceTab
              student={currentStudent}
              visits={tutorVisits}
              metrics={metrics}
            />
          )}

          {activeTab === 'nilai-rapor' && (
            <StudentReportTab
              student={currentStudent}
              visits={tutorVisits}
              metrics={metrics}
            />
          )}

          {activeTab === 'profil-siswa' && (
            <StudentProfileTab
              student={currentStudent}
              tutorName={displayTutorName}
            />
          )}

          {/* Secondary Placeholder Tabs */}
          {(activeTab === 'latihan-kuis-tryout' ||
            activeTab === 'prestasi-badge' ||
            activeTab === 'video-pembelajaran' ||
            activeTab === 'pengaturan-akun') && (
            <div className="p-12 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] text-center shadow-xs max-w-xl mx-auto my-8">
              <div className="w-16 h-16 rounded-3xl bg-[#FAF7F1] text-[#284230] mx-auto flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">
                  {activeTab === 'latihan-kuis-tryout'
                    ? 'quiz'
                    : activeTab === 'prestasi-badge'
                    ? 'military_tech'
                    : activeTab === 'video-pembelajaran'
                    ? 'play_circle'
                    : 'settings'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1c1c18] capitalize">
                Fitur {activeTab.replace(/-/g, ' ')}
              </h3>
              <p className="text-xs text-[#6B675F] max-w-md mx-auto mt-2 leading-relaxed">
                Modul ini sedang disiapkan dan diselaraskan dengan kurikulum semester tatap muka. Kamu tetap dapat mengakses kuis harian dan LKPD di tab materi.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('beranda')}
                  className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46]"
                >
                  Kembali ke Beranda
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('materi-lkpd')}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F1] text-[#284230] text-xs font-bold hover:bg-[#f0eee8] border border-[rgba(42,40,35,0.08)]"
                >
                  Buka Materi &amp; LKPD
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
