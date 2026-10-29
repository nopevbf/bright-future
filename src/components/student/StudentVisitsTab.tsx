import React, { useState } from 'react';
import { ManagedStudent } from '../admin/studentData';
import { FirestoreTutorVisitDoc } from '../../firebase';

interface StudentVisitsTabProps {
  student: ManagedStudent;
  tutorName: string;
  visits: FirestoreTutorVisitDoc[];
}

export const StudentVisitsTab: React.FC<StudentVisitsTabProps> = ({
  student,
  tutorName,
  visits,
}) => {
  const [filter, setFilter] = useState<'semua' | 'akan_datang' | 'selesai'>('semua');

  const sName = (student?.studentName || '').trim().toLowerCase();
  const studentVisits = Array.isArray(visits)
    ? visits.filter(
        (v) =>
          Boolean(v) &&
          sName &&
          (v.studentName || '').trim().toLowerCase() === sName
      )
    : [];

  const filteredVisits = studentVisits.filter((v) => {
    if (filter === 'akan_datang') {
      return v.status === 'berlangsung' || v.status === 'berikutnya' || v.status === 'antre';
    }
    if (filter === 'selesai') {
      return v.status === 'selesai';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(42,40,35,0.08)]">
        <div>
          <h2 className="text-xl font-bold text-[#284230]">Jadwal &amp; Kunjungan Tutor</h2>
          <p className="text-xs text-[#6B675F] mt-0.5">
            Sesi les tatap muka 70 menit langsung di rumah oleh Kak {tutorName || 'Tutor'}.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#FAF7F1] p-1 rounded-2xl border border-[rgba(42,40,35,0.08)]">
          {(['semua', 'akan_datang', 'selesai'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === mode
                  ? 'bg-[#3F5A46] text-white shadow-xs'
                  : 'text-[#6B675F] hover:text-[#1c1c18]'
              }`}
            >
              {mode === 'semua' ? 'Semua Sesi' : mode === 'akan_datang' ? 'Akan Datang' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      {/* Visits List */}
      {filteredVisits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVisits.map((visit) => {
            const isCompleted = visit.status === 'selesai';
            const isActive = visit.status === 'berlangsung';

            return (
              <div
                key={visit.id}
                className={`p-5 rounded-3xl border transition-all ${
                  isActive
                    ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                    : isCompleted
                    ? 'bg-white border-[rgba(42,40,35,0.08)]'
                    : 'bg-[#FAF7F1] border-[rgba(42,40,35,0.12)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                        isActive
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : isCompleted
                          ? 'bg-[#c8ebce] text-[#284230]'
                          : 'bg-[#EFC9AE]/60 text-[#C1683F]'
                      }`}
                    >
                      {isActive ? 'Sedang Berlangsung' : isCompleted ? 'Selesai' : 'Terjadwal'}
                    </span>
                    <h3 className="text-sm font-bold text-[#1c1c18]">{visit.subject || 'Sesi Pembelajaran'}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#284230] block">{visit.time}</span>
                    <span className="text-[10px] text-[#6B675F]">70 Menit Tatap Muka</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#6B675F] mb-3">
                  <span className="material-symbols-outlined text-[16px] text-[#C1683F]">person</span>
                  <span>Tutor: {visit.tutorName || tutorName}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#6B675F]">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span className="truncate">{visit.address || student.address}</span>
                </div>

                {isCompleted && typeof visit.score === 'number' && (
                  <div className="mt-3 pt-3 border-t border-[rgba(42,40,35,0.08)] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#6B675F]">Nilai Sesi:</span>
                    <span className="font-bold text-[#284230]">{visit.score} / 100</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-[#FAF7F1] text-center border border-dashed border-[rgba(42,40,35,0.12)]">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#C1683F] mx-auto flex items-center justify-center mb-3 shadow-xs">
            <span className="material-symbols-outlined text-[24px]">calendar_today</span>
          </div>
          <h4 className="text-sm font-bold text-[#1c1c18]">Belum Ada Sesi pada Kategori Ini</h4>
          <p className="text-xs text-[#6B675F] max-w-md mx-auto mt-1 mb-4">
            Jadwal kunjungan tatap muka disesuaikan dengan kesepakatan waktu antara wali murid dan tutor pengampu.
          </p>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20Bright%20Future,%20saya%20ingin%20mengajukan%20jadwal%20ulang%20atau%20konfirmasi%20sesi%20les"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46]"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>Konfirmasi Jadwal via WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
};
