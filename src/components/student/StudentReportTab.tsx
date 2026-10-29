import React from 'react';
import { ManagedStudent } from '../admin/studentData';
import { FirestoreTutorVisitDoc } from '../../firebase';
import { StudentMetrics } from '../../utils/studentDataResolver';

interface StudentReportTabProps {
  student: ManagedStudent;
  visits: FirestoreTutorVisitDoc[];
  metrics: StudentMetrics;
}

export const StudentReportTab: React.FC<StudentReportTabProps> = ({
  student,
  visits,
  metrics,
}) => {
  const studentVisits = visits.filter(
    (v) =>
      v.studentName.toLowerCase() === (student.studentName || '').toLowerCase() &&
      v.status === 'selesai'
  );

  // Calculate average ratings
  const visitsWithFocus = studentVisits.filter((v) => typeof v.focusRating === 'number');
  const avgFocus = visitsWithFocus.length > 0
    ? (visitsWithFocus.reduce((acc, curr) => acc + (curr.focusRating || 0), 0) / visitsWithFocus.length).toFixed(1)
    : '4.8';

  const visitsWithIndep = studentVisits.filter((v) => typeof v.independenceRating === 'number');
  const avgIndep = visitsWithIndep.length > 0
    ? (visitsWithIndep.reduce((acc, curr) => acc + (curr.independenceRating || 0), 0) / visitsWithIndep.length).toFixed(1)
    : '4.7';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[rgba(42,40,35,0.08)]">
        <h2 className="text-xl font-bold text-[#284230]">Nilai &amp; Rapor Evaluasi Belajar</h2>
        <p className="text-xs text-[#6B675F] mt-0.5">
          Hasil evaluasi berkala, pemahaman konsep, serta catatan kualitatif langsung dari tutor pendamping.
        </p>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B675F] block">
            Rata-rata Nilai Akademik
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-[#284230]">{metrics.avgScore}</span>
            <span className="text-xs font-bold text-[#C1683F] bg-[#EFC9AE]/50 px-2 py-0.5 rounded-full">
              {metrics.avgScore >= 85 ? 'Grade A (Sangat Baik)' : 'Grade B (Baik)'}
            </span>
          </div>
          <span className="text-[11px] text-[#6B675F] block mt-1">
            Kombinasi LKPD, kuis pemahaman, dan latihan mandiri
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B675F] block">
            Fokus &amp; Konsentrasi
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-[#1c1c18]">{avgFocus}</span>
            <span className="text-xs text-amber-600 font-bold">/ 5.0 ★</span>
          </div>
          <span className="text-[11px] text-[#6B675F] block mt-1">
            Kemampuan menyimak dan konsistensi 70 menit
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B675F] block">
            Kemandirian Belajar
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-[#1c1c18]">{avgIndep}</span>
            <span className="text-xs text-amber-600 font-bold">/ 5.0 ★</span>
          </div>
          <span className="text-[11px] text-[#6B675F] block mt-1">
            Inisiatif mencoba soal sebelum bertanya
          </span>
        </div>
      </div>

      {/* Detailed Visit Reports */}
      <div>
        <h3 className="text-sm font-bold text-[#1c1c18] mb-3">Laporan Perkembangan per Sesi Kunjungan</h3>
        {studentVisits.length > 0 ? (
          <div className="space-y-4">
            {studentVisits.map((v, idx) => (
              <div
                key={v.id || idx}
                className="p-5 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(42,40,35,0.06)]">
                  <div>
                    <h4 className="text-sm font-bold text-[#1c1c18]">{v.subject}</h4>
                    <span className="text-xs text-[#6B675F]">
                      {v.time} • Tutor: <strong className="text-[#284230]">{v.tutorName}</strong>
                    </span>
                  </div>
                  {typeof v.score === 'number' && (
                    <div className="px-3 py-1 rounded-xl bg-[#c8ebce]/60 text-[#284230] text-xs font-bold w-fit">
                      Skor Sesi: {v.score} / 100
                    </div>
                  )}
                </div>

                {v.notes && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)]">
                    <span className="text-[11px] font-bold text-[#6B675F] uppercase tracking-wider block mb-1">
                      Catatan Evaluasi Tutor:
                    </span>
                    <p className="text-xs text-[#424843] leading-relaxed italic">&ldquo;{v.notes}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[#FAF7F1] text-center border border-dashed border-[rgba(42,40,35,0.12)]">
            <p className="text-xs text-[#6B675F]">
              Belum ada evaluasi nilai yang tercatat dari sesi selesai. Laporan nilai akan terisi otomatis setelah sesi les berlangsung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
