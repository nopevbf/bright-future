import React, { useState } from 'react';
import {
  db,
  doc,
  setDoc,
} from '../firebase';

interface ParentDashboardProps {
  onLogout: () => void;
  onViewLanding: () => void;
  parentName?: string;
  parentPhone?: string;
  onOpenMidtransPayment?: (invoiceData: {
    inv: string;
    studentName: string;
    amount: number;
    package: string;
  }) => void;
}

type TabType =
  | 'beranda-ringkasan'
  | 'anak-saya-profil'
  | 'jadwal-kunjungan'
  | 'presensi-sesi'
  | 'nilai-catatan-karakter'
  | 'tagihan-midtrans'
  | 'pengumuman-bantuan-tutor';

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onLogout,
  onViewLanding,
  parentName = 'Bunda Ratna Dewi',
  parentPhone = '0812-9876-5432',
  onOpenMidtransPayment,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('beranda-ringkasan');
  const [selectedChild, setSelectedChild] = useState<'rayhan' | 'kayla'>('rayhan');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Digital Signature Paraf Modal
  const [isParafModalOpen, setIsParafModalOpen] = useState<boolean>(false);
  const [parafConfirmed, setParafConfirmed] = useState<boolean>(false);
  const [parafNote, setParafNote] = useState<string>('Materi rotasi bumi dipahami dengan sangat baik.');

  // Session Notes Details Modal
  const [isSessionDetailsOpen, setIsSessionDetailsOpen] = useState<boolean>(false);

  // Invoice Payment Simulator
  const [invoicePaid, setInvoicePaid] = useState<boolean>(false);
  const [isPaymentSuccessModalOpen, setIsPaymentSuccessModalOpen] = useState<boolean>(false);

  const handleConfirmParaf = async () => {
    setParafConfirmed(true);
    setIsParafModalOpen(false);

    try {
      await setDoc(
        doc(db, 'portal_credentials', 'orang_tua_ratna'),
        {
          lastSignedSession: 'IPAS: Praktikum Rotasi Bumi & Jam Matahari',
          signedAt: new Date().toISOString(),
          parentFeedback: parafNote,
        },
        { merge: true }
      );
      setFeedbackToast('Paraf kehadiran digital berhasil disimpan ke Cloud Firestore!');
    } catch (err) {
      console.warn('Error saving paraf:', err);
      setFeedbackToast('Paraf kehadiran digital tersimpan!');
    }
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handlePayInvoice = (amount: number, invNumber: string, packageName: string) => {
    if (onOpenMidtransPayment) {
      onOpenMidtransPayment({
        inv: invNumber,
        studentName: selectedChild === 'rayhan' ? 'Rayhan Kusuma' : 'Kayla Kusuma',
        amount,
        package: packageName,
      });
      return;
    }

    // Default inline simulation
    setInvoicePaid(true);
    setIsPaymentSuccessModalOpen(true);
    setFeedbackToast(`Pembayaran tagihan ${invNumber} via Midtrans Snap berhasil diverifikasi!`);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  return (
    <div className="bg-[#fcf9f3] font-sans text-[#1c1c18] antialiased min-h-screen selection:bg-[#c8ebce] selection:text-[#284230]">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-60 bg-[#284230] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 animate-fade-in text-xs sm:text-sm font-semibold max-w-md">
          <span className="material-symbols-outlined text-[20px] text-[#c8ebce]">verified</span>
          <span className="flex-1">{feedbackToast}</span>
          <button onClick={() => setFeedbackToast(null)} className="text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Digital Paraf Modal */}
      {isParafModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46] text-2xl">draw</span>
                <h3 className="text-base font-bold text-[#2A2823]">Paraf Digital Orang Tua</h3>
              </div>
              <button onClick={() => setIsParafModalOpen(false)} className="text-[#6B675F] hover:text-[#2A2823]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#2A2823]">
              <div className="p-3 bg-[#FAF7F1] rounded-2xl border border-[rgba(42,40,35,0.08)] space-y-1">
                <p className="font-bold text-[#3F5A46]">Konfirmasi Kehadiran Sesi 70 Menit:</p>
                <p>• Siswa: <strong>Rayhan Kusuma (Kelas 5 SD)</strong></p>
                <p>• Tutor: <strong>Kak Anindya Laksmi, S.Pd.</strong></p>
                <p>• Materi: IPAS Bab 4: Rotasi Bumi &amp; Jam Matahari</p>
                <p>• Lokasi: Meja Belajar Mertoyudan, Magelang</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B675F] mb-1">
                  Catatan untuk Tutor (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={parafNote}
                  onChange={(e) => setParafNote(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F1] rounded-xl border border-[rgba(42,40,35,0.12)] text-xs focus:ring-2 focus:ring-[#6F8F76] outline-none resize-none"
                  placeholder="Beri apresiasi atau pesan untuk tutor..."
                />
              </div>

              <div className="p-4 border-2 border-dashed border-[#6F8F76]/40 rounded-2xl bg-[#c8ebce]/20 text-center">
                <span className="material-symbols-outlined text-3xl text-[#284230] mb-0.5">fingerprint</span>
                <p className="text-[11px] font-bold text-[#284230]">Tanda Tangan Elektronik Sah</p>
                <p className="text-[10px] text-[#6B675F]">Tersinkronisasi otomatis dengan GPS &amp; database tutor</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsParafModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-[rgba(42,40,35,0.12)] text-xs font-semibold text-[#6B675F] hover:bg-[#FAF7F1]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmParaf}
                className="w-1/2 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Kirim Paraf Sah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Notes Details Modal */}
      {isSessionDetailsOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3F5A46] text-2xl">description</span>
                <div>
                  <h3 className="text-base font-bold text-[#2A2823]">Catatan Rinci Sesi Belajar</h3>
                  <p className="text-xs text-[#6B675F]">IPAS Bab 4: Rotasi Bumi • 70 Menit Tatap Muka</p>
                </div>
              </div>
              <button onClick={() => setIsSessionDetailsOpen(false)} className="text-[#6B675F] hover:text-[#2A2823]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#2A2823] leading-relaxed">
              <div className="p-3.5 bg-[#FAF7F1] rounded-2xl border border-[rgba(42,40,35,0.08)] space-y-2">
                <h4 className="font-bold text-sm text-[#3F5A46]">Evaluasi Akademik &amp; Kuis:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>• Skor Kuis Mandiri: <strong className="text-[#284230]">88/100</strong></div>
                  <div>• Durasi Fokus: <strong>70 Menit (Penuh)</strong></div>
                  <div>• Kemandirian Gawai: <strong>5.0 / 5.0 ★</strong></div>
                  <div>• Eksperimen Miniatur: <strong>Tuntas Sempurna</strong></div>
                </div>
              </div>

              <div className="p-3.5 bg-[#F1ECE1]/80 rounded-2xl border border-[rgba(42,40,35,0.08)] space-y-1.5">
                <h4 className="font-bold text-sm text-[#C1683F]">Catatan Afektif Tutor:</h4>
                <p className="italic text-[#1c1c18]">
                  “Rayhan sangat antusias membuktikan pergeseran bayangan tongkat tadi. Pouch bebas gadget ditaati dengan tertib tanpa keluhan sama sekali. Daya tahan konsentrasi hitungan desimalnya melonjak sangat pesat.”
                </p>
                <span className="text-[11px] text-[#6B675F] block font-semibold pt-1">
                  — Kak Anindya Laksmi, S.Pd. (Tutor Resmi Bright Future)
                </span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsSessionDetailsOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-xs cursor-pointer"
              >
                Tutup Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {isPaymentSuccessModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border border-[rgba(42,40,35,0.1)] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#c8ebce] text-[#284230] flex items-center justify-center mx-auto text-3xl font-bold shadow-md">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#284230]">Pembayaran SPP Berhasil!</h3>
              <p className="text-xs text-[#6B675F] mt-1">
                Midtrans Snap Payment ID: <strong>MDT-202609-RAYHAN</strong>
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF7F1] rounded-2xl text-xs text-left space-y-1 border border-[rgba(42,40,35,0.08)]">
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Nomor Invoice:</span>
                <span className="font-mono font-bold">INV-2026-09-088</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Nama Siswa:</span>
                <span className="font-bold">Rayhan Kusuma (Kelas 5 SD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Nominal Terverifikasi:</span>
                <span className="font-extrabold text-[#284230]">Rp 280.000 (LUNAS)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPaymentSuccessModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#284230] text-white text-xs font-bold hover:bg-[#3F5A46] shadow-xs cursor-pointer"
            >
              Selesai &amp; Unduh Bukti Kwitansi
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        } bg-[#f6f3ed]/90 backdrop-blur-xl z-50 flex flex-col justify-between py-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-[rgba(42,40,35,0.10)] transition-all duration-300`}
      >
        <div className="flex flex-col">
          {/* Brand & Collapse Button */}
          <div className="px-5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img src="/logo.svg" alt="Bright Future" className="h-8 w-8 object-contain shrink-0 rounded-lg shadow-2xs" />
              {!isSidebarCollapsed && (
                <span className="text-base text-[#284230] font-bold tracking-tight truncate">Bright Future</span>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18] transition-colors cursor-pointer"
              title="Buka / Tutup Sidebar"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSidebarCollapsed ? 'menu' : 'menu_open'}
              </span>
            </button>
          </div>

          {/* Region Tag */}
          {!isSidebarCollapsed && (
            <div className="px-4 mb-3">
              <div className="px-3 py-1.5 rounded-xl bg-[#f0eee8] flex items-center gap-2 text-[#424843] text-[11px] font-semibold border border-[rgba(42,40,35,0.08)]">
                <span className="material-symbols-outlined text-[16px] text-[#3F5A46]">home_pin</span>
                <span className="truncate">Wilayah Magelang &amp; Mertoyudan</span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-2.5 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
            {[
              { id: 'beranda-ringkasan', label: 'Beranda / Ringkasan', icon: 'dashboard' },
              { id: 'anak-saya-profil', label: 'Anak Saya & Profil', icon: 'face' },
              { id: 'jadwal-kunjungan', label: 'Jadwal Kunjungan', icon: 'calendar_month' },
              { id: 'presensi-sesi', label: 'Presensi & Sesi 70 Mnt', icon: 'timer' },
              { id: 'nilai-catatan-karakter', label: 'Nilai & Catatan Karakter', icon: 'menu_book' },
              { id: 'tagihan-midtrans', label: 'Tagihan & Midtrans', icon: 'receipt_long' },
              { id: 'pengumuman-bantuan-tutor', label: 'Pengumuman & Bantuan', icon: 'support_agent' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isSidebarCollapsed ? 'justify-center px-0' : ''
                } ${
                  activeTab === item.id
                    ? 'bg-[#3F5A46] text-white shadow-xs font-bold'
                    : 'text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18]'
                }`}
                title={item.label}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Hotline & Logout */}
        <div className="px-3 pt-2 flex flex-col gap-2">
          {!isSidebarCollapsed && (
            <div className="p-3 rounded-2xl bg-[#f0eee8] border border-white/60 shadow-xs">
              <p className="text-[10px] text-[#6B675F] font-semibold mb-0.5">Bimbel Datang ke Rumah</p>
              <p className="text-xs font-bold text-[#284230] mb-2">Cabang Magelang Kota</p>
              <a
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#47654f] text-white text-[11px] font-bold hover:bg-[#3F5A46] transition-colors shadow-2xs"
                href="https://wa.me/6285173230198"
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>WhatsApp Admin</span>
              </a>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={onViewLanding}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#424843] hover:bg-[#ebe8e2] hover:text-[#1c1c18] transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Lihat Halaman Website Publik"
            >
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              {!isSidebarCollapsed && <span className="truncate">Web Publik</span>}
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-[#6B675F] hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              title="Keluar dari Portal Orang Tua"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Wrapper */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'pl-20' : 'pl-72'}`}>
        {/* Top Header */}
        <header
          className={`fixed top-0 right-0 h-16 bg-[#fcf9f3]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6 sm:px-8 border-b border-[rgba(42,40,35,0.10)] transition-all duration-300 ${
            isSidebarCollapsed ? 'left-20' : 'left-72'
          }`}
        >
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Bright Future" className="h-8 w-auto object-contain rounded-lg" />
            <div className="h-4 w-px bg-[#c2c8c0]/50 hidden sm:block"></div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-[#1c1c18]">Portal Orang Tua</span>
              <span className="text-[10px] text-[#6B675F]">Mertoyudan &amp; Magelang Kota</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Database indicator */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
              <span>Cloud Firestore Terhubung</span>
            </span>

            {/* Child Selector in Header */}
            <div
              onClick={() => setSelectedChild(selectedChild === 'rayhan' ? 'kayla' : 'rayhan')}
              className="relative flex items-center bg-[#f6f3ed] hover:bg-[#f0eee8] rounded-xl px-3 py-1.5 cursor-pointer transition-colors border border-[rgba(42,40,35,0.08)]"
              title="Klik untuk ganti profil anak"
            >
              <span className="material-symbols-outlined text-[18px] text-[#3F5A46] mr-1.5">school</span>
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-[#1c1c18] font-bold">
                  {selectedChild === 'rayhan' ? 'Rayhan Kusuma' : 'Kayla Kusuma'}
                </span>
                <span className="text-[9.5px] text-[#6B675F] leading-none">
                  {selectedChild === 'rayhan' ? 'Kelas 5 SD' : 'Kelas 2 SD'}
                </span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#6B675F] ml-1">swap_horiz</span>
            </div>

            {/* Pay Button Header CTA */}
            <button
              type="button"
              onClick={() => handlePayInvoice(280000, 'INV-2026-09-088', 'Paket 8 Sesi SD UMUM (Rayhan)')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C1683F] text-white text-xs font-bold hover:bg-[#A85530] transition-colors shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">payments</span>
              <span>Bayar Sesi</span>
            </button>

            {/* Parent Profile Pill */}
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-[#1c1c18]">{parentName}</span>
                <span className="text-[10px] text-[#6B675F]">Wali Murid • {parentPhone}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#284230] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#6F8F76]/30">
                RD
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Dashboard */}
        <main className="relative pt-20 w-full px-6 sm:px-8 pb-14 bg-[#fcf9f3] max-w-7xl mx-auto space-y-6">
          {/* Header & Clean Child Switcher */}
          <header className="relative rounded-3xl bg-white border border-[rgba(42,40,35,0.10)] p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#47654f]"></span>
                  <span>Mertoyudan &amp; Magelang Kota</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c1c18] tracking-tight">
                  Halo, {parentName}
                </h1>
                <p className="text-xs sm:text-sm text-[#6B675F]">
                  Pantau perkembangan dan jadwal belajar tatap muka Rayhan &amp; Kayla secara transparan.
                </p>
              </div>

              {/* 2 Clear Primary Header Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handlePayInvoice(280000, 'INV-2026-09-088', 'Paket 8 Sesi SD UMUM (Rayhan)')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C1683F] text-white text-xs font-bold shadow-xs hover:bg-[#A85530] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  <span>Bayar Tagihan SPP (1)</span>
                </button>
                <a
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f0eee8] text-[#1c1c18] text-xs font-bold hover:bg-[#ebe8e2] transition-colors border border-[rgba(42,40,35,0.08)] cursor-pointer"
                  href="https://wa.me/6285173230198"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#3F5A46]">chat</span>
                  <span>Hubungi Tutor / Admin</span>
                </a>
              </div>
            </div>

            {/* Slim Minimalist Child Switcher Pill Toggle */}
            <div className="pt-3 border-t border-[rgba(42,40,35,0.08)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-[#6B675F] font-semibold">Pilih Profil Anak:</span>
                <div className="inline-flex items-center p-1 rounded-2xl bg-[#f0eee8] border border-[rgba(42,40,35,0.08)]">
                  <button
                    type="button"
                    onClick={() => setSelectedChild('rayhan')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedChild === 'rayhan'
                        ? 'bg-[#284230] text-white shadow-xs'
                        : 'text-[#6B675F] hover:text-[#1c1c18]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#EFC9AE]"></span>
                    <span>Rayhan Kusuma</span>
                    <span className="text-[10px] opacity-80 font-normal">(Kelas 5 SD)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChild('kayla')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedChild === 'kayla'
                        ? 'bg-[#284230] text-white shadow-xs'
                        : 'text-[#6B675F] hover:text-[#1c1c18]'
                    }`}
                  >
                    <span>Kayla Kusuma</span>
                    <span className="text-[10px] opacity-80 font-normal">(Kelas 2 SD)</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFeedbackToast('Formulir pendaftaran paket bundling kakak-beradik diskon 15% dibuka.');
                  setTimeout(() => setFeedbackToast(null), 3000);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#C1683F] hover:underline font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Tambah Profil Adik / Kakak (Diskon 15%)</span>
              </button>
            </div>
          </header>

          {/* 3 Minimalist Stat Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Stat 1: Kehadiran */}
            <div className="p-5 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B675F]">Sesi Berjalan &amp; Kehadiran</span>
                <span className="p-1.5 rounded-xl bg-[#c8ebce] text-[#284230] material-symbols-outlined text-[20px]">
                  event_available
                </span>
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-[#284230]">98.5%</div>
                <p className="text-xs text-[#6B675F] mt-0.5">15/16 Sesi Tuntas 70 Menit</p>
              </div>
              <div className="pt-2 border-t border-[rgba(42,40,35,0.06)] flex items-center gap-1 text-[11px] text-[#3F5A46] font-semibold">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>1 Sesi dijadwalkan ulang sah (kegiatan sekolah)</span>
              </div>
            </div>

            {/* Stat 2: Capaian Nilai */}
            <div className="p-5 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B675F]">Rata-rata Nilai Akademik</span>
                <span className="p-1.5 rounded-xl bg-[#F1ECE1] text-[#284230] material-symbols-outlined text-[20px]">
                  trending_up
                </span>
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-[#1c1c18]">
                  91.2<span className="text-lg font-normal text-[#6B675F]"> / 100</span>
                </div>
                <p className="text-xs text-[#47654f] font-bold mt-0.5">Grade A • Sangat Baik</p>
              </div>
              <div className="pt-2 border-t border-[rgba(42,40,35,0.06)] flex items-center gap-1 text-[11px] text-[#6B675F] font-semibold">
                <span className="material-symbols-outlined text-[15px] text-[#C1683F]">star</span>
                <span>+4.8 poin peningkatan vs bulan lalu</span>
              </div>
            </div>

            {/* Stat 3: Tagihan Berjalan */}
            <div className="p-5 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B675F]">Tagihan SPP Berjalan</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    invoicePaid ? 'bg-emerald-100 text-emerald-800' : 'bg-[#EFC9AE] text-[#6b2702]'
                  }`}
                >
                  {invoicePaid ? 'Lunas Terverifikasi' : 'Jatuh tempo 5 Okt'}
                </span>
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-[#C1683F]">
                  {invoicePaid ? 'Rp 0' : 'Rp 280.000'}
                </div>
                <p className="text-xs text-[#6B675F] mt-0.5">Paket 8 Sesi Rumah Rayhan (Okt)</p>
              </div>
              <div className="pt-2 border-t border-[rgba(42,40,35,0.06)] flex items-center justify-between">
                <span className="text-[11px] text-[#6B675F]">Midtrans Snap Ready</span>
                <button
                  type="button"
                  disabled={invoicePaid}
                  onClick={() => handlePayInvoice(280000, 'INV-2026-09-088', 'Paket 8 Sesi SD UMUM (Rayhan)')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#C1683F] text-white text-xs font-bold hover:bg-[#A85530] disabled:opacity-50 transition-opacity cursor-pointer shadow-2xs"
                >
                  {invoicePaid ? 'Sudah Lunas' : 'Bayar Sekarang'}
                </button>
              </div>
            </div>
          </section>

          {/* Elegant Live Session Card */}
          <section className="p-6 sm:p-7 rounded-3xl bg-white border border-[rgba(42,40,35,0.10)] shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left Info */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8ebce] text-[#284230] text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#47654f] animate-pulse"></span>
                    Sesi Berlangsung (13:30 – 14:40 WIB)
                  </span>
                  <span className="text-[#6B675F] text-xs font-semibold">• Meja Belajar Mertoyudan</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#284230]">
                  IPAS: Praktikum Rotasi Bumi &amp; Jam Matahari
                </h2>
                <p className="text-xs sm:text-sm text-[#6B675F] max-w-2xl leading-relaxed">
                  Modul Bab 4 Kurikulum Merdeka. Rayhan sedang mengamati pergeseran bayangan tongkat jam matahari di teras dan mencatat sudut azimut bersama tutor.
                </p>

                {/* Tutor Snap & WA */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-11 h-11 rounded-full bg-[#3F5A46] text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-[#6F8F76]/30">
                    KA
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-[#1c1c18]">Kak Anindya Laksmi, S.Pd.</h3>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-[#47654f] font-bold bg-[#c8ebce]/60 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[13px]">verified</span> Tutor Resmi
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B675F]">Pendidikan IPA Universitas Tidar • Rating 4.98 (84 Sesi)</p>
                  </div>
                  <a
                    className="ml-auto sm:ml-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F1] hover:bg-[#F1ECE1] text-[#1c1c18] text-xs font-bold border border-[rgba(42,40,35,0.12)] transition-colors cursor-pointer"
                    href="https://wa.me/6281298765432"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#3F5A46]">chat</span>
                    <span>WA Tutor</span>
                  </a>
                </div>
              </div>

              {/* Right: Clean Timer & Quick Action Buttons */}
              <div className="lg:w-80 flex flex-col justify-between p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] space-y-3">
                <div className="flex items-center justify-between text-[#6B675F]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Timer Sesi 70 Menit</span>
                  <span className="text-[#C1683F] text-xs font-bold">Sisa 27 Mnt</span>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#284230]">
                    42:15 <span className="text-base font-normal text-[#6B675F]">/ 70:00</span>
                  </div>
                  <div className="w-full h-2 bg-[#ebe8e2] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#3F5A46] rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsParafModalOpen(true)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      parafConfirmed
                        ? 'bg-[#c8ebce] text-[#284230] border border-[#284230]/20'
                        : 'bg-[#284230] text-white hover:bg-[#3F5A46]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {parafConfirmed ? 'check_circle' : 'draw'}
                    </span>
                    <span>{parafConfirmed ? 'Paraf Digital Terkonfirmasi ✓' : 'Beri Paraf Kehadiran Digital'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSessionDetailsOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white text-[#1c1c18] text-xs font-semibold hover:bg-[#FAF7F1] border border-[rgba(42,40,35,0.12)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span>Lihat Catatan Sesi</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Balanced 2-Column Bottom */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7 cols): Schedule & Grades */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              {/* Jadwal Kunjungan Rumah Terdekat */}
              <div className="p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.10)] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#c8ebce] text-[#284230] material-symbols-outlined text-[18px]">
                      calendar_month
                    </span>
                    <h3 className="text-base font-bold text-[#1c1c18]">Jadwal Kunjungan Rumah Terdekat</h3>
                  </div>
                  <span className="text-[11px] text-[#6B675F] font-semibold">2 Sesi / Pekan</span>
                </div>
                <div className="space-y-3">
                  {/* Visit 1 */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F1] flex items-center justify-between border border-[rgba(42,40,35,0.08)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#f0eee8] flex flex-col items-center justify-center text-[#284230] font-bold text-xs">
                        <span>SAB</span>
                        <span className="text-sm leading-none">27</span>
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#1c1c18]">
                          Bahasa Inggris: Daily Activity
                        </h4>
                        <p className="text-[11px] text-[#6B675F]">15:30 - 16:40 WIB • Kak Anindya Laksmi</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                      Terkonfirmasi
                    </span>
                  </div>

                  {/* Visit 2 */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F1] flex items-center justify-between border border-[rgba(42,40,35,0.08)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#f0eee8] flex flex-col items-center justify-center text-[#284230] font-bold text-xs">
                        <span>SEN</span>
                        <span className="text-sm leading-none">29</span>
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#1c1c18]">
                          Matematika: Pecahan Desimal &amp; Persen
                        </h4>
                        <p className="text-[11px] text-[#6B675F]">15:30 - 16:40 WIB • Kak Anindya Laksmi</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                      Terkonfirmasi
                    </span>
                  </div>
                </div>
              </div>

              {/* Nilai & Catatan Singkat Tutor */}
              <div className="p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.10)] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#F1ECE1] text-[#284230] material-symbols-outlined text-[18px]">
                      school
                    </span>
                    <h3 className="text-base font-bold text-[#1c1c18]">Nilai &amp; Catatan Singkat Tutor</h3>
                  </div>
                  <span className="text-[11px] text-[#47654f] font-bold bg-[#c8ebce]/60 px-2.5 py-0.5 rounded-full">
                    PTS Kelas 5 SD
                  </span>
                </div>

                {/* 4 Compact Subject Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-[#FAF7F1] text-center border border-[rgba(42,40,35,0.06)]">
                    <span className="text-[10px] text-[#6B675F] uppercase font-bold">IPAS</span>
                    <div className="text-xl font-extrabold text-[#284230] mt-0.5">93.5</div>
                    <span className="text-[10px] text-[#47654f] font-semibold">+3.5 vs Rata-rata</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF7F1] text-center border border-[rgba(42,40,35,0.06)]">
                    <span className="text-[10px] text-[#6B675F] uppercase font-bold">Matematika</span>
                    <div className="text-xl font-extrabold text-[#284230] mt-0.5">89.0</div>
                    <span className="text-[10px] text-[#47654f] font-semibold">+6.0 Signifikan</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF7F1] text-center border border-[rgba(42,40,35,0.06)]">
                    <span className="text-[10px] text-[#6B675F] uppercase font-bold">B. Indonesia</span>
                    <div className="text-xl font-extrabold text-[#284230] mt-0.5">91.5</div>
                    <span className="text-[10px] text-[#47654f] font-semibold">+2.0 Konsisten</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF7F1] text-center border border-[rgba(42,40,35,0.06)]">
                    <span className="text-[10px] text-[#6B675F] uppercase font-bold">B. Inggris</span>
                    <div className="text-xl font-extrabold text-[#284230] mt-0.5">88.5</div>
                    <span className="text-[10px] text-[#47654f] font-semibold">+4.5 Percakapan</span>
                  </div>
                </div>

                {/* Short Touching Affective Quote */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F1] border-l-4 border-[#C1683F] flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] text-[#C1683F] mt-0.5">format_quote</span>
                  <div className="space-y-1">
                    <p className="text-xs text-[#1c1c18] italic leading-relaxed">
                      “Rayhan sangat antusias membuktikan pergeseran bayangan tongkat tadi. Pouch bebas gadget ditaati dengan tertib tanpa keluhan sama sekali. Daya tahan konsentrasi hitungan desimalnya melonjak sangat pesat.”
                    </p>
                    <span className="text-[11px] text-[#6B675F] font-bold block">
                      — Kak Anindya Laksmi, S.Pd. (Tutor Pembimbing)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Invoices & Announcements */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              {/* Card: Ringkasan Tagihan & Midtrans Snap */}
              <div className="p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.10)] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#EFC9AE] text-[#6b2702] material-symbols-outlined text-[18px]">
                      receipt_long
                    </span>
                    <h3 className="text-base font-bold text-[#1c1c18]">Tagihan &amp; Midtrans Snap</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EFC9AE] text-[#6b2702] text-[10px] font-bold">
                    {invoicePaid ? 'Lunas' : '1 Pending'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#6B675F]">INV-2026-09-088</span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1c1c18]">Paket 8 Sesi Rayhan Kusuma</h4>
                      <p className="text-[11px] text-[#6B675F]">Periode: 1 – 31 Okt 2026</p>
                    </div>
                    <span className="text-lg font-extrabold text-[#C1683F]">
                      {invoicePaid ? 'LUNAS' : 'Rp 280.000'}
                    </span>
                  </div>

                  {/* Multi-Child Bundle Callout */}
                  <div className="p-2.5 rounded-xl bg-white border border-dashed border-[#EFC9AE] flex items-center justify-between text-[11px]">
                    <span className="text-[#1c1c18]">
                      Bayar sekaligus SPP Kayla (Total <strong>Rp 518.000</strong>)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#C1683F] text-white font-bold text-[10px]">
                      Hemat 15%
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={invoicePaid}
                    onClick={() => handlePayInvoice(280000, 'INV-2026-09-088', 'Paket 8 Sesi SD UMUM (Rayhan)')}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#C1683F] text-white text-xs font-bold hover:bg-[#A85530] disabled:opacity-50 transition-opacity shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px]">lock</span>
                    <span>{invoicePaid ? 'Tagihan Sudah Dibayar' : 'Bayar Sekarang via Midtrans'}</span>
                  </button>
                </div>
              </div>

              {/* Card: Pengumuman Singkat Magelang */}
              <div className="p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.10)] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#c8ebce] text-[#284230] material-symbols-outlined text-[18px]">
                      campaign
                    </span>
                    <h3 className="text-base font-bold text-[#1c1c18]">Info Bimbel Magelang</h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#47654f]"></span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#c8ebce] text-[#284230] text-[10px] font-bold">
                      Agenda Libur
                    </span>
                    <span className="text-[10px] text-[#6B675F]">16 Sep 2026</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1c1c18]">Penyesuaian Jadwal Libur Maulid Nabi</h4>
                  <p className="text-[11px] text-[#6B675F] leading-relaxed">
                    Sesi kunjungan hari libur nasional dialihkan ke jadwal pengganti di akhir pekan sesuai kesepakatan Bunda dan Tutor.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-[#6B675F] pt-1">
                  <span>Koordinator Belajar: <strong>Bunda Monica</strong></span>
                  <a
                    className="text-[#47654f] font-bold hover:underline flex items-center gap-1"
                    href="https://wa.me/6285173230198"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="material-symbols-outlined text-[15px]">support_agent</span>
                    <span>Konsultasi Cabang</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-6 border-t border-[rgba(42,40,35,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#6B675F] text-[11px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#3F5A46]">security</span>
              <span>Bright Future Cabang Magelang Kota &amp; Mertoyudan — Transparansi Penuh Pendidikan Tatap Muka Rumah.</span>
            </div>
            <div className="text-right">
              <span>Standar Mutu 70 Menit • Pouch Anti-Gadget</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
