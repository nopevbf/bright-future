import crypto from 'node:crypto';

export interface CustomerDetails {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface ItemDetail {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails?: CustomerDetails;
  itemDetails?: ItemDetail[];
}

export interface SnapTransactionPayload {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  item_details?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_time?: string;
  transaction_id?: string;
  [key: string]: unknown;
}

export interface MappedPaymentStatus {
  invoiceStatus: 'LUNAS' | 'PENDING' | 'TERLAMBAT' | 'TERLAMBAT (H+2)';
  paymentStatus: 'paid' | 'pending' | 'verified';
  isPaid: boolean;
  message: string;
}

export type CorePaymentMethod = 'qris' | 'bca_va' | 'bri_va' | 'mandiri_va';

export interface CreateCoreChargeParams {
  orderId: string;
  grossAmount: number;
  paymentMethod: CorePaymentMethod;
  customerDetails?: CustomerDetails;
  itemDetails?: ItemDetail[];
}

export interface CoreChargeResult {
  status: 'success' | 'error';
  message?: string;
  orderId?: string;
  transactionId?: string;
  paymentType?: CorePaymentMethod;
  qrCodeUrl?: string | null;
  qrString?: string | null;
  vaNumber?: string | null;
  bank?: string | null;
  billerCode?: string | null;
  billKey?: string | null;
  expiryTime?: string | null;
  grossAmount?: number;
  isMock?: boolean;
  [key: string]: unknown;
}

export interface TransactionStatusResult {
  status: 'success' | 'error';
  orderId?: string;
  transactionStatus?: string;
  isPaid: boolean;
  invoiceStatus?: string;
  message: string;
  isMock?: boolean;
  rawResponse?: Record<string, unknown>;
}

/**
 * Constructs the Core API charge payload for direct in-app payments.
 */
export function generateCoreChargePayload(
  params: CreateCoreChargeParams
): Record<string, unknown> {
  if (!params.orderId || params.orderId.trim() === '') {
    throw new Error('Order ID is required');
  }

  if (typeof params.grossAmount !== 'number' || params.grossAmount <= 0) {
    throw new Error('Gross amount must be greater than zero');
  }

  const validMethods: CorePaymentMethod[] = ['qris', 'bca_va', 'bri_va', 'mandiri_va'];
  if (!validMethods.includes(params.paymentMethod)) {
    throw new Error(`Unsupported payment method: ${params.paymentMethod}`);
  }

  const base: Record<string, unknown> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    custom_expiry: {
      expiry_duration: 15,
      unit: 'minute',
    },
  };

  if (params.customerDetails) {
    base.customer_details = {
      first_name: params.customerDetails.firstName,
      ...(params.customerDetails.lastName && { last_name: params.customerDetails.lastName }),
      ...(params.customerDetails.email && { email: params.customerDetails.email }),
      ...(params.customerDetails.phone && { phone: params.customerDetails.phone }),
    };
  }

  if (params.itemDetails && params.itemDetails.length > 0) {
    base.item_details = params.itemDetails.map((item) => ({
      id: item.id,
      name: item.name.slice(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
    }));
  }

  switch (params.paymentMethod) {
    case 'qris':
      return {
        ...base,
        payment_type: 'qris',
        qris: { acquirer: 'gopay' },
      };
    case 'bca_va':
      return {
        ...base,
        payment_type: 'bank_transfer',
        bank_transfer: { bank: 'bca' },
      };
    case 'bri_va':
      return {
        ...base,
        payment_type: 'bank_transfer',
        bank_transfer: { bank: 'bri' },
      };
    case 'mandiri_va':
      return {
        ...base,
        payment_type: 'echannel',
        echannel: {
          bill_info1: 'Pembayaran Bimbel:',
          bill_info2: 'Bright Future SPP',
        },
      };
  }
}

/**
 * Constructs the Snap transaction payload with input validations.
 */
export function generateSnapPayload(
  params: CreateSnapTransactionParams
): SnapTransactionPayload {
  if (!params.orderId || params.orderId.trim() === '') {
    throw new Error('Order ID is required');
  }

  if (typeof params.grossAmount !== 'number' || params.grossAmount <= 0) {
    throw new Error('Gross amount must be greater than zero');
  }

  const payload: SnapTransactionPayload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
  };

  if (params.customerDetails) {
    payload.customer_details = {
      first_name: params.customerDetails.firstName,
      ...(params.customerDetails.lastName && { last_name: params.customerDetails.lastName }),
      ...(params.customerDetails.email && { email: params.customerDetails.email }),
      ...(params.customerDetails.phone && { phone: params.customerDetails.phone }),
    };
  }

  if (params.itemDetails && params.itemDetails.length > 0) {
    payload.item_details = params.itemDetails.map((item) => ({
      id: item.id,
      name: item.name.slice(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
    }));
  }

  return payload;
}

/**
 * Validates the SHA-512 signature from Midtrans webhook notification.
 * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  notification: MidtransNotificationPayload,
  serverKey: string
): boolean {
  if (
    !notification ||
    !notification.order_id ||
    !notification.status_code ||
    !notification.gross_amount ||
    !notification.signature_key ||
    !serverKey
  ) {
    return false;
  }

  const rawString = `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`;
  const computedHash = crypto
    .createHash('sha512')
    .update(rawString)
    .digest('hex')
    .toLowerCase();

  return computedHash === notification.signature_key.toLowerCase();
}

/**
 * Maps Midtrans transaction_status & fraud_status to application domain status.
 */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): MappedPaymentStatus {
  const normStatus = (transactionStatus || '').toLowerCase();
  const normFraud = (fraudStatus || '').toLowerCase();

  if (normStatus === 'capture') {
    if (normFraud === 'challenge') {
      return {
        invoiceStatus: 'PENDING',
        paymentStatus: 'pending',
        isPaid: false,
        message: 'Pembayaran kartu kredit sedang diverifikasi oleh Midtrans (Challenge)',
      };
    }
    return {
      invoiceStatus: 'LUNAS',
      paymentStatus: 'paid',
      isPaid: true,
      message: 'Pembayaran kartu kredit sukses (Capture Accept)',
    };
  }

  if (normStatus === 'settlement') {
    return {
      invoiceStatus: 'LUNAS',
      paymentStatus: 'paid',
      isPaid: true,
      message: 'Pembayaran sukses dan telah diselesaikan (Settlement)',
    };
  }

  if (normStatus === 'pending') {
    return {
      invoiceStatus: 'PENDING',
      paymentStatus: 'pending',
      isPaid: false,
      message: 'Menunggu pembayaran dari pelanggan',
    };
  }

  if (normStatus === 'expire') {
    return {
      invoiceStatus: 'TERLAMBAT',
      paymentStatus: 'pending',
      isPaid: false,
      message: 'Batas waktu pembayaran telah kedaluwarsa (Expired)',
    };
  }

  if (normStatus === 'cancel' || normStatus === 'deny') {
    return {
      invoiceStatus: 'TERLAMBAT',
      paymentStatus: 'pending',
      isPaid: false,
      message: `Transaksi dibatalkan atau ditolak (${normStatus})`,
    };
  }

  return {
    invoiceStatus: 'PENDING',
    paymentStatus: 'pending',
    isPaid: false,
    message: `Status transaksi belum diketahui: ${transactionStatus}`,
  };
}
