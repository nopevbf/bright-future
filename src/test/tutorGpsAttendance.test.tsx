import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorGpsAttendance } from '../components/tutor/TutorGpsAttendance';
import { FirestoreTutorVisitDoc, AssignedStudentSummary } from '../utils/tutorPairingResolver';

describe('TutorGpsAttendance Component (SQA-ISTQB & TDD)', { timeout: 15000 }, () => {
  const mockAssignedStudents: AssignedStudentSummary[] = [
    {
      studentId: 'student-01',
      id: 'student-01',
      studentName: 'Rayhan Kusuma',
      level: 'SD Kelas 5',
      parentName: 'Bapak Hendra',
      parentPhone: '081298765432',
      address: 'Jl. Mayor Unus No. 15, Mertoyudan',
      status: 'active',
    },
    {
      studentId: 'student-02',
      id: 'student-02',
      studentName: 'Kayla Pratama',
      level: 'SD Kelas 2',
      parentName: 'Ibu Santi',
      parentPhone: '081377889900',
      address: 'Jl. Pahlawan No. 42, Potrobangsan',
      status: 'active',
    },
  ];

  const mockVisits: FirestoreTutorVisitDoc[] = [
    {
      id: 'visit-1',
      studentName: 'Kevin Pratama',
      level: 'SD Kelas 4',
      time: '10:00 - 11:10 WIB',
      status: 'selesai',
      address: 'Jl. Pahlawan No. 42, Magelang Utara',
      subject: 'Materi Bab 3 Selesai',
    },
    {
      id: 'visit-2',
      studentName: 'Rayhan Kusuma',
      level: 'SD Kelas 5',
      time: '13:30 - 14:40 WIB',
      status: 'berlangsung',
      address: 'Jl. Mayor Unus No. 15, Mertoyudan',
      subject: 'Sains: Tata Surya & Gravitasi',
      elapsedMinutes: 45,
    },
    {
      id: 'visit-3',
      studentName: 'Kayla Pratama',
      level: 'SD Kelas 2',
      time: '15:30 - 16:40 WIB',
      status: 'berikutnya',
      address: 'Jl. Pahlawan No. 42, Potrobangsan',
      subject: 'Tematik: Flashcard Folklor',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-TGA-001: renders breadcrumb, headline without (70 Menit), and 4 KPI cards', () => {
    render(
      <TutorGpsAttendance
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    expect(screen.getByText('Portal Tutor')).toBeDefined();
    expect(screen.getByText('Presensi Kunjungan GPS')).toBeDefined();
    expect(screen.getByRole('heading', { name: /Presensi Kunjungan Rumah \(GPS Lapangan\)/i })).toBeDefined();

    // Verify no "(70 Menit)" label in headings or main texts
    expect(screen.queryByText(/\(70 Menit\)/i)).toBeNull();

    // Verify 4 KPI cards
    expect(screen.getByText('Presensi Hari Ini')).toBeDefined();
    expect(screen.getByText('Akurasi Geofence')).toBeDefined();
    expect(screen.getByText('Durasi Tatap Muka')).toBeDefined();
    expect(screen.getByText(/Sensor GPS Tutor/i)).toBeDefined();
  });

  it('TC-TGA-002: renders active session focus card with live timer and geofence badge', () => {
    render(
      <TutorGpsAttendance
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Active session details
    expect(screen.getByText('Sesi Aktif Saat Ini')).toBeDefined();
    expect(screen.getByText('Rayhan Kusuma')).toBeDefined();
    expect(screen.getByText(/Radius 8m • Geofence Sah/i)).toBeDefined();
    expect(screen.getByText(/Durasi Tatap Muka Berjalan/i)).toBeDefined();
  });

  it('TC-TGA-003: renders vector radar geofence visualizer with safe radius 50m and coordinates', () => {
    render(
      <TutorGpsAttendance
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    expect(screen.getByText(/Radar Geofence Rumah Siswa/i)).toBeDefined();
    expect(screen.getByText(/Radius Aman 50 Meter/i)).toBeDefined();
    expect(screen.getByText(/Lat -7.50241, Long 110.21915/i)).toBeDefined();
  });

  it('TC-TGA-004: opens photo upload modal and reflection notes modal', () => {
    render(
      <TutorGpsAttendance
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Click upload photo button
    const photoBtn = screen.getByRole('button', { name: /Unggah Foto Sesi/i });
    fireEvent.click(photoBtn);
    expect(screen.getByRole('heading', { name: /Unggah Bukti Foto Sesi Belajar/i })).toBeDefined();

    // Close photo modal
    const closePhotoBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(closePhotoBtn);
    expect(screen.queryByRole('heading', { name: /Unggah Bukti Foto Sesi Belajar/i })).toBeNull();

    // Click reflection button
    const reflectionBtn = screen.getByRole('button', { name: /Catat Refleksi Singkat/i });
    fireEvent.click(reflectionBtn);
    expect(screen.getByRole('heading', { name: /Catat Refleksi & Evaluasi Siswa/i })).toBeDefined();
  });

  it('TC-TGA-005: triggers checkout callback on checkout button click', () => {
    const checkoutMock = vi.fn();
    render(
      <TutorGpsAttendance
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
        onCheckoutSession={checkoutMock}
      />
    );

    const checkoutBtn = screen.getByRole('button', { name: /Check-Out Sesi Kunjungan/i });
    fireEvent.click(checkoutBtn);

    expect(checkoutMock).toHaveBeenCalledWith('visit-2');
  });

  it('TC-TGA-006: handles empty visits boundary condition cleanly', () => {
    render(
      <TutorGpsAttendance
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={[]}
        visits={[]}
      />
    );

    expect(screen.getByText(/Belum Ada Sesi Kunjungan Aktif/i)).toBeDefined();
  });
});
