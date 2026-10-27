/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Shield,
  GraduationCap,
  User,
  Users,
  LogOut,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { AuthRole } from '../utils/sessionToken';

export interface AuthTransitionOverlayProps {
  mode: 'login' | 'logout';
  role: AuthRole;
  userName: string;
  durationMs?: number;
  onComplete: () => void;
}

const roleDetails: Record<
  AuthRole,
  { title: string; color: string; bgBadge: string; icon: React.ReactNode }
> = {
  admin: {
    title: 'Admin & Owner',
    color: '#3F5A46',
    bgBadge: 'bg-[#EAF2ED] text-[#284230] border-[#3F5A46]/20',
    icon: <Shield className="w-5 h-5 text-[#3F5A46]" />,
  },
  tutor: {
    title: 'Tutor / Guru Privat',
    color: '#C1683F',
    bgBadge: 'bg-[#FDF3EE] text-[#A85530] border-[#C1683F]/20',
    icon: <GraduationCap className="w-5 h-5 text-[#C1683F]" />,
  },
  siswa: {
    title: 'Siswa Digital Learning',
    color: '#3F5A46',
    bgBadge: 'bg-[#EAF2ED] text-[#284230] border-[#3F5A46]/20',
    icon: <User className="w-5 h-5 text-[#3F5A46]" />,
  },
  orang_tua: {
    title: 'Orang Tua / Wali Murid',
    color: '#C1683F',
    bgBadge: 'bg-[#FDF3EE] text-[#A85530] border-[#C1683F]/20',
    icon: <Users className="w-5 h-5 text-[#C1683F]" />,
  },
};

export const AuthTransitionOverlay: React.FC<AuthTransitionOverlayProps> = ({
  mode,
  role,
  userName,
  durationMs = 1200,
  onComplete,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const info = roleDetails[role] || roleDetails.admin;

  useEffect(() => {
    const stepMs = 40;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += stepMs;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onComplete();
      }
    }, stepMs);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  const isLogin = mode === 'login';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
    >
      <div className="relative max-w-md w-full bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] rounded-[28px] p-6 sm:p-8 shadow-2xl text-center overflow-hidden">
        {/* Glow ambient background pill */}
        <div
          className="absolute -top-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: info.color }}
        />
        <div
          className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: isLogin ? info.color : '#C1683F' }}
        />

        {/* Dynamic Center Animated Icon */}
        <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-md border border-[rgba(42,40,35,0.08)]">
          {isLogin ? (
            <div className="relative">
              {info.icon}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3F5A46] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3F5A46]"></span>
              </span>
            </div>
          ) : (
            <div className="relative">
              <LogOut className="w-6 h-6 text-[#C1683F] animate-pulse" />
            </div>
          )}
        </div>

        {/* Badge & Title */}
        <div className="space-y-1 mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${info.bgBadge}`}
          >
            {isLogin ? <Sparkles className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
            <span>{info.title}</span>
          </span>

          <h3 className="text-xl font-bold font-display text-[#2A2823] mt-2">
            {isLogin ? 'Menyiapkan Sesi Portal' : 'Mengakhiri Sesi Akun'}
          </h3>

          <p className="text-xs text-[#6B675F] max-w-xs mx-auto">
            {isLogin ? (
              <>
                Selamat datang kembali,{' '}
                <span className="font-semibold text-[#2A2823]">{userName}</span>. Memvalidasi
                kredensial dan mengamankan token sesi.
              </>
            ) : (
              <>
                Sampai jumpa, <span className="font-semibold text-[#2A2823]">{userName}</span>.
                Membersihkan token sesi dan mengunci akses aman.
              </>
            )}
          </p>
        </div>

        {/* Interactive Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden p-0.5">
            <div
              data-testid="auth-progress-bar"
              className="h-full rounded-full transition-all duration-75 ease-out shadow-xs"
              style={{
                width: `${progress}%`,
                backgroundColor: info.color,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#6B675F] px-1 font-medium">
            <div className="flex items-center gap-1.5">
              {progress < 100 ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3F5A46]" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3F5A46]" />
              )}
              <span>
                {isLogin
                  ? progress < 60
                    ? 'Memverifikasi token sesi digital...'
                    : 'Membuka dashboard portal...'
                  : progress < 60
                  ? 'Menghapus token autentikasi...'
                  : 'Sesi aman berhasil ditutup.'}
              </span>
            </div>
            <span className="font-mono font-bold text-[#2A2823]">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
