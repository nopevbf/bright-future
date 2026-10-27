import React, { useState } from 'react';
import {
  GraduationCap,
  Star,
  Users,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Search,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { FirestoreTutorRegistrationDoc, FirestoreTutorAssignmentDoc } from '../../firebase';
import { ManagedStudent } from '../../types';
import {
  resolveStudentsForTutor,
  calculateTutorLoadLabel,
  AssignedStudentSummary,
} from '../../utils/tutorPairingResolver';

export interface ActiveTutorItem {
  id?: string;
  name: string;
  univ: string;
  spec: string;
  load?: string;
  status?: string;
  rating?: number;
  district?: string;
  isNewAccepted?: boolean;
  assignedStudents?: AssignedStudentSummary[];
}

export const BASE_ACTIVE_TUTORS: ActiveTutorItem[] = [
  {
    name: 'Kak Anindya, S.Pd.',
    univ: 'Pendidikan Matematika UNY (IPK 3.88)',
    spec: 'SD UMUM & Olimpiade Sains SD',
    load: '6 Siswa Aktif',
    status: 'Tersedia Sore',
    rating: 4.9,
    district: 'Mertoyudan & Magelang Selatan',
  },
  {
    name: 'Kak Dimas Arya, S.Si.',
    univ: 'Fisika MIPA UGM (IPK 3.82)',
    spec: 'SD UMUM Matematika & SMP Fisika',
    load: '8 Siswa Aktif',
    status: 'On-Duty',
    rating: 4.8,
    district: 'Magelang Tengah & Secang',
  },
  {
    name: 'Kak Sarah Larasati, M.Pd.',
    univ: 'Magister Bahasa & Sastra Indonesia UNS',
    spec: 'SD UMUM Tematik & Literasi Membaca',
    load: '5 Siswa Aktif',
    status: 'Tersedia',
    rating: 4.9,
    district: 'Magelang Utara & Kramat',
  },
  {
    name: 'Kak Siti Rahma, S.Pd.',
    univ: 'PGSD Universitas Muhammadiyah Magelang',
    spec: 'Calistung Fonik & SD Kelas Rendah',
    load: '7 Siswa Aktif',
    status: 'Tersedia',
    rating: 4.7,
    district: 'Mertoyudan & Borobudur',
  },
];

interface TutorManagementSubTabProps {
  acceptedApplicants: FirestoreTutorRegistrationDoc[];
  activeTutors?: ActiveTutorItem[];
  managedStudents?: ManagedStudent[];
  assignments?: FirestoreTutorAssignmentDoc[];
  onDeleteTutor?: (tutor: ActiveTutorItem, unassignStudents?: boolean) => void;
  onSwitchToVerificationTab?: () => void;
}

export const TutorManagementSubTab: React.FC<TutorManagementSubTabProps> = ({
  acceptedApplicants = [],
  activeTutors,
  managedStudents = [],
  assignments = [],
  onDeleteTutor,
  onSwitchToVerificationTab,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDuty, setFilterDuty] = useState<string>('all');
  const [selectedTutorForStudents, setSelectedTutorForStudents] = useState<ActiveTutorItem | null>(null);
  const [tutorToDelete, setTutorToDelete] = useState<ActiveTutorItem | null>(null);
  const [confirmUnassignCheckbox, setConfirmUnassignCheckbox] = useState<boolean>(false);

  // Sumber data dasar tutor aktif (menggunakan activeTutors bila disediakan)
  const sourceTutors = activeTutors !== undefined ? activeTutors : BASE_ACTIVE_TUTORS;

  // Saring pelamar yang belum masuk dalam sourceTutors agar tidak ganda
  const applicantTutors: ActiveTutorItem[] = acceptedApplicants
    .filter((app) => !sourceTutors.some((t) => t.name.toLowerCase() === app.fullName.toLowerCase()))
    .map((app) => {
      const assigned = resolveStudentsForTutor(app.fullName, managedStudents, assignments);
      const dynamicLoad = calculateTutorLoadLabel(assigned.length);
      const dynamicStatus = assigned.length > 0 ? 'On-Duty' : 'Tersedia';
      return {
        id: app.id,
        name: app.fullName,
        univ: app.education,
        spec: app.subjects,
        load: dynamicLoad,
        status: dynamicStatus,
        rating: 5.0,
        district: app.district,
        isNewAccepted: true,
        assignedStudents: assigned,
      };
    });

  // Gabungkan tutor aktif dengan pelamar yang diterima dan hitung relasi siswa binaan
  const combinedTutors: ActiveTutorItem[] = [
    ...sourceTutors.map((tutor) => {
      const assigned =
        tutor.assignedStudents !== undefined
          ? tutor.assignedStudents
          : resolveStudentsForTutor(tutor.name, managedStudents, assignments);
      const dynamicLoad = assigned.length > 0 ? calculateTutorLoadLabel(assigned.length) : tutor.load;
      const dynamicStatus = assigned.length > 0 ? 'On-Duty' : tutor.status;
      return {
        ...tutor,
        load: dynamicLoad,
        status: dynamicStatus,
        assignedStudents: assigned,
      };
    }),
    ...applicantTutors,
  ];

  const filtered = combinedTutors.filter((tutor) => {
    if (filterDuty === 'on_duty' && tutor.status !== 'On-Duty') return false;
    if (filterDuty === 'tersedia' && !(tutor.status || '').toLowerCase().includes('tersedia')) return false;

    if (!searchQuery) return true;
    const q = (searchQuery || '').toLowerCase();
    return (
      (tutor.name || '').toLowerCase().includes(q) ||
      (tutor.univ || '').toLowerCase().includes(q) ||
      (tutor.spec || '').toLowerCase().includes(q) ||
      ((tutor.district || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengajar, spesialisasi, atau zonasi..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterDuty('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterDuty === 'all'
                ? 'bg-[#3F5A46] text-white shadow-xs'
                : 'bg-[#FAF7F1] text-[#6B675F] hover:text-[#2A2823] border border-[rgba(42,40,35,0.08)]'
            }`}
          >
            Semua ({combinedTutors.length})
          </button>
          <button
            onClick={() => setFilterDuty('tersedia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterDuty === 'tersedia'
                ? 'bg-[#3F5A46] text-white shadow-xs'
                : 'bg-[#FAF7F1] text-[#6B675F] hover:text-[#2A2823] border border-[rgba(42,40,35,0.08)]'
            }`}
          >
            Tersedia
          </button>
          <button
            onClick={() => setFilterDuty('on_duty')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterDuty === 'on_duty'
                ? 'bg-[#3F5A46] text-white shadow-xs'
                : 'bg-[#FAF7F1] text-[#6B675F] hover:text-[#2A2823] border border-[rgba(42,40,35,0.08)]'
            }`}
          >
            On-Duty
          </button>
        </div>
      </div>

      {/* Tampilan Empty State atau Grid Kartu Bento Pengajar Aktif */}
      {combinedTutors.length === 0 ? (
        <div className="p-10 sm:p-14 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF7F1] text-[#3F5A46] flex items-center justify-center mx-auto border border-[rgba(42,40,35,0.08)] shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-[#2A2823] font-display">
              Belum Ada Tutor / Guru Privat Terdaftar
            </h3>
            <p className="text-xs text-[#6B675F] leading-relaxed">
              Saat ini belum ada pengajar aktif di sistem atau semua pengajar telah dihapus. Anda dapat memverifikasi pendaftar baru dari sub-tab Verifikasi untuk menambahkan pengajar resmi.
            </p>
          </div>
          {onSwitchToVerificationTab && (
            <button
              type="button"
              onClick={onSwitchToVerificationTab}
              className="px-5 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold shadow-xs hover:bg-[#3F5A46] cursor-pointer inline-flex items-center gap-2 transition-all mt-2"
            >
              <Users className="w-4 h-4" />
              <span>Buka Verifikasi Calon Tutor</span>
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] text-center space-y-2">
          <Search className="w-8 h-8 text-[#6B675F] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-[#2A2823]">Tidak ada tutor ditemukan</h4>
          <p className="text-xs text-[#6B675F]">
            Tidak ada tutor yang sesuai dengan kriteria pencarian &quot;{searchQuery}&quot; atau filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tutor, idx) => (
            <div
              key={tutor.id || tutor.name || idx}
              className="p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#3F5A46]/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tutor.status === 'On-Duty'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-[#c8ebce] text-[#284230]'
                      }`}
                    >
                      {tutor.status}
                    </span>
                    {tutor.isNewAccepted && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C1683F]/15 text-[#C1683F] text-[10px] font-bold">
                        Baru Lolos
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#6B675F] font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {tutor.load}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#2A2823] mt-2">{tutor.name}</h3>
                <p className="text-xs text-[#3F5A46] font-semibold">{tutor.univ}</p>
                <p className="text-xs text-[#6B675F] mt-1">Spesialisasi: {tutor.spec}</p>

                {tutor.district && (
                  <p className="text-[11px] text-[#6B675F] mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#C1683F]" />
                    <span>Zonasi: {tutor.district}</span>
                  </p>
                )}

                {/* Siswa Binaan yang Dipasangkan */}
                {tutor.assignedStudents && tutor.assignedStudents.length > 0 ? (
                  <div className="mt-3 pt-2.5 border-t border-[rgba(42,40,35,0.06)] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#3F5A46] flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-[#3F5A46]" />
                        <span>Siswa Binaan ({tutor.assignedStudents.length}):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTutorForStudents(tutor)}
                        className="text-[10px] text-[#284230] font-bold hover:underline cursor-pointer"
                      >
                        Lihat Rincian
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tutor.assignedStudents.slice(0, 3).map((stu) => (
                        <span
                          key={stu.studentId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] text-[10px] text-[#2A2823] font-medium"
                          title={`${stu.studentName} (${stu.level || 'SD'}) - ${stu.district || ''}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3F5A46]"></span>
                          <span className="truncate max-w-[110px]">{stu.studentName}</span>
                        </span>
                      ))}
                      {tutor.assignedStudents.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setSelectedTutorForStudents(tutor)}
                          className="px-1.5 py-0.5 rounded-md bg-[#c8ebce] text-[#284230] text-[10px] font-bold hover:bg-[#b2dfb9] cursor-pointer"
                        >
                          +{tutor.assignedStudents.length - 3} lagi
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-2.5 border-t border-[rgba(42,40,35,0.06)]">
                    <span className="text-[11px] text-[#6B675F] italic flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#6B675F]" />
                      <span>Belum ada siswa yang dipasangkan</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#2A2823]/8 flex items-center justify-between">
                <span className="text-xs text-[#3F5A46] font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{tutor.rating ? tutor.rating.toFixed(1) : '5.0'} / 5.0</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTutorForStudents(tutor)}
                    className="text-xs text-[#284230] font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Lihat Siswa Binaan</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTutorToDelete(tutor);
                      setConfirmUnassignCheckbox(false);
                    }}
                    className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Hapus Tutor dari Sistem"
                    aria-label={`Hapus tutor ${tutor.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Rincian Siswa Binaan Tutor */}
      {selectedTutorForStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-xl w-full rounded-2xl bg-white border border-[rgba(42,40,35,0.1)] shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
            <div className="p-5 bg-[#FAF7F1] border-b border-[rgba(42,40,35,0.08)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3F5A46] text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2A2823] font-display">
                    Siswa Binaan: {selectedTutorForStudents.name}
                  </h3>
                  <p className="text-xs text-[#6B675F]">
                    {selectedTutorForStudents.univ} • {selectedTutorForStudents.district}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTutorForStudents(null)}
                className="w-8 h-8 rounded-lg bg-white border border-[rgba(42,40,35,0.1)] flex items-center justify-center text-[#6B675F] hover:text-[#2A2823] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {selectedTutorForStudents.assignedStudents && selectedTutorForStudents.assignedStudents.length > 0 ? (
                selectedTutorForStudents.assignedStudents.map((stu, i) => (
                  <div
                    key={stu.studentId || i}
                    className="p-3.5 rounded-xl border border-[rgba(42,40,35,0.08)] bg-[#FAF7F1]/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2A2823]">{stu.studentName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                          {stu.level}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B675F] mt-0.5">
                        {stu.grade} • ID: {stu.studentId}
                      </p>
                      {stu.district && (
                        <p className="text-[11px] text-[#C1683F] font-medium mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>Zonasi: {stu.district}</span>
                        </p>
                      )}
                    </div>
                    {(stu.whatsapp || stu.parentPhone) && (
                      <a
                        href={`https://wa.me/${(stu.whatsapp || stu.parentPhone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-emerald-600 transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                      >
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#6B675F] text-xs">
                  Belum ada siswa binaan yang dipasangkan ke tutor ini.
                </div>
              )}
            </div>

            <div className="p-4 bg-[#FAF7F1] border-t border-[rgba(42,40,35,0.08)] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTutorForStudents(null)}
                className="px-4 py-2 rounded-xl bg-[#3F5A46] text-white text-xs font-bold cursor-pointer hover:bg-[#284230] transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Tutor */}
      {tutorToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md w-full rounded-3xl bg-white border border-[rgba(42,40,35,0.12)] shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2A2823]">Konfirmasi Hapus Tutor</h3>
                <p className="text-xs text-[#6B675F] mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus tutor{' '}
                  <strong className="text-[#2A2823]">{tutorToDelete.name}</strong> dari sistem?
                </p>
              </div>
            </div>

            {/* Validation banner when tutor has assigned students */}
            {tutorToDelete.assignedStudents && tutorToDelete.assignedStudents.length > 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Perhatian: Tutor Masih Memiliki Siswa Binaan</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Tutor ini saat ini sedang membimbing{' '}
                  <span className="font-bold">{tutorToDelete.assignedStudents.length} siswa aktif</span>:
                </p>
                <ul className="text-[11px] list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto pl-1 font-medium">
                  {tutorToDelete.assignedStudents.map((st) => (
                    <li key={st.studentId}>
                      {st.studentName} ({st.level} - {st.grade})
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-amber-200">
                  <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold text-amber-950">
                    <input
                      type="checkbox"
                      aria-label="konfirmasi pelepasan siswa"
                      checked={confirmUnassignCheckbox}
                      onChange={(e) => setConfirmUnassignCheckbox(e.target.checked)}
                      className="mt-0.5 rounded text-[#3F5A46] focus:ring-[#3F5A46] cursor-pointer"
                    />
                    <span>
                      Saya memahami dan mengonfirmasi bahwa {tutorToDelete.assignedStudents.length} siswa binaan di atas akan dilepas penugasannya ke status &apos;Belum Ditugaskan&apos;.
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] text-xs text-[#6B675F]">
                Tutor ini tidak memiliki siswa binaan aktif. Data pengajar akan dihapus secara permanen dari daftar tutor aktif.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTutorToDelete(null);
                  setConfirmUnassignCheckbox(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B675F] hover:bg-[#FAF7F1] hover:text-[#2A2823] cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={Boolean(
                  tutorToDelete.assignedStudents &&
                    tutorToDelete.assignedStudents.length > 0 &&
                    !confirmUnassignCheckbox
                )}
                onClick={() => {
                  if (onDeleteTutor) {
                    onDeleteTutor(tutorToDelete, confirmUnassignCheckbox);
                  }
                  setTutorToDelete(null);
                  setConfirmUnassignCheckbox(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                  tutorToDelete.assignedStudents &&
                  tutorToDelete.assignedStudents.length > 0 &&
                  !confirmUnassignCheckbox
                    ? 'bg-rose-200 text-white cursor-not-allowed opacity-60'
                    : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
                }`}
              >
                Ya, Hapus Tutor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
