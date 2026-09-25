import React, { useState } from 'react';
import {
  X,
  Shield,
  User,
  GraduationCap,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Database,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  verifyPortalCredentialsFromFirestore,
  verifyAdminCredentialsFromFirestore,
} from '../firebase';

interface LoginModalProps {
  onClose: () => void;
  onAdminLoginSuccess?: () => void;
}

type UserRole = 'admin' | 'tutor' | 'siswa' | 'orang_tua';

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onAdminLoginSuccess }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [identifier, setIdentifier] = useState<string>('admin@brightfuture.id');
  const [password, setPassword] = useState<string>('Bismillah@01');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [loginSuccessData, setLoginSuccessData] = useState<{
    name: string;
    identifier: string;
    role: string;
    summary: string;
    source: string;
  } | null>(null);

  const roleConfigs = {
    admin: {
      title: 'Admin & Owner',
      desc: 'Kelola data siswa, penugasan tutor, rute geofence, tagihan, dan rekonsiliasi Midtrans.',
      demoUser: 'admin@brightfuture.id',
      demoPass: 'Bismillah@01',
      badge: 'Super Admin',
      icon: <Shield className="w-5 h-5 text-[#3F5A46]" />,
      summary: 'Dashboard Master: Akses Penuh Sistem Operasional • Cloud Firestore Terhubung',
    },
    tutor: {
      title: 'Tutor / Guru',
      desc: 'Melihat rute & alamat kunjungan rumah siswa, isi presensi geofence, dan input catatan perkembangan.',
      demoUser: 'monica.tutor@brightfuture.id',
      demoPass: 'Tutor@2026',
      badge: 'Pengajar Terakreditasi',
      icon: <GraduationCap className="w-5 h-5 text-[#C1683F]" />,
      summary: 'Jadwal Hari Ini: 2 Kunjungan (Naufal - 16:00, Michelle - 18:30) • LKPD Terunggah',
    },
    siswa: {
      title: 'Siswa (TK - SMA)',
      desc: 'Akses materi belajar, LKPD cetak digital, bank soal kuis, nilai, dan jadwal belajar.',
      demoUser: 'BF-2026-09-8492',
      demoPass: 'Siswa@2026',
      badge: 'ID Siswa Resmi',
      icon: <User className="w-5 h-5 text-[#3F5A46]" />,
      summary: 'Akun Siswa: Kevin Pratama • Kelas 4 SD • Poin Rajin Belajar: 120 XP',
    },
    orang_tua: {
      title: 'Orang Tua / Wali',
      desc: 'Pantau presensi GPS tutor ke rumah, nilai berkala, dan pelunasan tagihan via Midtrans Snap.',
      demoUser: '085173230198',
      demoPass: 'Wali@2026',
      badge: 'Portal Transparan Wali',
      icon: <Users className="w-5 h-5 text-[#C1683F]" />,
      summary: 'Wali Murid: Ibu Deasy • Status SPP: LUNAS • Jadwal Selanjutnya: Rabu 16:00',
    },
  };

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    setIdentifier(roleConfigs[role].demoUser);
    setPassword(roleConfigs[role].demoPass);
    setErrorMessage(null);
    setLoginSuccessData(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAuthenticating(true);

    try {
      if (activeRole === 'admin') {
        const adminAuth = await verifyAdminCredentialsFromFirestore(identifier, password);
        if (adminAuth.success && adminAuth.admin) {
          if (onAdminLoginSuccess) {
            onAdminLoginSuccess();
            onClose();
            return;
          }
          setLoginSuccessData({
            name: adminAuth.admin.name || 'Monica Yuliana (Super Admin)',
            identifier: adminAuth.admin.email,
            role: 'super_admin',
            summary: 'Otentikasi Berhasil via Firestore: Hak akses Master Operasional Aktif.',
            source: 'admin_credentials (Cloud Firestore)',
          });
        } else {
          setErrorMessage(
            adminAuth.error ||
              'Email atau kata sandi admin tidak cocok. Gunakan admin@brightfuture.id dan Bismillah@01.'
          );
        }
      } else {
        const portalAuth = await verifyPortalCredentialsFromFirestore(activeRole, identifier, password);
        if (portalAuth.success && portalAuth.user) {
          setLoginSuccessData({
            name: portalAuth.user.name,
            identifier: portalAuth.user.identifier,
            role: portalAuth.user.role,
            summary: portalAuth.user.summary,
            source:
              portalAuth.user.source === 'firestore_registrations'
                ? 'registrations (Pendaftaran Siswa Baru di Firestore)'
                : 'portal_credentials (Cloud Firestore)',
          });
        } else {
          setErrorMessage(
            portalAuth.error ||
              'Kredensial tidak ditemukan pada database Firestore. Silakan cek kembali nomor ID/email dan sandi.'
          );
        }
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setErrorMessage('Terjadi kendala saat memeriksa kredensial ke Cloud Firestore.');
    } finally {
      setIsAuthenticating(false);
    }
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
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#2A2823] font-display">
                  Portal Masuk Multi-Role
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#284230] bg-[#EAF2ED] px-2 py-0.5 rounded-full border border-[#284230]/20">
                  <Database className="w-3 h-3 text-[#284230]" />
                  <span>Firestore DB</span>
                </span>
              </div>
              <p className="text-xs text-[#6B675F]">
                Kredensial tersambung langsung ke database Cloud Firestore
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
            {(['admin', 'orang_tua', 'siswa', 'tutor'] as UserRole[]).map((r) => (
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
          {!loginSuccessData ? (
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

              {activeRole === 'admin' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">Kredensial Super Admin (Tersimpan di Firestore):</span>
                    <div>Email: <span className="font-mono font-bold">admin@brightfuture.id</span></div>
                    <div>Password: <span className="font-mono font-bold">Bismillah@01</span></div>
                  </div>
                </div>
              )}

              {activeRole === 'siswa' && (
                <div className="p-3 rounded-xl bg-[#EAF2ED] border border-[#284230]/20 text-xs text-[#284230] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#3F5A46]" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">Koneksi Pendaftaran Siswa Baru:</span>
                    <p className="text-[11px] leading-relaxed">
                      Siswa yang baru mendaftar di landing page dapat langsung login menggunakan nomor <span className="font-mono font-bold">ID Siswa</span> (contoh: BF-xxxx) yang tersimpan di Firestore!
                    </p>
                  </div>
                </div>
              )}

              {activeRole === 'orang_tua' && (
                <div className="p-3 rounded-xl bg-[#EAF2ED] border border-[#284230]/20 text-xs text-[#284230] flex items-start gap-2">
                  <Database className="w-4 h-4 shrink-0 mt-0.5 text-[#3F5A46]" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">Koneksi Database Wali Murid:</span>
                    <p className="text-[11px] leading-relaxed">
                      Wali murid dapat login dengan nomor WhatsApp yang didaftarkan saat pendaftaran bimbingan belajar.
                    </p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

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
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-[#3F5A46] hover:bg-[#284230] text-white font-bold text-sm shadow-sm transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Database Firestore...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard {currentConfig.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Logged in preview with live Firestore verified data */
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-[#3F5A46]" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#3F5A46] bg-[#EAF2ED] px-2.5 py-0.5 rounded-full uppercase inline-flex items-center gap-1 border border-[#3F5A46]/20">
                  <Database className="w-3 h-3" />
                  Kredensial Database Terverifikasi
                </span>
                <h4 className="text-lg font-bold text-[#2A2823] font-display mt-1">
                  Selamat Datang, {loginSuccessData.name}
                </h4>
                <p className="text-xs text-[#6B675F] mt-1">
                  Akun: <span className="font-semibold text-[#2A2823]">{loginSuccessData.identifier}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#3F5A46] text-xs uppercase">
                    Status Data Firestore:
                  </span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-mono text-[#6B675F] border border-[rgba(42,40,35,0.08)]">
                    {loginSuccessData.source}
                  </span>
                </div>
                <div className="text-[#2A2823] font-medium leading-relaxed">
                  {loginSuccessData.summary}
                </div>
              </div>

              <div className="flex gap-2">
                {activeRole === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onAdminLoginSuccess) onAdminLoginSuccess();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#3F5A46] text-white text-xs font-bold hover:bg-[#284230] cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Buka Halaman Admin Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setLoginSuccessData(null)}
                      className="w-1/2 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1] cursor-pointer"
                    >
                      Ganti Akun
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-1/2 py-2.5 rounded-xl bg-[#3F5A46] text-white text-xs font-bold hover:bg-[#284230] cursor-pointer"
                    >
                      Selesai
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
