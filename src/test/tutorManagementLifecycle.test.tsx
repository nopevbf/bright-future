/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TutorManagementSubTab, ActiveTutorItem } from '../components/admin/TutorManagementSubTab';
import { AdminDashboard } from '../components/AdminDashboard';
import { FirestoreTutorRegistrationDoc, FirestoreTutorAssignmentDoc } from '../firebase';
import { ManagedStudent } from '../types';

describe('TutorManagementSubTab Component Lifecycle (SQA-ISTQB & TDD)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleTutors: ActiveTutorItem[] = [
    {
      id: 'TUTOR-001',
      name: 'Kak Anindya, S.Pd.',
      univ: 'Pendidikan Matematika UNY (IPK 3.88)',
      spec: 'SD UMUM & Olimpiade Sains SD',
      load: '1 Siswa Aktif',
      status: 'On-Duty',
      rating: 4.9,
      district: 'Mertoyudan',
      assignedStudents: [
        {
          studentId: 'BF-2026-09-8492',
          studentName: 'Kevin Pratama',
          level: 'SD UMUM',
          grade: 'Kelas 4 SD',
          district: 'Mertoyudan',
        },
      ],
    },
    {
      id: 'TUTOR-002',
      name: 'Kak Dimas Arya, S.Si.',
      univ: 'Fisika MIPA UGM (IPK 3.82)',
      spec: 'SD UMUM Matematika & SMP Fisika',
      load: '0 Siswa Aktif',
      status: 'Tersedia',
      rating: 4.8,
      district: 'Magelang Tengah',
      assignedStudents: [],
    },
  ];

  it('TC-TUTOR-001: Renders empty state when active tutors list is empty', () => {
    const onSwitchTabMock = vi.fn();
    render(
      <TutorManagementSubTab
        acceptedApplicants={[]}
        activeTutors={[]}
        managedStudents={[]}
        assignments={[]}
        onSwitchToVerificationTab={onSwitchTabMock}
      />
    );

    // Should render empty state illustration / text
    expect(screen.getByText(/Belum Ada Tutor \/ Guru Privat Terdaftar/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Saat ini belum ada pengajar aktif di sistem/i)
    ).toBeInTheDocument();

    // Should have action button to switch to verification tab
    const verifBtn = screen.getByRole('button', { name: /Buka Verifikasi Calon Tutor/i });
    expect(verifBtn).toBeInTheDocument();
    fireEvent.click(verifBtn);
    expect(onSwitchTabMock).toHaveBeenCalled();
  });

  it('TC-TUTOR-002: Renders dynamic tutor cards when tutors exist', () => {
    render(
      <TutorManagementSubTab
        acceptedApplicants={[]}
        activeTutors={sampleTutors}
        managedStudents={[]}
        assignments={[]}
      />
    );

    expect(screen.getByText('Kak Anindya, S.Pd.')).toBeInTheDocument();
    expect(screen.getByText('Kak Dimas Arya, S.Si.')).toBeInTheDocument();
    expect(screen.getByText(/Mertoyudan/i)).toBeInTheDocument();
  });

  it('TC-TUTOR-003: Clicking Hapus Tutor opens confirmation modal', () => {
    render(
      <TutorManagementSubTab
        acceptedApplicants={[]}
        activeTutors={sampleTutors}
        managedStudents={[]}
        assignments={[]}
        onDeleteTutor={vi.fn()}
      />
    );

    // Find delete button for Kak Dimas Arya (who has 0 assigned students)
    const deleteButtons = screen.getAllByTitle(/Hapus Tutor dari Sistem/i);
    expect(deleteButtons.length).toBe(2);

    // Click delete on Kak Dimas Arya (second tutor)
    fireEvent.click(deleteButtons[1]);

    // Modal should appear
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/Konfirmasi Hapus Tutor/i)).toBeInTheDocument();
    expect(screen.getByText(/Apakah Anda yakin ingin menghapus tutor/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Kak Dimas Arya, S.Si./i).length).toBeGreaterThan(1);

    // Since Kak Dimas has 0 students, delete button is immediately enabled
    const confirmBtn = screen.getByRole('button', { name: /Ya, Hapus Tutor/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('TC-TUTOR-004: Validates deletion when tutor is currently paired with students', () => {
    const onDeleteMock = vi.fn();
    render(
      <TutorManagementSubTab
        acceptedApplicants={[]}
        activeTutors={sampleTutors}
        managedStudents={[]}
        assignments={[]}
        onDeleteTutor={onDeleteMock}
      />
    );

    // Click delete on Kak Anindya (who has 1 assigned student)
    const deleteButtons = screen.getAllByTitle(/Hapus Tutor dari Sistem/i);
    fireEvent.click(deleteButtons[0]);

    // Modal should show validation warning about assigned students
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/Perhatian: Tutor Masih Memiliki Siswa Binaan/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Kevin Pratama/i).length).toBeGreaterThan(1);

    // Delete button must be disabled until agreement checkbox is checked
    const confirmBtn = screen.getByRole('button', { name: /Ya, Hapus Tutor/i });
    expect(confirmBtn).toBeDisabled();

    // Check the required agreement checkbox
    const agreementCheckbox = screen.getByRole('checkbox', {
      name: /konfirmasi pelepasan siswa/i,
    });
    fireEvent.click(agreementCheckbox);

    // Now button should be enabled
    expect(confirmBtn).not.toBeDisabled();

    // Click confirm
    fireEvent.click(confirmBtn);
    expect(onDeleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Kak Anindya, S.Pd.' }),
      true // unassignStudents confirmed
    );
  });

  it('TC-TUTOR-COUNT-001: Renders accurate dynamic count in Tutor Aktif & Terakreditasi tab badge', () => {
    localStorage.setItem(
      'bf_active_tutors_cache',
      JSON.stringify([
        {
          id: 'T-1',
          name: 'Kak Anindya, S.Pd.',
          univ: 'UNY',
          spec: 'SD',
          district: 'Secang',
        },
        {
          id: 'T-2',
          name: 'Kak Dimas Arya, S.Si.',
          univ: 'UGM',
          spec: 'SMP',
          district: 'Mertoyudan',
        },
      ])
    );
    localStorage.setItem('bf_tutor_registrations_cache', JSON.stringify([]));

    render(<AdminDashboard onLogout={vi.fn()} onViewLanding={vi.fn()} />);

    // Click on Data Tutor tab
    fireEvent.click(screen.getByRole('button', { name: /Data Tutor/i }));

    // The subtab button for "Tutor Aktif & Terakreditasi" should show 2, NOT 4 + 0 = 4!
    const activeTutorTabBtn = screen.getByRole('button', {
      name: /Tutor Aktif & Terakreditasi/i,
    });
    expect(activeTutorTabBtn).toHaveTextContent('2');
  });
});
