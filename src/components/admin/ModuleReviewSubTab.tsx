import React, { useState, useEffect } from 'react';
import {
  LearningMaterial,
  fetchLearningMaterials,
  subscribeToLearningMaterials,
  approveLearningMaterial,
  rejectLearningMaterial,
  MaterialType,
  MaterialStatus,
} from '../../utils/learningMaterials';

export interface ModuleReviewSubTabProps {
  adminName?: string;
}

export const ModuleReviewSubTab: React.FC<ModuleReviewSubTabProps> = ({
  adminName = 'Super Admin',
}) => {
  const [materials, setMaterials] = useState<LearningMaterial[]>(() => fetchLearningMaterials());
  const [statusFilter, setStatusFilter] = useState<'all' | MaterialStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | MaterialType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<LearningMaterial | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    const unsubscribe = subscribeToLearningMaterials((updated) => {
      setMaterials(updated);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = async (item: LearningMaterial) => {
    try {
      await approveLearningMaterial(item.id, adminName);
      showToast(`Materi "${item.title}" disetujui & resmi dipublikasikan secara universal!`);
    } catch (err) {
      console.error('Approve error:', err);
      showToast('Gagal menyetujui materi.');
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      alert('Silakan tuliskan alasan penolakan atau catatan revisi.');
      return;
    }

    try {
      await rejectLearningMaterial(rejectingItem.id, rejectionReason.trim(), adminName);
      showToast(`Materi "${rejectingItem.title}" ditolak dengan catatan revisi.`);
      setRejectingItem(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Reject error:', err);
      showToast('Gagal menolak materi.');
    }
  };

  const filteredMaterials = materials.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSubject = m.subject.toLowerCase().includes(q);
      const matchUploader = (m.uploadedBy || '').toLowerCase().includes(q);
      const matchLevel = (m.level || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchUploader && !matchLevel) return false;
    }
    return true;
  });

  const underReviewCount = materials.filter((m) => m.status === 'under_review').length;
  const publishedCount = materials.filter((m) => m.status === 'published').length;
  const rejectedCount = materials.filter((m) => m.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="module-review-subtab">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-60 bg-[#284230] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 animate-fade-in text-xs font-semibold max-w-md">
          <span className="material-symbols-outlined text-[20px] text-[#c8ebce]">check_circle</span>
          <span className="flex-1">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C1683F]">assignment_late</span>
                <h3 className="text-base font-bold text-[#2A2823]">Tolak Materi &amp; Minta Revisi</h3>
              </div>
              <button onClick={() => setRejectingItem(null)} className="text-[#6B675F] hover:text-[#2A2823]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
              <p className="text-[#6B675F]">
                Tuliskan alasan penolakan atau catatan revisi untuk tutor <strong>{rejectingItem.uploadedBy}</strong>:
              </p>
              <div className="p-3 bg-[#FAF7F1] rounded-xl border border-[rgba(42,40,35,0.08)]">
                <span className="font-bold text-[#284230] block">{rejectingItem.title}</span>
                <span className="text-[11px] text-[#6B675F]">
                  {rejectingItem.type === 'modul' ? 'Modul Ajar' : 'Lembar Kerja (LKPD)'} • {rejectingItem.level}
                </span>
              </div>
              <div>
                <label className="block text-[#6B675F] font-semibold mb-1">
                  Alasan Penolakan / Catatan Perbaikan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Kunci jawaban pada soal no. 5 belum lengkap, mohon lampirkan rubrik pembahasan sebelum dipublikasikan."
                  className="w-full p-3 bg-[#FAF7F1] border border-[rgba(42,40,35,0.15)] rounded-2xl focus:ring-2 focus:ring-[#C1683F] outline-none resize-none leading-relaxed"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#C1683F] text-white text-xs font-bold hover:bg-[#a8532d] shadow-sm cursor-pointer"
                >
                  Kirim Penolakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(42,40,35,0.08)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#284230]">
            Review Materi &amp; Lembar Kerja Tutor
          </h2>
          <p className="text-xs sm:text-sm text-[#6B675F] mt-0.5">
            Verifikasi Modul Ajar Universal dan Lembar Kerja Siswa yang diunggah para tutor sebelum dipublikasikan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{underReviewCount} Menunggu Review</span>
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            {publishedCount} Published
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[rgba(42,40,35,0.08)] shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex rounded-xl bg-[#FAF7F1] p-1 border border-[rgba(42,40,35,0.08)]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#284230] text-white shadow-xs' : 'text-[#6B675F] hover:text-[#284230]'
              }`}
            >
              Semua ({materials.length})
            </button>
            <button
              onClick={() => setStatusFilter('under_review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'under_review' ? 'bg-amber-600 text-white shadow-xs' : 'text-[#6B675F] hover:text-amber-700'
              }`}
            >
              Review ({underReviewCount})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'published' ? 'bg-[#284230] text-white shadow-xs' : 'text-[#6B675F] hover:text-[#284230]'
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-[#6B675F] hover:text-rose-700'
              }`}
            >
              Ditolak ({rejectedCount})
            </button>
          </div>

          <div className="flex rounded-xl bg-[#FAF7F1] p-1 border border-[rgba(42,40,35,0.08)]">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-[#3F5A46] text-white' : 'text-[#6B675F]'
              }`}
            >
              Semua Tipe
            </button>
            <button
              onClick={() => setTypeFilter('modul')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'modul' ? 'bg-[#3F5A46] text-white' : 'text-[#6B675F]'
              }`}
            >
              Modul Ajar
            </button>
            <button
              onClick={() => setTypeFilter('lembar_kerja')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'lembar_kerja' ? 'bg-[#3F5A46] text-white' : 'text-[#6B675F]'
              }`}
            >
              Lembar Kerja (LKPD)
            </button>
          </div>
        </div>

        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#6B675F] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, mapel, atau nama tutor..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] rounded-xl text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
          />
        </div>
      </div>

      {/* Materials Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-3xl border border-dashed border-[rgba(42,40,35,0.15)] text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#f6f3ed] flex items-center justify-center text-[#6B675F]">
              <span className="material-symbols-outlined text-2xl">content_paste_off</span>
            </div>
            <p className="text-sm font-bold text-[#1c1c18]">Tidak ada materi dalam kriteria ini</p>
            <p className="text-xs text-[#6B675F]">
              Semua materi telah diproses atau sesuaikan filter pencarian di atas.
            </p>
          </div>
        ) : (
          filteredMaterials.map((item) => {
            const isUnderReview = item.status === 'under_review';
            const isPublished = item.status === 'published';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 shadow-xs border flex flex-col justify-between gap-4 transition-all hover:shadow-md ${
                  isUnderReview
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : isRejected
                    ? 'border-rose-200'
                    : 'border-[rgba(42,40,35,0.08)]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'modul'
                          ? 'bg-[#c8ebce] text-[#284230]'
                          : 'bg-[#EFC9AE]/50 text-[#C1683F]'
                      }`}
                    >
                      {item.type === 'modul' ? 'Modul Ajar Universal' : 'Lembar Kerja (LKPD)'}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isUnderReview
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          : isPublished
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {isUnderReview ? 'hourglass_top' : isPublished ? 'verified' : 'cancel'}
                      </span>
                      <span>
                        {isUnderReview ? 'Under Review' : isPublished ? 'Published' : 'Ditolak'}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#1c1c18] line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#6B675F] mt-1">
                      <span className="font-semibold text-[#284230]">{item.subject}</span>
                      <span>•</span>
                      <span>{item.level}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#6B675F] line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Rejection Reason box if rejected */}
                  {isRejected && item.rejectionReason && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-rose-800">
                        <span className="material-symbols-outlined text-[15px]">info</span>
                        <span>Catatan Penolakan / Revisi:</span>
                      </div>
                      <p className="italic">"{item.rejectionReason}"</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[rgba(42,40,35,0.06)] flex items-center justify-between text-[11px] text-[#6B675F]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      <span>{item.uploadedBy}</span>
                    </span>
                    <span>{item.fileName || 'file.pdf'}</span>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="pt-2 border-t border-[rgba(42,40,35,0.06)] flex items-center gap-2">
                  {isUnderReview ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(item)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        data-testid="btn-reject-material"
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectionReason('');
                        }}
                        className="py-2 px-3 rounded-xl bg-white border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50 flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Tolak</span>
                      </button>
                    </>
                  ) : isRejected ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(item)}
                      className="w-full py-2 px-3 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] text-[#284230] hover:bg-[#284230] hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">undo</span>
                      <span>Batalkan Penolakan &amp; Setujui</span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">public</span>
                        <span>Tersedia Universal</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectionReason('');
                        }}
                        className="text-xs text-rose-700 hover:underline cursor-pointer"
                      >
                        Tarik / Tolak
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
