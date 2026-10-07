import React, { useState, useEffect } from 'react';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../../utils/tutorPairingResolver';

export interface TutorGpsAttendanceProps {
  tutorName: string;
  assignedStudents: AssignedStudentSummary[];
  visits: FirestoreTutorVisitDoc[];
  onCheckoutSession?: (visitId: string) => void;
  onNavigateTab?: (tabId: string) => void;
}

export const TutorGpsAttendance: React.FC<TutorGpsAttendanceProps> = ({
  tutorName,
  assignedStudents,
  visits,
  onCheckoutSession,
  onNavigateTab,
}) => {
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Active Session Resolution
  const activeVisit =
    visits.find((v) => v.status === 'berlangsung') ||
    visits.find((v) => v.status === 'berikutnya') ||
    visits[0];

  // Live Timer State (Stopwatch starting at 45m 18s or dynamic)
  const [secondsElapsed, setSecondsElapsed] = useState<number>(45 * 60 + 18);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Modals state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState<boolean>(false);
  const [isGpsIssueModalOpen, setIsGpsIssueModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Form states
  const [reflectionText, setReflectionText] = useState<string>(
    'Siswa memahami materi dengan sangat baik dan antusias menyelesaikan soal mandiri.'
  );
  const [gpsIssueReport, setGpsIssueReport] = useState<string>(
    'Titik geofence bergeser 60m karena pohon rimbun di area Mertoyudan.'
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && activeVisit && activeVisit.status === 'berlangsung') {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, activeVisit]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Format Stopwatch Time
  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Metrics
  const totalVisits = visits.length;
  const selesaiCount = visits.filter((v) => v.status === 'selesai').length;
  const targetMenitTotal = Math.max(70, totalVisits * 70);
  const totalMenitBerjalan = selesaiCount * 70 + Math.floor(secondsElapsed / 60);
  const progressPercent = Math.min(100, Math.round((secondsElapsed / (70 * 60)) * 100));

  // Upcoming Visits (excluding current active)
  const upcomingVisits = visits.filter(
    (v) => v.id !== activeVisit?.id && v.status !== 'selesai'
  );

  // Finished Visits
  const finishedVisits = visits.filter((v) => v.status === 'selesai');

  const handleCheckout = () => {
    if (!activeVisit) return;
    setIsTimerRunning(false);
    if (onCheckoutSession) {
      onCheckoutSession(activeVisit.id);
    }
    showToast(`Presensi GPS untuk ${activeVisit.studentName} berhasil di-checkout dan diverifikasi.`);
  };

  return (
    <div className="flex flex-col w-full text-[#1c1c18] font-sans space-y-8">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-60 bg-[#284230] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 animate-fade-in text-xs font-semibold max-w-md">
          <span className="material-symbols-outlined text-[20px] text-[#c8ebce]">check_circle</span>
          <span className="flex-1">{feedbackToast}</span>
          <button onClick={() => setFeedbackToast(null)} className="text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Modal: Unggah Foto Sesi */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46]">add_a_photo</span>
                <h3 className="text-base font-bold text-[#2A2823]">Unggah Bukti Foto Sesi Belajar</h3>
              </div>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-[#6B675F] hover:text-[#2A2823]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-[#6B675F]">
                Ambil foto kegiatan belajar siswa di lokasi tatap muka rumah bersama modul atau LKPD.
              </p>
              <div className="border-2 border-dashed border-[#6F8F76]/40 rounded-2xl p-6 text-center bg-[#FAF7F1]/60">
                <span className="material-symbols-outlined text-4xl text-[#3F5A46] mb-1">photo_camera</span>
                <p className="text-xs text-[#2A2823] font-semibold">Kamera Aktif / Pilih File Foto</p>
                <p className="text-[11px] text-[#6B675F] mt-0.5">Format JPG / PNG maksimal 5 MB</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPhotoModalOpen(false);
                  showToast('Foto dokumentasi sesi tatap muka berhasil disimpan ke database!');
                }}
                className="w-1/2 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-sm"
              >
                Unggah Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Catat Refleksi */}
      {isReflectionModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46]">edit_note</span>
                <h3 className="text-base font-bold text-[#2A2823]">Catat Refleksi &amp; Evaluasi Siswa</h3>
              </div>
              <button onClick={() => setIsReflectionModalOpen(false)} className="text-[#6B675F] hover:text-[#2A2823]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="block text-[#6B675F] font-semibold">Refleksi Pembelajaran Hari Ini</label>
              <textarea
                rows={4}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Catat pemahaman materi dan perkembangan karakter anak..."
                className="w-full p-3 bg-[#FAF7F1] border border-[rgba(42,40,35,0.15)] rounded-2xl focus:ring-2 focus:ring-[#6F8F76] outline-none resize-none leading-relaxed"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReflectionModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReflectionModalOpen(false);
                  showToast('Refleksi pembelajaran berhasil disimpan dan disinkronkan ke draf WA orang tua!');
                }}
                className="w-1/2 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-sm"
              >
                Simpan Refleksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Laporkan Kendala GPS */}
      {isGpsIssueModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C1683F]">report_problem</span>
                <h3 className="text-base font-bold text-[#2A2823]">Laporkan Kendala GPS &amp; Geofence</h3>
              </div>
              <button onClick={() => setIsGpsIssueModalOpen(false)} className="text-[#6B675F] hover:text-[#2A2823]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="block text-[#6B675F] font-semibold">Deskripsi Kendala di Lokasi Siswa</label>
              <textarea
                rows={3}
                value={gpsIssueReport}
                onChange={(e) => setGpsIssueReport(e.target.value)}
                className="w-full p-3 bg-[#FAF7F1] border border-[rgba(42,40,35,0.15)] rounded-2xl focus:ring-2 focus:ring-[#6F8F76] outline-none resize-none leading-relaxed"
              />
              <p className="text-[11px] text-[#6B675F]">
                Laporan ini akan diteruskan ke tim operasional dan koordinator lapangan Magelang untuk verifikasi manual.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGpsIssueModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsGpsIssueModalOpen(false);
                  showToast('Laporan kendala GPS terkirim ke koordinator lapangan!');
                }}
                className="w-1/2 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-sm"
              >
                Kirim Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Riwayat Presensi Pekan Ini */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46]">history</span>
                <h3 className="text-base font-bold text-[#2A2823]">Riwayat Presensi Pekan Ini</h3>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-[#6B675F] hover:text-[#2A2823]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-2.5 max-h-72 overflow-y-auto text-xs">
              {visits.map((v, i) => (
                <div
                  key={v.id}
                  className="p-3 bg-[#FAF7F1] rounded-xl border border-[rgba(42,40,35,0.08)] flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-[#1c1c18]">
                      {i + 1}. {v.studentName} ({v.level})
                    </span>
                    <span className="text-[11px] text-[#6B675F]">{v.time} • {v.address}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.status === 'selesai'
                        ? 'bg-[#c8ebce] text-[#284230]'
                        : v.status === 'berlangsung'
                        ? 'bg-[#EFC9AE] text-[#6b2702]'
                        : 'bg-[#f0eee8] text-[#6B675F]'
                    }`}
                  >
                    {v.status === 'selesai' ? 'Selesai' : v.status === 'berlangsung' ? 'Aktif' : 'Terjadwal'}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Section: Breadcrumb, Page Title, & Fast Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#6B675F] font-semibold">Portal Tutor</span>
            <span className="text-[12px] text-[#6B675F]/50">/</span>
            <span className="text-[12px] text-[#3F5A46] font-bold">Presensi Kunjungan GPS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#284230] tracking-tight">
            Presensi Kunjungan Rumah (GPS Lapangan)
          </h1>
          <p className="text-xs sm:text-sm text-[#6B675F] max-w-2xl leading-relaxed">
            Verifikasi kehadiran geofence radius &lt;50m di lokasi rumah siswa, pencatatan durasi tatap muka, dan dokumentasi sesi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1c1c18] hover:bg-[#FAF7F1] transition-all text-xs font-semibold shadow-xs border border-[rgba(42,40,35,0.08)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">history</span>
            <span>Riwayat Presensi Pekan Ini</span>
          </button>
          <button
            type="button"
            onClick={() => setIsGpsIssueModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F1ECE1]/80 text-[#C1683F] hover:bg-[#F1ECE1] transition-all text-xs font-semibold shadow-xs border border-[rgba(42,40,35,0.08)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">report_problem</span>
            <span>Laporkan Kendala GPS</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Telemetry Cards (Bento 2.0) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Presensi Hari Ini */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6B675F] font-semibold uppercase tracking-wider">
              Presensi Hari Ini
            </span>
            <div className="w-8 h-8 rounded-full bg-[#c8ebce]/60 flex items-center justify-center text-[#3F5A46]">
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#284230]">
                {selesaiCount} / {totalVisits}
              </span>
              <span className="text-xs text-[#3F5A46] font-bold">Sesi Selesai</span>
            </div>
            <p className="text-[11px] text-[#6B675F] mt-1">
              {activeVisit && activeVisit.status === 'berlangsung'
                ? '1 sesi sedang berlangsung aktif'
                : 'Menunggu sesi berikutnya'}
            </p>
          </div>
          <div className="w-full bg-[#e5e2dc] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#6F8F76] h-full rounded-full transition-all duration-500"
              style={{ width: `${totalVisits > 0 ? (selesaiCount / totalVisits) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Akurasi Geofence */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6B675F] font-semibold uppercase tracking-wider">
              Akurasi Geofence
            </span>
            <div className="w-8 h-8 rounded-full bg-[#c8ebce]/60 flex items-center justify-center text-[#3F5A46]">
              <span className="material-symbols-outlined text-[18px]">radar</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#284230]">99.4%</span>
              <span className="text-[11px] text-[#6F8F76] font-bold">Tervalidasi</span>
            </div>
            <p className="text-[11px] text-[#6B675F] mt-1">Radius &lt; 30m rata-rata di Magelang</p>
          </div>
          <div className="flex items-center gap-1.5 text-[#3F5A46] text-[11px] font-bold">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Memenuhi standar SOP Bright Future</span>
          </div>
        </div>

        {/* Card 3: Total Durasi Tatap Muka */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6B675F] font-semibold uppercase tracking-wider">
              Durasi Tatap Muka
            </span>
            <div className="w-8 h-8 rounded-full bg-[#F1ECE1] flex items-center justify-center text-[#C1683F]">
              <span className="material-symbols-outlined text-[18px]">timer</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#284230]">{totalMenitBerjalan}</span>
              <span className="text-xs text-[#6B675F] font-semibold">/ {targetMenitTotal} Menit</span>
            </div>
            <p className="text-[11px] text-[#6B675F] mt-1">Target harian {totalVisits} sesi tatap muka</p>
          </div>
          <div className="w-full bg-[#e5e2dc] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#C1683F] h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totalMenitBerjalan / targetMenitTotal) * 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Card 4: Sensor Status GPS */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6B675F] font-semibold uppercase tracking-wider">
              Sensor GPS Tutor
            </span>
            <div className="w-8 h-8 rounded-full bg-[#c8ebce]/60 flex items-center justify-center text-[#3F5A46]">
              <span className="material-symbols-outlined text-[18px]">fmd_good</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#284230]">± 6 Meter</span>
            </div>
            <p className="text-[11px] text-[#6B675F] mt-1">Status: Akurat via Geolocation PWA</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6F8F76] animate-ping"></span>
            <span className="text-[11px] text-[#3F5A46] font-bold">Sinyal Satelit Optimal</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout (12 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Sesi Aktif & Upcoming (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {!activeVisit ? (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-[rgba(42,40,35,0.15)] flex flex-col items-center justify-center text-center gap-2">
              <span className="material-symbols-outlined text-4xl text-[#6B675F]">event_busy</span>
              <span className="text-sm font-bold text-[#1c1c18]">Belum Ada Sesi Kunjungan Aktif</span>
              <span className="text-xs text-[#6B675F] max-w-sm">
                Tutor {tutorName} belum memiliki sesi belajar yang sedang berjalan hari ini.
              </span>
            </div>
          ) : (
            <>
              {/* Sesi Aktif Focus Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-[rgba(42,40,35,0.08)] space-y-6 relative overflow-hidden">
                {/* Accent indicator bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6F8F76] via-[#3F5A46] to-[#C1683F]"></div>

                {/* Card Header: Title & Verification Beacon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#C1683F] uppercase tracking-wider font-bold">
                      Sesi Aktif Saat Ini
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#1c1c18]">
                      {activeVisit.studentName}
                    </h2>
                    <p className="text-xs text-[#6B675F]">
                      Siswa {activeVisit.level} • {activeVisit.subject}
                    </p>
                  </div>

                  {/* Geofence Verified Badge */}
                  <div className="inline-flex items-center gap-2 bg-[#c8ebce]/70 px-3.5 py-1.5 rounded-full self-start sm:self-auto shadow-xs border border-[rgba(42,40,35,0.06)]">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6F8F76] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3F5A46]"></span>
                    </span>
                    <span className="text-[11px] text-[#284230] font-bold">
                      Radius 8m • Geofence Sah
                    </span>
                  </div>
                </div>

                {/* Location Box */}
                <div className="flex items-start gap-3 p-3.5 bg-[#FAF7F1] rounded-xl border border-[rgba(42,40,35,0.06)]">
                  <span className="material-symbols-outlined text-[#3F5A46] text-[20px] shrink-0 mt-0.5">
                    home_pin
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#1c1c18] block">
                      {activeVisit.address}
                    </span>
                    <span className="text-[11px] text-[#6B675F]">
                      Patokan: Depan Masjid Al-Ikhlas, Pagar Kayu Cokelat
                    </span>
                  </div>
                  <a
                    className="p-1.5 rounded-lg bg-[#e5e2dc] text-[#1c1c18] hover:bg-[#dcdad4] text-xs flex items-center justify-center shrink-0 cursor-pointer"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeVisit.address || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Navigasi Ulang"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>

                {/* Stopwatch Display & Progress Bar */}
                <div className="bg-[#FAF7F1] p-5 rounded-2xl space-y-4 border border-[rgba(42,40,35,0.06)] shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                        Durasi Tatap Muka Berjalan
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#3F5A46] tracking-tight">
                          {formatTimer(secondsElapsed)}
                        </span>
                        <span className="text-xs text-[#6B675F] font-semibold">/ 01:10:00 Target</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-[#C1683F] font-bold bg-[#F1ECE1] px-2.5 py-1 rounded-md">
                        Sisa {Math.max(0, 70 - Math.floor(secondsElapsed / 60))} Menit
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#e5e2dc] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#3F5A46] h-full rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Real-Time Session Checkpoints Feed */}
                <div className="space-y-3">
                  <span className="text-[11px] text-[#6B675F] uppercase tracking-wider font-semibold">
                    Log Aktivitas Sesi (Real-Time)
                  </span>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 bg-[#FAF7F1] rounded-xl border border-[rgba(42,40,35,0.06)]">
                      <span className="material-symbols-outlined text-[#6F8F76] text-[18px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <div className="flex-1 flex items-baseline justify-between gap-2">
                        <p className="text-xs text-[#1c1c18] font-medium">
                          Check-in GPS Berhasil (Koordinat: -7.5024, 110.2191)
                        </p>
                        <span className="text-[11px] text-[#6B675F] shrink-0">13:30 WIB</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-[#FAF7F1] rounded-xl border border-[rgba(42,40,35,0.06)]">
                      <span className="material-symbols-outlined text-[#6F8F76] text-[18px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <div className="flex-1 flex items-baseline justify-between gap-2">
                        <p className="text-xs text-[#1c1c18] font-medium">
                          Pengerjaan LKPD &amp; Flashcard Sesi Belajar
                        </p>
                        <span className="text-[11px] text-[#6B675F] shrink-0">13:35 WIB</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-[#c8ebce]/30 rounded-xl border border-[rgba(42,40,35,0.06)]">
                      <span className="material-symbols-outlined text-[#C1683F] text-[18px] shrink-0 mt-0.5 animate-pulse">
                        pending
                      </span>
                      <div className="flex-1 flex items-baseline justify-between gap-2">
                        <p className="text-xs text-[#1c1c18] font-medium">
                          Kuis Mandiri &amp; Evaluasi Pemahaman Materi
                        </p>
                        <span className="text-[11px] text-[#3F5A46] font-semibold shrink-0">
                          Sedang Berjalan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentation & Reflection Mini Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#f0eee8] hover:bg-[#e5e2dc] text-[#1c1c18] text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[#3F5A46] text-[20px]">add_a_photo</span>
                    <span>Unggah Foto Sesi (1 Terlampir)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReflectionModalOpen(true)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#f0eee8] hover:bg-[#e5e2dc] text-[#1c1c18] text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[#3F5A46] text-[20px]">edit_note</span>
                    <span>Catat Refleksi Singkat</span>
                  </button>
                </div>

                {/* Primary Action: Checkout */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#3F5A46] hover:bg-[#284230] text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[22px]">where_to_vote</span>
                    <span>Check-Out Sesi Kunjungan (Selesaikan)</span>
                  </button>
                  <p className="text-[11px] text-[#6B675F] text-center mt-2">
                    Check-out akan memverifikasi ulang geofence dan otomatis mengirimkan rangkuman ke sistem penggajian &amp; orang tua.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Upcoming Sessions (Quick Preparation) */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[rgba(42,40,35,0.08)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46] text-[20px]">schedule</span>
                <h3 className="text-base font-bold text-[#1c1c18]">Jadwal Kunjungan Berikutnya Hari Ini</h3>
              </div>
              <span className="text-[11px] text-[#6B675F] font-semibold">
                {upcomingVisits.length} Sesi Tersisa
              </span>
            </div>

            {upcomingVisits.length === 0 ? (
              <p className="text-xs text-[#6B675F] italic py-2">
                Seluruh sesi bimbingan hari ini telah selesai atau belum ada sesi tambahan.
              </p>
            ) : (
              upcomingVisits.map((item, i) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#FAF7F1] rounded-xl space-y-3 border border-[rgba(42,40,35,0.06)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1c1c18]">
                          Sesi {i + 2}: {item.studentName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#F1ECE1] text-[#C1683F] rounded-full font-semibold">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B675F] mt-0.5">
                        {item.level} • {item.subject}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#6B675F] bg-[#f0eee8] px-2.5 py-1 rounded-md self-start sm:self-auto font-semibold">
                      Estimasi: 15-20 Menit
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#6B675F] text-xs">
                    <span className="material-symbols-outlined text-[18px] text-[#C1683F]">location_on</span>
                    <span className="truncate">{item.address}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#6B675F] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-[#6B675F]">lock</span>
                      Tombol Check-in aktif saat radius &lt; 50m
                    </span>
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-1.5 rounded-lg bg-[#e5e2dc] text-[#6B675F]/70 text-xs font-semibold cursor-not-allowed"
                    >
                      Check-in GPS (Terkunci)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Simulated Geofence Map & Riwayat Sesi (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Geofence Mini Visualizer Box */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[rgba(42,40,35,0.08)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46] text-[20px]">explore</span>
                <h3 className="text-base font-bold text-[#1c1c18]">Radar Geofence Rumah Siswa</h3>
              </div>
              <span className="text-[11px] text-[#6F8F76] font-bold">Aktif</span>
            </div>

            {/* Simulated Vector Geofence Map */}
            <div className="relative w-full h-56 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] overflow-hidden flex items-center justify-center">
              {/* Ambient Grid Pattern */}
              <svg className="absolute inset-0 w-full h-full text-[#6B675F]/10" fill="none">
                <defs>
                  <pattern id="grid-pattern-radar" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.75" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern-radar)" />
              </svg>

              {/* Simulated Road Lines */}
              <svg className="absolute inset-0 w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M -10 90 Q 90 70, 180 120 T 360 140" stroke="rgba(42, 40, 35, 0.12)" />
                <path d="M 120 -10 L 140 240" stroke="rgba(42, 40, 35, 0.12)" />
                <path d="M 220 20 L 260 220" stroke="rgba(42, 40, 35, 0.08)" />
              </svg>

              {/* Circular 50m Geofence Boundary */}
              <div className="absolute w-40 h-40 rounded-full bg-[#c8ebce]/40 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-[#c8ebce]/60 flex items-center justify-center animate-pulse">
                  {/* Target house center pin */}
                  <div className="w-4 h-4 rounded-full bg-[#3F5A46] shadow-md flex items-center justify-center text-[9px] text-white font-bold">
                    H
                  </div>
                </div>
              </div>

              {/* Tutor live pin (8 meters away inside zone) */}
              <div className="absolute top-[46%] left-[54%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-[#C1683F] ring-4 ring-[#EFC9AE]/60 shadow-lg flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </div>
                <span className="text-[10px] bg-[#1c1c18] text-white px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap font-semibold">
                  Posisi {tutorName.split(',')[0]} (8m)
                </span>
              </div>

              {/* Radius label badge */}
              <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md shadow-xs text-[#1c1c18] text-[11px] font-semibold flex items-center gap-1.5 border border-[rgba(42,40,35,0.08)]">
                <span className="w-2 h-2 rounded-full bg-[#3F5A46]"></span>
                <span>Radius Aman 50 Meter</span>
              </div>
            </div>

            {/* Telemetry Data Strip */}
            <div className="p-3 bg-[#FAF7F1] rounded-xl space-y-1.5 border border-[rgba(42,40,35,0.06)]">
              <div className="flex items-center justify-between text-[#6B675F] text-[11px]">
                <span>Koordinat Akurat:</span>
                <span className="font-semibold text-[#1c1c18] text-xs">Lat -7.50241, Long 110.21915</span>
              </div>
              <div className="flex items-center justify-between text-[#6B675F] text-[11px]">
                <span>Akurasi Perangkat:</span>
                <span className="font-semibold text-[#3F5A46] text-xs">6.2 meter (Stabil)</span>
              </div>
            </div>

            {/* External Map Link */}
            <a
              className="w-full py-2.5 px-3 rounded-xl bg-[#f0eee8] text-[#1c1c18] hover:bg-[#e5e2dc] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              <span>Buka di Google Maps Navigasi</span>
            </a>
          </div>

          {/* Riwayat Presensi Hari Ini List */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[rgba(42,40,35,0.08)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46] text-[20px]">task_alt</span>
                <h3 className="text-base font-bold text-[#1c1c18]">Riwayat Presensi Hari Ini</h3>
              </div>
              <span className="text-[11px] text-[#3F5A46] font-bold">
                {finishedVisits.length} Selesai
              </span>
            </div>

            {finishedVisits.length === 0 ? (
              <p className="text-xs text-[#6B675F] italic py-2">
                Belum ada sesi yang telah di-checkout hari ini.
              </p>
            ) : (
              finishedVisits.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-[#FAF7F1] rounded-xl space-y-2.5 border border-[rgba(42,40,35,0.06)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#1c1c18] block">
                        {item.studentName} ({item.level})
                      </span>
                      <span className="text-[11px] text-[#6B675F]">{item.time}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-[#c8ebce] text-[#284230] rounded-full font-bold">
                      Disetujui Admin
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[#6B675F] text-[10px]">
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[13px] text-[#6F8F76]">fmd_good</span>
                      GPS Valid (12m)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[13px] text-[#6F8F76]">photo_camera</span>
                      Foto LKPD Terunggah
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-[#C1683F]">
                      <span className="material-symbols-outlined text-[13px]">payments</span>
                      Honor Terhitung
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panduan Standar Presensi Lapangan */}
          <div className="bg-[#FAF7F1] rounded-2xl p-5 space-y-3 shadow-xs border border-[rgba(42,40,35,0.08)]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C1683F] text-[20px]">lightbulb</span>
              <h4 className="text-xs font-bold text-[#1c1c18]">Standar SOP Presensi Lapangan</h4>
            </div>

            <ol className="space-y-2 text-[#6B675F] text-xs pl-1">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#3F5A46] shrink-0">1.</span>
                <span>Lakukan <strong>Check-In GPS</strong> tepat di teras / pintu masuk gerbang siswa (maksimal radius 50m).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#3F5A46] shrink-0">2.</span>
                <span>Pastikan kegiatan tatap muka bimbingan berjalan efektif untuk validasi kompensasi tutor.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#3F5A46] shrink-0">3.</span>
                <span>Check-Out otomatis mengunci catatan belajar dan menyiapkan draf WhatsApp update ke orang tua.</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
