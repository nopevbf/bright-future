import { describe, it, expect } from 'vitest';
import {
  buildTutorVisitsFromAssignedStudents,
  AssignedStudentSummary,
} from '../utils/tutorPairingResolver';
import { FirestoreTutorVisitDoc } from '../firebase';

describe('SQA-ISTQB: Tutor Route Dynamic Synchronization & Dummy Data Removal', () => {
  const sampleAssignedStudents: AssignedStudentSummary[] = [
    {
      studentId: 'BF-2026-09-8812',
      studentName: 'Rayhan Kusuma',
      level: 'SD',
      grade: 'Kelas 5 SD',
      district: 'Mertoyudan',
      address: 'Jl. Mayor Unus No. 15, Mertoyudan',
      parentName: 'Bunda Ratna Dewi',
      whatsapp: '081298765432',
      schedule: ['Kamis 13:30', 'Sabtu 15:30'],
      subjects: ['IPAS: Tata Surya & Gravitasi'],
      status: 'aktif',
    },
    {
      studentId: 'BF-2026-09-9011',
      studentName: 'Kayla Kusuma',
      level: 'CALISTUNG',
      grade: 'Kelas 2 SD',
      district: 'Mertoyudan',
      address: 'Jl. Mayor Unus No. 15, Mertoyudan',
      parentName: 'Bunda Ratna Dewi',
      whatsapp: '081298765432',
      schedule: ['Kamis 15:30'],
      subjects: ['Calistung Fonik & Membaca'],
      status: 'aktif',
    },
  ];

  // TC-RT-01: Rute bimbingan murni mencerminkan siswa binaan dari database
  it('TC-RT-01: harus membangun rute kunjungan murni dari siswa binaan tanpa menyisipkan data dummy', () => {
    const visits = buildTutorVisitsFromAssignedStudents(sampleAssignedStudents);

    expect(visits.length).toBe(2);
    expect(visits[0].studentName).toBe('Rayhan Kusuma');
    expect(visits[0].address).toBe('Jl. Mayor Unus No. 15, Mertoyudan');
    expect(visits[0].subject).toBe('IPAS: Tata Surya & Gravitasi');
    expect(visits[0].time).toContain('13:30');

    expect(visits[1].studentName).toBe('Kayla Kusuma');
    expect(visits[1].subject).toBe('Calistung Fonik & Membaca');
    expect(visits[1].time).toContain('15:30');
  });

  // TC-RT-02: Pembersihan total data dummy saat tutor memiliki 0 siswa binaan
  it('TC-RT-02: harus mengembalikan array kosong bila tutor belum memiliki siswa binaan (tanpa data dummy)', () => {
    const emptyAssigned: AssignedStudentSummary[] = [];
    const visits = buildTutorVisitsFromAssignedStudents(emptyAssigned);

    expect(visits).toEqual([]);
    expect(visits.length).toBe(0);
  });

  // TC-RT-03: Menjaga catatan evaluasi/skor sesi yang sudah pernah disimpan di database
  it('TC-RT-03: harus memelihara evaluasi dan skor sesi yang sudah ada di database', () => {
    const existingSavedVisits: FirestoreTutorVisitDoc[] = [
      {
        id: 'visit-BF-2026-09-8812',
        studentName: 'Rayhan Kusuma',
        level: 'SD 5',
        time: '13:30 WIB',
        status: 'selesai',
        address: 'Jl. Mayor Unus No. 15, Mertoyudan',
        subject: 'IPAS: Tata Surya & Gravitasi',
        score: 95,
        focusRating: 5.0,
        independenceRating: 5.0,
        notes: 'Sangat fokus dan mandiri.',
        parentName: 'Bunda Ratna Dewi',
        parentWa: '081298765432',
        durationMinutes: 70,
        elapsedMinutes: 70,
      },
    ];

    const visits = buildTutorVisitsFromAssignedStudents(sampleAssignedStudents, existingSavedVisits);

    expect(visits.length).toBe(2);
    const rayhanVisit = visits.find((v) => v.studentName === 'Rayhan Kusuma');
    expect(rayhanVisit).toBeDefined();
    expect(rayhanVisit?.status).toBe('selesai');
    expect(rayhanVisit?.score).toBe(95);
    expect(rayhanVisit?.notes).toBe('Sangat fokus dan mandiri.');

    // Kayla belum ada di existing, status default
    const kaylaVisit = visits.find((v) => v.studentName === 'Kayla Kusuma');
    expect(kaylaVisit).toBeDefined();
    expect(kaylaVisit?.status).toBe('berikutnya');
  });

  // TC-RT-04: Format jam dan jadwal dinamis
  it('TC-RT-04: harus mengatur waktu kunjungan berurutan secara dinamis jika schedule tidak spesifik', () => {
    const studentsWithoutSchedule: AssignedStudentSummary[] = [
      {
        studentId: 'STU-01',
        studentName: 'Siswa Satu',
        level: 'SD',
      },
      {
        studentId: 'STU-02',
        studentName: 'Siswa Dua',
        level: 'SMP',
      },
    ];

    const visits = buildTutorVisitsFromAssignedStudents(studentsWithoutSchedule);
    expect(visits.length).toBe(2);
    expect(visits[0].time).toBeDefined();
    expect(visits[1].time).toBeDefined();
    expect(visits[0].time).not.toBe(visits[1].time);
  });
});
