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
      parentName: 'Bunda Rayhan (Ibu Rahma)',
      parentPhone: '081298764321',
      whatsapp: '081298764321',
      address: 'Perum Mertoyudan Indah Blok C2',
      status: 'active',
      scheduleDays: ['Senin', 'Kamis'],
      subject: 'IPAS Sains & Pemecahan Masalah Matematika',
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
      address: 'Jl. Pahlawan No. 45, Magelang Tengah',
      status: 'active',
      scheduleDays: ['Selasa', 'Jumat'],
      subject: 'Matematika & Sains',
      tutorName: 'Kak Anindya, S.Pd.',
    },
    {
      studentId: 'student-03',
      id: 'student-03',
      studentName: 'Kayla Pratama',
      level: 'SD Kelas 2',
      parentName: 'Ibu Ratna Dewi',
      parentPhone: '081322117788',
      whatsapp: '081322117788',
      address: 'Gg. Cempaka II, Magelang Utara',
      status: 'active',
      scheduleDays: ['Selasa', 'Jumat'],
      subject: 'Tematik & Literasi',
      tutorName: 'Kak Anindya, S.Pd.',
    },
    {
      studentId: 'student-04',
      id: 'student-04',
      studentName: 'Dimas Pratama',
      level: 'SMP Kelas 7',
      parentName: 'Bpk. Bambang',
      parentPhone: '081566778899',
      whatsapp: '081566778899',
      address: 'Jl. Tidar Indah No. 8, Magelang Selatan',
      status: 'active',
      scheduleDays: ['Rabu', 'Sabtu'],
      subject: 'Aljabar Linier & Fisika Gerak',
      tutorName: 'Kak Anindya, S.Pd.',
    },
  ];

  const mockVisits: FirestoreTutorVisitDoc[] = [
    {
      id: 'visit-01',
      studentName: 'Rayhan Kusuma',
      level: 'SD Kelas 5',
      address: 'Perum Mertoyudan Indah Blok C2',
      status: 'selesai',
      time: '13:30 - 14:40 WIB',
      subject: 'IPAS Sains & Pemecahan Masalah Matematika',
      score: 89,
    },
    {
      id: 'visit-02',
      studentName: 'Kevin Pratama',
      level: 'SD Kelas 4',
      address: 'Jl. Pahlawan No. 45, Magelang Tengah',
      status: 'berlangsung',
      time: '10:00 - 11:10 WIB',
      subject: 'Matematika & Sains',
      score: 92,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-TSC-001: renders breadcrumb, headline without (70 Menit), and 4 Bento KPI metrics', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    expect(screen.getByText('Portal Tutor')).toBeDefined();
    expect(screen.getByRole('heading', { name: /Data & Portofolio Siswa Binaan/i })).toBeDefined();

    // Verify absolutely no "(70 Menit)" or "70 Mnt" label
    expect(screen.queryByText(/\(70 Menit\)/i)).toBeNull();
    expect(screen.queryByText(/70 Mnt/i)).toBeNull();

    // Verify 4 KPI cards
    expect(screen.getByText('Total Siswa Binaan')).toBeDefined();
    expect(screen.getByText(/Rata-Rata Karakter Afektif/i)).toBeDefined();
    expect(screen.getByText(/Fokus Bebas Gawai/i)).toBeDefined();
    expect(screen.getByText(/Kunjungan Pekan Ini/i)).toBeDefined();
  });

  it('TC-TSC-002: selects a different student card from master list and updates right detail panel', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Initial selected student is Rayhan Kusuma
    expect(screen.getAllByText('Rayhan Kusuma').length).toBeGreaterThanOrEqual(1);

    // Click Kevin Pratama card in master list
    const kevinCard = screen.getAllByText('Kevin Pratama')[0];
    fireEvent.click(kevinCard);

    // Now right detail panel updates to Kevin Pratama
    expect(screen.getAllByText('Kevin Pratama').length).toBeGreaterThanOrEqual(1);
  });

  it('TC-TSC-003: switches segmented tabs (Afektif, Kognitif, Riwayat)', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Default tab is Perkembangan Afektif & Karakter
    expect(screen.getByText(/5 Pilar Karakter Lapangan/i)).toBeDefined();

    // Click tab Rekap Nilai & LKPD Kognitif
    const kognitifTab = screen.getByRole('button', { name: /Rekap Nilai & LKPD Kognitif/i });
    fireEvent.click(kognitifTab);
    expect(screen.getByText(/Capaian Materi & Nilai LKPD/i)).toBeDefined();

    // Click tab Riwayat Kunjungan & Presensi
    const riwayatTab = screen.getByRole('button', { name: /Riwayat Kunjungan & Presensi/i });
    fireEvent.click(riwayatTab);
    expect(screen.getByText(/Log Presensi Tatap Muka/i)).toBeDefined();
  });

  it('TC-TSC-004: filters students by search input and level dropdown', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
      />
    );

    // Test Search input
    const searchInput = screen.getByPlaceholderText(/Cari nama siswa, sekolah, alamat/i);
    fireEvent.change(searchInput, { target: { value: 'Dimas' } });

    expect(screen.getAllByText('Dimas Pratama').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Rayhan Kusuma')).toBeNull();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getAllByText('Rayhan Kusuma').length).toBeGreaterThanOrEqual(1);
  });

  it('TC-TSC-005: handles parent WhatsApp action and route schedule button', () => {
    const originalOpen = window.open;
    window.open = vi.fn();
    const handleNavigateTab = vi.fn();

    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockAssignedStudents}
        visits={mockVisits}
        onNavigateTab={handleNavigateTab}
      />
    );

    // Click WhatsApp button
    const waButton = screen.getByRole('link', { name: /Hubungi Bunda via WA/i });
    expect(waButton.getAttribute('href')).toContain('https://wa.me/6281298764321');

    // Click route schedule button
    const routeButton = screen.getByRole('button', { name: /Buka Jadwal Rute/i });
    fireEvent.click(routeButton);
    expect(handleNavigateTab).toHaveBeenCalledWith('jadwal-visit-rumah');

    window.open = originalOpen;
  });

  it('TC-TSC-006: handles empty assigned students boundary condition cleanly', () => {
    render(
      <TutorStudentClasses
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={[]}
        visits={[]}
      />
    );

    expect(screen.getByText(/Belum ada siswa binaan yang terhubung/i)).toBeDefined();
  });
});
