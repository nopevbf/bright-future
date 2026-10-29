import React from 'react';
import { ManagedStudent } from '../admin/studentData';
import { StudentMetrics } from '../../utils/studentDataResolver';

interface StudentClassesTabProps {
  student: ManagedStudent;
  metrics: StudentMetrics;
}

export const StudentClassesTab: React.FC<StudentClassesTabProps> = ({
  student,
  metrics,
}) => {
  const subjects = student.subjects && student.subjects.length > 0
    ? student.subjects
    : ['Matematika Dasar & Logika', 'Ilmu Pengetahuan Alam (IPAS)', 'Bahasa Inggris Kontekstual'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[rgba(42,40,35,0.08)]">
        <h2 className="text-xl font-bold text-[#284230]">Kelas &amp; Mata Pelajaran Bimbel</h2>
        <p className="text-xs text-[#6B675F] mt-0.5">
          Program paket bimbingan tatap muka di rumah disesuaikan dengan kurikulum sekolah {student.schoolOrigin}.
        </p>
      </div>

      {/* Package Card */}
      <div className="p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C1683F] bg-[#EFC9AE]/40 px-2.5 py-1 rounded-full">
              Paket Aktif: {student.level}
            </span>
            <h3 className="text-lg font-bold text-[#1c1c18] mt-1.5">{student.grade}</h3>
            <p className="text-xs text-[#6B675F]">{student.schoolOrigin}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-[#6B675F]">Progres Sesi Paket:</span>
            <div className="text-xl font-extrabold text-[#284230]">
              {metrics.completedSessions} / {metrics.packageSessions} Sesi
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-[#6B675F]">
            <span>Penyelesaian Kuota Belajar</span>
            <span>{metrics.attendancePercentage}% Selesai</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#f0eee8] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#3F5A46] transition-all duration-500"
              style={{ width: `${metrics.attendancePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div>
        <h3 className="text-sm font-bold text-[#1c1c18] mb-3">Mata Pelajaran yang Dipelajari</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subj, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white text-[#284230] flex items-center justify-center mb-3 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">menu_book</span>
                </div>
                <h4 className="text-sm font-bold text-[#1c1c18]">{subj}</h4>
                <p className="text-xs text-[#6B675F] mt-1">
                  Pendalaman konsep, eksperimen praktis, dan latihan soal terarah.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(42,40,35,0.08)] flex items-center justify-between text-[11px] font-semibold text-[#3F5A46]">
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Sesuai Kurikulum
                </span>
                <span className="text-[#C1683F]">Sesi Rutin</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
