import React, { useState } from 'react';
import { EducationalLevel, RegistrationFormData, SubmittedRegistration } from '../types';
import { saveRegistrationToFirestore } from '../firebase';
import {
  cleanNumericOnly,
  validateIndonesianWhatsappFormat,
  checkStudentWhatsappDuplicate,
} from '../utils/whatsappValidation';
import {
  Send,
  CheckCircle2,
  Copy,
  CreditCard,
  Calendar,
  MapPin,
  FileText,
  User,
  Phone,
  Sparkles,
  Loader2,
  Building,
  ArrowLeft,
} from 'lucide-react';

interface RegistrationFormProps {
  initialLevel?: EducationalLevel | '';
  initialNotes?: string;
  onOpenMidtransDemo: (submission: SubmittedRegistration) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  initialLevel = '',
  initialNotes = '',
  onOpenMidtransDemo,
}) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    studentName: '',
    level: initialLevel || 'sd',
    parentName: '',
    whatsapp: '',
    homeAddress: '',
    addressNotes: '',
    selectedSchedule: ['senin-rabu'],
    specialNotes: initialNotes || '',
    hasSiblingDiscount: false,
    paymentMethod: 'midtrans',
  });

  const [whatsappStatus, setWhatsappStatus] = useState<{
    isChecking: boolean;
    isDuplicate: boolean;
    errorMessage: string | null;
    isAvailable: boolean;
    registeredStudentName: string | null;
  }>({
    isChecking: false,
    isDuplicate: false,
    errorMessage: null,
    isAvailable: false,
    registeredStudentName: null,
  });

  const [submittedData, setSubmittedData] = useState<SubmittedRegistration | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [firestoreSaved, setFirestoreSaved] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Sync initial props if changed
  React.useEffect(() => {
    if (initialLevel) {
      setFormData((prev) => ({ ...prev, level: initialLevel }));
    }
  }, [initialLevel]);

  React.useEffect(() => {
    if (initialNotes) {
      setFormData((prev) => ({ ...prev, specialNotes: initialNotes }));
    }
  }, [initialNotes]);

  const handleWhatsappChange = async (val: string) => {
    const rawVal = val;
    setFormData((prev) => ({ ...prev, whatsapp: rawVal }));

    const digitsOnly = cleanNumericOnly(rawVal);
    if (digitsOnly.length < 9) {
      setWhatsappStatus({
        isChecking: false,
        isDuplicate: false,
        errorMessage: digitsOnly.length > 0 ? 'Nomor WhatsApp minimal 9 digit' : null,
        isAvailable: false,
        registeredStudentName: null,
      });
      return;
    }

    const formatCheck = validateIndonesianWhatsappFormat(digitsOnly);
    if (!formatCheck.isValid) {
      setWhatsappStatus({
        isChecking: false,
        isDuplicate: false,
        errorMessage: formatCheck.error || 'Format nomor WhatsApp tidak valid',
        isAvailable: false,
        registeredStudentName: null,
      });
      return;
    }

    setWhatsappStatus((prev) => ({
      ...prev,
      isChecking: true,
      errorMessage: null,
    }));

    try {
      const duplicateResult = await checkStudentWhatsappDuplicate(digitsOnly);
      if (duplicateResult.isDuplicate) {
        setWhatsappStatus({
          isChecking: false,
          isDuplicate: true,
          errorMessage: `Nomor sudah terdaftar atas nama siswa: ${duplicateResult.studentName || 'Siswa Aktif'}. Silakan gunakan nomor lain atau hubungi admin.`,
          isAvailable: false,
          registeredStudentName: duplicateResult.studentName || null,
        });
      } else {
        setWhatsappStatus({
          isChecking: false,
          isDuplicate: false,
          errorMessage: null,
          isAvailable: true,
          registeredStudentName: null,
        });
      }
    } catch {
      setWhatsappStatus((prev) => ({
        ...prev,
        isChecking: false,
        errorMessage: null,
      }));
    }
  };

  const handleScheduleToggle = (scheduleId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedSchedule.includes(scheduleId);
      if (exists) {
        if (prev.selectedSchedule.length === 1) return prev;
        return {
          ...prev,
          selectedSchedule: prev.selectedSchedule.filter((s) => s !== scheduleId),
        };
      } else {
        return {
          ...prev,
          selectedSchedule: [...prev.selectedSchedule, scheduleId],
        };
      }
    });
  };

  const calculateTotal = (): number => {
    let rate = 35000;
    if (formData.level === 'smp') rate = 45000;
    if (formData.level === 'sma') rate = 55000;

    const baseAmount = rate * 8;
    if (formData.hasSiblingDiscount) {
      return baseAmount * 0.9;
    }
    return baseAmount;
  };

  const isFormValid = Boolean(
    formData.studentName.trim() &&
    formData.parentName.trim() &&
    formData.whatsapp.trim() &&
    cleanNumericOnly(formData.whatsapp).length >= 9 &&
    !whatsappStatus.errorMessage &&
    !whatsappStatus.isDuplicate &&
    !whatsappStatus.isChecking &&
    formData.homeAddress.trim() &&
    formData.selectedSchedule.length > 0 &&
    !isSaving
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentName.trim()) {
      alert('Mohon isi nama lengkap siswa.');
      return;
    }
    if (!formData.parentName.trim()) {
      alert('Mohon isi nama orang tua / wali.');
      return;
    }
    if (!formData.whatsapp.trim()) {
      alert('Mohon isi nomor WhatsApp aktif.');
      return;
    }
    if (!formData.homeAddress.trim()) {
      alert('Mohon isi alamat lengkap rumah untuk titik kunjungan tutor.');
      return;
    }
    if (whatsappStatus.isDuplicate) {
      alert('Nomor WhatsApp sudah terdaftar. Mohon gunakan nomor lain.');
      return;
    }

    setIsSaving(true);
    setFirestoreError(null);

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const generatedStudentId = `BF-${yearMonth}-${randomCode}`;
    const generatedInvoice = `INV-${yearMonth}-${randomCode}`;
    const finalAmount = calculateTotal();

    const submission: SubmittedRegistration = {
      ...formData,
      studentId: generatedStudentId,
      invoiceNumber: generatedInvoice,
      totalAmount: finalAmount,
      submittedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      paymentMethod: formData.paymentMethod || 'midtrans',
      paymentStatus: 'pending',
    };

    try {
      await saveRegistrationToFirestore(submission);
      setFirestoreSaved(true);
    } catch (err) {
      console.error('Kendala saat menyimpan ke Firestore:', err);
      setFirestoreError(
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat menyimpan pendaftaran ke cloud Firestore.'
      );
    } finally {
      setIsSaving(false);
      setSubmittedData(submission);
    }
  };

  const handleCopySummary = () => {
    if (!submittedData) return;
    const paymentText =
      submittedData.paymentMethod === 'manual_transfer'
        ? 'Transfer Manual Bank Jateng (3014266266 a.n Monica Yuliana)'
        : 'Midtrans Snap (QRIS, VA BCA, Mandiri, BNI, BRI, GoPay)';

    const text = `*BUKTI PENDAFTARAN BRIGHT FUTURE*\nNo. Siswa: ${submittedData.studentId}\nNama Siswa: ${submittedData.studentName} (${submittedData.level.toUpperCase()})\nOrang Tua: ${submittedData.parentName}\nWhatsApp: ${submittedData.whatsapp}\nAlamat Kunjungan: ${submittedData.homeAddress}\nJadwal Pilihan: ${submittedData.selectedSchedule.join(', ')}\nNo. Invoice: ${submittedData.invoiceNumber}\nTagihan SPP: Rp ${submittedData.totalAmount.toLocaleString('id-ID')}\nMetode Pembayaran: ${paymentText}\nStatus: Menunggu Pembayaran / Verifikasi Admin`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyRekening = () => {
    navigator.clipboard.writeText('3014266266');
    setCopiedRekening(true);
    setTimeout(() => setCopiedRekening(false), 2500);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 scroll-mt-28" id="form-daftar">
      <div className="liquid-glass rounded-[28px] p-6 sm:p-10 border border-white/90 shadow-glass relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#6F8F76]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFC9AE]/50 text-[#C1683F] text-xs font-bold uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C1683F]" />
            <span>Pendaftaran Periode Baru 2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2823] font-display">
            Formulir Pendaftaran Siswa Baru
          </h2>
          <p className="text-[#6B675F] text-xs sm:text-sm mt-1 leading-relaxed">
            Lengkapi data di bawah untuk penjadwalan kunjungan perdana & evaluasi diagnostik gratis
            di rumah Anda. ID Siswa dan invoice dibuat otomatis.
          </p>
        </div>

        {!submittedData ? (
          <form onSubmit={handleSubmit} className="space-y-5" id="registration-form">
            {/* Row 1: Student Name & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#6F8F76]" />
                  <span>Nama Lengkap Siswa</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="Misal: Budi Santoso"
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] placeholder-[#6B675F]/50 focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#6F8F76]" />
                  <span>Jenjang Pendidikan</span>
                </label>
                <select
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({ ...formData, level: e.target.value as EducationalLevel })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] focus:outline-none focus:ring-2 focus:ring-[#3F5A46] cursor-pointer"
                >
                  <option value="tk">PAUD / TK (Calistung Ceria • 70 Mnt)</option>
                  <option value="sd">SD / MI (Tematik, Matematika, IPA • 70 Mnt)</option>
                  <option value="smp">SMP / MTs (Matematika, IPA, B. Inggris • 70 Mnt)</option>
                  <option value="sma">SMA / SMK / UTBK (Saintek/Soshum/SNBT • 70 Mnt)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Parent Name & WhatsApp Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#6F8F76]" />
                  <span>Nama Orang Tua / Wali</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Misal: Bapak Santoso / Ibu Siti"
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] placeholder-[#6B675F]/50 focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#6F8F76]" />
                    <span>Nomor WhatsApp Aktif</span>
                  </span>
                  {whatsappStatus.isChecking && (
                    <span className="text-[10px] text-[#6B675F] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Mengecek...
                    </span>
                  )}
                  {whatsappStatus.isAvailable && (
                    <span className="text-[10px] text-[#3F5A46] font-bold">
                      ✓ Nomor Tersedia
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => handleWhatsappChange(e.target.value)}
                  placeholder="081234567890"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#2A2823] placeholder-[#6B675F]/50 focus:outline-none focus:ring-2 ${
                    whatsappStatus.isDuplicate
                      ? 'border-red-500 bg-red-50/50 focus:ring-red-500'
                      : whatsappStatus.isAvailable
                      ? 'border-[#3F5A46] bg-[#EAF2ED]/30 focus:ring-[#3F5A46]'
                      : 'border-[rgba(42,40,35,0.14)] bg-white focus:ring-[#3F5A46]'
                  }`}
                />
                {whatsappStatus.errorMessage && (
                  <p
                    className={`text-[11px] mt-1 ${
                      whatsappStatus.isDuplicate ? 'text-red-600 font-semibold' : 'text-[#C1683F]'
                    }`}
                  >
                    {whatsappStatus.errorMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Address & Notes */}
            <div>
              <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#6F8F76]" />
                <span>Alamat Lengkap Rumah (Lokasi Kunjungan Tutor di Magelang)</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.homeAddress}
                onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan (contoh: Jl. Pemuda No. 10 Magelang)"
                className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] placeholder-[#6B675F]/50 focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
              />
            </div>

            {/* Row 4: Schedule Selection */}
            <div>
              <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#6F8F76]" />
                  <span>Pilihan Hari Belajar (Bisa Lebih dari 1)</span>
                </span>
                <span className="text-[10px] text-[#6B675F]">Pilih minimal 1 sesi</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'senin-rabu', label: 'Senin - Rabu', sub: 'Sore (15:30 WIB)' },
                  { id: 'selasa-kamis', label: 'Selasa - Kamis', sub: 'Sore (15:30 WIB)' },
                  { id: 'jumat-sabtu', label: 'Jumat - Sabtu', sub: 'Sore / Malam' },
                  { id: 'weekend', label: 'Sabtu - Minggu', sub: 'Pagi / Siang' },
                ].map((slot) => {
                  const isChecked = formData.selectedSchedule.includes(slot.id);
                  return (
                    <label
                      key={slot.id}
                      onClick={() => handleScheduleToggle(slot.id)}
                      className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#EAF2ED] border-[#3F5A46] text-[#3F5A46]'
                          : 'bg-white border-[rgba(42,40,35,0.1)] text-[#2A2823] hover:bg-white/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{slot.label}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#3F5A46]" />}
                      </div>
                      <span className="text-[10px] text-[#6B675F]">{slot.sub}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Row 5: Notes */}
            <div>
              <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#6F8F76]" />
                <span>Catatan Khusus / Permintaan Tutor (Opsional)</span>
              </label>
              <input
                type="text"
                value={formData.specialNotes}
                onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                placeholder="Misal: Request Kak Monica Yuliana / Fokus persiapan ujian matematika"
                className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] placeholder-[#6B675F]/50 focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
              />
            </div>

            {/* Row 6: Payment Method Selection */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-[#2A2823] uppercase mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#6F8F76]" />
                  <span>Pilihan Metode Pembayaran SPP</span>
                </span>
                <span className="text-[10px] text-[#6B675F] font-normal normal-case">
                  Dapat diselesaikan setelah verifikasi
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opsi 1: Midtrans Real-time */}
                <div
                  onClick={() => setFormData({ ...formData, paymentMethod: 'midtrans' })}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    formData.paymentMethod === 'midtrans'
                      ? 'bg-[#EAF2ED] border-[#3F5A46] text-[#2A2823] shadow-xs'
                      : 'bg-white border-[rgba(42,40,35,0.12)] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0091FF] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        M
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>Midtrans (Real-time)</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-[#3F5A46] text-white text-[9px] font-extrabold uppercase">
                            Instan
                          </span>
                        </div>
                        <p className="text-[10.5px] text-[#6B675F] mt-0.5 leading-snug">
                          QRIS (GoPay/ShopeePay), Virtual Account BCA, Mandiri, BNI, BRI
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        formData.paymentMethod === 'midtrans'
                          ? 'border-[#3F5A46] bg-[#3F5A46]'
                          : 'border-gray-300'
                      }`}
                    >
                      {formData.paymentMethod === 'midtrans' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Opsi 2: Transfer Manual Bank Jateng */}
                <div
                  onClick={() => setFormData({ ...formData, paymentMethod: 'manual_transfer' })}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    formData.paymentMethod === 'manual_transfer'
                      ? 'bg-[#FAF4ED] border-[#C1683F] text-[#2A2823] shadow-xs'
                      : 'bg-white border-[rgba(42,40,35,0.12)] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#C1683F]/15 text-[#C1683F] flex items-center justify-center font-bold text-xs shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>Transfer Manual</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold uppercase">
                            Bank Jateng
                          </span>
                        </div>
                        <p className="text-[10.5px] text-[#6B675F] mt-0.5 leading-snug">
                          Rekening Resmi • Verifikasi Manual WhatsApp Admin
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        formData.paymentMethod === 'manual_transfer'
                          ? 'border-[#C1683F] bg-[#C1683F]'
                          : 'border-gray-300'
                      }`}
                    >
                      {formData.paymentMethod === 'manual_transfer' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panduan Rekening Bank Jateng Preview */}
              {formData.paymentMethod === 'manual_transfer' && (
                <div className="mt-2.5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      <span>Bank Jateng (Rekening Resmi Bimbel)</span>
                    </span>
                    <span className="text-[10px] text-amber-800 font-semibold px-2 py-0.5 bg-amber-100 rounded-md">
                      Transfer Manual
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#6B675F]">Nomor Rekening:</span>
                    <span className="font-mono font-extrabold text-sm text-[#2A2823] tracking-wider select-all">
                      3014266266
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B675F]">Atas Nama:</span>
                    <span className="font-bold text-[#2A2823]">Monica Yuliana</span>
                  </div>
                  <p className="text-[10.5px] text-amber-800 pt-1 border-t border-amber-200/60 leading-tight">
                    *Panduan transfer dan tombol kirim bukti via WhatsApp akan ditampilkan setelah Anda menekan tombol kirim pendaftaran di bawah.
                  </p>
                </div>
              )}
            </div>

            {/* Live Fee Preview */}
            {formData.level && (
              <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#3F5A46] uppercase tracking-wide">
                    Estimasi Paket 8 Sesi:
                  </span>
                  <span className="text-[#6B675F]">
                    {formData.level === 'tk' || formData.level === 'sd'
                      ? 'Tarif Rp 35.000 / sesi'
                      : formData.level === 'smp'
                      ? 'Tarif Rp 45.000 / sesi'
                      : 'Tarif Rp 55.000 / sesi'}
                  </span>
                </div>
                <div className="font-bold text-[#2A2823]">
                  SPP Bulanan:{' '}
                  <span className="text-[#C1683F] font-extrabold text-sm">
                    Rp{' '}
                    {(
                      formData.level === 'tk' || formData.level === 'sd'
                        ? 35000 * 8
                        : formData.level === 'smp'
                        ? 45000 * 8
                        : 55000 * 8
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                  isFormValid
                    ? 'bg-[#C1683F] hover:bg-[#A85530] text-white shadow-glow cursor-pointer active:scale-[0.99]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300 shadow-none'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menyimpan ke Cloud Firestore...</span>
                  </>
                ) : whatsappStatus.isChecking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memverifikasi Nomor WhatsApp...</span>
                  </>
                ) : whatsappStatus.isDuplicate ? (
                  <>
                    <span>⚠️ Nomor Sudah Terdaftar</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Kirim Pendaftaran &amp; Buat Jadwal Kunjungan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen with Student ID & Payment Guidance */
          <div className="p-6 sm:p-8 rounded-[24px] bg-white/95 border border-white shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-8 h-8 text-[#3F5A46]" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#2A2823] font-display">
                  Selamat Datang di Bright Future!
                </h3>
                <p className="text-xs sm:text-sm text-[#6B675F] mt-1">
                  Pendaftaran Anda berhasil dikirim dengan status{' '}
                  <span className="font-semibold text-[#C1683F]">Menunggu Verifikasi Admin</span>.
                </p>
              </div>
            </div>

            {/* Invoice & ID Card */}
            <div className="p-5 rounded-[20px] bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-[#6B675F] font-bold uppercase">ID Siswa Otomatis</div>
                  <div className="font-mono font-bold text-[#3F5A46] text-sm mt-0.5">
                    {submittedData.studentId}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#6B675F] font-bold uppercase">Nomor Invoice</div>
                  <div className="font-mono font-bold text-[#2A2823] text-sm mt-0.5">
                    {submittedData.invoiceNumber}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#6B675F] font-bold uppercase">Program Belajar</div>
                  <div className="font-bold text-[#2A2823] text-sm mt-0.5 uppercase">
                    {submittedData.level} (70 Mnt/Sesi)
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#6B675F] font-bold uppercase">Total SPP Bulanan</div>
                  <div className="font-extrabold text-[#C1683F] text-base mt-0.5">
                    Rp {submittedData.totalAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[rgba(42,40,35,0.08)] text-xs text-[#6B675F]">
                <div>
                  <span className="font-semibold text-[#2A2823]">Alamat Kunjungan Tutor:</span>{' '}
                  {submittedData.homeAddress}
                </div>
                <div>
                  <span className="font-semibold text-[#2A2823]">Jadwal Terpilih:</span>{' '}
                  {submittedData.selectedSchedule.join(', ')} • Wali: {submittedData.parentName} (
                  {submittedData.whatsapp})
                </div>
                <div className="mt-1">
                  <span className="font-semibold text-[#2A2823]">Metode Pembayaran:</span>{' '}
                  <span className="font-bold text-[#3F5A46]">
                    {submittedData.paymentMethod === 'manual_transfer'
                      ? 'Transfer Manual Bank Jateng'
                      : 'Midtrans Snap Gateway (Real-time)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Guidance Container */}
            {submittedData.paymentMethod === 'manual_transfer' ? (
              /* Panduan Transfer Bank Jateng */
              <div className="p-5 rounded-2xl bg-[#FAF4ED] border border-[#C1683F]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C1683F] text-white flex items-center justify-center font-bold text-xs">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#2A2823]">Panduan Transfer Bank Jateng</h4>
                      <p className="text-[11px] text-[#6B675F]">Rekening resmi operasional bimbingan belajar</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase">
                    Transfer Manual
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[rgba(42,40,35,0.08)] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B675F]">Bank Tujuan:</span>
                    <span className="font-bold text-[#2A2823]">Bank Jateng</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B675F]">Nomor Rekening:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-base text-[#3F5A46] tracking-wider">
                        3014266266
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyRekening}
                        className="px-2 py-1 rounded-md bg-[#FAF7F1] hover:bg-[#eae6dc] text-[10px] font-bold text-[#2A2823] border border-gray-300 cursor-pointer"
                      >
                        {copiedRekening ? '✓ Tersalin' : 'Salin Rekening'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B675F]">Atas Nama Penerima:</span>
                    <span className="font-bold text-[#2A2823]">Monica Yuliana</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                    <span className="text-[#6B675F]">Jumlah Transfer Tepat:</span>
                    <span className="font-mono font-extrabold text-sm text-[#C1683F]">
                      Rp {submittedData.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#6B675F] space-y-1">
                  <p>1. Lakukan transfer ATM/m-Banking ke rekening Bank Jateng di atas.</p>
                  <p>2. Simpan struk/tangkapan layar bukti transfer yang memuat nomor invoice <strong>{submittedData.invoiceNumber}</strong>.</p>
                  <p>3. Klik tombol WhatsApp di bawah untuk mengirimkan bukti transfer kepada Admin.</p>
                </div>

                {/* Option to switch to Midtrans instead */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => onOpenMidtransDemo(submittedData)}
                    className="text-xs text-[#0091FF] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Atau Bayar Instan via Midtrans Snap (QRIS / VA)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Midtrans Snap Real-time Action Card */
              <div className="p-5 rounded-2xl bg-[#EAF2ED]/60 border border-[#3F5A46]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#0091FF] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      M
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#2A2823]">Pelunasan Instan Midtrans Gateway</h4>
                      <p className="text-[11px] text-[#6B675F]">QRIS, VA BCA/Mandiri/BNI/BRI, GoPay (Otomatis Lunas)</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#3F5A46] text-white text-[10px] font-bold uppercase">
                    Real-time
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenMidtransDemo(submittedData)}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0091FF] hover:bg-[#007AE6] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar Sekarang via Midtrans Snap (Real-time)</span>
                </button>
              </div>
            )}

            {/* Action Buttons: Copy Summary & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="py-3 px-4 rounded-xl bg-white hover:bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] text-[#2A2823] text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-[#6F8F76]" />
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Bukti Pendaftaran'}</span>
              </button>

              <a
                href={`https://wa.me/6285173230198?text=${encodeURIComponent(
                  `*KONFIRMASI PENDAFTARAN SISWA BRIGHT FUTURE*\nNo. Siswa: ${submittedData.studentId}\nNama Siswa: ${submittedData.studentName} (${submittedData.level.toUpperCase()})\nOrang Tua: ${submittedData.parentName}\nWhatsApp: ${submittedData.whatsapp}\nAlamat Kunjungan: ${submittedData.homeAddress}\nJadwal Pilihan: ${submittedData.selectedSchedule.join(', ')}\nNo. Invoice: ${submittedData.invoiceNumber}\nTagihan SPP: Rp ${submittedData.totalAmount.toLocaleString('id-ID')}\nMetode Pembayaran: ${submittedData.paymentMethod === 'manual_transfer' ? 'Transfer Bank Jateng (3014266266 a.n Monica Yuliana)' : 'Midtrans Snap Gateway'}\nStatus: Menunggu Konfirmasi Admin`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>Konfirmasi via WhatsApp Hotline</span>
              </a>
            </div>

            {/* Button Kembali ke Form Pendaftaran */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSubmittedData(null)}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-[#FAF7F1] border-2 border-[#3F5A46] text-[#3F5A46] font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Form Pendaftaran Siswa</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
