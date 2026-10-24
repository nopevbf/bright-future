import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTransactionStatusRequest } from './midtransApiHandlers';

describe('Midtrans Transaction Status Handler (ISTQB Grounded & TDD)', () => {
  const dummyServerKey = 'SB-Mid-server-TESTKEY123';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TC-MDT-STS-001: should return 400 Bad Request if orderId is missing or empty', async () => {
    const res1 = await handleTransactionStatusRequest('', dummyServerKey);
    expect(res1.status).toBe(400);
    expect(res1.body.status).toBe('error');

    const res2 = await handleTransactionStatusRequest(null as any, dummyServerKey);
    expect(res2.status).toBe(400);
  });

  it('TC-MDT-STS-002: should check status and return isPaid: true when transaction is settlement', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status_code: '200',
        status_message: 'Success, transaction found',
        transaction_id: 'tx-12345',
        order_id: 'INV-2026-001_bca_123',
        gross_amount: '350000.00',
        payment_type: 'bank_transfer',
        transaction_status: 'settlement',
        fraud_status: 'accept',
      }),
    });

    const mockDbUpdate = vi.fn().mockResolvedValue(true);

    const result = await handleTransactionStatusRequest(
      'INV-2026-001_bca_123',
      dummyServerKey,
      false,
      mockDbUpdate,
      mockFetch as unknown as typeof fetch
    );

    expect(result.status).toBe(200);
    expect(result.body.status).toBe('success');
    expect(result.body.isPaid).toBe(true);
    expect(result.body.invoiceStatus).toBe('LUNAS');
    expect(result.body.transactionStatus).toBe('settlement');
    expect(mockDbUpdate).toHaveBeenCalledWith(
      'INV-2026-001_bca_123',
      expect.objectContaining({ isPaid: true, invoiceStatus: 'LUNAS' })
    );
  });

  it('TC-MDT-STS-003: should return isPaid: false when transaction is pending', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status_code: '200',
        status_message: 'Success, transaction found',
        transaction_id: 'tx-12345',
        order_id: 'INV-2026-001_bca_123',
        gross_amount: '350000.00',
        payment_type: 'bank_transfer',
        transaction_status: 'pending',
      }),
    });

    const mockDbUpdate = vi.fn();

    const result = await handleTransactionStatusRequest(
      'INV-2026-001_bca_123',
      dummyServerKey,
      false,
      mockDbUpdate,
      mockFetch as unknown as typeof fetch
    );

    expect(result.status).toBe(200);
    expect(result.body.status).toBe('success');
    expect(result.body.isPaid).toBe(false);
    expect(result.body.invoiceStatus).toBe('PENDING');
    expect(result.body.transactionStatus).toBe('pending');
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it('TC-MDT-STS-004: should fallback gracefully to mock status when server key is not set', async () => {
    const result = await handleTransactionStatusRequest('INV-2026-001', '');

    expect(result.status).toBe(200);
    expect(result.body.status).toBe('success');
    expect(result.body.isMock).toBe(true);
  });
});
