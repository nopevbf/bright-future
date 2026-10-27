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

describe('Admin Data Siswa & Smart Dispatch Lifecycle (ISTQB & TDD)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC-CLN-001: Should NOT render Portal Siswa, Portal Orang Tua buttons or Sinkronisasi label on Admin Data Siswa page', () => {
    render(
      <AdminDashboard
        onLogout={vi.fn()}
        onViewLanding={vi.fn()}
      />
    );

    // Click on Data Siswa & Wali tab
    const dataSiswaTab = screen.getByRole('button', { name: /Data Siswa & Wali/i });
    fireEvent.click(dataSiswaTab);

    // Verify sub-tabs 1. Verifikasi and 2. Manajemen are rendered
    expect(screen.getByText(/1\. Verifikasi Pendaftaran/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Manajemen Siswa & Wali/i)).toBeInTheDocument();

    // Verify the removed portal simulation buttons do NOT exist
    expect(screen.queryByTitle(/Buka Portal Siswa Magelang/i)).toBeNull();
    expect(screen.queryByTitle(/Buka Portal Orang Tua \/ Wali/i)).toBeNull();
    expect(screen.queryByText(/Sinkronisasi Firestore/i)).toBeNull();
  });

  it('TC-DSP-002: Editing a student in Manajemen Siswa & Wali invokes saveManagedStudentToFirestore', async () => {
    const saveSpy = vi.spyOn(firebaseModule, 'saveManagedStudentToFirestore').mockResolvedValue(undefined);

    const mockStudent: ManagedStudent = {
      id: 'BF-2026-TEST-01',
      studentName: 'Kevin Pratama',
      level: 'SD',
      grade: 'Kelas 4 SD',
      schoolOrigin: 'SD Mertoyudan 1',
      parentName: 'Bapak Gunawan',
      parentRelation: 'Ayah',
      whatsapp: '081234567890',
      address: 'Mertoyudan, Kab. Magelang',
      district: 'Mertoyudan',
      tutorName: 'Kak Anindya, S.Pd.',
      subjects: ['Matematika', 'IPA'],
      packageSessions: 8,
      completedSessions: 2,
      status: 'aktif',
      joinDate: '2026-09-01',
      notes: 'Dipasangkan via Smart Dispatch.',
      isFromFirestore: true,
    };
    localStorage.setItem('bright_future_managed_students_cache', JSON.stringify([mockStudent]));

    render(
      <AdminDashboard
        onLogout={vi.fn()}
        onViewLanding={vi.fn()}
      />
    );

    // Switch to Data Siswa & Wali tab
    fireEvent.click(screen.getByRole('button', { name: /Data Siswa & Wali/i }));

    // Switch to sub-tab 2. Manajemen Siswa & Wali
    const subTabBtns = screen.getAllByText(/2\. Manajemen Siswa & Wali/i);
    fireEvent.click(subTabBtns[0]);

    // Wait for the table to render and find edit button for a student
    const editButtons = screen.getAllByTitle(/Edit Data Siswa & Wali/i);
    expect(editButtons.length).toBeGreaterThan(0);

    // Click edit on the first student
    fireEvent.click(editButtons[0]);

    // Modal should open
    expect(screen.getByText(/Edit Data Siswa & Wali/i)).toBeInTheDocument();

    // Submit form / click save button
    const saveBtn = screen.getByRole('button', { name: /Simpan Perubahan/i });
    fireEvent.click(saveBtn);

    // Verify saveManagedStudentToFirestore was called to persist changes to database
    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalled();
    });
  });
});
