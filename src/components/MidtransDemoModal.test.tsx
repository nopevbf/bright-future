import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MidtransDemoModal } from './MidtransDemoModal';
import { SubmittedRegistration } from '../types';

describe('MidtransDemoModal Component (Direct Core API Checkout)', () => {
  const dummySubmission: SubmittedRegistration = {
    studentId: 'BF-2026-TEST',
    invoiceNumber: 'INV-2026-001',
    studentName: 'Rayhan Kusuma',
    parentName: 'Bunda Ratna',
    level: 'sd',
    whatsapp: '081298765432',
    homeAddress: 'Magelang',
    selectedSchedule: ['Senin 14:00'],
    totalAmount: 350000,
    submittedAt: '2026-10-24T09:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      const body = opts?.body ? JSON.parse(opts.body) : {};
      const method = body.paymentMethod || 'qris';

      if (method === 'qris') {
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            paymentType: 'qris',
            qrCodeUrl: 'https://api.sandbox.midtrans.com/v2/qris/mock-qr/qr-code',
            qrString: '00020101021226...5802ID...',
            expiryTime: '2026-10-24 12:00:00',
          }),
        };
      }

      if (method === 'bca_va') {
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            paymentType: 'bca_va',
            vaNumber: '7001281234567890',
            bank: 'bca',
            expiryTime: '2026-10-25 10:30:00',
          }),
        };
      }

      if (method === 'bri_va') {
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            paymentType: 'bri_va',
            vaNumber: '8578000012345678',
            bank: 'bri',
            expiryTime: '2026-10-25 10:30:00',
          }),
        };
      }

      if (method === 'mandiri_va') {
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            paymentType: 'mandiri_va',
            billerCode: '70012',
            billKey: '990001234567',
            expiryTime: '2026-10-25 10:30:00',
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ status: 'success' }),
      };
    }) as any;
  });

  it('MDT-MODAL-001: should render invoice number and total amount', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/INV-2026-001/i)).toBeInTheDocument();
    expect(screen.getByText(/350\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/Rayhan Kusuma/i)).toBeInTheDocument();
  });

  it('MDT-MODAL-002: should render 4 direct payment options: QRIS, BCA VA, BRI VA, and Mandiri VA', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /qris/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bca va/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bri va/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mandiri va/i })).toBeInTheDocument();
  });

  it('MDT-MODAL-003: switching to BCA VA requests charge and displays real VA number', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const bcaTab = screen.getByRole('button', { name: /bca va/i });
    fireEvent.click(bcaTab);

    await waitFor(() => {
      expect(screen.getByText('7001281234567890')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salin nomor va/i })).toBeInTheDocument();
    });
  });

  it('MDT-MODAL-004: switching to BRI VA requests charge and displays real BRIVA number', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const briTab = screen.getByRole('button', { name: /bri va/i });
    fireEvent.click(briTab);

    await waitFor(() => {
      expect(screen.getByText('8578000012345678')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salin nomor va/i })).toBeInTheDocument();
    });
  });

  it('MDT-MODAL-005: switching to Mandiri VA requests charge and displays biller code 70012 & bill key', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const mandiriTab = screen.getByRole('button', { name: /mandiri va/i });
    fireEvent.click(mandiriTab);

    await waitFor(() => {
      expect(screen.getByText('70012')).toBeInTheDocument();
      expect(screen.getByText('990001234567')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salin bill key/i })).toBeInTheDocument();
    });
  });

  it('MDT-MODAL-006: should NOT render simulator external link or bypass simulation buttons', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText(/Buka Simulator Midtrans Sandbox/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Simulasi Bayar Lunas Sekarang/i)).not.toBeInTheDocument();
  });

  it('MDT-MODAL-007: should render 15-minute countdown timer badge', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/14:|15:00/i)).toBeInTheDocument();
    });
  });

  it('MDT-MODAL-008: clicking Cek Status Pembayaran checks status and transitions to paid state when settlement', async () => {
    // Mock the status endpoint to return settlement
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      if (url.includes('/api/midtrans/status')) {
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            isPaid: true,
            invoiceStatus: 'LUNAS',
            transactionStatus: 'settlement',
          }),
        };
      }
      return originalFetch(url, opts);
    }) as any;

    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const checkBtn = await screen.findByRole('button', { name: /cek status pembayaran/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText(/pembayaran sukses terverifikasi/i)).toBeInTheDocument();
    });
  });
});
