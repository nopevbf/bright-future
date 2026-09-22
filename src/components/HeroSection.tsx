import React, { useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  BookOpen,
  QrCode,
  Calendar,
  PlayCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  Navigation,
  UserCheck,
} from 'lucide-react';

interface HeroSectionProps {
  onSelectRegister: () => void;
  onExploreWorkflow: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectRegister,
  onExploreWorkflow,
}) => {
  // Interactive Simulation State of House-to-House Visit
  const [activeStep, setActiveStep] = useState<number>(2); // 1: Dijadwalkan, 2: Menuju Lokasi, 3: Sesi Berlangsung, 4: Selesai & Laporan

  const trackerSteps = [
    {
      id: 1,
      label: 'Terjadwal',
      time: '15:30 WIB',
      desc: 'Tutor ditugaskan sesuai zona rumah siswa',
    },
    {
      id: 2,
      label: 'Menuju Rumah',
      time: '15:45 WIB',
      desc: 'Perjalanan 12 mnt • Geofence GPS aktif',
    },
    {
      id: 3,
      label: 'Sesi 70 Mnt',
      time: '16:00 WIB',
      desc: 'Presensi valid • LKPD & bedah PR',
    },
    {
      id: 4,
      label: 'Rapor Afektif',
      time: '17:15 WIB',
      desc: 'Catatan progres langsung ke WhatsApp Bunda',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 scroll-mt-28" id="beranda">
      <div className="text-center max-w-3xl mx-auto">
        {/* Hero Display Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#2A2823] tracking-tight leading-[1.18] font-display">
          Belajar lebih nyaman di rumah,{' '}
          <span className="text-[#3F5A46] underline decoration-[#6F8F76]/40 underline-offset-8">
            terpantau nyata
          </span>{' '}
          di ponsel Bunda.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-[#6B675F] font-normal leading-relaxed max-w-2xl mx-auto">
          Bright Future memadukan bimbingan tatap muka privat (TK hingga SMA) dengan sistem manajemen
          terintegrasi: presensi geofence, rute kedatangan transparan, catatan kognitif harian, serta
          pembayaran Midtrans praktis tanpa biaya tambahan transport.
        </p>

        {/* CTA Action Row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={onSelectRegister}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white font-semibold text-base shadow-glow transition-all active:scale-95 cursor-pointer"
          >
            <Calendar className="w-5 h-5" />
            <span>Daftar Les &amp; Jadwalkan Visit</span>
          </button>

          <button
            onClick={onExploreWorkflow}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl liquid-glass text-[#3F5A46] hover:bg-white font-semibold text-base border border-white/80 transition-all cursor-pointer shadow-sm"
          >
            <PlayCircle className="w-5 h-5 text-[#6F8F76]" />
            <span>Lihat Alur Belajar</span>
          </button>
        </div>

        {/* 4 High-Trust Badges Bento Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          <div className="liquid-glass p-4 rounded-[18px] border border-white/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] flex items-center justify-center text-[#3F5A46] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#6B675F] font-medium">Tutor Teruji</div>
              <div className="text-sm font-bold text-[#2A2823]">100% Lolos Seleksi</div>
            </div>
          </div>

          <div className="liquid-glass p-4 rounded-[18px] border border-white/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFC9AE]/40 flex items-center justify-center text-[#C1683F] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#6B675F] font-medium">Rute Kunjungan</div>
              <div className="text-sm font-bold text-[#2A2823]">Geofence Radius Presisi</div>
            </div>
          </div>

          <div className="liquid-glass p-4 rounded-[18px] border border-white/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] flex items-center justify-center text-[#3F5A46] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#6B675F] font-medium">Modul Belajar</div>
              <div className="text-sm font-bold text-[#2A2823]">LKPD &amp; Bank Soal Aktif</div>
            </div>
          </div>

          <div className="liquid-glass p-4 rounded-[18px] border border-white/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFC9AE]/40 flex items-center justify-center text-[#C1683F] shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#6B675F] font-medium">Midtrans Snap</div>
              <div className="text-sm font-bold text-[#2A2823]">QRIS &amp; VA Otomatis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Preview: Live House-to-House Visit Tracker */}
      <div className="mt-12 max-w-4xl mx-auto liquid-glass rounded-[28px] p-5 sm:p-7 border border-white/90 shadow-glass">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(42,40,35,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3F5A46] text-white flex items-center justify-center shadow-sm">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#2A2823]">
                  Simulasi Pelacakan Kunjungan Tutor
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#EFC9AE]/60 text-[#C1683F] text-[10px] font-bold uppercase tracking-wider">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-[#6B675F]">
                Contoh tampilan transparan yang diterima orang tua via WhatsApp &amp; Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-[#3F5A46]">
            <Clock className="w-4 h-4 text-[#6F8F76]" />
            <span>Sesi 70 Menit • Rp 35.000</span>
          </div>
        </div>

        {/* Step Selector Buttons */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {trackerSteps.map((step) => {
            const isSelected = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white shadow-sm border-2 border-[#3F5A46]'
                    : 'bg-white/40 border border-transparent hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isSelected ? 'text-[#C1683F]' : 'text-[#6B675F]'
                    }`}
                  >
                    Langkah 0{step.id}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#3F5A46]" />}
                </div>
                <div className="text-xs font-bold text-[#2A2823]">{step.label}</div>
                <div className="text-[11px] text-[#6B675F] mt-0.5">{step.time}</div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Simulation Detail Card */}
        <div className="mt-4 p-4 rounded-[18px] bg-white/80 border border-[rgba(42,40,35,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6F8F76]"></span>
              <span className="text-xs font-bold text-[#3F5A46] uppercase tracking-wide">
                Status Saat Ini: {trackerSteps[activeStep - 1].label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#2A2823] font-medium">
              {trackerSteps[activeStep - 1].desc}
            </p>
            <div className="text-[11px] text-[#6B675F]">
              Tutor: <span className="font-semibold text-[#2A2823]">Monica Yuliana, S.Pd., Gr.</span> •
              Siswa: <span className="font-semibold text-[#2A2823]">Kevin (SD Kelas 4)</span> • Matpel:{' '}
              <span className="font-semibold text-[#2A2823]">Matematika &amp; Sains Tematik</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-[#EAF2ED] text-[#3F5A46] text-xs font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#6F8F76]" />
              <span>Presensi Geofence: Valid</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
