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
    sessionStorage.clear();
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

  it('MDT-MODAL-001: should render invoice number and total amount without auto-fetching charge', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/INV-2026-001/i)).toBeInTheDocument();
    expect(screen.getByText(/350\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/Rayhan Kusuma/i)).toBeInTheDocument();
    // Verification: No automatic fetch call on initial render
    expect(global.fetch).not.toHaveBeenCalled();
    // Reveal button should be displayed
    expect(screen.getByRole('button', { name: /perlihatkan|tampilkan kode qris/i })).toBeInTheDocument();
  });

  it('MDT-MODAL-002: should render 4 direct payment options: QRIS, BCA VA, BRI VA, and Mandiri VA', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /^qris\b/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^bca va\b/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^bri va\b/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^mandiri va\b/i })).toBeInTheDocument();
  });

  it('MDT-MODAL-003: revealing QRIS requests charge and displays QR code', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const revealBtn = screen.getByRole('button', { name: /perlihatkan|tampilkan kode qris/i });
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const img = screen.getByAltText(/qris midtrans/i);
      expect(img).toBeInTheDocument();
    });
  });

  it('MDT-MODAL-004: switching to BCA VA does not auto-fetch until reveal button is clicked', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const bcaTab = screen.getByRole('button', { name: /bca va/i });
    fireEvent.click(bcaTab);

    // Should NOT have fetched bca_va yet
    expect(global.fetch).not.toHaveBeenCalled();

    const revealBtn = screen.getByRole('button', { name: /perlihatkan|tampilkan.*bca/i });
    expect(revealBtn).toBeInTheDocument();
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(screen.getByText('7001281234567890')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salin nomor va/i })).toBeInTheDocument();
    });
  });

  it('MDT-MODAL-005: switching to BRI VA and clicking reveal displays real BRIVA number', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const briTab = screen.getByRole('button', { name: /bri va/i });
    fireEvent.click(briTab);

    expect(global.fetch).not.toHaveBeenCalled();

    const revealBtn = screen.getByRole('button', { name: /perlihatkan|tampilkan.*bri/i });
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(screen.getByText('8578000012345678')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salin nomor va/i })).toBeInTheDocument();
    });
  });

  it('MDT-MODAL-006: switching to Mandiri VA and clicking reveal displays biller code 70012 & bill key', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const mandiriTab = screen.getByRole('button', { name: /mandiri va/i });
    fireEvent.click(mandiriTab);

    expect(global.fetch).not.toHaveBeenCalled();

    const revealBtn = screen.getByRole('button', { name: /perlihatkan|tampilkan.*mandiri/i });
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(screen.getByText('70012')).toBeInTheDocument();
      expect(screen.getByText('990001234567')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salin bill key/i })).toBeInTheDocument();
    });
  });

  it('MDT-MODAL-007: caching reuses previous charge when switching back and forth', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    // 1. Reveal QRIS
    fireEvent.click(screen.getByRole('button', { name: /perlihatkan|tampilkan kode qris/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // 2. Switch to BCA VA and reveal
    fireEvent.click(screen.getByRole('button', { name: /bca va/i }));
    fireEvent.click(screen.getByRole('button', { name: /perlihatkan|tampilkan.*bca/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText('7001281234567890')).toBeInTheDocument();
    });

    // 3. Switch back to QRIS -> Should show immediately from cache without 3rd fetch
    fireEvent.click(screen.getByRole('button', { name: /qris/i }));
    expect(screen.getByAltText(/qris midtrans/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('MDT-MODAL-008: should NOT render simulator external link or bypass simulation buttons', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText(/Buka Simulator Midtrans Sandbox/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Simulasi Bayar Lunas Sekarang/i)).not.toBeInTheDocument();
  });

  it('MDT-MODAL-009: countdown timer badge is only active after payment code is revealed', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    // Before revealing: Shows "Menunggu Konfirmasi" / "Siap Ditampilkan" instead of active countdown
    expect(screen.getByText(/siap ditampilkan|menunggu/i)).toBeInTheDocument();

    // After revealing:
    fireEvent.click(screen.getByRole('button', { name: /perlihatkan|tampilkan kode qris/i }));
    await waitFor(() => {
      expect(screen.getByText(/sisa waktu:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/14:|15:00/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('MDT-MODAL-010: clicking Cek Status Pembayaran checks status and transitions to paid state when settlement', async () => {
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

  it('MDT-GUARD-001: rapid double-click on reveal button triggers fetch only once (in-flight guard)', async () => {
    let resolveFirstFetch: (value: any) => void;
    const delayedPromise = new Promise((resolve) => {
      resolveFirstFetch = resolve;
    });

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/midtrans/charge')) {
        await delayedPromise;
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            paymentType: 'qris',
            qrCodeUrl: 'https://api.sandbox.midtrans.com/v2/qris/mock-qr/qr-code',
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    }) as any;

    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const revealBtn = screen.getByRole('button', { name: /perlihatkan|tampilkan kode qris/i });
    // Simulate rapid double click
    fireEvent.click(revealBtn);
    fireEvent.click(revealBtn);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Resolve the in-flight request
    resolveFirstFetch!({ ok: true });
    await waitFor(() => {
      expect(screen.getByAltText(/qris midtrans/i)).toBeInTheDocument();
    });
  });

  it('MDT-GUARD-002: when check payment status returns expire, it does NOT auto-charge to Midtrans', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/midtrans/status')) {
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            isPaid: false,
            invoiceStatus: 'TERLAMBAT',
            transactionStatus: 'expire',
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ status: 'success' }),
      };
    }) as any;

    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const checkBtn = screen.getByRole('button', { name: /cek status pembayaran/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText(/kedaluwarsa/i)).toBeInTheDocument();
    });

    // Verify charge endpoint was never called
    const chargeCalls = (global.fetch as any).mock.calls.filter((call: any[]) =>
      call[0].includes('/api/midtrans/charge')
    );
    expect(chargeCalls.length).toBe(0);
  });

  it('MDT-PERSIST-001: should restore active charge, continue countdown timer, and avoid refetching when modal is closed and reopened', async () => {
    sessionStorage.clear();
    const { unmount } = render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    // 1. Reveal QRIS
    fireEvent.click(screen.getByRole('button', { name: /perlihatkan|tampilkan kode qris/i }));
    await waitFor(() => {
      expect(screen.getByAltText(/qris midtrans/i)).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // 2. Close modal (unmount)
    unmount();

    // 3. Reopen modal
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    // QRIS must be immediately visible without clicking reveal
    expect(screen.getByAltText(/qris midtrans/i)).toBeInTheDocument();
    // No additional fetch should occur
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Active countdown badge is present (not "Siap Ditampilkan")
    expect(screen.getByText(/sisa waktu:/i)).toBeInTheDocument();
  });

  it('MDT-PERSIST-002: should restore as expired state if reopened after 15 minutes have passed', async () => {
    sessionStorage.clear();
    const expiredRecord = {
      qris: {
        data: {
          status: 'success',
          paymentType: 'qris',
          qrCodeUrl: 'https://api.sandbox.midtrans.com/v2/qris/mock-qr/qr-code',
        },
        expiresAt: Date.now() - 5000, // 5 seconds in the past
        isExpired: true,
      },
    };
    sessionStorage.setItem('bf_midtrans_cache_INV-2026-001', JSON.stringify(expiredRecord));

    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    // Directly shows expired notice
    expect(screen.getByText(/kode pembayaran kedaluwarsa/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buat kode pembayaran baru/i })).toBeInTheDocument();
    // No automatic fetch call on mount
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
