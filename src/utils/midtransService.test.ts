import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  generateSnapPayload,
  verifyMidtransSignature,
  mapMidtransStatus,
  MidtransNotificationPayload,
  CreateSnapTransactionParams,
} from './midtransService';

describe('midtransService', () => {
  const dummyServerKey = 'SB-Mid-server-TEST123456';

  describe('generateSnapPayload', () => {
    it('MDT-UNIT-001: should generate valid Midtrans Snap payload for registration invoice', () => {
      const params: CreateSnapTransactionParams = {
        orderId: 'INV-2026-TEST01',
        grossAmount: 350000,
        customerDetails: {
          firstName: 'Rayhan Kusuma',
          email: 'rayhan@example.com',
          phone: '081298765432',
        },
        itemDetails: [
          {
            id: 'SPP-SD',
            name: 'SPP Bimbel SD - Bright Future',
            price: 350000,
            quantity: 1,
          },
        ],
      };

      const payload = generateSnapPayload(params);

      expect(payload.transaction_details.order_id).toBe('INV-2026-TEST01');
      expect(payload.transaction_details.gross_amount).toBe(350000);
      expect(payload.customer_details?.first_name).toBe('Rayhan Kusuma');
      expect(payload.customer_details?.phone).toBe('081298765432');
      expect(payload.item_details).toHaveLength(1);
      expect(payload.item_details?.[0].price).toBe(350000);
    });

    it('MDT-UNIT-002: should throw error when gross amount is zero or negative', () => {
      expect(() => {
        generateSnapPayload({
          orderId: 'INV-ZERO',
          grossAmount: 0,
        });
      }).toThrowError(/gross amount must be greater than zero/i);

      expect(() => {
        generateSnapPayload({
          orderId: 'INV-NEG',
          grossAmount: -50000,
        });
      }).toThrowError(/gross amount must be greater than zero/i);
    });

    it('MDT-UNIT-003: should throw error when orderId is empty', () => {
      expect(() => {
        generateSnapPayload({
          orderId: '',
          grossAmount: 100000,
        });
      }).toThrowError(/order id is required/i);
    });
  });

  describe('verifyMidtransSignature', () => {
    it('MDT-SEC-001: should return true for valid SHA-512 signature', () => {
      const orderId = 'INV-2026-001';
      const statusCode = '200';
      const grossAmount = '350000.00';
      const expectedSignature = crypto
        .createHash('sha512')
        .update(`${orderId}${statusCode}${grossAmount}${dummyServerKey}`)
        .digest('hex');

      const payload: MidtransNotificationPayload = {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: expectedSignature,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'qris',
        transaction_time: '2026-10-24 09:00:00',
        transaction_id: 'tx-12345',
      };

      const result = verifyMidtransSignature(payload, dummyServerKey);
      expect(result).toBe(true);
    });

    it('MDT-SEC-002: should return false for tampered signature or mismatched server key', () => {
      const payload: MidtransNotificationPayload = {
        order_id: 'INV-2026-001',
        status_code: '200',
        gross_amount: '350000.00',
        signature_key: 'invalid_tampered_hash_value',
        transaction_status: 'settlement',
      };

      const result = verifyMidtransSignature(payload, dummyServerKey);
      expect(result).toBe(false);
    });

    it('MDT-SEC-003: should return false when payload is missing required signature fields', () => {
      const payload = {
        order_id: 'INV-2026-001',
      } as unknown as MidtransNotificationPayload;

      const result = verifyMidtransSignature(payload, dummyServerKey);
      expect(result).toBe(false);
    });
  });

  describe('mapMidtransStatus', () => {
    it('MDT-MAP-001: should map settlement to LUNAS', () => {
      const status = mapMidtransStatus('settlement', 'accept');
      expect(status.invoiceStatus).toBe('LUNAS');
      expect(status.paymentStatus).toBe('paid');
      expect(status.isPaid).toBe(true);
    });

    it('MDT-MAP-002: should map capture with accept fraud status to LUNAS', () => {
      const status = mapMidtransStatus('capture', 'accept');
      expect(status.invoiceStatus).toBe('LUNAS');
      expect(status.isPaid).toBe(true);
    });

    it('MDT-MAP-003: should map capture with challenge fraud status to PENDING', () => {
      const status = mapMidtransStatus('capture', 'challenge');
      expect(status.invoiceStatus).toBe('PENDING');
      expect(status.isPaid).toBe(false);
    });

    it('MDT-MAP-004: should map pending to PENDING', () => {
      const status = mapMidtransStatus('pending');
      expect(status.invoiceStatus).toBe('PENDING');
      expect(status.paymentStatus).toBe('pending');
      expect(status.isPaid).toBe(false);
    });

    it('MDT-MAP-005: should map expire, cancel, deny to DIBATALKAN / GAGAL', () => {
      expect(mapMidtransStatus('expire').invoiceStatus).toBe('TERLAMBAT');
      expect(mapMidtransStatus('expire').isPaid).toBe(false);

      expect(mapMidtransStatus('cancel').isPaid).toBe(false);
      expect(mapMidtransStatus('deny').isPaid).toBe(false);
    });
  });
});
