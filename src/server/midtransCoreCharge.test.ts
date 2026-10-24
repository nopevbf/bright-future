import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCoreChargeRequest } from './midtransApiHandlers';

describe('Midtrans Core API Direct Charge Handler (ISTQB Grounded & TDD)', () => {
  const dummyServerKey = 'SB-Mid-server-TESTKEY123';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TC-MDT-CORE-001: should return 400 Bad Request if parameters are invalid', async () => {
    const res1 = await handleCoreChargeRequest(null, dummyServerKey);
    expect(res1.status).toBe(400);
    expect(res1.body.status).toBe('error');

    const res2 = await handleCoreChargeRequest(
      { orderId: '', grossAmount: 100000, paymentMethod: 'qris' },
      dummyServerKey
    );
    expect(res2.status).toBe(400);

    const res3 = await handleCoreChargeRequest(
      { orderId: 'INV-001', grossAmount: 0, paymentMethod: 'qris' },
      dummyServerKey
    );
    expect(res3.status).toBe(400);

    const res4 = await handleCoreChargeRequest(
      { orderId: 'INV-001', grossAmount: 100000, paymentMethod: 'unsupported_method' },
      dummyServerKey
    );
    expect(res4.status).toBe(400);
  });

  it('TC-MDT-CORE-002: should charge QRIS and return QR Code action URL & qr_string', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status_code: '201',
        status_message: 'Success, QRIS transaction is created',
        transaction_id: 'tx-qris-123',
        order_id: 'INV-BF-001_qris_1',
        gross_amount: '350000.00',
        payment_type: 'qris',
        actions: [
          {
            name: 'generate-qr-code',
            method: 'GET',
            url: 'https://api.sandbox.midtrans.com/v2/qris/tx-qris-123/qr-code',
          },
        ],
        qr_string: '00020101021226...5802ID...',
        expiry_time: '2026-10-24 11:30:00',
      }),
    });

    const result = await handleCoreChargeRequest(
      {
        orderId: 'INV-BF-001',
        grossAmount: 350000,
        paymentMethod: 'qris',
        customerDetails: { firstName: 'Budi', phone: '081234567890' },
      },
      dummyServerKey,
      false,
      mockFetch as unknown as typeof fetch
    );

    expect(result.status).toBe(200);
    expect(result.body.status).toBe('success');
    expect(result.body.paymentType).toBe('qris');
    expect(result.body.qrCodeUrl).toBe('https://api.sandbox.midtrans.com/v2/qris/tx-qris-123/qr-code');
    expect(result.body.qrString).toBe('00020101021226...5802ID...');
    expect(result.body.expiryTime).toBe('2026-10-24 11:30:00');
  });

  it('TC-MDT-CORE-003: should charge BCA Virtual Account and return VA number', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status_code: '201',
        status_message: 'Success, Bank Transfer transaction is created',
        transaction_id: 'tx-bca-456',
        order_id: 'INV-BF-001_bca_1',
        gross_amount: '350000.00',
        payment_type: 'bank_transfer',
        va_numbers: [
          {
            bank: 'bca',
            va_number: '70012999123456',
          },
        ],
        expiry_time: '2026-10-25 10:30:00',
      }),
    });

    const result = await handleCoreChargeRequest(
      {
        orderId: 'INV-BF-001',
        grossAmount: 350000,
        paymentMethod: 'bca_va',
      },
      dummyServerKey,
      false,
      mockFetch as unknown as typeof fetch
    );

    expect(result.status).toBe(200);
    expect(result.body.status).toBe('success');
    expect(result.body.paymentType).toBe('bca_va');
    expect(result.body.vaNumber).toBe('70012999123456');
    expect(result.body.bank).toBe('bca');
  });

  it('TC-MDT-CORE-004: should charge BRI Virtual Account and return BRIVA number', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status_code: '201',
        status_message: 'Success, Bank Transfer transaction is created',
        transaction_id: 'tx-bri-789',
        order_id: 'INV-BF-001_bri_1',
        gross_amount: '350000.00',
        payment_type: 'bank_transfer',
        va_numbers: [
          {
            bank: 'bri',
            va_number: '8578000012345678',
          },
        ],
        expiry_time: '2026-10-25 10:30:00',
      }),
    });

    const result = await handleCoreChargeRequest(
      {
        orderId: 'INV-BF-001',
        grossAmount: 350000,
        paymentMethod: 'bri_va',
      },
      dummyServerKey,
      false,
      mockFetch as unknown as typeof fetch
    );

    expect(result.status).toBe(200);
    expect(result.body.status).toBe('success');
    expect(result.body.paymentType).toBe('bri_va');
    expect(result.body.vaNumber).toBe('8578000012345678');
    expect(result.body.bank).toBe('bri');
  });

  it('TC-MDT-CORE-005: should charge Mandiri Bill Payment and return biller_code & bill_key', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status_code: '201',
        status_message: 'Success, Mandiri Bill transaction is created',
        transaction_id: 'tx-mandiri-999',
        order_id: 'INV-BF-001_mandiri_1',
        gross_amount: '350000.00',
        payment_type: 'echannel',
        biller_code: '70012',
        bill_key: '990001234567',
        expiry_time: '2026-10-25 10:30:00',
      }),
    });

    const result = await handleCoreChargeRequest(
      {
        orderId: 'INV-BF-001',
        grossAmount: 350000,
        paymentMethod: 'mandiri_va',
      },
      dummyServerKey,
      false,
      mockFetch as unknown as typeof fetch
    );

    expect(result.status).toBe(200);
    expect(result.body.status).toBe('success');
    expect(result.body.paymentType).toBe('mandiri_va');
    expect(result.body.billerCode).toBe('70012');
    expect(result.body.billKey).toBe('990001234567');
  });

  it('TC-MDT-CORE-006: should fallback gracefully to simulated sandbox mode if server key is missing', async () => {
    const result = await handleCoreChargeRequest(
      {
        orderId: 'INV-BF-001',
        grossAmount: 350000,
        paymentMethod: 'bca_va',
      },
      '' // No server key
    );

    expect(result.status).toBe(200);
    expect(result.body.isMock).toBe(true);
    expect(result.body.status).toBe('success');
    expect(result.body.vaNumber).toBeTruthy();
  });

  it('TC-MDT-CORE-007: should include custom_expiry of 15 minutes in Core API charge payload', async () => {
    let capturedBody: any = null;
    const mockFetch = vi.fn().mockImplementation(async (_url: string, opts: any) => {
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status_code: '201',
          status_message: 'Success',
          order_id: 'INV-BF-001_qris_1',
          payment_type: 'qris',
        }),
      };
    });

    await handleCoreChargeRequest(
      {
        orderId: 'INV-BF-001',
        grossAmount: 350000,
        paymentMethod: 'qris',
      },
      dummyServerKey,
      false,
      mockFetch as unknown as typeof fetch
    );

    expect(capturedBody).toBeTruthy();
    expect(capturedBody.custom_expiry).toEqual({
      expiry_duration: 15,
      unit: 'minute',
    });
  });
});
