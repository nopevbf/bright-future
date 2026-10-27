import React, { useState, useEffect } from 'react';
import {
  OFFICIAL_MIDTRANS_METHODS,
  getMidtransSettings,
  saveMidtransSettings,
  calculateMidtransFee,
  MidtransSettingsConfig,
} from '../../utils/midtransSettings';
import {
  saveMidtransSettingsToFirestore,
  subscribeToMidtransSettings,
} from '../../firebase';
import {
  CreditCard,
  Building,
  QrCode,
  Store,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

export const MidtransSettingsSubTab: React.FC = () => {
  const [settings, setSettings] = useState<MidtransSettingsConfig>(() => getMidtransSettings());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Sync if external settings changed (local or Firestore real-time)
  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getMidtransSettings());
    };
    window.addEventListener('bf_midtrans_settings_updated', handleUpdate);

    const unsubFirestore = subscribeToMidtransSettings((data) => {
      setSettings(data);
    });

    return () => {
      window.removeEventListener('bf_midtrans_settings_updated', handleUpdate);
      if (typeof unsubFirestore === 'function') {
        unsubFirestore();
      }
    };
  }, []);

  const handleToggleMethod = (methodId: string) => {
    setSettings((prev) => {
      const isEnabled = prev.enabledMethods.includes(methodId);
      if (isEnabled) {
        // Jangan izinkan mematikan semua metode (minimal 1 harus aktif)
        if (prev.enabledMethods.length <= 1) {
          alert('Minimal harus ada 1 metode pembayaran Midtrans yang aktif.');
          return prev;
        }
        return {
          ...prev,
          enabledMethods: prev.enabledMethods.filter((id) => id !== methodId),
        };
      } else {
        return {
          ...prev,
          enabledMethods: [...prev.enabledMethods, methodId],
        };
      }
    });
  };

  const handleSelectAllMethods = () => {
    setSettings((prev) => ({
      ...prev,
      enabledMethods: OFFICIAL_MIDTRANS_METHODS.map((m) => m.id),
    }));
  };

  const handleResetRecommended = () => {
    setSettings((prev) => ({
      ...prev,
      feeType: 'flat',
      feeAmount: 4000,
      isCustomerFee: true,
      enabledMethods: ['qris', 'bca_va', 'bri_va', 'mandiri_va', 'bni_va'],
      customMethodFees: {},
    }));
  };

  const handleSetCustomMethodFee = (methodId: string, feeType: 'flat' | 'percentage', feeAmount: number) => {
    setSettings((prev) => ({
      ...prev,
      customMethodFees: {
        ...(prev.customMethodFees || {}),
        [methodId]: {
          feeType,
          feeAmount: Math.max(0, feeAmount),
        },
      },
    }));
  };

  const handleRemoveCustomMethodFee = (methodId: string) => {
    setSettings((prev) => {
      const nextCustom = { ...(prev.customMethodFees || {}) };
      delete nextCustom[methodId];
      return {
        ...prev,
        customMethodFees: nextCustom,
      };
    });
  };

  const [simMethodId, setSimMethodId] = useState<string>('universal');

  const handleSave = () => {
    const payload: MidtransSettingsConfig = {
      ...settings,
      customMethodFees: settings.customMethodFees || {},
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin Operasional',
    };
    saveMidtransSettings(payload);
    saveMidtransSettingsToFirestore(payload).catch((err) => {
      console.warn('Gagal menyimpan ke Firestore (menggunakan cache lokal):', err);
    });
    setSavedNotice('Pengaturan Berhasil Disimpan ke Cloud Firestore & Sinkron Real-time!');
    setTimeout(() => {
      setSavedNotice(null);
    }, 3500);
  };

  // Preview simulasi fee pada SPP Rp 280.000 (mendukung pemilihan metode pembayaran simulasi)
  const sampleFee = calculateMidtransFee(280000, settings, simMethodId === 'universal' ? undefined : simMethodId);

  const getMethodIcon = (iconType: string) => {
    switch (iconType) {
      case 'qrcode':
        return <QrCode className="w-5 h-5 text-[#3F5A46]" />;
      case 'building':
        return <Building className="w-5 h-5 text-[#3F5A46]" />;
      case 'store':
        return <Store className="w-5 h-5 text-[#C1683F]" />;
      default:
        return <CreditCard className="w-5 h-5 text-[#3F5A46]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(42,40,35,0.10)]">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF2ED] text-[#284230] text-[10px] font-bold uppercase tracking-wider border border-[#3F5A46]/20">
              Payment Gateway Control Panel
            </span>
            <span className="text-xs text-[#284230] font-semibold flex items-center gap-1.5 bg-[#FAF7F1] px-2.5 py-0.5 rounded-full border border-[rgba(42,40,35,0.10)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Midtrans Direct Core API &amp; Snap</span>
            </span>
            <span className="text-[11px] text-[#3F5A46] font-medium flex items-center gap-1 bg-[#EAF2ED] px-2.5 py-0.5 rounded-full border border-[#3F5A46]/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3F5A46]" />
              <span>Cloud Firestore Synced</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#1c1c18]">
            Pengaturan Midtrans Payment Gateway
          </h2>
          <p className="text-xs sm:text-sm text-[#6B675F]">
            Konfigurasi biaya layanan (convenience fee) otomatis dan kelola aktifasi 11 metode pembayaran resmi Midtrans secara dinamis.
          </p>
        </div>

        {/* Action Button Simpan di Header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetRecommended}
            className="py-2.5 px-3 rounded-xl border border-[rgba(42,40,35,0.12)] bg-white hover:bg-[#FAF7F1] text-xs font-bold text-[#2A2823] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#6B675F]" />
            <span>Reset Standar</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-4 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Success Alert Notice */}
      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Grid: Fee Configuration (Left) & Simulation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Pengaturan Fee */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.10)] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(42,40,35,0.06)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EAF2ED] text-[#3F5A46] flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#2A2823]">Biaya Layanan Midtrans (Admin Fee)</h3>
                  <p className="text-[11px] text-[#6B675F]">Otomatis ditambahkan saat pembayaran via Midtrans</p>
                </div>
              </div>
            </div>

            {/* Switch: Bebankan Fee ke Siswa */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] cursor-pointer hover:bg-[#FAF7F1]/80 transition-colors">
              <div>
                <span className="font-bold text-xs text-[#2A2823] block">Bebankan Biaya Layanan ke Pembayar</span>
                <span className="text-[11px] text-[#6B675F] block mt-0.5">
                  Bila aktif, biaya otomatis ditambahkan ke total invoice pembayaran Midtrans.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.isCustomerFee}
                onChange={(e) => setSettings({ ...settings, isCustomerFee: e.target.checked })}
                className="w-5 h-5 rounded text-[#3F5A46] focus:ring-[#3F5A46] cursor-pointer shrink-0 accent-[#3F5A46]"
              />
            </label>

            {/* Tipe Fee: Flat vs Percentage */}
            <div>
              <label className="block text-xs font-bold text-[#2A2823] uppercase mb-2">
                Tipe Biaya Layanan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, feeType: 'flat' })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settings.feeType === 'flat'
                      ? 'bg-[#3F5A46] text-white border-[#3F5A46] shadow-xs'
                      : 'bg-white text-[#2A2823] border-[rgba(42,40,35,0.12)] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <span>Nominal Tetap (Flat Rp)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, feeType: 'percentage' })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settings.feeType === 'percentage'
                      ? 'bg-[#3F5A46] text-white border-[#3F5A46] shadow-xs'
                      : 'bg-white text-[#2A2823] border-[rgba(42,40,35,0.12)] hover:bg-[#FAF7F1]'
                  }`}
                >
                  <span>Persentase (%)</span>
                </button>
              </div>
            </div>

            {/* Input Nilai Fee */}
            <div>
              <label htmlFor="midtrans-fee-input" className="block text-xs font-bold text-[#2A2823] uppercase mb-1.5 flex items-center justify-between">
                <span>Nominal Biaya Layanan</span>
                <span className="text-[11px] text-[#6B675F] font-normal normal-case">
                  {settings.feeType === 'flat' ? 'Rupiah per transaksi' : 'Persen dari total tagihan'}
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-[#6B675F]">
                  {settings.feeType === 'flat' ? 'Rp' : '%'}
                </div>
                <input
                  id="midtrans-fee-input"
                  type="number"
                  min="0"
                  step={settings.feeType === 'flat' ? '500' : '0.1'}
                  value={settings.feeAmount}
                  onChange={(e) => setSettings({ ...settings, feeAmount: Number(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-sm font-bold text-[#2A2823] focus:outline-none focus:ring-2 focus:ring-[#3F5A46]"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {[
                  { label: 'Gratis (Rp 0)', type: 'flat', val: 0 },
                  { label: 'Rp 2.500', type: 'flat', val: 2500 },
                  { label: 'Rp 4.000 (Standar VA)', type: 'flat', val: 4000 },
                  { label: 'Rp 5.000', type: 'flat', val: 5000 },
                  { label: '0.7% (MDR QRIS)', type: 'percentage', val: 0.7 },
                  { label: '1.5%', type: 'percentage', val: 1.5 },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSettings({ ...settings, feeType: item.type as any, feeAmount: item.val })}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-[#FAF7F1] hover:bg-[#eae6dc] text-[#2A2823] border border-gray-200 cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Simulation Card */}
        <div className="lg:col-span-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF7F1] border border-[rgba(42,40,35,0.10)] shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C1683F]" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#3F5A46]">
                  Simulasi Tagihan &amp; Transparansi Fee
                </h4>
              </div>
            </div>

            <p className="text-[11px] text-[#6B675F] leading-relaxed">
              Berikut adalah contoh tampilan rincian yang akan dilihat orang tua saat checkout di modal Midtrans dan dokumen invoice:
            </p>

            {/* Selector Metode Simulasi */}
            <div>
              <label htmlFor="sim-method-select" className="block text-[11px] font-bold text-[#2A2823] mb-1">
                Pilih Metode untuk Simulasi:
              </label>
              <select
                id="sim-method-select"
                value={simMethodId}
                onChange={(e) => setSimMethodId(e.target.value)}
                className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-[rgba(42,40,35,0.14)] bg-white text-[#2A2823] focus:outline-none focus:ring-1 focus:ring-[#3F5A46]"
              >
                <option value="universal">Tarif Universal ({settings.feeType === 'flat' ? `Rp ${settings.feeAmount.toLocaleString('id-ID')}` : `${settings.feeAmount}%`})</option>
                {OFFICIAL_MIDTRANS_METHODS.filter((m) => settings.enabledMethods.includes(m.id)).map((m) => {
                  const custom = settings.customMethodFees?.[m.id];
                  const feeLabel = custom
                    ? (custom.feeType === 'flat' ? `Rp ${custom.feeAmount.toLocaleString('id-ID')}` : `${custom.feeAmount}%`)
                    : 'Universal';
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name} - ({custom ? `Khusus: ${feeLabel}` : `Default: ${feeLabel}`})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[rgba(42,40,35,0.08)] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B675F]">Subtotal SPP (8 Sesi SD):</span>
                <span className="font-semibold text-[#2A2823]">Rp 280.000</span>
              </div>
              <div className="flex justify-between text-[#C1683F] font-semibold">
                <span>Biaya Layanan Midtrans:</span>
                <span>+ {sampleFee.formattedFee}</span>
              </div>
              <div className="pt-2 border-t border-[rgba(42,40,35,0.08)] flex justify-between items-center text-sm font-extrabold text-[#284230]">
                <span>Total Pembayaran Siswa:</span>
                <span className="text-base text-[#C1683F]">{sampleFee.formattedGrandTotal}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[10.5px] text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Pembayaran Transfer Manual (Bank Jateng) <strong>tidak dikenakan biaya layanan Midtrans</strong> (tetap Rp 0).
              </span>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B675F]">Metode Aktif Saat Ini:</span>
                <span className="font-bold text-[#3F5A46]">{settings.enabledMethods.length} dari 11 Metode</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Daftar Metode Pembayaran Resmi Midtrans */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[rgba(42,40,35,0.10)] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(42,40,35,0.08)]">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#2A2823] flex items-center gap-2">
              <span>Metode Pembayaran Tersedia (11 Metode Resmi Midtrans)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {settings.enabledMethods.length} Aktif
              </span>
            </h3>
            <p className="text-xs text-[#6B675F] mt-0.5">
              Aktifkan atau nonaktifkan metode pembayaran yang diizinkan untuk siswa &amp; orang tua.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllMethods}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#3F5A46] hover:bg-[#EAF2ED] border border-[#3F5A46]/30 cursor-pointer transition-colors"
            >
              Aktifkan Semua (11 Metode)
            </button>
          </div>
        </div>

        {/* Grid Metode Pembayaran */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {OFFICIAL_MIDTRANS_METHODS.map((method) => {
            const isEnabled = settings.enabledMethods.includes(method.id);
            const customFee = settings.customMethodFees?.[method.id];
            return (
              <div
                key={method.id}
                onClick={() => handleToggleMethod(method.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isEnabled
                    ? 'bg-[#FAF7F1] border-[#3F5A46] shadow-xs'
                    : 'bg-gray-50/60 border-gray-200 opacity-60 hover:opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[rgba(42,40,35,0.08)] flex items-center justify-center shrink-0 shadow-2xs">
                        {getMethodIcon(method.iconType)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#2A2823] leading-snug">
                          {method.name}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-[#6B675F] font-semibold">
                          {method.categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      data-testid={`toggle-method-${method.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMethod(method.id);
                      }}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                        isEnabled ? 'bg-[#3F5A46]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-[10.5px] text-[#6B675F] leading-relaxed line-clamp-2">
                    {method.description}
                  </p>

                  {/* Pengaturan Biaya Layanan Khusus Per Metode */}
                  {isEnabled && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 pt-2.5 border-t border-[rgba(42,40,35,0.08)] space-y-2 text-left"
                    >
                      {customFee ? (
                        <div className="space-y-1.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                              <span>Fee Khusus Aktif</span>
                            </span>
                            <button
                              type="button"
                              data-testid={`reset-fee-${method.id}`}
                              onClick={() => handleRemoveCustomMethodFee(method.id)}
                              className="text-[10px] font-bold text-[#C1683F] hover:underline cursor-pointer"
                            >
                              Reset ke Universal
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Switch Flat vs % */}
                            <div className="inline-flex rounded-lg border border-amber-300 bg-white p-0.5">
                              <button
                                type="button"
                                onClick={() => handleSetCustomMethodFee(method.id, 'flat', customFee.feeAmount)}
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                                  customFee.feeType === 'flat' ? 'bg-[#3F5A46] text-white' : 'text-gray-600'
                                }`}
                              >
                                Rp
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetCustomMethodFee(method.id, 'percentage', customFee.feeAmount)}
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                                  customFee.feeType === 'percentage' ? 'bg-[#3F5A46] text-white' : 'text-gray-600'
                                }`}
                              >
                                %
                              </button>
                            </div>

                            {/* Input Nilai Fee Khusus */}
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="0"
                                step={customFee.feeType === 'flat' ? '500' : '0.1'}
                                value={customFee.feeAmount}
                                data-testid={`input-custom-fee-${method.id}`}
                                onChange={(e) =>
                                  handleSetCustomMethodFee(
                                    method.id,
                                    customFee.feeType,
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2 py-1 text-[11px] font-bold rounded-lg border border-amber-300 bg-white text-[#2A2823] focus:outline-none focus:ring-1 focus:ring-[#3F5A46]"
                              />
                            </div>
                          </div>

                          <div className="text-[9.5px] text-amber-800 font-medium">
                            Simulasi SPP Rp 280k: Fee{' '}
                            <strong>
                              {customFee.feeType === 'flat'
                                ? `Rp ${Math.round(customFee.feeAmount).toLocaleString('id-ID')}`
                                : `Rp ${Math.round((280000 * customFee.feeAmount) / 100).toLocaleString('id-ID')} (${customFee.feeAmount}%)`}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[#6B675F]">
                            Biaya:{' '}
                            <strong className="text-[#2A2823]">
                              {settings.feeType === 'flat'
                                ? `Rp ${settings.feeAmount.toLocaleString('id-ID')}`
                                : `${settings.feeAmount}%`}{' '}
                              (Universal)
                            </strong>
                          </span>
                          <button
                            type="button"
                            data-testid={`btn-custom-fee-${method.id}`}
                            onClick={() => {
                              const defaultType =
                                method.category === 'qris' || method.category === 'ewallet' ? 'percentage' : 'flat';
                              const defaultAmount =
                                method.id === 'qris' ? 0.7 : method.category === 'cstore' ? 5000 : settings.feeAmount;
                              handleSetCustomMethodFee(method.id, defaultType, defaultAmount);
                            }}
                            className="px-2 py-0.5 rounded-md bg-[#EAF2ED] text-[#284230] text-[10px] font-bold border border-[#3F5A46]/20 hover:bg-[#d8e6db] transition-colors cursor-pointer"
                          >
                            + Atur Khusus
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-[rgba(42,40,35,0.06)] flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 font-mono text-[#2A2823]">
                    {method.badge}
                  </span>
                  <span className={`font-bold ${isEnabled ? 'text-[#3F5A46]' : 'text-gray-400'}`}>
                    {isEnabled ? 'Tersedia di Checkout' : 'Dinonaktifkan'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
