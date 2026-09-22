import React, { useState } from 'react';
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

  const content = (
    <div className="liquid-glass rounded-[28px] p-6 sm:p-8 border border-white/90 shadow-glass">
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(42,40,35,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center">
            <Calculator className="w-5 h-5 text-[#3F5A46]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2A2823] font-display">
              Kalkulator Simulasi Biaya Les Privat
            </h3>
            <p className="text-xs text-[#6B675F]">
              Mulai Rp 35.000 / sesi 70 menit • Transparan tanpa biaya tersembunyi
            </p>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#6B675F] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="md:col-span-7 space-y-4">
          {/* Step 1: Jenjang */}
          <div>
            <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5">
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
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    level === item.id
                      ? 'bg-[#3F5A46] text-white shadow-sm'
                      : 'bg-white/80 text-[#2A2823] hover:bg-white border border-[rgba(42,40,35,0.08)]'
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
            <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5">
              2. Frekuensi Kedatangan per Minggu
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { count: 1, label: '1x / Minggu', sub: '4 Sesi / Bln' },
                { count: 2, label: '2x / Minggu', sub: '8 Sesi (Standar)' },
                { count: 3, label: '3x / Minggu', sub: '12 Sesi / Bln' },
                { count: 4, label: '4x / Minggu', sub: '16 Sesi Intensif' },
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setSessionsPerWeek(item.count)}
                  className={`py-2.5 px-2 rounded-xl text-center transition-all cursor-pointer ${
                    sessionsPerWeek === item.count
                      ? 'bg-[#C1683F] text-white shadow-sm'
                      : 'bg-white/80 text-[#2A2823] hover:bg-white border border-[rgba(42,40,35,0.08)]'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div
                    className={`text-[10px] ${
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
          <div className="p-3 rounded-xl bg-white/70 border border-[rgba(42,40,35,0.08)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="discount-checkbox"
                type="checkbox"
                checked={hasSiblingDiscount}
                onChange={(e) => setHasSiblingDiscount(e.target.checked)}
                className="w-4 h-4 rounded text-[#3F5A46] focus:ring-[#3F5A46] cursor-pointer"
              />
              <label htmlFor="discount-checkbox" className="text-xs text-[#2A2823] font-medium cursor-pointer">
                Punya 2 anak / saudara yang les bersamaan? (Diskon 10%)
              </label>
            </div>
            <span className="text-[11px] font-bold text-[#C1683F] bg-[#EFC9AE]/50 px-2 py-0.5 rounded-full">
              Hemat 10%
            </span>
          </div>
        </div>

        {/* Output Calculation Result */}
        <div className="md:col-span-5 p-5 rounded-[22px] bg-white/90 border border-[rgba(42,40,35,0.08)] flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-bold text-[#6F8F76] uppercase tracking-wider">
              Ringkasan Estimasi Investasi
            </div>

            <div className="mt-2 space-y-1.5 text-xs text-[#6B675F]">
              <div className="flex justify-between">
                <span>Durasi Sesi:</span>
                <span className="font-semibold text-[#2A2823]">70 Menit Tatap Muka</span>
              </div>
              <div className="flex justify-between">
                <span>Total Kedatangan:</span>
                <span className="font-semibold text-[#2A2823]">{sessionsPerMonth} Pertemuan / Bln</span>
              </div>
              <div className="flex justify-between">
                <span>Tarif Dasar:</span>
                <span className="font-semibold text-[#2A2823]">
                  {sessionsPerMonth} × Rp {pricePerSession.toLocaleString('id-ID')}
                </span>
              </div>
              {hasSiblingDiscount && (
                <div className="flex justify-between text-[#C1683F] font-semibold">
                  <span>Diskon Saudara (10%):</span>
                  <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-[#3F5A46]">
                <span>Biaya Transport Tutor:</span>
                <span className="font-bold">Gratis (Rp 0)</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(42,40,35,0.08)]">
              <div className="text-[11px] text-[#6B675F]">Total Biaya Bulanan:</div>
              <div className="text-2xl font-extrabold text-[#3F5A46] font-display">
                Rp {finalTotal.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-[#6B675F]">
                Hanya Rp {Math.round(finalTotal / sessionsPerMonth).toLocaleString('id-ID')} / pertemuan
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={() => {
                if (onApplyPlan) {
                  onApplyPlan(level, sessionsPerWeek, hasSiblingDiscount);
                }
                if (onClose) onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white text-xs font-bold shadow-glow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Pilih Paket Ini untuk Mendaftar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <div className="max-w-3xl w-full">{content}</div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="kalkulator">
      {content}
    </section>
  );
};
