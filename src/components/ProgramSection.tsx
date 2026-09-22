import React, { useState } from 'react';
import { PROGRAMS } from '../data';
import { EducationalLevel, ProgramDetail } from '../types';
import {
  Baby,
  BookOpen,
  FlaskConical,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface ProgramSectionProps {
  onSelectProgram: (level: EducationalLevel) => void;
}

export const ProgramSection: React.FC<ProgramSectionProps> = ({ onSelectProgram }) => {
  const [selectedProgramDetail, setSelectedProgramDetail] = useState<ProgramDetail | null>(null);

  const getProgramIcon = (id: EducationalLevel) => {
    switch (id) {
      case 'tk':
        return <Baby className="w-6 h-6" />;
      case 'sd':
        return <BookOpen className="w-6 h-6" />;
      case 'smp':
        return <FlaskConical className="w-6 h-6" />;
      case 'sma':
        return <GraduationCap className="w-6 h-6" />;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 scroll-mt-28" id="program">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span className="text-xs font-bold text-[#C1683F] uppercase tracking-wider">
            Jenjang Komprehensif
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A2823] mt-1 font-display">
            Pilihan Program Belajar di Rumah
          </h2>
        </div>
        <p className="text-[#6B675F] text-sm sm:text-base max-w-md">
          Kurikulum adaptif sesuai kebutuhan anak dengan waktu 70 menit bimbingan intensif 1-on-1 per
          sesi (mulai Rp 35.000 / sesi, tanpa biaya transportasi tambahan).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PROGRAMS.map((prog) => {
          const isTerracotta = prog.colorScheme === 'terracotta';
          return (
            <div
              key={prog.id}
              className={`rounded-[24px] p-6 flex flex-col justify-between transition-all duration-200 group border ${
                isTerracotta
                  ? 'liquid-glass-accent border-[#EFC9AE]/80 hover:border-[#C1683F]/60'
                  : 'liquid-glass border-white/80 hover:border-[#6F8F76]/60'
              }`}
            >
              <div>
                {/* Header Icon + Level Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${
                      isTerracotta
                        ? 'bg-[#EFC9AE]/70 text-[#C1683F]'
                        : 'bg-[#EAF2ED] text-[#3F5A46]'
                    }`}
                  >
                    {getProgramIcon(prog.id)}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isTerracotta
                        ? 'bg-[#C1683F] text-white'
                        : 'bg-[#FAF7F1] text-[#3F5A46] border border-[#6F8F76]/30'
                    }`}
                  >
                    {prog.badge}
                  </span>
                </div>

                <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#F1ECE1] text-[11px] font-semibold text-[#2A2823] uppercase mb-1.5">
                  {prog.levelTitle}
                </div>

                <h3 className="text-xl font-bold text-[#2A2823] font-display">{prog.name}</h3>
                <p className="text-xs font-semibold text-[#6F8F76] mt-0.5">{prog.tagline}</p>

                <p className="text-[#6B675F] text-xs sm:text-sm mt-3 leading-relaxed">
                  {prog.description}
                </p>

                {/* Features Checklist */}
                <ul className="mt-4 space-y-2 text-xs text-[#6B675F]">
                  {prog.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isTerracotta ? 'text-[#C1683F]' : 'text-[#6F8F76]'
                        }`}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing & CTA */}
              <div className="mt-6 pt-4 border-t border-[rgba(42,40,35,0.08)]">
                <div className="flex items-baseline justify-between">
                  <div className="text-[11px] text-[#6B675F] font-medium">Investasi Belajar:</div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#3F5A46]">
                    <Clock className="w-3 h-3 text-[#6F8F76]" />
                    <span>70 Menit / Sesi</span>
                  </div>
                </div>

                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={`text-xl font-extrabold font-display ${
                      isTerracotta ? 'text-[#C1683F]' : 'text-[#3F5A46]'
                    }`}
                  >
                    Rp {prog.pricePerSession.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs font-normal text-[#6B675F]">/ sesi</span>
                </div>

                <div className="text-[11px] text-[#6B675F] mt-0.5">
                  Paket 2x/minggu: <span className="font-semibold text-[#2A2823]">Rp {prog.monthlyPrice.toLocaleString('id-ID')} / bln</span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => onSelectProgram(prog.id)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                      isTerracotta
                        ? 'bg-[#C1683F] hover:bg-[#A85530] text-white'
                        : 'bg-[#EAF2ED] hover:bg-[#3F5A46] hover:text-white text-[#3F5A46]'
                    }`}
                  >
                    <span>Pilih Program {prog.id.toUpperCase()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedProgramDetail(prog)}
                    className="text-[11px] font-semibold text-[#6B675F] hover:text-[#3F5A46] py-1 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    <span>Detail Silabus &amp; Modul</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Silabus Modal */}
      {selectedProgramDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="liquid-glass rounded-[28px] max-w-lg w-full p-6 sm:p-7 border border-white/90 shadow-glass relative">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.08)]">
              <div>
                <span className="text-[10px] font-bold text-[#C1683F] uppercase tracking-wider">
                  Silabus &amp; Bahan Ajar
                </span>
                <h3 className="text-lg font-bold text-[#2A2823]">
                  {selectedProgramDetail.name} ({selectedProgramDetail.levelTitle})
                </h3>
              </div>
              <button
                onClick={() => setSelectedProgramDetail(null)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#6B675F] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs sm:text-sm text-[#2A2823]">
              <p className="text-[#6B675F] leading-relaxed">
                {selectedProgramDetail.description}
              </p>

              <div className="p-3.5 rounded-xl bg-white/70 border border-[rgba(42,40,35,0.08)] space-y-2">
                <div className="font-bold text-[#3F5A46] text-xs uppercase tracking-wide">
                  Standar Pelayanan 1-on-1:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#6B675F]">Durasi Pertemuan:</span>{' '}
                    <span className="font-semibold text-[#2A2823]">70 Menit</span>
                  </div>
                  <div>
                    <span className="text-[#6B675F]">Biaya Per Sesi:</span>{' '}
                    <span className="font-semibold text-[#2A2823]">
                      Rp {selectedProgramDetail.pricePerSession.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B675F]">Modul Fisik:</span>{' '}
                    <span className="font-semibold text-[#2A2823]">LKPD Cetak Gratis</span>
                  </div>
                  <div>
                    <span className="text-[#6B675F]">Transport Tutor:</span>{' '}
                    <span className="font-semibold text-[#3F5A46]">Rp 0 (Bebas Biaya)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="font-bold text-xs text-[#2A2823]">Cakupan Materi Pembelajaran:</div>
                <ul className="space-y-1 text-xs text-[#6B675F]">
                  {selectedProgramDetail.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#6F8F76] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedProgramDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B675F] hover:bg-white/60 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const id = selectedProgramDetail.id;
                  setSelectedProgramDetail(null);
                  onSelectProgram(id);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white text-xs font-bold shadow-glow cursor-pointer"
              >
                Daftar Program Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
