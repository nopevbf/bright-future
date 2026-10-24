import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import {
  handleWebhookRequest,
  handleSnapTokenRequest,
} from './midtransApiHandlers';

describe('midtransApiHandlers', () => {
  const dummyServerKey = 'SB-Mid-server-TESTKEY123';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleWebhookRequest', () => {
    it('MDT-WH-001: should return 400 if body is empty or invalid', async () => {
      const result = await handleWebhookRequest(null, dummyServerKey);
      expect(result.status).toBe(400);
      expect(result.body.status).toBe('error');
    });

    it('MDT-WH-002: should return 403 if signature is invalid', async () => {
      const invalidNotification = {
        order_id: 'INV-TEST-001',
        status_code: '200',
        gross_amount: '500000.00',
        signature_key: 'invalid_sha512_hash',
        transaction_status: 'settlement',
      };

      const result = await handleWebhookRequest(invalidNotification, dummyServerKey);
      expect(result.status).toBe(403);
      expect(result.body.message).toMatch(/invalid signature/i);
    });

    it('MDT-WH-003: should return 200 and mapped status when signature is valid', async () => {
      const orderId = 'INV-TEST-002';
      const statusCode = '200';
      const grossAmount = '450000.00';
      const validSignature = crypto
        .createHash('sha512')
        .update(`${orderId}${statusCode}${grossAmount}${dummyServerKey}`)
        .digest('hex');

      const validNotification = {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: validSignature,
        transaction_status: 'settlement',
        payment_type: 'qris',
      };

      const mockDbUpdate = vi.fn().mockResolvedValue(true);
      const result = await handleWebhookRequest(
        validNotification,
        dummyServerKey,
        mockDbUpdate
      );

      expect(result.status).toBe(200);
      expect(result.body.status).toBe('success');
      expect(result.body.orderId).toBe(orderId);
      expect(result.body.invoiceStatus).toBe('LUNAS');
      expect(mockDbUpdate).toHaveBeenCalledWith(
        orderId,
        expect.objectContaining({
          invoiceStatus: 'LUNAS',
          paymentStatus: 'paid',
          isPaid: true,
        })
      );
    });
  });

  describe('handleSnapTokenRequest', () => {
    it('MDT-TOKEN-001: should return 400 when orderId or grossAmount is invalid', async () => {
      const result = await handleSnapTokenRequest(
        { orderId: '', grossAmount: 0 },
        dummyServerKey
      );
      expect(result.status).toBe(400);
      expect(result.body.status).toBe('error');
    });

    it('MDT-TOKEN-002: should call Midtrans Sandbox API with Basic Auth and return token', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          token: 'sandbox-snap-token-abc123xyz',
          redirect_url: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/abc123xyz',
        }),
      });

      const params = {
        orderId: 'INV-2026-99',
        grossAmount: 350000,
        customerDetails: {
          firstName: 'Rayhan Kusuma',
        },
      };

      const result = await handleSnapTokenRequest(
        params,
        dummyServerKey,
        false, // isProduction = false
        mockFetch as unknown as typeof fetch
      );

      expect(result.status).toBe(200);
      expect(result.body.token).toBe('sandbox-snap-token-abc123xyz');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.sandbox.midtrans.com/snap/v1/transactions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from(`${dummyServerKey}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('MDT-TOKEN-003: should return mock token if serverKey is missing/placeholder', async () => {
      const params = {
        orderId: 'INV-DEMO-01',
        grossAmount: 200000,
      };

      const result = await handleSnapTokenRequest(params, '');
      expect(result.status).toBe(200);
      expect(result.body.isMock).toBe(true);
      expect(result.body.token).toMatch(/^MOCK-SNAP-TOKEN-/);
    });
  });
});
