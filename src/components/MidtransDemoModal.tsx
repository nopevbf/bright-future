import React, { useState, useEffect, useCallback } from 'react';
import { SubmittedRegistration } from '../types';
import {
  X,
  QrCode,
  CheckCircle2,
  Building,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  updateRegistrationStatusInFirestore,
  updateInvoiceStatusInFirestore,
  subscribeToInvoice,
} from '../firebase';
import { CoreChargeResult } from '../utils/midtransService';

interface MidtransDemoModalProps {
  submission: SubmittedRegistration | null;
  onClose: () => void;
  onPaymentSuccess?: (orderId: string) => void;
}

type PaymentMethodType = 'qris' | 'bca_va' | 'bri_va' | 'mandiri_va';

export const MidtransDemoModal: React.FC<MidtransDemoModalProps> = ({
  submission,
  onClose,
  onPaymentSuccess,
}) => {
  const [activeMethod, setActiveMethod] = useState<PaymentMethodType>('qris');
  const [chargeData, setChargeData] = useState<Record<string, CoreChargeResult>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);

  const invoiceNumber = submission?.invoiceNumber || '';

  // Real-time Firestore Invoice Status Listener
  useEffect(() => {
    if (!invoiceNumber) return;

    const unsubscribe = subscribeToInvoice(invoiceNumber, (invDoc) => {
      if (invDoc && invDoc.status === 'LUNAS') {
        setIsPaid(true);
        setIsProcessing(false);
        onPaymentSuccess?.(invoiceNumber);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [invoiceNumber, onPaymentSuccess]);

  // Request Charge details from Midtrans Core API
  const fetchChargeDetails = useCallback(
    async (method: PaymentMethodType) => {
      if (!submission) return;

      // Return cached charge data if already fetched
      if (chargeData[method]) return;

      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch('/api/midtrans/charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: submission.invoiceNumber,
            grossAmount: submission.totalAmount,
            paymentMethod: method,
            customerDetails: {
              firstName: submission.studentName,
              phone: submission.whatsapp,
            },
            itemDetails: [
              {
                id: submission.studentId || 'BIMBEL-SPP',
                name: `SPP Bimbel (${submission.level?.toUpperCase() || 'SD'})`,
                price: submission.totalAmount,
                quantity: 1,
              },
            ],
          }),
        });

        const data = await res.json();

        if (!res.ok || data.status === 'error') {
          throw new Error(data.message || 'Gagal membuat tagihan pembayaran Midtrans');
        }

        setChargeData((prev) => ({
          ...prev,
          [method]: data,
        }));
      } catch (err) {
        console.error('[Midtrans Modal] Error fetching charge:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat kode pembayaran');
      } finally {
        setIsLoading(false);
      }
    },
    [chargeData, submission]
  );

  // Fetch initial payment method data on mount or method switch
  useEffect(() => {
    if (submission) {
      fetchChargeDetails(activeMethod);
    }
  }, [activeMethod, fetchChargeDetails, submission]);

  if (!submission) return null;

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const markPaymentCompleted = async (paymentChannel: string) => {
    setIsPaid(true);
    setIsProcessing(false);

    try {
      if (submission.studentId) {
        await updateRegistrationStatusInFirestore(submission.studentId, 'paid');
      }
      if (submission.invoiceNumber) {
        await updateInvoiceStatusInFirestore(submission.invoiceNumber, 'LUNAS');
      }
      onPaymentSuccess?.(submission.invoiceNumber);
    } catch (err) {
      console.warn('[MidtransModal] Firestore sync warning:', err);
    }
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      markPaymentCompleted(activeMethod.toUpperCase());
    }, 1000);
  };

  const currentCharge = chargeData[activeMethod];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="max-w-md w-full rounded-[26px] bg-white border border-[rgba(42,40,35,0.1)] shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Midtrans Direct Header */}
        <div className="bg-[#1C2C39] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0091FF] flex items-center justify-center font-bold text-xs text-white shadow-xs">
              M
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                <span>Pembayaran Midtrans Real-time</span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                  Sandbox
                </span>
              </div>
              <div className="text-[10px] text-gray-300">
                Direct In-App Checkout • Otomatis Lunas
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="p-4 sm:p-5 bg-[#FAF7F1] border-b border-[rgba(42,40,35,0.06)] flex items-center justify-between">
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
            <div className="text-[10px] text-[#6B675F]">Total Tagihan:</div>
            <div className="text-lg font-extrabold text-[#C1683F]">
              Rp {submission.totalAmount.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Modal Body: Active Payment Display or Paid State */}
        {!isPaid ? (
          <div className="p-5 sm:p-6 space-y-4">
            {/* 4 Method Selection Buttons */}
            <div>
              <label className="block text-xs font-bold text-[#2A2823] uppercase mb-2">
                Pilih Metode Pembayaran Midtrans
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. QRIS */}
                <button
                  type="button"
                  onClick={() => setActiveMethod('qris')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeMethod === 'qris'
                      ? 'border-[#3F5A46] bg-[#EAF2ED] text-[#3F5A46] shadow-xs'
                      : 'border-[rgba(42,40,35,0.1)] hover:bg-[#FAF7F1] text-[#2A2823]'
                  }`}
                >
                  <QrCode className="w-5 h-5 shrink-0 text-[#3F5A46]" />
                  <div>
                    <div className="text-xs font-bold">QRIS</div>
                    <div className="text-[10px] text-[#6B675F]">GoPay, OVO, Dana</div>
                  </div>
                </button>

                {/* 2. BCA VA */}
                <button
                  type="button"
                  onClick={() => setActiveMethod('bca_va')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeMethod === 'bca_va'
                      ? 'border-[#3F5A46] bg-[#EAF2ED] text-[#3F5A46] shadow-xs'
                      : 'border-[rgba(42,40,35,0.1)] hover:bg-[#FAF7F1] text-[#2A2823]'
                  }`}
                >
                  <Building className="w-5 h-5 shrink-0 text-[#3F5A46]" />
                  <div>
                    <div className="text-xs font-bold">BCA VA</div>
                    <div className="text-[10px] text-[#6B675F]">Virtual Account</div>
                  </div>
                </button>

                {/* 3. BRI VA */}
                <button
                  type="button"
                  onClick={() => setActiveMethod('bri_va')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeMethod === 'bri_va'
                      ? 'border-[#3F5A46] bg-[#EAF2ED] text-[#3F5A46] shadow-xs'
                      : 'border-[rgba(42,40,35,0.1)] hover:bg-[#FAF7F1] text-[#2A2823]'
                  }`}
                >
                  <Building className="w-5 h-5 shrink-0 text-[#3F5A46]" />
                  <div>
                    <div className="text-xs font-bold">BRI VA</div>
                    <div className="text-[10px] text-[#6B675F]">BRIVA</div>
                  </div>
                </button>

                {/* 4. Mandiri VA */}
                <button
                  type="button"
                  onClick={() => setActiveMethod('mandiri_va')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeMethod === 'mandiri_va'
                      ? 'border-[#3F5A46] bg-[#EAF2ED] text-[#3F5A46] shadow-xs'
                      : 'border-[rgba(42,40,35,0.1)] hover:bg-[#FAF7F1] text-[#2A2823]'
                  }`}
                >
                  <CreditCard className="w-5 h-5 shrink-0 text-[#3F5A46]" />
                  <div>
                    <div className="text-xs font-bold">Mandiri VA</div>
                    <div className="text-[10px] text-[#6B675F]">Bill Payment</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Content Display Card */}
            <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] min-h-[220px] flex flex-col justify-center items-center text-center relative">
              {isLoading ? (
                <div className="py-8 space-y-2 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#3F5A46] animate-spin" />
                  <p className="text-xs font-semibold text-[#2A2823]">
                    Menghubungi Midtrans Gateway...
                  </p>
                  <p className="text-[10px] text-[#6B675F]">Mengambil kode pembayaran resmi real-time</p>
                </div>
              ) : errorMsg ? (
                <div className="py-6 space-y-3">
                  <p className="text-xs font-bold text-red-600">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={() => fetchChargeDetails(activeMethod)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-[#2A2823] hover:bg-gray-50 flex items-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Lagi</span>
                  </button>
                </div>
              ) : activeMethod === 'qris' ? (
                /* QRIS Card */
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2A2823] px-1">
                    <span>Scan QRIS Resmi</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Berlaku 15-30 Menit
                    </span>
                  </div>

                  <div className="inline-block p-3 bg-white border border-[rgba(42,40,35,0.12)] rounded-2xl shadow-sm">
                    {currentCharge?.qrCodeUrl ? (
                      <img
                        src={currentCharge.qrCodeUrl}
                        alt="QRIS Midtrans"
                        className="w-44 h-44 object-contain mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="w-44 h-44 bg-gray-50 rounded-lg flex flex-col items-center justify-center p-3 text-center">
                        <QrCode className="w-20 h-20 text-[#2A2823] mb-1" />
                        <span className="text-[10px] font-mono font-bold text-[#2A2823]">
                          QRIS READY
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-[#6B675F] max-w-xs mx-auto leading-relaxed">
                    Buka GoPay, OVO, DANA, ShopeePay, BCA Mobile, Livin' Mandiri, BRImo, atau m-Banking Anda, lalu arahkan kamera ke QRIS di atas.
                  </p>
                </div>
              ) : activeMethod === 'bca_va' ? (
                /* BCA VA Card */
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2A2823]">
                    <span>Bank Central Asia (BCA)</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Virtual Account
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[rgba(42,40,35,0.12)] space-y-2">
                    <div className="text-[10px] text-[#6B675F] uppercase font-bold">
                      Nomor BCA Virtual Account
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base sm:text-lg font-black text-[#2A2823] tracking-wider select-all">
                        {currentCharge?.vaNumber || '7001281234567890'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentCharge?.vaNumber || '7001281234567890', 'bca')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F1] hover:bg-[#eae6dc] text-[11px] font-bold text-[#2A2823] border border-gray-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'bca' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#6B675F]" />
                            <span>Salin Nomor VA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-[10.5px] text-[#6B675F] space-y-1 bg-white/60 p-2.5 rounded-xl border border-gray-200/60">
                    <div className="font-bold text-[#2A2823]">Panduan Transfer m-BCA / KlikBCA:</div>
                    <p>1. Buka m-BCA &gt; Pilih <strong>m-Transfer</strong> &gt; <strong>BCA Virtual Account</strong>.</p>
                    <p>2. Masukkan nomor VA di atas &gt; Konfirmasi nama siswa &amp; nominal bayar.</p>
                  </div>
                </div>
              ) : activeMethod === 'bri_va' ? (
                /* BRI VA Card */
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2A2823]">
                    <span>Bank Rakyat Indonesia (BRI)</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      BRIVA
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[rgba(42,40,35,0.12)] space-y-2">
                    <div className="text-[10px] text-[#6B675F] uppercase font-bold">
                      Nomor BRI Virtual Account (BRIVA)
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base sm:text-lg font-black text-[#2A2823] tracking-wider select-all">
                        {currentCharge?.vaNumber || '8578000012345678'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentCharge?.vaNumber || '8578000012345678', 'bri')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F1] hover:bg-[#eae6dc] text-[11px] font-bold text-[#2A2823] border border-gray-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'bri' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#6B675F]" />
                            <span>Salin Nomor VA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-[10.5px] text-[#6B675F] space-y-1 bg-white/60 p-2.5 rounded-xl border border-gray-200/60">
                    <div className="font-bold text-[#2A2823]">Panduan Transfer BRImo / ATM BRI:</div>
                    <p>1. Buka BRImo &gt; Pilih <strong>Tagihan</strong> &gt; <strong>BRIVA</strong>.</p>
                    <p>2. Masukkan nomor BRIVA di atas &gt; Konfirmasi transaksi hingga selesai.</p>
                  </div>
                </div>
              ) : (
                /* Mandiri VA (Bill Payment) Card */
                <div className="w-full space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2A2823]">
                    <span>Bank Mandiri</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Bill Payment
                    </span>
                  </div>

                  {/* Biller Code */}
                  <div className="p-2.5 bg-white rounded-xl border border-[rgba(42,40,35,0.12)] flex items-center justify-between">
                    <div>
                      <div className="text-[9.5px] text-[#6B675F] uppercase font-bold">Kode Perusahaan (Biller Code)</div>
                      <div className="font-mono text-sm font-black text-[#2A2823]">
                        {currentCharge?.billerCode || '70012'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentCharge?.billerCode || '70012', 'mandiri_biller')}
                      className="px-2 py-1 rounded bg-[#FAF7F1] text-[10px] font-bold text-[#2A2823] border border-gray-300 cursor-pointer"
                    >
                      {copiedKey === 'mandiri_biller' ? '✓ Tersalin' : 'Salin Biller Code'}
                    </button>
                  </div>

                  {/* Bill Key */}
                  <div className="p-2.5 bg-white rounded-xl border border-[rgba(42,40,35,0.12)] flex items-center justify-between">
                    <div>
                      <div className="text-[9.5px] text-[#6B675F] uppercase font-bold">Nomor Pelanggan (Bill Key)</div>
                      <div className="font-mono text-sm font-black text-[#2A2823]">
                        {currentCharge?.billKey || '990001234567'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentCharge?.billKey || '990001234567', 'mandiri_key')}
                      className="px-2 py-1 rounded bg-[#FAF7F1] text-[10px] font-bold text-[#2A2823] border border-gray-300 cursor-pointer"
                    >
                      {copiedKey === 'mandiri_key' ? '✓ Tersalin' : 'Salin Bill Key'}
                    </button>
                  </div>

                  <div className="text-[10px] text-[#6B675F] space-y-0.5 bg-white/60 p-2 rounded-xl border border-gray-200/60">
                    <p>Buka Livin' Mandiri &gt; <strong>Bayar</strong> &gt; <strong>Multipayment</strong> &gt; Cari <strong>70012 (Midtrans)</strong> &gt; Masukkan Bill Key.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sandbox Testing Link & Quick Simulation */}
            <div className="pt-1 space-y-2">
              <a
                href="https://simulator.sandbox.midtrans.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#007AE6] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200 cursor-pointer"
              >
                <span>Buka Simulator Midtrans Sandbox (Testing)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSimulatePayment}
                className="w-full py-2.5 rounded-xl bg-[#3F5A46] hover:bg-[#2e4233] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memverifikasi Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulasi Bayar Lunas Sekarang</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-center text-[#6B675F]">
              Status pembayaran akan otomatis terverifikasi begitu Anda menyelesaikan transaksi di m-Banking atau Simulator.
            </p>
          </div>
        ) : (
          /* Success / Paid State */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#2A2823]">
                Pembayaran Sukses Terverifikasi!
              </h3>
              <p className="text-xs text-[#6B675F] mt-1">
                Tagihan {submission.invoiceNumber} sebesar Rp {submission.totalAmount.toLocaleString('id-ID')} telah lunas via Midtrans Gateway.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Status Transaksi:</span>
                <span className="font-bold text-emerald-700">LUNAS (Settlement)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Metode:</span>
                <span className="font-bold text-[#2A2823]">{activeMethod.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Siswa:</span>
                <span className="font-bold text-[#2A2823]">{submission.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Waktu:</span>
                <span className="font-mono text-[11px] text-[#2A2823]">
                  {new Date().toLocaleTimeString('id-ID')} WIB
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#3F5A46] hover:bg-[#2e4233] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Selesai &amp; Kembali ke Halaman Utama
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
