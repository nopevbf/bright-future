import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { ParentDashboard } from './ParentDashboard';
import { FirestoreInvoiceDoc } from '../firebase';

// Mock firebase functions
const mockUnsubscribeInvoices = vi.fn();
let invoiceListenerCallback: ((invoices: FirestoreInvoiceDoc[]) => void) | null = null;

vi.mock('../firebase', async () => {
  const actual = await vi.importActual('../firebase');
  return {
    ...actual,
    subscribeToInvoices: vi.fn((onUpdate: (invoices: FirestoreInvoiceDoc[]) => void) => {
      invoiceListenerCallback = onUpdate;
      return mockUnsubscribeInvoices;
    }),
    updateInvoiceStatusInFirestore: vi.fn().mockResolvedValue(undefined),
    getLocalManagedStudents: vi.fn().mockReturnValue([]),
    getLocalTutorAssignments: vi.fn().mockReturnValue([]),
    subscribeToTutorAssignments: vi.fn().mockReturnValue(() => {}),
    subscribeToManagedStudents: vi.fn().mockReturnValue(() => {}),
  };
});

// Mock generateAndDownloadInvoicePdf
vi.mock('../utils/generateInvoicePdf', () => ({
  generateAndDownloadInvoicePdf: vi.fn(),
}));

describe('ParentDashboard Realtime Payment Sync (SQA-ISTQB & TDD)', () => {
  const dummyRayhanPendingInvoice: FirestoreInvoiceDoc = {
    inv: 'INV-2026-RAYHAN-001',
    parent: 'Bunda Ratna Dewi',
    studentName: 'Rayhan Kusuma',
    packageType: 'paket',
    package: 'Paket 8 Sesi SD UMUM (Rayhan)',
    channel: 'Midtrans QRIS / Virtual Account',
    amount: 280000,
    status: 'PENDING',
    date: '27 Oktober 2026',
    whatsapp: '081298765432',
    createdAt: new Date().toISOString(),
  };

  const dummyRayhanPaidInvoice: FirestoreInvoiceDoc = {
    ...dummyRayhanPendingInvoice,
    status: 'LUNAS',
  };

  const dummyKaylaInvoice: FirestoreInvoiceDoc = {
    inv: 'INV-2026-KAYLA-002',
    parent: 'Bunda Ratna Dewi',
    studentName: 'Kayla Kusuma',
    packageType: 'paket',
    package: 'Paket Calistung Kayla (8 Sesi)',
    channel: 'Midtrans QRIS / Virtual Account',
    amount: 238000,
    status: 'PENDING',
    date: '27 Oktober 2026',
    whatsapp: '081298765432',
    createdAt: new Date().toISOString(),
  };

  const defaultProps = {
    onLogout: vi.fn(),
    onViewLanding: vi.fn(),
    parentName: 'Bunda Ratna Dewi',
    parentPhone: '0812-9876-5432',
    onOpenMidtransPayment: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    invoiceListenerCallback = null;
  });

  it('TC-PPS-001: ParentDashboard subscribes to Firestore invoices on mount and renders matching invoice', async () => {
    render(<ParentDashboard {...defaultProps} />);

    // Trigger realtime listener update with Rayhan pending invoice
    expect(invoiceListenerCallback).not.toBeNull();
    act(() => {
      invoiceListenerCallback?.([dummyRayhanPendingInvoice, dummyKaylaInvoice]);
    });

    await waitFor(() => {
      // Rayhan is selected by default, so his invoice number and package should be rendered
      expect(screen.getAllByText('INV-2026-RAYHAN-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Rp 280.000').length).toBeGreaterThan(0);
    });
  });

  it('TC-PPS-002: when invoice in Firestore is updated to LUNAS, dashboard reflects LUNAS and disables pay button', async () => {
    render(<ParentDashboard {...defaultProps} />);

    expect(invoiceListenerCallback).not.toBeNull();
    // Admin marks invoice as LUNAS in Firestore -> realtime event arrives
    act(() => {
      invoiceListenerCallback?.([dummyRayhanPaidInvoice]);
    });

    await waitFor(() => {
      expect(screen.getAllByText('INV-2026-RAYHAN-001').length).toBeGreaterThan(0);
      // Should show LUNAS badge
      const lunasElements = screen.getAllByText(/Lunas/i);
      expect(lunasElements.length).toBeGreaterThan(0);

      // Pay button should be disabled or show already paid
      const payButtons = screen.getAllByRole('button', { name: /Tagihan Sudah Dibayar|Lunas/i });
      expect(payButtons.length).toBeGreaterThan(0);
      expect(payButtons[0].hasAttribute('disabled')).toBe(true);
    });
  });

  it('TC-PPS-003: when invoice is PENDING, provides active Midtrans Snap pay button and manual Bank Jateng info', async () => {
    render(<ParentDashboard {...defaultProps} />);

    expect(invoiceListenerCallback).not.toBeNull();
    act(() => {
      invoiceListenerCallback?.([dummyRayhanPendingInvoice]);
    });

    await waitFor(() => {
      expect(screen.getAllByText('INV-2026-RAYHAN-001').length).toBeGreaterThan(0);

      // Pay button should be enabled
      const payButton = screen.getByRole('button', { name: /Bayar Sekarang via Midtrans Snap/i });
      expect(payButton).toBeDefined();
      expect(payButton.hasAttribute('disabled')).toBe(false);

      // Bank Jateng manual transfer info
      expect(screen.getAllByText('3014266266').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Monica Yuliana/i).length).toBeGreaterThan(0);
    });

    // Clicking pay button invokes onOpenMidtransPayment prop
    const payBtn = screen.getByRole('button', { name: /Bayar Sekarang via Midtrans Snap/i });
    fireEvent.click(payBtn);
    expect(defaultProps.onOpenMidtransPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        inv: 'INV-2026-RAYHAN-001',
        amount: 280000,
      })
    );
  });

  it('TC-PPS-004: clicking tagihan-midtrans tab renders dedicated invoice management view', async () => {
    render(<ParentDashboard {...defaultProps} />);

    expect(invoiceListenerCallback).not.toBeNull();
    act(() => {
      invoiceListenerCallback?.([dummyRayhanPendingInvoice, dummyKaylaInvoice]);
    });

    // Find and click tab "Tagihan & Midtrans" in sidebar
    const tagihanTabBtn = screen.getByRole('button', { name: /Tagihan & Midtrans/i });
    fireEvent.click(tagihanTabBtn);

    await waitFor(() => {
      // Dedicated view header should be displayed
      expect(screen.getByText(/Modul Tagihan & Pembayaran/i)).toBeDefined();
      expect(screen.getAllByText('INV-2026-RAYHAN-001').length).toBeGreaterThan(0);
    });
  });

  it('TC-PPS-005: switching child dynamically selects the corresponding child invoice', async () => {
    render(<ParentDashboard {...defaultProps} />);

    expect(invoiceListenerCallback).not.toBeNull();
    act(() => {
      invoiceListenerCallback?.([dummyRayhanPendingInvoice, dummyKaylaInvoice]);
    });

    // Switch child to Kayla Kusuma
    const kaylaTab = screen.getByRole('button', { name: /Kayla/i });
    fireEvent.click(kaylaTab);

    await waitFor(() => {
      // Kayla's invoice should now be rendered
      expect(screen.getAllByText('INV-2026-KAYLA-002').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Rp 238.000').length).toBeGreaterThan(0);
    });
  });
});
