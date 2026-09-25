import React, { useState, useEffect } from 'react';
import {
  fetchRegistrationsFromFirestore,
  subscribeToRegistrations,
  updateRegistrationStatusInFirestore,
  FirestoreRegistrationDoc,
  fetchAdminCredentialFromFirestore,
  updateAdminPasswordInFirestore,
  fetchConnectedDatabaseAccounts,
  AdminCredentialDoc,
  PortalCredentialDoc,
  DEFAULT_ADMIN_CREDENTIAL,
} from '../firebase';
import { StudentVerificationSubTab } from './admin/StudentVerificationSubTab';
import { StudentManagementSubTab } from './admin/StudentManagementSubTab';
import { StudentDetailModal } from './admin/StudentDetailModal';
import { StudentFormModal } from './admin/StudentFormModal';
import { RegistrationSlipModal } from './admin/RegistrationSlipModal';
import { AddSessionsModal } from './admin/AddSessionsModal';
import {
  ManagedStudent,
  INITIAL_MANAGED_STUDENTS,
} from './admin/studentData';

interface AdminDashboardProps {
  onLogout: () => void;
  onViewLanding: () => void;
}

type TabType =
  | 'ringkasan'
  | 'jadwal'
  | 'siswa'
  | 'tutor'
  | 'mapel'
  | 'presensi'
  | 'nilai'
  | 'lkpd'
  | 'bank_soal'
  | 'video'
  | 'tagihan'
  | 'midtrans'
  | 'terlambat'
  | 'laporan'
  | 'promo'
  | 'sertifikat'
  | 'akun';

interface ScheduleItem {
  id: string;
  studentName: string;
  level: string;
  subject: string;
  tutor: string;
  time: string;
  address: string;
  status: 'selesai' | 'berlangsung' | 'otw' | 'terkonfirmasi';
  duration: string;
  geofenceRadius: string;
}

const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: 'SCH-01',
    studentName: 'Kevin Pratama',
    level: 'SD UMUM (Kelas 4)',
    subject: 'Tematik & Matematika',
    tutor: 'Kak Anindya, S.Pd.',
    time: '14:00 - 15:10 WIB',
    address: 'Secang, Kab. Magelang (Dekat Pasar Secang)',
    status: 'selesai',
    duration: '70 Menit',
    geofenceRadius: 'Presensi Valid (18m)',
  },
  {
    id: 'SCH-02',
    studentName: 'Michelle Gunawan',
    level: 'SD UMUM (Kelas 4)',
    subject: 'Matematika & IPA Terpadu',
    tutor: 'Kak Dimas Arya, S.Si.',
    time: '15:30 - 16:40 WIB',
    address: 'Muntilan, Kab. Magelang (Jl. Pemuda)',
    status: 'berlangsung',
    duration: '42/70m Berjalan',
    geofenceRadius: 'Geofence Verified (8m)',
  },
  {
    id: 'SCH-03',
    studentName: 'Farhan Ramadhan',
    level: 'SMA 12 - UTBK',
    subject: 'Penalaran Matematika & TPS',
    tutor: 'Kak Sarah Larasati, M.Pd.',
    time: '16:45 - 17:55 WIB',
    address: 'Mungkid, Kab. Magelang (Kawasan Pemkab)',
    status: 'otw',
    duration: 'ETA 12 Menit',
    geofenceRadius: 'GPS Radius 35m',
  },
  {
    id: 'SCH-04',
    studentName: 'Naufal Al-Ghifari',
    level: 'SD UMUM (Kelas 2)',
    subject: 'Calistung & Bahasa Jawa',
    tutor: 'Kak Siti Rahma, S.Pd.',
    time: '16:30 - 17:40 WIB',
    address: 'Krincing, Secang, Kab. Magelang',
    status: 'terkonfirmasi',
    duration: 'Sesi Sore',
    geofenceRadius: 'Terkonfirmasi Ortu',
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onViewLanding }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('ringkasan');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilterRegion, setSelectedFilterRegion] = useState<string>('Semua Wilayah Magelang');

  // Firestore live registrations state
  const [firestoreRegistrations, setFirestoreRegistrations] = useState<FirestoreRegistrationDoc[]>([]);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState<boolean>(false);
  const [selectedRegistration, setSelectedRegistration] = useState<FirestoreRegistrationDoc | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Sub-menu state for Data Siswa & Wali
  const [studentSubTab, setStudentSubTab] = useState<'verifikasi' | 'manajemen'>('verifikasi');
  const [isStudentMenuExpanded, setIsStudentMenuExpanded] = useState<boolean>(false);

  // Master managed students state
  const [managedStudents, setManagedStudents] = useState<ManagedStudent[]>(INITIAL_MANAGED_STUDENTS);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<ManagedStudent | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<ManagedStudent | null>(null);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState<boolean>(false);
  const [selectedStudentForSessions, setSelectedStudentForSessions] = useState<ManagedStudent | null>(null);
  const [isAddSessionsOpen, setIsAddSessionsOpen] = useState<boolean>(false);
  const [selectedSlipRegistration, setSelectedSlipRegistration] = useState<FirestoreRegistrationDoc | null>(null);

  // Quick modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);

  // New visit state
  const [newVisitStudent, setNewVisitStudent] = useState<string>('');
  const [newVisitTutor, setNewVisitTutor] = useState<string>('Kak Anindya, S.Pd.');
  const [newVisitTime, setNewVisitTime] = useState<string>('15:00 WIB');
  const [newVisitAddress, setNewVisitAddress] = useState<string>('');

  // New invoice state
  const [newInvoiceStudent, setNewInvoiceStudent] = useState<string>('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState<number>(280000);
  const [newInvoicePackage, setNewInvoicePackage] = useState<string>('Paket 8 Sesi Bulanan');

  // Database credentials & accounts state
  const [adminCredential, setAdminCredential] = useState<AdminCredentialDoc>(DEFAULT_ADMIN_CREDENTIAL);
  const [connectedDatabaseAccounts, setConnectedDatabaseAccounts] = useState<{
    admin: AdminCredentialDoc;
    portalAccounts: PortalCredentialDoc[];
    totalRegisteredStudents: number;
  } | null>(null);
  const [showPasswordInPlain, setShowPasswordInPlain] = useState<boolean>(false);
  const [oldPasswordInput, setOldPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);

  // Load registrations from Firestore
  const loadFirestoreData = async () => {
    setIsLoadingFirestore(true);
    try {
      const data = await fetchRegistrationsFromFirestore();
      setFirestoreRegistrations(data);
    } catch (err) {
      console.error('Failed to load from Firestore:', err);
    } finally {
      setIsLoadingFirestore(false);
    }
  };

  const loadAdminCredentialsFromDb = async () => {
    try {
      const cred = await fetchAdminCredentialFromFirestore();
      setAdminCredential(cred);
      const accounts = await fetchConnectedDatabaseAccounts();
      setConnectedDatabaseAccounts(accounts);
    } catch (e) {
      console.error('Error fetching admin creds from Firestore:', e);
    }
  };

  const handleSyncDatabase = async () => {
    setIsSyncingDb(true);
    try {
      await loadAdminCredentialsFromDb();
      await loadFirestoreData();
      setActionFeedback('Sinkronisasi database Cloud Firestore berhasil!');
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleUpdatePasswordInFirestore = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPasswordChangeStatus({
        type: 'error',
        message: 'Kata sandi baru minimal harus 6 karakter.',
      });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeStatus({
        type: 'error',
        message: 'Konfirmasi kata sandi baru tidak cocok.',
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await updateAdminPasswordInFirestore(oldPasswordInput, newPasswordInput);
      if (res.success) {
        setPasswordChangeStatus({
          type: 'success',
          message: 'Kata sandi admin berhasil diperbarui langsung di database Cloud Firestore!',
        });
        setOldPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        await loadAdminCredentialsFromDb();
      } else {
        setPasswordChangeStatus({
          type: 'error',
          message: res.error || 'Gagal mengubah kata sandi di database.',
        });
      }
    } catch (err) {
      console.error('Update password error:', err);
      setPasswordChangeStatus({
        type: 'error',
        message: 'Terjadi kendala saat memperbarui database.',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  useEffect(() => {
    loadAdminCredentialsFromDb();
    setIsLoadingFirestore(true);
    // Real-time live listener for registrations
    const unsubscribe = subscribeToRegistrations(
      (data) => {
        setFirestoreRegistrations(data);
        setIsLoadingFirestore(false);
      },
      (err) => {
        console.warn('Real-time listener warning, executing fallback fetch:', err);
        loadFirestoreData();
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleVerifyStudent = async (studentId: string) => {
    try {
      await updateRegistrationStatusInFirestore(studentId, 'verified');
      setActionFeedback(`Siswa ${studentId} berhasil diverifikasi & status diperbarui ke Cloud Firestore!`);
      // Update local state
      setFirestoreRegistrations((prev) =>
        prev.map((item) => (item.studentId === studentId ? { ...item, paymentStatus: 'verified' } : item))
      );

      // Automatically register or sync into managedStudents if not already present
      const reg = firestoreRegistrations.find((r) => r.studentId === studentId);
      if (reg) {
        setManagedStudents((prev) => {
          if (prev.some((s) => s.id === reg.studentId)) return prev;
          const newManaged: ManagedStudent = {
            id: reg.studentId,
            studentName: reg.studentName,
            level: reg.level.toUpperCase(),
            grade:
              reg.level === 'sd'
                ? 'Kelas 4 SD'
                : reg.level === 'calistung'
                ? 'Transisi SD'
                : reg.level === 'smp'
                ? 'Kelas 8 SMP'
                : 'Kelas 12 SMA',
            schoolOrigin: 'Siswa Baru (Pendaftaran Online)',
            parentName: reg.parentName,
            parentRelation: 'Wali',
            whatsapp: reg.whatsapp,
            address: reg.homeAddress,
            district: reg.homeAddress.toLowerCase().includes('secang')
              ? 'Secang'
              : reg.homeAddress.toLowerCase().includes('muntilan')
              ? 'Muntilan'
              : reg.homeAddress.toLowerCase().includes('mertoyudan')
              ? 'Mertoyudan'
              : reg.homeAddress.toLowerCase().includes('mungkid')
              ? 'Mungkid'
              : reg.homeAddress.toLowerCase().includes('borobudur')
              ? 'Borobudur'
              : 'Secang',
            tutorName: 'Kak Anindya, S.Pd.',
            subjects: ['Tematik', 'Matematika'],
            packageSessions: 8,
            completedSessions: 0,
            status: 'aktif',
            joinDate: new Date().toISOString().split('T')[0],
            lastEvaluationScore: 90,
            notes: `Terverifikasi dari pendaftaran online #${reg.invoiceNumber}. Hari: ${reg.selectedSchedule.join(
              ', '
            )}`,
            isFromFirestore: true,
          };
          return [newManaged, ...prev];
        });
      }

      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error(err);
      setActionFeedback('Gagal memperbarui status ke Firestore.');
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleSaveStudent = (savedStudent: ManagedStudent) => {
    setManagedStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === savedStudent.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedStudent;
        return updated;
      }
      return [savedStudent, ...prev];
    });
    setActionFeedback(`Data siswa ${savedStudent.studentName} berhasil disimpan!`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleDeleteStudent = (id: string) => {
    setManagedStudents((prev) => prev.filter((s) => s.id !== id));
    setActionFeedback(`Data siswa berhasil dihapus dari database.`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleAddSessionsConfirm = (
    studentId: string,
    additionalSessions: number,
    updatedStatus: 'aktif' | 'perlu_perpanjang' | 'cuti'
  ) => {
    setManagedStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            packageSessions: s.packageSessions + additionalSessions,
            status: updatedStatus,
          };
        }
        return s;
      })
    );
    setActionFeedback(`Paket belajar siswa #${studentId} berhasil ditambah +${additionalSessions} sesi!`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleExportStudents = (format: 'excel' | 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = [
        'ID,Nama Siswa,Jenjang,Kelas,Sekolah,Nama Wali,Hubungan,WhatsApp,Kecamatan,Alamat,Tutor,Paket Sesi,Selesai,Status\n',
      ];
      const rows = managedStudents.map(
        (s) =>
          `"${s.id}","${s.studentName}","${s.level}","${s.grade}","${s.schoolOrigin}","${s.parentName}","${s.parentRelation}","${s.whatsapp}","${s.district}","${s.address.replace(
            /"/g,
            '""'
          )}","${s.tutorName}",${s.packageSessions},${s.completedSessions},"${s.status}"\n`
      );
      const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `data_siswa_bright_future_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setActionFeedback('File CSV Data Siswa & Wali berhasil diunduh!');
    } else {
      setActionFeedback(`Ekspor data format ${format.toUpperCase()} berhasil disiapkan.`);
    }
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const pendingCount = firestoreRegistrations.filter((r) => r.paymentStatus === 'pending').length;

  return (
    <div className="bg-[#FAF7F1] font-sans text-[#2A2823] min-h-screen selection:bg-[#EFC9AE] selection:text-[#6b2702] relative">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-5 right-5 z-60 bg-[#284230] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm animate-bounce">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <span className="font-semibold">{actionFeedback}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#f6f3ed]/95 backdrop-blur-2xl z-50 flex flex-col shadow-[0_1px_12px_rgba(42,40,35,0.06)] transition-all duration-300 ease-in-out border-r border-[#2A2823]/10 ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Header Branding */}
        <div className="h-20 px-4 flex items-center justify-between shrink-0 bg-[#f0eee8]/70 border-b border-[#2A2823]/10">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.svg"
              alt="Bright Future Logo"
              className="h-9 w-9 shrink-0 object-contain rounded-xl shadow-xs"
            />
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base text-[#284230] font-bold leading-none truncate">Bright Future</span>
                <span className="text-[10px] text-[#6B675F] uppercase tracking-widest mt-1 font-semibold truncate">
                  Operational Hub
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-8 h-8 rounded-xl bg-white/90 text-[#6B675F] hover:text-[#284230] hover:bg-[#ebe8e2] transition-all flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
            title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Lipat Sidebar'}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isSidebarCollapsed ? 'menu' : 'menu_open'}
            </span>
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Category 1: Utama & Operasional */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-[#6B675F] font-bold">
                Utama &amp; Operasional
              </div>
            )}
            <button
              onClick={() => setActiveTab('ringkasan')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'ringkasan'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">dashboard</span>
                {!isSidebarCollapsed && <span>Ringkasan Dashboard</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('jadwal')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'jadwal'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">calendar_month</span>
                {!isSidebarCollapsed && <span>Jadwal &amp; Penugasan</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[11px] font-bold">
                  16
                </span>
              )}
            </button>

            {/* Menu: Data Siswa & Wali with Sub Menus */}
            <div>
              <button
                onClick={() => {
                  setActiveTab('siswa');
                  if (!isSidebarCollapsed) {
                    setIsStudentMenuExpanded(!isStudentMenuExpanded);
                  }
                }}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                  activeTab === 'siswa'
                    ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                    : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
                }`}
                title="Data Siswa & Wali"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[20px] shrink-0">groups</span>
                  {!isSidebarCollapsed && <span className="truncate">Data Siswa &amp; Wali</span>}
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pendingCount > 0 ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        {pendingCount}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#f0eee8] text-[#284230]">
                        {managedStudents.length}
                      </span>
                    )}
                    <span className="material-symbols-outlined text-[16px] transition-transform duration-200">
                      {isStudentMenuExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                )}
              </button>

              {/* Sub Menus: Verifikasi Pendaftaran & Manajemen Siswa & Wali */}
              {!isSidebarCollapsed && isStudentMenuExpanded && (
                <div className="ml-4 pl-2.5 border-l-2 border-[#2A2823]/15 mt-1 space-y-1">
                  {/* Sub Menu 1: Verifikasi Pendaftaran */}
                  <button
                    onClick={() => {
                      setActiveTab('siswa');
                      setStudentSubTab('verifikasi');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === 'siswa' && studentSubTab === 'verifikasi'
                        ? 'bg-[#284230] text-white font-bold shadow-xs'
                        : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[16px] shrink-0">how_to_reg</span>
                      <span className="truncate">Verifikasi Pendaftaran</span>
                    </div>
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold shrink-0">
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  {/* Sub Menu 2: Manajemen Siswa & Wali */}
                  <button
                    onClick={() => {
                      setActiveTab('siswa');
                      setStudentSubTab('manajemen');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === 'siswa' && studentSubTab === 'manajemen'
                        ? 'bg-[#284230] text-white font-bold shadow-xs'
                        : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[16px] shrink-0">manage_accounts</span>
                      <span className="truncate">Manajemen Siswa &amp; Wali</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#f0eee8] text-[#284230] text-[9px] font-bold shrink-0">
                      {managedStudents.length}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('tutor')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'tutor'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">school</span>
                {!isSidebarCollapsed && <span>Data Tutor</span>}
              </div>
              {!isSidebarCollapsed && <span className="text-[11px] text-[#6B675F] font-semibold">18</span>}
            </button>

            <button
              onClick={() => setActiveTab('mapel')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'mapel'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">auto_stories</span>
                {!isSidebarCollapsed && <span>Kelas &amp; Mapel SD UMUM</span>}
              </div>
            </button>
          </div>

          {/* Category 2: Akademik & LMS */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-[#6B675F] font-bold">
                Akademik &amp; LMS
              </div>
            )}
            <button
              onClick={() => setActiveTab('presensi')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'presensi'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">fact_check</span>
                {!isSidebarCollapsed && <span>Presensi Kunjungan (GPS)</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('nilai')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'nilai'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">monitoring</span>
                {!isSidebarCollapsed && <span>Nilai &amp; Perkembangan</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('lkpd')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'lkpd'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">menu_book</span>
                {!isSidebarCollapsed && <span>Materi &amp; LKPD Fisik</span>}
              </div>
            </button>
          </div>

          {/* Category 3: Keuangan & Midtrans */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-[#6B675F] font-bold">
                Keuangan &amp; Midtrans
              </div>
            )}
            <button
              onClick={() => setActiveTab('tagihan')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'tagihan'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">receipt_long</span>
                {!isSidebarCollapsed && <span>Tagihan &amp; Invoice</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('midtrans')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'midtrans'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">account_balance_wallet</span>
                {!isSidebarCollapsed && <span>Transaksi Midtrans</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('terlambat')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'terlambat'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#C1683F] shrink-0">warning</span>
                {!isSidebarCollapsed && <span>Tagihan Terlambat</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-2 py-0.5 rounded-full bg-[#EFC9AE] text-[#6b2702] text-[11px] font-bold">
                  3
                </span>
              )}
            </button>
          </div>

          {/* Category 4: Pengaturan */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-[#6B675F] font-bold">
                Pengaturan &amp; Info
              </div>
            )}
            <button
              onClick={() => setActiveTab('akun')}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer ${
                activeTab === 'akun'
                  ? 'bg-[#3F5A46] text-white shadow-sm font-bold'
                  : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] shrink-0">admin_panel_settings</span>
                {!isSidebarCollapsed && <span>Akun &amp; Hak Akses</span>}
              </div>
            </button>
          </div>
        </div>

        {/* User Profile in Sidebar footer */}
        <div className="p-3 shrink-0 bg-[#f0eee8]/60 border-t border-[#2A2823]/10">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/80 shadow-xs">
            <div className="w-9 h-9 shrink-0 rounded-full bg-[#c8ebce] flex items-center justify-center text-[#284230] font-bold text-sm">
              MY
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs text-[#2A2823] font-bold truncate">Monica Yuliana</span>
                <span className="text-[10px] text-[#6B675F] truncate">Owner &amp; Head Admin</span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="p-1 text-[#6B675F] hover:text-red-600 transition-colors cursor-pointer"
              title="Keluar dari Dashboard"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Wrapper */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'pl-20' : 'pl-72'
        }`}
      >
        {/* Top Header Bar */}
        <header
          className={`fixed top-0 right-0 h-20 bg-[#FAF7F1]/85 backdrop-blur-xl shadow-xs z-40 flex items-center justify-between px-6 transition-all duration-300 border-b border-[#2A2823]/10 ${
            isSidebarCollapsed ? 'left-20' : 'left-72'
          }`}
        >
          {/* Search bar */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative w-full flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#6B675F] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari data siswa, tutor, nomor invoice (BF-INV-...)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white text-[#2A2823] text-xs sm:text-sm rounded-xl shadow-xs placeholder:text-[#6B675F]/70 focus:outline-none focus:ring-2 focus:ring-[#6F8F76] transition-all border border-[#2A2823]/10"
              />
            </div>
          </div>

          {/* Quick Actions & Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C1683F] text-white hover:bg-[#a8552f] text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">add_circle</span>
              <span>+ Jadwal Kunjungan</span>
            </button>

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#3F5A46] border border-[#2A2823]/10 hover:bg-[#ebe8e2] text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">receipt</span>
              <span>+ Buat Tagihan</span>
            </button>

            <div className="h-6 w-px bg-[#2A2823]/10 mx-1"></div>

            {/* Back to Website Button */}
            <button
              onClick={onViewLanding}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#284230] border border-[#284230]/20 hover:bg-[#c8ebce]/30 text-xs font-bold transition-all cursor-pointer"
              title="Lihat Tampilan Website Publik"
            >
              <span className="material-symbols-outlined text-[17px]">travel_explore</span>
              <span className="hidden lg:inline">Web Publik</span>
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => {
                  loadFirestoreData();
                  setActionFeedback('Data Firestore berhasil dimuat ulang!');
                  setTimeout(() => setActionFeedback(null), 3000);
                }}
                className="relative p-2 rounded-xl bg-white text-[#2A2823] hover:bg-[#ebe8e2] transition-colors shadow-xs border border-[#2A2823]/10 cursor-pointer"
                title="Sinkronisasi Ulang Data Firestore"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C1683F] rounded-full ring-2 ring-white"></span>
                )}
              </button>
            </div>

            {/* Super Admin Identity Badge */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-9 h-9 rounded-full bg-[#3F5A46] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-[#6F8F76]/30">
                MY
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs text-[#2A2823] font-bold leading-tight">Monica Yuliana, S.Pd., Gr.</span>
                <span className="text-[10px] text-[#6B675F]">Super Admin (admin@brightfuture.id)</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content Body */}
        <main className="pt-24 px-6 pb-12 w-full min-h-screen">
          {/* TAB: RINGKASAN DASHBOARD */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Top Banner & Control Filters */}
              <section className="pb-3 border-b border-[#2A2823]/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ebe8e2] text-[#6B675F] text-xs font-semibold mb-2">
                      <span className="w-2 h-2 rounded-full bg-[#6F8F76] animate-pulse"></span>
                      <span className="uppercase tracking-wider text-[#284230]">
                        Live Operational Hub • Kab. Magelang
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A2823] tracking-tight">
                      Selamat Datang, Monica Yuliana, S.Pd., Gr.
                    </h1>
                    <p className="text-sm text-[#6B675F] mt-1">
                      Overview operasional bimbel house-to-house, rute GPS tutor, dan rekonsiliasi pembayaran.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={selectedFilterRegion}
                      onChange={(e) => setSelectedFilterRegion(e.target.value)}
                      className="bg-white text-xs font-bold text-[#2A2823] py-2 px-3.5 rounded-xl border border-[#2A2823]/10 shadow-xs focus:ring-2 focus:ring-[#3F5A46] cursor-pointer"
                    >
                      <option value="Semua Wilayah Magelang">Semua Wilayah Kab. Magelang</option>
                      <option value="Secang">Secang &amp; Sekitarnya</option>
                      <option value="Mungkid">Mungkid &amp; Mertoyudan</option>
                      <option value="Muntilan">Muntilan &amp; Salam</option>
                      <option value="Krincing">Krincing</option>
                    </select>

                    <button
                      onClick={loadFirestoreData}
                      disabled={isLoadingFirestore}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#3F5A46] border border-[#3F5A46]/30 text-xs font-bold shadow-xs hover:bg-[#c8ebce]/30 cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${isLoadingFirestore ? 'animate-spin' : ''}`}>
                        sync
                      </span>
                      <span>Sync Firestore</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Bento Metric Cards (4 Cards) */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Metric 1: Basis Siswa Terdaftar */}
                <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#2A2823]/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#c8ebce] flex items-center justify-center text-[#284230]">
                      <span className="material-symbols-outlined text-[22px]">face</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                      +{firestoreRegistrations.length} dari Web
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] text-[#6B675F] uppercase tracking-wider font-bold">
                      Basis Siswa Terdaftar
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-[#2A2823]">
                        {104 + firestoreRegistrations.length}
                      </span>
                      <span className="text-xs text-[#6B675F]">Siswa Aktif</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#2A2823]/10 text-xs text-[#6B675F]">
                      <span className="w-2 h-2 rounded-full bg-[#C1683F] animate-ping"></span>
                      <span>{pendingCount} Pendaftaran Cloud Firestore</span>
                    </div>
                  </div>
                </div>

                {/* Metric 2: Omset Terverifikasi */}
                <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#2A2823]/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#3F5A46]">
                      <span className="material-symbols-outlined text-[22px]">account_balance</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#284230] animate-pulse"></span>
                      <span>Midtrans Live</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] text-[#6B675F] uppercase tracking-wider font-bold">
                      Omset Terverifikasi Midtrans
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-extrabold text-[#3F5A46]">
                        Rp 29.120.000
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#6B675F]">
                      <span>Target Rp 35.000.000</span>
                      <span className="font-bold text-[#3F5A46]">83.2%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#ebe8e2] mt-1 overflow-hidden">
                      <div className="h-full bg-[#6F8F76] rounded-full" style={{ width: '83.2%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Metric 3: Piutang SPP */}
                <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#2A2823]/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#EFC9AE]/70 flex items-center justify-center text-[#6b2702]">
                      <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#EFC9AE] text-[#6b2702] text-[10px] font-bold">
                      3 Terlambat
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] text-[#6B675F] uppercase tracking-wider font-bold">
                      Piutang Belum Terbayar
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-extrabold text-[#6b2702]">
                        Rp 4.200.000
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#2A2823]/10 text-xs">
                      <span className="text-[#6B675F]">12 Invoice Menunggu</span>
                      <button
                        onClick={() =>
                          window.open(
                            'https://wa.me/?text=Halo%20Bapak%2FIbu%20Wali%20Murid%20Bright%20Future%2C%20ini%20pengingat%20tagihan%20SPP%20bimbel%20privat%20bulan%20ini.%20Terima%20kasih.',
                            '_blank'
                          )
                        }
                        className="text-[#C1683F] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">send</span>
                        <span>Broadcast WA</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metric 4: Kunjungan Hari Ini */}
                <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#2A2823]/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#c8ebce] flex items-center justify-center text-[#284230]">
                      <span className="material-symbols-outlined text-[22px]">pin_drop</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#ebe8e2] text-[#2A2823] text-[10px] font-bold">
                      Radius GPS 50m
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] text-[#6B675F] uppercase tracking-wider font-bold">
                      Kunjungan Rumah Hari Ini
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-[#2A2823]">16</span>
                      <span className="text-xs text-[#6B675F]">Sesi 70 Menit</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#2A2823]/10 text-[11px] font-semibold">
                      <span className="text-[#284230]">11 Selesai</span>
                      <span className="text-[#C1683F]">3 On-Duty</span>
                      <span className="text-[#6B675F]">2 Sore</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 12-Column Grid: Left Radar Kunjungan (7 col) & Right Midtrans Feed (5 col) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 7 Cols: Radar Penugasan & Rute Tutor */}
                <div className="lg:col-span-7 p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#2A2823]/10 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2823]/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#284230] animate-pulse"></span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#284230]">
                          Geofence GPS Radar • Live 70-Mnt
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[#2A2823] mt-0.5">
                        Penugasan &amp; Rute Tutor Hari Ini
                      </h2>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#F1ECE1] text-[#6B675F] text-xs font-semibold self-start sm:self-auto">
                      18 Tutor Siap Jelajah Magelang
                    </span>
                  </div>

                  {/* List of Scheduled Tutor Visits */}
                  <div className="space-y-3">
                    {INITIAL_SCHEDULES.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border border-[#2A2823]/8 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#c8ebce] flex items-center justify-center text-[#284230] font-bold text-sm shrink-0">
                            {item.studentName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-[#2A2823]">{item.studentName}</span>
                              <span className="px-2 py-0.5 rounded-md bg-[#f0eee8] text-[#6B675F] text-[10px] font-semibold">
                                {item.level}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                                {item.subject}
                              </span>
                            </div>
                            <p className="text-xs text-[#6B675F] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px] text-[#3F5A46]">person_pin</span>
                              <span>
                                Tutor: <strong className="text-[#2A2823]">{item.tutor}</strong> ({item.time})
                              </span>
                            </p>
                            <p className="text-[11px] text-[#6B675F] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">home_pin</span>
                              <span>{item.address}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0">
                          {item.status === 'selesai' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              <span>Presensi Valid (18m)</span>
                            </span>
                          )}
                          {item.status === 'berlangsung' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFC9AE] text-[#6b2702] text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C1683F] animate-ping"></span>
                              <span>{item.duration}</span>
                            </span>
                          )}
                          {item.status === 'otw' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f0eee8] text-[#2A2823] text-[10px] font-bold">
                              <span className="material-symbols-outlined text-[13px] text-[#C1683F]">motorcycle</span>
                              <span>{item.duration}</span>
                            </span>
                          )}
                          {item.status === 'terkonfirmasi' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#c8ebce]/80 text-[#284230] text-[10px] font-bold">
                              <span className="material-symbols-outlined text-[13px]">event_available</span>
                              <span>Terkonfirmasi</span>
                            </span>
                          )}
                          <span className="text-[10px] text-[#6B675F] mt-1">{item.geofenceRadius}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-[#6B675F]">
                      Pembaruan GPS tutor otomatis setiap 60 detik via aplikasi PWA Tutor.
                    </span>
                    <button
                      onClick={() => setActiveTab('jadwal')}
                      className="text-[#284230] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lihat Seluruh 16 Jadwal &amp; Rute Maps</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Right 5 Cols: Keuangan & Midtrans Snap Feed */}
                <div className="lg:col-span-5 p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#2A2823]/10 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2A2823]/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#6F8F76]"></span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B675F]">
                          Midtrans Snap API &amp; Webhook
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[#2A2823] mt-0.5">Arus Pembayaran &amp; Tagihan</h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                      99.98% Uptime
                    </span>
                  </div>

                  {/* Transaction Feed */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#2A2823]/8 shadow-xs flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2A2823]">INV-2026-09-088</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#c8ebce] text-[#284230] text-[10px] font-semibold">
                            QRIS Gopay
                          </span>
                        </div>
                        <p className="text-xs text-[#2A2823] font-semibold truncate">
                          Ibu Deasy (Wali Naufal - SD Kelas 2)
                        </p>
                        <p className="text-[11px] text-[#6B675F]">Paket 8 Sesi • Rp 280.000</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                          LUNAS
                        </span>
                        <span className="text-[10px] text-[#6B675F] mt-1">Auto-sync 13:42</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#2A2823]/8 shadow-xs flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2A2823]">INV-2026-09-089</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#f0eee8] text-[#2A2823] text-[10px] font-semibold">
                            BCA Virtual Account
                          </span>
                        </div>
                        <p className="text-xs text-[#2A2823] font-semibold truncate">
                          Bpk. Hendra Gunawan (Wali Michelle)
                        </p>
                        <p className="text-[11px] text-[#6B675F]">Paket 8 Sesi • Rp 280.000</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                          LUNAS
                        </span>
                        <span className="text-[10px] text-[#6B675F] mt-1">Auto-sync 11:15</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#2A2823]/8 shadow-xs flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#6b2702]">INV-2026-09-092</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#EFC9AE] text-[#6b2702] text-[10px] font-semibold">
                            Jatuh Tempo Hari Ini
                          </span>
                        </div>
                        <p className="text-xs text-[#2A2823] font-semibold truncate">
                          Ibu Farida (Wali Siswa Kelas 5 SD Krincing)
                        </p>
                        <p className="text-[11px] text-[#6B675F]">Paket 8 Sesi SD UMUM • Rp 280.000</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-[#FAF7F1] text-[#2A2823] text-[10px] font-bold border border-[#2A2823]/10">
                          Belum Bayar
                        </span>
                        <button
                          onClick={() =>
                            window.open(
                              'https://wa.me/6285173230198?text=Halo%20Ibu%20Farida%2C%20pengingat%20tagihan%20SPP%20Bright%20Future%20INV-2026-09-092.',
                              '_blank'
                            )
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#C1683F] text-white text-[10px] font-bold shadow-xs hover:opacity-90 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">chat</span>
                          <span>Ingatkan WA</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ekspor bar */}
                  <div className="pt-3 border-t border-[#2A2823]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#6B675F] font-bold">Ekspor Data:</span>
                      <button
                        onClick={() => alert('Laporan format PDF diunduh')}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-[#ebe8e2] text-[11px] font-bold text-[#2A2823] border border-[#2A2823]/10 shadow-xs cursor-pointer"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => alert('Laporan format Excel diunduh')}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-[#ebe8e2] text-[11px] font-bold text-[#2A2823] border border-[#2A2823]/10 shadow-xs cursor-pointer"
                      >
                        Excel
                      </button>
                      <button
                        onClick={() => alert('Laporan format CSV diunduh')}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-[#ebe8e2] text-[11px] font-bold text-[#2A2823] border border-[#2A2823]/10 shadow-xs cursor-pointer"
                      >
                        CSV
                      </button>
                    </div>
                    <button
                      onClick={() => setActiveTab('midtrans')}
                      className="text-xs text-[#284230] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Kelola Semua Transaksi</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Bottom Bento Row: Calon Siswa Baru Firestore Live, Progres Afektif & Bank Promo */}
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Card 1: Verifikasi Calon Siswa (Firestore Live) */}
                <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#2A2823]/10 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#C1683F]"></span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B675F]">
                          Firestore Database Live
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#EFC9AE] text-[#6b2702] text-[10px] font-bold">
                        {firestoreRegistrations.length} Pendaftaran Baru
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#2A2823] mt-2">
                      Verifikasi Calon Siswa Baru
                    </h3>
                    <p className="text-xs text-[#6B675F]">
                      Permintaan bimbel privat masuk dari website landing page ke Cloud Firestore.
                    </p>

                    {/* List of Incoming Registrations from Firestore */}
                    <div className="mt-4 space-y-3">
                      {firestoreRegistrations.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-dashed border-[#2A2823]/15 text-center text-xs text-[#6B675F]">
                          {isLoadingFirestore
                            ? 'Memuat data dari Google Cloud Firestore...'
                            : 'Belum ada pendaftaran baru di Firestore. Coba lakukan pendaftaran di formulir halaman depan!'}
                        </div>
                      ) : (
                        firestoreRegistrations.slice(0, 3).map((reg) => (
                          <div
                            key={reg.studentId}
                            className="p-3.5 rounded-xl bg-white border border-[#2A2823]/8 shadow-xs flex flex-col gap-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-xs font-bold text-[#2A2823] block leading-tight">
                                  {reg.studentName}
                                </span>
                                <span className="text-[11px] text-[#6B675F]">
                                  {reg.level.toUpperCase()} • Wali: {reg.parentName}
                                </span>
                                <span className="text-[10px] text-[#6B675F] block truncate max-w-[200px]">
                                  {reg.homeAddress}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  reg.paymentStatus === 'verified'
                                    ? 'bg-[#c8ebce] text-[#284230]'
                                    : 'bg-[#EFC9AE] text-[#6b2702]'
                                }`}
                              >
                                {reg.paymentStatus === 'verified' ? 'TERVERIFIKASI' : 'PENDING'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-[#2A2823]/5">
                              {reg.paymentStatus !== 'verified' ? (
                                <button
                                  onClick={() => handleVerifyStudent(reg.studentId)}
                                  className="flex-1 py-1.5 rounded-lg bg-[#284230] text-white text-[11px] font-bold hover:bg-[#3F5A46] transition-colors cursor-pointer"
                                >
                                  Verifikasi &amp; Buat Akun
                                </button>
                              ) : (
                                <span className="flex-1 py-1 text-center text-[#284230] text-[11px] font-bold">
                                  ✓ Akun Aktif
                                </span>
                              )}
                              <button
                                onClick={() => setSelectedRegistration(reg)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#f0eee8] text-[#6B675F] text-[11px] font-bold hover:text-[#2A2823] cursor-pointer"
                              >
                                Detail
                              </button>
                              <a
                                href={`https://wa.me/${reg.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-[#25D366] text-white hover:bg-emerald-600 cursor-pointer"
                                title="Chat WhatsApp Wali"
                              >
                                <span className="material-symbols-outlined text-[15px]">chat</span>
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('siswa')}
                    className="pt-2 text-xs text-[#284230] font-bold hover:underline inline-flex items-center justify-between cursor-pointer"
                  >
                    <span>Buka Roster Lengkap Data Siswa</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>

                {/* Card 2: Catatan Perkembangan & Afektif */}
                <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#2A2823]/10 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#6F8F76]"></span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B675F]">
                          Catatan Harian Tutor
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                        Sinkron WhatsApp
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#2A2823] mt-2">
                      Perkembangan &amp; Afektif Siswa
                    </h3>
                    <p className="text-xs text-[#6B675F]">
                      Laporan belajar diisi langsung oleh tutor segera setelah sesi 70 menit selesai.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="p-3 rounded-xl bg-white border border-[#2A2823]/8 shadow-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#2A2823]">Naufal Al-Ghifari (SD 2)</span>
                          <span className="text-[10px] text-[#6B675F]">Hari ini, 16:45</span>
                        </div>
                        <p className="text-xs text-[#6B675F] leading-relaxed">
                          Catatan Tutor: <em>"Nilai hafalan kosa kata meningkat pesat, aktif bertanya dan tidak takut salah berhitung."</em>
                        </p>
                        <div className="flex items-center gap-1 text-[#3F5A46] text-[10px] font-semibold pt-1">
                          <span className="material-symbols-outlined text-[14px]">done_all</span>
                          <span>Terkirim ke WhatsApp Ibu Deasy</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#2A2823]/8 shadow-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#2A2823]">Siswa Kelas 5 SD Krincing</span>
                          <span className="text-[10px] text-[#6B675F]">Kemarin</span>
                        </div>
                        <div className="flex items-center justify-between bg-[#f0eee8] px-2.5 py-1.5 rounded-lg text-xs">
                          <span className="text-[#2A2823] font-semibold">Tugas Matematika Sekolah</span>
                          <span className="font-bold text-[#284230]">Selesai Terlebih Dahulu (100)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('nilai')}
                    className="pt-2 text-xs text-[#284230] font-bold hover:underline inline-flex items-center justify-between cursor-pointer"
                  >
                    <span>Buka Buku Nilai &amp; Rapor Afektif</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>

                {/* Card 3: Bank Materi, LKPD & Promo */}
                <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#2A2823]/10 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#47654f]"></span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B675F]">
                          Resource &amp; Promosi
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#f0eee8] text-[#2A2823] text-[10px] font-bold">
                        LMS Cloud
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#2A2823] mt-2">
                      Bank Materi &amp; Promo Aktif
                    </h3>
                    <p className="text-xs text-[#6B675F]">
                      Distribusi LKPD cetak/digital dan voucher promosi bimbel di Magelang.
                    </p>

                    <div className="mt-4 space-y-2.5">
                      <div className="p-3 rounded-xl bg-white border border-[#2A2823]/8 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#f0eee8] flex items-center justify-center text-[#3F5A46]">
                            <span className="material-symbols-outlined text-[20px]">menu_book</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#2A2823] block leading-tight">
                              Modul &amp; LKPD Fisik
                            </span>
                            <span className="text-[10px] text-[#6B675F]">Kurikulum Merdeka 2026</span>
                          </div>
                        </div>
                        <span className="text-base font-bold text-[#2A2823]">48 Modul</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#2A2823]/8 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#c8ebce] flex items-center justify-center text-[#284230]">
                            <span className="material-symbols-outlined text-[20px]">quiz</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#2A2823] block leading-tight">
                              Bank Soal &amp; Try Out
                            </span>
                            <span className="text-[10px] text-[#6B675F]">SD UMUM, SMP &amp; UTBK</span>
                          </div>
                        </div>
                        <span className="text-base font-bold text-[#2A2823]">420 Soal</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#2A2823]/8 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#EFC9AE]/70 flex items-center justify-center text-[#6b2702]">
                            <span className="material-symbols-outlined text-[20px]">loyalty</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#2A2823] block leading-tight">
                              Diskon Saudara Kandung 10%
                            </span>
                            <span className="text-[10px] text-[#6B675F]">Otomatis di Form Daftar</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#C1683F]">Aktif</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('lkpd')}
                    className="pt-2 text-xs text-[#284230] font-bold hover:underline inline-flex items-center justify-between cursor-pointer"
                  >
                    <span>Kelola Modul &amp; LKPD Belajar</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* TAB: DATA SISWA & WALI (SUB MENUS: VERIFIKASI PENDAFTARAN & MANAJEMEN SISWA & WALI) */}
          {activeTab === 'siswa' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Modern Top Segmented Sub-Menu Selector */}
              <div className="p-1.5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F1] rounded-xl border border-[#2A2823]/8">
                  {/* Sub-menu 1 Button */}
                  <button
                    onClick={() => setStudentSubTab('verifikasi')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                      studentSubTab === 'verifikasi'
                        ? 'bg-[#284230] text-white shadow-xs'
                        : 'text-[#6B675F] hover:text-[#2A2823] hover:bg-white/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    <span>1. Verifikasi Pendaftaran</span>
                    {pendingCount > 0 ? (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold text-[10px] animate-pulse">
                        {pendingCount} Menunggu
                      </span>
                    ) : (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] font-bold text-[10px]">
                        {firestoreRegistrations.length}
                      </span>
                    )}
                  </button>

                  {/* Sub-menu 2 Button */}
                  <button
                    onClick={() => setStudentSubTab('manajemen')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                      studentSubTab === 'manajemen'
                        ? 'bg-[#284230] text-white shadow-xs'
                        : 'text-[#6B675F] hover:text-[#2A2823] hover:bg-white/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    <span>2. Manajemen Siswa &amp; Wali</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] font-bold text-[10px]">
                      {managedStudents.length} Siswa
                    </span>
                  </button>
                </div>

                {/* Sub Menu Info Tag */}
                <div className="flex items-center gap-2 px-3 text-xs text-[#6B675F]">
                  <span className="material-symbols-outlined text-[16px] text-[#3F5A46]">cloud_sync</span>
                  <span className="font-semibold hidden sm:inline">
                    {studentSubTab === 'verifikasi'
                      ? 'Sinkronisasi Formulir Publik Firestore'
                      : 'Database Induk Siswa Kab. Magelang'}
                  </span>
                </div>
              </div>

              {/* Sub-menu 1: Verifikasi Pendaftaran */}
              {studentSubTab === 'verifikasi' && (
                <StudentVerificationSubTab
                  registrations={firestoreRegistrations}
                  isLoading={isLoadingFirestore}
                  onRefresh={loadFirestoreData}
                  onVerify={handleVerifyStudent}
                  onViewDetail={(item) => setSelectedRegistration(item)}
                  onPrintSlip={(item) => setSelectedSlipRegistration(item)}
                />
              )}

              {/* Sub-menu 2: Manajemen Siswa & Wali */}
              {studentSubTab === 'manajemen' && (
                <StudentManagementSubTab
                  students={managedStudents}
                  onAddStudent={() => {
                    setSelectedStudentForEdit(null);
                    setIsStudentFormOpen(true);
                  }}
                  onEditStudent={(s) => {
                    setSelectedStudentForEdit(s);
                    setIsStudentFormOpen(true);
                  }}
                  onViewProfile={(s) => setSelectedStudentForProfile(s)}
                  onAddSessions={(s) => {
                    setSelectedStudentForSessions(s);
                    setIsAddSessionsOpen(true);
                  }}
                  onDeleteStudent={handleDeleteStudent}
                  onExportData={handleExportStudents}
                />
              )}
            </div>
          )}

          {/* TAB: JADWAL & PENUGASAN */}
          {activeTab === 'jadwal' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2823]/10">
                <div>
                  <h1 className="text-2xl font-bold text-[#2A2823]">Jadwal Kunjungan &amp; Rute Tutor</h1>
                  <p className="text-xs sm:text-sm text-[#6B675F]">
                    Pemantauan geofence GPS 50m dan penugasan pengajar bimbel house-to-house.
                  </p>
                </div>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold shadow-xs hover:bg-[#3F5A46] cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[17px]">add_circle</span>
                  <span>+ Tambah Jadwal Kunjungan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INITIAL_SCHEDULES.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#284230] bg-[#c8ebce] px-2.5 py-0.5 rounded-full">
                        {item.id} • {item.duration}
                      </span>
                      <span className="text-xs font-semibold text-[#6B675F]">{item.time}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#2A2823]">{item.studentName}</h3>
                      <p className="text-xs text-[#6B675F]">{item.level} — {item.subject}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/8 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[#2A2823] font-semibold">
                        <span className="material-symbols-outlined text-[16px] text-[#3F5A46]">person</span>
                        <span>Tutor: {item.tutor}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#6B675F]">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        <span>{item.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-[#3F5A46] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">verified</span>
                        <span>{item.geofenceRadius}</span>
                      </span>
                      <button
                        onClick={() => alert(`Rute peta Google Maps untuk ${item.studentName} dibuka`)}
                        className="text-xs text-[#284230] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Buka Rute Maps</span>
                        <span className="material-symbols-outlined text-[14px]">map</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: DATA TUTOR */}
          {activeTab === 'tutor' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#2A2823]/10">
                <div>
                  <h1 className="text-2xl font-bold text-[#2A2823]">Data Tutor &amp; Guru Privat</h1>
                  <p className="text-xs sm:text-sm text-[#6B675F]">
                    18 Pengajar terakreditasi berdomisili dan siap jelajah Kabupaten Magelang.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    name: 'Kak Anindya, S.Pd.',
                    univ: 'Pendidikan Matematika UNY (IPK 3.88)',
                    spec: 'SD UMUM & Olimpiade Sains SD',
                    load: '6 Siswa Aktif',
                    status: 'Tersedia Sore',
                  },
                  {
                    name: 'Kak Dimas Arya, S.Si.',
                    univ: 'Fisika MIPA UGM (IPK 3.82)',
                    spec: 'SD UMUM Matematika & SMP Fisika',
                    load: '8 Siswa Aktif',
                    status: 'On-Duty',
                  },
                  {
                    name: 'Kak Sarah Larasati, M.Pd.',
                    univ: 'Magister Bahasa & Sastra Indonesia UNS',
                    spec: 'SD UMUM Tematik & Literasi Membaca',
                    load: '5 Siswa Aktif',
                    status: 'Tersedia',
                  },
                  {
                    name: 'Kak Siti Rahma, S.Pd.',
                    univ: 'PGSD Universitas Muhammadiyah Magelang',
                    spec: 'Calistung Fonik & SD Kelas Rendah',
                    load: '7 Siswa Aktif',
                    status: 'Tersedia',
                  },
                ].map((tutor, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-[#2A2823]/10 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                          {tutor.status}
                        </span>
                        <span className="text-xs text-[#6B675F] font-semibold">{tutor.load}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#2A2823] mt-2">{tutor.name}</h3>
                      <p className="text-xs text-[#3F5A46] font-semibold">{tutor.univ}</p>
                      <p className="text-xs text-[#6B675F] mt-1">Spesialisasi: {tutor.spec}</p>
                    </div>
                    <div className="pt-3 border-t border-[#2A2823]/8 flex items-center justify-between">
                      <span className="text-xs text-[#6B675F]">Akreditasi A</span>
                      <button
                        onClick={() => alert(`Jadwal detail ${tutor.name} dibuka`)}
                        className="text-xs text-[#284230] font-bold hover:underline cursor-pointer"
                      >
                        Lihat Jadwal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TAGIHAN & MIDTRANS */}
          {(activeTab === 'tagihan' || activeTab === 'midtrans' || activeTab === 'terlambat') && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2823]/10">
                <div>
                  <h1 className="text-2xl font-bold text-[#2A2823]">
                    {activeTab === 'terlambat' ? 'Daftar Tagihan Terlambat' : 'Tagihan & Transaksi Midtrans'}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6B675F]">
                    Rekonsiliasi otomatis Midtrans Snap, Virtual Account BCA/Mandiri, QRIS, dan status invoice.
                  </p>
                </div>
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold shadow-xs hover:bg-[#3F5A46] cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[17px]">receipt</span>
                  <span>+ Buat Invoice Baru</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-[#2A2823]/10 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F1] text-[#6B675F] uppercase font-bold text-[10px] border-b border-[#2A2823]/10">
                    <tr>
                      <th className="py-3 px-4">No. Invoice</th>
                      <th className="py-3 px-4">Wali &amp; Siswa</th>
                      <th className="py-3 px-4">Paket Les</th>
                      <th className="py-3 px-4">Kanal Bayar</th>
                      <th className="py-3 px-4">Nominal</th>
                      <th className="py-3 px-4">Status Midtrans</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2823]/8">
                    {[
                      {
                        inv: 'BF-INV-2026-09-088',
                        parent: 'Ibu Deasy (Naufal)',
                        package: 'Paket 8 Sesi SD UMUM',
                        channel: 'QRIS Gopay',
                        amount: 280000,
                        status: 'LUNAS',
                        date: '20 Sep 2026',
                      },
                      {
                        inv: 'BF-INV-2026-09-089',
                        parent: 'Bpk. Hendra Gunawan (Michelle)',
                        package: 'Paket 8 Sesi SD UMUM',
                        channel: 'BCA Virtual Account',
                        amount: 280000,
                        status: 'LUNAS',
                        date: '20 Sep 2026',
                      },
                      {
                        inv: 'BF-INV-2026-09-092',
                        parent: 'Ibu Farida (Krincing)',
                        package: 'Paket 8 Sesi SD UMUM',
                        channel: 'Menunggu Pembayaran',
                        amount: 280000,
                        status: 'PENDING',
                        date: 'Jatuh Tempo Hari Ini',
                      },
                      {
                        inv: 'BF-INV-2026-09-074',
                        parent: 'Bpk. Rudi Hartono (Alifa)',
                        package: 'Paket 8 Sesi Calistung',
                        channel: 'BCA Virtual Account',
                        amount: 280000,
                        status: 'TERLAMBAT (H+2)',
                        date: '18 Sep 2026',
                      },
                    ]
                      .filter((row) => (activeTab === 'terlambat' ? row.status.includes('TERLAMBAT') : true))
                      .map((inv, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F1]/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#284230]">{inv.inv}</td>
                          <td className="py-3 px-4 font-semibold text-[#2A2823]">{inv.parent}</td>
                          <td className="py-3 px-4 text-[#6B675F]">{inv.package}</td>
                          <td className="py-3 px-4 text-[#2A2823]">{inv.channel}</td>
                          <td className="py-3 px-4 font-bold text-[#3F5A46]">
                            Rp {inv.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'LUNAS'
                                  ? 'bg-[#c8ebce] text-[#284230]'
                                  : inv.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-[#EFC9AE] text-[#6b2702]'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => alert(`Invoice ${inv.inv} dikirim ke WhatsApp wali murid`)}
                              className="px-2.5 py-1 rounded-lg bg-[#25D366] text-white font-bold text-[10px] hover:bg-emerald-600 cursor-pointer"
                            >
                              Kirim WA
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: AKUN & HAK AKSES */}
          {activeTab === 'akun' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="pb-4 border-b border-[#2A2823]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-[#2A2823]">Pengaturan Akun &amp; Kredensial Database</h1>
                  <p className="text-xs sm:text-sm text-[#6B675F]">
                    Kelola otentikasi admin dan status kredensial terpusat di Google Cloud Firestore.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncDatabase}
                  disabled={isSyncingDb}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/15 text-xs font-bold text-[#284230] hover:bg-[#F1ECE1] cursor-pointer flex items-center gap-1.5 self-start disabled:opacity-60"
                >
                  <span className={`material-symbols-outlined text-[17px] ${isSyncingDb ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  <span>{isSyncingDb ? 'Menyinkronkan...' : 'Sinkronkan Database'}</span>
                </button>
              </div>

              {/* Card Profil Admin Firestore */}
              <div className="p-6 rounded-3xl bg-white border border-[#2A2823]/10 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#3F5A46] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                      MY
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#2A2823]">{adminCredential.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#3F5A46] font-semibold bg-[#EAF2ED] px-2.5 py-0.5 rounded-full border border-[#3F5A46]/20">
                          {adminCredential.role.toUpperCase()}
                        </span>
                        <span className="text-xs text-[#6B675F]">ID: SUPER_ADMIN_01</span>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Tersambung ke Cloud Firestore</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#2A2823]/10 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/8">
                    <span className="text-[10px] text-[#6B675F] uppercase font-bold block mb-1">
                      Email Login Resmi
                    </span>
                    <span className="text-sm font-bold text-[#284230] font-mono break-all">
                      {adminCredential.email}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/8">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#6B675F] uppercase font-bold">Kata Sandi Database</span>
                      <button
                        type="button"
                        onClick={() => setShowPasswordInPlain(!showPasswordInPlain)}
                        className="text-[10px] text-[#3F5A46] font-bold hover:underline cursor-pointer"
                      >
                        {showPasswordInPlain ? 'Sembunyikan' : 'Lihat'}
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#2A2823] font-mono">
                      {showPasswordInPlain ? adminCredential.password : '••••••••••••'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/8">
                    <span className="text-[10px] text-[#6B675F] uppercase font-bold block mb-1">
                      Login Terakhir (Firestore)
                    </span>
                    <span className="text-xs font-medium text-[#2A2823]">
                      {adminCredential.lastLogin
                        ? new Date(adminCredential.lastLogin).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) + ' WIB'
                        : 'Sesi Aktif Sekarang'}
                    </span>
                  </div>
                </div>

                {/* Firestore Metadata Banner */}
                <div className="p-4 rounded-xl bg-[#FAF7F1] border border-[#2A2823]/10 text-xs text-[#2A2823] space-y-1">
                  <div className="font-bold text-[#3F5A46] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">database</span>
                    <span>Metadata Basis Data Cloud Firestore:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#6B675F] pt-1">
                    <div>Path Dokumen: <code className="font-mono text-[#2A2823]">admin_credentials/admin</code></div>
                    <div>Database ID: <code className="font-mono text-[#2A2823]">ai-studio-prdlaunchpad-4d4c77d8-f0ad-42c7-b5cb-a53ce7429255</code></div>
                  </div>
                </div>

                {/* Form Ubah Password Admin di Firestore */}
                <div className="pt-2 border-t border-[#2A2823]/10">
                  <h4 className="font-bold text-sm text-[#2A2823] mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">lock_reset</span>
                    <span>Perbarui Kata Sandi Admin di Database Firestore</span>
                  </h4>

                  {passwordChangeStatus && (
                    <div
                      className={`p-3 rounded-xl mb-3 text-xs flex items-center gap-2 ${
                        passwordChangeStatus.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {passwordChangeStatus.type === 'success' ? 'check_circle' : 'error'}
                      </span>
                      <span>{passwordChangeStatus.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdatePasswordInFirestore} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6B675F] uppercase mb-1">
                          Kata Sandi Lama
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Masukkan sandi lama"
                          value={oldPasswordInput}
                          onChange={(e) => setOldPasswordInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#6B675F] uppercase mb-1">
                          Kata Sandi Baru
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Minimal 6 karakter"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#6B675F] uppercase mb-1">
                          Ulangi Sandi Baru
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Konfirmasi sandi baru"
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSavingPassword}
                        className="px-4 py-2 rounded-xl bg-[#284230] hover:bg-[#3F5A46] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>{isSavingPassword ? 'Menyimpan ke Firestore...' : 'Simpan Sandi Baru ke Database'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Tabel Semua Akun Kredensial Database Terhubung */}
              <div className="p-6 rounded-3xl bg-white border border-[#2A2823]/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#2A2823]">
                      Daftar Akun Kredensial Terhubung di Database
                    </h3>
                    <p className="text-xs text-[#6B675F]">
                      Pengguna landing page dan staf yang tersinkronisasi di Cloud Firestore
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EAF2ED] text-[#284230] border border-[#284230]/20">
                    {firestoreRegistrations.length + 3} Akun Aktif
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#2A2823]/10 text-[#6B675F] uppercase text-[10px] font-bold">
                        <th className="py-2.5 px-3">Peran / Role</th>
                        <th className="py-2.5 px-3">Nama Pengguna</th>
                        <th className="py-2.5 px-3">Identifier / Login</th>
                        <th className="py-2.5 px-3">Koleksi Firestore</th>
                        <th className="py-2.5 px-3 text-right">Status Database</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2823]/6">
                      <tr className="hover:bg-[#FAF7F1]/60">
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#3F5A46] text-white">
                            Super Admin
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#2A2823]">{adminCredential.name}</td>
                        <td className="py-3 px-3 font-mono text-[#284230] font-bold">{adminCredential.email}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#6B675F]">admin_credentials</td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Tersinkronisasi
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#FAF7F1]/60">
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#C1683F] text-white">
                            Tutor / Guru
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#2A2823]">Kak Monica Yuliana, S.Pd.</td>
                        <td className="py-3 px-3 font-mono text-[#2A2823]">monica.tutor@brightfuture.id</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#6B675F]">portal_credentials</td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Tersinkronisasi
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#FAF7F1]/60">
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#6F8F76] text-white">
                            Siswa Baru
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#2A2823]">
                          {firestoreRegistrations.length > 0
                            ? `${firestoreRegistrations[0].studentName} (+${firestoreRegistrations.length - 1} lainnya)`
                            : 'Kevin Pratama (Demo)'}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#2A2823]">
                          {firestoreRegistrations.length > 0
                            ? firestoreRegistrations[0].studentId
                            : 'BF-2026-09-8492'}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#6B675F]">registrations</td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Live Firestore
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-[#FAF7F1]/60">
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#EFC9AE] text-[#6b2702]">
                            Wali Murid
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#2A2823]">
                          {firestoreRegistrations.length > 0
                            ? firestoreRegistrations[0].parentName
                            : 'Ibu Deasy'}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#2A2823]">
                          {firestoreRegistrations.length > 0
                            ? firestoreRegistrations[0].whatsapp
                            : '085173230198'}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#6B675F]">registrations / portal</td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Live Firestore
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-[11px] text-[#6B675F]">
                    Siswa dan wali murid yang mendaftar melalui formulir web langsung otomatis mendapatkan akses masuk portal.
                  </p>
                  <button
                    onClick={onLogout}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[17px]">logout</span>
                    <span>Keluar dari Akun Admin</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Fallback for Other Tabs */}
          {['mapel', 'presensi', 'nilai', 'lkpd', 'bank_soal', 'video', 'laporan', 'promo', 'sertifikat'].includes(
            activeTab
          ) && (
            <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white border border-[#2A2823]/10 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#c8ebce] text-[#284230] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">tune</span>
              </div>
              <h2 className="text-xl font-bold text-[#2A2823] capitalize">Modul {activeTab} Operasional</h2>
              <p className="text-sm text-[#6B675F] max-w-md mx-auto">
                Fitur {activeTab} aktif beroperasi dan terintegrasi dengan basis data Cloud Firestore &amp; presensi GPS.
              </p>
              <button
                onClick={() => setActiveTab('ringkasan')}
                className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] cursor-pointer inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Kembali ke Ringkasan Dashboard</span>
              </button>
            </div>
          )}

          {/* Quick System Status Bar */}
          <section className="mt-10 p-4 rounded-2xl bg-[#f0eee8]/70 border border-[#2A2823]/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#6B675F] max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-[#2A2823]">
              <span className="material-symbols-outlined text-[#3F5A46] text-[18px]">security</span>
              <span>
                Bright Future Learning Center • Sistem Multi-Role Operasional (Super Admin: Monica Yuliana, S.Pd., Gr.)
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-[#284230]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Cloud Firestore Active</span>
              </span>
              <span className="flex items-center gap-1 text-[#284230]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Midtrans Ready</span>
              </span>
            </div>
          </section>
        </main>
      </div>

      {/* DETAIL MODAL FOR A REGISTRATION */}
      {selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#2A2823]/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2823]/10">
              <h3 className="font-bold text-base text-[#2A2823]">Rincian Pendaftaran Siswa</h3>
              <button
                onClick={() => setSelectedRegistration(null)}
                className="text-[#6B675F] hover:text-[#2A2823] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#2A2823]/5">
                <span className="text-[#6B675F]">ID Siswa:</span>
                <span className="font-bold font-mono text-[#284230]">{selectedRegistration.studentId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2823]/5">
                <span className="text-[#6B675F]">Nama Siswa:</span>
                <span className="font-bold text-[#2A2823]">{selectedRegistration.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2823]/5">
                <span className="text-[#6B675F]">Jenjang Belajar:</span>
                <span className="font-bold uppercase text-[#3F5A46]">{selectedRegistration.level}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2823]/5">
                <span className="text-[#6B675F]">Nama Orang Tua / Wali:</span>
                <span className="font-bold text-[#2A2823]">{selectedRegistration.parentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2823]/5">
                <span className="text-[#6B675F]">Nomor WhatsApp:</span>
                <span className="font-bold text-[#2A2823]">{selectedRegistration.whatsapp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2823]/5">
                <span className="text-[#6B675F]">Alamat Rumah:</span>
                <span className="font-bold text-[#2A2823] text-right max-w-[200px]">
                  {selectedRegistration.homeAddress}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2823]/5">
                <span className="text-[#6B675F]">Jadwal Pilihan:</span>
                <span className="font-bold text-[#2A2823] text-right">
                  {selectedRegistration.selectedSchedule.join(', ')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2823]/5">
                <span className="text-[#6B675F]">Nomor Invoice:</span>
                <span className="font-mono font-bold text-[#2A2823]">{selectedRegistration.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B675F]">Total SPP (8 Sesi):</span>
                <span className="font-bold text-sm text-[#3F5A46]">
                  Rp {selectedRegistration.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              {selectedRegistration.paymentStatus !== 'verified' && (
                <button
                  onClick={() => {
                    handleVerifyStudent(selectedRegistration.studentId);
                    setSelectedRegistration(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#284230] text-white font-bold text-xs hover:bg-[#3F5A46] cursor-pointer"
                >
                  Verifikasi Pendaftaran
                </button>
              )}
              <a
                href={`https://wa.me/${selectedRegistration.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs text-center hover:bg-emerald-600 cursor-pointer"
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* QUICK MODAL: + JADWAL KUNJUNGAN */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#2A2823]/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2823]/10">
              <h3 className="font-bold text-base text-[#2A2823]">Jadwalkan Kunjungan Tutor Baru</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-[#6B675F] cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Nama Siswa</label>
                <input
                  type="text"
                  placeholder="Contoh: Naufal Al-Ghifari"
                  value={newVisitStudent}
                  onChange={(e) => setNewVisitStudent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Pilih Tutor Penugasan</label>
                <select
                  value={newVisitTutor}
                  onChange={(e) => setNewVisitTutor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
                >
                  <option>Kak Anindya, S.Pd. (SD UMUM &amp; Math)</option>
                  <option>Kak Dimas Arya, S.Si. (Sains &amp; Fisika)</option>
                  <option>Kak Sarah Larasati, M.Pd. (Literasi &amp; UTBK)</option>
                  <option>Kak Siti Rahma, S.Pd. (Calistung &amp; SD)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Waktu Sesi (70 Menit)</label>
                <input
                  type="text"
                  value={newVisitTime}
                  onChange={(e) => setNewVisitTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Alamat Kunjungan di Kab. Magelang</label>
                <input
                  type="text"
                  placeholder="Contoh: Secang, Kab. Magelang"
                  value={newVisitAddress}
                  onChange={(e) => setNewVisitAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#2A2823]/15 text-xs font-semibold text-[#6B675F] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setActionFeedback(`Kunjungan untuk ${newVisitStudent || 'Siswa'} berhasil dijadwalkan!`);
                  setIsScheduleModalOpen(false);
                  setTimeout(() => setActionFeedback(null), 3500);
                }}
                className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] cursor-pointer"
              >
                Simpan &amp; Notifikasi Tutor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK MODAL: + BUAT TAGIHAN */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#2A2823]/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2823]/10">
              <h3 className="font-bold text-base text-[#2A2823]">Buat Tagihan SPP Baru (Midtrans)</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-[#6B675F] cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Nama Siswa / Wali</label>
                <input
                  type="text"
                  placeholder="Contoh: Michelle Gunawan"
                  value={newInvoiceStudent}
                  onChange={(e) => setNewInvoiceStudent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Paket Belajar</label>
                <select
                  value={newInvoicePackage}
                  onChange={(e) => setNewInvoicePackage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none cursor-pointer"
                >
                  <option>Paket 8 Sesi SD UMUM (Rp 280.000)</option>
                  <option>Paket 8 Sesi Calistung (Rp 280.000)</option>
                  <option>Paket 8 Sesi SMP (Rp 360.000)</option>
                  <option>Paket 8 Sesi SMA UTBK (Rp 400.000)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2A2823] mb-1">Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  value={newInvoiceAmount}
                  onChange={(e) => setNewInvoiceAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2823]/15 text-xs focus:ring-2 focus:ring-[#3F5A46] outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#2A2823]/15 text-xs font-semibold text-[#6B675F] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setActionFeedback(`Invoice SPP Rp ${newInvoiceAmount.toLocaleString('id-ID')} dibuat!`);
                  setIsInvoiceModalOpen(false);
                  setTimeout(() => setActionFeedback(null), 3500);
                }}
                className="px-4 py-2 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] cursor-pointer"
              >
                Terbitkan Invoice Midtrans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PROFIL LENGKAP SISWA & WALI */}
      {selectedStudentForProfile && (
        <StudentDetailModal
          student={selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
          onEdit={(s) => {
            setSelectedStudentForProfile(null);
            setSelectedStudentForEdit(s);
            setIsStudentFormOpen(true);
          }}
          onAddSessions={(s) => {
            setSelectedStudentForProfile(null);
            setSelectedStudentForSessions(s);
            setIsAddSessionsOpen(true);
          }}
        />
      )}

      {/* MODAL: FORM TAMBAH / EDIT SISWA & WALI */}
      <StudentFormModal
        isOpen={isStudentFormOpen}
        initialData={selectedStudentForEdit}
        onClose={() => {
          setIsStudentFormOpen(false);
          setSelectedStudentForEdit(null);
        }}
        onSave={handleSaveStudent}
      />

      {/* MODAL: PERPANJANG SESI BELAJAR */}
      {selectedStudentForSessions && (
        <AddSessionsModal
          student={selectedStudentForSessions}
          isOpen={isAddSessionsOpen}
          onClose={() => {
            setIsAddSessionsOpen(false);
            setSelectedStudentForSessions(null);
          }}
          onConfirm={handleAddSessionsConfirm}
        />
      )}

      {/* MODAL: SLIP BUKTI PENDAFTARAN & VERIFIKASI */}
      {selectedSlipRegistration && (
        <RegistrationSlipModal
          registration={selectedSlipRegistration}
          onClose={() => setSelectedSlipRegistration(null)}
          onVerify={(id) => handleVerifyStudent(id)}
        />
      )}
    </div>
  );
};
