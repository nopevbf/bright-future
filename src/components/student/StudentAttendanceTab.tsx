import React from 'react';
import { ManagedStudent } from '../admin/studentData';
import { FirestoreTutorVisitDoc } from '../../firebase';
import { StudentMetrics } from '../../utils/studentDataResolver';

interface StudentAttendanceTabProps {
  student: ManagedStudent;
  visits: FirestoreTutorVisitDoc[];
  metrics: StudentMetrics;
}

export const StudentAttendanceTab: React.FC<StudentAttendanceTabProps> = ({
  student,
  visits,
  metrics,
}) => {
  const studentVisits = visits.filter(
    (v) =>
      v.studentName.toLowerCase() === (student.studentName || '').toLowerCase()
  );

  const completedVisits = studentVisits.filter((v) => v.status === 'selesai');
  const activeVisit = studentVisits.find((v) => v.status === 'berlangsung');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[rgba(42,40,35,0.08)]">
        <h2 className="text-xl font-bold text-[#284230]">Presensi &amp; Sesi Belajar 70 Menit</h2>
        <p className="text-xs text-[#6B675F] mt-0.5">
          Verifikasi kehadiran tatap muka intensif, disiplin fokus, dan bebas gawai bersama tutor pendamping.
        </p>
      </div>

      {/* Active Session Notification */}
      {activeVisit && (
        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <span className="material-symbols-outlined text-[26px]">timer</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Sesi Sedang Berlangsung Sekarang
              </span>
              <h3 className="text-sm font-bold text-[#1c1c18] mt-1">{activeVisit.subject}</h3>
              <p className="text-xs text-[#424843]">
                Bersama {activeVisit.tutorName} • Berjalan {activeVisit.elapsedMinutes || 0} dari 70 Menit
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-emerald-800">
              Sisa Waktu: {Math.max(0, 70 - (activeVisit.elapsedMinutes || 0))} Menit
            </span>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#6B675F] tracking-wider block">
            Total Sesi Selesai
          </span>
          <div className="text-2xl font-extrabold text-[#284230] mt-1">
            {metrics.completedSessions} Sesi
          </div>
          <span className="text-[11px] text-[#6B675F]">Dari kuota {metrics.packageSessions} sesi paket</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#6B675F] tracking-wider block">
            Akumulasi Menit Belajar
          </span>
          <div className="text-2xl font-extrabold text-[#C1683F] mt-1">
            {metrics.completedSessions * 70} Menit
          </div>
          <span className="text-[11px] text-[#6B675F]">Standar 70 menit tatap muka rumah</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#6B675F] tracking-wider block">
            Disiplin &amp; Integritas
          </span>
          <div className="text-2xl font-extrabold text-[#284230] mt-1">
            100%
          </div>
          <span className="text-[11px] text-[#6B675F]">Terverifikasi GPS &amp; Foto Kunjungan</span>
        </div>
      </div>

      {/* Attendance History */}
      <div>
        <h3 className="text-sm font-bold text-[#1c1c18] mb-3">Riwayat Presensi Tatap Muka</h3>
        {completedVisits.length > 0 ? (
          <div className="bg-white rounded-3xl border border-[rgba(42,40,35,0.08)] overflow-hidden shadow-xs">
            <div className="divide-y divide-[rgba(42,40,35,0.06)]">
              {completedVisits.map((v, idx) => (
                <div key={v.id || idx} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#c8ebce]/60 text-[#284230] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1c1c18]">{v.subject}</h4>
                      <p className="text-[11px] text-[#6B675F] mt-0.5">
                        {v.time} • Tutor: {v.tutorName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#284230] block">
                      {v.durationMinutes || 70} Menit
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                      Hadir Penuh
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[#FAF7F1] text-center border border-dashed border-[rgba(42,40,35,0.12)]">
            <p className="text-xs text-[#6B675F]">
              Belum ada riwayat presensi yang tersimpan. Presensi akan otomatis tercatat ketika Kak Tutor melakukan check-in dan check-out sesi belajar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
