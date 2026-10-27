import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SubmittedRegistration } from '../types';
import {
  X,
  QrCode,
  Building,
  CreditCard,
  Store,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  updateRegistrationStatusInFirestore,
  updateInvoiceStatusInFirestore,
  subscribeToInvoice,
} from '../firebase';
import { CoreChargeResult } from '../utils/midtransService';
import { generateAndDownloadInvoicePdf } from '../utils/generateInvoicePdf';
import {
  getMidtransSettings,
  calculateMidtransFee,
  getActivePaymentMethods,
  MidtransSettingsConfig,
} from '../utils/midtransSettings';

interface MidtransDemoModalProps {
  submission: SubmittedRegistration | null;
  onClose: () => void;
  onPaymentSuccess?: (orderId: string) => void;
}

type PaymentMethodType = string;

interface MethodChargeRecord {
  data: CoreChargeResult;
  expiresAt: number; // Timestamp in milliseconds
  isExpired: boolean;
}

const getSessionStorageKey = (invoiceNumber: string) => `bf_midtrans_cache_${invoiceNumber}`;

const loadCachedRecords = (invoiceNumber: string): Record<string, MethodChargeRecord> => {
  if (!invoiceNumber || typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(getSessionStorageKey(invoiceNumber));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MethodChargeRecord>;
    const updated: Record<string, MethodChargeRecord> = {};
    const currentTime = Date.now();
    for (const [key, val] of Object.entries(parsed)) {
      updated[key] = {
        ...val,
        isExpired: val.isExpired || val.expiresAt <= currentTime,
      };
    }
    return updated;
  } catch (e) {
    console.warn('[MidtransModal] Failed to read cached charge records:', e);
    return {};
  }
};

const saveCachedRecords = (invoiceNumber: string, records: Record<string, MethodChargeRecord>) => {
  if (!invoiceNumber || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(getSessionStorageKey(invoiceNumber), JSON.stringify(records));
  } catch (e) {
    console.warn('[MidtransModal] Failed to save cached charge records:', e);
  }
};

export const MidtransDemoModal: React.FC<MidtransDemoModalProps> = ({
  submission,
  onClose,
  onPaymentSuccess,
}) => {
  const invoiceNumber = submission?.invoiceNumber || '';
  const [settings, setSettings] = useState<MidtransSettingsConfig>(() => getMidtransSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getMidtransSettings());
    };
    window.addEventListener('bf_midtrans_settings_updated', handleUpdate);
    return () => window.removeEventListener('bf_midtrans_settings_updated', handleUpdate);
  }, []);

  const activeMethods = getActivePaymentMethods(settings);
  const [activeMethod, setActiveMethod] = useState<PaymentMethodType>(() => {
    const initialMethods = getActivePaymentMethods(getMidtransSettings());
    return initialMethods[0]?.id || 'qris';
  });

  const [chargeRecords, setChargeRecords] = useState<Record<string, MethodChargeRecord>>(() => {
    return loadCachedRecords(invoiceNumber);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  const isFetchingRef = useRef<boolean>(false);

  // Sync active method if current activeMethod is not among enabled methods
  useEffect(() => {
    if (activeMethods.length > 0 && !activeMethods.some((m) => m.id === activeMethod)) {
      setActiveMethod(activeMethods[0].id);
    }
  }, [activeMethods, activeMethod]);

  const feeCalculation = calculateMidtransFee(submission?.totalAmount || 0, settings, activeMethod);

  // Sync state changes to sessionStorage for persistence across modal open/close
  useEffect(() => {
    if (invoiceNumber) {
      saveCachedRecords(invoiceNumber, chargeRecords);
    }
  }, [chargeRecords, invoiceNumber]);

  // Update clock every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Firestore realtime updates for payment status
  useEffect(() => {
    if (!submission?.invoiceNumber) return;

    const unsubscribe = subscribeToInvoice(submission.invoiceNumber, (invoice) => {
      if (invoice && invoice.status === 'LUNAS') {
        setIsPaid(true);
        onPaymentSuccess?.(submission.invoiceNumber);
      }
    });

    return () => unsubscribe();
  }, [submission?.invoiceNumber, onPaymentSuccess]);

  // Lazy Load on-demand Core API Charge
  const fetchChargeDetails = useCallback(
    async (method: PaymentMethodType, forceRefresh = false) => {
      if (!submission) return;

      if (!forceRefresh && chargeRecords[method] && !chargeRecords[method].isExpired) {
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch('/api/midtrans/charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: submission.invoiceNumber,
            grossAmount: feeCalculation.grandTotal,
            paymentMethod: method,
            customerDetails: {
              firstName: submission.studentName,
              phone: submission.whatsapp,
            },
            itemDetails: [
              {
                id: 'SPP',
                name: `SPP ${submission.studentName || 'Siswa'}`,
                price: feeCalculation.baseAmount,
                quantity: 1,
              },
              ...(feeCalculation.feeAmount > 0
                ? [
                    {
                      id: 'MIDTRANS-FEE',
                      name: 'Biaya Layanan Midtrans Gateway',
                      price: feeCalculation.feeAmount,
                      quantity: 1,
                    },
                  ]
                : []),
            ],
          }),
        });

        const data: CoreChargeResult = await res.json();

        if (!res.ok || data.status === 'error') {
          throw new Error(data.message || 'Gagal memuat detail transaksi Midtrans');
        }

        const expiresAt = Date.now() + 15 * 60 * 1000;
        setChargeRecords((prev) => ({
          ...prev,
          [method]: {
            data,
            expiresAt,
            isExpired: false,
          },
        }));
      } catch (err) {
        console.error('[Midtrans Modal] Error fetching charge:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat kode pembayaran');
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [chargeRecords, submission, feeCalculation]
  );

  const currentRecord = chargeRecords[activeMethod];
  const currentCharge = currentRecord?.data;

  const remainingSeconds = currentRecord
    ? Math.max(0, Math.floor((currentRecord.expiresAt - now) / 1000))
    : 15 * 60;

  const isCurrentExpired = Boolean(currentRecord && (currentRecord.isExpired || remainingSeconds <= 0));

  useEffect(() => {
    if (isCurrentExpired && currentRecord && !currentRecord.isExpired) {
      setChargeRecords((prev) => {
        if (!prev[activeMethod]) return prev;
        return {
          ...prev,
          [activeMethod]: {
            ...prev[activeMethod],
            isExpired: true,
          },
        };
      });
    }
  }, [activeMethod, currentRecord, isCurrentExpired]);

  if (!submission) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const countdownFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopy = (text: string, key: string) => {
    if (!text || isCurrentExpired) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setStatusNotice(null);

    const orderIdToCheck = currentCharge?.orderId || submission.invoiceNumber;

    try {
      const res = await fetch(`/api/midtrans/status?order_id=${encodeURIComponent(orderIdToCheck)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengecek status pembayaran');
      }

      if (data.isPaid || data.transactionStatus === 'settlement' || data.transactionStatus === 'capture') {
        setIsPaid(true);
        try {
          if (submission.studentId) {
            await updateRegistrationStatusInFirestore(submission.studentId, 'paid');
          }
          if (submission.invoiceNumber) {
            await updateInvoiceStatusInFirestore(submission.invoiceNumber, 'LUNAS');
          }
        } catch (dbErr) {
          console.warn('[MidtransModal] Firestore sync note:', dbErr);
        }
        onPaymentSuccess?.(submission.invoiceNumber);
      } else if (data.transactionStatus === 'expire') {
        setStatusNotice('Transaksi sebelumnya telah kedaluwarsa di sistem Midtrans. Silakan tekan tombol "Buat Kode Pembayaran Baru" untuk memperbarui.');
        setChargeRecords((prev) => {
          if (!prev[activeMethod]) return prev;
          return {
            ...prev,
            [activeMethod]: {
              ...prev[activeMethod],
              isExpired: true,
            },
          };
        });
      } else {
        setStatusNotice('Pembayaran belum terdeteksi. Silakan selesaikan transaksi di m-Banking atau E-Wallet Anda, lalu klik Cek Status kembali.');
      }
    } catch (err) {
      console.error('[Midtrans Modal] Error checking status:', err);
      setStatusNotice('Gagal menghubungkan ke server untuk cek status. Silakan coba lagi.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getMethodIcon = (iconType: string) => {
    switch (iconType) {
      case 'qrcode':
        return <QrCode className="w-5 h-5 shrink-0 text-[#3F5A46]" />;
      case 'building':
        return <Building className="w-5 h-5 shrink-0 text-[#3F5A46]" />;
      case 'store':
        return <Store className="w-5 h-5 shrink-0 text-[#C1683F]" />;
      default:
        return <CreditCard className="w-5 h-5 shrink-0 text-[#3F5A46]" />;
    }
  };

  const currentMethodConfig = activeMethods.find((m) => m.id === activeMethod) || activeMethods[0];
  const hasDownloadedReceiptRef = useRef<boolean>(false);

  const handleClose = () => {
    if (isPaid && submission && !hasDownloadedReceiptRef.current) {
      hasDownloadedReceiptRef.current = true;
      try {
        generateAndDownloadInvoicePdf({
          inv: submission.invoiceNumber || `INV-${Date.now()}`,
          parent: submission.parentName
            ? `${submission.parentName} (${submission.studentName})`
            : submission.studentName,
          studentName: submission.studentName,
          packageType: 'paket',
          package: `Paket Bimbel Privat ${(submission.level || 'SD').toUpperCase()} (${submission.selectedSchedule?.length || 2} Sesi/Mgg)`,
          channel: 'Midtrans Gateway Real-time',
          amount: feeCalculation.grandTotal || submission.totalAmount,
          status: 'LUNAS',
          date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          whatsapp: submission.whatsapp,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[MidtransModal] Gagal mengunduh kuitansi otomatis:', err);
      }
    }
    onClose();
  };

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
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary & Fee Breakdown Card */}
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
            <div className="text-[10px] text-[#6B675F]">
              Subtotal: Rp {feeCalculation.baseAmount.toLocaleString('id-ID')}
            </div>
            {feeCalculation.feeAmount > 0 && (
              <div className="text-[10px] text-[#C1683F] font-semibold">
                Biaya Layanan: + {feeCalculation.formattedFee}
              </div>
            )}
            <div className="text-lg font-extrabold text-[#C1683F]">
              Rp {feeCalculation.grandTotal.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        {!isPaid ? (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Dynamic Method Selection Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#2A2823] uppercase">
                  Pilih Metode Pembayaran
                </label>

                {currentRecord && !isCurrentExpired ? (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors ${
                      remainingSeconds < 180
                        ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                    title="Batas waktu berlaku kode pembayaran"
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Sisa Waktu: {countdownFormatted}</span>
                  </div>
                ) : isCurrentExpired ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors bg-red-50 text-red-700 border-red-200 animate-pulse"
                    title="Kode pembayaran telah kedaluwarsa"
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Kedaluwarsa</span>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border border-gray-200 bg-gray-50 text-[#6B675F]"
                    title="Kode pembayaran belum di-generate"
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0 text-[#6B675F]" />
                    <span>Siap Ditampilkan</span>
                  </div>
                )}
              </div>

              {/* Dynamic Grid of Enabled Methods */}
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-0.5 overscroll-contain">
                {activeMethods.map((method) => {
                  const isSelected = activeMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setActiveMethod(method.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#3F5A46] bg-[#EAF2ED] text-[#3F5A46] shadow-xs'
                          : 'border-[rgba(42,40,35,0.1)] hover:bg-[#FAF7F1] text-[#2A2823]'
                      }`}
                    >
                      {getMethodIcon(method.iconType)}
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{method.name}</div>
                        <div className="text-[10px] text-[#6B675F] truncate">{method.badge}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Display Card */}
            <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] min-h-[220px] flex flex-col justify-center items-center text-center relative overflow-hidden">
              {isLoading ? (
                <div className="py-8 space-y-2 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#3F5A46] animate-spin" />
                  <p className="text-xs font-semibold text-[#2A2823]">
                    Menghubungi Midtrans Gateway...
                  </p>
                  <p className="text-[10px] text-[#6B675F]">Mengambil kode pembayaran resmi 15 menit</p>
                </div>
              ) : errorMsg ? (
                <div className="py-6 space-y-3">
                  <p className="text-xs font-bold text-red-600">{errorMsg}</p>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => fetchChargeDetails(activeMethod, true)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-[#2A2823] hover:bg-gray-50 flex items-center gap-1.5 mx-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Coba Lagi</span>
                  </button>
                </div>
              ) : !currentCharge ? (
                /* Unrevealed State */
                <div className="py-6 px-4 space-y-3.5 flex flex-col items-center justify-center max-w-sm mx-auto text-center animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center shadow-xs">
                    {getMethodIcon(currentMethodConfig?.iconType || 'creditcard')}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#2A2823]">
                      {currentMethodConfig?.name || 'Metode Pembayaran Midtrans'}
                    </h4>
                    <p className="text-[10.5px] text-[#6B675F] mt-1 leading-relaxed">
                      {currentMethodConfig?.description || 'Klik tombol di bawah untuk menampilkan kode pembayaran resmi.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => fetchChargeDetails(activeMethod)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#3F5A46] hover:bg-[#2e4233] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Tampilkan Kode {currentMethodConfig?.name || 'Pembayaran'}</span>
                  </button>
                  <p className="text-[9.5px] text-[#6B675F]">
                    Kode resmi berlaku 15 menit setelah tombol ditekan.
                  </p>
                </div>
              ) : isCurrentExpired ? (
                /* Expired Overlay */
                <div className="py-6 space-y-3 flex flex-col items-center justify-center max-w-xs mx-auto">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-800">Kode Pembayaran Kedaluwarsa</h4>
                    <p className="text-[10.5px] text-red-700 mt-1 leading-relaxed">
                      Batas waktu 15 menit telah habis. Kode lama tidak dapat digunakan lagi demi keamanan transaksi.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => fetchChargeDetails(activeMethod, true)}
                    className="px-3 py-1.5 rounded-xl bg-[#3F5A46] text-white text-xs font-bold hover:bg-[#2e4233] flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Buat Kode Pembayaran Baru</span>
                  </button>
                </div>
              ) : activeMethod === 'qris' || currentCharge.qrCodeUrl || currentCharge.qrString ? (
                /* QRIS Card */
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2A2823] px-1">
                    <span>Scan QRIS Resmi</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-mono">
                      {countdownFormatted}
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
              ) : activeMethod === 'mandiri_va' || currentCharge.billerCode ? (
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
              ) : activeMethod === 'indomaret' || activeMethod === 'alfamart' ? (
                /* Convenience Store Card */
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2A2823]">
                    <span>{currentMethodConfig?.name || 'Gerai Ritel'}</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Tunai Kasir
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[rgba(42,40,35,0.12)] space-y-2">
                    <div className="text-[10px] text-[#6B675F] uppercase font-bold">
                      Kode Pembayaran di Kasir
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base sm:text-lg font-black text-[#2A2823] tracking-wider select-all">
                        {String(currentCharge?.paymentCode || currentCharge?.vaNumber || 'BF-KASIR-98821')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(currentCharge?.paymentCode || currentCharge?.vaNumber || 'BF-KASIR-98821'), 'cstore')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F1] hover:bg-[#eae6dc] text-[11px] font-bold text-[#2A2823] border border-gray-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'cstore' ? '✓ Tersalin!' : 'Salin Kode'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-[#6B675F] bg-white/60 p-2.5 rounded-xl border border-gray-200/60">
                    Sampaikan kepada kasir ingin membayar transaksi <strong>Midtrans / Bright Future</strong> dan tunjukkan kode pembayaran di atas.
                  </p>
                </div>
              ) : (
                /* Generic Virtual Account Card (BCA, BRI, BNI, Permata, CIMB) */
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2A2823]">
                    <span>{currentMethodConfig?.name || 'Virtual Account'}</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Virtual Account
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[rgba(42,40,35,0.12)] space-y-2">
                    <div className="text-[10px] text-[#6B675F] uppercase font-bold">
                      Nomor Virtual Account Resmi
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base sm:text-lg font-black text-[#2A2823] tracking-wider select-all">
                        {currentCharge?.vaNumber || (activeMethod === 'bri_va' ? '8578000012345678' : activeMethod === 'bni_va' ? '8808123456789012' : '7001281234567890')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentCharge?.vaNumber || (activeMethod === 'bri_va' ? '8578000012345678' : activeMethod === 'bni_va' ? '8808123456789012' : '7001281234567890'), activeMethod)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F1] hover:bg-[#eae6dc] text-[11px] font-bold text-[#2A2823] border border-gray-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === activeMethod ? (
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
                    <p>Transfer melalui m-Banking, Internet Banking, atau ATM ke nomor Virtual Account di atas. Transaksi otomatis terverifikasi lunas.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Notice Feedback */}
            {statusNotice && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed text-center animate-in fade-in">
                {statusNotice}
              </div>
            )}

            {/* Bottom Controls */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isCheckingStatus}
                onClick={handleCheckStatus}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#FAF7F1] border border-[rgba(42,40,35,0.15)] text-[#2A2823] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#3F5A46] ${isCheckingStatus ? 'animate-spin' : ''}`} />
                <span>{isCheckingStatus ? 'Memeriksa ke Midtrans...' : 'Cek Status Pembayaran (Real-time)'}</span>
              </button>

              <div className="text-center">
                <span className="text-[10.5px] text-[#6B675F]">
                  Setelah bayar, status otomatis lunas dalam hitungan detik.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Payment Success State */
          <div className="p-6 sm:p-8 space-y-5 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold uppercase">
                Otomatis Terverifikasi Lunas
              </span>
              <h3 className="text-xl font-bold text-[#2A2823] font-display">
                Pembayaran Berhasil!
              </h3>
              <p className="text-xs text-[#6B675F]">
                Tagihan invoice <strong>{submission.invoiceNumber}</strong> telah diselesaikan secara real-time via Midtrans.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Nomor Transaksi:</span>
                <span className="font-mono font-bold text-[#2A2823]">
                  {currentCharge?.transactionId || `TX-${submission.invoiceNumber}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Total Dibayar:</span>
                <span className="font-bold text-[#3F5A46]">
                  Rp {feeCalculation.grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Waktu Selesai:</span>
                <span className="font-medium text-[#2A2823]">
                  {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 px-4 rounded-xl bg-[#3F5A46] hover:bg-[#2e4233] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Tutup &amp; Lihat Kuitansi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
