import {
  generateSnapPayload,
  verifyMidtransSignature,
  mapMidtransStatus,
  MidtransNotificationPayload,
  CreateSnapTransactionParams,
  MappedPaymentStatus,
} from '../utils/midtransService.ts';

export interface ApiResponse<T = Record<string, unknown>> {
  status: number;
  body: T;
}

const SANDBOX_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
const PRODUCTION_SNAP_URL = 'https://app.midtrans.com/snap/v1/transactions';

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
