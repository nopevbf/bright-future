import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  BookOpen,
  MapPin,
  Calendar,
  MessageSquare,
  Share2,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import { FirestoreTutorRegistrationDoc } from '../../firebase';
import {
  generateTutorInterviewWhatsAppUrl,
  generateTutorAcceptanceWhatsAppUrl,
  generateTutorRejectionWhatsAppUrl,
} from '../../utils/tutorManagement';

interface TutorApplicantDetailModalProps {
  applicant: FirestoreTutorRegistrationDoc;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: 'pending_review' | 'interview' | 'accepted' | 'rejected',
    notes?: string
  ) => void;
}

export const TutorApplicantDetailModal: React.FC<TutorApplicantDetailModalProps> = ({
  applicant,
  onClose,
  onUpdateStatus,
}) => {
  const [adminNotes, setAdminNotes] = useState<string>(applicant.adminNotes || '');
  const [interviewDate, setInterviewDate] = useState<string>('Rabu, 7 Oktober 2026');
  const [interviewTime, setInterviewTime] = useState<string>('14:00 WIB');
  const [interviewLocation, setInterviewLocation] = useState<string>(
    'Kantor Cabang Bright Future Mertoyudan'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Diterima &amp; Terakreditasi
          </span>
        );
      case 'interview':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Wawancara &amp; Microteaching
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5" />
            Belum Sesuai Kriteria
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <FileText className="w-3.5 h-3.5" />
            Menunggu Review Berkas
          </span>
        );
    }
  };

  const handleSendInterviewWA = () => {
    const url = generateTutorInterviewWhatsAppUrl(applicant, {
      date: interviewDate,
      time: interviewTime,
      location: interviewLocation,
    });
    window.open(url, '_blank');
  };

  const handleSendAcceptanceWA = () => {
    const url = generateTutorAcceptanceWhatsAppUrl(applicant);
    window.open(url, '_blank');
  };

  const handleSendRejectionWA = () => {
    const url = generateTutorRejectionWhatsAppUrl(applicant);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="max-w-2xl w-full rounded-[28px] bg-white border border-[rgba(42,40,35,0.1)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-[#FAF7F1] border-b border-[rgba(42,40,35,0.08)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#3F5A46] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3F5A46] bg-[#3F5A46]/10 px-2 py-0.5 rounded-full">
                  {applicant.id}
                </span>
                {getStatusBadge(applicant.status)}
              </div>
              <h2 className="text-lg font-bold text-[#2A2823] font-display mt-0.5">
                {applicant.fullName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B675F] hover:bg-black/5 hover:text-[#2A2823] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#2A2823]">
          {/* Grid Informasi Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)] space-y-2">
              <div className="flex items-center gap-2 text-[#3F5A46] font-bold">
                <GraduationCap className="w-4 h-4" />
                <span>Pendidikan &amp; Kualifikasi</span>
              </div>
              <p className="font-semibold text-sm">{applicant.education}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)] space-y-2">
              <div className="flex items-center gap-2 text-[#C1683F] font-bold">
                <BookOpen className="w-4 h-4" />
                <span>Spesialisasi Mata Pelajaran</span>
              </div>
              <p className="font-semibold text-sm">{applicant.subjects}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)] space-y-2">
              <div className="flex items-center gap-2 text-[#3F5A46] font-bold">
                <MapPin className="w-4 h-4" />
                <span>Kecamatan Domisili Magelang</span>
              </div>
              <p className="font-semibold text-sm">Kecamatan {applicant.district}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.06)] space-y-2">
              <div className="flex items-center gap-2 text-[#6B675F] font-bold">
                <Calendar className="w-4 h-4" />
                <span>Tanggal Pendaftaran</span>
              </div>
              <p className="font-semibold text-sm">
                {new Date(applicant.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </p>
            </div>
          </div>

          {/* Pengalaman Mengajar */}
          <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.1)] space-y-1.5">
            <span className="font-bold text-[#6B675F] uppercase text-[11px]">
              Pengalaman Mengajar &amp; Keterangan Tambahan:
            </span>
            <p className="text-xs leading-relaxed text-[#2A2823] whitespace-pre-wrap">
              {applicant.experienceNotes || 'Tidak ada catatan pengalaman tambahan.'}
            </p>
          </div>

          {/* Pengaturan Jadwal Wawancara (Bila status interview) */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              Detail Undangan Wawancara &amp; Microteaching (SOP 70 Menit)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">
                  Hari / Tanggal
                </label>
                <input
                  type="text"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-amber-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">
                  Pukul
                </label>
                <input
                  type="text"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-amber-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-amber-300 text-xs"
                />
              </div>
            </div>
            <button
              onClick={handleSendInterviewWA}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#20ba5a] transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              Kirim Undangan Wawancara via WhatsApp
            </button>
          </div>

          {/* Catatan Internal Admin */}
          <div>
            <label className="block font-bold text-[#6B675F] uppercase text-[11px] mb-1">
              Catatan Internal Tim Akademik / Owner:
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Tambahkan catatan hasil review berkas atau wawancara di sini..."
              className="w-full p-3 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-[#FAF7F1] border-t border-[rgba(42,40,35,0.08)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#6B675F] font-bold">Ubah Status Pelamar:</span>
            <button
              onClick={() => onUpdateStatus(applicant.id, 'interview', adminNotes)}
              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-all cursor-pointer"
            >
              Wawancara
            </button>
            <button
              onClick={() => {
                onUpdateStatus(applicant.id, 'accepted', adminNotes);
                handleSendAcceptanceWA();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
            >
              Terima &amp; Akreditasi
            </button>
            <button
              onClick={() => {
                onUpdateStatus(applicant.id, 'rejected', adminNotes);
                handleSendRejectionWA();
              }}
              className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs transition-all cursor-pointer"
            >
              Tolak
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[rgba(42,40,35,0.12)] text-[#6B675F] hover:text-[#2A2823] font-bold text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
