import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TutorDashboard } from '../components/TutorDashboard';
import * as firebaseModule from '../firebase';

// Mock Firebase subscriptions
vi.mock('../firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof firebaseModule>();
  return {
    ...actual,
    subscribeToTutorVisits: vi.fn((callback) => {
      callback([
        {
          id: 'visit-test-1',
          studentName: 'Rayhan Kusuma',
          tutorName: 'Kak Anindya, S.Pd.',
          subject: 'IPAS Sains',
          level: 'SD Kelas 5',
          address: 'Jl. Pahlawan No. 42, Mertoyudan',
          time: '13:30 - 14:40 WIB',
          status: 'antre',
          score: 85,
        },
        {
          id: 'visit-test-2',
          studentName: 'Dimas Pratama',
          tutorName: 'Kak Anindya, S.Pd.',
          subject: 'Matematika SMP',
          level: 'SMP Kelas 7',
          address: 'Magelang Tengah',
          time: '15:30 - 16:40 WIB',
          status: 'selesai',
          score: 90,
        },
      ]);
      return () => {};
    }),
    subscribeToTutorAssignments: vi.fn((callback) => {
      callback([]);
      return () => {};
    }),
    subscribeToManagedStudents: vi.fn((callback) => {
      callback([]);
      return () => {};
    }),
    updateTutorVisitInFirestore: vi.fn().mockResolvedValue(true),
  };
});

describe('TutorDashboard Dynamic Honor & Start Session Route (SQA-ISTQB & TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-DYN-HONOR-001: Honor reflects real completed sessions multiplied by rate
  it('TC-DYN-HONOR-001: calculates dynamic honor accumulation from real finished visits', async () => {
    render(
      <TutorDashboard
        onLogout={vi.fn()}
        onViewLanding={vi.fn()}
        tutorName="Kak Anindya, S.Pd."
      />
    );

    // 1 session finished out of 2 = 1 * 40.000 = Rp 40.000
    await waitFor(() => {
      const honorTitle = screen.getByText(/Honor Akumulasi/i);
      expect(honorTitle).toBeInTheDocument();
      // Look for the dynamic honor value container
      expect(screen.getByTestId('dynamic-tutor-honor')).toHaveTextContent(/Rp\s*40\.000/);
      expect(screen.getByTestId('dynamic-tutor-session-count')).toHaveTextContent(/1 Sesi/);
    });
  });

  // TC-ROUTE-START-001: Route shows waiting status until tutor clicks Mulai Sesi
  it('TC-ROUTE-START-001: clicking Mulai Sesi triggers active session status in Firestore and starts live session', async () => {
    const updateSpy = vi.spyOn(firebaseModule, 'updateTutorVisitInFirestore');

    render(
      <TutorDashboard
        onLogout={vi.fn()}
        onViewLanding={vi.fn()}
        tutorName="Kak Anindya, S.Pd."
      />
    );

    // Find and click "Mulai Sesi"
    const startButtons = screen.getAllByRole('button', { name: /Mulai Sesi/i });
    expect(startButtons.length).toBeGreaterThan(0);
    fireEvent.click(startButtons[0]);

    // Should call updateTutorVisitInFirestore with status: 'berlangsung'
    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'berlangsung',
        })
      );
    });
  });
});
