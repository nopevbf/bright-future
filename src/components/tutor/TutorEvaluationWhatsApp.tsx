import React, { useState } from 'react';
import { AssignedStudentSummary } from '../../utils/tutorPairingResolver';
import { FirestoreTutorVisitDoc } from '../../firebase';

interface TutorEvaluationWhatsAppProps {
  tutorName?: string;
  assignedStudents: AssignedStudentSummary[];
  visits: FirestoreTutorVisitDoc[];
  onNavigateTab?: (tab: string) => void;
  onUpdateVisitEvaluation?: (
    visitId: string,
    evaluation: {
      score: number;
      focusRating: number;
      independenceRating: number;
      notes: string;
    }
  ) => Promise<void> | void;
}

export const TutorEvaluationWhatsApp: React.FC<TutorEvaluationWhatsAppProps> = ({
  tutorName = 'Kak Anindya, S.Pd.',
  assignedStudents,
  visits,
  onNavigateTab,
  onUpdateVisitEvaluation,
}) => {
  // Pilih murid pertama sebagai default atau cari yang ada di visits
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (visits.length > 0) return visits[0].studentName;
    if (assignedStudents.length > 0) return assignedStudents[0].studentName;
    return 'Rayhan Kusuma';
  });

  // Cari data visit & student aktif
  const currentVisit = visits.find((v) => v.studentName === selectedStudentId) || visits[0];
  const currentStudent = assignedStudents.find((s) => s.studentName === selectedStudentId) || assignedStudents[0];

  // State penilaian kognitif
  const [lkpdScore, setLkpdScore] = useState<number>(() => currentVisit?.score || 88);
  const [kuisScore, setKuisScore] = useState<number>(90);

  // Quick tagging rubrik
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Paham Konsep Rotasi Bumi',
    'Mampu Jelaskan Terbit Matahari',
    'Kerapian Menulis Catatan',
  ]);

  // State 4 pilar afektif
  const [starRatings, setStarRatings] = useState<{ [key: string]: number }>({
    focus: 5,
    enthusiasm: 5,
    independence: 4,
    manners: 5,
  });

  // Catatan naratif tutor (sinkron live dengan WA)
  const [narrativeNotes, setNarrativeNotes] = useState<string>(
    currentVisit?.notes ||
      'Rayhan sangat antusias saat praktik rotasi bumi memakai senter dan globe mini. Daya fokus terjaga sepanjang sesi tanpa distraksi ponsel. Perlu sedikit penguatan pada konversi perbedaan waktu WIB, WITA, dan WIT.'
  );

  // WhatsApp Hub states
  const [selectedTemplate, setSelectedTemplate] = useState<string>('laporan-sesi');
  const [isSentToParent, setIsSentToParent] = useState<boolean>(false);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper trigger toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper ganti murid
  const handleSelectStudent = (studentName: string) => {
    setSelectedStudentId(studentName);
    const targetVisit = visits.find((v) => v.studentName === studentName);
    if (targetVisit) {
      setLkpdScore(targetVisit.score || 85);
      setKuisScore(targetVisit.score ? Math.min(100, targetVisit.score + 2) : 88);
      setNarrativeNotes(
        targetVisit.notes ||
          `${studentName} mengikuti sesi bimbingan dengan fokus dan menyelesaikan latihan secara bertahap.`
      );
    }
    setIsSentToParent(false);
    showToast(`Beralih ke evaluasi ${studentName}`);
  };

  // Evaluasi label LKPD
  const getLkpdLabel = (score: number) => {
    if (score >= 85) return 'Sangat Baik';
    if (score >= 70) return 'Baik';
    return 'Cukup';
  };

  // Toggle quick tag
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Star rating helper
  const setRating = (pillar: string, value: number) => {
    setStarRatings((prev) => ({ ...prev, [pillar]: value }));
  };

  // Sisipkan variabel ke textarea
  const insertVariable = (variableTag: string) => {
    setNarrativeNotes((prev) => `${prev} ${variableTag}`);
    showToast(`Variabel ${variableTag} disisipkan ke catatan!`);
  };

  // Nama dan nomor wali murid
  const studentNameDisplay = currentStudent?.studentName || currentVisit?.studentName || 'Rayhan Kusuma';
  const parentNameDisplay = currentVisit?.parentName || currentStudent?.parentName || 'Bunda Rayhan (Ibu Rahma)';
  const rawParentPhone = currentVisit?.parentWa || currentStudent?.parentPhone || '081298764321';
  const cleanPhone = rawParentPhone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  // Format teks WhatsApp
  const generateWhatsAppMessage = () => {
    if (selectedTemplate === 'afektif-mingguan') {
      return `Selamat sore, ${parentNameDisplay}. 🌿

Berikut rekap mingguan perkembangan afektif dan kemandirian belajar *${studentNameDisplay}* di Bright Future:

🌟 *Catatan Karakter Lapangan:*
${narrativeNotes}

• Indeks Sikap & Fokus: 4.8 / 5.0 (Sangat Teladan)
• Kedisiplinan: Sesi tatap muka tuntas tanpa distraksi gawai

Terima kasih banyak atas sinergi pendampingan ananda di rumah! ✨

Salam hangat,
*${tutorName}*
Tutor Pendamping Bright Future Magelang`;
    }

    if (selectedTemplate === 'reminder-h1') {
      return `Selamat sore, ${parentNameDisplay}. 🌿

Mengingatkan kembali jadwal visit rumah tatap muka untuk *${studentNameDisplay}* besok sore pukul ${currentStudent?.scheduleDays?.[0] || '14.00 WIB'}.

Mohon berkenan menyiapkan meja belajar yang tenang dan modul lembar kerja ananda. Terima kasih banyak! ✨

Salam hangat,
*${tutorName}*
Bright Future Magelang`;
    }

    if (selectedTemplate === 'hujan') {
      return `Selamat sore, ${parentNameDisplay}. 🌿

Sehubungan cuaca hujan sore ini di Magelang, tutor Bright Future tetap berkomitmen hadir tepat waktu dengan perlengkapan berkendara aman. Terima kasih atas pengertiannya! 🌧️✨

Salam hangat,
*${tutorName}*`;
    }

    // Default: Laporan Sesi Tatap Muka
    return `Selamat sore, ${parentNameDisplay}. 🌿

Alhamdulillah, sesi bimbingan visit rumah bersama *${studentNameDisplay}* hari ini (${currentVisit?.time || '13.30 - 14.40 WIB'}) telah selesai dengan lancar dan antusias.

📌 *Ringkasan Belajar Hari Ini:*
• Materi: ${currentVisit?.subject || currentStudent?.subject || 'IPAS Sains (Gerak Rotasi & Revolusi Bumi)'}
• Nilai LKPD Praktik: ${lkpdScore} / 100 (${getLkpdLabel(lkpdScore)})
• Kuis Kilat (5 Soal): ${kuisScore} / 100 (${(kuisScore / 20).toFixed(1)} / 5 Benar)
• Durasi Efektif: Sesi Tatap Muka Tuntas

🌟 *Observasi Karakter & Afektif:*
${narrativeNotes}

💡 *Rekomendasi di Rumah:*
Bisa diajak mengulang santai catatan materi dan tabel perbedaan waktu di lembar kerja sebelum tidur malam ini.

Terima kasih banyak atas keramahan dan meja belajar yang nyaman di rumah sore ini. Sampai jumpa di sesi berikutnya! 🌸

Salam hangat,
*${tutorName}*
Tutor Pendamping Bright Future Magelang`;
  };

  const fullWaMessage = generateWhatsAppMessage();

  // Handler Salin Draf
  const handleCopyDraft = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullWaMessage).then(() => {
        setCopiedDraft(true);
        showToast('Draf WhatsApp berhasil disalin!');
        setTimeout(() => setCopiedDraft(false), 2500);
      });
    } else {
      showToast('Draf disiapkan.');
    }
  };

  // Handler Kunci & Sinkronkan Nilai
  const handleLockAndSync = async () => {
    if (onUpdateVisitEvaluation && currentVisit) {
      await onUpdateVisitEvaluation(currentVisit.id, {
        score: lkpdScore,
        focusRating: starRatings.focus,
        independenceRating: starRatings.independence,
        notes: narrativeNotes,
      });
    }
    showToast('Nilai kognitif & observasi afektif berhasil disimpan ke database!');
  };

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* Toast Notification element */}
      {toastMessage && (
        <div
          data-testid="toast-container"
          className="fixed bottom-6 right-6 z-50 bg-[#284230] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-opacity duration-300 animate-fade-in"
        >
          <span className="material-symbols-outlined text-[20px] text-[#c8ebce]">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Mode Tag Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#6B675F]">Portal Tutor</span>
          <span className="material-symbols-outlined text-[16px] text-[#6B675F]">chevron_right</span>
          <span className="text-[#6B675F]">Evaluasi Sesi &amp; Draf WhatsApp</span>
          <span className="material-symbols-outlined text-[16px] text-[#6B675F]">chevron_right</span>
          <span className="font-semibold text-[#284230]">Sesi Kunjungan Rumah Magelang</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-[#F1ECE1] text-[#424843] text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-xs">
            Modul D PRD • House-to-House Ops Magelang
          </span>
          <div className="flex items-center gap-1.5 bg-[#EFC9AE]/50 text-[#C1683F] px-3 py-1.5 rounded-full shadow-xs">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span className="text-[11px] font-bold">Mode Cepat Pasca-Sesi (Golden 30 Mnt)</span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c1c18] tracking-tight">
            Evaluasi Sesi &amp; Draf WhatsApp Ortu
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c8ebce] text-[#03210f] text-[11px] font-bold">
            Presensi Selesai
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#6B675F] max-w-4xl leading-relaxed">
          Input skor kognitif sesi tatap muka, nilai LKPD, observasi karakter afektif, serta salin draf
          laporan personal ke WhatsApp wali murid dalam satu alur kerja terpadu.
        </p>
      </div>

      {/* Metrics Bento Strip (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[rgba(42,40,35,0.08)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#6B675F] uppercase tracking-wider font-semibold">
                Sesi Dinilai Hari Ini
              </span>
              <div className="text-2xl font-black text-[#284230] mt-1">
                2 <span className="text-base font-semibold text-[#6B675F]">/ 4 Sesi</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F1ECE1] flex items-center justify-center text-[#284230]">
              <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6F8F76]"></span>
            <span className="text-xs text-[#6B675F]">Kevin &amp; Rayhan siap kirim</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[rgba(42,40,35,0.08)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#6B675F] uppercase tracking-wider font-semibold">
                Rerata Skor Kognitif
              </span>
              <div className="text-2xl font-black text-[#284230] mt-1">
                90.0 <span className="text-base font-semibold text-[#6B675F]">/ 100</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F1ECE1] flex items-center justify-center text-[#47654f]">
              <span className="material-symbols-outlined text-[22px]">trending_up</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-[#47654f] font-semibold">
            <span className="material-symbols-outlined text-[16px]">north_east</span>
            <span>+4.2 poin dari pekan lalu</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[rgba(42,40,35,0.08)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#6B675F] uppercase tracking-wider font-semibold">
                Antrean Draf WA
              </span>
              <div className="text-2xl font-black text-[#C1683F] mt-1">2 Draf</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EFC9AE]/50 flex items-center justify-center text-[#C1683F]">
              <span className="material-symbols-outlined text-[22px]">chat</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C1683F] animate-pulse"></span>
            <span className="text-xs text-[#6B675F]">Rayhan &amp; Kayla (Antrean aktif)</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[rgba(42,40,35,0.08)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#6B675F] uppercase tracking-wider font-semibold">
                Verifikasi Sesi
              </span>
              <div className="text-2xl font-black text-[#3F5A46] mt-1">100%</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#c8ebce] flex items-center justify-center text-[#03210f]">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-[#284230] font-semibold">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            <span>Geofence GPS Magelang Valid</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Input Nilai & Observasi Sesi (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Student Switcher Carousel Tabs */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[rgba(42,40,35,0.08)]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] font-bold text-[#6B675F] uppercase tracking-wider">
                Pilih Sesi Siswa Hari Ini
              </span>
              <span className="text-xs text-[#6B675F]">Rabu, 23 Okt 2026</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: 'Rayhan Kusuma', short: 'Rayhan K.', meta: 'SD 5 • Mertoyudan', status: 'Sedang Dinilai' },
                { name: 'Kevin Pratama', short: 'Kevin P.', meta: 'SD 4 • Magelang', status: 'WA Terkirim' },
                { name: 'Kayla Putri', short: 'Kayla P.', meta: 'SD 2 • Jurangombo', status: '15:30 WIB' },
                { name: 'Dimas Pratama', short: 'Dimas P.', meta: 'SMP 7 • Secang', status: '17:00 WIB' },
              ].map((item) => {
                const isActive = selectedStudentId === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectStudent(item.name)}
                    className={`flex flex-col items-start p-3 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#284230] text-white shadow-md scale-[1.01]'
                        : 'bg-[#f6f3ed] text-[#1c1c18] hover:bg-[#ece8e0]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold truncate">{item.short}</span>
                      {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-[#EFC9AE]"></span>
                      ) : (
                        <span className="material-symbols-outlined text-[14px] text-[#6F8F76]">
                          {item.status === 'WA Terkirim' ? 'check_circle' : 'schedule'}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] truncate ${
                        isActive ? 'text-[#b1d0b7]' : 'text-[#6B675F]'
                      }`}
                    >
                      {item.meta}
                    </span>
                    <span
                      className={`mt-2 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#C1683F] text-white'
                          : item.status === 'WA Terkirim'
                          ? 'text-[#3F5A46] bg-[#c8ebce]/70'
                          : 'text-[#6B675F] bg-[#ebe8e2]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Student Overview Card with Icon Avatar */}
          <div className="bg-white rounded-2xl p-6 shadow-xs flex flex-col gap-4 border border-[rgba(42,40,35,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-4">
                {/* Monogram Inisial Avatar (Zero img dependency) */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c8ebce] to-[#FAF7F1] text-[#284230] font-black text-lg flex items-center justify-center shadow-xs border border-[rgba(42,40,35,0.08)] shrink-0">
                  {studentNameDisplay
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-[#284230]">{studentNameDisplay}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F1ECE1] text-[#424843] text-[10px] font-semibold">
                      {currentStudent?.level || currentVisit?.level || 'SD Kelas 5'} • Mertoyudan
                    </span>
                  </div>
                  <span className="text-xs text-[#6B675F] mt-0.5">
                    Topik:{' '}
                    <span className="font-semibold text-[#1c1c18]">
                      {currentVisit?.subject || currentStudent?.subject || 'IPAS Bab 4 — Gerak Rotasi & Revolusi Bumi'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex sm:flex-col items-end justify-between gap-1 text-right">
                <span className="inline-flex items-center gap-1 text-[#47654f] text-[11px] font-bold bg-[#c8ebce]/50 px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">pin_drop</span> GPS Valid
                </span>
                <span className="text-[11px] text-[#6B675F]">
                  {currentVisit?.time || '13:30 - 14:40 WIB'} • Selesai
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-[#f6f3ed] rounded-xl p-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6F8F76] text-[20px]">verified</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#6B675F] uppercase">Verifikasi Durasi</span>
                  <span className="text-xs font-bold text-[#284230] truncate">Sesi Tatap Muka Tuntas</span>
                </div>
              </div>
              <div className="bg-[#f6f3ed] rounded-xl p-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#C1683F] text-[20px]">home_pin</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#6B675F] uppercase">Lokasi Check-out</span>
                  <span className="text-xs font-bold text-[#1c1c18] truncate">
                    {currentVisit?.address || 'Mertoyudan Indah No. 12'}
                  </span>
                </div>
              </div>
              <div className="bg-[#f6f3ed] rounded-xl p-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#47654f] text-[20px]">co_present</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#6B675F] uppercase">Pendamping Belajar</span>
                  <span className="text-xs font-bold text-[#1c1c18] truncate">{parentNameDisplay}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 1: Penilaian Kognitif (Bobot 60%) */}
          <div className="bg-white rounded-2xl p-6 shadow-xs flex flex-col gap-5 border border-[rgba(42,40,35,0.08)]">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#284230] text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#284230]">
                  Penilaian Kognitif Materi Sesi
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F1ECE1] text-[#6B675F] text-[11px] font-semibold">
                Bobot Kurikulum: 60%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Skor LKPD */}
              <div className="bg-[#f6f3ed]/80 rounded-xl p-4 flex flex-col gap-2 border border-[rgba(42,40,35,0.06)]">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="input-lkpd"
                    className="text-xs font-bold text-[#1c1c18] cursor-pointer"
                  >
                    Nilai LKPD Eksperimen Sains
                  </label>
                  <span className="px-2 py-0.5 rounded-md bg-[#c8ebce] text-[#03210f] text-[10px] font-bold">
                    {getLkpdLabel(lkpdScore)}
                  </span>
                </div>
                <span className="text-[10px] text-[#6B675F]">Modul Percobaan Senter &amp; Globe Mini</span>
                <div className="flex items-center gap-3 mt-1">
                  <div className="relative w-28">
                    <input
                      id="input-lkpd"
                      type="number"
                      min={0}
                      max={100}
                      value={lkpdScore}
                      onChange={(e) => setLkpdScore(parseInt(e.target.value) || 0)}
                      className="w-full bg-white text-[#284230] text-lg font-bold px-3 py-1.5 rounded-xl border border-[rgba(42,40,35,0.12)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76]"
                    />
                    <span className="absolute right-3 top-2 text-xs text-[#6B675F]">/100</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="w-full bg-[#e5e2dc] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#6F8F76] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, lkpdScore))}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-[#6B675F]">Kerapian data &amp; simpulan materi</span>
                  </div>
                </div>
              </div>

              {/* Skor Kuis Kilat */}
              <div className="bg-[#f6f3ed]/80 rounded-xl p-4 flex flex-col gap-2 border border-[rgba(42,40,35,0.06)]">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="input-kuis"
                    className="text-xs font-bold text-[#1c1c18] cursor-pointer"
                  >
                    Kuis Kilat Pemahaman (5 Soal)
                  </label>
                  <span className="px-2 py-0.5 rounded-md bg-[#cbead0] text-[#062010] text-[10px] font-bold">
                    {(kuisScore / 20).toFixed(1)} / 5 Benar
                  </span>
                </div>
                <span className="text-[10px] text-[#6B675F]">5 Pertanyaan lisan konsep inti</span>
                <div className="flex items-center gap-3 mt-1">
                  <div className="relative w-28">
                    <input
                      id="input-kuis"
                      type="number"
                      min={0}
                      max={100}
                      value={kuisScore}
                      onChange={(e) => setKuisScore(parseInt(e.target.value) || 0)}
                      className="w-full bg-white text-[#284230] text-lg font-bold px-3 py-1.5 rounded-xl border border-[rgba(42,40,35,0.12)] focus:outline-none focus:ring-2 focus:ring-[#6F8F76]"
                    />
                    <span className="absolute right-3 top-2 text-xs text-[#6B675F]">/100</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="w-full bg-[#e5e2dc] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#284230] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, kuisScore))}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-[#6B675F]">Kecepatan daya tangkap konsep tinggi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tagging Rubrik Belajar */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#6B675F] uppercase tracking-wider">
                Quick Tagging Capaian Belajar (Sentuh untuk sinkron ke ringkasan)
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Paham Konsep Rotasi Bumi',
                  'Mampu Jelaskan Terbit Matahari',
                  'Perlu Latihan Konversi Waktu',
                  'Kerapian Menulis Catatan',
                ].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#c8ebce] text-[#03210f]'
                          : 'bg-[#f6f3ed] text-[#6B675F] hover:text-[#1c1c18]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isSelected ? 'check' : 'add'}
                      </span>
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bagian 2: Observasi Karakter & Afektif (Bobot 40%) */}
          <div className="bg-white rounded-2xl p-6 shadow-xs flex flex-col gap-5 border border-[rgba(42,40,35,0.08)]">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#C1683F] text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#284230]">
                  Observasi Karakter &amp; Afektif Lapangan
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F1ECE1] text-[#6B675F] text-[11px] font-semibold">
                Bobot Karakter: 40%
              </span>
            </div>

            {/* 4 Interactive Star Rating Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  key: 'focus',
                  title: 'Daya Fokus & Bebas Gawai',
                  desc: 'Fokus penuh sepanjang sesi bimbingan tanpa distraksi gawai atau TV.',
                },
                {
                  key: 'enthusiasm',
                  title: 'Antusiasme & Keaktifan',
                  desc: 'Sangat aktif saat simulasi senter dan bola berputar.',
                },
                {
                  key: 'independence',
                  title: 'Kemandirian Eksekusi LKPD',
                  desc: 'Mandiri mengerjakan sebagian besar butir pertanyaan lembar kerja.',
                },
                {
                  key: 'manners',
                  title: 'Adab & Sopan Santun',
                  desc: 'Menyambut salam di teras rumah dan merapikan meja belajar.',
                },
              ].map((pilar) => {
                const currentRating = starRatings[pilar.key] || 5;
                return (
                  <div
                    key={pilar.key}
                    className="p-3.5 rounded-xl bg-[#f6f3ed]/60 flex flex-col gap-1.5 border border-[rgba(42,40,35,0.06)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1c1c18]">{pilar.title}</span>
                      <div className="flex items-center text-[#C1683F]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            aria-label={`star-${pilar.key}-${star}`}
                            onClick={() => setRating(pilar.key, star)}
                            className="hover:scale-110 transition-transform cursor-pointer"
                          >
                            <span
                              className="material-symbols-outlined text-[18px]"
                              style={{
                                fontVariationSettings: `'FILL' ${currentRating >= star ? 1 : 0}`,
                              }}
                            >
                              star
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#6B675F] leading-relaxed">{pilar.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Catatan Naratif Tutor Lapangan (Tersinkron Otomatis ke Draf WhatsApp) */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="tutor-notes"
                  className="text-xs font-bold text-[#1c1c18] cursor-pointer"
                >
                  Catatan Naratif Tutor Lapangan (Tersinkron Otomatis ke Draf WhatsApp)
                </label>
                <span className="text-[10px] text-[#47654f] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3F5A46] animate-pulse"></span>
                  Tersinkronisasi Realtime
                </span>
              </div>
              <textarea
                id="tutor-notes"
                rows={3}
                value={narrativeNotes}
                onChange={(e) => setNarrativeNotes(e.target.value)}
                className="w-full bg-[#f6f3ed] rounded-xl p-3.5 text-xs text-[#1c1c18] border border-[rgba(42,40,35,0.10)] focus:ring-2 focus:ring-[#6F8F76] outline-none leading-relaxed resize-y shadow-inner"
              />
              <div className="flex items-center justify-between text-[#6B675F] text-[10px]">
                <span>Tip: Gunakan bahasa apresiatif &amp; sertakan rekomendasi konkret di rumah.</span>
                <span>{narrativeNotes.length} karakter</span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-[rgba(42,40,35,0.08)]">
              <button
                type="button"
                onClick={() => showToast('Draf sesi tersimpan secara lokal!')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#1c1c18] bg-[#f0eee8] hover:bg-[#e5e2dc] transition-all cursor-pointer"
              >
                Simpan Draf Sesi
              </button>
              <button
                type="button"
                onClick={handleLockAndSync}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#284230] text-white hover:bg-[#3F5A46] shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                <span>Kunci Nilai &amp; Sinkronkan ke Draf WA</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Integrated WhatsApp Hub & Live Preview (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-5 sticky top-20">
          {/* Template Switcher Pills */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs flex flex-col gap-2 border border-[rgba(42,40,35,0.08)]">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-[#6B675F] uppercase tracking-wider">
                Format Draf Pesan
              </span>
              <span className="text-[10px] text-[#6F8F76] font-bold">Auto-Generated</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'laporan-sesi', label: 'Laporan Sesi Tatap Muka' },
                { id: 'afektif-mingguan', label: 'Afektif Mingguan' },
                { id: 'reminder-h1', label: 'Pengingat Visit H-1' },
                { id: 'hujan', label: 'Hujan Magelang' },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedTemplate === tpl.id
                      ? 'bg-[#284230] text-white shadow-xs'
                      : 'bg-[#f6f3ed] text-[#6B675F] hover:text-[#1c1c18]'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Authentic WhatsApp Bubble Card */}
          <div className="rounded-2xl overflow-hidden shadow-md flex flex-col bg-[#EFEAE2] border border-[rgba(42,40,35,0.10)]">
            {/* WhatsApp Header Bar */}
            <div className="bg-[#284230] px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {/* Monogram Inisial Wali Murid */}
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs text-white">
                  {parentNameDisplay
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate leading-tight">{parentNameDisplay}</span>
                  <span className="text-[10px] text-[#b1d0b7] leading-none opacity-90 truncate">
                    +{formattedPhone} • Mertoyudan Indah
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="material-symbols-outlined text-[18px]">phone</span>
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </div>
            </div>

            {/* Chat Canvas Background with Speech Bubble */}
            <div className="p-4 flex flex-col gap-3 min-h-[360px] max-h-[480px] overflow-y-auto">
              {/* Date Divider Pill */}
              <div className="flex justify-center">
                <span className="bg-white/80 backdrop-blur-xs text-[#6B675F] text-[9.5px] px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider font-semibold">
                  Hari Ini, 14:45 WIB
                </span>
              </div>

              {/* Outgoing Message Bubble (Tutor to Parent) */}
              <div className="self-end max-w-[94%] bg-[#E7F8E8] text-[#1c1c18] rounded-2xl rounded-tr-none p-3.5 shadow-xs text-left flex flex-col gap-2 border border-[rgba(0,0,0,0.04)]">
                <p className="text-xs leading-relaxed">
                  Selamat sore, {parentNameDisplay}. 🌿<br />
                  <br />
                  Alhamdulillah, sesi bimbingan visit rumah bersama{' '}
                  <strong>{studentNameDisplay}</strong> hari ini ({currentVisit?.time || '13.30 - 14.40 WIB'}) telah selesai dengan lancar dan antusias.
                </p>

                <div className="bg-white/70 rounded-xl p-2.5 flex flex-col gap-1 text-[11px] leading-snug border border-[rgba(42,40,35,0.06)]">
                  <span className="font-bold text-[#284230]">📌 Ringkasan Belajar Hari Ini:</span>
                  <span>• Materi: {currentVisit?.subject || 'IPAS Bab 4 — Gerak Rotasi & Revolusi Bumi'}</span>
                  <span>
                    • Nilai LKPD Praktik:{' '}
                    <strong className="text-[#284230]">{lkpdScore}</strong> / 100 ({getLkpdLabel(lkpdScore)})
                  </span>
                  <span>
                    • Kuis Kilat (5 Soal):{' '}
                    <strong className="text-[#284230]">{kuisScore}</strong> / 100 ({(kuisScore / 20).toFixed(1)} / 5 Benar)
                  </span>
                  <span>• Durasi Efektif: Sesi Tatap Muka Tuntas</span>
                </div>

                <div className="flex flex-col gap-1 text-[11px] leading-snug">
                  <span className="font-bold text-[#1c1c18]">🌟 Observasi Karakter &amp; Afektif:</span>
                  <p
                    data-testid="wa-narrative-preview"
                    className="italic text-[#424843] bg-white/50 p-2 rounded-lg"
                  >
                    {narrativeNotes || 'Belum ada catatan observasi karakter untuk sesi ini.'}
                  </p>
                </div>

                <div className="bg-[#FAF7F1]/80 rounded-xl p-2.5 text-[11px] leading-snug flex flex-col gap-1 border border-[rgba(42,40,35,0.06)]">
                  <span className="font-bold text-[#C1683F]">💡 Rekomendasi di Rumah:</span>
                  <span>
                    Bisa diajak mengulang santai catatan materi dan tabel perbedaan waktu di lembar kerja sebelum tidur malam ini.
                  </span>
                </div>

                <p className="text-xs leading-relaxed">
                  Terima kasih banyak atas keramahan dan meja belajar yang nyaman di rumah sore ini. Sampai jumpa di sesi berikutnya! 🌸<br />
                  <br />
                  Salam hangat,<br />
                  <strong className="text-[#284230]">{tutorName}</strong>
                  <br />
                  <span className="text-[10px] text-[#6B675F]">
                    Tutor Pendamping Bright Future Magelang
                  </span>
                </p>

                <div className="flex items-center justify-end gap-1 mt-1 text-[#6B675F] text-[10px]">
                  <span>14:46</span>
                  <span className="material-symbols-outlined text-[14px] text-[#6F8F76]">done_all</span>
                </div>
              </div>
            </div>

            {/* Quick Variables Toolbar */}
            <div className="bg-white px-4 py-2 flex items-center justify-between border-t border-[rgba(42,40,35,0.08)] text-[11px]">
              <span className="text-[#6B675F] font-semibold">Sisipkan Variabel:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => insertVariable(`[${studentNameDisplay}]`)}
                  className="px-2 py-0.5 rounded bg-[#f0eee8] text-[#1c1c18] font-semibold hover:bg-[#e5e2dc] transition-all cursor-pointer"
                >
                  +[Nama]
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable(`[${lkpdScore}/100]`)}
                  className="px-2 py-0.5 rounded bg-[#f0eee8] text-[#1c1c18] font-semibold hover:bg-[#e5e2dc] transition-all cursor-pointer"
                >
                  +[Skor]
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('[IPAS Rotasi Bumi]')}
                  className="px-2 py-0.5 rounded bg-[#f0eee8] text-[#1c1c18] font-semibold hover:bg-[#e5e2dc] transition-all cursor-pointer"
                >
                  +[Topik]
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('[Sesi Tatap Muka]')}
                  className="px-2 py-0.5 rounded bg-[#f0eee8] text-[#1c1c18] font-semibold hover:bg-[#e5e2dc] transition-all cursor-pointer"
                >
                  +[Sesi]
                </button>
              </div>
            </div>

            {/* WhatsApp Action Button Hub */}
            <div className="bg-white p-4 flex flex-col gap-2.5 border-t border-[rgba(42,40,35,0.08)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Primary Action: Copy Draft */}
                <button
                  type="button"
                  onClick={handleCopyDraft}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C1683F] text-white text-xs font-bold shadow-xs hover:bg-[#a8532c] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copiedDraft ? 'done_all' : 'content_copy'}
                  </span>
                  <span>{copiedDraft ? 'Tersalin!' : 'Salin Draf Pesan'}</span>
                </button>

                {/* Secondary Action: Open Web WhatsApp */}
                <a
                  href={`https://wa.me/${formattedPhone}?text=${encodeURIComponent(fullWaMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold shadow-xs hover:bg-[#1ebe5b] transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  <span>Buka WhatsApp Web</span>
                </a>
              </div>

              {/* Mark as Sent Check Action */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f6f3ed] border border-[rgba(42,40,35,0.06)]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSentToParent}
                    onChange={(e) => {
                      setIsSentToParent(e.target.checked);
                      showToast(
                        e.target.checked
                          ? 'Status diperbarui: Laporan telah terkirim!'
                          : 'Status diperbarui: Belum terkirim'
                      );
                    }}
                    className="rounded text-[#3F5A46] focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-[#1c1c18]">
                    Tandai Sudah Dikirim ke Orang Tua
                  </span>
                </label>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isSentToParent
                      ? 'bg-[#c8ebce] text-[#03210f] font-bold'
                      : 'bg-[#F1ECE1] text-[#6B675F]'
                  }`}
                >
                  {isSentToParent ? 'Terkirim ke Ortu' : 'Belum Dikirim'}
                </span>
              </div>
            </div>
          </div>

          {/* 3-Point Field SOP Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col gap-3 border border-[rgba(42,40,35,0.08)]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3F5A46] text-[20px]">policy</span>
              <h4 className="text-xs sm:text-sm font-bold text-[#284230]">
                SOP Komunikasi Lapangan Bright Future
              </h4>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#c8ebce] text-[#03210f] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1c1c18]">Aturan Golden 30 Menit</span>
                  <span className="text-[10px] text-[#6B675F]">
                    Draf wajib dikirimkan maksimal 30 menit pasca-checkout GPS dari rumah murid.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#c8ebce] text-[#03210f] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1c1c18]">Batas Jam Istirahat Ortu (20:00 WIB)</span>
                  <span className="text-[10px] text-[#6B675F]">
                    Hindari mengirimkan laporan setelah pukul 20:00 demi kenyamanan privasi keluarga.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#c8ebce] text-[#03210f] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1c1c18]">Etika Apresiatif &amp; Solutif</span>
                  <span className="text-[10px] text-[#6B675F]">
                    Selalu sebutkan pencapaian baik anak sebelum menyarankan materi penguatan rumah.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
