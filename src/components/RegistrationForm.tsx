import React, { useState } from 'react';
import { EducationalLevel, RegistrationFormData, SubmittedRegistration } from '../types';
import { saveRegistrationToFirestore } from '../firebase';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  CreditCard,
  Calendar,
  MapPin,
  FileText,
  User,
  Phone,
  Sparkles,
  Database,
  Loader2,
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
  });

  const [submittedData, setSubmittedData] = useState<SubmittedRegistration | null>(null);
  const [copied, setCopied] = useState(false);
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

  const handleScheduleToggle = (val: string) => {
    setFormData((prev) => {
      const exists = prev.selectedSchedule.includes(val);
      const updated = exists
        ? prev.selectedSchedule.filter((item) => item !== val)
        : [...prev.selectedSchedule, val];
      return { ...prev, selectedSchedule: updated.length > 0 ? updated : [val] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentName.trim() || !formData.parentName.trim() || !formData.whatsapp.trim() || !formData.homeAddress.trim()) {
      alert('Mohon lengkapi seluruh kolom formulir bertanda bintang (*).');
      return;
    }

    if (formData.selectedSchedule.length === 0) {
      alert('Mohon pilih minimal satu slot waktu jadwal kunjungan.');
      return;
    }

    setIsSaving(true);
    setFirestoreError(null);

    // Generate ID Siswa in strict compliance with PRD: BF-XXXX-YY-ZZZZ
    const currentYear = '2026';
    const currentMonth = '09';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const studentId = `BF-${currentYear}-${currentMonth}-${randomSuffix}`;
    const invoiceNumber = `INV-${currentYear}${currentMonth}-${randomSuffix}`;

    // Standard package calculation based on educational level (8 sessions/month)
    const LEVEL_PRICING: Record<string, number> = {
      tk: 35000,
      sd: 35000,
      smp: 45000,
      sma: 55000,
    };
    const sessionRate = LEVEL_PRICING[formData.level] || 35000;
    const baseTotal = sessionRate * 8;
    const finalAmount = formData.hasSiblingDiscount ? Math.round(baseTotal * 0.9) : baseTotal;

    const submission: SubmittedRegistration = {
      ...formData,
      studentId,
      invoiceNumber,
      totalAmount: finalAmount,
      submittedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    };

    try {
      await saveRegistrationToFirestore(submission);
      setFirestoreSaved(true);
    } catch (err) {
      console.error('Kendala saat menyimpan ke Firestore:', err);
      setFirestoreError(err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan pendaftaran ke cloud Firestore.');
    } finally {
      setIsSaving(false);
      setSubmittedData(submission);
    }
  };

  const handleCopySummary = () => {
    if (!submittedData) return;
    const text = `*BUKTI PENDAFTARAN BRIGHT FUTURE*\nNo. Siswa: ${submittedData.studentId}\nNama Siswa: ${submittedData.studentName} (${submittedData.level.toUpperCase()})\nOrang Tua: ${submittedData.parentName}\nWhatsApp: ${submittedData.whatsapp}\nAlamat Kunjungan: ${submittedData.homeAddress}\nJadwal Pilihan: ${submittedData.selectedSchedule.join(', ')}\nNo. Invoice: ${submittedData.invoiceNumber}\nTagihan SPP: Rp ${submittedData.totalAmount.toLocaleString('id-ID')}\nStatus: Menunggu Verifikasi Admin / Penugasan Tutor`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 scroll-mt-28" id="form-daftar">
      <div className="liquid-glass rounded-[28px] p-6 sm:p-10 border border-white/90 shadow-glass relative overflow-hidden">
        {/* Header of Form */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFC9AE]/50 text-[#C1683F] text-xs font-bold uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C1683F]" />
            <span>Pendaftaran Periode Baru 2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2823] font-display">
            Formulir Pendaftaran Siswa Baru
          </h2>
          <p className="text-[#6B675F] text-xs sm:text-sm mt-1 leading-relaxed">
            Lengkapi data di bawah untuk penjadwalan kunjungan perdana &amp; evaluasi diagnostik
            gratis di rumah Anda. ID Siswa dan invoice dibuat otomatis.
          </p>
        </div>

        {!submittedData ? (
          <form onSubmit={handleSubmit} className="space-y-5" id="registration-form">
            {/* Row 1: Student Name & Education Level */}
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
                  placeholder="Contoh: Kevin Pratama"
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] placeholder-[#6B675F]/50 focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#6F8F76]" />
                  <span>Jenjang Pendidikan</span>
                </label>
                <select
                  required
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({ ...formData, level: e.target.value as EducationalLevel })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                >
                  <option value="tk">TK / PAUD - Calistung &amp; Sensorik (Rp 35.000/sesi)</option>
                  <option value="sd">SD (Kelas 1-6) - Tematik &amp; Asesmen (Rp 35.000/sesi)</option>
                  <option value="smp">SMP (Kelas 7-9) - Sains/Math &amp; ASPD (Rp 45.000/sesi)</option>
                  <option value="sma">SMA (Kelas 10-12) - SNBT &amp; UTBK PTN (Rp 55.000/sesi)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Parent Name & WhatsApp Number */}
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
                  placeholder="Contoh: Ibu Ratna Dewi"
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] placeholder-[#6B675F]/50 focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#6F8F76]" />
                  <span>Nomor WhatsApp Aktif</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] placeholder-[#6B675F]/50 focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                />
              </div>
            </div>

            {/* Row 3: Full Home Address for Tutor Route Dispatch */}
            <div>
              <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C1683F]" />
                <span>Alamat Lengkap Rumah (Krusial untuk Pemetaan Rute &amp; Geofence)</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.homeAddress}
                onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                placeholder="Jalan, Nomor Rumah, RT/RW, Desa/Kelurahan, Kecamatan (Kabupaten Magelang), serta patokan terdekat (misal: Mertoyudan, dekat Lapangan drh. Soepardi)..."
                className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm text-[#2A2823] placeholder-[#6B675F]/50 focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
              />
              <p className="text-[11px] text-[#6B675F] mt-1">
                📍 Alamat ini digunakan oleh admin untuk menugaskan tutor terdekat di Kabupaten Magelang dan menghitung batas radius presensi.
              </p>
            </div>

            {/* Row 4: Preferred Schedule */}
            <div>
              <label className="block text-xs font-bold text-[#2A2823] uppercase mb-2">
                Pilihan Hari Belajar Diinginkan (Paket 2x / Minggu)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'senin-rabu', label: 'Senin & Rabu', sub: '15:30 / 17:00' },
                  { id: 'selasa-kamis', label: 'Selasa & Kamis', sub: '15:30 / 17:00' },
                  { id: 'jumat-sabtu', label: 'Jumat & Sabtu', sub: '16:00 / Pagi' },
                  { id: 'weekend', label: 'Sabtu & Minggu', sub: 'Pagi / Sore' },
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

            {/* Row 5: Notes & Sibling Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-white border border-[rgba(42,40,35,0.1)] cursor-pointer hover:bg-white/90 w-full">
                  <input
                    type="checkbox"
                    checked={formData.hasSiblingDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, hasSiblingDiscount: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#3F5A46] focus:ring-[#3F5A46]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#2A2823]">Klaim Diskon Saudara 10%</span>
                    <p className="text-[10px] text-[#6B675F]">
                      Berlaku jika mendaftarkan kakak-beradik sekaligus.
                    </p>
                  </div>
                </label>
              </div>
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
                      (formData.level === 'tk' || formData.level === 'sd'
                        ? 35000 * 8
                        : formData.level === 'smp'
                        ? 45000 * 8
                        : 55000 * 8) * (formData.hasSiblingDiscount ? 0.9 : 1)
                    ).toLocaleString('id-ID')}
                  </span>
                  {formData.hasSiblingDiscount && (
                    <span className="ml-1 text-[10px] text-[#3F5A46] font-semibold">
                      (Diskon 10% aktif)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white font-bold text-base shadow-glow transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menyimpan ke Cloud Firestore...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Kirim Pendaftaran &amp; Buat Jadwal Kunjungan</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-[#6B675F] mt-2.5">
                🔒 Data Anda tersimpan aman di cloud database Google Firestore dan hanya digunakan oleh tim dispatch Bright Future
                Kabupaten Magelang untuk konfirmasi jadwal &amp; administrasi.
              </p>
            </div>
          </form>
        ) : (
          /* Success Screen with Student ID & Midtrans Snap Demo trigger */
          <div className="p-6 sm:p-8 rounded-[24px] bg-white/95 border border-white shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-8 h-8 text-[#3F5A46]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF2ED] text-[#3F5A46] text-[10px] font-bold uppercase tracking-wider">
                    Pendaftaran Diterima Sistem
                  </span>
                  {firestoreSaved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <Database className="w-3 h-3 text-emerald-600" />
                      Tersimpan di Cloud Firestore
                    </span>
                  ) : firestoreError ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Mode Offline
                    </span>
                  ) : null}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#2A2823] font-display mt-0.5">
                  Selamat Datang di Bright Future!
                </h3>
                <p className="text-xs sm:text-sm text-[#6B675F]">
                  Data telah tersimpan di database dengan status{' '}
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
              </div>
            </div>

            {/* Realtime Admin & Database Sync Indicator */}
            {firestoreSaved && (
              <div className="p-3.5 bg-[#EAF2ED]/80 rounded-2xl border border-[#3F5A46]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-2.5 text-[#2A2823]">
                  <div className="w-7 h-7 rounded-lg bg-[#3F5A46] text-white flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <span className="font-bold text-[#3F5A46]">Data Terdaftar di Cloud Database &amp; Admin:</span>
                    <p className="text-[11px] text-[#6B675F]">
                      Pendaftaran ini sudah otomatis terekam di Cloud Firestore dan langsung masuk ke menu <strong>Data Siswa &amp; Wali &gt; Verifikasi Pendaftaran</strong> di Admin Dashboard.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '#admin';
                    window.location.reload();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#3F5A46] hover:bg-[#284230] text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Cek di Dashboard Admin</span>
                  <span>&rarr;</span>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenMidtransDemo(submittedData)}
                className="py-3 px-4 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white text-xs sm:text-sm font-bold shadow-glow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>Simulasi Bayar via Midtrans Snap</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="py-3 px-4 rounded-xl bg-white hover:bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] text-[#2A2823] text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-[#6F8F76]" />
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Data Bukti Pendaftaran'}</span>
              </button>
            </div>

            <a
              href={`https://wa.me/6285173230198?text=${encodeURIComponent(
                `*BUKTI PENDAFTARAN BRIGHT FUTURE*\nNo. Siswa: ${submittedData.studentId}\nNama Siswa: ${submittedData.studentName} (${submittedData.level.toUpperCase()})\nOrang Tua: ${submittedData.parentName}\nWhatsApp: ${submittedData.whatsapp}\nAlamat Kunjungan: ${submittedData.homeAddress}\nJadwal Pilihan: ${submittedData.selectedSchedule.join(', ')}\nNo. Invoice: ${submittedData.invoiceNumber}\nTagihan SPP: Rp ${submittedData.totalAmount.toLocaleString('id-ID')}\nStatus: Menunggu Verifikasi Admin / Penugasan Tutor`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Konfirmasi via WhatsApp Hotline (+62 851-7323-0198)</span>
            </a>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setSubmittedData(null)}
                className="text-xs text-[#6B675F] hover:text-[#3F5A46] font-semibold underline cursor-pointer"
              >
                Daftarkan Siswa Baru Lainnya
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
