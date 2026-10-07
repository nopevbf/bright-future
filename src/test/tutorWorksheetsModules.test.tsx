import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorWorksheetsModules } from '../components/tutor/TutorWorksheetsModules';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../utils/tutorPairingResolver';

describe('TutorWorksheetsModules Component (SQA-ISTQB & TDD)', { timeout: 15000 }, () => {
  const mockAssignedStudents: AssignedStudentSummary[] = [
    {
      studentId: 'student-01',
      id: 'student-01',
      studentName: 'Rayhan Kusuma',
      level: 'SD Kelas 5',
      parentName: 'Bunda Rayhan',
      parentPhone: '081298764321',
      whatsapp: '081298764321',
      address: 'Mertoyudan',
      status: 'active',
    },
    {
      studentId: 'student-02',
      id: 'student-02',
      studentName: 'Kevin Pratama',
      level: 'SD Kelas 4',
      parentName: 'Ibu Ratna Dewi',
      parentPhone: '081322117788',
      whatsapp: '081322117788',
      address: 'Pahlawan, Magelang Tengah',
      status: 'active',
    },
  ];

  const mockVisits: FirestoreTutorVisitDoc[] = [
    {
      id: 'visit-01',
      studentName: 'Rayhan Kusuma',
      level: 'SD Kelas 5',
      address: 'Mertoyudan',
      status: 'selesai',
      time: '13:30 - 14:40 WIB',
      subject: 'IPAS Bab 4: Bumi & Antariksa',
      score: 89,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-TWM-001: renders breadcrumb, headline without (70 Menit), and 4 Bento KPI metrics', () => {
    render(
      <TutorWorksheetsModules
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    expect(screen.getByText('Portal Tutor')).toBeDefined();
    expect(screen.getByRole('heading', { name: /Modul Ajar & Lembar Kerja Siswa \(LKPD\)/i })).toBeDefined();

    // Verify absolutely no "(70 Menit)" or "70 Mnt" label
    expect(screen.queryByText(/\(70 Menit\)/i)).toBeNull();
    expect(screen.queryByText(/70 Mnt/i)).toBeNull();

    // Verify 4 KPI cards
    expect(screen.getByText('Total Tersedia')).toBeDefined();
    expect(screen.getByText('Cetak Fisik Siap Bawa')).toBeDefined();
    expect(screen.getByText('Paling Sering Dipakai')).toBeDefined();
    expect(screen.getByText('Offline PWA Sync')).toBeDefined();
  });

  it('TC-TWM-002: filters module catalog using filter pills (SD, SMP, LKPD, Flashcard)', () => {
    render(
      <TutorWorksheetsModules
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Filter by SMP
    const smpBtn = screen.getByRole('button', { name: /SMP Sains & Mat/i });
    fireEvent.click(smpBtn);

    expect(screen.getByText(/Modul Persamaan Linier Satu Variabel/i)).toBeDefined();
    expect(screen.queryByText(/LKPD Sains Bab 4: Gerak Rotasi & Revolusi Bumi/i)).toBeNull();

    // Reset to Semua Materi
    const allBtn = screen.getByRole('button', { name: /Semua Materi/i });
    fireEvent.click(allBtn);
    expect(screen.getByText(/LKPD Sains Bab 4: Gerak Rotasi & Revolusi Bumi/i)).toBeDefined();
  });

  it('TC-TWM-003: filters modules by search text input and subject dropdown', () => {
    render(
      <TutorWorksheetsModules
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari judul modul, bab, jenjang/i);
    fireEvent.change(searchInput, { target: { value: 'Fonik' } });

    expect(screen.getByText(/Flashcard Fonik & Lembar Motorik Cerita Rakyat/i)).toBeDefined();
    expect(screen.queryByText(/Modul Persamaan Linier Satu Variabel/i)).toBeNull();
  });

  it('TC-TWM-004: opens preview modal and upload new worksheet modal', () => {
    render(
      <TutorWorksheetsModules
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Open upload modal
    const uploadBtn = screen.getByRole('button', { name: /Upload Materi\/LKPD Baru/i });
    fireEvent.click(uploadBtn);
    expect(screen.getByText(/Unggah Materi atau LKPD Baru/i)).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(closeBtn);

    // Open preview modal
    const previewBtn = screen.getAllByRole('button', { name: /Pratinjau/i })[0];
    fireEvent.click(previewBtn);
    expect(screen.getByText(/Pratinjau Lembar Kerja Siswa/i)).toBeDefined();
  });

  it('TC-TWM-005: triggers print package dialog and checklist reprint button', () => {
    const originalPrint = window.print;
    window.print = vi.fn();

    render(
      <TutorWorksheetsModules
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    const reprintBtn = screen.getByRole('button', { name: /Cetak Ulang Semua Lembar Hari Ini/i });
    fireEvent.click(reprintBtn);
    expect(window.print).toHaveBeenCalled();

    window.print = originalPrint;
  });

  it('TC-TWM-006: handles direct contact coordinator via WhatsApp link', () => {
    const originalOpen = window.open;
    window.open = vi.fn();

    render(
      <TutorWorksheetsModules
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    const contactBtn = screen.getByRole('button', { name: /Hubungi Admin Akademik/i });
    fireEvent.click(contactBtn);
    expect(window.open).toHaveBeenCalled();

    window.open = originalOpen;
  });
});
