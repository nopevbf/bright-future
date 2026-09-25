import React, { useState } from 'react';
import { ManagedStudent } from './studentData';

interface StudentDetailModalProps {
  student: ManagedStudent | null;
  onClose: () => void;
  onEdit: (student: ManagedStudent) => void;
  onAddSessions: (student: ManagedStudent) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onEdit,
  onAddSessions,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profil' | 'jadwal' | 'evaluasi'>('profil');

  if (!student) return null;

  const percentage = Math.min(
    100,
    Math.round((student.completedSessions / student.packageSessions) * 100)
  );
  const remaining = student.packageSessions - student.completedSessions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#2A2823]/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-[#f0eee8]/70 border-b border-[#2A2823]/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EFC9AE] text-[#6b2702] font-extrabold text-xl flex items-center justify-center shadow-xs">
              {student.studentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#284230]">
                  {student.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    student.status === 'aktif'
                      ? 'bg-[#c8ebce] text-[#284230]'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {student.status.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#2A2823] mt-0.5">
                {student.studentName}
              </h2>
              <p className="text-xs text-[#6B675F]">
                {student.grade} • {student.schoolOrigin}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white text-[#6B675F] hover:text-[#2A2823] hover:bg-[#ebe8e2] transition-all flex items-center justify-center cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex border-b border-[#2A2823]/10 bg-[#FAF7F1] px-6">
          <button
            onClick={() => setActiveSubTab('profil')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'profil'
                ? 'border-[#284230] text-[#284230]'
                : 'border-transparent text-[#6B675F] hover:text-[#2A2823]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>Profil &amp; Kontak Wali</span>
          </button>
          <button
            onClick={() => setActiveSubTab('jadwal')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'jadwal'
                ? 'border-[#284230] text-[#284230]'
                : 'border-transparent text-[#6B675F] hover:text-[#2A2823]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history_edu</span>
            <span>Riwayat Sesi Belajar ({student.completedSessions}/{student.packageSessions})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('evaluasi')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'evaluasi'
                ? 'border-[#284230] text-[#284230]'
                : 'border-transparent text-[#6B675F] hover:text-[#2A2823]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grade</span>
            <span>Rapor Evaluasi ({student.lastEvaluationScore || 90}/100)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* TAB 1: PROFIL & WALI */}
          {activeSubTab === 'profil' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#2A2823]/8 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#6B675F] tracking-wider block">
                    Data Siswa
                  </span>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[#6B675F] block text-[11px]">Nama Lengkap:</span>
                      <span className="font-bold text-[#2A2823]">{student.studentName}</span>
                    </div>
                    <div>
                      <span className="text-[#6B675F] block text-[11px]">Jenjang &amp; Kelas:</span>
                      <span className="font-semibold text-[#2A2823]">{student.grade} ({student.level})</span>
                    </div>
                    <div>
                      <span className="text-[#6B675F] block text-[11px]">Asal Sekolah:</span>
                      <span className="font-semibold text-[#2A2823]">{student.schoolOrigin}</span>
                    </div>
                    <div>
                      <span className="text-[#6B675F] block text-[11px]">Tanggal Bergabung:</span>
                      <span className="font-mono text-[#2A2823]">
                        {new Date(student.joinDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#2A2823]/8 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#6B675F] tracking-wider block">
                    Data Orang Tua / Wali
                  </span>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[#6B675F] block text-[11px]">Nama Wali Murid:</span>
                      <span className="font-bold text-[#2A2823]">
                        {student.parentName} ({student.parentRelation})
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B675F] block text-[11px]">Nomor WhatsApp:</span>
                      <a
                        href={`https://wa.me/${student.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#25D366] font-bold text-xs hover:underline"
                      >
                        <span className="material-symbols-outlined text-[14px]">chat</span>
                        <span>{student.whatsapp}</span>
                      </a>
                    </div>
                    <div>
                      <span className="text-[#6B675F] block text-[11px]">Wilayah Kecamatan:</span>
                      <span className="font-bold text-[#284230]">Kec. {student.district}, Kab. Magelang</span>
                    </div>
                    <div>
                      <span className="text-[#6B675F] block text-[11px]">Alamat Lengkap:</span>
                      <span className="font-semibold text-[#2A2823]">{student.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tutor & Learning Focus */}
              <div className="p-4 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs space-y-3">
                <span className="text-[10px] uppercase font-bold text-[#6B675F] tracking-wider block">
                  Penugasan Tutor &amp; Mata Pelajaran
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#c8ebce] text-[#284230] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">school</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2A2823] text-sm">{student.tutorName}</h4>
                      <p className="text-[11px] text-[#6B675F]">Tutor Privat Terakreditasi Bright Future</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#f0eee8] text-[#284230] font-bold text-[10px]">
                    Kunjungan Rumah (70 Menit)
                  </span>
                </div>

                <div className="pt-2 border-t border-[#2A2823]/8">
                  <span className="text-[11px] text-[#6B675F] block mb-1.5 font-semibold">
                    Fokus Mata Pelajaran:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {student.subjects.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF7F1] border border-[#2A2823]/10 font-bold text-[#284230] text-[11px]"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {student.notes && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    <span className="font-bold block mb-0.5">Catatan Khusus Belajar:</span>
                    {student.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT SESI */}
          {activeSubTab === 'jadwal' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#f0eee8]/50 border border-[#2A2823]/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#2A2823]">
                    Progres Paket Sesi Belajar
                  </h4>
                  <p className="text-[11px] text-[#6B675F]">
                    {student.completedSessions} dari {student.packageSessions} sesi telah terlaksana (sisa {remaining} sesi)
                  </p>
                </div>
                <button
                  onClick={() => onAddSessions(student)}
                  className="px-3 py-1.5 rounded-xl bg-[#284230] text-white font-bold text-xs hover:bg-[#3F5A46] cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                  <span>Tambah Sesi</span>
                </button>
              </div>

              {/* Progress visual */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#2A2823]">
                  <span>Pencapaian: {percentage}%</span>
                  <span>{remaining === 0 ? 'Paket Selesai' : `${remaining} Sesi Tersisa`}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#FAF7F1] border border-[#2A2823]/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      remaining === 0 ? 'bg-rose-500' : remaining <= 2 ? 'bg-amber-500' : 'bg-[#3F5A46]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Sessions breakdown list */}
              <div className="space-y-2 mt-3">
                {Array.from({ length: student.packageSessions }).map((_, idx) => {
                  const sessionNum = idx + 1;
                  const isDone = sessionNum <= student.completedSessions;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDone
                          ? 'bg-white border-[#2A2823]/10 shadow-xs'
                          : 'bg-[#FAF7F1]/60 border-dashed border-[#2A2823]/15 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isDone ? 'bg-[#c8ebce] text-[#284230]' : 'bg-[#FAF7F1] text-[#6B675F]'
                          }`}
                        >
                          {sessionNum}
                        </div>
                        <div>
                          <span className="font-bold text-[#2A2823] block">
                            Sesi Ke-{sessionNum} (70 Menit)
                          </span>
                          <span className="text-[10px] text-[#6B675F]">
                            {isDone
                              ? 'Presensi GPS Valid • Selesai Tatap Muka'
                              : 'Menunggu Jadwal Penugasan'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDone
                            ? 'bg-[#c8ebce] text-[#284230]'
                            : 'bg-[#FAF7F1] text-[#6B675F] border border-[#2A2823]/10'
                        }`}
                      >
                        {isDone ? 'SELESAI' : 'TERJADWAL'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EVALUASI & NILAI */}
          {activeSubTab === 'evaluasi' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B675F] tracking-wider block">
                    Indeks Pemahaman Belajar
                  </span>
                  <div className="text-3xl font-extrabold text-[#284230] mt-1">
                    {student.lastEvaluationScore || 90}
                    <span className="text-base text-[#6B675F] font-normal">/100</span>
                  </div>
                  <span className="text-[11px] text-[#284230] font-semibold">
                    Kategori: Sangat Baik (Kurikulum Merdeka 2026)
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#c8ebce] text-[#284230] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">military_tech</span>
                </div>
              </div>

              {/* Dimension Metrics */}
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#2A2823]">Pemahaman Konsep Kognitif:</span>
                    <span className="font-bold text-[#284230]">92%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF7F1] overflow-hidden border border-[#2A2823]/10">
                    <div className="h-full bg-[#3F5A46] rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#2A2823]">Keaktifan &amp; Antusiasme:</span>
                    <span className="font-bold text-[#284230]">95%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF7F1] overflow-hidden border border-[#2A2823]/10">
                    <div className="h-full bg-[#3F5A46] rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#2A2823]">Ketuntasan Lembar Kerja (LKPD):</span>
                    <span className="font-bold text-[#284230]">88%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF7F1] overflow-hidden border border-[#2A2823]/10">
                    <div className="h-full bg-[#3F5A46] rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/8 space-y-1">
                <span className="font-bold text-[#2A2823] block text-xs">
                  Catatan Guru Pembimbing ({student.tutorName}):
                </span>
                <p className="text-[11px] text-[#6B675F] leading-relaxed">
                  {student.notes ||
                    'Ananda menunjukkan pemahaman yang sangat memuaskan pada setiap sesi kunjungan rumah, mengerjakan soal LKPD secara mandiri, dan berani mengemukakan pertanyaan.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#f0eee8]/70 border-t border-[#2A2823]/10 flex items-center justify-between gap-3">
          <button
            onClick={() => onEdit(student)}
            className="px-4 py-2 rounded-xl bg-white border border-[#2A2823]/15 text-[#2A2823] font-bold text-xs hover:bg-[#FAF7F1] cursor-pointer inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Edit Data</span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${student.whatsapp.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(
                student.parentName
              )}%2C%20kami%20dari%20Bright%20Future%20Learning%20Center%20Kabupaten%20Magelang.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-emerald-600 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Chat Wali (WA)</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#284230] text-white font-bold text-xs hover:bg-[#3F5A46] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
