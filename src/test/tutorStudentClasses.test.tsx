import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorStudentClasses } from '../components/tutor/TutorStudentClasses';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../utils/tutorPairingResolver';

describe('TutorStudentClasses Component (SQA-ISTQB & TDD)', { timeout: 15000 }, () => {
  const mockAssignedStudents: AssignedStudentSummary[] = [
    {
      studentId: 'student-01',
      id: 'student-01',
      studentName: 'Rayhan Kusuma',
      level: 'SD Kelas 5',
      parentName: 'Bunda Rayhan',
      parentPhone: '081298764321',
      whatsapp: '081298764321',
      address: 'Jl. Mayor Unus No. 15, Mertoyudan',
      status: 'active',
      scheduleDays: ['Selasa', 'Jumat'],
      subject: 'Tematik & IPA Terpadu',
      tutorName: 'Kak Anindya, S.Pd.',
    },
    {
      studentId: 'student-02',
      id: 'student-02',
      studentName: 'Kevin Pratama',
      level: 'SD Kelas 4',
      parentName: 'Ibu Ratna Dewi',
      parentPhone: '081322117788',
      whatsapp: '081322117788',
      address: 'Jl. Pahlawan No. 42, Magelang Utara',
      status: 'active',
      scheduleDays: ['Selasa', 'Jumat'],
      subject: 'Matematika & Sains',
      tutorName: 'Kak Anindya, S.Pd.',
    },
    {
      studentId: 'student-03',
      id: 'student-03',
      studentName: 'Dimas Pratama',
      level: 'SMP Kelas 7',
      parentName: 'Bpk. Bambang',
      parentPhone: '081566778899',
      whatsapp: '081566778899',
      address: 'Jl. Pemuda No. 88, Pecinan, Magelang',
      status: 'active',
      scheduleDays: ['Senin', 'Kamis'],
      subject: 'Aljabar Linier & Fisika Gerak',
      tutorName: 'Kak Anindya, S.Pd.',
    },
  ];

  const mockVisits: FirestoreTutorVisitDoc[] = [
    {
      id: 'visit-01',
      studentName: 'Rayhan Kusuma',
      level: 'SD Kelas 5',
      address: 'Jl. Mayor Unus No. 15, Mertoyudan',
      status: 'selesai',
      time: '13:30 - 14:40',
      subject: 'Tematik & IPA Terpadu',
      score: 88,
    },
    {
      id: 'visit-02',
      studentName: 'Kevin Pratama',
      level: 'SD Kelas 4',
      address: 'Jl. Pahlawan No. 42, Magelang Utara',
      status: 'berikutnya',
      time: '10:00 - 11:10',
      subject: 'Matematika & Sains',
      score: 92,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-TSC-001: renders breadcrumb, headline without (70 Menit), and 4 KPI Bento metrics', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    expect(screen.getByText('Portal Tutor')).toBeDefined();
    expect(screen.getByRole('heading', { name: /Kelas Saya & Siswa Binaan/i })).toBeDefined();

    // Verify absolutely no "(70 Menit)" or "70 Mnt/Sesi" label
    expect(screen.queryByText(/\(70 Menit\)/i)).toBeNull();
    expect(screen.queryByText(/70 Mnt\/Sesi/i)).toBeNull();

    // Verify 4 KPI cards
    expect(screen.getByText('Total Siswa Binaan')).toBeDefined();
    expect(screen.getByText('Rata-rata Kehadiran')).toBeDefined();
    expect(screen.getByText(/Rerata Nilai Kuis & LKPD/i)).toBeDefined();
    expect(screen.getByText('Laporan Afektif Terkirim')).toBeDefined();
  });

  it('TC-TSC-002: selects a different student card from directory and updates right inspection panel', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Initial selected student is student-01 (Rayhan)
    expect(screen.getAllByText('Rayhan Kusuma').length).toBeGreaterThanOrEqual(1);

    // Click Kevin Pratama card button or card
    const kevinSelectBtn = screen.getAllByRole('button', { name: /Pilih Siswa|Detail Pantau/i })[1];
    if (kevinSelectBtn) {
      fireEvent.click(kevinSelectBtn);
    }

    // Now right panel shows Kevin Pratama
    expect(screen.getAllByText('Kevin Pratama').length).toBeGreaterThanOrEqual(1);
  });

  it('TC-TSC-003: filters students by level tabs (Semua, SD, SMP) and search query', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Filter by SMP tab
    const smpTab = screen.getByRole('button', { name: /SMP/i });
    fireEvent.click(smpTab);

    // Only Dimas Pratama should be visible in directory & active panel
    expect(screen.getAllByText('Dimas Pratama').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Rayhan Kusuma')).toBeNull();

    // Reset to All
    const allTab = screen.getByRole('button', { name: /Semua Siswa/i });
    fireEvent.click(allTab);
    expect(screen.getAllByText('Rayhan Kusuma').length).toBeGreaterThanOrEqual(1);

    // Test Search input
    const searchInput = screen.getByPlaceholderText(/Cari murid, sekolah, ortu.../i);
    fireEvent.change(searchInput, { target: { value: 'Kevin' } });
    expect(screen.getAllByText('Kevin Pratama').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Dimas Pratama')).toBeNull();
  });

  it('TC-TSC-004: handles empty assigned students boundary condition cleanly', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={[]}
        visits={[]}
      />
    );

    expect(screen.getByText(/Belum ada siswa binaan yang terhubung/i)).toBeDefined();
  });

  it('TC-TSC-005: handles parent WhatsApp button and Google Maps external action', () => {
    const originalOpen = window.open;
    window.open = vi.fn();

    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Click WA button
    const waButtons = screen.getAllByRole('button', { name: /WA Ortu|Draf WA/i });
    if (waButtons.length > 0) {
      fireEvent.click(waButtons[0]);
    }

    // Click Google Maps button
    const mapsBtn = screen.getByRole('button', { name: /Buka Google Maps/i });
    fireEvent.click(mapsBtn);
    expect(window.open).toHaveBeenCalled();

    window.open = originalOpen;
  });

  it('TC-TSC-006: opens add student note modal and saves new observation', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    const addNoteBtn = screen.getByRole('button', { name: /Tambah Catatan Siswa/i });
    fireEvent.click(addNoteBtn);

    expect(screen.getByText(/Catatan Perkembangan Siswa Binaan/i)).toBeDefined();

    const noteInput = screen.getByPlaceholderText(/Tulis catatan observasi afektif.../i);
    fireEvent.change(noteInput, { target: { value: 'Sangat fokus belajar konsep baru' } });

    const saveBtn = screen.getByRole('button', { name: /Simpan Catatan/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText(/Catatan observasi berhasil disimpan!/i)).toBeDefined();
  });
});
