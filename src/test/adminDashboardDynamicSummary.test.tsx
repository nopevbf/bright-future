import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { AdminDashboard } from '../components/AdminDashboard';
import { FirestoreRegistrationDoc, FirestoreInvoiceDoc } from '../firebase';
import { ManagedStudent } from '../components/admin/studentData';

const { testRegistrations, testInvoices } = vi.hoisted(() => {
  const testRegistrations: FirestoreRegistrationDoc[] = [
    {
      id: 'REG-001',
      studentId: 'BF-2026-09-9001',
      studentName: 'Siswa Baru 1',
      parentName: 'Wali 1',
      level: 'sd',
      whatsapp: '081234567890',
      homeAddress: 'Secang',
      selectedSchedule: ['Senin 15:30'],
      totalAmount: 280000,
      paymentStatus: 'paid',
      submittedAt: '2026-10-27T08:00:00Z',
      status: 'verified',
    },
    {
      id: 'REG-002',
      studentId: 'BF-2026-09-9002',
      studentName: 'Siswa Baru 2',
      parentName: 'Wali 2',
      level: 'smp',
      whatsapp: '081234567891',
      homeAddress: 'Mungkid',
      selectedSchedule: ['Selasa 15:30'],
      totalAmount: 360000,
      paymentStatus: 'pending',
      submittedAt: '2026-10-27T09:00:00Z',
      status: 'submitted',
    },
  ];

  const testInvoices: FirestoreInvoiceDoc[] = [
    {
      inv: 'INV-TEST-LUNAS-1',
      parent: 'Wali 1',
      studentName: 'Siswa Lunas 1',
      packageType: 'paket',
      package: 'Paket 8 Sesi SD',
      channel: 'Midtrans QRIS',
      amount: 500000,
      status: 'LUNAS',
      date: '27 Oktober 2026',
      whatsapp: '081234567890',
      createdAt: '2026-10-27T10:00:00Z',
    },
    {
      inv: 'INV-TEST-PENDING-1',
      parent: 'Wali 2',
      studentName: 'Siswa Pending 1',
      packageType: 'paket',
      package: 'Paket 8 Sesi SMP',
      channel: 'Midtrans VA',
      amount: 350000,
      status: 'PENDING',
      date: '27 Oktober 2026',
      whatsapp: '081234567891',
      createdAt: '2026-10-27T11:00:00Z',
    },
  ];

  return { testRegistrations, testInvoices };
});

vi.mock('../firebase', async () => {
  const actual = await vi.importActual('../firebase');
  return {
    ...actual,
    subscribeToRegistrations: vi.fn((cb: any) => {
      cb(testRegistrations);
      return vi.fn();
    }),
    subscribeToInvoices: vi.fn((cb: any) => {
      cb(testInvoices);
      return vi.fn();
    }),
    subscribeToTutorRegistrations: vi.fn((cb: any) => {
      cb([]);
      return vi.fn();
    }),
    subscribeToManagedStudents: vi.fn((cb: any) => {
      cb([]);
      return vi.fn();
    }),
    subscribeToTutorAssignments: vi.fn((cb: any) => {
      cb([]);
      return vi.fn();
    }),
    fetchRegistrationsFromFirestore: vi.fn().mockResolvedValue(testRegistrations),
    seedInitialInvoicesIfEmpty: vi.fn().mockResolvedValue(testInvoices),
    seedInitialTutorRegistrationsIfEmpty: vi.fn().mockResolvedValue([]),
    updateRegistrationStatusInFirestore: vi.fn().mockResolvedValue(undefined),
    deleteRegistrationFromFirestore: vi.fn().mockResolvedValue(undefined),
    updateInvoiceStatusInFirestore: vi.fn().mockResolvedValue(undefined),
    deleteInvoiceFromFirestore: vi.fn().mockResolvedValue(undefined),
  };
});

describe('AdminDashboard Dynamic Summary Tab (SQA-ISTQB / TDD Red Phase)', () => {
  const defaultProps = {
    onLogout: vi.fn(),
    onViewLanding: vi.fn(),
    adminName: 'Super Admin',
    adminEmail: 'admin@brightfuture.id',
    adminRole: 'super_admin' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-ADM-001: Calculates dynamic omset and piutang from live Firestore invoices', async () => {
    render(<AdminDashboard {...defaultProps} />);

    await waitFor(() => {
      // Omset should reflect Rp 500.000 (from LUNAS invoice)
      expect(screen.getByText('Rp 500.000')).toBeInTheDocument();
      // Piutang should reflect Rp 350.000 (from PENDING invoice)
      expect(screen.getByText('Rp 350.000')).toBeInTheDocument();
    });
  });

  it('TC-ADM-002: Renders dynamic live invoices feed in Summary tab instead of hardcoded items', async () => {
    render(<AdminDashboard {...defaultProps} />);

    await waitFor(() => {
      // The invoice from mockInvoices should appear in the feed
      expect(screen.getByText('INV-TEST-LUNAS-1')).toBeInTheDocument();
      expect(screen.getByText('INV-TEST-PENDING-1')).toBeInTheDocument();
    });

    // Hardcoded old invoice should NOT be present
    expect(screen.queryByText('INV-2026-09-092')).toBeNull();
  });
});
