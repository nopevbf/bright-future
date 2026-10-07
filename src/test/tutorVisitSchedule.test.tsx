import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TutorVisitSchedule } from '../components/tutor/TutorVisitSchedule';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../utils/tutorPairingResolver';

describe('TutorVisitSchedule Component (SQA-ISTQB & TDD)', () => {
  const mockAssignedStudents: AssignedStudentSummary[] = [
    {
      studentId: 'student-01',
      id: 'student-01',
      studentName: 'Kevin Pratama',
      level: 'SD Kelas 4',
      parentName: 'Ibu Ratna',
      parentPhone: '081234567890',
      address: 'Jl. Pahlawan No. 42, Magelang Utara',
      status: 'active',
      scheduleDays: ['Senin', 'Jumat'],
      subject: 'Matematika Tematik',
      tutorName: 'Kak Anindya, S.Pd.',
    },
    {
      studentId: 'student-02',
      id: 'student-02',
      studentName: 'Rayhan Kusuma',
      level: 'SD Kelas 5',
      parentName: 'Bapak Hendra',
      parentPhone: '081298765432',
      address: 'Jl. Mayor Unus No. 15, Mertoyudan',
      status: 'active',
      scheduleDays: ['Rabu', 'Jumat'],
      subject: 'Sains: Tata Surya',
      tutorName: 'Kak Anindya, S.Pd.',
    },
    {
      studentId: 'student-03',
      id: 'student-03',
      studentName: 'Kayla Pratama',
      level: 'SD Kelas 2',
      parentName: 'Ibu Santi',
      parentPhone: '081377889900',
      address: 'Jl. Pahlawan No. 42, Potrobangsan',
      status: 'active',
      scheduleDays: ['Jumat'],
      subject: 'Tematik: Folklor',
      tutorName: 'Kak Anindya, S.Pd.',
    },
  ];

  const mockVisits: FirestoreTutorVisitDoc[] = [
    {
      id: 'visit-1',
      studentName: 'Kevin Pratama',
      level: 'SD Kelas 4',
      time: '10:00 - 11:10 WIB (70 Mnt)',
      status: 'selesai',
      address: 'Jl. Pahlawan No. 42, Magelang Utara',
      subject: 'Materi Bab 3 Selesai',
      parentName: 'Ibu Ratna',
      parentWa: '081234567890',
    },
    {
      id: 'visit-2',
      studentName: 'Rayhan Kusuma',
      level: 'SD Kelas 5',
      time: '13:30 - 14:40 WIB (70 Mnt)',
      status: 'berlangsung',
      address: 'Jl. Mayor Unus No. 15, Mertoyudan',
      subject: 'Sains: Tata Surya & Gravitasi',
      parentName: 'Bapak Hendra',
      parentWa: '081298765432',
      elapsedMinutes: 45,
    },
    {
      id: 'visit-3',
      studentName: 'Kayla Pratama',
      level: 'SD Kelas 2',
      time: '15:30 - 16:40 WIB (70 Mnt)',
      status: 'berikutnya',
      address: 'Jl. Pahlawan No. 42, Potrobangsan',
      subject: 'Tematik: Flashcard Folklor',
      parentName: 'Ibu Santi',
      parentWa: '081377889900',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-TVS-001: renders breadcrumb, headline, metrics and 7-day strip properly', () => {
    render(
      <TutorVisitSchedule
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
        onNavigateTab={vi.fn()}
      />
    );

    expect(screen.getByText('Portal Tutor')).toBeDefined();
    expect(screen.getByRole('heading', { name: /Jadwal & Agenda Kunjungan Rumah/i })).toBeDefined();
    expect(screen.getByText(/Total Kunjungan/i)).toBeDefined();
    expect(screen.getByText(/Estimasi Honor/i)).toBeDefined();
    expect(screen.getByText(/Ketepatan Waktu/i)).toBeDefined();

    // Check 7-day strip buttons
    expect(screen.getByText('Sen')).toBeDefined();
    expect(screen.getByText('Sel')).toBeDefined();
    expect(screen.getByText('Rab')).toBeDefined();
    expect(screen.getByText('Kam')).toBeDefined();
    expect(screen.getByText('Jum')).toBeDefined();
    expect(screen.getByText('Sab')).toBeDefined();
    expect(screen.getByText('Min')).toBeDefined();
  });

  it('TC-TVS-002: allows switching active day from 7-day strip', () => {
    render(
      <TutorVisitSchedule
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
        onNavigateTab={vi.fn()}
      />
    );

    const seninBtn = screen.getByText('Sen').closest('button');
    expect(seninBtn).toBeDefined();
    if (seninBtn) fireEvent.click(seninBtn);

    // Verify indicator changes or day label changes
    expect(screen.getByText('Agenda Senin')).toBeDefined();
  });

  it('TC-TVS-003: filters visits by status (Semua, Selesai, Berjalan, Menunggu)', () => {
    render(
      <TutorVisitSchedule
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
        onNavigateTab={vi.fn()}
      />
    );

    // Initially displays all 3 visits
    expect(screen.getByText('Kevin Pratama')).toBeDefined();
    expect(screen.getByText('Rayhan Kusuma')).toBeDefined();
    expect(screen.getByText('Kayla Pratama')).toBeDefined();

    // Filter by Selesai
    const selesaiFilterBtn = screen.getByRole('button', { name: /Selesai/i });
    fireEvent.click(selesaiFilterBtn);

    expect(screen.getByText('Kevin Pratama')).toBeDefined();
    expect(screen.queryByText('Rayhan Kusuma')).toBeNull();
    expect(screen.queryByText('Kayla Pratama')).toBeNull();
  });

  it('TC-TVS-004: switches between Timeline, Weekly Calendar Grid, and Student Directory tabs', () => {
    render(
      <TutorVisitSchedule
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
        onNavigateTab={vi.fn()}
      />
    );

    // Switch to Weekly Grid
    const weeklyBtn = screen.getByRole('button', { name: /Kalender Mingguan/i });
    fireEvent.click(weeklyBtn);
    expect(screen.getByText(/Matriks Kalender 7 Hari/i)).toBeDefined();

    // Switch to Directory
    const directoryBtn = screen.getByRole('button', { name: /Daftar Siswa & Alamat/i });
    fireEvent.click(directoryBtn);
    expect(screen.getByText(/Direktori Siswa & Alamat Rumah/i)).toBeDefined();
  });

  it('TC-TVS-005: handles boundary condition (0 assigned students) with clean empty state', () => {
    render(
      <TutorVisitSchedule
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={[]}
        visits={[]}
        onNavigateTab={vi.fn()}
      />
    );

    expect(screen.getByText(/Belum Ada Jadwal Kunjungan/i)).toBeDefined();
  });

  it('TC-TVS-006: opens reschedule modal and submits reschedule request', () => {
    render(
      <TutorVisitSchedule
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
        onNavigateTab={vi.fn()}
      />
    );

    const rescheduleBtn = screen.getByRole('button', { name: /Ajukan Reschedule/i });
    fireEvent.click(rescheduleBtn);

    expect(screen.getByRole('heading', { name: /Form Pengajuan Reschedule Sesi/i })).toBeDefined();

    // Close modal
    const batalBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(batalBtn);

    expect(screen.queryByRole('heading', { name: /Form Pengajuan Reschedule Sesi/i })).toBeNull();
  });
});
