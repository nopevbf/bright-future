import React from 'react';
import { BookOpen, Sparkles, CheckCircle2, MessageSquareText, Shield, Smile } from 'lucide-react';

export const GaleriSection: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" id="galeri">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold text-[#C1683F] uppercase tracking-wider">
          Dokumentasi Nyata
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A2823] mt-1 font-display">
          Galeri Aktivitas Belajar di Rumah
        </h2>
        <p className="text-[#6B675F] text-sm sm:text-base mt-2">
          Kilas balik suasana bimbingan belajar ramah anak, modul pembelajaran fisik terstruktur,
          dan antusiasme murid di ruang belajar pribadi mereka.
        </p>
      </div>

      {/* Bento Visual Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: LKPD Modul */}
        <div className="liquid-glass rounded-[24px] p-6 flex flex-col justify-between border border-white/80 hover:border-[#6F8F76]/40 transition-all duration-200 group">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-[#6F8F76] uppercase tracking-wider">
              Modul LKPD Eksklusif
            </span>
            <h3 className="text-lg font-bold text-[#2A2823] mt-1 font-display">
              Lembar Kerja &amp; Modul Cetak Berkala
            </h3>
            <p className="text-xs sm:text-sm text-[#6B675F] mt-2.5 leading-relaxed">
              Setiap anak dibekali bundel LKPD fisik berwarna dan modul ringkasan konsep yang
              dibawakan langsung oleh tutor pada setiap sesi 70 menit bimbingan.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[rgba(42,40,35,0.08)] flex items-center gap-2 text-xs font-semibold text-[#3F5A46]">
            <CheckCircle2 className="w-4 h-4 text-[#6F8F76] shrink-0" />
            <span>Disesuaikan Kurikulum Merdeka &amp; K-13</span>
          </div>
        </div>

        {/* Card 2: Interaktif 1-on-1 */}
        <div className="liquid-glass-accent rounded-[24px] p-6 flex flex-col justify-between border border-[#EFC9AE] hover:border-[#C1683F]/60 transition-all duration-200 group">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#C1683F]/15 text-[#C1683F] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-[#C1683F] uppercase tracking-wider">
              Interaktif 1-on-1
            </span>
            <h3 className="text-lg font-bold text-[#2A2823] mt-1 font-display">
              Bimbingan Santai &amp; Eksploratif
            </h3>
            <p className="text-xs sm:text-sm text-[#6B675F] mt-2.5 leading-relaxed">
              Anak bebas bertanya tanpa rasa ragu atau malu seperti di kelas besar. Suasana kamar
              atau ruang tamu berubah menjadi laboratorium belajar yang kondusif.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[rgba(42,40,35,0.08)] flex items-center gap-2 text-xs font-semibold text-[#C1683F]">
            <CheckCircle2 className="w-4 h-4 text-[#C1683F] shrink-0" />
            <span>Fokus Penuh 70 Menit Tanpa Gangguan</span>
          </div>
        </div>

        {/* Card 3: Evaluasi Ramah Anak */}
        <div className="liquid-glass rounded-[24px] p-6 flex flex-col justify-between border border-white/80 hover:border-[#6F8F76]/40 transition-all duration-200 group">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-[#6F8F76] uppercase tracking-wider">
              Evaluasi Ramah Anak
            </span>
            <h3 className="text-lg font-bold text-[#2A2823] mt-1 font-display">
              Laporan Catatan Afektif Harian
            </h3>
            <p className="text-xs sm:text-sm text-[#6B675F] mt-2.5 leading-relaxed">
              Bukan cuma skor angka ujian, tutor mendokumentasikan ketelitian anak, daya fokus,
              pemahaman logika, serta rekomendasi latihan lanjutan ke ponsel orang tua.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[rgba(42,40,35,0.08)] flex items-center gap-2 text-xs font-semibold text-[#3F5A46]">
            <CheckCircle2 className="w-4 h-4 text-[#6F8F76] shrink-0" />
            <span>Laporan Langsung ke WhatsApp Ortu</span>
          </div>
        </div>
      </div>
    </section>
  );
};
