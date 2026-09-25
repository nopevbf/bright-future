import React, { useState } from 'react';
import { ManagedStudent } from './studentData';

interface AddSessionsModalProps {
  student: ManagedStudent | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (studentId: string, additionalSessions: number, updatedStatus: 'aktif' | 'perlu_perpanjang' | 'cuti') => void;
}

export const AddSessionsModal: React.FC<AddSessionsModalProps> = ({
  student,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [sessionsToAdd, setSessionsToAdd] = useState<number>(8);
  const [newStatus, setNewStatus] = useState<'aktif' | 'perlu_perpanjang' | 'cuti'>('aktif');

  if (!isOpen || !student) return null;

  const currentRemaining = student.packageSessions - student.completedSessions;
  const newTotalSessions = student.packageSessions + sessionsToAdd;
  const newRemaining = currentRemaining + sessionsToAdd;

  const sessionCostPerSession =
    student.level.toLowerCase().includes('sma')
      ? 50000
      : student.level.toLowerCase().includes('smp')
      ? 45000
      : 35000;
  const estimatedAmount = sessionCostPerSession * sessionsToAdd;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(student.id, sessionsToAdd, newStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#2A2823]/10 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2823]/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#284230] text-[22px]">
              add_circle
            </span>
            <h3 className="font-bold text-base text-[#2A2823]">
              Perpanjang Paket Belajar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-[#FAF7F1] text-[#6B675F] hover:text-[#2A2823] flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Student summary info */}
        <div className="p-3.5 rounded-2xl bg-[#FAF7F1] border border-[#2A2823]/8 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-[#6B675F]">Nama Siswa:</span>
            <span className="font-bold text-[#2A2823]">{student.studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B675F]">Jenjang Belajar:</span>
            <span className="font-semibold text-[#3F5A46]">{student.grade} ({student.level})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B675F]">Tutor Pembimbing:</span>
            <span className="font-semibold text-[#284230]">{student.tutorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B675F]">Sesi Saat Ini:</span>
            <span className="font-bold text-amber-800">
              {student.completedSessions} / {student.packageSessions} (Sisa {currentRemaining} sesi)
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#2A2823] mb-1">
              Pilih Tambahan Sesi Baru
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[4, 8, 12].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setSessionsToAdd(num)}
                  className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                    sessionsToAdd === num
                      ? 'border-[#284230] bg-[#284230] text-white shadow-xs'
                      : 'border-[#2A2823]/15 bg-white text-[#2A2823] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <div className="text-sm">+{num} Sesi</div>
                  <div className="text-[10px] opacity-80">
                    {num === 8 ? 'Standar 1 Bln' : num === 4 ? 'Semi-Bulan' : 'Intensif'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#2A2823] mb-1">Status Belajar</label>
            <select
              value={newStatus}
              onChange={(e) =>
                setNewStatus(e.target.value as 'aktif' | 'perlu_perpanjang' | 'cuti')
              }
              className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
            >
              <option value="aktif">Aktif Belajar</option>
              <option value="perlu_perpanjang">Perlu Perpanjangan</option>
              <option value="cuti">Cuti Sementara</option>
            </select>
          </div>

          {/* Projection calculation */}
          <div className="p-3 rounded-xl bg-[#c8ebce]/30 border border-[#284230]/20 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B675F]">Total Paket Baru:</span>
              <span className="font-bold text-[#284230]">{newTotalSessions} Sesi (Sisa {newRemaining} Sesi)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B675F]">Estimasi SPP Tambahan:</span>
              <span className="font-bold text-[#3F5A46]">Rp {estimatedAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#2A2823]/15 text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Konfirmasi Tambah Sesi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
