import React, { useState, useEffect } from 'react';
import {
  ManagedStudent,
  MAGELANG_DISTRICTS,
  AVAILABLE_TUTORS,
} from './studentData';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: ManagedStudent) => void;
  initialData?: ManagedStudent | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [studentName, setStudentName] = useState('');
  const [level, setLevel] = useState('SD UMUM');
  const [grade, setGrade] = useState('Kelas 4 SD');
  const [schoolOrigin, setSchoolOrigin] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentRelation, setParentRelation] = useState<'Ibu' | 'Ayah' | 'Wali'>('Ibu');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Secang');
  const [tutorName, setTutorName] = useState('Kak Anindya, S.Pd.');
  const [subjectsText, setSubjectsText] = useState('Matematika, Tematik');
  const [packageSessions, setPackageSessions] = useState(8);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [status, setStatus] = useState<'aktif' | 'perlu_perpanjang' | 'cuti'>('aktif');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setStudentName(initialData.studentName);
      setLevel(initialData.level);
      setGrade(initialData.grade);
      setSchoolOrigin(initialData.schoolOrigin);
      setParentName(initialData.parentName);
      setParentRelation(initialData.parentRelation);
      setWhatsapp(initialData.whatsapp);
      setAddress(initialData.address);
      setDistrict(initialData.district);
      setTutorName(initialData.tutorName);
      setSubjectsText(initialData.subjects.join(', '));
      setPackageSessions(initialData.packageSessions);
      setCompletedSessions(initialData.completedSessions);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
    } else {
      setStudentName('');
      setLevel('SD UMUM');
      setGrade('Kelas 4 SD');
      setSchoolOrigin('');
      setParentName('');
      setParentRelation('Ibu');
      setWhatsapp('');
      setAddress('');
      setDistrict('Secang');
      setTutorName('Kak Anindya, S.Pd.');
      setSubjectsText('Matematika, Tematik');
      setPackageSessions(8);
      setCompletedSessions(0);
      setStatus('aktif');
      setNotes('');
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMessage('Nama siswa wajib diisi.');
      return;
    }
    if (!parentName.trim()) {
      setErrorMessage('Nama orang tua / wali wajib diisi.');
      return;
    }
    if (!whatsapp.trim() || whatsapp.length < 9) {
      setErrorMessage('Nomor WhatsApp tidak valid (minimal 9 digit).');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Alamat kunjungan wajib diisi.');
      return;
    }

    const cleanSubjects = subjectsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const generatedId =
      initialData?.id ||
      `BF-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const savedStudent: ManagedStudent = {
      id: generatedId,
      studentName: studentName.trim(),
      level,
      grade: grade.trim() || 'SD',
      schoolOrigin: schoolOrigin.trim() || 'Kabupaten Magelang',
      parentName: parentName.trim(),
      parentRelation,
      whatsapp: whatsapp.trim(),
      address: address.trim(),
      district,
      tutorName,
      subjects: cleanSubjects.length > 0 ? cleanSubjects : ['Tematik & Matematika'],
      packageSessions: Number(packageSessions) || 8,
      completedSessions: Number(completedSessions) || 0,
      status,
      joinDate: initialData?.joinDate || new Date().toISOString().split('T')[0],
      lastEvaluationScore: initialData?.lastEvaluationScore || 90,
      notes: notes.trim(),
    };

    onSave(savedStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#2A2823]/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-[#f0eee8]/70 border-b border-[#2A2823]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#284230] text-[24px]">
              {initialData ? 'edit_note' : 'person_add'}
            </span>
            <div>
              <h3 className="font-bold text-base text-[#2A2823]">
                {initialData ? 'Edit Data Siswa & Wali' : 'Tambah Siswa & Wali Baru'}
              </h3>
              <p className="text-[11px] text-[#6B675F]">
                Lengkapi biodata siswa, wali, domisili, dan paket belajar di Kab. Magelang
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Data Siswa */}
          <div className="space-y-3">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#6B675F]">
              1. Identitas Siswa
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  placeholder="Contoh: Kevin Pratama"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Jenjang Belajar</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
                >
                  <option value="Calistung">Calistung (TK / Transisi SD)</option>
                  <option value="SD UMUM">SD UMUM (Kelas 1 - 6)</option>
                  <option value="SMP">SMP (Kelas 7 - 9)</option>
                  <option value="SMA UTBK">SMA UTBK (Kelas 10 - 12)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Tingkat / Kelas</label>
                <input
                  type="text"
                  placeholder="Contoh: Kelas 4 SD"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Asal Sekolah</label>
                <input
                  type="text"
                  placeholder="Contoh: SD Tarakanita Magelang"
                  value={schoolOrigin}
                  onChange={(e) => setSchoolOrigin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data Orang Tua / Wali */}
          <div className="space-y-3 pt-3 border-t border-[#2A2823]/10">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#6B675F]">
              2. Data Orang Tua / Wali
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-[#2A2823] mb-1">Nama Orang Tua / Wali *</label>
                <input
                  type="text"
                  placeholder="Contoh: Ibu Deasy Kurnia"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Hubungan</label>
                <select
                  value={parentRelation}
                  onChange={(e) => setParentRelation(e.target.value as 'Ibu' | 'Ayah' | 'Wali')}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
                >
                  <option value="Ibu">Ibu Kandung</option>
                  <option value="Ayah">Ayah Kandung</option>
                  <option value="Wali">Wali / Kerabat</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[#2A2823] mb-1">Nomor WhatsApp Aktif *</label>
                <input
                  type="text"
                  placeholder="Contoh: 085173230198"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Kecamatan (Kab. Magelang)</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
                >
                  {MAGELANG_DISTRICTS.filter((d) => d !== 'Semua Wilayah Magelang').map((d, idx) => (
                    <option key={idx} value={d}>
                      Kec. {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-[#2A2823] mb-1">Alamat Rumah Kunjungan *</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Jl. Raya Secang No. 42 (Dekat Pasar Secang), Kab. Magelang"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Penugasan Tutor & Paket Belajar */}
          <div className="space-y-3 pt-3 border-t border-[#2A2823]/10">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#6B675F]">
              3. Penugasan Tutor &amp; Paket Belajar
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Tutor Penugasan</label>
                <select
                  value={tutorName}
                  onChange={(e) => setTutorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
                >
                  {AVAILABLE_TUTORS.map((t, idx) => (
                    <option key={idx} value={t.split(' (')[0]}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Fokus Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Pisahkan koma, misal: Matematika, Tematik, IPA"
                  value={subjectsText}
                  onChange={(e) => setSubjectsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Jumlah Paket Sesi</label>
                <select
                  value={packageSessions}
                  onChange={(e) => setPackageSessions(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
                >
                  <option value={4}>4 Sesi (Semi-Bulanan)</option>
                  <option value={8}>8 Sesi (Standar 1 Bulan)</option>
                  <option value={12}>12 Sesi (Intensif)</option>
                  <option value={16}>16 Sesi (Paket 2 Bulan)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Sesi Terlaksana</label>
                <input
                  type="number"
                  min={0}
                  max={packageSessions}
                  value={completedSessions}
                  onChange={(e) => setCompletedSessions(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Status Belajar</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'aktif' | 'perlu_perpanjang' | 'cuti')}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
                >
                  <option value="aktif">Aktif Belajar</option>
                  <option value="perlu_perpanjang">Perlu Perpanjangan SPP</option>
                  <option value="cuti">Cuti Sementara / Selesai</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Catatan Khusus</label>
                <input
                  type="text"
                  placeholder="Contoh: Fokus latihan soal cerita perkalian"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2A2823]/10 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#2A2823]/15 text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{initialData ? 'Simpan Perubahan' : 'Daftarkan Siswa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
