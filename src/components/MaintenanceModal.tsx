/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { calculateTimeRemaining, TimeRemaining } from '../utils/maintenanceManager';

export interface MaintenanceModalProps {
  isOpen: boolean;
  targetTimestamp: number;
  onDeactivate: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  targetTimestamp,
  onDeactivate,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetTimestamp)
  );
  const [spacePressCount, setSpacePressCount] = useState<number>(0);
  const [showSecretToggle, setShowSecretToggle] = useState<boolean>(false);

  // Real-time countdown timer updater
  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(calculateTimeRemaining(targetTimestamp));

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(targetTimestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, targetTimestamp]);

  // Spacebar cheat detection (7 presses reveals secret toggle)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent Escape or any default dismissal
      if (event.key === 'Escape' || event.code === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Check spacebar press
      if (event.key === ' ' || event.code === 'Space') {
        // Prevent default window scrolling when spacebar is pressed
        event.preventDefault();

        setSpacePressCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount >= 7) {
            setShowSecretToggle(true);
          }
          return nextCount;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const padZero = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-title"
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto"
      onClick={(e) => {
        // Ensure clicking backdrop does nothing (cannot be closed)
        e.stopPropagation();
      }}
    >
      <div
        className="relative bg-[#FAF7F1] text-[#2A2823] max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#2A2823]/15 text-center space-y-6 my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Badge Icon */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EFC9AE]/50 border-2 border-[#C1683F]/30 flex items-center justify-center text-[#C1683F] shadow-sm">
          <span className="material-symbols-outlined text-[36px] sm:text-[44px] animate-pulse">
            construction
          </span>
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            Sedang Dalam Pemeliharaan
          </span>
          <h2
            id="maintenance-title"
            className="text-xl sm:text-2xl font-black text-[#284230] tracking-tight"
          >
            Sistem Sedang Diperbarui
          </h2>
          <p className="text-xs sm:text-sm text-[#6B675F] max-w-md mx-auto leading-relaxed">
            Layanan bimbingan belajar Bright Future sedang menjalani pemeliharaan berkala untuk peningkatan performa dan keamanan platform. Kami akan segera kembali beroperasi normal.
          </p>
        </div>

        {/* 7-Day Precision Countdown Timer Cards */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border border-[#2A2823]/10 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B675F] mb-3">
            Estimasi Waktu Selesai Pemeliharaan
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {/* Days */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#284230] text-white shadow-xs">
              <span
                data-testid="countdown-days"
                className="font-mono text-xl sm:text-3xl font-black leading-none"
              >
                {padZero(timeLeft.days)}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-200/90 mt-1 uppercase">
                Hari
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#284230] text-white shadow-xs">
              <span
                data-testid="countdown-hours"
                className="font-mono text-xl sm:text-3xl font-black leading-none"
              >
                {padZero(timeLeft.hours)}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-200/90 mt-1 uppercase">
                Jam
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#284230] text-white shadow-xs">
              <span
                data-testid="countdown-minutes"
                className="font-mono text-xl sm:text-3xl font-black leading-none"
              >
                {padZero(timeLeft.minutes)}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-200/90 mt-1 uppercase">
                Menit
              </span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#C1683F] text-white shadow-xs">
              <span
                data-testid="countdown-seconds"
                className="font-mono text-xl sm:text-3xl font-black leading-none"
              >
                {padZero(timeLeft.seconds)}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-orange-200/90 mt-1 uppercase">
                Detik
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Hotline Info */}
        <div className="text-[11px] text-[#6B675F] bg-[#FAF7F1] p-3 rounded-xl border border-[#2A2823]/8">
          Butuh bantuan mendesak seputar jadwal belajar? Hubungi Admin via WhatsApp:{' '}
          <a
            href="https://wa.me/6285173230198"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#284230] underline hover:text-[#3F5A46]"
          >
            0851-7323-0198
          </a>
        </div>

        {/* SECRET CHEAT / EASTER EGG TOGGLE (Unlocked after 7 space presses) */}
        {showSecretToggle && (
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-400 text-left space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                <span className="material-symbols-outlined text-[18px] text-amber-600">
                  key
                </span>
                <span>Bypass Mode Maintenance (Easter Egg Terbuka)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                Anda telah menekan tombol spasi sebanyak 7 kali. Gunakan sakelar rahasia di bawah ini untuk menonaktifkan mode maintenance dan mengembalikan situs ke kondisi normal.
              </p>
              <div className="pt-1 flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-[#2A2823]">
                  Nonaktifkan Mode Maintenance:
                </span>
                <button
                  type="button"
                  data-testid="secret-maintenance-toggle"
                  onClick={onDeactivate}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[15px]">power_settings_new</span>
                  <span>Matikan Maintenance</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
