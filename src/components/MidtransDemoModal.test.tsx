import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MidtransDemoModal } from './MidtransDemoModal';
import { SubmittedRegistration } from '../types';

describe('MidtransDemoModal Component', () => {
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
  });

  it('MDT-MODAL-001: should render invoice number and total amount', () => {
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

  it('MDT-MODAL-002: should render Midtrans Snap button or interactive payment options', () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /simulasi selesaikan pembayaran|bayar via midtrans snap/i })).toBeInTheDocument();
  });

  it('MDT-MODAL-003: clicking simulate payment should transition to paid state', async () => {
    render(
      <MidtransDemoModal
        submission={dummySubmission}
        onClose={vi.fn()}
      />
    );

    const payButton = screen.getByRole('button', { name: /simulasi selesaikan pembayaran|bayar via midtrans snap/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(screen.getByText(/pembayaran sukses/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
