import React, { useState } from 'react';
import { X, LogIn, Shield, User, GraduationCap, Users, CheckCircle2, Lock } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

type UserRole = 'admin' | 'tutor' | 'siswa' | 'orang_tua';

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('orang_tua');
  const [identifier, setIdentifier] = useState<string>('BF-2026-09-8492');
  const [password, setPassword] = useState<string>('••••••••');
  const [simulatedLoginSuccess, setSimulatedLoginSuccess] = useState<boolean>(false);

  const roleConfigs = {
    admin: {
      title: 'Admin & Owner',
      desc: 'Kelola data siswa, penugasan tutor, rute geofence, tagihan, dan rekonsiliasi Midtrans.',
      demoUser: 'admin@brightfuture.id',
      badge: 'Owner / Management',
      icon: <Shield className="w-5 h-5 text-[#3F5A46]" />,
      summary: 'Dashboard Master: 100 Siswa Aktif • 12 Tutor Tersebar • Rekap Keuangan Bulanan',
    },
    tutor: {
      title: 'Tutor / Guru',
      desc: 'Melihat rute & alamat kunjungan rumah siswa, isi presensi geofence, dan input catatan perkembangan.',
      demoUser: 'monica.tutor@brightfuture.id',
      badge: 'Pengajar Terakreditasi',
      icon: <GraduationCap className="w-5 h-5 text-[#C1683F]" />,
      summary: 'Jadwal Hari Ini: 2 Kunjungan (Naufal - 16:00, Michelle - 18:30) • LKPD Terunggah',
    },
    siswa: {
      title: 'Siswa (TK - SMA)',
      desc: 'Akses materi belajar, LKPD cetak digital, bank soal kuis, nilai, dan jadwal belajar.',
      demoUser: 'BF-2026-09-8492',
      badge: 'ID Siswa Format PRD',
      icon: <User className="w-5 h-5 text-[#3F5A46]" />,
      summary: 'Akun Siswa: Kevin Pratama • Kelas 4 SD • Poin Rajin Belajar: 120 XP',
    },
    orang_tua: {
      title: 'Orang Tua / Wali',
      desc: 'Pantau presensi GPS tutor ke rumah, nilai berkala, dan pelunasan tagihan via Midtrans Snap.',
      demoUser: '081234567890 (No. WhatsApp)',
      badge: 'Portal Transparan Wali',
      icon: <Users className="w-5 h-5 text-[#C1683F]" />,
      summary: 'Wali Murid: Ibu Ratna Dewi • Status SPP: LUNAS • Jadwal Selanjutnya: Rabu 16:00',
    },
  };

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    setIdentifier(roleConfigs[role].demoUser);
    setSimulatedLoginSuccess(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSimulatedLoginSuccess(true);
  };

  const currentConfig = roleConfigs[activeRole];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="max-w-lg w-full rounded-[28px] bg-white border border-[rgba(42,40,35,0.1)] shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 bg-[#FAF7F1] border-b border-[rgba(42,40,35,0.08)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Bright Future"
              className="w-11 h-11 rounded-full object-cover shadow-xs border border-[#C1683F]/20"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-base font-bold text-[#2A2823] font-display">
                Portal Masuk Multi-Role
              </h3>
              <p className="text-xs text-[#6B675F]">
                Akses terpadu untuk Admin, Tutor, Siswa, dan Orang Tua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#6B675F] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-4 bg-white border-b border-[rgba(42,40,35,0.06)]">
          <label className="block text-[11px] font-bold text-[#6B675F] uppercase mb-2">
            Pilih Peran Pengguna:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            {(['orang_tua', 'siswa', 'tutor', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSwitch(r)}
                className={`py-2 px-2 rounded-xl font-bold transition-all cursor-pointer text-center ${
                  activeRole === r
                    ? 'bg-[#3F5A46] text-white shadow-xs'
                    : 'bg-[#FAF7F1] text-[#2A2823] hover:bg-[#F1ECE1]'
                }`}
              >
                {roleConfigs[r].title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {!simulatedLoginSuccess ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center gap-2 mb-1">
                  {currentConfig.icon}
                  <span className="font-bold text-xs text-[#2A2823]">{currentConfig.title}</span>
                  <span className="ml-auto text-[10px] font-semibold bg-white px-2 py-0.5 rounded-full text-[#6F8F76] border border-[rgba(42,40,35,0.08)]">
                    {currentConfig.badge}
                  </span>
                </div>
                <p className="text-xs text-[#6B675F] leading-relaxed">{currentConfig.desc}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1">
                  {activeRole === 'siswa'
                    ? 'ID Siswa (Format: BF-XXXX-YY-ZZZZ)'
                    : activeRole === 'orang_tua'
                    ? 'Nomor WhatsApp / Email'
                    : 'Email Akun Resmi'}
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] bg-white text-sm text-[#2A2823] focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A2823] uppercase mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] bg-white text-sm text-[#2A2823] focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#3F5A46] hover:bg-[#3F5A46]/90 text-white font-bold text-sm shadow-sm transition-all cursor-pointer active:scale-98"
              >
                Masuk ke Portal {currentConfig.title}
              </button>
            </form>
          ) : (
            /* Logged in demo preview */
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-[#3F5A46]" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#3F5A46] bg-[#EAF2ED] px-2.5 py-0.5 rounded-full uppercase">
                  Sesi Aktif Terverifikasi
                </span>
                <h4 className="text-lg font-bold text-[#2A2823] font-display mt-1">
                  Selamat Datang di Portal {currentConfig.title}
                </h4>
                <p className="text-xs text-[#6B675F] mt-1">
                  Akun: <span className="font-semibold text-[#2A2823]">{identifier}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] text-left text-xs space-y-2">
                <div className="font-bold text-[#3F5A46] text-xs uppercase">
                  Ringkasan Akses Sistem:
                </div>
                <div className="text-[#2A2823] font-medium">{currentConfig.summary}</div>
                <div className="text-[11px] text-[#6B675F] pt-1 border-t border-[rgba(42,40,35,0.08)]">
                  Mode pratinjau live demo terintegrasi dengan arsitektur multi-role PRD Versi 1.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSimulatedLoginSuccess(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
                >
                  Ganti Akun
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 rounded-xl bg-[#3F5A46] text-white text-xs font-bold hover:bg-[#3F5A46]/90 cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
