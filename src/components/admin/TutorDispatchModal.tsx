import React, { useState } from 'react';
import {
  DispatchableStudent,
  DispatchableTutor,
  rankTutorsForStudent,
  generateTutorDispatchWhatsAppUrl,
  generateParentDispatchConfirmationWhatsAppUrl,
  TutorMatchEvaluation,
} from '../../utils/tutorDispatch';

interface TutorDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: DispatchableStudent | null;
  tutors: DispatchableTutor[];
  onAssignTutor: (studentId: string, tutorName: string) => void;
}

export const TutorDispatchModal: React.FC<TutorDispatchModalProps> = ({
  isOpen,
  onClose,
  student,
  tutors = [],
  onAssignTutor,
}) => {
  const [selectedEvaluation, setSelectedEvaluation] = useState<TutorMatchEvaluation | null>(null);
  const [isSuccessAssigned, setIsSuccessAssigned] = useState<boolean>(false);
  const [customSchedule, setCustomSchedule] = useState<string>('Sesuai jadwal reguler');

  React.useEffect(() => {
    if (isOpen) {
      setSelectedEvaluation(null);
      setIsSuccessAssigned(false);
    }
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  // Hitung peringkat kecocokan secara real-time
  const safeTutors = Array.isArray(tutors) && tutors.length > 0 ? tutors : [];
  const rankedEvaluations = rankTutorsForStudent(student, safeTutors);
  const activeEval = selectedEvaluation || (rankedEvaluations.length > 0 ? rankedEvaluations[0] : null);

  const handleConfirmAssignment = (evalItem: TutorMatchEvaluation) => {
    if (!evalItem || !evalItem.tutor) return;
    onAssignTutor(student.id, evalItem.tutor.name);
    setSelectedEvaluation(evalItem);
    setIsSuccessAssigned(true);
  };

  const scheduleText = student.selectedSchedule?.length
    ? student.selectedSchedule.join(', ')
    : customSchedule;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-[#FAF7F1] rounded-2xl sm:rounded-3xl shadow-2xl border border-[rgba(42,40,35,0.12)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(42,40,35,0.08)] bg-white/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#284230] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">near_me</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF2ED] text-[#284230]">
                  Smart Geo-Dispatch Magelang
                </span>
                <span className="text-xs text-[#6B675F]">• Haversine Proximity</span>
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#2A2823] mt-0.5">
                Pasangkan Tutor Terdekat &amp; Terkompeten
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-lg text-[#6B675F] hover:text-[#2A2823] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card Info Profil Siswa */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2823]/10">
              <div>
                <span className="text-[11px] font-bold text-[#6B675F]">Calon Siswa yang Dipasangkan:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="text-base sm:text-lg font-extrabold text-[#2A2823]">
                    {student.studentName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#f0eee8] text-[#284230] font-mono text-xs font-bold">
                    {student.id}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full bg-[#EFC9AE]/30 text-[#6b2702] text-xs font-bold border border-[#EFC9AE]">
                  Jenjang: {student.level} {student.grade ? `(${student.grade})` : ''}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#EAF2ED] text-[#284230] text-xs font-bold border border-[#c8ebce]">
                  📍 Kec. {student.district}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
              <div>
                <span className="text-[#6B675F]">Alamat Rumah:</span>
                <p className="font-semibold text-[#2A2823] line-clamp-2 mt-0.5" title={student.address}>
                  {student.address}
                </p>
              </div>
              <div>
                <span className="text-[#6B675F]">Wali Murid &amp; WA:</span>
                <p className="font-semibold text-[#2A2823] mt-0.5">
                  {student.parentName} ({student.whatsapp})
                </p>
              </div>
              <div>
                <span className="text-[#6B675F]">Jadwal Belajar Dipilih:</span>
                <p className="font-semibold text-[#3F5A46] mt-0.5">
                  {student.selectedSchedule && student.selectedSchedule.length > 0
                    ? student.selectedSchedule.join(', ')
                    : 'Fleksibel / Sesuai Kesepakatan'}
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Banner jika Baru saja Ditugaskan */}
          {isSuccessAssigned && activeEval && (
            <div className="p-4 rounded-2xl bg-[#EAF2ED] border border-[#3F5A46]/20 text-[#284230] space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#3F5A46]">check_circle</span>
                <span className="font-bold text-sm">
                  Berhasil Memasangkan {student.studentName} dengan {activeEval.tutor.name}!
                </span>
              </div>
              <p className="text-xs text-[#424843]">
                Data tutor telah terhubung. Anda dapat langsung mengirim notifikasi penugasan via WhatsApp resmi Bright Future ke Tutor dan konfirmasi ke Wali Murid di bawah ini:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={generateTutorDispatchWhatsAppUrl(student, activeEval.tutor, scheduleText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>1. Kirim SOP Penugasan ke Tutor ({activeEval.tutor.name})</span>
                </a>

                <a
                  href={generateParentDispatchConfirmationWhatsAppUrl(student, activeEval.tutor, scheduleText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>2. Kirim Konfirmasi ke Wali Murid ({student.parentName})</span>
                </a>
              </div>
            </div>
          )}

          {/* Daftar Ranking Tutor Rekomendasi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-sm text-[#2A2823]">
                  Peringkat Tutor Terdekat &amp; Paling Relevan
                </h4>
                <p className="text-[11px] text-[#6B675F]">
                  Diurutkan berdasarkan skor kecocokan subjek (50%), jarak geolokasi Haversine (40%), dan kapasitas mengajar (10%).
                </p>
              </div>
              <span className="text-xs font-bold text-[#3F5A46] bg-[#EAF2ED] px-2.5 py-1 rounded-full">
                {rankedEvaluations.length} Tutor Tersedia
              </span>
            </div>

            <div className="space-y-3">
              {rankedEvaluations.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#2A2823]/10 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#f0eee8] text-[#6B675F] flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[24px]">person_off</span>
                  </div>
                  <p className="text-sm font-bold text-[#2A2823]">Belum ada data pengajar aktif yang tersedia.</p>
                  <p className="text-xs text-[#6B675F] max-w-sm mx-auto">
                    Silakan pastikan data tutor aktif telah terisi atau verifikasi pendaftar tutor baru di menu Data Tutor.
                  </p>
                </div>
              ) : (
                rankedEvaluations.map((evalItem, index) => {
                  const isSelected = Boolean(activeEval?.tutor?.name && activeEval.tutor.name === evalItem.tutor.name);
                  const isTop1 = index === 0;

                  return (
                    <div
                      key={evalItem.tutor.id || evalItem.tutor.name}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-white border-[#284230] shadow-md ring-1 ring-[#284230]/20'
                          : 'bg-white/80 border-[#2A2823]/10 hover:border-[#2A2823]/30 hover:bg-white'
                      }`}
                    >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Kolom Kiri: Profil & Badges */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isTop1 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#EFC9AE] text-[#6b2702] text-[10px] font-extrabold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              PILIHAN TERBAIK #1
                            </span>
                          )}
                          <span className="font-bold text-sm text-[#2A2823]">
                            {evalItem.tutor.name}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f0eee8] text-[#284230] font-semibold">
                            📍 {evalItem.tutor.district || 'Magelang'} (~{evalItem.distanceKm} km)
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              evalItem.tutor.status?.toLowerCase().includes('tersedia')
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {evalItem.tutor.status || 'Tersedia'}
                          </span>
                        </div>

                        <div className="text-xs text-[#6B675F] space-y-0.5">
                          <p>
                            🎓 <span className="font-medium text-[#2A2823]">{evalItem.tutor.univ || 'Pendidik Terakreditasi'}</span>
                          </p>
                          <p>
                            📖 Spesialisasi: <span className="font-medium text-[#2A2823]">{evalItem.tutor.spec}</span>
                          </p>
                          <p className="text-[11px] text-[#3F5A46] font-medium">
                            💡 {evalItem.recommendationReason}
                          </p>
                        </div>
                      </div>

                      {/* Kolom Kanan: Match Score Meter & Action */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs font-bold text-[#6B675F]">Match Score:</span>
                            <span className="text-base font-extrabold text-[#284230]">
                              {evalItem.matchScore}%
                            </span>
                          </div>
                          <div className="w-24 sm:w-28 bg-[#f0eee8] h-2 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full transition-all ${
                                evalItem.matchScore >= 80
                                  ? 'bg-[#284230]'
                                  : evalItem.matchScore >= 60
                                  ? 'bg-[#3F5A46]'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${evalItem.matchScore}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmAssignment(evalItem)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                            isSelected && isSuccessAssigned
                              ? 'bg-[#EAF2ED] text-[#284230] border border-[#3F5A46]/30'
                              : 'bg-[#284230] text-white hover:bg-[#3F5A46]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isSelected && isSuccessAssigned ? 'check' : 'person_add'}
                          </span>
                          <span>
                            {isSelected && isSuccessAssigned
                              ? 'Telah Dipasangkan'
                              : 'Pasangkan Tutor Ini'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 bg-white/80 border-t border-[rgba(42,40,35,0.08)] flex items-center justify-between gap-3">
          <div className="text-[11px] text-[#6B675F] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#3F5A46]">verified</span>
            <span>Algoritma Meja Belajar Bright Future terintegrasi Geofence GPS &lt; 25m</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#f0eee8] text-[#2A2823] font-bold text-xs hover:bg-[#ebe8e2] transition-colors cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
