import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ParentDashboard } from '../components/ParentDashboard';
import { ManagedStudent } from '../components/admin/studentData';
import { FirestoreRegistrationDoc } from '../firebase';

// Mock firebase
const mockUnsubscribe = vi.fn();
let managedCallback: ((data: ManagedStudent[]) => void) | null = null;
let regCallback: ((data: FirestoreRegistrationDoc[]) => void) | null = null;

const mockStudents: ManagedStudent[] = [
  {
    id: 'BF-2026-09-8492',
    studentName: 'Kevin Pratama',
    level: 'SD UMUM',
    grade: 'Kelas 4 SD',
    schoolOrigin: 'SD Tarakanita Magelang',
    parentName: 'Ibu Deasy Kurnia',
    parentRelation: 'Ibu',
    whatsapp: '085173230198',
    address: 'Jl. Raya Secang No. 42',
    district: 'Secang',
    tutorName: 'Kak Anindya, S.Pd.',
    subjects: ['Tematik', 'Matematika'],
    packageSessions: 8,
    completedSessions: 6,
    status: 'aktif',
    joinDate: '2026-08-10',
  },
  {
    id: 'BF-2026-09-8493',
    studentName: 'Michelle Gunawan',
    level: 'SD UMUM',
    grade: 'Kelas 4 SD',
    schoolOrigin: 'SD Kanisius Muntilan',
    parentName: 'Bpk. Hendra Gunawan',
    parentRelation: 'Ayah',
    whatsapp: '081228945671',
    address: 'Jl. Pemuda No. 88, Muntilan',
    district: 'Muntilan',
    tutorName: 'Kak Dimas Arya, S.Si.',
    subjects: ['Matematika'],
    packageSessions: 8,
    completedSessions: 7,
    status: 'perlu_perpanjang',
    joinDate: '2026-08-12',
  },
  {
    id: 'BF-2026-09-8495',
    studentName: 'Clarissa Gunawan',
    level: 'Calistung',
    grade: 'Kelas 1 SD',
    schoolOrigin: 'SD Kanisius Muntilan',
    parentName: 'Bpk. Hendra Gunawan',
    parentRelation: 'Ayah',
    whatsapp: '081228945671',
    address: 'Jl. Pemuda No. 88, Muntilan',
    district: 'Muntilan',
    tutorName: 'Kak Sarah Melati, S.Pd.',
    subjects: ['Membaca & Berhitung'],
    packageSessions: 8,
    completedSessions: 2,
    status: 'aktif',
    joinDate: '2026-09-01',
  },
];

vi.mock('../firebase', async () => {
  const actual = await vi.importActual('../firebase');
  return {
    ...actual,
    subscribeToInvoices: vi.fn(() => vi.fn()),
    subscribeToTutorAssignments: vi.fn(() => vi.fn()),
    subscribeToManagedStudents: vi.fn((cb: any) => {
      managedCallback = cb;
      cb(mockStudents);
      return mockUnsubscribe;
    }),
    subscribeToRegistrations: vi.fn((cb: any) => {
      regCallback = cb;
      cb([]);
      return mockUnsubscribe;
    }),
    getLocalManagedStudents: vi.fn(() => mockStudents),
    getLocalTutorAssignments: vi.fn(() => []),
    updateInvoiceStatusInFirestore: vi.fn().mockResolvedValue(undefined),
  };
});

describe('ParentDashboard Dynamic Children (SQA-ISTQB / TDD Red Phase)', () => {
  const defaultProps = {
    onLogout: vi.fn(),
    onViewLanding: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-PARENT-001: Displays student Kevin Pratama when Ibu Deasy Kurnia logs in with phone 0851-7323-0198', async () => {
    render(
      <ParentDashboard
        {...defaultProps}
        parentName="Ibu Deasy Kurnia"
        parentPhone="0851-7323-0198"
      />
    );

    await waitFor(() => {
      // Kevin Pratama should be rendered as child
      const matches = screen.getAllByText(/Kevin Pratama/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    // Rayhan Kusuma should NOT be displayed as current child
    expect(screen.queryByText('Rayhan Kusuma (Kelas 5 SD)')).toBeNull();
  });

  it('TC-PARENT-002: Displays multi-child selector and switches children when Bpk. Hendra Gunawan logs in', async () => {
    render(
      <ParentDashboard
        {...defaultProps}
        parentName="Bpk. Hendra Gunawan"
        parentPhone="081228945671"
      />
    );

    await waitFor(() => {
      // Michelle Gunawan and Clarissa Gunawan should both be available
      const michelleMatches = screen.getAllByText(/Michelle Gunawan/i);
      expect(michelleMatches.length).toBeGreaterThan(0);
    });

    // Check if child selector button for Clarissa exists
    const clarissaBtn = screen.getByText(/Clarissa/i);
    expect(clarissaBtn).toBeInTheDocument();

    // Click on Clarissa
    fireEvent.click(clarissaBtn);

    await waitFor(() => {
      const activeClarissa = screen.getAllByText(/Clarissa Gunawan/i);
      expect(activeClarissa.length).toBeGreaterThan(0);
    });
  });
});
