import React from 'react';
import { FirestoreRegistrationDoc } from '../../firebase';

interface RegistrationSlipModalProps {
  registration: FirestoreRegistrationDoc | null;
  onClose: () => void;
  onVerify?: (studentId: string) => void;
}

export const RegistrationSlipModal: React.FC<RegistrationSlipModalProps> = ({
  registration,
  onClose,
  onVerify,
}) => {
  if (!registration) return null;

  const isVerified = registration.paymentStatus === 'verified';
  const formattedDate = registration.createdAt
    ? new Date(registration.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Baru saja';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-[#2A2823]/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-[#f0eee8]/80 border-b border-[#2A2823]/10 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#284230] text-[20px]">
              receipt_long
            </span>
            <span className="font-bold text-xs text-[#2A2823]">
              Bukti Pendaftaran &amp; Slip Verifikasi Siswa
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#2A2823]/15 text-[#284230] font-bold text-xs hover:bg-[#FAF7F1] cursor-pointer inline-flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white text-[#6B675F] hover:text-[#2A2823] hover:bg-[#ebe8e2] flex items-center justify-center cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Official Slip Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-[#2A2823]">
          {/* Header Kop Surat */}
          <div className="border-b-2 border-[#284230] pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Logo Bright Future"
                className="h-12 w-12 object-contain rounded-xl"
              />
              <div>
                <h1 className="text-base font-extrabold text-[#284230] tracking-wide">
                  BRIGHT FUTURE LEARNING CENTER
                </h1>
                <p className="text-[11px] text-[#6B675F] font-semibold">
                  Bimbel Privat Terakreditasi Kab. Magelang (House-to-House)
                </p>
                <p className="text-[10px] text-[#6B675F]">
                  Secang • Muntilan • Mertoyudan • Mungkid • Borobudur | WA: 0851-7323-0198
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#6B675F] uppercase font-bold block">
                No. Registrasi
              </span>
              <span className="font-mono font-bold text-[#284230] text-sm block">
                {registration.studentId}
              </span>
              <span className="text-[10px] text-[#6B675F] block">{formattedDate} WIB</span>
            </div>
          </div>

          {/* Title Slip */}
          <div className="text-center py-1">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#2A2823]">
              TANDA BUKTI PENDAFTARAN &amp; VERIFIKASI SISWA BARU
            </h2>
            <p className="text-[11px] text-[#6B675F]">
              Invoice Dokumen Resmi: <span className="font-mono font-bold">{registration.invoiceNumber}</span>
            </p>
          </div>

          {/* Student & Parent Info Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F1] border border-[#2A2823]/10">
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-[#6B675F] uppercase font-bold block">
                  Nama Calon Siswa
                </span>
                <span className="text-sm font-bold text-[#2A2823] block">
                  {registration.studentName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B675F] uppercase font-bold block">
                  Jenjang Pendidikan
                </span>
                <span className="font-bold text-[#3F5A46] uppercase block">
                  {registration.level} (SD UMUM Kurikulum Merdeka)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B675F] uppercase font-bold block">
                  Alamat Kunjungan Tutor
                </span>
                <span className="font-semibold text-[#2A2823] block">
                  {registration.homeAddress}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-[#6B675F] uppercase font-bold block">
                  Nama Orang Tua / Wali
                </span>
                <span className="text-sm font-bold text-[#2A2823] block">
                  {registration.parentName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B675F] uppercase font-bold block">
                  Nomor Kontak WhatsApp
                </span>
                <span className="font-bold text-[#284230] block">
                  {registration.whatsapp}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B675F] uppercase font-bold block">
                  Pilihan Hari Belajar
                </span>
                <span className="font-semibold text-[#2A2823] block">
                  {registration.selectedSchedule && registration.selectedSchedule.length > 0
                    ? registration.selectedSchedule.join(', ')
                    : 'Fleksibel'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Sessions Breakdown */}
          <div className="border border-[#2A2823]/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#f0eee8] text-[#6B675F] uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">Deskripsi Layanan Privat</th>
                  <th className="py-2.5 px-4 text-center">Durasi</th>
                  <th className="py-2.5 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2823]/8">
                <tr>
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-[#2A2823] block">
                      Paket 8 Sesi Bulanan (Tatap Muka House-to-House)
                    </span>
                    <span className="text-[10px] text-[#6B675F]">
                      Tutor Guru Privat Terakreditasi • Modul &amp; LKPD Fisik Gratis
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-semibold text-[#6B675F]">
                    70 Menit / Sesi
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-[#2A2823]">
                    Rp {(registration.totalAmount + (registration.appliedDiscount ? (registration.totalAmount * 10) / 90 : 0)).toLocaleString('id-ID')}
                  </td>
                </tr>
                {registration.appliedDiscount > 0 && (
                  <tr className="bg-amber-50/50">
                    <td colSpan={2} className="py-2 px-4 font-bold text-amber-900">
                      Diskon Saudara Kandung (10%)
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-amber-900">
                      - Rp {Math.round((registration.totalAmount * 10) / 90).toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
                <tr className="bg-[#FAF7F1] font-bold text-xs">
                  <td colSpan={2} className="py-3 px-4 text-[#284230] uppercase">
                    Total Biaya SPP Terverifikasi
                  </td>
                  <td className="py-3 px-4 text-right text-base text-[#284230]">
                    Rp {registration.totalAmount.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verification Badge & Signatures */}
          <div className="pt-2 flex items-end justify-between">
            <div className="space-y-1 max-w-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B675F] block">
                Status Verifikasi Sistem
              </span>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs ${
                  isVerified
                    ? 'bg-[#c8ebce] text-[#284230]'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isVerified ? 'verified' : 'hourglass_empty'}
                </span>
                <span>
                  {isVerified
                    ? 'TERVERIFIKASI & TERSIMPAN DI CLOUD FIRESTORE'
                    : 'MENUNGGU VERIFIKASI ADMIN'}
                </span>
              </div>
              <p className="text-[9px] text-[#6B675F] pt-1">
                Dicetak otomatis dari Operational Hub Bright Future Learning Center Magelang.
              </p>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-[#6B675F]">Magelang, {formattedDate.split(',')[0]}</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-[#284230] border-b border-dashed border-[#284230]">
                  [ Terverifikasi Sistem ]
                </span>
              </div>
              <p className="font-bold text-xs text-[#2A2823]">Monica Yuliana, S.Pd., Gr.</p>
              <p className="text-[10px] text-[#6B675F]">Head of Academic &amp; Administration</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#f0eee8]/80 border-t border-[#2A2823]/10 flex items-center justify-between print:hidden">
          {!isVerified && onVerify && (
            <button
              onClick={() => onVerify(registration.studentId)}
              className="px-4 py-2 rounded-xl bg-[#284230] text-white font-bold text-xs hover:bg-[#3F5A46] cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Verifikasi Sekarang</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <a
              href={`https://wa.me/${registration.whatsapp.replace(/[^0-9]/g, '')}?text=Halo%20Bapak%2FIbu%20${encodeURIComponent(
                registration.parentName
              )}%2C%20berikut%20slip%20bukti%20pendaftaran%20les%20privat%20Bright%20Future%20Ananda%20${encodeURIComponent(
                registration.studentName
              )}%20(No.%20${registration.studentId}).`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-emerald-600 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Kirim ke WhatsApp Wali</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#f0eee8] text-[#2A2823] font-bold text-xs hover:bg-[#ebe8e2] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
