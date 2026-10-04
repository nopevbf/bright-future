import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Share2,
  UserCheck,
  RefreshCw,
  Eye,
  GraduationCap,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { FirestoreTutorRegistrationDoc } from '../../firebase';
import { filterTutorApplications } from '../../utils/tutorManagement';

interface TutorVerificationSubTabProps {
  applications: FirestoreTutorRegistrationDoc[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onViewDetail: (app: FirestoreTutorRegistrationDoc) => void;
  onUpdateStatus: (
    id: string,
    status: 'pending_review' | 'interview' | 'accepted' | 'rejected',
    notes?: string
  ) => void;
}

export const TutorVerificationSubTab: React.FC<TutorVerificationSubTabProps> = ({
  applications,
  isLoading = false,
  onRefresh,
  onViewDetail,
  onUpdateStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredApps = filterTutorApplications(
    applications as any,
    searchQuery,
    statusFilter
  ) as FirestoreTutorRegistrationDoc[];

  const countPending = applications.filter((a) => a.status === 'pending_review').length;
  const countInterview = applications.filter((a) => a.status === 'interview').length;
  const countAccepted = applications.filter((a) => a.status === 'accepted').length;
  const countRejected = applications.filter((a) => a.status === 'rejected').length;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Diterima
          </span>
        );
      case 'interview':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            Wawancara
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3" />
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <FileText className="w-3 h-3" />
            Menunggu Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B675F] uppercase">Total Pendaftar</span>
            <div className="text-2xl font-black text-[#2A2823] font-display mt-0.5">
              {applications.length}
            </div>
            <span className="text-[10px] text-[#3F5A46] font-semibold">Calon Guru Privat</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#3F5A46]/10 text-[#3F5A46] flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B675F] uppercase">Menunggu Review</span>
            <div className="text-2xl font-black text-blue-700 font-display mt-0.5">
              {countPending}
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">Perlu Verifikasi Berkas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B675F] uppercase">Tahap Wawancara</span>
            <div className="text-2xl font-black text-amber-700 font-display mt-0.5">
              {countInterview}
            </div>
            <span className="text-[10px] text-amber-600 font-semibold">Microteaching 70 Mnt</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B675F] uppercase">Tutor Diterima</span>
            <div className="text-2xl font-black text-emerald-700 font-display mt-0.5">
              {countAccepted}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Terakreditasi Aktif</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama calon tutor, jurusan/kampus, kecamatan, atau mapel..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pending_review', label: 'Menunggu' },
            { id: 'interview', label: 'Wawancara' },
            { id: 'accepted', label: 'Diterima' },
            { id: 'rejected', label: 'Ditolak' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === pill.id
                  ? 'bg-[#3F5A46] text-white shadow-xs'
                  : 'bg-[#FAF7F1] text-[#6B675F] hover:text-[#2A2823] border border-[rgba(42,40,35,0.08)]'
              }`}
            >
              {pill.label}
            </button>
          ))}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Data Pendaftar"
              className="p-2 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] text-[#6B675F] hover:text-[#2A2823] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Tabel Data Pendaftar */}
      <div className="rounded-[22px] bg-white border border-[rgba(42,40,35,0.08)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7F1] border-b border-[rgba(42,40,35,0.08)] text-[#6B675F] font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">Calon Pengajar</th>
                <th className="py-3.5 px-4">Pendidikan &amp; Kampus</th>
                <th className="py-3.5 px-4">Mata Pelajaran</th>
                <th className="py-3.5 px-4">Domisili Magelang</th>
                <th className="py-3.5 px-4">Status Seleksi</th>
                <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(42,40,35,0.06)] text-[#2A2823]">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6B675F]">
                    {isLoading
                      ? 'Memuat data pendaftar tutor dari Cloud Firestore...'
                      : 'Tidak ada data calon tutor yang cocok dengan kriteria pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[#FAF7F1]/50 transition-colors">
                    {/* Calon Pengajar */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-sm text-[#2A2823]">{app.fullName}</div>
                      <div className="text-[11px] text-[#6B675F] flex items-center gap-1 mt-0.5">
                        <span>WA: {app.whatsapp}</span>
                      </div>
                    </td>

                    {/* Pendidikan */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold">{app.education}</div>
                    </td>

                    {/* Mapel */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#3F5A46]/10 text-[#3F5A46] font-semibold text-[11px]">
                        {app.subjects}
                      </span>
                    </td>

                    {/* Domisili */}
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-[#6B675F]">
                        <MapPin className="w-3.5 h-3.5 text-[#C1683F]" />
                        <span>Kec. {app.district}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{renderStatusBadge(app.status)}</td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onViewDetail(app)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF7F1] hover:bg-[#3F5A46]/10 text-[#3F5A46] font-bold text-[11px] border border-[rgba(42,40,35,0.08)] transition-all cursor-pointer"
                          title="Lihat Detail Berkas &amp; Formulir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        {app.status === 'pending_review' && (
                          <button
                            onClick={() => onUpdateStatus(app.id, 'interview')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-all cursor-pointer"
                            title="Undang Wawancara"
                          >
                            Wawancara
                          </button>
                        )}

                        {app.status === 'interview' && (
                          <button
                            onClick={() => onUpdateStatus(app.id, 'accepted')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer"
                            title="Terima sebagai Tutor Resmi"
                          >
                            Terima
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
