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
  currentUserRole?: string;
  onSyncDatabase: () => Promise<void>;
  onUpdateAdminPassword: (oldPwd: string, newPwd: string) => Promise<{ success: boolean; error?: string }>;
  onUpdatePortalPassword: (docId: string, newPwd: string) => Promise<{ success: boolean; error?: string }>;
  onCreateAccount?: (accountData: Omit<PortalCredentialDoc, 'id'> & { id?: string }) => Promise<{ success: boolean; id?: string; error?: string }>;
  onEditAccount?: (docId: string, updates: Partial<PortalCredentialDoc>) => Promise<{ success: boolean; error?: string }>;
  onDeleteAccount?: (docId: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateRole?: (docId: string, newRole: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
}

export const AccountManagementSubTab: React.FC<AccountManagementSubTabProps> = ({
  adminCredential,
  portalAccounts,
  verifiedRegistrations,
  acceptedTutors,
  isSyncingDb,
  currentUserRole,
  onSyncDatabase,
  onUpdateAdminPassword,
  onUpdatePortalPassword,
  onCreateAccount,
  onEditAccount,
  onDeleteAccount,
  onUpdateRole,
  onLogout,
}) => {
  // Super Admin Role Verification
  const isSuperAdmin = (currentUserRole || adminCredential.role) === 'super_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'tutor' | 'siswa' | 'orang_tua'>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Local state overrides for immediate UI reflection
  const [localCreatedAccounts, setLocalCreatedAccounts] = useState<PortalCredentialDoc[]>([]);
  const [localUpdatedAccounts, setLocalUpdatedAccounts] = useState<Record<string, Partial<PortalCredentialDoc>>>({});
  const [localDeletedIds, setLocalDeletedIds] = useState<Set<string>>(new Set());

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

type PortalRole = NonNullable<PortalCredentialDoc['role']>;

  // Modal Create Account
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name: string;
    role: PortalRole;
    identifier: string;
    whatsapp: string;
    password: string;
    summary: string;
  }>({
    name: '',
    role: 'siswa',
    identifier: '',
    whatsapp: '',
    password: '123456789',
    summary: '',
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [createStatus, setCreateStatus] = useState<string | null>(null);

  // Modal Edit Account & Setting Role
  const [editingAccount, setEditingAccount] = useState<{
    id: string;
    name: string;
    role: PortalRole;
    identifier: string;
    whatsapp: string;
    password: string;
    summary: string;
  } | null>(null);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [editStatus, setEditStatus] = useState<string | null>(null);

  // Modal Delete Account Confirmation
  const [deletingAccount, setDeletingAccount] = useState<{
    id: string;
    name: string;
    identifier: string;
    role: string;
  } | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Helper trigger feedback toast
  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3000);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy credentials helper
  const handleCopyCredentials = (
    account: { name: string; role: string; identifier: string; password: string },
    key: string
  ) => {
    const textToCopy = `*KREDENSIAL LOGIN PORTAL BRIGHT FUTURE*\nNama: ${account.name}\nPeran: ${account.role.toUpperCase()}\nIdentifier/ID: ${account.identifier}\nPassword: ${account.password}\nPortal URL: https://brightfuture.id`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    showToast(`Kredensial untuk ${account.name} disalin!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Handle Admin Password Change
  const handleSubmitAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setAdminPasswordStatus({
        type: 'error',
        message: 'Akses Ditolak: Hanya Super Admin yang berwenang mengubah kata sandi admin utama.',
      });
      return;
    }
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
          message: 'Kata sandi Super Admin berhasil diperbarui langsung di database Cloud Firestore!',
        });
        setOldPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        showToast('Kata sandi Super Admin berhasil diperbarui!');
      } else {
        setAdminPasswordStatus({
          type: 'error',
          message: res.error || 'Gagal memperbarui kata sandi admin.',
        });
      }
    } catch {
      setAdminPasswordStatus({
        type: 'error',
        message: 'Terjadi kendala jaringan saat memperbarui kata sandi admin.',
      });
    } finally {
      setIsSavingAdminPassword(false);
    }
  };

  // Reset to default password (123456789)
  const handleResetToDefault = async (account: { id: string; name: string }) => {
    if (!isSuperAdmin) {
      showToast('Akses Ditolak: Hanya Super Admin yang dapat me-reset kata sandi pengguna.');
      return;
    }
    if (!account.id) return;
    try {
      const res = await onUpdatePortalPassword(account.id, '123456789');
      if (res.success) {
        setLocalUpdatedAccounts((prev) => ({
          ...prev,
          [account.id]: { ...(prev[account.id] || {}), password: '123456789' },
        }));
        setCopiedKey(`reset-${account.id}`);
        showToast(`Kata sandi ${account.name} berhasil di-reset ke 123456789 di Firestore!`);
        setTimeout(() => setCopiedKey(null), 2500);
      }
    } catch (e) {
      console.error('Reset error:', e);
      showToast('Gagal me-reset kata sandi ke database.');
    }
  };

  // CREATE ACCOUNT HANDLER
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setCreateStatus('Akses Ditolak: Hanya role Super Admin yang dapat menambahkan akun baru.');
      return;
    }
    if (!createForm.name || !createForm.identifier) {
      setCreateStatus('Nama lengkap dan Login ID wajib diisi.');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateStatus('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsCreatingAccount(true);
    setCreateStatus(null);
    try {
      const newAccData: Omit<PortalCredentialDoc, 'id'> = {
        name: createForm.name.trim(),
        role: createForm.role,
        identifier: createForm.identifier.trim(),
        whatsapp: createForm.whatsapp.trim(),
        password: createForm.password.trim(),
        summary:
          createForm.summary.trim() ||
          `Akun ${createForm.role.toUpperCase()} • Ditambahkan oleh Super Admin`,
      };

      if (onCreateAccount) {
        const res = await onCreateAccount(newAccData);
        if (res.success) {
          const createdDoc: PortalCredentialDoc = {
            ...newAccData,
            id: res.id || `acc_${Date.now()}`,
          };
          setLocalCreatedAccounts((prev) => [createdDoc, ...prev]);
          showToast(`Akun ${createForm.name} berhasil dibuat dan disimpan di Cloud Firestore!`);
          setIsCreateModalOpen(false);
          setCreateForm({
            name: '',
            role: 'siswa',
            identifier: '',
            whatsapp: '',
            password: '123456789',
            summary: '',
          });
        } else {
          setCreateStatus(res.error || 'Gagal menyimpan akun baru ke Firestore.');
        }
      } else {
        const createdDoc: PortalCredentialDoc = {
          ...newAccData,
          id: `acc_${Date.now()}`,
        };
        setLocalCreatedAccounts((prev) => [createdDoc, ...prev]);
        showToast(`Akun ${createForm.name} berhasil dibuat!`);
        setIsCreateModalOpen(false);
      }
    } catch {
      setCreateStatus('Terjadi kendala jaringan saat membuat akun baru.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // EDIT ACCOUNT & ROLE HANDLER
  const handleEditAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!isSuperAdmin) {
      setEditStatus('Akses Ditolak: Hanya role Super Admin yang dapat mengedit data akun.');
      return;
    }
    if (!editingAccount.name || !editingAccount.identifier) {
      setEditStatus('Nama dan ID Login tidak boleh kosong.');
      return;
    }

    setIsUpdatingAccount(true);
    setEditStatus(null);
    try {
      const updates: Partial<PortalCredentialDoc> = {
        name: editingAccount.name.trim(),
        role: editingAccount.role,
        identifier: editingAccount.identifier.trim(),
        whatsapp: editingAccount.whatsapp.trim(),
        password: editingAccount.password.trim(),
        summary: editingAccount.summary.trim(),
      };

      if (onEditAccount) {
        const res = await onEditAccount(editingAccount.id, updates);
        if (res.success) {
          setLocalUpdatedAccounts((prev) => ({
            ...prev,
            [editingAccount.id]: { ...(prev[editingAccount.id] || {}), ...updates },
          }));
          showToast(`Perubahan data & role ${editingAccount.name} tersimpan di Cloud Firestore!`);
          setEditingAccount(null);
        } else {
          setEditStatus(res.error || 'Gagal memperbarui akun di Firestore.');
        }
      } else {
        setLocalUpdatedAccounts((prev) => ({
          ...prev,
          [editingAccount.id]: { ...(prev[editingAccount.id] || {}), ...updates },
        }));
        showToast(`Data akun ${editingAccount.name} diperbarui!`);
        setEditingAccount(null);
      }
    } catch {
      setEditStatus('Terjadi kendala jaringan saat memperbarui akun.');
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  // QUICK SETTING ROLE HANDLER
  const handleQuickRoleChange = async (accountId: string, accountName: string, newRole: string) => {
    if (!isSuperAdmin) {
      showToast('Akses Ditolak: Hanya Super Admin yang dapat mengubah hak akses/peran.');
      return;
    }
    const targetRole = newRole as PortalRole;
    try {
      if (onUpdateRole) {
        const res = await onUpdateRole(accountId, targetRole);
        if (res.success) {
          setLocalUpdatedAccounts((prev) => ({
            ...prev,
            [accountId]: { ...(prev[accountId] || {}), role: targetRole },
          }));
          showToast(`Hak akses ${accountName} berhasil diubah menjadi ${targetRole.toUpperCase()} di Firestore!`);
        } else {
          showToast(res.error || 'Gagal memperbarui peran akun.');
        }
      } else {
        setLocalUpdatedAccounts((prev) => ({
          ...prev,
          [accountId]: { ...(prev[accountId] || {}), role: targetRole },
        }));
        showToast(`Peran ${accountName} diubah ke ${targetRole.toUpperCase()}!`);
      }
    } catch {
      showToast('Terjadi kendala jaringan saat mengubah peran akun.');
    }
  };

  // DELETE ACCOUNT HANDLER
  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    if (!isSuperAdmin) {
      showToast('Akses Ditolak: Hanya role Super Admin yang dapat menghapus akun.');
      setDeletingAccount(null);
      return;
    }
    if (deletingAccount.id === 'admin_master') {
      showToast('Keamanan Sistem: Akun Super Admin Utama tidak dapat dihapus!');
      setDeletingAccount(null);
      return;
    }

    setIsDeletingAccount(true);
    try {
      if (onDeleteAccount) {
        const res = await onDeleteAccount(deletingAccount.id);
        if (res.success) {
          setLocalDeletedIds((prev) => new Set([...prev, deletingAccount.id]));
          showToast(`Akun ${deletingAccount.name} berhasil dihapus dari basis data Firestore!`);
          setDeletingAccount(null);
        } else {
          showToast(res.error || 'Gagal menghapus akun dari Firestore.');
        }
      } else {
        setLocalDeletedIds((prev) => new Set([...prev, deletingAccount.id]));
        showToast(`Akun ${deletingAccount.name} berhasil dihapus.`);
        setDeletingAccount(null);
      }
    } catch {
      showToast('Terjadi kendala jaringan saat menghapus akun.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Compile full account list from DB & Local overrides
  const allAccounts: Array<{
    id: string;
    role: string;
    name: string;
    identifier: string;
    password: string;
    summary: string;
    whatsapp?: string;
    source: string;
    isDefaultPwd: boolean;
  }> = [];

  // 1. Admin Account
  allAccounts.push({
    id: 'admin_master',
    role: 'admin',
    name: adminCredential.name || 'Super Admin',
    identifier: adminCredential.email,
    password: adminCredential.password,
    summary: 'Super Admin • Hak Akses Penuh Sistem Operasional',
    source: 'admin_credentials',
    isDefaultPwd: adminCredential.password === '123456789',
  });

  const knownIds = new Set<string>();
  if (adminCredential?.email) {
    knownIds.add(adminCredential.email.toLowerCase());
  }

  // Helper for applying local edits
  const applyOverrides = (acc: PortalCredentialDoc) => {
    const override = localUpdatedAccounts[acc.id || ''] || {};
    return {
      ...acc,
      ...override,
    };
  };

  // 2. Newly Created Accounts locally
  localCreatedAccounts.forEach((acc) => {
    if (!localDeletedIds.has(acc.id || '')) {
      const merged = applyOverrides(acc);
      const rawId = (merged.identifier || '').toLowerCase();
      if (rawId && !knownIds.has(rawId)) {
        knownIds.add(rawId);
        allAccounts.push({
          id: merged.id || 'new_acc',
          role: merged.role || 'siswa',
          name: merged.name || 'Pengguna',
          identifier: merged.identifier || '',
          password: merged.password || '123456789',
          summary: merged.summary || 'Akun Baru',
          whatsapp: merged.whatsapp || '',
          source: 'portal_credentials (Baru)',
          isDefaultPwd: merged.password === '123456789',
        });
      }
    }
  });

  // 3. Accounts from portal_credentials
  portalAccounts.forEach((acc) => {
    const docId = acc.id || acc.identifier || 'acc';
    if (!localDeletedIds.has(docId)) {
      const merged = applyOverrides(acc);
      const rawId = (merged.identifier || '').toLowerCase();
      if (rawId && !knownIds.has(rawId)) {
        knownIds.add(rawId);
        allAccounts.push({
          id: docId,
          role: merged.role || 'siswa',
          name: merged.name || 'Pengguna',
          identifier: merged.identifier || '',
          password: merged.password || '123456789',
          summary: merged.summary || `Akun ${(merged.role || 'pengguna').toUpperCase()} Terhubung`,
          whatsapp: merged.whatsapp || '',
          source: 'portal_credentials',
          isDefaultPwd: merged.password === '123456789',
        });
      }
    }
  });

  // 4. Fallback for verified registrations
  verifiedRegistrations.forEach((reg) => {
    if (reg.paymentStatus === 'verified') {
      const sId = (reg.studentId || '').toLowerCase();
      const sDocId = `siswa_${reg.studentId}`;
      if (sId && !knownIds.has(sId) && !localDeletedIds.has(sDocId)) {
        knownIds.add(sId);
        const override = localUpdatedAccounts[sDocId] || {};
        allAccounts.push({
          id: sDocId,
          role: override.role || 'siswa',
          name: override.name || reg.studentName || 'Siswa Terverifikasi',
          identifier: override.identifier || reg.studentId || '',
          password: override.password || '123456789',
          summary: override.summary || `Siswa Terverifikasi • Jenjang: ${(reg.level || 'SD').toUpperCase()} • WA: ${reg.whatsapp || ''}`,
          whatsapp: override.whatsapp || reg.whatsapp || '',
          source: 'registrations (Live DB)',
          isDefaultPwd: (override.password || '123456789') === '123456789',
        });
      }

      const pWa = (reg.whatsapp || '').replace(/[^0-9]/g, '');
      const oDocId = `ortu_${reg.studentId}`;
      if (pWa && !knownIds.has(pWa) && !localDeletedIds.has(oDocId)) {
        knownIds.add(pWa);
        const override = localUpdatedAccounts[oDocId] || {};
        allAccounts.push({
          id: oDocId,
          role: override.role || 'orang_tua',
          name: override.name || `${reg.parentName || 'Wali Murid'} (Wali ${reg.studentName || 'Siswa'})`,
          identifier: override.identifier || reg.whatsapp || '',
          password: override.password || '123456789',
          summary: override.summary || `Wali Murid Terverifikasi • Siswa: ${reg.studentName || ''} (${reg.studentId || ''})`,
          whatsapp: override.whatsapp || reg.whatsapp || '',
          source: 'registrations (Live DB)',
          isDefaultPwd: (override.password || '123456789') === '123456789',
        });
      }
    }
  });

  // 5. Fallback for accepted tutors
  acceptedTutors.forEach((tutor) => {
    if (tutor.status === 'accepted') {
      const tWa = (tutor.whatsapp || '').replace(/[^0-9]/g, '');
      const tId = (tutor.id || '').toLowerCase();
      const tDocId = `tutor_${tutor.id}`;
      if (((tWa && !knownIds.has(tWa)) || (tId && !knownIds.has(tId))) && !localDeletedIds.has(tDocId)) {
        if (tWa) knownIds.add(tWa);
        if (tId) knownIds.add(tId);
        const override = localUpdatedAccounts[tDocId] || {};
        allAccounts.push({
          id: tDocId,
          role: override.role || 'tutor',
          name: override.name || tutor.fullName || 'Tutor Terakreditasi',
          identifier: override.identifier || tutor.whatsapp || tutor.id || '',
          password: override.password || '123456789',
          summary: override.summary || `Tutor Terakreditasi • ${tutor.education || ''} • Mapel: ${tutor.subjects || ''} • Kec. ${tutor.district || ''}`,
          whatsapp: override.whatsapp || tutor.whatsapp || '',
          source: 'tutor_registrations (Live DB)',
          isDefaultPwd: (override.password || '123456789') === '123456789',
        });
      }
    }
  });

  // Filter accounts
  const filteredAccounts = allAccounts.filter((acc) => {
    const matchesRole = roleFilter === 'all' || acc.role === roleFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      !q ||
      (acc.name || '').toLowerCase().includes(q) ||
      (acc.identifier || '').toLowerCase().includes(q) ||
      (acc.whatsapp && acc.whatsapp.includes(q)) ||
      (acc.role || '').toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const countAdmin = allAccounts.filter((a) => a.role === 'admin' || a.role === 'super_admin').length;
  const countTutor = allAccounts.filter((a) => a.role === 'tutor').length;
  const countSiswa = allAccounts.filter((a) => a.role === 'siswa').length;
  const countOrtu = allAccounts.filter((a) => a.role === 'orang_tua').length;

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#284230] text-white shadow-2xs">
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
            {(role || 'USER').toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Feedback Notification */}
      {toastFeedback && (
        <div
          data-testid="toast-rbac"
          className="fixed bottom-6 right-6 z-50 bg-[#284230] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-fade-in"
        >
          <span className="material-symbols-outlined text-[20px] text-[#c8ebce]">check_circle</span>
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* Header & Database Sync Status */}
      <div className="pb-4 border-b border-[#2A2823]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-[#2A2823] font-display">
              Akun &amp; Hak Akses Multi-Role
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[11px] font-bold inline-flex items-center gap-1 border border-[#3F5A46]/20">
              <span className="material-symbols-outlined text-[13px]">database</span>
              <span>Cloud Firestore Aktif</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B675F] mt-1">
            Manajemen hak akses, kata sandi, dan peran operasional terpusat langsung ke basis data Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          {/* Tombol Tambah Akun Baru: Eksklusif Super Admin */}
          {isSuperAdmin ? (
            <button
              type="button"
              data-testid="btn-tambah-akun"
              onClick={() => {
                setCreateStatus(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#284230] hover:bg-[#3F5A46] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Tambah Akun Baru</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Akses Dibatasi: Hanya role Super Admin yang dapat menambahkan akun baru"
              className="px-4 py-2.5 rounded-xl bg-gray-200 text-gray-500 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-70"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>+ Tambah Akun (Hanya Super Admin)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSyncDatabase}
            disabled={isSyncingDb}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F1] text-[#2A2823] border border-[#2A2823]/15 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            title="Sinkronkan akun pendaftar terverifikasi ke Cloud Firestore"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSyncingDb ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isSyncingDb ? 'Menyinkronkan...' : 'Sinkronkan DB'}</span>
          </button>
        </div>
      </div>

      {/* RBAC Notice Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          isSuperAdmin
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`material-symbols-outlined text-[24px] shrink-0 ${
              isSuperAdmin ? 'text-[#3F5A46]' : 'text-amber-700'
            }`}
          >
            {isSuperAdmin ? 'verified_user' : 'lock'}
          </span>
          <div>
            <div className="font-bold text-sm">
              {isSuperAdmin
                ? 'Hak Akses Penuh: Super Admin Aktif'
                : 'Mode Tinjauan Terbatas (Read-Only)'}
            </div>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
              {isSuperAdmin
                ? 'Sebagai Super Admin, Anda memiliki wewenang eksklusif untuk Menambah (Create), Mengedit (Edit/Update), Mengatur Peran (Setting Role), dan Menghapus (Delete) akun di Cloud Firestore.'
                : 'Hanya pengguna dengan role Super Admin yang dapat membuat, mengedit, mengubah peran, atau menghapus akun dari basis data.'}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
              isSuperAdmin
                ? 'bg-[#284230] text-white'
                : 'bg-amber-200 text-amber-900 border border-amber-300'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {isSuperAdmin ? 'admin_panel_settings' : 'visibility'}
            </span>
            <span>{isSuperAdmin ? 'SUPER ADMIN ACCESS' : 'READ-ONLY ACCESS'}</span>
          </span>
        </div>
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

      {/* Card Profil Super Admin */}
      <div className="p-6 rounded-3xl bg-white border border-[#2A2823]/10 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Monogram Avatar Super Admin: SA */}
            <div className="w-16 h-16 rounded-2xl bg-[#284230] text-white flex items-center justify-center font-black text-xl shadow-xs">
              SA
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2A2823]">
                {adminCredential.name || 'Super Admin'}
              </h3>
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
              <span>Active Super Admin Auth</span>
            </span>
          </div>
        </div>

        {/* Form Ubah Password Admin (Hanya Super Admin) */}
        {isSuperAdmin && (
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
        )}
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
            placeholder="Cari berdasarkan nama pengguna, ID login, nomor WhatsApp, atau peran..."
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
                <th className="py-3.5 px-4 text-center">Aksi Manajemen (RBAC)</th>
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
                  const isMasterAdmin = account.id === 'admin_master';

                  return (
                    <tr key={rowKey} className="hover:bg-[#FAF7F1]/60 transition-colors">
                      {/* Peran & Quick Role Selector */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {renderRoleBadge(account.role)}
                          {/* Quick Setting Role dropdown khusus Super Admin (non-master) */}
                          {isSuperAdmin && !isMasterAdmin && (
                            <select
                              value={account.role}
                              data-testid={`select-role-${account.id}`}
                              onChange={(e) =>
                                handleQuickRoleChange(account.id, account.name, e.target.value)
                              }
                              className="text-[10px] font-semibold bg-[#FAF7F1] border border-[#2A2823]/15 rounded-md px-1.5 py-0.5 text-[#2A2823] cursor-pointer hover:bg-white focus:ring-1 focus:ring-[#3F5A46] outline-none"
                              title="Ubah peran akun ini di Firestore"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="admin">Admin</option>
                              <option value="tutor">Tutor</option>
                              <option value="siswa">Siswa</option>
                              <option value="orang_tua">Wali Murid</option>
                            </select>
                          )}
                        </div>
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

                      {/* Aksi RBAC */}
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

                          {/* Tombol EDIT & SETTING ROLE (Hanya Super Admin) */}
                          {isSuperAdmin && !isMasterAdmin ? (
                            <>
                              <button
                                type="button"
                                data-testid={`btn-edit-${account.id}`}
                                onClick={() => {
                                  setEditingAccount({
                                    id: account.id,
                                    name: account.name,
                                    role: (account.role as PortalRole) || 'siswa',
                                    identifier: account.identifier,
                                    whatsapp: account.whatsapp || '',
                                    password: account.password,
                                    summary: account.summary,
                                  });
                                  setEditStatus(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-[#FAF7F1] hover:bg-[#3F5A46]/10 text-[#3F5A46] font-bold text-[10px] border border-[#2A2823]/10 cursor-pointer transition-all inline-flex items-center gap-1"
                                title="Edit Akun & Atur Peran"
                              >
                                <span className="material-symbols-outlined text-[13px]">edit</span>
                                <span>Edit</span>
                              </button>

                              {!account.isDefaultPwd && (
                                <button
                                  type="button"
                                  onClick={() => handleResetToDefault(account)}
                                  className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200 cursor-pointer transition-all"
                                  title="Reset Password ke default: 123456789"
                                >
                                  {isResetCopied ? 'Direset!' : 'Reset 123456789'}
                                </button>
                              )}

                              {/* Tombol DELETE (Hapus Akun dari DB) */}
                              <button
                                type="button"
                                data-testid={`btn-delete-${account.id}`}
                                onClick={() => {
                                  setDeletingAccount({
                                    id: account.id,
                                    name: account.name,
                                    identifier: account.identifier,
                                    role: account.role,
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer transition-all"
                                title="Hapus Akun dari Basis Data"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </>
                          ) : isMasterAdmin ? (
                            <span className="text-[10px] font-bold text-[#3F5A46] bg-[#EAF2ED] px-2 py-1 rounded-md border border-[#3F5A46]/20">
                              Akun Master
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">
                              Read-Only
                            </span>
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
            Setiap perubahan akun dan peran langsung tersinkronisasi ke Cloud Firestore secara otomatis.
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

      {/* MODAL 1: CREATE ACCOUNT (TAMBAH AKUN BARU) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#2A2823]/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2823]/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46] text-[24px]">person_add</span>
                <h3 className="font-bold text-base text-[#2A2823]">
                  Tambah Akun Pengguna Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F1] hover:bg-[#2A2823]/10 flex items-center justify-center text-[#6B675F] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {createStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  createStatus.includes('berhasil')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {createStatus.includes('berhasil') ? 'check_circle' : 'error'}
                </span>
                <span>{createStatus}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2A2823] block mb-1">
                    Nama Lengkap Pengguna <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Contoh: Ahmad Fauzi"
                    className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2A2823] block mb-1">
                    Peran / Hak Akses <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as PortalRole })}
                    className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer font-bold"
                  >
                    <option value="siswa">Siswa Aktif</option>
                    <option value="tutor">Tutor / Guru</option>
                    <option value="orang_tua">Wali Murid</option>
                    <option value="admin">Admin Operasional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2A2823] block mb-1">
                    Login ID / Identifier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.identifier}
                    onChange={(e) => setCreateForm({ ...createForm, identifier: e.target.value })}
                    placeholder="Email, ID Siswa, atau No HP"
                    className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2A2823] block mb-1">
                    Nomor WhatsApp (Opsional)
                  </label>
                  <input
                    type="text"
                    value={createForm.whatsapp}
                    onChange={(e) => setCreateForm({ ...createForm, whatsapp: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#2A2823] block mb-1">
                  Kata Sandi Awal <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Kata sandi akun"
                    className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, password: '123456789' })}
                    className="px-3 py-2 rounded-xl bg-[#EAF2ED] text-[#284230] font-bold text-[10px] shrink-0 border border-[#3F5A46]/20 cursor-pointer"
                  >
                    Set 123456789
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#2A2823] block mb-1">
                  Deskripsi / Catatan Akun
                </label>
                <input
                  type="text"
                  value={createForm.summary}
                  onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
                  placeholder="Contoh: Siswa Bimbingan Privat Mertoyudan"
                  className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#2A2823]/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF7F1] text-xs font-bold text-[#6B675F] hover:bg-[#2A2823]/10 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAccount}
                  className="flex-1 py-2.5 rounded-xl bg-[#284230] text-xs font-bold text-white hover:bg-[#3F5A46] cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isCreatingAccount ? 'Menyimpan...' : 'Simpan Akun Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ACCOUNT & SETTING ROLE */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#2A2823]/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2823]/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46] text-[22px]">tune</span>
                <h3 className="font-bold text-base text-[#2A2823]">
                  Edit Akun &amp; Atur Peran (RBAC)
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

            <form onSubmit={handleEditAccountSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#2A2823] block mb-1">
                  Nama Pengguna
                </label>
                <input
                  type="text"
                  required
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#2A2823] block mb-1">
                  Setting Role (Hak Akses)
                </label>
                <select
                  value={editingAccount.role}
                  onChange={(e) => setEditingAccount({ ...editingAccount, role: e.target.value as PortalRole })}
                  className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none font-bold cursor-pointer"
                >
                  <option value="admin">Admin Operasional</option>
                  <option value="tutor">Tutor / Guru</option>
                  <option value="siswa">Siswa Aktif</option>
                  <option value="orang_tua">Wali Murid</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2A2823] block mb-1">
                    Identifier / Login ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAccount.identifier}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, identifier: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2A2823] block mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingAccount.whatsapp}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, whatsapp: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#2A2823] block mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="text"
                  required
                  value={editingAccount.password}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#2A2823] block mb-1">
                  Ringkasan Keterangan
                </label>
                <input
                  type="text"
                  value={editingAccount.summary}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, summary: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#FAF7F1] border border-[#2A2823]/15 rounded-xl text-xs text-[#2A2823] focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#2A2823]/10">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF7F1] text-xs font-bold text-[#6B675F] hover:bg-[#2A2823]/10 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingAccount}
                  className="flex-1 py-2.5 rounded-xl bg-[#284230] text-xs font-bold text-white hover:bg-[#3F5A46] cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isUpdatingAccount ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE ACCOUNT */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#2A2823]/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="font-bold text-base text-[#2A2823]">
                Konfirmasi Hapus Akun
              </h3>
            </div>

            <p className="text-xs text-[#6B675F] leading-relaxed">
              Apakah Anda yakin ingin menghapus akun{' '}
              <strong className="text-[#2A2823]">{deletingAccount.name}</strong> (
              <span className="font-mono text-[#284230]">{deletingAccount.identifier}</span>, Peran:{' '}
              {deletingAccount.role.toUpperCase()}) secara permanen dari Cloud Firestore?
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800">
              Tindakan ini tidak dapat dibatalkan. Pengguna tidak akan dapat login lagi ke portal.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#FAF7F1] text-xs font-bold text-[#6B675F] hover:bg-[#2A2823]/10 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                <span>{isDeletingAccount ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
