import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  calculateStudentMetrics,
  resolveStudentProfile,
  filterLearningMaterialsForStudent,
  recordStudentQuizPass,
  getStudentQuizPasses,
  getStudentCustomProfile,
  saveStudentCustomProfile,
} from '../utils/studentDataResolver';
import { StudentDashboard } from '../components/StudentDashboard';
import { ManagedStudent } from '../components/admin/studentData';
import { FirestoreTutorVisitDoc } from '../firebase';
import { LearningMaterial } from '../utils/learningMaterials';

describe('Student Data Resolver (TDD & SQA-ISTQB)', () => {
  const mockStudents: ManagedStudent[] = [
    {
      id: 'BF-2026-09-8492',
      studentName: 'Ahmad Faiz Al-Faruq',
      level: 'SD UMUM',
      grade: 'Kelas 4 SD',
      schoolOrigin: 'SD Islam Al-Azhar Magelang',
      parentName: 'Bambang Sulistyo',
      parentRelation: 'Ayah',
      whatsapp: '081234567890',
      address: 'Jl. Ahmad Yani No. 45, Kramat Selatan',
      district: 'Magelang Utara',
      tutorName: 'Kak Budi Santoso, S.Pd.',
      subjects: ['Matematika', 'IPA', 'Bahasa Inggris'],
      packageSessions: 16,
      completedSessions: 6,
      status: 'aktif',
      joinDate: '2026-09-01',
      lastEvaluationScore: 88,
    },
    {
      id: 'BF-2026-09-9999',
      studentName: 'Siswa Baru Belum Tutor',
      level: 'SMP',
      grade: 'Kelas 7 SMP',
      schoolOrigin: 'SMP N 1 Magelang',
      parentName: 'Ibu Rahayu',
      parentRelation: 'Ibu',
      whatsapp: '081299998888',
      address: 'Mertoyudan',
      district: 'Mertoyudan',
      tutorName: '',
      subjects: ['Matematika SMP'],
      packageSessions: 8,
      completedSessions: 0,
      status: 'aktif',
      joinDate: '2026-10-01',
    },
  ];

  const mockVisits: FirestoreTutorVisitDoc[] = [
    {
      id: 'visit-1',
      studentName: 'Ahmad Faiz Al-Faruq',
      level: 'SD UMUM',
      time: '13:30 - 14:40',
      status: 'selesai',
      address: 'Jl. Ahmad Yani No. 45',
      subject: 'Matematika: Pecahan Senilai',
      score: 90,
      focusRating: 5,
      independenceRating: 4,
      notes: 'Faiz sangat antusias dan memahami konsep pecahan dengan visual alat peraga.',
      tutorName: 'Kak Budi Santoso, S.Pd.',
      durationMinutes: 70,
      elapsedMinutes: 70,
      updatedAt: '2026-10-27T08:00:00.000Z',
    },
    {
      id: 'visit-2',
      studentName: 'Ahmad Faiz Al-Faruq',
      level: 'SD UMUM',
      time: '15:00 - 16:10',
      status: 'berlangsung',
      address: 'Jl. Ahmad Yani No. 45',
      subject: 'IPA: Sistem Pencernaan',
      tutorName: 'Kak Budi Santoso, S.Pd.',
      durationMinutes: 70,
      elapsedMinutes: 35,
      updatedAt: '2026-10-29T08:00:00.000Z',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-RES-001: resolves student profile by ID or studentName correctly', () => {
    const student = resolveStudentProfile('BF-2026-09-8492', 'Ahmad Faiz Al-Faruq', mockStudents);
    expect(student).not.toBeNull();
    expect(student?.studentName).toBe('Ahmad Faiz Al-Faruq');
    expect(student?.grade).toBe('Kelas 4 SD');
    expect(student?.schoolOrigin).toBe('SD Islam Al-Azhar Magelang');

    // Fallback if not registered in array
    const fallback = resolveStudentProfile('BF-UNKNOWN', 'Anak Baru', []);
    expect(fallback?.studentName).toBe('Anak Baru');
    expect(fallback?.id).toBe('BF-UNKNOWN');
  });

  it('TC-RES-002 (BVA & Formula): calculates deterministic XP accurately', () => {
    // Formula: (completedSessions * 100) + (avgScore * 5) + (passedQuizzesCount * 50)
    // completedSessions = 6, visits score = 90, lastEvaluation = 88 -> avgScore = 89
    // XP = (6 * 100) + (89 * 5) + (2 * 50) = 600 + 445 + 100 = 1145
    const metrics = calculateStudentMetrics(mockStudents[0], mockVisits, 2);
    expect(metrics.xpPoints).toBe(1145);
    expect(metrics.attendancePercentage).toBe(38); // 6 / 16 = 37.5% -> round to 38%
    expect(metrics.completedSessions).toBe(6);
    expect(metrics.packageSessions).toBe(16);
    expect(metrics.avgScore).toBe(89);
  });

  it('TC-RES-003: filters learning materials strictly matching student grade or level', () => {
    const materials: LearningMaterial[] = [
      {
        id: 'mat-sd-1',
        title: 'LKPD Matematika Pecahan Kelas 4',
        type: 'lembar_kerja',
        level: 'SD UMUM',
        subject: 'Matematika',
        category: 'sd',
        description: 'Latihan pecahan',
        status: 'disetujui',
        uploadedBy: 'Kak Budi',
        uploaderRole: 'tutor',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      },
      {
        id: 'mat-smp-1',
        title: 'Modul Aljabar SMP',
        type: 'modul_ajar',
        level: 'SMP',
        subject: 'Matematika SMP',
        category: 'smp',
        description: 'Aljabar',
        status: 'disetujui',
        uploadedBy: 'Kak Siti',
        uploaderRole: 'tutor',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      },
      {
        id: 'mat-sd-draft',
        title: 'Draft Belum Disetujui',
        type: 'lembar_kerja',
        level: 'SD UMUM',
        subject: 'IPA',
        category: 'sd',
        description: 'Draft',
        status: 'menunggu_review',
        uploadedBy: 'Kak Budi',
        uploaderRole: 'tutor',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      },
    ];

    const studentSD = mockStudents[0]; // SD UMUM, Kelas 4 SD
    const filtered = filterLearningMaterialsForStudent(studentSD, materials);

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('mat-sd-1');
  });

  it('TC-RES-004 (BVA & Integrity): records quiz pass only if score >= 70 and avoids duplicate spam', () => {
    const studentId = 'BF-2026-09-8492';
    const quizId = 'quiz-bab-pecahan';

    // Attempt 1: Failed score (60%) -> should NOT record pass
    const passResultFail = recordStudentQuizPass(studentId, quizId, 60);
    expect(passResultFail).toBe(false);
    expect(getStudentQuizPasses(studentId)).toEqual([]);

    // Attempt 2: Passing score (80%) -> records pass
    const passResultSuccess = recordStudentQuizPass(studentId, quizId, 80);
    expect(passResultSuccess).toBe(true);
    expect(getStudentQuizPasses(studentId)).toContain(quizId);

    // Attempt 3: Retake same quiz with 100% -> should not add duplicate
    const passResultDuplicate = recordStudentQuizPass(studentId, quizId, 100);
    expect(passResultDuplicate).toBe(false); // already passed
    expect(getStudentQuizPasses(studentId).length).toBe(1);
  });

  it('TC-RES-005: manages non-critical student profile fields (avatar, hobi, cita-cita)', () => {
    const studentId = 'BF-2026-09-8492';
    saveStudentCustomProfile(studentId, {
      avatarUrl: 'astronaut.png',
      dream: 'Ilmuwan Robotika & AI',
      hobby: 'Merakit Lego & Membaca Ensiklopedia Sains',
    });

    const custom = getStudentCustomProfile(studentId);
    expect(custom.dream).toBe('Ilmuwan Robotika & AI');
    expect(custom.hobby).toBe('Merakit Lego & Membaca Ensiklopedia Sains');
  });
});

describe('StudentDashboard Dynamic UI Integration (SQA-ISTQB)', () => {
  const mockStudents: ManagedStudent[] = [
    {
      id: 'BF-2026-09-8492',
      studentName: 'Ahmad Faiz Al-Faruq',
      level: 'SD UMUM',
      grade: 'Kelas 4 SD',
      schoolOrigin: 'SD Islam Al-Azhar Magelang',
      parentName: 'Bambang Sulistyo',
      parentRelation: 'Ayah',
      whatsapp: '081234567890',
      address: 'Jl. Ahmad Yani No. 45, Kramat Selatan',
      district: 'Magelang Utara',
      tutorName: 'Kak Budi Santoso, S.Pd.',
      subjects: ['Matematika', 'IPA'],
      packageSessions: 16,
      completedSessions: 6,
      status: 'aktif',
      joinDate: '2026-09-01',
      lastEvaluationScore: 88,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bright_future_managed_students_cache', JSON.stringify(mockStudents));
  });

  it('TC-UI-001: renders dynamic student identity, live tutor greeting, and metric cards', async () => {
    render(
      <StudentDashboard
        studentId="BF-2026-09-8492"
        studentName="Ahmad Faiz Al-Faruq"
        onLogout={vi.fn()}
        onViewLanding={vi.fn()}
      />
    );

    // Dynamic greeting with student name
    expect(screen.getAllByText(/Ahmad Faiz/i).length).toBeGreaterThan(0);
    // Tutor name
    expect(screen.getAllByText(/Kak Budi Santoso/i).length).toBeGreaterThan(0);
    // Grade & School
    expect(screen.getAllByText(/Kelas 4 SD/i).length).toBeGreaterThan(0);
  });

  it('TC-UI-002: switches tabs between the 7 core student tabs', async () => {
    render(
      <StudentDashboard
        studentId="BF-2026-09-8492"
        studentName="Ahmad Faiz Al-Faruq"
        onLogout={vi.fn()}
        onViewLanding={vi.fn()}
      />
    );

    // Switch to Jadwal & Visit Tutor
    const visitTabBtn = screen.getByTitle('Jadwal & Visit Tutor');
    fireEvent.click(visitTabBtn);
    expect(screen.getByRole('heading', { name: /Jadwal & Kunjungan Tutor/i })).toBeInTheDocument();

    // Switch to Kelas & Mata Pelajaran
    const classTabBtn = screen.getByTitle('Kelas & Mata Pelajaran');
    fireEvent.click(classTabBtn);
    expect(screen.getByRole('heading', { name: /Kelas & Mata Pelajaran Bimbel/i })).toBeInTheDocument();

    // Switch to Materi & LKPD
    const materialTabBtn = screen.getByTitle('Materi & LKPD Interaktif');
    fireEvent.click(materialTabBtn);
    expect(screen.getByRole('heading', { name: /Materi & LKPD Belajar/i })).toBeInTheDocument();

    // Switch to Presensi 70 Menit
    const attendanceTabBtn = screen.getByTitle('Presensi Belajar 70 Mnt');
    fireEvent.click(attendanceTabBtn);
    expect(screen.getByRole('heading', { name: /Presensi & Sesi Belajar 70 Menit/i })).toBeInTheDocument();

    // Switch to Nilai & Rapor
    const reportTabBtn = screen.getByTitle('Nilai & Rapor Belajar');
    fireEvent.click(reportTabBtn);
    expect(screen.getByRole('heading', { name: /Nilai & Rapor Evaluasi Belajar/i })).toBeInTheDocument();

    // Switch to Profil Siswa
    const profileTabBtn = screen.getByTitle('Profil Siswa');
    fireEvent.click(profileTabBtn);
    expect(screen.getByRole('heading', { name: /Profil & Identitas Siswa/i })).toBeInTheDocument();
  });

  it('TC-UI-003 (Empty State): shows friendly unassigned tutor state when tutor is empty', async () => {
    const unassignedStudents: ManagedStudent[] = [
      {
        id: 'BF-NEW-01',
        studentName: 'Rian Pratama',
        level: 'SD UMUM',
        grade: 'Kelas 3 SD',
        schoolOrigin: 'SD Mertoyudan',
        parentName: 'Ibu Linda',
        parentRelation: 'Ibu',
        whatsapp: '081233334444',
        address: 'Mertoyudan',
        district: 'Mertoyudan',
        tutorName: '', // Unassigned
        subjects: ['Matematika'],
        packageSessions: 8,
        completedSessions: 0,
        status: 'aktif',
        joinDate: '2026-10-28',
      },
    ];
    localStorage.setItem('bright_future_managed_students_cache', JSON.stringify(unassignedStudents));

    render(
      <StudentDashboard
        studentId="BF-NEW-01"
        studentName="Rian Pratama"
        onLogout={vi.fn()}
        onViewLanding={vi.fn()}
      />
    );

    expect(screen.getByText(/Tutor terbaikmu sedang disiapkan oleh Admin/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Hubungi Admin Bright Future/i })).toBeInTheDocument();
  });
});
