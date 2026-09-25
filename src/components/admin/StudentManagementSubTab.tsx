import React, { useState } from 'react';
import { ManagedStudent, MAGELANG_DISTRICTS } from './studentData';

interface StudentManagementSubTabProps {
  students: ManagedStudent[];
  onAddStudent: () => void;
  onEditStudent: (student: ManagedStudent) => void;
  onViewProfile: (student: ManagedStudent) => void;
  onAddSessions: (student: ManagedStudent) => void;
  onDeleteStudent: (id: string) => void;
  onExportData: (format: 'excel' | 'csv' | 'pdf') => void;
}

export const StudentManagementSubTab: React.FC<StudentManagementSubTabProps> = ({
  students,
  onAddStudent,
  onEditStudent,
  onViewProfile,
  onAddSessions,
  onDeleteStudent,
  onExportData,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('Semua Wilayah Magelang');
  const [levelFilter, setLevelFilter] = useState<string>('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'perlu_perpanjang' | 'cuti'>('semua');

  // Computed metrics
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'aktif');
  const renewalStudents = students.filter(
    (s) => s.status === 'perlu_perpanjang' || s.packageSessions - s.completedSessions <= 2
  );
  const uniqueDistricts = Array.from(new Set(students.map((s) => s.district)));

  // Filtered list
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.schoolOrigin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.whatsapp.includes(searchQuery) ||
      student.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.tutorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDistrict =
      districtFilter === 'Semua Wilayah Magelang'
        ? true
        : student.district.toLowerCase() === districtFilter.toLowerCase();

    const matchesLevel =
      levelFilter === 'semua'
        ? true
        : student.level.toLowerCase().includes(levelFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'semua' ? true : student.status === statusFilter;

    return matchesSearch && matchesDistrict && matchesLevel && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2A2823]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3F5A46]"></span>
            <span className="text-xs uppercase tracking-wider font-bold text-[#6B675F]">
              Master Database Siswa &amp; Wali
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A2823] mt-1">
            Sub Menu: Manajemen Siswa &amp; Wali
          </h2>
          <p className="text-xs sm:text-sm text-[#6B675F]">
            Pusat data induk murid aktif, profil wali murid, wilayah jelajah Magelang, serta progress paket belajar privat.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Dropdown */}
          <div className="flex items-center rounded-xl bg-white border border-[#2A2823]/10 shadow-xs p-1">
            <span className="text-[11px] font-bold text-[#6B675F] px-2">Ekspor:</span>
            <button
              onClick={() => onExportData('excel')}
              className="px-2 py-1 rounded-lg text-xs font-bold text-[#284230] hover:bg-[#FAF7F1] cursor-pointer"
            >
              Excel
            </button>
            <button
              onClick={() => onExportData('csv')}
              className="px-2 py-1 rounded-lg text-xs font-bold text-[#284230] hover:bg-[#FAF7F1] cursor-pointer"
            >
              CSV
            </button>
            <button
              onClick={() => onExportData('pdf')}
              className="px-2 py-1 rounded-lg text-xs font-bold text-[#284230] hover:bg-[#FAF7F1] cursor-pointer"
            >
              PDF
            </button>
          </div>

          {/* Add Student Button */}
          <button
            onClick={onAddStudent}
            className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold shadow-xs hover:bg-[#3F5A46] cursor-pointer inline-flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">person_add</span>
            <span>+ Tambah Siswa &amp; Wali</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa Aktif */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B675F]">
              Total Siswa Terdaftar
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#284230]">
              {totalStudents}
            </div>
            <span className="text-[11px] text-[#6B675F] block">{activeStudents.length} siswa status aktif</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#c8ebce] text-[#284230] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
        </div>

        {/* Wali Murid Terhubung */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B675F]">
              Wali Terhubung (WA)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2A2823]">
              {totalStudents}
            </div>
            <span className="text-[11px] text-[#25D366] font-semibold block">100% WhatsApp Valid</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#f0eee8] text-[#284230] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">family_restroom</span>
          </div>
        </div>

        {/* Kecamatan Terlayani */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B675F]">
              Kecamatan Magelang
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#3F5A46]">
              {uniqueDistricts.length}
            </div>
            <span className="text-[11px] text-[#6B675F] block">Secang, Muntilan, Mungkid, dll</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EFC9AE]/60 text-[#6b2702] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">location_on</span>
          </div>
        </div>

        {/* Perlu Perpanjangan */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Perlu Perpanjangan
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-center gap-2">
              <span>{renewalStudents.length}</span>
              {renewalStudents.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  Sisa &le; 2 Sesi
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#6B675F] block">Siapkan invoice SPP baru</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">notification_important</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#6B675F] text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari siswa, NIS, nama wali, sekolah, alamat, atau nama tutor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/10 text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-[#6B675F] hover:text-[#2A2823] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Jenjang Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#6B675F] font-semibold shrink-0">Jenjang:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/10 text-xs font-semibold text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
              >
                <option value="semua">Semua Jenjang</option>
                <option value="calistung">Calistung</option>
                <option value="sd">SD UMUM</option>
                <option value="smp">SMP</option>
                <option value="sma">SMA UTBK</option>
              </select>
            </div>

            {/* District Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#6B675F] font-semibold shrink-0">Wilayah:</span>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/10 text-xs font-semibold text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
              >
                {MAGELANG_DISTRICTS.map((dist, idx) => (
                  <option key={idx} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Segmented Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2A2823]/8 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'semua'
                  ? 'bg-[#284230] text-white shadow-xs'
                  : 'bg-[#f0eee8] text-[#6B675F] hover:bg-[#ebe8e2] hover:text-[#2A2823]'
              }`}
            >
              Semua ({totalStudents})
            </button>
            <button
              onClick={() => setStatusFilter('aktif')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'aktif'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Aktif Belajar ({activeStudents.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('perlu_perpanjang')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'perlu_perpanjang'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Perlu Perpanjangan ({renewalStudents.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('cuti')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'cuti'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Cuti / Selesai
            </button>
          </div>

          <span className="text-[11px] text-[#6B675F]">
            Menampilkan <span className="font-bold text-[#2A2823]">{filteredStudents.length}</span> dari {totalStudents} siswa
          </span>
        </div>
      </div>

      {/* Master Students Table */}
      <div className="bg-white rounded-3xl border border-[#2A2823]/10 shadow-sm overflow-hidden">
        <div className="p-4 bg-[#f0eee8]/50 border-b border-[#2A2823]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3F5A46]"></span>
            <h3 className="font-bold text-sm text-[#2A2823]">
              Daftar Induk Siswa &amp; Profil Wali Terdaftar
            </h3>
          </div>
          <span className="text-xs text-[#6B675F]">
            Klik pada baris atau tombol aksi untuk melihat profil akademik dan evaluasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F1] text-[#6B675F] uppercase font-bold text-[10px] border-b border-[#2A2823]/10">
              <tr>
                <th className="py-3 px-4">Siswa &amp; NIS</th>
                <th className="py-3 px-4">Jenjang &amp; Sekolah</th>
                <th className="py-3 px-4">Wali Murid &amp; Kontak</th>
                <th className="py-3 px-4">Domisili (Kab. Magelang)</th>
                <th className="py-3 px-4">Tutor &amp; Mapel</th>
                <th className="py-3 px-4">Progres Sesi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2823]/8">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#6B675F]">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <span className="material-symbols-outlined text-[36px] text-[#6B675F]/50">
                        search_off
                      </span>
                      <p className="font-bold text-[#2A2823]">Tidak ada siswa yang sesuai kriteria</p>
                      <p className="text-[11px] text-[#6B675F]">
                        Cobalah ubah filter pencarian, wilayah kecamatan, atau status. Anda juga dapat menambahkan data siswa baru secara manual.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const percentage = Math.min(
                    100,
                    Math.round((student.completedSessions / student.packageSessions) * 100)
                  );
                  const remaining = student.packageSessions - student.completedSessions;
                  const isLowSessions = remaining <= 2;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#FAF7F1]/80 transition-colors"
                    >
                      {/* Student & NIS */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EFC9AE] text-[#6b2702] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {student.studentName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#2A2823] text-xs sm:text-sm">
                              {student.studentName}
                            </div>
                            <div className="text-[10px] text-[#6B675F] font-mono">
                              {student.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Level & School */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2A2823]">{student.grade}</div>
                        <div className="text-[11px] text-[#6B675F] truncate max-w-[140px]" title={student.schoolOrigin}>
                          {student.schoolOrigin}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-[#f0eee8] text-[#284230] font-bold text-[9px] uppercase">
                          {student.level}
                        </span>
                      </td>

                      {/* Parent & WA */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2A2823]">
                          {student.parentName}{' '}
                          <span className="text-[10px] text-[#6B675F] font-normal">
                            ({student.parentRelation})
                          </span>
                        </div>
                        <a
                          href={`https://wa.me/${student.whatsapp.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(
                            student.parentName
                          )}%2C%20kami%20dari%20Bright%20Future%20Learning%20Center%20Kabupaten%20Magelang.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#25D366] font-bold hover:underline mt-0.5"
                        >
                          <span className="material-symbols-outlined text-[13px]">chat</span>
                          <span>{student.whatsapp}</span>
                        </a>
                      </td>

                      {/* Address & District */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="inline-block px-1.5 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold mb-1">
                          Kec. {student.district}
                        </span>
                        <p className="text-[11px] text-[#6B675F] line-clamp-1" title={student.address}>
                          {student.address}
                        </p>
                      </td>

                      {/* Tutor & Subjects */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#284230]">{student.tutorName}</div>
                        <div className="text-[10px] text-[#6B675F] truncate max-w-[140px]" title={student.subjects.join(', ')}>
                          {student.subjects.join(', ')}
                        </div>
                      </td>

                      {/* Sessions Progress */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-[#2A2823]">
                            {student.completedSessions}/{student.packageSessions} Sesi
                          </span>
                          <span className={`font-semibold ${isLowSessions ? 'text-amber-800' : 'text-[#6B675F]'}`}>
                            {remaining === 0 ? 'Habis' : `Sisa ${remaining}`}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#FAF7F1] border border-[#2A2823]/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              remaining === 0
                                ? 'bg-rose-500'
                                : isLowSessions
                                ? 'bg-amber-500'
                                : 'bg-[#3F5A46]'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            student.status === 'aktif'
                              ? 'bg-[#c8ebce] text-[#284230]'
                              : student.status === 'perlu_perpanjang'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {student.status === 'aktif'
                              ? 'check_circle'
                              : student.status === 'perlu_perpanjang'
                              ? 'warning'
                              : 'pause_circle'}
                          </span>
                          <span>
                            {student.status === 'aktif'
                              ? 'AKTIF'
                              : student.status === 'perlu_perpanjang'
                              ? 'PERPANJANG'
                              : 'CUTI'}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => onViewProfile(student)}
                            className="p-1.5 rounded-lg bg-[#f0eee8] text-[#2A2823] hover:bg-[#ebe8e2] cursor-pointer transition-all"
                            title="Lihat Profil & Rapor Akademik"
                          >
                            <span className="material-symbols-outlined text-[16px]">person</span>
                          </button>

                          {/* Edit Student */}
                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1.5 rounded-lg bg-white border border-[#2A2823]/15 text-[#284230] hover:bg-[#FAF7F1] cursor-pointer transition-all"
                            title="Edit Data Siswa & Wali"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>

                          {/* Add Sessions */}
                          <button
                            onClick={() => onAddSessions(student)}
                            className="p-1.5 rounded-lg bg-[#EFC9AE]/70 text-[#6b2702] hover:bg-[#EFC9AE] cursor-pointer transition-all"
                            title="Tambah Sesi / Perpanjang SPP"
                          >
                            <span className="material-symbols-outlined text-[16px]">add_circle</span>
                          </button>

                          {/* WhatsApp Parent */}
                          <a
                            href={`https://wa.me/${student.whatsapp.replace(/[^0-9]/g, '')}?text=Halo%20Bapak%2FIbu%20${encodeURIComponent(
                              student.parentName
                            )}%2C%20kami%20dari%20Bright%20Future%20Learning%20Center%20Magelang%20ingin%20menginformasikan%20jadwal%20dan%20perkembangan%20belajar%20Ananda%20${encodeURIComponent(
                              student.studentName
                            )}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366] text-white hover:bg-emerald-600 cursor-pointer transition-all"
                            title="Hubungi Wali via WhatsApp"
                          >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                          </a>

                          {/* Delete Student */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus data siswa ${student.studentName} (${student.id})?`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer transition-all"
                            title="Hapus Data Siswa"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
