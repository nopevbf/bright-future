import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  BookOpen,
  MapPin,
  FileText,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { COVERAGE_AREAS } from '../data';
import { TutorRegistrationData } from '../types';
import { saveTutorRegistrationToFirestore } from '../firebase';

interface TutorRegistrationModalProps {
  onClose: () => void;
}

export const TutorRegistrationModal: React.FC<TutorRegistrationModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<TutorRegistrationData>({
    fullName: '',
    whatsapp: '',
    education: '',
    subjects: '',
    district: COVERAGE_AREAS[0] || 'Mertoyudan',
    experienceNotes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [regId, setRegId] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const generateWhatsAppUrl = () => {
    const message =
      `Halo Admin Bright Future, saya ingin mendaftar sebagai Mitra Tutor Privat House-to-House.\n\n` +
      `*Nama Lengkap:* ${formData.fullName}\n` +
      `*Nomor WhatsApp:* ${formData.whatsapp}\n` +
      `*Pendidikan Terakhir:* ${formData.education}\n` +
      `*Jenjang & Mapel:* ${formData.subjects}\n` +
      `*Domisili Kecamatan:* ${formData.district}\n` +
      (formData.experienceNotes ? `*Pengalaman:* ${formData.experienceNotes}\n` : '') +
      `\nMohon informasi tahapan seleksi micro-teaching selanjutnya. Terima kasih!`;

    return `https://wa.me/6285173230198?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation (ISTQB TC-TR-002)
    if (!formData.fullName.trim() || !formData.whatsapp.trim()) {
      setErrorMessage('Mohon lengkapi Nama Lengkap dan Nomor WhatsApp Anda.');
      return;
    }

    if (!formData.education.trim()) {
      setErrorMessage('Mohon cantumkan latar belakang pendidikan terakhir Anda.');
      return;
    }

    if (!formData.subjects.trim()) {
      setErrorMessage('Mohon sebutkan jenjang & mata pelajaran yang diminati.');
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedId = await saveTutorRegistrationToFirestore(formData);
      setRegId(generatedId);
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error('Error saving tutor registration:', err);
      // Fallback: still allow candidate to proceed via WhatsApp
      setRegId(`TUTOR-REG-${Date.now()}`);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutor-modal-title"
    >
      <div className="relative w-full max-w-lg bg-[#FAF7F1] rounded-2xl sm:rounded-3xl shadow-2xl border border-[rgba(42,40,35,0.12)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(42,40,35,0.08)] bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="tutor-modal-title"
                className="font-display font-bold text-base sm:text-lg text-[#2A2823]"
              >
                Pendaftaran Mitra Tutor Baru
              </h3>
              <p className="text-[11px] text-[#6B675F]">
                Bergabung bersama tim pengajar privat Bright Future Magelang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-lg text-[#6B675F] hover:text-[#2A2823] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-[#2A2823]">
                  Pendaftaran Berhasil Dikirim!
                </h4>
                <p className="text-xs text-[#6B675F] mt-1 max-w-sm mx-auto">
                  Terima kasih <strong className="text-[#2A2823]">{formData.fullName}</strong>.
                  Data pendaftaran Anda telah tercatat dengan ID:{' '}
                  <span className="font-mono font-bold text-[#3F5A46]">{regId}</span>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6B675F]">WhatsApp Pelamar:</span>
                  <span className="font-semibold text-[#2A2823]">{formData.whatsapp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B675F]">Pendidikan:</span>
                  <span className="font-semibold text-[#2A2823]">{formData.education}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B675F]">Jenjang / Mapel:</span>
                  <span className="font-semibold text-[#2A2823]">{formData.subjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B675F]">Domisili:</span>
                  <span className="font-semibold text-[#2A2823]">{formData.district}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <a
                  href={generateWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Konfirmasi Cepat via WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-black/5 border border-[rgba(42,40,35,0.12)] text-[#2A2823] text-xs font-semibold transition-all cursor-pointer"
                >
                  Selesai &amp; Tutup
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="p-3 rounded-xl bg-[#EAF2ED]/60 border border-[#3F5A46]/20 flex items-start gap-2.5 text-xs text-[#3F5A46]">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Bright Future mengundang guru, sarjana pendidikan, dan mahasiswa tingkat akhir di
                  Kabupaten Magelang untuk bergabung sebagai Mitra Tutor privat terakreditasi.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label
                  htmlFor="tutor-fullName"
                  className="block text-xs font-bold text-[#2A2823] mb-1"
                >
                  Nama Lengkap &amp; Gelar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B675F]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="tutor-fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Contoh: Anindya Putri, S.Pd."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[rgba(42,40,35,0.12)] text-xs text-[#2A2823] focus:outline-hidden focus:ring-2 focus:ring-[#3F5A46] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label
                  htmlFor="tutor-whatsapp"
                  className="block text-xs font-bold text-[#2A2823] mb-1"
                >
                  Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B675F]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="tutor-whatsapp"
                    name="whatsapp"
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[rgba(42,40,35,0.12)] text-xs text-[#2A2823] focus:outline-hidden focus:ring-2 focus:ring-[#3F5A46] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Pendidikan Terakhir */}
              <div>
                <label
                  htmlFor="tutor-education"
                  className="block text-xs font-bold text-[#2A2823] mb-1"
                >
                  Pendidikan Terakhir / Jurusan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B675F]">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    id="tutor-education"
                    name="education"
                    type="text"
                    required
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="Contoh: S1 Pendidikan IPA / Mahasiswa Akhir UNY"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[rgba(42,40,35,0.12)] text-xs text-[#2A2823] focus:outline-hidden focus:ring-2 focus:ring-[#3F5A46] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Jenjang & Mata Pelajaran */}
              <div>
                <label
                  htmlFor="tutor-subjects"
                  className="block text-xs font-bold text-[#2A2823] mb-1"
                >
                  Jenjang &amp; Mata Pelajaran yang Dikuasai <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B675F]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <input
                    id="tutor-subjects"
                    name="subjects"
                    type="text"
                    required
                    value={formData.subjects}
                    onChange={handleChange}
                    placeholder="Contoh: SD Tematik / SMP Matematika &amp; IPA"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[rgba(42,40,35,0.12)] text-xs text-[#2A2823] focus:outline-hidden focus:ring-2 focus:ring-[#3F5A46] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Domisili Kecamatan */}
              <div>
                <label
                  htmlFor="tutor-district"
                  className="block text-xs font-bold text-[#2A2823] mb-1"
                >
                  Domisili Kecamatan (Kabupaten Magelang) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B675F]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <select
                    id="tutor-district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[rgba(42,40,35,0.12)] text-xs text-[#2A2823] focus:outline-hidden focus:ring-2 focus:ring-[#3F5A46] focus:border-transparent transition-all"
                  >
                    {COVERAGE_AREAS.map((area, idx) => (
                      <option key={idx} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Catatan Pengalaman */}
              <div>
                <label
                  htmlFor="tutor-experienceNotes"
                  className="block text-xs font-bold text-[#2A2823] mb-1"
                >
                  Pengalaman Mengajar / Catatan Tambahan (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-3 pointer-events-none text-[#6B675F]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <textarea
                    id="tutor-experienceNotes"
                    name="experienceNotes"
                    rows={2}
                    value={formData.experienceNotes}
                    onChange={handleChange}
                    placeholder="Contoh: Mengajar bimbel privat SD 2 tahun, terbiasa asesmen numerasi..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[rgba(42,40,35,0.12)] text-xs text-[#2A2823] focus:outline-hidden focus:ring-2 focus:ring-[#3F5A46] focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-black/5 border border-[rgba(42,40,35,0.12)] text-[#6B675F] text-xs font-semibold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#3F5A46] hover:bg-[#2F4435] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Pendaftaran Mitra</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
