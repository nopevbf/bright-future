import React, { useState } from 'react';
import { FirestoreRegistrationDoc } from '../../firebase';

interface StudentVerificationSubTabProps {
  registrations: FirestoreRegistrationDoc[];
  isLoading: boolean;
  onRefresh: () => void;
  onVerify: (studentId: string) => Promise<void>;
  onViewDetail: (item: FirestoreRegistrationDoc) => void;
  onPrintSlip: (item: FirestoreRegistrationDoc) => void;
}

export const StudentVerificationSubTab: React.FC<StudentVerificationSubTabProps> = ({
  registrations,
  isLoading,
  onRefresh,
  onVerify,
  onViewDetail,
  onPrintSlip,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'pending' | 'verified'>('semua');
  const [levelFilter, setLevelFilter] = useState<string>('semua');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Computed metrics
  const totalRegistrations = registrations.length;
  const pendingRegistrations = registrations.filter((r) => r.paymentStatus === 'pending');
  const verifiedRegistrations = registrations.filter((r) => r.paymentStatus === 'verified');
  const totalNominal = registrations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  // Filtered registrations
  const filteredList = registrations.filter((item) => {
    const matchesSearch =
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.whatsapp.includes(searchQuery) ||
      item.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.homeAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'semua'
        ? true
        : statusFilter === 'pending'
        ? item.paymentStatus === 'pending'
        : item.paymentStatus === 'verified';

    const matchesLevel =
      levelFilter === 'semua'
        ? true
        : item.level.toLowerCase() === levelFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleQuickVerify = async (studentId: string) => {
    setVerifyingId(studentId);
    try {
      await onVerify(studentId);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleVerifyAllPending = async () => {
    if (pendingRegistrations.length === 0) return;
    const confirmAll = window.confirm(
      `Verifikasi sekaligus ${pendingRegistrations.length} pendaftaran calon siswa baru yang berstatus pending?`
    );
    if (!confirmAll) return;

    for (const item of pendingRegistrations) {
      await onVerify(item.studentId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2A2823]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-bold text-[#6B675F]">
              Google Cloud Firestore Connected
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A2823] mt-1">
            Sub Menu: Verifikasi Pendaftaran Siswa
          </h2>
          <p className="text-xs sm:text-sm text-[#6B675F]">
            Validasi formulir pendaftaran baru yang dikirim calon wali murid melalui website publik Bright Future.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white text-[#284230] border border-[#2A2823]/10 text-xs font-bold shadow-xs hover:bg-[#ebe8e2] cursor-pointer inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Muat ulang data dari Cloud Firestore"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isLoading ? 'Menyinkronkan...' : 'Muat Ulang Firestore'}</span>
          </button>

          {pendingRegistrations.length > 0 && (
            <button
              onClick={handleVerifyAllPending}
              className="px-3.5 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold shadow-xs hover:bg-[#3F5A46] cursor-pointer inline-flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              <span>Verifikasi Semua Pending ({pendingRegistrations.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Masuk */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B675F]">
              Total Pendaftaran
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2A2823]">
              {totalRegistrations}
            </div>
            <span className="text-[11px] text-[#6B675F] block">Live di Cloud Firestore</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#f0eee8] text-[#284230] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">app_registration</span>
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Menunggu Verifikasi
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-center gap-2">
              <span>{pendingRegistrations.length}</span>
              {pendingRegistrations.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Butuh Tindakan
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#6B675F] block">Pendaftar baru belum disetujui</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EFC9AE]/70 text-[#6b2702] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">pending_actions</span>
          </div>
        </div>

        {/* Terverifikasi */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#284230]">
              Telah Diverifikasi
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#284230]">
              {verifiedRegistrations.length}
            </div>
            <span className="text-[11px] text-[#6B675F] block">Siap dialokasikan ke tutor</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#c8ebce] text-[#284230] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
        </div>

        {/* Akumulasi SPP */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B675F]">
              Akumulasi Tagihan SPP
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-[#3F5A46] truncate">
              Rp {totalNominal.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-[#6B675F] block">Paket 8 sesi per siswa</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EFC9AE]/50 text-[#C1683F] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#6B675F] text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama siswa, nama wali, WhatsApp, nomor invoice, atau alamat..."
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

          {/* Level Filter Dropdown */}
          <div className="flex items-center gap-2">
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
              Semua ({totalRegistrations})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Menunggu Verifikasi ({pendingRegistrations.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'verified'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Terverifikasi ({verifiedRegistrations.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-[#6B675F]">
            Menampilkan <span className="font-bold text-[#2A2823]">{filteredList.length}</span> dari {totalRegistrations} pendaftaran
          </span>
        </div>
      </div>

      {/* Main Registrations Table */}
      <div className="bg-white rounded-3xl border border-[#2A2823]/10 shadow-sm overflow-hidden">
        <div className="p-4 bg-[#f0eee8]/50 border-b border-[#2A2823]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h3 className="font-bold text-sm text-[#2A2823]">
              Tabel Antrean Verifikasi Pendaftaran Siswa
            </h3>
          </div>
          <span className="text-xs text-[#6B675F]">
            Klik tombol &quot;Verifikasi&quot; untuk mengaktifkan akun siswa ke database
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F1] text-[#6B675F] uppercase font-bold text-[10px] border-b border-[#2A2823]/10">
              <tr>
                <th className="py-3 px-4">No. Siswa &amp; Waktu</th>
                <th className="py-3 px-4">Calon Siswa &amp; Jenjang</th>
                <th className="py-3 px-4">Wali &amp; Kontak WA</th>
                <th className="py-3 px-4">Alamat Kunjungan</th>
                <th className="py-3 px-4">Pilihan Hari</th>
                <th className="py-3 px-4">Tagihan SPP</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2823]/8">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#6B675F]">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[28px] animate-spin text-[#284230]">
                          sync
                        </span>
                        <p className="font-semibold text-[#2A2823]">
                          Mengambil data pendaftaran dari Google Cloud Firestore...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                        <span className="material-symbols-outlined text-[36px] text-[#6B675F]/50">
                          inbox
                        </span>
                        <p className="font-bold text-[#2A2823]">Tidak ada data pendaftaran yang sesuai</p>
                        <p className="text-[11px] text-[#6B675F]">
                          Cobalah sesuaikan kata kunci pencarian atau filter status di atas. Formulir yang diisi di halaman depan akan otomatis masuk ke sini secara langsung.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isVerified = item.paymentStatus === 'verified';
                  const dateStr = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Baru saja';

                  return (
                    <tr
                      key={item.studentId}
                      className={`hover:bg-[#FAF7F1]/80 transition-colors ${
                        !isVerified ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-[#284230] text-xs">
                          {item.studentId}
                        </div>
                        <div className="text-[10px] text-[#6B675F] mt-0.5">{dateStr}</div>
                        <div className="text-[9px] text-[#6B675F] font-mono">{item.invoiceNumber}</div>
                      </td>

                      {/* Student & Level */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2A2823] text-xs sm:text-sm">
                          {item.studentName}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                              item.level === 'sd'
                                ? 'bg-amber-100 text-amber-900'
                                : item.level === 'calistung'
                                ? 'bg-rose-100 text-rose-900'
                                : item.level === 'smp'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {item.level.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Parent & WA */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2A2823]">{item.parentName}</div>
                        <a
                          href={`https://wa.me/${item.whatsapp.replace(/[^0-9]/g, '')}?text=Halo%20Bapak%2FIbu%20${encodeURIComponent(
                            item.parentName
                          )}%2C%20kami%20dari%20Bright%20Future%20Learning%20Center%20Kabupaten%20Magelang.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#25D366] font-bold hover:underline mt-0.5"
                        >
                          <span className="material-symbols-outlined text-[13px]">chat</span>
                          <span>{item.whatsapp}</span>
                        </a>
                      </td>

                      {/* Home Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[#2A2823] line-clamp-2 leading-relaxed" title={item.homeAddress}>
                          {item.homeAddress}
                        </p>
                      </td>

                      {/* Selected Schedule */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {item.selectedSchedule && item.selectedSchedule.length > 0 ? (
                            item.selectedSchedule.map((day, dIdx) => (
                              <span
                                key={dIdx}
                                className="px-1.5 py-0.5 rounded bg-[#f0eee8] text-[#2A2823] text-[10px] font-semibold"
                              >
                                {day}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#6B675F] text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Amount & Sibling Discount */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#3F5A46] text-xs">
                          Rp {item.totalAmount.toLocaleString('id-ID')}
                        </div>
                        {item.appliedDiscount > 0 && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-[#EFC9AE] text-[#6b2702] text-[9px] font-bold">
                            Diskon Saudara 10%
                          </span>
                        )}
                        <div className="text-[10px] text-[#6B675F]">8 Sesi Kunjungan</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isVerified
                              ? 'bg-[#c8ebce] text-[#284230]'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {isVerified ? 'check_circle' : 'pending'}
                          </span>
                          <span>{isVerified ? 'TERVERIFIKASI' : 'MENUNGGU'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Verify Button */}
                          {!isVerified && (
                            <button
                              onClick={() => handleQuickVerify(item.studentId)}
                              disabled={verifyingId === item.studentId}
                              className="px-2.5 py-1 rounded-lg bg-[#284230] text-white font-bold text-[10px] hover:bg-[#3F5A46] cursor-pointer shadow-xs transition-all disabled:opacity-50 inline-flex items-center gap-1"
                              title="Setujui dan Verifikasi Pendaftaran"
                            >
                              {verifyingId === item.studentId ? (
                                <span className="material-symbols-outlined text-[12px] animate-spin">
                                  sync
                                </span>
                              ) : (
                                <span className="material-symbols-outlined text-[12px]">check</span>
                              )}
                              <span>Verifikasi</span>
                            </button>
                          )}

                          {/* Detail Button */}
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-1.5 rounded-lg bg-[#f0eee8] text-[#2A2823] hover:bg-[#ebe8e2] cursor-pointer transition-all"
                            title="Lihat Detail Lengkap Pendaftaran"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>

                          {/* Print Slip Button */}
                          <button
                            onClick={() => onPrintSlip(item)}
                            className="p-1.5 rounded-lg bg-white border border-[#2A2823]/15 text-[#3F5A46] hover:bg-[#FAF7F1] cursor-pointer transition-all"
                            title="Cetak Bukti Pendaftaran"
                          >
                            <span className="material-symbols-outlined text-[16px]">print</span>
                          </button>

                          {/* WhatsApp Official Confirm Button */}
                          <a
                            href={`https://wa.me/${item.whatsapp.replace(/[^0-9]/g, '')}?text=Halo%20Bapak%2FIbu%20${encodeURIComponent(
                              item.parentName
                            )}%2C%20selamat!%20Pendaftaran%20les%20privat%20Bright%20Future%20untuk%20Ananda%20${encodeURIComponent(
                              item.studentName
                            )}%20(No.%20${item.studentId})%20telah%20terverifikasi.%20Tim%20akademik%20kami%20akan%20segera%20mengaturkan%20tutor%20ke%20alamat%20rumah.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366] text-white hover:bg-emerald-600 cursor-pointer transition-all"
                            title="Kirim Konfirmasi via WhatsApp"
                          >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                          </a>
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
