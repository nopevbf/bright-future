import React from 'react';
import { Star, Clock, CreditCard, ShieldCheck, HeartHandshake, Compass } from 'lucide-react';

export const TentangSection: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" id="tentang">
      <div className="liquid-glass rounded-[28px] p-6 sm:p-10 border border-white/80 shadow-glass">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2ED] text-[#3F5A46] text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-[#6F8F76]" />
              <span>Tentang Bright Future</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A2823] tracking-tight font-display">
              Transformasi bimbel privat tradisional menjadi Digital Learning Center
            </h2>

            <p className="text-[#6B675F] text-sm sm:text-base leading-relaxed">
              Didirikan dengan komitmen menyederhanakan bimbingan belajar tatap muka. Kami mentransformasi
              sistem guru les panggilan konvensional menjadi ekosistem bimbingan terpadu yang menjunjung
              tinggi rasa aman orang tua, kualitas pedagogik tutor, dan transparansi teknologi terintegrasi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-[18px] bg-white/70 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#3F5A46]" />
                  <span className="text-[#3F5A46] font-bold text-sm">Visi Kami</span>
                </div>
                <p className="text-xs text-[#6B675F] leading-relaxed">
                  Menciptakan ekosistem belajar rumah paling aman, transparan, dan berdampak nyata bagi prestasi generasi muda Indonesia.
                </p>
              </div>

              <div className="p-4 rounded-[18px] bg-white/70 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center gap-2 mb-1">
                  <HeartHandshake className="w-4 h-4 text-[#C1683F]" />
                  <span className="text-[#C1683F] font-bold text-sm">Nilai Integritas</span>
                </div>
                <p className="text-xs text-[#6B675F] leading-relaxed">
                  Verifikasi tutor ketat, akuntabilitas presensi geofence, dan komunikasi terbuka perkembangan kognitif anak dengan orang tua.
                </p>
              </div>
            </div>
          </div>

          {/* Bento Metric Visuals */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="liquid-glass-accent p-5 rounded-[22px] space-y-2 border border-[#EFC9AE]">
              <div className="w-10 h-10 rounded-xl bg-[#C1683F]/15 flex items-center justify-center text-[#C1683F]">
                <Star className="w-5 h-5 fill-[#C1683F]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#C1683F] font-display">
                4.92 / 5
              </div>
              <div className="text-xs text-[#6B675F] font-medium">
                Rata-rata rating kepuasan wali murid terverifikasi
              </div>
            </div>

            <div className="liquid-glass p-5 rounded-[22px] space-y-2 border border-white/90">
              <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] flex items-center justify-center text-[#3F5A46]">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#3F5A46] font-display">
                70 Menit
              </div>
              <div className="text-xs text-[#6B675F] font-medium">
                Durasi bimbingan fokus 1-on-1 per pertemuan
              </div>
            </div>

            <div className="liquid-glass p-5 rounded-[22px] space-y-2 border border-white/90">
              <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] flex items-center justify-center text-[#3F5A46]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#3F5A46] font-display">
                Mulai 35 Ribu
              </div>
              <div className="text-xs text-[#6B675F] font-medium">
                Per sesi 70 mnt (TK/SD 35rb, SMP 45rb, SMA 55rb)
              </div>
            </div>

            <div className="liquid-glass p-5 rounded-[22px] space-y-2 border border-white/90">
              <div className="w-10 h-10 rounded-xl bg-[#EFC9AE]/30 flex items-center justify-center text-[#C1683F]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#2A2823] font-display">
                100% Snap
              </div>
              <div className="text-xs text-[#6B675F] font-medium">
                Midtrans QRIS &amp; VA sinkronisasi otomatis lunas
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
