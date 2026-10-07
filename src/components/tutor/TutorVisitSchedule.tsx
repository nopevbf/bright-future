import React, { useState, useMemo } from 'react';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../../utils/tutorPairingResolver';

export interface TutorVisitScheduleProps {
  tutorName: string;
  assignedStudents: AssignedStudentSummary[];
  visits: FirestoreTutorVisitDoc[];
  onNavigateTab?: (tabId: string) => void;
  onCheckoutSession?: (visitId: string) => void;
}

type ScheduleSubTab = 'timeline' | 'weekly' | 'directory';
type StatusFilter = 'semua' | 'selesai' | 'berjalan' | 'menunggu';

interface DayItem {
  id: string;
  name: string;
  shortName: string;
  dateNum: number;
  dateStr: string;
  sessionCount: number;
  isHoliday?: boolean;
}

export const TutorVisitSchedule: React.FC<TutorVisitScheduleProps> = ({
  tutorName,
  assignedStudents,
  visits,
  onNavigateTab,
  onCheckoutSession,
}) => {
  const [subTab, setSubTab] = useState<ScheduleSubTab>('timeline');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [selectedDayId, setSelectedDayId] = useState<string>('jumat');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Reschedule Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
  const [selectedStudentForReschedule, setSelectedStudentForReschedule] = useState<string>(
    assignedStudents[0]?.studentId || assignedStudents[0]?.id || ''
  );
  const [rescheduleDate, setRescheduleDate] = useState<string>('2026-09-22');
  const [rescheduleTime, setRescheduleTime] = useState<string>('15:30');
  const [rescheduleReason, setRescheduleReason] = useState<string>('Hujan deras di Magelang Utara');

  const days: DayItem[] = [
    { id: 'senin', name: 'Senin', shortName: 'Sen', dateNum: 15, dateStr: '15 Sep 2026', sessionCount: 3 },
    { id: 'selasa', name: 'Selasa', shortName: 'Sel', dateNum: 16, dateStr: '16 Sep 2026', sessionCount: 4 },
    { id: 'rabu', name: 'Rabu', shortName: 'Rab', dateNum: 17, dateStr: '17 Sep 2026', sessionCount: 3 },
    { id: 'kamis', name: 'Kamis', shortName: 'Kam', dateNum: 18, dateStr: '18 Sep 2026', sessionCount: 4 },
    { id: 'jumat', name: 'Jumat', shortName: 'Jum', dateNum: 19, dateStr: '19 Sep 2026', sessionCount: 4 },
    { id: 'sabtu', name: 'Sabtu', shortName: 'Sab', dateNum: 20, dateStr: '20 Sep 2026', sessionCount: 0, isHoliday: true },
    { id: 'minggu', name: 'Minggu', shortName: 'Min', dateNum: 21, dateStr: '21 Sep 2026', sessionCount: 0, isHoliday: true },
  ];

  const activeDay = days.find((d) => d.id === selectedDayId) || days[4];

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Filter visits based on statusFilter
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (statusFilter === 'selesai') return v.status === 'selesai';
      if (statusFilter === 'berjalan') return v.status === 'berlangsung';
      if (statusFilter === 'menunggu') return v.status === 'berikutnya' || v.status === 'antre';
      return true;
    });
  }, [visits, statusFilter]);

  // Metrics
  const totalSesi = visits.length;
  const selesaiCount = visits.filter((v) => v.status === 'selesai').length;
  const honorAkumulasi = selesaiCount * 40000;
  const totalJarakKm = (totalSesi * 3.7).toFixed(1);

  const handlePrintOrExport = () => {
    showToast('Menyiapkan format cetak & ekspor kalender PDF...');
    window.print();
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st =
      assignedStudents.find((s) => (s.studentId || s.id) === selectedStudentForReschedule) ||
      assignedStudents[0];
    const studentName = st ? st.studentName : 'Siswa';
    showToast(`Pengajuan reschedule untuk ${studentName} pada ${rescheduleDate} pukul ${rescheduleTime} berhasil diajukan.`);
    setIsRescheduleModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full text-[#1c1c18] font-sans">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#284230] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 animate-fade-in text-xs font-semibold max-w-md">
          <span className="material-symbols-outlined text-[20px] text-[#c8ebce]">check_circle</span>
          <span className="flex-1">{feedbackToast}</span>
          <button onClick={() => setFeedbackToast(null)} className="text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C1683F]">edit_calendar</span>
                <h3 className="text-base font-bold text-[#2A2823]">Form Pengajuan Reschedule Sesi</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="text-[#6B675F] hover:text-[#2A2823]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#6B675F] font-semibold mb-1">Pilih Siswa Binaan</label>
                <select
                  value={selectedStudentForReschedule}
                  onChange={(e) => setSelectedStudentForReschedule(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F1] border border-[rgba(42,40,35,0.15)] rounded-xl focus:ring-2 focus:ring-[#6F8F76] outline-none font-semibold text-[#1c1c18]"
                >
                  {assignedStudents.map((s) => (
                    <option key={s.studentId || s.id} value={s.studentId || s.id}>
                      {s.studentName} ({s.level})
                    </option>
                  ))}
                  {assignedStudents.length === 0 && (
                    <option value="">Belum ada siswa binaan terdaftar</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6B675F] font-semibold mb-1">Tanggal Baru</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F1] border border-[rgba(42,40,35,0.15)] rounded-xl focus:ring-2 focus:ring-[#6F8F76] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6B675F] font-semibold mb-1">Waktu Sesi</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F1] border border-[rgba(42,40,35,0.15)] rounded-xl focus:ring-2 focus:ring-[#6F8F76] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6B675F] font-semibold mb-1">Alasan Penjadwalan Ulang</label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Contoh: Koordinasi izin orang tua / cuaca hujan lebat"
                  className="w-full px-3 py-2 bg-[#FAF7F1] border border-[rgba(42,40,35,0.15)] rounded-xl focus:ring-2 focus:ring-[#6F8F76] outline-none resize-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-sm cursor-pointer"
                >
                  Ajukan Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#6B675F] font-semibold">Portal Tutor</span>
            <span className="material-symbols-outlined text-[14px] text-[#6B675F]">chevron_right</span>
            <span className="text-[12px] text-[#284230] font-bold">Jadwal Visit Rumah</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#284230] tracking-tight">
            Jadwal &amp; Agenda Kunjungan Rumah
          </h1>
          <p className="text-xs sm:text-sm text-[#6B675F] max-w-3xl leading-relaxed">
            Atur kalender mingguan Magelang &amp; Mertoyudan, periksa detail titik temu, estimasi waktu tempuh antar-rumah, dan kelengkapan materi 70 menit per sesi.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white shadow-xs border border-[rgba(42,40,35,0.08)] text-xs font-semibold text-[#1c1c18]">
            <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">date_range</span>
            <span>15 - 21 Sep 2026</span>
          </div>

          <button
            type="button"
            onClick={() => setIsRescheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white shadow-xs hover:shadow text-[#2A2823] text-xs font-semibold border border-[rgba(42,40,35,0.08)] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#C1683F]">edit_calendar</span>
            <span>Ajukan Reschedule</span>
          </button>

          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3F5A46] text-white text-xs font-bold shadow-xs hover:bg-[#284230] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">near_me</span>
            <span>Rute Google Maps</span>
          </a>

          <button
            type="button"
            onClick={handlePrintOrExport}
            title="Ekspor PDF / Kalender"
            className="p-2 rounded-xl bg-white text-[#6B675F] hover:text-[#1c1c18] shadow-xs border border-[rgba(42,40,35,0.08)] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
        </div>
      </div>

      {/* Bento Telemetry Metrics Cards (4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B675F]">
              Total Kunjungan
            </span>
            <span className="p-1.5 rounded-lg bg-[#f6f3ed] text-[#284230]">
              <span className="material-symbols-outlined text-[18px]">fact_check</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#284230]">{selesaiCount}</span>
              <span className="text-xs text-[#6B675F] font-semibold">/ {totalSesi} sesi</span>
            </div>
            <p className="text-[11px] text-[#3F5A46] font-semibold mt-1">
              Tersisa {Math.max(0, totalSesi - selesaiCount)} sesi pekan ini
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B675F]">
              Estimasi Honor
            </span>
            <span className="p-1.5 rounded-lg bg-[#EFC9AE]/50 text-[#C1683F]">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#2A2823]">
              Rp {honorAkumulasi.toLocaleString('id-ID')}
            </span>
            <p className="text-[11px] text-[#6B675F] font-semibold mt-1">
              {selesaiCount} sesi tercatat (Rp 40k/sesi)
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B675F]">
              Total Jarak
            </span>
            <span className="p-1.5 rounded-lg bg-[#c8ebce]/60 text-[#47654f]">
              <span className="material-symbols-outlined text-[18px]">two_wheeler</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#284230]">{totalJarakKm}</span>
              <span className="text-xs text-[#6B675F] font-semibold">km</span>
            </div>
            <p className="text-[11px] text-[#6B675F] font-semibold mt-1">Magelang &amp; Mertoyudan</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B675F]">
              Ketepatan Waktu
            </span>
            <span className="p-1.5 rounded-lg bg-[#ebe8e2] text-[#284230]">
              <span className="material-symbols-outlined text-[18px]">timer</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#284230]">99.2%</span>
            <p className="text-[11px] text-[#3F5A46] font-semibold mt-1">Rata-rata tepat waktu</p>
          </div>
        </div>
      </div>

      {/* Switcher Tabs & Day Navigation Strip */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[rgba(42,40,35,0.08)] mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-[#f0eee8] rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setSubTab('timeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'timeline'
                  ? 'bg-white text-[#284230] shadow-xs'
                  : 'text-[#6B675F] hover:text-[#1c1c18]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_timeline</span>
              <span>Agenda Harian (Timeline)</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('weekly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'weekly'
                  ? 'bg-white text-[#284230] shadow-xs'
                  : 'text-[#6B675F] hover:text-[#1c1c18]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
              <span>Kalender Mingguan (Grid 7 Hari)</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('directory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'directory'
                  ? 'bg-white text-[#284230] shadow-xs'
                  : 'text-[#6B675F] hover:text-[#1c1c18]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">contact_page</span>
              <span>Daftar Siswa &amp; Alamat (Directory)</span>
            </button>
          </div>

          {/* Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] text-[#6B675F] font-semibold mr-1">Filter:</span>
            {[
              { id: 'semua', label: `Semua (${visits.length})` },
              { id: 'selesai', label: `Selesai (${visits.filter((v) => v.status === 'selesai').length})` },
              { id: 'berjalan', label: `Berjalan (${visits.filter((v) => v.status === 'berlangsung').length})` },
              { id: 'menunggu', label: `Menunggu (${visits.filter((v) => v.status === 'berikutnya' || v.status === 'antre').length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as StatusFilter)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-[#3F5A46] text-white shadow-xs'
                    : 'bg-[#f0eee8] text-[#6B675F] hover:text-[#1c1c18]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 7-Day Quick Strip */}
        <div className="grid grid-cols-7 gap-2 pt-2 border-t border-[rgba(42,40,35,0.06)]">
          {days.map((day) => {
            const isActive = day.id === selectedDayId;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDayId(day.id)}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all text-center relative overflow-hidden cursor-pointer ${
                  isActive
                    ? 'bg-[#284230] text-white shadow-md'
                    : 'bg-[#f6f3ed] hover:bg-[#f0eee8] text-[#1c1c18]'
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-semibold ${
                    isActive ? 'opacity-80' : 'text-[#6B675F]'
                  }`}
                >
                  {day.shortName}
                </span>
                <span className="text-base sm:text-lg font-bold mt-0.5">{day.dateNum}</span>
                <span
                  className={`text-[10px] font-semibold mt-0.5 truncate ${
                    isActive
                      ? 'text-[#c8ebce]'
                      : day.isHoliday
                      ? 'text-[#C1683F]'
                      : 'text-[#3F5A46]'
                  }`}
                >
                  {day.isHoliday ? 'Libur' : `${day.sessionCount} Sesi`}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C1683F] absolute top-2 right-2"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Content: 2 Columns (~65% Left, ~35% Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* TAB 1: AGENDA HARIAN TIMELINE */}
          {subTab === 'timeline' && (
            <>
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#284230] text-white">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-[#284230]">Kunjungan Rumah Hari Ini</h2>
                    <p className="text-xs text-[#6B675F]">
                      {activeDay.name}, {activeDay.dateStr} • {filteredVisits.length} Sesi Terjadwal
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#c8ebce] text-[#284230] text-[11px] font-bold">
                  {selectedDayId === 'jumat' ? 'Jadwal Hari Ini' : `Agenda ${activeDay.name}`}
                </span>
              </div>

              {filteredVisits.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-dashed border-[rgba(42,40,35,0.15)] flex flex-col items-center justify-center text-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-[#6B675F]">event_busy</span>
                  <span className="text-sm font-bold text-[#1c1c18]">Belum Ada Jadwal Kunjungan</span>
                  <span className="text-xs text-[#6B675F] max-w-sm">
                    {visits.length === 0
                      ? `Tutor ${tutorName} belum memiliki siswa binaan aktif. Jadwal akan otomatis muncul saat admin memasangkan siswa.`
                      : `Tidak ada sesi bimbingan dengan filter status "${statusFilter}" pada hari ${activeDay.name}.`}
                  </span>
                </div>
              ) : (
                filteredVisits.map((item, idx) => {
                  const isSelesai = item.status === 'selesai';
                  const isLive = item.status === 'berlangsung';
                  const isNext = item.status === 'berikutnya';

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl p-5 shadow-xs border transition-all flex flex-col gap-3.5 ${
                        isLive
                          ? 'border-l-4 border-l-[#C1683F] border-[rgba(42,40,35,0.08)] shadow-sm'
                          : 'border-[rgba(42,40,35,0.08)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isLive
                                ? 'bg-[#C1683F] text-white'
                                : isSelesai
                                ? 'bg-[#c8ebce] text-[#284230]'
                                : 'bg-[#f0eee8] text-[#6B675F]'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-bold text-[#1c1c18]">
                                {item.studentName}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isLive
                                    ? 'bg-[#EFC9AE]/50 text-[#C1683F]'
                                    : 'bg-[#f0eee8] text-[#6B675F]'
                                }`}
                              >
                                {item.level}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] font-semibold mt-0.5 ${
                                isLive ? 'text-[#C1683F]' : 'text-[#6B675F]'
                              }`}
                            >
                              {item.time}
                              {isLive && ` • Sisa ${Math.max(0, 70 - (item.elapsedMinutes || 0))} Menit`}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            isSelesai
                              ? 'bg-[#c8ebce] text-[#284230]'
                              : isLive
                              ? 'bg-[#EFC9AE]/50 text-[#6b2702] animate-pulse'
                              : isNext
                              ? 'bg-[#f0eee8] text-[#284230]'
                              : 'bg-[#f0eee8] text-[#6B675F]'
                          }`}
                        >
                          {isSelesai ? (
                            <>
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              <span>Selesai</span>
                            </>
                          ) : isLive ? (
                            <span>Sedang Berjalan</span>
                          ) : isNext ? (
                            <span>Selanjutnya</span>
                          ) : (
                            <span>Terjadwal</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#6B675F]">
                        <span
                          className={`material-symbols-outlined text-[16px] shrink-0 ${
                            isLive ? 'text-[#C1683F]' : 'text-[#6F8F76]'
                          }`}
                        >
                          location_on
                        </span>
                        <span className="truncate">{item.address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[rgba(42,40,35,0.06)] flex-wrap gap-2">
                        <span className="text-[11px] text-[#6B675F] font-semibold">
                          {item.subject}
                        </span>

                        <div className="flex items-center gap-2">
                          {isLive && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onCheckoutSession) {
                                  onCheckoutSession(item.id);
                                } else {
                                  showToast(`Sesi ${item.studentName} berhasil di-checkout!`);
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">logout</span>
                              <span>Check-out GPS</span>
                            </button>
                          )}

                          {isNext && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[#f0eee8] text-[#284230] text-xs font-semibold hover:bg-[#ebe8e2] transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">near_me</span>
                              <span>Buka Navigasi</span>
                            </a>
                          )}

                          {!isLive && !isNext && (
                            <span className="text-[11px] text-[#3F5A46] font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              <span>Konfirmasi WA OK</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: KALENDER MINGGUAN (GRID 7 HARI) */}
          {subTab === 'weekly' && (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.06)]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#284230]">calendar_month</span>
                  <h3 className="text-base font-bold text-[#284230]">Matriks Kalender 7 Hari</h3>
                </div>
                <span className="text-xs text-[#6B675F] font-semibold">15 - 21 Sep 2026</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {days.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 bg-[#FAF7F1] rounded-xl border border-[rgba(42,40,35,0.08)] flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1c1c18]">
                        {d.name}, {d.dateNum} Sep
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.isHoliday ? 'bg-amber-100 text-[#C1683F]' : 'bg-[#c8ebce] text-[#284230]'
                        }`}
                      >
                        {d.isHoliday ? 'Libur' : `${d.sessionCount} Sesi`}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1 text-[11px] text-[#6B675F]">
                      {d.isHoliday ? (
                        <p className="italic text-[#6B675F]">Evaluasi pekanan &amp; penyusunan modul</p>
                      ) : (
                        assignedStudents.slice(0, 2).map((s) => (
                          <div
                            key={s.studentId || s.id}
                            className="p-1.5 bg-white rounded-lg border border-[rgba(42,40,35,0.06)] flex items-center justify-between"
                          >
                            <span className="font-semibold text-[#1c1c18] truncate">{s.studentName}</span>
                            <span className="text-[10px] text-[#C1683F] font-bold shrink-0">{s.level}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DAFTAR SISWA & ALAMAT DIRECTORY */}
          {subTab === 'directory' && (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.06)]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#284230]">person_pin_circle</span>
                  <h3 className="text-base font-bold text-[#284230]">Direktori Siswa &amp; Alamat Rumah</h3>
                </div>
                <span className="text-xs text-[#6B675F] font-semibold">
                  {assignedStudents.length} Siswa Binaan
                </span>
              </div>

              {assignedStudents.length === 0 ? (
                <p className="text-xs text-[#6B675F] text-center py-6">Belum ada siswa binaan yang dipasangkan oleh admin.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {assignedStudents.map((s) => (
                    <div
                      key={s.studentId || s.id}
                      className="p-4 bg-[#FAF7F1] rounded-xl border border-[rgba(42,40,35,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1c1c18]">{s.studentName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[rgba(42,40,35,0.08)] font-bold text-[#3F5A46]">
                            {s.level}
                          </span>
                        </div>
                        <span className="text-xs text-[#6B675F] flex items-center gap-1 truncate">
                          <span className="material-symbols-outlined text-[15px] text-[#C1683F]">pin_drop</span>
                          {s.address}
                        </span>
                        <span className="text-[11px] text-[#6B675F]">
                          Wali: <strong className="text-[#1c1c18]">{s.parentName || 'Orang Tua'}</strong> ({s.parentPhone || s.whatsapp || '-'})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://wa.me/${(s.parentPhone || s.whatsapp || '').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || 'Magelang')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white border border-[rgba(42,40,35,0.12)] text-[#284230] text-xs font-semibold hover:bg-[#f0eee8] transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">navigation</span>
                          <span>Peta</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (~35%): Route Preview & SOP 70 Mnt */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card Ringkasan Rute */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#3F5A46]">map</span>
                <h3 className="text-base font-bold text-[#284230]">Ringkasan Rute</h3>
              </div>
              <span className="text-[11px] font-bold text-[#6F8F76]">{totalJarakKm} km Hari Ini</span>
            </div>

            {/* Static Simulated Map Visual Banner */}
            <div
              className="w-full h-40 bg-[#e5e2dc] rounded-xl relative overflow-hidden bg-cover bg-center shadow-inner"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80')",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#284230]/75 via-transparent to-transparent p-3 flex items-end justify-between">
                <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#284230] text-[11px] font-bold shadow-xs">
                  GPS Live Aktif
                </span>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md text-[#284230] hover:text-[#1c1c18] text-[11px] font-semibold shadow-xs flex items-center gap-1"
                >
                  <span>Buka Peta</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>

            {/* List of stops */}
            <div className="space-y-2.5 pt-1">
              {visits.slice(0, 4).map((v, i) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between text-xs py-1 border-b border-[rgba(42,40,35,0.06)]"
                >
                  <span className="text-[#6B675F] truncate max-w-[200px]">
                    {i + 1}. {v.studentName} ({v.level})
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      v.status === 'selesai'
                        ? 'text-[#3F5A46]'
                        : v.status === 'berlangsung'
                        ? 'text-[#C1683F] font-bold'
                        : 'text-[#6B675F]'
                    }`}
                  >
                    {v.status === 'selesai'
                      ? 'Selesai'
                      : v.status === 'berlangsung'
                      ? 'Aktif'
                      : v.time.split('-')[0].trim()}
                  </span>
                </div>
              ))}
              {visits.length === 0 && (
                <p className="text-xs text-[#6B675F] italic">Belum ada titik rute terjadwal.</p>
              )}
            </div>
          </div>

          {/* Card Panduan Singkat 70 Menit */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#3F5A46]">checklist</span>
                <h3 className="text-base font-bold text-[#284230]">Panduan Singkat 70 Menit</h3>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#6B675F]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#3F5A46] shrink-0">check</span>
                <span>Check-in GPS valid radius &lt; 50m rumah siswa</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#3F5A46] shrink-0">check</span>
                <span>50 mnt konsep &amp; LKPD + 20 mnt evaluasi mandiri</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#3F5A46] shrink-0">check</span>
                <span>Kirim draf feedback singkat ke orang tua</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[rgba(42,40,35,0.06)] flex items-center justify-between">
              <span className="text-[11px] text-[#6B675F]">Butuh bantuan rute?</span>
              <button
                type="button"
                onClick={() => {
                  window.open(
                    'https://wa.me/6285173230198?text=Halo%20Koordinator%20Bright%20Future%2C%20saya%20butuh%20bantuan%20rute.',
                    '_blank'
                  );
                }}
                className="text-[#C1683F] hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>Koordinator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Micro Action Floating Bar */}
      <div className="mt-10 p-4 bg-white rounded-2xl shadow-xs border border-[rgba(42,40,35,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-[#3F5A46]">security</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#1c1c18]">
              Kamera &amp; Geolokasi Lapangan Aktif
            </span>
            <span className="text-[10px] text-[#6B675F]">
              Bright Future Mobile Engine v4.2 • Magelang Region
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => showToast('Jadwal kunjungan berhasil disinkronkan untuk akses luring/offline!')}
            className="px-4 py-2 rounded-xl bg-[#f0eee8] text-[#2A2823] hover:bg-[#e5e2dc] text-xs font-semibold transition-colors cursor-pointer"
          >
            Sinkronkan Jadwal Offline
          </button>
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('modul-dan-materi');
              showToast('Membuka modul dan lembar kerja aktif...');
            }}
            className="px-5 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-xs transition-all cursor-pointer"
          >
            Buka Lembar Kerja Digital (Bab 3)
          </button>
        </div>
      </div>
    </div>
  );
};
