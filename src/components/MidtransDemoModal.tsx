import React, { useState } from 'react';
import { SubmittedRegistration } from '../types';
import {
  X,
  QrCode,
  CheckCircle2,
  Building,
  CreditCard,
  Wallet,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface MidtransDemoModalProps {
  submission: SubmittedRegistration | null;
  onClose: () => void;
}

type PaymentMethod = 'qris' | 'bca_va' | 'mandiri_va' | 'gopay';

export const MidtransDemoModal: React.FC<MidtransDemoModalProps> = ({
  submission,
  onClose,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('qris');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);

  if (!submission) return null;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    // Simulate webhook response from Midtrans Snap
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="max-w-md w-full rounded-[26px] bg-white border border-[rgba(42,40,35,0.1)] shadow-2xl overflow-hidden relative">
        {/* Midtrans Header */}
        <div className="bg-[#1C2C39] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0091FF] flex items-center justify-center font-bold text-xs">
              M
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide">Midtrans Snap</div>
              <div className="text-[10px] text-gray-300">Secure Payment Gateway</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="p-5 bg-[#FAF7F1] border-b border-[rgba(42,40,35,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Bright Future"
              className="w-10 h-10 rounded-full object-cover shadow-xs border border-[#C1683F]/20 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-[10px] text-[#6B675F] font-bold uppercase">Bright Future Bimbel</div>
              <div className="text-xs font-semibold text-[#2A2823]">
                SPP Bulan Pertama • {submission.studentName}
              </div>
              <div className="text-[11px] text-[#6F8F76] font-mono mt-0.5">
                {submission.invoiceNumber}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#6B675F]">Total Bayar:</div>
            <div className="text-lg font-extrabold text-[#C1683F]">
              Rp {submission.totalAmount.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Modal Body: Payment Selection or Paid State */}
        {!isPaid ? (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#2A2823] uppercase mb-2">
                Pilih Saluran Pembayaran Instan
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('qris')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    method === 'qris'
                      ? 'border-[#3F5A46] bg-[#EAF2ED] text-[#3F5A46]'
                      : 'border-[rgba(42,40,35,0.1)] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <QrCode className="w-5 h-5 shrink-0 text-[#3F5A46]" />
                  <div>
                    <div className="text-xs font-bold">QRIS</div>
                    <div className="text-[10px] text-[#6B675F]">GoPay, OVO, BCA</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('bca_va')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    method === 'bca_va'
                      ? 'border-[#3F5A46] bg-[#EAF2ED] text-[#3F5A46]'
                      : 'border-[rgba(42,40,35,0.1)] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <Building className="w-5 h-5 shrink-0 text-[#3F5A46]" />
                  <div>
                    <div className="text-xs font-bold">BCA VA</div>
                    <div className="text-[10px] text-[#6B675F]">Virtual Account</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('mandiri_va')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    method === 'mandiri_va'
                      ? 'border-[#3F5A46] bg-[#EAF2ED] text-[#3F5A46]'
                      : 'border-[rgba(42,40,35,0.1)] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <Building className="w-5 h-5 shrink-0 text-[#3F5A46]" />
                  <div>
                    <div className="text-xs font-bold">Mandiri VA</div>
                    <div className="text-[10px] text-[#6B675F]">Virtual Account</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('gopay')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    method === 'gopay'
                      ? 'border-[#3F5A46] bg-[#EAF2ED] text-[#3F5A46]'
                      : 'border-[rgba(42,40,35,0.1)] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <Wallet className="w-5 h-5 shrink-0 text-[#3F5A46]" />
                  <div>
                    <div className="text-xs font-bold">GoPay</div>
                    <div className="text-[10px] text-[#6B675F]">E-Wallet Instan</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Simulated Payment Instructions */}
            <div className="p-4 rounded-xl bg-white border border-[rgba(42,40,35,0.1)] space-y-2 text-center">
              {method === 'qris' ? (
                <div>
                  <div className="inline-block p-3 bg-white border border-[rgba(42,40,35,0.1)] rounded-xl shadow-xs">
                    <QrCode className="w-32 h-32 text-[#2A2823] mx-auto" />
                  </div>
                  <div className="text-[11px] text-[#6B675F] mt-2">
                    Scan kode QRIS menggunakan m-Banking atau aplikasi e-wallet apa saja
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] text-[#6B675F] uppercase font-bold">Nomor Virtual Account</div>
                  <div className="text-base font-mono font-bold text-[#3F5A46] tracking-wider my-1">
                    8801 2026 0984 9281
                  </div>
                  <div className="text-[11px] text-[#6B675F]">
                    Buka m-Banking &gt; Transfer Virtual Account &gt; Masukkan nominal tagihan
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSimulatePayment}
              className="w-full py-3 rounded-xl bg-[#0091FF] hover:bg-[#007AE6] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memverifikasi Webhook Midtrans...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Simulasi Selesaikan Pembayaran</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Payment Success Confirmation */
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#3F5A46]" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAF2ED] text-[#3F5A46] text-[10px] font-bold uppercase">
                Status: Lunas (Verified by Webhook)
              </span>
              <h3 className="text-xl font-bold text-[#2A2823] mt-2 font-display">
                Pembayaran Sukses!
              </h3>
              <p className="text-xs text-[#6B675F] mt-1">
                Webhook Midtrans berhasil disinkronkan ke database Bright Future. Invoice{' '}
                <span className="font-mono font-semibold">{submission.invoiceNumber}</span> telah
                dinyatakan lunas.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F1] text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Siswa:</span>
                <span className="font-semibold text-[#2A2823]">{submission.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Metode:</span>
                <span className="font-semibold text-[#2A2823]">{method.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Waktu Pelunasan:</span>
                <span className="font-semibold text-[#2A2823]">
                  {new Date().toLocaleTimeString('id-ID')} WIB
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#3F5A46] hover:bg-[#3F5A46]/90 text-white text-xs font-bold cursor-pointer"
            >
              Tutup Jendela Pembayaran
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
