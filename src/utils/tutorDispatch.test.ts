import { describe, it, expect } from 'vitest';
import {
  calculateDistrictDistanceKm,
  calculateTutorMatchScore,
  rankTutorsForStudent,
  generateTutorDispatchWhatsAppUrl,
  generateParentDispatchConfirmationWhatsAppUrl,
  DispatchableStudent,
  DispatchableTutor,
} from './tutorDispatch';

describe('Smart Tutor Dispatch & Pairing System (SQA-ISTQB & TDD)', () => {
  // Test Data Fixtures
  const studentMertoyudanSD: DispatchableStudent = {
    id: 'BF-2026-09-8496',
    studentName: 'Adelia Putri Wardani',
    level: 'SD UMUM',
    grade: 'Kelas 5 SD',
    district: 'Mertoyudan',
    address: 'Perum Lembah Hijau Blok C-12, Mertoyudan',
    whatsapp: '085712345678',
    parentName: 'Ibu Ratna Dewi',
    subjects: ['Matematika', 'IPAS'],
    selectedSchedule: ['Senin 15:30', 'Kamis 15:30'],
  };

  const studentSecangCalistung: DispatchableStudent = {
    id: 'BF-2026-09-8500',
    studentName: 'Zahra Amelia',
    level: 'Calistung',
    grade: 'TK B / Transisi SD',
    district: 'Secang',
    address: 'Dusun Krajan RT 01/RW 01, Secang',
    whatsapp: '085290112233',
    parentName: 'Ibu Fatimah Az-Zahra',
    subjects: ['Fonik Membaca', 'Menulis Halus'],
  };

  const candidateTutors: DispatchableTutor[] = [
    {
      id: 'TUTOR-01',
      name: 'Kak Anindya, S.Pd.',
      district: 'Mertoyudan',
      spec: 'SD UMUM & Matematika',
      univ: 'Pendidikan Matematika UNY',
      status: 'Tersedia',
    },
    {
      id: 'TUTOR-02',
      name: 'Kak Siti Rahma, S.Pd.',
      district: 'Secang',
      spec: 'Calistung Fonik & SD Kelas Rendah',
      univ: 'PGSD Universitas Muhammadiyah Magelang',
      status: 'Tersedia',
    },
    {
      id: 'TUTOR-03',
      name: 'Kak Sarah Larasati, M.Pd.',
      district: 'Magelang Utara',
      spec: 'Literasi & UTBK SMA',
      univ: 'Magister Bahasa UNS',
      status: 'Tersedia',
    },
    {
      id: 'TUTOR-04',
      name: 'Kak Dimas Arya, S.Si.',
      district: 'Muntilan',
      spec: 'Sains & Fisika SMP/SMA',
      univ: 'Fisika MIPA UGM',
      status: 'On-Duty',
    },
  ];

  describe('1. TC-DISP-001: Geodesic District Distance (EP & BVA)', () => {
    it('calculates 0 km (or within 1.5 km) for tutors in the exact same district', () => {
      const distance = calculateDistrictDistanceKm('Mertoyudan', 'Mertoyudan');
      expect(distance).toBeLessThanOrEqual(1.5);
    });

    it('calculates reasonable geodesic distance between adjacent Magelang districts', () => {
      // Mertoyudan to Secang is approximately 10-18 km
      const distance = calculateDistrictDistanceKm('Mertoyudan', 'Secang');
      expect(distance).toBeGreaterThan(8);
      expect(distance).toBeLessThan(25);
    });

    it('gracefully handles case-insensitivity and whitespace in district names', () => {
      const distance = calculateDistrictDistanceKm('  mErToyUDAN ', 'secang  ');
      expect(distance).toBeGreaterThan(8);
      expect(distance).toBeLessThan(25);
    });
  });

  describe('2. TC-DISP-002: Tutor Match Scoring (Subject Fit & Proximity)', () => {
    it('awards high match score (>= 85%) for tutor with matching subject and same district', () => {
      const match = calculateTutorMatchScore(studentMertoyudanSD, candidateTutors[0]); // Kak Anindya (Mertoyudan, SD MTK)
      expect(match.matchScore).toBeGreaterThanOrEqual(85);
      expect(match.isSubjectMatch).toBe(true);
      expect(match.distanceKm).toBeLessThanOrEqual(2);
    });

    it('penalizes match score when subjects or educational level mismatch', () => {
      const match = calculateTutorMatchScore(studentMertoyudanSD, candidateTutors[2]); // Kak Sarah (UTBK SMA)
      expect(match.matchScore).toBeLessThan(70);
      expect(match.isSubjectMatch).toBe(false);
    });
  });

  describe('3. TC-DISP-003: Ranking Candidates for Student Dispatch', () => {
    it('ranks the closest and most competent tutor at the very top (index 0)', () => {
      const ranked = rankTutorsForStudent(studentMertoyudanSD, candidateTutors);
      expect(ranked.length).toBe(4);
      expect(ranked[0].tutor.name).toBe('Kak Anindya, S.Pd.');
      expect(ranked[0].matchScore).toBeGreaterThanOrEqual(ranked[1].matchScore);
    });

    it('ranks Calistung specialist closest to Secang at the top for Secang student', () => {
      const ranked = rankTutorsForStudent(studentSecangCalistung, candidateTutors);
      expect(ranked[0].tutor.name).toBe('Kak Siti Rahma, S.Pd.');
      expect(ranked[0].isSubjectMatch).toBe(true);
    });
  });

  describe('4. TC-DISP-004: Official Dispatch WhatsApp Generator for Tutor', () => {
    it('generates a complete dispatch notification wa.me link for the assigned tutor', () => {
      const tutor = candidateTutors[0];
      const url = generateTutorDispatchWhatsAppUrl(studentMertoyudanSD, tutor, 'Senin, 6 Okt 2026 pukul 15:30 WIB');

      expect(url).toContain('https://wa.me/');
      expect(url).toContain(encodeURIComponent(tutor.name));
      expect(url).toContain(encodeURIComponent(studentMertoyudanSD.studentName));
      expect(url).toContain(encodeURIComponent(studentMertoyudanSD.district));
      expect(url).toContain(encodeURIComponent('70 Menit'));
    });
  });

  describe('5. TC-DISP-005: Parent Confirmation WhatsApp Generator', () => {
    it('generates a reassuring pairing confirmation wa.me link for the parent', () => {
      const tutor = candidateTutors[0];
      const url = generateParentDispatchConfirmationWhatsAppUrl(studentMertoyudanSD, tutor, 'Senin, 6 Okt 2026 pukul 15:30 WIB');

      expect(url).toContain('https://wa.me/6285712345678');
      expect(url).toContain(encodeURIComponent(studentMertoyudanSD.parentName));
      expect(url).toContain(encodeURIComponent(tutor.name));
      expect(url).toContain(encodeURIComponent('Bright Future'));
    });
  });
});
