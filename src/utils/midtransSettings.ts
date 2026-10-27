export type PaymentMethodCategory = 'va' | 'qris' | 'ewallet' | 'cstore';

export interface MidtransPaymentMethodConfig {
  id: string;
  name: string;
  category: PaymentMethodCategory;
  categoryLabel: string;
  description: string;
  badge: string;
  iconType: 'qrcode' | 'building' | 'creditcard' | 'store';
}

export interface MethodFeeConfig {
  feeType: 'flat' | 'percentage';
  feeAmount: number;
}

export interface MidtransSettingsConfig {
  feeType: 'flat' | 'percentage';
  feeAmount: number;
  isCustomerFee: boolean;
  enabledMethods: string[];
  customMethodFees?: Record<string, MethodFeeConfig>;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CalculatedMidtransFee {
  baseAmount: number;
  feeAmount: number;
  grandTotal: number;
  formattedFee: string;
  formattedGrandTotal: string;
}

/**
 * 11 Metode Pembayaran Resmi Midtrans (Riset docs.midtrans.com Core API & Snap)
 */
export const OFFICIAL_MIDTRANS_METHODS: MidtransPaymentMethodConfig[] = [
  {
    id: 'qris',
    name: 'QRIS',
    category: 'qris',
    categoryLabel: 'QRIS & E-Wallet',
    description: 'GoPay, ShopeePay, OVO, Dana, LinkAja & Semua m-Banking',
    badge: 'Universal',
    iconType: 'qrcode',
  },
  {
    id: 'bca_va',
    name: 'BCA Virtual Account',
    category: 'va',
    categoryLabel: 'Virtual Account',
    description: 'BCA Mobile, KlikBCA, atau ATM BCA',
    badge: 'Real-time',
    iconType: 'building',
  },
  {
    id: 'bri_va',
    name: 'BRI Virtual Account (BRIVA)',
    category: 'va',
    categoryLabel: 'Virtual Account',
    description: 'BRImo, ATM BRI, atau Agen BRILink',
    badge: 'Real-time',
    iconType: 'building',
  },
  {
    id: 'mandiri_va',
    name: 'Mandiri Bill Payment',
    category: 'va',
    categoryLabel: 'Virtual Account',
    description: 'Livin by Mandiri atau ATM Mandiri',
    badge: 'Bill Key',
    iconType: 'creditcard',
  },
  {
    id: 'bni_va',
    name: 'BNI Virtual Account',
    category: 'va',
    categoryLabel: 'Virtual Account',
    description: 'BNI Mobile Banking atau ATM BNI',
    badge: 'Real-time',
    iconType: 'building',
  },
  {
    id: 'permata_va',
    name: 'Permata Virtual Account',
    category: 'va',
    categoryLabel: 'Virtual Account',
    description: 'PermataMobile X atau ATM Permata',
    badge: 'Real-time',
    iconType: 'building',
  },
  {
    id: 'cimb_va',
    name: 'CIMB Niaga Virtual Account',
    category: 'va',
    categoryLabel: 'Virtual Account',
    description: 'OCTO Mobile atau ATM CIMB Niaga',
    badge: 'Real-time',
    iconType: 'building',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    category: 'ewallet',
    categoryLabel: 'E-Wallet Direct',
    description: 'Bayar instan langsung via aplikasi GoPay / Gojek',
    badge: 'Direct App',
    iconType: 'qrcode',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    category: 'ewallet',
    categoryLabel: 'E-Wallet Direct',
    description: 'Bayar instan langsung buka aplikasi ShopeePay',
    badge: 'Direct App',
    iconType: 'qrcode',
  },
  {
    id: 'indomaret',
    name: 'Indomaret',
    category: 'cstore',
    categoryLabel: 'Gerai Ritel (Tunai)',
    description: 'Bayar tunai di kasir gerai Indomaret seluruh Indonesia',
    badge: 'Kode Bayar',
    iconType: 'store',
  },
  {
    id: 'alfamart',
    name: 'Alfamart / Alfamidi',
    category: 'cstore',
    categoryLabel: 'Gerai Ritel (Tunai)',
    description: 'Bayar tunai di kasir Alfamart, Alfamidi, atau Dan+Dan',
    badge: 'Kode Bayar',
    iconType: 'store',
  },
];

export const STORAGE_KEY_MIDTRANS_SETTINGS = 'bf_midtrans_settings';

export const DEFAULT_MIDTRANS_SETTINGS: MidtransSettingsConfig = {
  feeType: 'flat',
  feeAmount: 4000,
  isCustomerFee: true,
  enabledMethods: ['qris', 'bca_va', 'bri_va', 'mandiri_va', 'bni_va'],
  customMethodFees: {},
};

/**
 * Mengambil konfigurasi Midtrans aktif dari storage atau default.
 */
export function getMidtransSettings(): MidtransSettingsConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_MIDTRANS_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MIDTRANS_SETTINGS);
    if (!raw) return { ...DEFAULT_MIDTRANS_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      feeType: parsed.feeType === 'percentage' ? 'percentage' : 'flat',
      feeAmount: typeof parsed.feeAmount === 'number' ? Math.max(0, parsed.feeAmount) : DEFAULT_MIDTRANS_SETTINGS.feeAmount,
      isCustomerFee: parsed.isCustomerFee !== false,
      enabledMethods: Array.isArray(parsed.enabledMethods) && parsed.enabledMethods.length > 0
        ? parsed.enabledMethods
        : [...DEFAULT_MIDTRANS_SETTINGS.enabledMethods],
      customMethodFees: parsed.customMethodFees && typeof parsed.customMethodFees === 'object'
        ? parsed.customMethodFees
        : {},
      updatedAt: parsed.updatedAt,
      updatedBy: parsed.updatedBy,
    };
  } catch {
    return { ...DEFAULT_MIDTRANS_SETTINGS };
  }
}

/**
 * Menyimpan konfigurasi Midtrans ke storage dan men-dispatch custom event.
 */
export function saveMidtransSettings(settings: MidtransSettingsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MIDTRANS_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('bf_midtrans_settings_updated', { detail: settings }));
  } catch (e) {
    console.warn('[MidtransSettings] Failed to save settings to localStorage:', e);
  }
}

/**
 * Menghitung biaya layanan Midtrans (Flat atau Persentase) berdasarkan nominal dasar dan metode (opsional).
 */
export function calculateMidtransFee(
  baseAmount: number,
  settings: MidtransSettingsConfig = getMidtransSettings(),
  methodId?: string
): CalculatedMidtransFee {
  const safeBase = Math.max(0, Math.round(baseAmount || 0));

  if (safeBase === 0 || !settings.isCustomerFee) {
    return {
      baseAmount: safeBase,
      feeAmount: 0,
      grandTotal: safeBase,
      formattedFee: 'Rp 0',
      formattedGrandTotal: `Rp ${safeBase.toLocaleString('id-ID')}`,
    };
  }

  // Cek apakah ada biaya kustom per metode pembayaran
  const customConfig = methodId && settings.customMethodFees ? settings.customMethodFees[methodId] : undefined;
  const effectiveFeeType = customConfig ? customConfig.feeType : settings.feeType;
  const effectiveFeeAmount = customConfig ? Math.max(0, customConfig.feeAmount) : settings.feeAmount;

  let feeAmount = 0;
  if (effectiveFeeType === 'percentage') {
    feeAmount = Math.round((safeBase * effectiveFeeAmount) / 100);
  } else {
    feeAmount = Math.round(effectiveFeeAmount);
  }

  const grandTotal = safeBase + feeAmount;

  return {
    baseAmount: safeBase,
    feeAmount,
    grandTotal,
    formattedFee: `Rp ${feeAmount.toLocaleString('id-ID')}`,
    formattedGrandTotal: `Rp ${grandTotal.toLocaleString('id-ID')}`,
  };
}

/**
 * Mengambil daftar metode pembayaran yang sedang aktif diatur oleh Admin.
 */
export function getActivePaymentMethods(
  settings: MidtransSettingsConfig = getMidtransSettings()
): MidtransPaymentMethodConfig[] {
  const enabledSet = new Set(settings.enabledMethods || []);
  return OFFICIAL_MIDTRANS_METHODS.filter((m) => enabledSet.has(m.id));
}
