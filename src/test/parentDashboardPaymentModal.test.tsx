import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ParentDashboard } from '../components/ParentDashboard';
import { FirestoreInvoiceDoc } from '../firebase';

const mockRayhanInvoice: FirestoreInvoiceDoc = {
  inv: 'INV-2026-TEST-999',
  parent: 'Bunda Ratna Dewi',
  studentName: 'Rayhan Kusuma',
  packageType: 'paket',
  package: 'Paket 8 Sesi SD UMUM',
  channel: 'Midtrans QRIS / Virtual Account',
  amount: 280000,
  status: 'PENDING',
  date: '27 Oktober 2026',
  whatsapp: '081298765432',
  createdAt: new Date().toISOString(),
};

vi.mock('../firebase', async () => {
  const actual = await vi.importActual('../firebase');
  return {
    ...actual,
    subscribeToInvoices: vi.fn((cb: any) => {
      cb([mockRayhanInvoice]);
      return vi.fn();
    }),
    subscribeToTutorAssignments: vi.fn(() => vi.fn()),
    subscribeToManagedStudents: vi.fn((cb: any) => {
      cb([]);
      return vi.fn();
    }),
    subscribeToRegistrations: vi.fn((cb: any) => {
      cb([]);
      return vi.fn();
    }),
    getLocalManagedStudents: vi.fn(() => []),
    getLocalTutorAssignments: vi.fn(() => []),
    updateInvoiceStatusInFirestore: vi.fn().mockResolvedValue(undefined),
  };
});

describe('ParentDashboard In-Situ Payment Modal (SQA-ISTQB / TDD Red Phase)', () => {
  const defaultProps = {
    onLogout: vi.fn(),
    onViewLanding: vi.fn(),
    parentName: 'Bunda Ratna Dewi',
    parentPhone: '0812-9876-5432',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-PAY-001: Clicking "Bayar Sekarang via Midtrans Snap" opens Midtrans Snap simulator modal inside Parent Dashboard', async () => {
    render(<ParentDashboard {...defaultProps} />);

    // Switch to Tagihan & Midtrans tab if needed, or find the pay button
    const tabBtn = screen.getByRole('button', { name: /Tagihan & Midtrans/i });
    fireEvent.click(tabBtn);

    // Wait for invoice card to appear
    await waitFor(() => {
      expect(screen.getAllByText('INV-2026-TEST-999').length).toBeGreaterThan(0);
    });

    const payButton = screen.getByRole('button', { name: /Bayar Sekarang via Midtrans Snap/i });
    expect(payButton).toBeInTheDocument();

    // Click pay button
    fireEvent.click(payButton);

    // Verify modal is open inside Parent Dashboard
    await waitFor(() => {
      expect(screen.getByText(/Pembayaran Midtrans Real-time/i)).toBeInTheDocument();
    });

    // Close button should close modal
    const closeBtn = screen.getByLabelText(/Tutup/i);
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Pembayaran Midtrans Real-time/i)).toBeNull();
    });
  });
});
