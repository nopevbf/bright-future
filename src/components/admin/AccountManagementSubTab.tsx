import React, { useState } from 'react';
import {
  AdminCredentialDoc,
  PortalCredentialDoc,
  FirestoreRegistrationDoc,
  FirestoreTutorRegistrationDoc,
} from '../../firebase';

export interface AccountManagementSubTabProps {
  adminCredential: AdminCredentialDoc;
  portalAccounts: PortalCredentialDoc[];
  verifiedRegistrations: FirestoreRegistrationDoc[];
  acceptedTutors: FirestoreTutorRegistrationDoc[];
  isSyncingDb: boolean;
  onSyncDatabase: () => Promise<void>;
  onUpdateAdminPassword: (oldPwd: string, newPwd: string) => Promise<{ success: boolean; error?: string }>;
  onUpdatePortalPassword: (docId: string, newPwd: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
}

export const AccountManagementSubTab: React.FC<AccountManagementSubTabProps> = ({
  adminCredential,
  portalAccounts,
  verifiedRegistrations,
  acceptedTutors,
  isSyncingDb,
  onSyncDatabase,
  onUpdateAdminPassword,
  onUpdatePortalPassword,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'tutor' | 'siswa' | 'orang_tua'>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Admin password change form state
  const [showAdminPasswordInPlain, setShowAdminPasswordInPlain] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isSavingAdminPassword, setIsSavingAdminPassword] = useState(false);
  const [adminPasswordStatus, setAdminPasswordStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modal edit password for portal accounts
  const [editingAccount, setEditingAccount] = useState<PortalCredentialDoc | null>(null);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [isUpdatingPortalPwd, setIsUpdatingPortalPwd] = useState(false);
  const [editStatus, setEditStatus] = useState<string | null>(null);

  // Toggle password visibility
  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy helper
  const handleCopyCredentials = (account: { name: string; role: string; identifier: string; password: string }, key: string) => {
    const textToCopy = `*KREDENSIAL LOGIN PORTAL BRIGHT FUTURE*\nNama: ${account.name}\nPeran: ${account.role.toUpperCase()}\nIdentifier/ID: ${account.identifier}\nPassword: ${account.password}\nPortal URL: https://brightfuture.id`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Reset to default password 123456789
  const handleResetToDefault = async (account: PortalCredentialDoc) => {
    if (!account.id) return;
    try {
      const res = await onUpdatePortalPassword(account.id, '123456789');
      if (res.success) {
        setCopiedKey(`reset-${account.id}`);
        setTimeout(() => setCopiedKey(null), 2500);
      }
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  const handleSaveEditedPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editingAccount.id) return;
    if (!editNewPassword || editNewPassword.length < 6) {
      setEditStatus('Kata sandi baru minimal 6 karakter.');
      return;
    }

    setIsUpdatingPortalPwd(true);
    setEditStatus(null);
    try {
      const res = await onUpdatePortalPassword(editingAccount.id, editNewPassword);
      if (res.success) {
        setEditStatus('Kata sandi berhasil diperbarui di Cloud Firestore!');
        setTimeout(() => {
          setEditingAccount(null);
          setEditNewPassword('');
          setEditStatus(null);
        }, 1500);
      } else {
        setEditStatus(res.error || 'Gagal memperbarui kata sandi.');
      }
    } catch (e) {
      setEditStatus('Terjadi kendala jaringan ke Firestore.');
    } finally {
      setIsUpdatingPortalPwd(false);
    }
  };

  const handleSubmitAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPasswordStatus(null);
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setAdminPasswordStatus({
        type: 'error',
        message: 'Kata sandi baru minimal harus 6 karakter.',
      });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setAdminPasswordStatus({
        type: 'error',
        message: 'Konfirmasi kata sandi baru tidak cocok.',
      });
      return;
    }

    setIsSavingAdminPassword(true);
    try {
      const res = await onUpdateAdminPassword(oldPasswordInput, newPasswordInput);
      if (res.success) {
        setAdminPasswordStatus({
          type: 'success',
          message: 'Kata sandi admin berhasil diperbarui langsung di database Cloud Firestore!',
        });
        setOldPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      } else {
        setAdminPasswordStatus({
          type: 'error',
          message: res.error || 'Gagal memperbarui kata sandi admin.',
        });
      }
    } catch (e) {
      setAdminPasswordStatus({
        type: 'error',
        message: 'Terjadi kendala jaringan saat memperbarui kata sandi admin.',
      });
    } finally {
      setIsSavingAdminPassword(false);
    }
  };

  // Compile full account list from DB:
  // Admin + portalAccounts
  // Also cross-reference verifiedRegistrations and acceptedTutors to ensure full coverage
  const allAccounts: Array<{
    id: string;
    role: 'admin' | 'tutor' | 'siswa' | 'orang_tua';
    name: string;
    identifier: string;
    password: string;
    summary: string;
    whatsapp?: string;
    source: string;
    isDefaultPwd: boolean;
  }> = [];

  // 1. Admin
  allAccounts.push({
    id: 'admin_master',
    role: 'admin',
    name: adminCredential.name,
    identifier: adminCredential.email,
    password: adminCredential.password,
    summary: 'Super Admin • Hak Akses Penuh Sistem Operasional',
    source: 'admin_credentials',
    isDefaultPwd: adminCredential.password === '123456789',
  });

  // 2. Accounts from portal_credentials
  const knownIds = new Set<string>();
  knownIds.add(adminCredential.email.toLowerCase());

  portalAccounts.forEach((acc) => {
    const rawId = (acc.identifier || '').toLowerCase();
    if (!knownIds.has(rawId)) {
      knownIds.add(rawId);
      allAccounts.push({
        id: acc.id || acc.identifier,
        role: acc.role,
        name: acc.name,
        identifier: acc.identifier,
        password: acc.password || '123456789',
        summary: acc.summary || `Akun ${acc.role.toUpperCase()} Terhubung`,
        whatsapp: acc.whatsapp,
        source: 'portal_credentials',
        isDefaultPwd: acc.password === '123456789',
      });
    }
  });

  // 3. Fallback for any verified registration not yet in portalAccounts list
  verifiedRegistrations.forEach((reg) => {
    if (reg.paymentStatus === 'verified') {
      const sId = (reg.studentId || '').toLowerCase();
      if (!knownIds.has(sId)) {
        knownIds.add(sId);
        allAccounts.push({
          id: `siswa_${reg.studentId}`,
          role: 'siswa',
          name: reg.studentName,
          identifier: reg.studentId,
          password: '123456789',
          summary: `Siswa Terverifikasi • Jenjang: ${(reg.level || 'SD').toUpperCase()} • WA: ${reg.whatsapp}`,
          whatsapp: reg.whatsapp,
          source: 'registrations (Live DB)',
          isDefaultPwd: true,
        });
      }

      const pWa = (reg.whatsapp || '').replace(/[^0-9]/g, '');
      if (pWa && !knownIds.has(pWa)) {
        knownIds.add(pWa);
        allAccounts.push({
          id: `ortu_${reg.studentId}`,
          role: 'orang_tua',
          name: `${reg.parentName} (Wali ${reg.studentName})`,
          identifier: reg.whatsapp,
          password: '123456789',
          summary: `Wali Murid Terverifikasi • Siswa: ${reg.studentName} (${reg.studentId})`,
          whatsapp: reg.whatsapp,
          source: 'registrations (Live DB)',
          isDefaultPwd: true,
        });
      }
    }
  });

  // 4. Fallback for any accepted tutor not yet in portalAccounts list
  acceptedTutors.forEach((tutor) => {
    if (tutor.status === 'accepted') {
      const tWa = (tutor.whatsapp || '').replace(/[^0-9]/g, '');
      const tId = (tutor.id || '').toLowerCase();
      if (!knownIds.has(tWa) && !knownIds.has(tId)) {
        if (tWa) knownIds.add(tWa);
        knownIds.add(tId);
        allAccounts.push({
          id: `tutor_${tutor.id}`,
          role: 'tutor',
          name: tutor.fullName,
          identifier: tutor.whatsapp,
          password: '123456789',
          summary: `Tutor Terakreditasi • ${tutor.education} • Mapel: ${tutor.subjects} • Kec. ${tutor.district}`,
          whatsapp: tutor.whatsapp,
          source: 'tutor_registrations (Live DB)',
          isDefaultPwd: true,
        });
      }
    }
  });

  // Filter accounts
  const filteredAccounts = allAccounts.filter((acc) => {
    const matchesRole = roleFilter === 'all' || acc.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      acc.name.toLowerCase().includes(q) ||
      acc.identifier.toLowerCase().includes(q) ||
      (acc.whatsapp && acc.whatsapp.includes(q)) ||
      acc.role.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const countAdmin = allAccounts.filter((a) => a.role === 'admin').length;
  const countTutor = allAccounts.filter((a) => a.role === 'tutor').length;
  const countSiswa = allAccounts.filter((a) => a.role === 'siswa').length;
  const countOrtu = allAccounts.filter((a) => a.role === 'orang_tua').length;

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#284230] text-white">
            <span className="material-symbols-outlined text-[13px]">shield_person</span>
            <span>SUPER ADMIN</span>
          </span>
        );
      case 'tutor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C1683F] text-white shadow-2xs">
            <span className="material-symbols-outlined text-[13px]">school</span>
            <span>TUTOR / GURU</span>
          </span>
        );
      case 'siswa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#3F5A46] text-white shadow-2xs">
            <span className="material-symbols-outlined text-[13px]">person</span>
            <span>SISWA AKTIF</span>
          </span>
        );
      case 'orang_tua':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EFC9AE] text-[#6b2702] border border-[#C1683F]/30">
            <span className="material-symbols-outlined text-[13px]">family_restroom</span>
            <span>WALI MURID</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-800">
            {role.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Database Sync Status */}
      <div className="pb-4 border-b border-[#2A2823]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#2A2823] font-display">
              Akun &amp; Hak Akses Multi-Role
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[11px] font-bold inline-flex items-center gap-1 border border-[#3F5A46]/20">
              <span className="material-symbols-outlined text-[13px]">database</span>
              <span>Cloud Firestore Aktif</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B675F] mt-1">
            Akun siswa dan tutor yang mendaftar serta terverifikasi otomatis dibuat di basis data dengan kata sandi default: <span className="font-mono font-bold text-[#284230] bg-[#EAF2ED] px-1.5 py-0.5 rounded">123456789</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={onSyncDatabase}
          disabled={isSyncingDb}
          className="px-4 py-2.5 rounded-xl bg-[#284230] hover:bg-[#3F5A46] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start shadow-xs disabled:opacity-60"
          title="Sinkronkan dan buat otomatis akun siswa/tutor terverifikasi ke Cloud Firestore"
        >
          <span className={`material-symbols-outlined text-[18px] ${isSyncingDb ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span>{isSyncingDb ? 'Menyinkronkan Akun...' : 'Sinkronkan Akun ke DB'}</span>
        </button>
      </div>

      {/* 4 Stat Cards Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B675F] uppercase">Total Akun Terhubung</span>
            <div className="text-2xl font-black text-[#2A2823] font-display mt-0.5">
              {allAccounts.length}
            </div>
            <span className="text-[10px] text-[#3F5A46] font-semibold">Tersimpan di Cloud DB</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#3F5A46]/10 text-[#3F5A46] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B675F] uppercase">Tutor Terverifikasi</span>
            <div className="text-2xl font-black text-[#C1683F] font-display mt-0.5">
              {countTutor}
            </div>
            <span className="text-[10px] text-[#C1683F] font-semibold">Default: 123456789</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#C1683F]/10 text-[#C1683F] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B675F] uppercase">Siswa Terverifikasi</span>
            <div className="text-2xl font-black text-[#284230] font-display mt-0.5">
              {countSiswa}
            </div>
            <span className="text-[10px] text-[#284230] font-semibold">Default: 123456789</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#284230]/10 text-[#284230] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B675F] uppercase">Wali Murid</span>
            <div className="text-2xl font-black text-[#6b2702] font-display mt-0.5">
              {countOrtu}
            </div>
            <span className="text-[10px] text-[#6b2702] font-semibold">Login via WhatsApp</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EFC9AE]/30 text-[#6b2702] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">family_restroom</span>
          </div>
        </div>
      </div>

      {/* Auto-Creation Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#EAF2ED] border border-[#3F5A46]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[#284230]">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[#3F5A46] text-[22px] shrink-0 mt-0.5">
            verified_user
          </span>
          <div>
            <div className="font-bold text-sm text-[#284230]">
              Otomatisasi Akun Baru Terverifikasi:
            </div>
            <p className="text-[11px] text-[#424843] mt-0.5 leading-relaxed">
              Setiap calon siswa yang diverifikasi pembayarannya dan calon tutor yang disetujui (diterima) langsung dibuatkan akun login portalnya di Firestore dengan kata sandi default <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#3F5A46]/20">123456789</strong>. Pengguna dapat langsung masuk via modal Login di beranda.
            </p>
          </div>
        </div>
      </div>

      {/* Card Profil Super Admin */}
      <div className="p-6 rounded-3xl bg-white border border-[#2A2823]/10 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#3F5A46] text-white flex items-center justify-center font-black text-xl shadow-xs">
              MY
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2A2823]">{adminCredential.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#3F5A46] font-bold bg-[#EAF2ED] px-2.5 py-0.5 rounded-full border border-[#3F5A46]/20">
                  {adminCredential.role.toUpperCase()}
                </span>
                <span className="text-xs text-[#6B675F] font-mono">admin_credentials/admin</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tersinkronisasi ke Cloud Firestore</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#2A2823]/10 text-xs">
          <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/8">
            <span className="text-[10px] text-[#6B675F] uppercase font-bold block mb-1">
              Email Login Resmi Admin
            </span>
            <span className="text-sm font-bold text-[#284230] font-mono break-all">
              {adminCredential.email}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/8">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#6B675F] uppercase font-bold">Kata Sandi Admin</span>
              <button
                type="button"
                onClick={() => setShowAdminPasswordInPlain(!showAdminPasswordInPlain)}
                className="text-[10px] text-[#3F5A46] font-bold hover:underline cursor-pointer"
              >
                {showAdminPasswordInPlain ? 'Sembunyikan' : 'Lihat'}
              </button>
            </div>
            <span className="text-sm font-bold text-[#2A2823] font-mono">
              {showAdminPasswordInPlain ? adminCredential.password : '••••••••••••'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/8">
            <span className="text-[10px] text-[#6B675F] uppercase font-bold block mb-1">
              Status Database Firestore
            </span>
            <span className="text-xs font-semibold text-[#284230] flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>Active Multi-Role Auth</span>
            </span>
          </div>
        </div>

        {/* Form Ubah Password Admin */}
        <div className="pt-2 border-t border-[#2A2823]/10">
          <h4 className="font-bold text-sm text-[#2A2823] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">lock_reset</span>
            <span>Perbarui Kata Sandi Super Admin di Database</span>
          </h4>

          {adminPasswordStatus && (
            <div
              className={`p-3 rounded-xl mb-3 text-xs flex items-center gap-2 ${
                adminPasswordStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {adminPasswordStatus.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{adminPasswordStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAdminPassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#6B675F] uppercase block mb-1">
                Kata Sandi Lama
              </label>
              <input
                type="password"
                value={oldPasswordInput}
                onChange={(e) => setOldPasswordInput(e.target.value)}
                placeholder="Masukkan sandi saat ini"
                className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#6B675F] uppercase block mb-1">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#6B675F] uppercase block mb-1">
                Konfirmasi Sandi Baru
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Ulangi sandi baru"
                  className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
                <button
                  type="submit"
                  disabled={isSavingAdminPassword || !newPasswordInput}
                  className="px-4 py-2 rounded-xl bg-[#284230] text-white font-bold text-xs hover:bg-[#3F5A46] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isSavingAdminPassword ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Filter & Search Bar untuk Akun Pengguna */}
      <div className="p-4 rounded-2xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined text-[#6B675F] text-[18px] absolute left-3.5 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama pengguna, ID siswa, nomor WhatsApp, atau peran..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: `Semua (${allAccounts.length})` },
            { id: 'tutor', label: `Tutor (${countTutor})` },
            { id: 'siswa', label: `Siswa (${countSiswa})` },
            { id: 'orang_tua', label: `Wali (${countOrtu})` },
            { id: 'admin', label: `Admin (${countAdmin})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setRoleFilter(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                roleFilter === pill.id
                  ? 'bg-[#3F5A46] text-white shadow-xs'
                  : 'bg-[#FAF7F1] text-[#6B675F] hover:text-[#2A2823] border border-[rgba(42,40,35,0.08)]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Data Akun Pengguna Terhubung */}
      <div className="rounded-[22px] bg-white border border-[rgba(42,40,35,0.08)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7F1] border-b border-[rgba(42,40,35,0.08)] text-[#6B675F] font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">Hak Akses / Peran</th>
                <th className="py-3.5 px-4">Nama Pengguna</th>
                <th className="py-3.5 px-4">Identifier / Login ID</th>
                <th className="py-3.5 px-4">Kata Sandi DB</th>
                <th className="py-3.5 px-4">Sumber Database</th>
                <th className="py-3.5 px-4 text-center">Aksi Kredensial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(42,40,35,0.06)] text-[#2A2823]">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6B675F]">
                    Tidak ada akun yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account, index) => {
                  const rowKey = `${account.id}-${account.role}-${index}`;
                  const isPassVisible = !!visiblePasswords[rowKey];
                  const isCopied = copiedKey === rowKey;
                  const isResetCopied = copiedKey === `reset-${account.id}`;

                  return (
                    <tr key={rowKey} className="hover:bg-[#FAF7F1]/60 transition-colors">
                      {/* Peran */}
                      <td className="py-3.5 px-4">
                        {renderRoleBadge(account.role)}
                      </td>

                      {/* Nama & Deskripsi */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-[#2A2823]">{account.name}</div>
                        <div className="text-[11px] text-[#6B675F] line-clamp-1 max-w-xs mt-0.5">
                          {account.summary}
                        </div>
                      </td>

                      {/* Identifier */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-bold text-[#284230] bg-[#FAF7F1] px-2 py-1 rounded-lg border border-[#2A2823]/10 inline-block">
                          {account.identifier}
                        </div>
                        {account.whatsapp && account.whatsapp !== account.identifier && (
                          <div className="text-[10px] text-[#6B675F] mt-0.5">
                            WA: {account.whatsapp}
                          </div>
                        )}
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#2A2823]">
                            {isPassVisible ? account.password : '•••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(rowKey)}
                            className="p-1 text-[#6B675F] hover:text-[#284230] cursor-pointer"
                            title={isPassVisible ? 'Sembunyikan Sandi' : 'Lihat Sandi'}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {isPassVisible ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                        {account.isDefaultPwd && (
                          <span className="text-[10px] text-[#3F5A46] font-semibold bg-[#EAF2ED] px-1.5 py-0.2 rounded inline-block mt-0.5">
                            Default (123456789)
                          </span>
                        )}
                      </td>

                      {/* Sumber Database */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-[#6B675F] block">
                          {account.source}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Tersambung DB</span>
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Salin Kredensial */}
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(account, rowKey)}
                            className="p-1.5 rounded-lg bg-[#FAF7F1] hover:bg-[#EAF2ED] text-[#284230] border border-[#2A2823]/10 cursor-pointer transition-all"
                            title="Salin Info Login Lengkap"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isCopied ? 'done' : 'content_copy'}
                            </span>
                          </button>

                          {/* Kirim via WA jika ada nomor WA */}
                          {account.whatsapp && (
                            <a
                              href={`https://wa.me/${account.whatsapp.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(account.name)}%2C%20berikut%20informasi%20akun%20login%20resmi%20Anda%20di%20Bright%20Future%20Learning%20Center%3A%0A%0A-ID%20Login%3A%20${encodeURIComponent(account.identifier)}%0A-Password%3A%20${encodeURIComponent(account.password)}%0A-Portal%3A%20https%3A%2F%2Fbrightfuture.id%0A%0ASilakan%20login%20dan%20simpan%20kredensial%20ini%20dengan%20aman.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-all"
                              title="Kirim Kredensial via WhatsApp Resmi"
                            >
                              <span className="material-symbols-outlined text-[16px]">send</span>
                            </a>
                          )}

                          {/* Tombol Ubah Password jika bukan super admin */}
                          {account.role !== 'admin' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAccount({
                                    id: account.id,
                                    identifier: account.identifier,
                                    password: account.password,
                                    role: account.role,
                                    name: account.name,
                                    summary: account.summary,
                                  });
                                  setEditNewPassword('');
                                  setEditStatus(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-[#FAF7F1] hover:bg-[#3F5A46]/10 text-[#3F5A46] font-bold text-[10px] border border-[#2A2823]/10 cursor-pointer transition-all"
                                title="Ubah Password di Firestore"
                              >
                                Ubah Sandi
                              </button>

                              {!account.isDefaultPwd && (
                                <button
                                  type="button"
                                  onClick={() => handleResetToDefault(account as any)}
                                  className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200 cursor-pointer transition-all"
                                  title="Reset Password ke default: 123456789"
                                >
                                  {isResetCopied ? 'Direset!' : 'Reset 123456789'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 bg-[#FAF7F1]/80 border-t border-[#2A2823]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-[11px] text-[#6B675F]">
            Setiap pendaftar baru yang lolos verifikasi langsung terhubung secara otomatis ke database Cloud Firestore.
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <span className="material-symbols-outlined text-[17px]">logout</span>
            <span>Keluar dari Akun Admin</span>
          </button>
        </div>
      </div>

      {/* MODAL UBAH PASSWORD PORTAL PENGGUNA */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#2A2823]/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2823]/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46] text-[22px]">key</span>
                <h3 className="font-bold text-base text-[#2A2823]">
                  Ubah Kata Sandi {editingAccount.role.toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F1] hover:bg-[#2A2823]/10 flex items-center justify-center text-[#6B675F] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/8 text-xs space-y-1">
              <div className="font-bold text-[#2A2823]">{editingAccount.name}</div>
              <div className="text-[#6B675F] font-mono text-[11px]">
                ID: {editingAccount.identifier}
              </div>
            </div>

            {editStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  editStatus.includes('berhasil')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {editStatus.includes('berhasil') ? 'check_circle' : 'error'}
                </span>
                <span>{editStatus}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditedPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#2A2823] block mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="text"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru (min 6 karakter)"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setEditNewPassword('123456789')}
                  className="text-[11px] text-[#3F5A46] font-bold hover:underline mt-1 block cursor-pointer"
                >
                  Gunakan Password Default (123456789)
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF7F1] text-xs font-bold text-[#6B675F] hover:bg-[#2A2823]/10 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPortalPwd || !editNewPassword}
                  className="flex-1 py-2.5 rounded-xl bg-[#284230] text-xs font-bold text-white hover:bg-[#3F5A46] cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isUpdatingPortalPwd ? 'Menyimpan ke DB...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
