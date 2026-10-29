import React, { useState } from 'react';
import { ManagedStudent } from '../admin/studentData';
import {
  getStudentCustomProfile,
  saveStudentCustomProfile,
  StudentCustomProfile,
} from '../../utils/studentDataResolver';

interface StudentProfileTabProps {
  student: ManagedStudent;
  tutorName: string;
}

const AVATAR_OPTIONS = [
  { id: 'rocket', emoji: '🚀', label: 'Penjelajah Antariksa' },
  { id: 'scientist', emoji: '🔬', label: 'Ilmuwan Sains' },
  { id: 'math', emoji: '📐', label: 'Master Matematika' },
  { id: 'book', emoji: '📚', label: 'Pustakawan Cilik' },
  { id: 'star', emoji: '⭐', label: 'Bintang Juara' },
  { id: 'artist', emoji: '🎨', label: 'Seniman Kreatif' },
];

export const StudentProfileTab: React.FC<StudentProfileTabProps> = ({
  student,
  tutorName,
}) => {
  const [customProfile, setCustomProfile] = useState<StudentCustomProfile>(() =>
    getStudentCustomProfile(student.id)
  );

  const [dream, setDream] = useState(customProfile.dream || 'Ilmuwan Sains & Robotika');
  const [hobby, setHobby] = useState(customProfile.hobby || 'Membaca Ensiklopedia & Eksperimen Sains');
  const [selectedAvatar, setSelectedAvatar] = useState(customProfile.avatarUrl || 'rocket');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStudentCustomProfile(student.id, {
      dream,
      hobby,
      avatarUrl: selectedAvatar,
    });
    setCustomProfile({
      dream,
      hobby,
      avatarUrl: selectedAvatar,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const remainingSessions = Math.max(0, (student.packageSessions || 8) - (student.completedSessions || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[rgba(42,40,35,0.08)]">
        <h2 className="text-xl font-bold text-[#284230]">Profil &amp; Identitas Siswa</h2>
        <p className="text-xs text-[#6B675F] mt-0.5">
          Data pendaftaran resmi Bright Future dan kustomisasi profil belajarmu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Official Protected Profile */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[rgba(42,40,35,0.08)] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#284230] text-white flex items-center justify-center text-xl shadow-xs">
                {AVATAR_OPTIONS.find((a) => a.id === selectedAvatar)?.emoji || '🚀'}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1c1c18]">{student.studentName}</h3>
                <span className="text-xs text-[#6B675F] font-mono font-semibold">{student.id}</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#c8ebce]/60 text-[#284230] text-xs font-bold">
              {student.status === 'aktif' ? 'Siswa Aktif' : 'Perlu Perpanjang'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)]">
              <span className="text-[10px] font-bold text-[#6B675F] uppercase tracking-wider block">
                Jenjang &amp; Tingkat
              </span>
              <span className="font-bold text-[#1c1c18] mt-0.5 block">{student.grade || student.level}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)]">
              <span className="text-[10px] font-bold text-[#6B675F] uppercase tracking-wider block">
                Sekolah Asal
              </span>
              <span className="font-bold text-[#1c1c18] mt-0.5 block">{student.schoolOrigin || '-'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)]">
              <span className="text-[10px] font-bold text-[#6B675F] uppercase tracking-wider block">
                Tutor Pengampu
              </span>
              <span className="font-bold text-[#284230] mt-0.5 block">{tutorName || student.tutorName || 'Dalam Penugasan'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)]">
              <span className="text-[10px] font-bold text-[#6B675F] uppercase tracking-wider block">
                Sisa Kuota Sesi
              </span>
              <span className="font-bold text-[#C1683F] mt-0.5 block">
                {remainingSessions} Sesi Lagi (Dari {student.packageSessions || 8} Sesi)
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)] sm:col-span-2">
              <span className="text-[10px] font-bold text-[#6B675F] uppercase tracking-wider block">
                Alamat Kunjungan Rumah
              </span>
              <span className="font-semibold text-[#1c1c18] mt-0.5 block">
                {student.address} ({student.district || 'Magelang'})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0">lock</span>
            <span>
              Data identitas resmi dan paket bimbel dilindungi. Hubungi Admin jika ingin mengubah jadwal/alamat.
            </span>
          </div>
        </div>

        {/* Right Column (5 cols): Editable Personal Preferences */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[rgba(42,40,35,0.08)] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#1c1c18]">Kustomisasi Profil Siswa</h3>
            <p className="text-xs text-[#6B675F] mt-0.5">
              Pilih avatar dan ceritakan cita-citamu agar Kak Tutor semakin mengenalmu!
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar Picker */}
            <div>
              <label className="text-xs font-bold text-[#1c1c18] block mb-2">Pilih Avatar Favorit</label>
              <div className="grid grid-cols-3 gap-2">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setSelectedAvatar(opt.id)}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedAvatar === opt.id
                        ? 'bg-[#c8ebce]/40 border-[#284230] ring-2 ring-[#284230]/20'
                        : 'bg-[#FAF7F1] border-[rgba(42,40,35,0.08)] hover:bg-[#f0eee8]'
                    }`}
                  >
                    <span className="text-2xl block">{opt.emoji}</span>
                    <span className="text-[10px] font-bold text-[#284230] mt-1 block truncate">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dream Field */}
            <div>
              <label className="text-xs font-bold text-[#1c1c18] block mb-1">Cita-Cita Masa Depan</label>
              <input
                type="text"
                value={dream}
                onChange={(e) => setDream(e.target.value)}
                placeholder="Contoh: Dokter, Arsitek, Insinyur AI"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(42,40,35,0.15)] text-xs text-[#1c1c18] focus:outline-hidden focus:border-[#284230]"
              />
            </div>

            {/* Hobby Field */}
            <div>
              <label className="text-xs font-bold text-[#1c1c18] block mb-1">Hobi &amp; Minat Belajar</label>
              <input
                type="text"
                value={hobby}
                onChange={(e) => setHobby(e.target.value)}
                placeholder="Contoh: Merakit Robot, Menggambar Komik"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(42,40,35,0.15)] text-xs text-[#1c1c18] focus:outline-hidden focus:border-[#284230]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Simpan Profil Belajarku</span>
            </button>

            {isSaved && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
                ✨ Profil belajarmu berhasil diperbarui!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
