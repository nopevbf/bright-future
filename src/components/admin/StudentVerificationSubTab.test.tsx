import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StudentVerificationSubTab } from './StudentVerificationSubTab';
import { FirestoreRegistrationDoc } from '../../firebase';

describe('StudentVerificationSubTab Enhancement (ISTQB & TDD)', () => {
  const dummyPendingTransfer: FirestoreRegistrationDoc = {
    studentId: 'BF-202610-001',
    studentName: 'Ahmad Faiz',
    parentName: 'Bapak Rudi',
    whatsapp: '081234567890',
    homeAddress: 'Jl. Magelang No. 10',
    level: 'sd',
    selectedSchedule: ['Senin - Rabu'],
    totalAmount: 280000,
    invoiceNumber: 'INV-202610-001',
    paymentMethod: 'manual_transfer',
    paymentStatus: 'pending',
    createdAt: '2026-10-24T08:00:00.000Z',
    appliedDiscount: 0,
    totalSessions: 8,
  };

  const dummyPaidMidtrans: FirestoreRegistrationDoc = {
    studentId: 'BF-202610-002',
    studentName: 'Siti Sarah',
    parentName: 'Ibu Sarah',
    whatsapp: '081298765432',
    homeAddress: 'Jl. Pahlawan No. 5',
    level: 'smp',
    selectedSchedule: ['Selasa - Kamis'],
    totalAmount: 360000,
    invoiceNumber: 'INV-202610-002',
    paymentMethod: 'midtrans',
    paymentStatus: 'paid', // Midtrans payment settled
    createdAt: '2026-10-24T09:00:00.000Z',
    appliedDiscount: 0,
    totalSessions: 8,
  };

  const dummyVerifiedAdmin: FirestoreRegistrationDoc = {
    studentId: 'BF-202610-003',
    studentName: 'Doni Pratama',
    parentName: 'Bapak Doni',
    whatsapp: '081311223344',
    homeAddress: 'Jl. Pemuda No. 7',
    level: 'sma',
    selectedSchedule: ['Jumat - Sabtu'],
    totalAmount: 440000,
    invoiceNumber: 'INV-202610-003',
    paymentMethod: 'manual_transfer',
    paymentStatus: 'verified', // Manually verified by admin
    createdAt: '2026-10-24T10:00:00.000Z',
    appliedDiscount: 0,
    totalSessions: 8,
  };

  const defaultProps = {
    registrations: [dummyPendingTransfer, dummyPaidMidtrans, dummyVerifiedAdmin],
    isLoading: false,
    onRefresh: vi.fn(),
    onVerify: vi.fn().mockResolvedValue(undefined),
    onViewDetail: vi.fn(),
    onPrintSlip: vi.fn(),
    onOpenDispatch: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TC-SVT-001: verification action button should be icon-only (no text label "Verifikasi")', () => {
    render(<StudentVerificationSubTab {...defaultProps} />);

    // For pending student, verify button exists
    const verifyButtons = screen.getAllByTitle(/Setujui dan Verifikasi Pendaftaran/i);
    expect(verifyButtons.length).toBe(1);

    // Should NOT contain the text "Verifikasi" inside the button
    expect(verifyButtons[0].textContent?.trim()).not.toContain('Verifikasi');
    expect(verifyButtons[0].textContent?.trim()).toBe('check');
  });

  it('TC-SVT-002: WhatsApp action copies confirmation draft message to clipboard instead of opening link', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<StudentVerificationSubTab {...defaultProps} />);

    const copyWaButtons = screen.getAllByTitle(/Salin Pesan.*WhatsApp/i);
    expect(copyWaButtons.length).toBeGreaterThan(0);

    // Click on the first copy button
    fireEvent.click(copyWaButtons[0]);

    expect(writeTextMock).toHaveBeenCalled();
    const copiedText = writeTextMock.mock.calls[0][0];
    expect(copiedText).toContain('Ahmad Faiz');
    expect(copiedText).toContain('BF-202610-001');
    expect(copiedText).toContain('Bright Future');
  });

  it('TC-SVT-003: action buttons container must be arranged as max 3 icons per row (grid-cols-3)', () => {
    render(<StudentVerificationSubTab {...defaultProps} />);

    const actionContainers = document.querySelectorAll('.grid-cols-3');
    expect(actionContainers.length).toBeGreaterThan(0);
  });

  it('TC-SVT-004: should render Metode Bayar column with Midtrans and Transfer badges', () => {
    render(<StudentVerificationSubTab {...defaultProps} />);

    // Column header
    expect(screen.getByRole('columnheader', { name: /Metode Bayar/i })).toBeInTheDocument();

    // Badges in table body
    expect(screen.getAllByText(/Transfer/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Midtrans/i).length).toBeGreaterThanOrEqual(1);
  });

  it('TC-SVT-005: Midtrans registration with paid status should be auto-verified and not display verify button', () => {
    render(<StudentVerificationSubTab {...defaultProps} />);

    // Siti Sarah has paymentMethod='midtrans' and paymentStatus='paid'
    // She should be marked as TERVERIFIKASI
    const rows = screen.getAllByRole('row');
    const sarahRow = rows.find((row) => row.textContent?.includes('Siti Sarah'));
    expect(sarahRow).toBeDefined();

    // Status in Sarah's row should be verified
    expect(sarahRow?.textContent).toContain('TERVERIFIKASI');

    // Quick verify button should NOT exist in Sarah's row
    const verifyInSarahRow = sarahRow?.querySelector('button[title="Setujui dan Verifikasi Pendaftaran"]');
    expect(verifyInSarahRow).toBeNull();
  });
});
