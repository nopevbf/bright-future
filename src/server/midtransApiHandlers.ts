import {
  generateSnapPayload,
  generateCoreChargePayload,
  verifyMidtransSignature,
  mapMidtransStatus,
  MidtransNotificationPayload,
  CreateSnapTransactionParams,
  CreateCoreChargeParams,
  CoreChargeResult,
  TransactionStatusResult,
  MappedPaymentStatus,
} from '../utils/midtransService.ts';

export interface ApiResponse<T = Record<string, unknown>> {
  status: number;
  body: T;
}

const SANDBOX_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
const PRODUCTION_SNAP_URL = 'https://app.midtrans.com/snap/v1/transactions';
const SANDBOX_CHARGE_URL = 'https://api.sandbox.midtrans.com/v2/charge';
const PRODUCTION_CHARGE_URL = 'https://api.midtrans.com/v2/charge';
const SANDBOX_BASE_URL = 'https://api.sandbox.midtrans.com/v2';
const PRODUCTION_BASE_URL = 'https://api.midtrans.com/v2';

/**
 * Handles incoming Midtrans Webhook Notification.
 * Verifies SHA-512 signature, maps status, and triggers database update.
 */
export async function handleWebhookRequest(
  body: unknown,
  serverKey: string,
  onDatabaseUpdate?: (orderId: string, status: MappedPaymentStatus) => Promise<unknown>
): Promise<ApiResponse<{ status: string; message: string; orderId?: string; invoiceStatus?: string }>> {
  if (!body || typeof body !== 'object') {
    return {
      status: 400,
      body: { status: 'error', message: 'Invalid or empty notification payload' },
    };
  }

  const notification = body as MidtransNotificationPayload;

  if (!serverKey) {
    return {
      status: 500,
      body: { status: 'error', message: 'MIDTRANS_SERVER_KEY is not configured on server' },
    };
  }

  const isValidSignature = verifyMidtransSignature(notification, serverKey);
  if (!isValidSignature) {
    return {
      status: 403,
      body: { status: 'error', message: 'Invalid signature key' },
    };
  }

  const mappedStatus = mapMidtransStatus(
    notification.transaction_status,
    notification.fraud_status
  );

  if (onDatabaseUpdate) {
    try {
      await onDatabaseUpdate(notification.order_id, mappedStatus);
    } catch (err) {
      console.error('[Midtrans Webhook] Error updating database:', err);
    }
  }

  return {
    status: 200,
    body: {
      status: 'success',
      message: 'Notification processed successfully',
      orderId: notification.order_id,
      invoiceStatus: mappedStatus.invoiceStatus,
    },
  };
}

/**
 * Handles creating a Snap transaction token for an invoice or registration.
 */
export async function handleSnapTokenRequest(
  params: unknown,
  serverKey: string,
  isProduction = false,
  fetchFn: typeof fetch = fetch
): Promise<ApiResponse<{ status?: string; message?: string; token?: string; redirect_url?: string; isMock?: boolean }>> {
  const transactionParams = params as CreateSnapTransactionParams;

  if (
    !transactionParams ||
    !transactionParams.orderId ||
    !transactionParams.grossAmount ||
    transactionParams.grossAmount <= 0
  ) {
    return {
      status: 400,
      body: {
        status: 'error',
        message: 'Valid orderId and grossAmount (> 0) are required',
      },
    };
  }

  // Graceful fallback if server key is not provided (demo/testing mode)
  if (!serverKey || serverKey.trim() === '' || serverKey.startsWith('MY_')) {
    return {
      status: 200,
      body: {
        status: 'success',
        isMock: true,
        token: `MOCK-SNAP-TOKEN-${Date.now()}`,
        redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-${transactionParams.orderId}`,
        message: 'Running in simulated sandbox mode (Server key not set)',
      },
    };
  }

  try {
    const payload = generateSnapPayload(transactionParams);
    const snapUrl = isProduction ? PRODUCTION_SNAP_URL : SANDBOX_SNAP_URL;
    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

    const response = await fetchFn(snapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        body: {
          status: 'error',
          message: data.error_messages ? data.error_messages.join(', ') : 'Midtrans API error',
          ...data,
        },
      };
    }

    return {
      status: 200,
      body: {
        status: 'success',
        token: data.token,
        redirect_url: data.redirect_url,
      },
    };
  } catch (error) {
    console.error('[Midtrans Token] Error requesting Snap token:', error);
    return {
      status: 500,
      body: {
        status: 'error',
        message: error instanceof Error ? error.message : 'Internal server error while creating snap token',
      },
    };
  }
}

/**
 * Handles direct charge via Midtrans Core API (QRIS, BCA VA, BRI VA, Mandiri Bill).
 * Returns real QR Code image/string or Virtual Account numbers directly to the client.
 */
export async function handleCoreChargeRequest(
  params: unknown,
  serverKey: string,
  isProduction = false,
  fetchFn: typeof fetch = fetch
): Promise<ApiResponse<CoreChargeResult>> {
  const chargeParams = params as CreateCoreChargeParams;

  const validMethods = ['qris', 'bca_va', 'bri_va', 'mandiri_va'];
  if (
    !chargeParams ||
    !chargeParams.orderId ||
    !chargeParams.grossAmount ||
    chargeParams.grossAmount <= 0 ||
    !validMethods.includes(chargeParams.paymentMethod)
  ) {
    return {
      status: 400,
      body: {
        status: 'error',
        message: 'Valid orderId, grossAmount (> 0), and paymentMethod (qris, bca_va, bri_va, mandiri_va) are required',
      },
    };
  }

  // Graceful fallback for mock/demo testing when server key is not configured
  if (!serverKey || serverKey.trim() === '' || serverKey.startsWith('MY_')) {
    const isQris = chargeParams.paymentMethod === 'qris';
    const isBca = chargeParams.paymentMethod === 'bca_va';
    const isBri = chargeParams.paymentMethod === 'bri_va';
    const isMandiri = chargeParams.paymentMethod === 'mandiri_va';

    return {
      status: 200,
      body: {
        status: 'success',
        isMock: true,
        orderId: chargeParams.orderId,
        paymentType: chargeParams.paymentMethod,
        qrCodeUrl: isQris ? 'https://api.sandbox.midtrans.com/v2/qris/mock-tx-qris/qr-code' : null,
        qrString: isQris ? '00020101021226540014ID.LINKAJA.WWW01189360091800000000000208123456785204549953033605802ID' : null,
        vaNumber: isBca ? '7001281234567890' : isBri ? '8578000012345678' : null,
        bank: isBca ? 'bca' : isBri ? 'bri' : null,
        billerCode: isMandiri ? '70012' : null,
        billKey: isMandiri ? '990001234567' : null,
        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        grossAmount: chargeParams.grossAmount,
        message: 'Running in simulated sandbox mode (Server key not set)',
      },
    };
  }

  try {
    const chargeUrl = isProduction ? PRODUCTION_CHARGE_URL : SANDBOX_CHARGE_URL;
    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

    // Ensure orderId is uniquely keyed per payment attempt to avoid Midtrans 406 duplication error
    const effectiveOrderId = chargeParams.orderId.includes('_')
      ? chargeParams.orderId
      : `${chargeParams.orderId}_${chargeParams.paymentMethod}_${Date.now()}`;

    const payload = generateCoreChargePayload({
      ...chargeParams,
      orderId: effectiveOrderId,
    });

    const response = await fetchFn(chargeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        body: {
          status: 'error',
          message: data.status_message || (data.error_messages ? data.error_messages.join(', ') : 'Midtrans Charge error'),
          ...data,
        },
      };
    }

    const qrAction = data.actions?.find((a: any) => a.name === 'generate-qr-code');
    const vaEntry = data.va_numbers?.[0];

    return {
      status: 200,
      body: {
        status: 'success',
        orderId: data.order_id || effectiveOrderId,
        transactionId: data.transaction_id,
        paymentType: chargeParams.paymentMethod,
        qrCodeUrl: qrAction ? qrAction.url : null,
        qrString: data.qr_string || null,
        vaNumber: vaEntry ? vaEntry.va_number : (data.permata_va_number || null),
        bank: vaEntry ? vaEntry.bank : (chargeParams.paymentMethod === 'bca_va' ? 'bca' : chargeParams.paymentMethod === 'bri_va' ? 'bri' : null),
        billerCode: data.biller_code || null,
        billKey: data.bill_key || null,
        expiryTime: data.expiry_time || null,
        grossAmount: data.gross_amount ? Number(data.gross_amount) : chargeParams.grossAmount,
        rawResponse: data,
      },
    };
  } catch (error) {
    console.error('[Midtrans Charge] Error executing direct Core API charge:', error);
    return {
      status: 500,
      body: {
        status: 'error',
        message: error instanceof Error ? error.message : 'Internal server error while executing charge',
      },
    };
  }
}

/**
 * Handles checking transaction status directly from Midtrans API (/v2/{order_id}/status).
 * If transaction is completed (settlement/capture), optionally updates Firestore.
 */
export async function handleTransactionStatusRequest(
  orderId: string,
  serverKey: string,
  isProduction = false,
  onDatabaseUpdate?: (orderId: string, status: MappedPaymentStatus) => Promise<unknown>,
  fetchFn: typeof fetch = fetch
): Promise<ApiResponse<TransactionStatusResult>> {
  if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
    return {
      status: 400,
      body: {
        status: 'error',
        isPaid: false,
        message: 'Order ID is required',
      },
    };
  }

  // Graceful fallback for mock/demo testing when server key is not configured
  if (!serverKey || serverKey.trim() === '' || serverKey.startsWith('MY_')) {
    return {
      status: 200,
      body: {
        status: 'success',
        isMock: true,
        orderId,
        transactionStatus: 'pending',
        isPaid: false,
        invoiceStatus: 'PENDING',
        message: 'Running in simulated sandbox mode (Server key not set)',
      },
    };
  }

  try {
    const baseUrl = isProduction ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
    const statusUrl = `${baseUrl}/${encodeURIComponent(orderId)}/status`;
    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

    const response = await fetchFn(statusUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        body: {
          status: 'error',
          orderId,
          isPaid: false,
          message: data.status_message || 'Gagal memeriksa status transaksi dari Midtrans',
          rawResponse: data,
        },
      };
    }

    const mapped = mapMidtransStatus(data.transaction_status, data.fraud_status);

    if (mapped.isPaid && onDatabaseUpdate) {
      try {
        await onDatabaseUpdate(orderId, mapped);
      } catch (dbErr) {
        console.error('[Midtrans Status] Error updating database:', dbErr);
      }
    }

    return {
      status: 200,
      body: {
        status: 'success',
        orderId: data.order_id || orderId,
        transactionStatus: data.transaction_status,
        isPaid: mapped.isPaid,
        invoiceStatus: mapped.invoiceStatus,
        message: mapped.message,
        rawResponse: data,
      },
    };
  } catch (error) {
    console.error('[Midtrans Status] Error checking transaction status:', error);
    return {
      status: 500,
      body: {
        status: 'error',
        orderId,
        isPaid: false,
        message: error instanceof Error ? error.message : 'Internal server error while checking status',
      },
    };
  }
}
