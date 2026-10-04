import React, { useState } from 'react';
import {
  GraduationCap,
  Star,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Search,
} from 'lucide-react';
import { FirestoreTutorRegistrationDoc } from '../../firebase';

export interface ActiveTutorItem {
  id?: string;
  name: string;
  univ: string;
  spec: string;
  load: string;
  status: string;
  rating?: number;
  district?: string;
  isNewAccepted?: boolean;
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
}

export const TutorManagementSubTab: React.FC<TutorManagementSubTabProps> = ({
  acceptedApplicants,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDuty, setFilterDuty] = useState<string>('all');

  // Gabungkan base active tutors dengan pelamar yang diterima
  const combinedTutors: ActiveTutorItem[] = [
    ...BASE_ACTIVE_TUTORS,
    ...acceptedApplicants.map((app) => ({
      id: app.id,
      name: app.fullName,
      univ: app.education,
      spec: app.subjects,
      load: 'Siap Penugasan Baru',
      status: 'Tersedia',
      rating: 5.0,
      district: app.district,
      isNewAccepted: true,
    })),
  ];

  const filtered = combinedTutors.filter((tutor) => {
    if (filterDuty === 'on_duty' && tutor.status !== 'On-Duty') return false;
    if (filterDuty === 'tersedia' && !tutor.status.toLowerCase().includes('tersedia')) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tutor.name.toLowerCase().includes(q) ||
      tutor.univ.toLowerCase().includes(q) ||
      tutor.spec.toLowerCase().includes(q) ||
      (tutor.district && tutor.district.toLowerCase().includes(q))
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

      {/* Grid Kartu Bento Pengajar Aktif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tutor, idx) => (
          <div
            key={idx}
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
            </div>

            <div className="pt-3 border-t border-[#2A2823]/8 flex items-center justify-between">
              <span className="text-xs text-[#3F5A46] font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{tutor.rating ? tutor.rating.toFixed(1) : '5.0'} / 5.0</span>
              </span>
              <button
                onClick={() => alert(`Jadwal detail ${tutor.name} dibuka`)}
                className="text-xs text-[#284230] font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>Lihat Jadwal</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
