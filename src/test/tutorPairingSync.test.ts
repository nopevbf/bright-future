import { describe, it, expect } from 'vitest';
import {
  resolveStudentsForTutor,
  resolveTutorForStudent,
  calculateTutorLoadLabel,
} from '../utils/tutorPairingResolver';
import { ManagedStudent } from '../types';
import { FirestoreTutorAssignmentDoc } from '../firebase';

describe('SQA-ISTQB: Tutor-Student Pairing Synchronization', () => {
  const sampleManagedStudents: ManagedStudent[] = [
    {
      id: 'BF-2026-09-8812',
      studentName: 'Rayhan Kusuma',
      level: 'SD',
      grade: 'Kelas 5 SD',
      schoolOrigin: 'SD Mertoyudan 1',
      parentName: 'Bunda Ratna Dewi',
      parentRelation: 'Ibu',
      whatsapp: '081298765432',
      address: 'Mertoyudan, Magelang',
      district: 'Mertoyudan',
      tutorName: 'Kak Anindya, S.Pd.',
      subjects: ['IPAS Terpadu', 'Matematika'],
      packageSessions: 8,
      completedSessions: 2,
      status: 'aktif',
      joinDate: '2026-09-01',
    },
    {
      id: 'BF-2026-09-8492',
      studentName: 'Kevin Pratama',
      level: 'SD',
      grade: 'Kelas 4 SD',
      schoolOrigin: 'SD Magelang 3',
      parentName: 'Ibu Deasy',
      parentRelation: 'Ibu',
      whatsapp: '085173230198',
      address: 'Kramat Selatan, Magelang Utara',
      district: 'Magelang Utara',
      tutorName: 'Kak Dimas Arya, S.Si.',
      subjects: ['Matematika Dasar'],
      packageSessions: 8,
      completedSessions: 1,
      status: 'aktif',
      joinDate: '2026-09-02',
    },
    {
      id: 'BF-2026-09-9011',
      studentName: 'Kayla Kusuma',
      level: 'CALISTUNG',
      grade: 'Kelas 2 SD',
      schoolOrigin: 'SD Mertoyudan 1',
      parentName: 'Bunda Ratna Dewi',
      parentRelation: 'Ibu',
      whatsapp: '081298765432',
      address: 'Mertoyudan, Magelang',
      district: 'Mertoyudan',
      tutorName: 'Kak Anindya, S.Pd.',
      subjects: ['Calistung Fonik'],
      packageSessions: 8,
      completedSessions: 4,
      status: 'aktif',
      joinDate: '2026-09-05',
    },
  ];

  const sampleAssignments: FirestoreTutorAssignmentDoc[] = [
    {
      id: 'BF-2026-09-8812',
      studentId: 'BF-2026-09-8812',
      studentName: 'Rayhan Kusuma',
      tutorName: 'Kak Anindya, S.Pd.',
      tutorPhone: '085173230198',
      district: 'Mertoyudan',
      level: 'SD',
      grade: 'Kelas 5 SD',
      address: 'Mertoyudan',
      parentName: 'Bunda Ratna Dewi',
      whatsapp: '081298765432',
      subjects: ['IPAS Terpadu'],
      schedule: ['Kamis 13:30'],
      status: 'aktif',
      assignedAt: '2026-09-20T10:00:00.000Z',
    },
  ];

  // TC-PAIR-01: Perhitungan beban tutor dinamis
  it('TC-PAIR-01: harus menghitung beban aktif dan daftar siswa untuk tutor yang dipasangkan', () => {
    const studentsForAnindya = resolveStudentsForTutor(
      'Kak Anindya, S.Pd.',
      sampleManagedStudents,
      sampleAssignments
    );

    expect(studentsForAnindya.length).toBe(2);
    expect(studentsForAnindya.map((s) => s.studentName)).toContain('Rayhan Kusuma');
    expect(studentsForAnindya.map((s) => s.studentName)).toContain('Kayla Kusuma');

    const loadLabel = calculateTutorLoadLabel(studentsForAnindya.length);
    expect(loadLabel).toBe('2 Siswa Aktif');
  });

  // TC-PAIR-02: Tutor baru tanpa siswa binaan
  it('TC-PAIR-02: harus mengembalikan 0 siswa dan label siap penugasan bila tutor belum dipasangkan', () => {
    const studentsForNewTutor = resolveStudentsForTutor(
      'Kak Siti Rahma, S.Pd.',
      sampleManagedStudents,
      sampleAssignments
    );

    expect(studentsForNewTutor.length).toBe(0);
    const loadLabel = calculateTutorLoadLabel(studentsForNewTutor.length);
    expect(loadLabel).toBe('Siap Penugasan Baru');
  });

  // TC-PAIR-03: Pencarian toleran huruf besar/kecil (case-insensitive & trim)
  it('TC-PAIR-03: harus mencocokkan nama tutor secara case-insensitive dan tanpa terpengaruh spasi', () => {
    const students = resolveStudentsForTutor(
      '  kak dimas arya, s.si.  ',
      sampleManagedStudents,
      sampleAssignments
    );

    expect(students.length).toBe(1);
    expect(students[0].studentName).toBe('Kevin Pratama');
  });

  // TC-PAIR-04: Resolver tutor untuk siswa (Portal Siswa & Orang Tua)
  it('TC-PAIR-04: harus menyelesaikan nama tutor pendamping resmi berdasarkan studentId atau studentName', () => {
    // By student ID
    const tutorForRayhanById = resolveTutorForStudent(
      'BF-2026-09-8812',
      sampleManagedStudents,
      sampleAssignments
    );
    expect(tutorForRayhanById).not.toBeNull();
    expect(tutorForRayhanById?.tutorName).toBe('Kak Anindya, S.Pd.');

    // By student name
    const tutorForKevinByName = resolveTutorForStudent(
      'Kevin Pratama',
      sampleManagedStudents,
      sampleAssignments
    );
    expect(tutorForKevinByName).not.toBeNull();
    expect(tutorForKevinByName?.tutorName).toBe('Kak Dimas Arya, S.Si.');
  });

  // TC-PAIR-05: Siswa belum dipasangkan tutor
  it('TC-PAIR-05: harus mengembalikan null bila siswa belum memiliki penugasan tutor', () => {
    const tutorForUnassigned = resolveTutorForStudent(
      'Siswa Tanpa Tutor',
      sampleManagedStudents,
      sampleAssignments
    );
    expect(tutorForUnassigned).toBeNull();
  });
});
