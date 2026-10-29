import React from 'react';
import { ManagedStudent } from '../admin/studentData';
import { FirestoreTutorVisitDoc } from '../../firebase';
import { StudentMetrics } from '../../utils/studentDataResolver';

interface StudentHomeTabProps {
  student: ManagedStudent;
  tutorName: string;
  visits: FirestoreTutorVisitDoc[];
  metrics: StudentMetrics;
  isTableReady: boolean;
  onToggleTableReady: () => void;
  onOpenQuiz: () => void;
  onOpenLkpd: () => void;
  isQuizPassed: boolean;
}

export const StudentHomeTab: React.FC<StudentHomeTabProps> = ({
  student,
  tutorName,
  visits,
  metrics,
  isTableReady,
  onToggleTableReady,
  onOpenQuiz,
  onOpenLkpd,
  isQuizPassed,
}) => {
  const sName = (student?.studentName || '').trim().toLowerCase();
  const safeVisits = Array.isArray(visits) ? visits : [];

  // Find upcoming or today visit
  const upcomingVisit = safeVisits.find(
    (v) =>
      v &&
      sName &&
      (v.studentName || '').trim().toLowerCase() === sName &&
      (v.status === 'berlangsung' || v.status === 'berikutnya' || v.status === 'antre')
  ) || safeVisits.find(
    (v) => v && sName && (v.studentName || '').trim().toLowerCase() === sName
  );

  const tutorNotes = safeVisits
    .filter(
      (v) =>
        v &&
        sName &&
        (v.studentName || '').trim().toLowerCase() === sName &&
        Boolean(v.notes)
    )
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];

  const hasTutor = Boolean(tutorName && tutorName.trim() !== '');

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f6f3ed] via-[#f0eee8] to-[#F1ECE1] p-6 sm:p-8 shadow-sm border border-[rgba(42,40,35,0.08)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8ebce]/70 text-[#284230] text-[11px] font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-[#3F5A46] animate-pulse"></span>
              <span>
                {hasTutor
                  ? `Tatap Muka 70 Menit bersama ${tutorName}`
                  : 'Program Bimbel Tatap Muka Rumah • Bright Future Magelang'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#284230] tracking-tight mt-1">
              Semangat Belajar, {student.studentName}! 🚀
            </h1>
            <p className="text-xs sm:text-sm text-[#424843] leading-relaxed">
              {hasTutor ? (
                <>
                  Tutor pendampingmu <span className="font-bold text-[#1c1c18]">{tutorName}</span> siap membimbingmu
                  untuk mata pelajaran <span className="font-bold text-[#1c1c18]">{student.subjects?.join(', ') || 'Tematik & Sains'}</span>. Meja belajarmu sudah siap?
                </>
              ) : (
                <>
                  Selamat datang di Portal Belajar! Kakak Admin sedang memverifikasi jadwal dan menyiapkan tutor terbaik untukmu.
                </>
              )}
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2.5">
            {hasTutor && (
              <button
                type="button"
                onClick={onToggleTableReady}
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
            )}

            <button
              type="button"
              onClick={onOpenQuiz}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                isQuizPassed ? 'bg-[#3F5A46] hover:bg-[#284230]' : 'bg-[#C1683F] hover:bg-[#a95730]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isQuizPassed ? 'workspace_premium' : 'quiz'}
              </span>
              <span>{isQuizPassed ? 'Kuis Selesai (+50 XP)' : 'Kuis Cepat (+50 XP)'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Unassigned Tutor Alert State */}
      {!hasTutor && (
        <div className="p-5 rounded-2xl bg-[#EFC9AE]/30 border border-[#C1683F]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#C1683F]/20 text-[#C1683F] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">person_search</span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1c1c18]">Tutor terbaikmu sedang disiapkan oleh Admin</h4>
              <p className="text-xs text-[#6B675F] mt-0.5">
                Admin Bright Future sedang mencocokkan tutor terbaik sesuai lokasi rumah dan jadwalmu.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20Bright%20Future,%20saya%20ingin%20menanyakan%20status%20penugasan%20tutor%20les%20anak%20saya"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] inline-flex items-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">support_agent</span>
            <span>Hubungi Admin Bright Future</span>
          </a>
        </div>
      )}

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
              <span className="text-2xl font-extrabold text-[#284230]">{metrics.attendancePercentage}%</span>
              <span className="text-xs text-[#3F5A46] font-bold">
                {metrics.completedSessions}/{metrics.packageSessions} Sesi
              </span>
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
              <span className="text-2xl font-extrabold text-[#1c1c18]">{metrics.avgScore}</span>
              <span className="text-[10px] text-[#C1683F] font-bold px-1.5 py-0.5 rounded bg-[#EFC9AE]/60">
                {metrics.avgScore >= 85 ? 'Grade A' : metrics.avgScore >= 75 ? 'Grade B' : 'Grade C'}
              </span>
            </div>
            <span className="text-[11px] text-[#6B675F] block mt-0.5">Evaluasi Tatap Muka &amp; Kuis</span>
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
              <span className="text-2xl font-extrabold text-[#284230]">
                Level {Math.max(1, Math.floor(metrics.xpPoints / 250))}
              </span>
              <span className="text-xs font-bold text-[#C1683F]">{metrics.xpPoints} XP</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#e5e2dc] mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6F8F76] to-[#C1683F]"
                style={{ width: `${Math.min(100, (metrics.xpPoints % 250) / 2.5)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Section: Schedule & Tutor Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Schedule */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-xs border border-[rgba(42,40,35,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1c1c18]">Jadwal Kunjungan Terdekat</h3>
                <p className="text-xs text-[#6B675F] mt-0.5">Tatap Muka 70 Menit • Tutor Datang ke Rumah</p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#ebe8e2] text-[#424843]">
                {student.level} • {student.grade}
              </span>
            </div>

            {upcomingVisit ? (
              <div className="p-4 rounded-2xl bg-[#3F5A46] text-white flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase">Sesi</span>
                    <span className="text-base font-bold leading-none">
                      {metrics.completedSessions + 1}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {upcomingVisit.subject || 'Sesi Pembelajaran Interaktif'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-[#C1683F] text-white text-[10px] font-bold">
                        {upcomingVisit.status === 'berlangsung' ? 'Sedang Les' : 'Jadwal Sesi'}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 mt-0.5">
                      {upcomingVisit.time || '13:30 - 14:40 WIB'} • Bersama {upcomingVisit.tutorName || tutorName}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[24px] text-[#EFC9AE]">schedule</span>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#FAF7F1] text-center border border-dashed border-[rgba(42,40,35,0.15)]">
                <p className="text-xs text-[#6B675F]">
                  Belum ada jadwal kunjungan aktif pekan ini. Tutor akan mengonfirmasi jadwal melalui WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Tutor Note & LKPD Banner */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-3xl bg-[#FAF7F1] p-6 border border-[rgba(42,40,35,0.12)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px] text-[#C1683F]">chat</span>
              <h3 className="text-sm font-bold text-[#1c1c18]">Catatan Kak Tutor Terkini</h3>
            </div>
            {tutorNotes?.notes ? (
              <blockquote className="text-xs italic text-[#424843] leading-relaxed bg-white p-3.5 rounded-2xl border border-[rgba(42,40,35,0.06)]">
                &ldquo;{tutorNotes.notes}&rdquo;
                <div className="mt-2 text-[11px] font-bold text-[#284230] not-italic">
                  — {tutorNotes.tutorName || tutorName}
                </div>
              </blockquote>
            ) : (
              <p className="text-xs text-[#6B675F] bg-white p-3 rounded-2xl border border-[rgba(42,40,35,0.06)]">
                Catatan evaluasi belajar akan muncul di sini setelah Kak Tutor menyelesaikan sesi tatap muka pertamamu.
              </p>
            )}

            <button
              type="button"
              onClick={onOpenLkpd}
              className="w-full mt-4 py-2.5 rounded-xl bg-white text-[#284230] border border-[rgba(42,40,35,0.12)] hover:bg-[#f0eee8] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[17px] text-[#C1683F]">description</span>
              <span>Buka LKPD &amp; Modul Belajar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
