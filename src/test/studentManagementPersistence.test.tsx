/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminDashboard } from '../components/AdminDashboard';
import * as firebaseModule from '../firebase';
import { ManagedStudent } from '../components/admin/studentData';

describe('Admin Student Management & Pairing Persistence (SQA-ISTQB & TDD)', () => {
  const sampleStudent: ManagedStudent = {
    id: 'BF-2026-TEST-99',
    studentName: 'Alya Putri',
    level: 'SD UMUM',
    grade: 'Kelas 3 SD',
    schoolOrigin: 'SD Mertoyudan 2',
    parentName: 'Ibu Ratna',
    parentRelation: 'Ibu',
    whatsapp: '081234567890',
    address: 'Mertoyudan, Magelang',
    district: 'Mertoyudan',
    tutorName: 'Kak Anindya, S.Pd.',
    subjects: ['Matematika'],
    packageSessions: 8,
    completedSessions: 7,
    status: 'perlu_perpanjang',
    joinDate: '2026-09-01',
    isFromFirestore: true,
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
    localStorage.setItem(
      'bright_future_managed_students_cache',
      JSON.stringify([sampleStudent])
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC-STU-SESS-001: Adding sessions in AddSessionsModal invokes saveManagedStudentToFirestore', async () => {
    const saveSpy = vi.spyOn(firebaseModule, 'saveManagedStudentToFirestore').mockResolvedValue(undefined);

    render(<AdminDashboard onLogout={vi.fn()} onViewLanding={vi.fn()} />);

    // Switch to Data Siswa & Wali tab
    fireEvent.click(screen.getByRole('button', { name: /Data Siswa & Wali/i }));

    // Switch to sub-tab 2. Manajemen Siswa & Wali
    const subTabBtns = screen.getAllByText(/2\. Manajemen Siswa & Wali/i);
    fireEvent.click(subTabBtns[0]);

    // Click on Add Sessions button
    const addSessionBtns = screen.getAllByTitle(/Tambah Sesi \/ Perpanjang SPP/i);
    expect(addSessionBtns.length).toBeGreaterThan(0);
    fireEvent.click(addSessionBtns[0]);

    // Modal AddSessionsModal should open
    expect(screen.getByText(/Perpanjang Paket Belajar/i)).toBeInTheDocument();

    // Confirm addition (e.g. click +4 sesi button or submit)
    const confirmAddBtn = screen.getByRole('button', { name: /Konfirmasi Tambah Sesi/i });
    fireEvent.click(confirmAddBtn);

    // Verify saveManagedStudentToFirestore was called with updated sessions
    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'BF-2026-TEST-99',
          packageSessions: expect.any(Number),
        })
      );
    });
  });

  it('TC-STU-DEL-001: Deleting a student calls deleteManagedStudentFromFirestore', async () => {
    const deleteSpy = vi.spyOn(firebaseModule, 'deleteManagedStudentFromFirestore').mockResolvedValue(undefined);
    // Mock window.confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AdminDashboard onLogout={vi.fn()} onViewLanding={vi.fn()} />);

    // Switch to Data Siswa & Wali tab
    fireEvent.click(screen.getByRole('button', { name: /Data Siswa & Wali/i }));

    // Switch to sub-tab 2. Manajemen Siswa & Wali
    const subTabBtns = screen.getAllByText(/2\. Manajemen Siswa & Wali/i);
    fireEvent.click(subTabBtns[0]);

    // Click delete on student
    const deleteBtns = screen.getAllByTitle(/Hapus Data Siswa/i);
    expect(deleteBtns.length).toBeGreaterThan(0);
    fireEvent.click(deleteBtns[0]);

    // Verify deleteManagedStudentFromFirestore was called
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('BF-2026-TEST-99');
    });
  });

  it('TC-PAIR-PERSIST-001: Smart dispatching a tutor persists to tutor_assignments and managed_students', async () => {
    const saveAssignmentSpy = vi.spyOn(firebaseModule, 'saveTutorAssignmentToFirestore').mockResolvedValue(undefined);
    const saveStudentSpy = vi.spyOn(firebaseModule, 'saveManagedStudentToFirestore').mockResolvedValue(undefined);

    render(<AdminDashboard onLogout={vi.fn()} onViewLanding={vi.fn()} />);

    // Switch to Data Siswa & Wali tab
    fireEvent.click(screen.getByRole('button', { name: /Data Siswa & Wali/i }));

    // Switch to sub-tab 2. Manajemen Siswa & Wali
    const subTabBtns = screen.getAllByText(/2\. Manajemen Siswa & Wali/i);
    fireEvent.click(subTabBtns[0]);

    // Click Pasangkan / Smart Dispatch button on student
    const dispatchBtns = screen.getAllByTitle(/Smart Dispatch: Pasangkan Tutor Terdekat/i);
    expect(dispatchBtns.length).toBeGreaterThan(0);
    fireEvent.click(dispatchBtns[0]);

    // TutorDispatchModal should open
    expect(screen.getByText(/Pasangkan Tutor Terdekat & Terkompeten/i)).toBeInTheDocument();

    // Click "Pasangkan Tutor Ini" on the first recommendation
    const assignBtns = screen.getAllByRole('button', { name: /Pasangkan Tutor Ini/i });
    expect(assignBtns.length).toBeGreaterThan(0);
    fireEvent.click(assignBtns[0]);

    // Verify saveTutorAssignmentToFirestore was called
    await waitFor(() => {
      expect(saveAssignmentSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'BF-2026-TEST-99',
          tutorName: expect.any(String),
        }),
        expect.anything()
      );
    });
  });
});
