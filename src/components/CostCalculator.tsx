import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle2, Sparkles, ArrowRight, X } from 'lucide-react';
import { EducationalLevel } from '../types';

interface CostCalculatorProps {
  onApplyPlan?: (level: EducationalLevel, sessionsPerWeek: number, hasSiblingDiscount: boolean) => void;
  isModal?: boolean;
  onClose?: () => void;
}

const LEVEL_PRICING: Record<EducationalLevel, number> = {
  tk: 35000,
  sd: 35000,
  smp: 45000,
  sma: 55000,
};

export const CostCalculator: React.FC<CostCalculatorProps> = ({
  onApplyPlan,
  isModal = false,
  onClose,
}) => {
  const [level, setLevel] = useState<EducationalLevel>('sd');
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(2);
  const [hasSiblingDiscount, setHasSiblingDiscount] = useState<boolean>(false);

  const pricePerSession = LEVEL_PRICING[level];
  const sessionsPerMonth = sessionsPerWeek * 4;
  const rawTotal = sessionsPerMonth * pricePerSession;
  const discountAmount = hasSiblingDiscount ? Math.round(rawTotal * 0.1) : 0;
  const finalTotal = rawTotal - discountAmount;

  // Close on Escape key press
  useEffect(() => {
    if (!isModal || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, onClose]);

  const calculatorBody = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      {/* Controls */}
      <div className="lg:col-span-7 space-y-4">
        {/* Step 1: Jenjang */}
        <div>
          <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 tracking-wider">
            1. Pilih Jenjang Sekolah
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'tk', label: 'TK/PAUD', price: '35rb' },
              { id: 'sd', label: 'SD (1-6)', price: '35rb' },
              { id: 'smp', label: 'SMP (7-9)', price: '45rb' },
              { id: 'sma', label: 'SMA/SMK', price: '55rb' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLevel(item.id as EducationalLevel)}
                className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                  level === item.id
                    ? 'bg-[#3F5A46] text-white shadow-sm ring-2 ring-[#3F5A46]/20'
                    : 'bg-white text-[#2A2823] hover:bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)]'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] ${
                    level === item.id ? 'text-white/85' : 'text-[#6F8F76] font-semibold'
                  }`}
                >
                  Rp {item.price}/sesi
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Frekuensi Pertemuan */}
        <div>
          <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 tracking-wider">
            2. Frekuensi Kedatangan per Minggu
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { count: 1, label: '1x / Mgg', sub: '4 Sesi / Bln' },
              { count: 2, label: '2x / Mgg', sub: '8 Sesi (Standar)' },
              { count: 3, label: '3x / Mgg', sub: '12 Sesi / Bln' },
              { count: 4, label: '4x / Mgg', sub: '16 Sesi Intensif' },
            ].map((item) => (
              <button
                key={item.count}
                type="button"
                onClick={() => setSessionsPerWeek(item.count)}
                className={`min-h-[50px] py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                  sessionsPerWeek === item.count
                    ? 'bg-[#C1683F] text-white shadow-sm ring-2 ring-[#C1683F]/20'
                    : 'bg-white text-[#2A2823] hover:bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)]'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{item.label}</div>
                <div
                  className={`text-[10px] leading-tight mt-0.5 ${
                    sessionsPerWeek === item.count ? 'text-white/80' : 'text-[#6B675F]'
                  }`}
                >
                  {item.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Promo Diskon Saudara */}
        <label
          htmlFor="discount-checkbox"
          className="p-3 rounded-xl bg-white border border-[rgba(42,40,35,0.08)] flex items-center justify-between gap-3 cursor-pointer hover:bg-white/90 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <input
              id="discount-checkbox"
              type="checkbox"
              checked={hasSiblingDiscount}
              onChange={(e) => setHasSiblingDiscount(e.target.checked)}
              className="w-4 h-4 rounded text-[#3F5A46] focus:ring-[#3F5A46] cursor-pointer shrink-0 accent-[#3F5A46]"
            />
            <span className="text-xs text-[#2A2823] font-medium leading-snug">
              Punya 2 anak / saudara yang les bersamaan?
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#C1683F] bg-[#EFC9AE]/50 px-2 py-0.5 rounded-full shrink-0">
            Hemat 10%
          </span>
        </label>
      </div>

      {/* Output Calculation Result */}
      <div className="lg:col-span-5 p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] bg-white border border-[rgba(42,40,35,0.08)] flex flex-col justify-between shadow-xs space-y-4">
        <div>
          <div className="text-[11px] font-bold text-[#6F8F76] uppercase tracking-wider">
            Ringkasan Estimasi Investasi
          </div>

          <div className="mt-2.5 space-y-1.5 text-xs text-[#6B675F]">
            <div className="flex justify-between items-center">
              <span>Durasi Sesi:</span>
              <span className="font-semibold text-[#2A2823]">70 Menit Tatap Muka</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Kedatangan:</span>
              <span className="font-semibold text-[#2A2823]">{sessionsPerMonth} Pertemuan / Bln</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tarif Dasar:</span>
              <span className="font-semibold text-[#2A2823]">
                {sessionsPerMonth} × Rp {pricePerSession.toLocaleString('id-ID')}
              </span>
            </div>
            {hasSiblingDiscount && (
              <div className="flex justify-between items-center text-[#C1683F] font-semibold">
                <span>Diskon Saudara (10%):</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[#3F5A46]">
              <span>Biaya Transport Tutor:</span>
              <span className="font-bold">Gratis (Rp 0)</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(42,40,35,0.08)]">
            <div className="text-[11px] text-[#6B675F]">Total Biaya Bulanan:</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#3F5A46] font-display tracking-tight">
              Rp {finalTotal.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-[#6B675F] mt-0.5">
              Hanya Rp {Math.round(finalTotal / sessionsPerMonth).toLocaleString('id-ID')} / pertemuan
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (onApplyPlan) {
              onApplyPlan(level, sessionsPerWeek, hasSiblingDiscount);
            }
            if (onClose) onClose();
          }}
          className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white text-xs sm:text-sm font-bold shadow-glow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>Pilih Paket Ini untuk Mendaftar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] my-auto flex flex-col rounded-[24px] sm:rounded-[28px] bg-[#FAF7F1] border border-white/80 shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[rgba(42,40,35,0.08)] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-[#3F5A46]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#2A2823] font-display leading-tight truncate">
                  Simulasi Biaya Les Privat
                </h3>
                <p className="text-[10.5px] sm:text-xs text-[#6B675F] leading-tight truncate mt-0.5">
                  Mulai Rp 35.000 / sesi 70 menit • Transparan tanpa biaya tersembunyi
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 active:bg-black/10 text-[#6B675F] hover:text-[#2A2823] transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Tutup kalkulator"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal Body with internal scrolling */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
            {calculatorBody}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="kalkulator">
      <div className="liquid-glass rounded-[24px] sm:rounded-[28px] p-5 sm:p-8 border border-white/90 shadow-glass">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(42,40,35,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-[#3F5A46]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#2A2823] font-display">
                Kalkulator Simulasi Biaya Les Privat
              </h3>
              <p className="text-xs text-[#6B675F]">
                Mulai Rp 35.000 / sesi 70 menit • Transparan tanpa biaya tersembunyi
              </p>
            </div>
          </div>
        </div>
        {calculatorBody}
      </div>
    </section>
  );
};

