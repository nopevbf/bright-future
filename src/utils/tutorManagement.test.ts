import { describe, it, expect } from 'vitest';
import {
  TutorApplication,
  TutorApplicationStatus,
  filterTutorApplications,
  generateTutorInterviewWhatsAppUrl,
  generateTutorAcceptanceWhatsAppUrl,
  generateTutorRejectionWhatsAppUrl,
} from './tutorManagement';

describe('Tutor Management Business Logic & WA Generator (TDD Suite)', () => {
  const sampleApplications: TutorApplication[] = [
    {
      id: 'TUTOR-REG-001',
      fullName: 'Ahmad Faiz, S.Pd.',
      whatsapp: '0851-7323-0198',
      education: 'S1 Pendidikan Matematika UNY (IPK 3.84)',
      subjects: 'Matematika SD & SMP',
      district: 'Mertoyudan',
      experienceNotes: '2 tahun mengajar les privat olimpiade matematika SD.',
      status: 'pending_review',
      createdAt: '2026-10-01T10:00:00Z',
    },
    {
      id: 'TUTOR-REG-002',
      fullName: 'Nadia Safitri, S.Si.',
      whatsapp: '0812-3456-7890',
      education: 'S1 Biologi UGM (IPK 3.75)',
      subjects: 'IPAS SD & IPA SMP',
      district: 'Secang',
      experienceNotes: 'Praktisi lab biologi dan asisten dosen.',
      status: 'interview',
      createdAt: '2026-10-02T11:00:00Z',
    },
    {
      id: 'TUTOR-REG-003',
      fullName: 'Bagas Wicaksono, M.Pd.',
      whatsapp: '0877-6543-2100',
      education: 'S2 Pendidikan Bahasa Inggris UNS (IPK 3.90)',
      subjects: 'Bahasa Inggris SD - SMA',
      district: 'Magelang Selatan',
      experienceNotes: 'Pengajar TOEFL & English for Young Learners.',
      status: 'accepted',
      createdAt: '2026-09-28T09:00:00Z',
    },
  ];

  it('memfilter pendaftar tutor berdasarkan query pencarian (nama, mapel, atau kecamatan)', () => {
    const searchFaiz = filterTutorApplications(sampleApplications, 'Faiz', 'all');
    expect(searchFaiz).toHaveLength(1);
    expect(searchFaiz[0].id).toBe('TUTOR-REG-001');

    const searchSecang = filterTutorApplications(sampleApplications, 'Secang', 'all');
    expect(searchSecang).toHaveLength(1);
    expect(searchSecang[0].fullName).toBe('Nadia Safitri, S.Si.');

    const searchEnglish = filterTutorApplications(sampleApplications, 'Inggris', 'all');
    expect(searchEnglish).toHaveLength(1);
    expect(searchEnglish[0].id).toBe('TUTOR-REG-003');
  });

  it('memfilter pendaftar tutor berdasarkan status pendaftaran', () => {
    const pendingList = filterTutorApplications(sampleApplications, '', 'pending_review');
    expect(pendingList).toHaveLength(1);
    expect(pendingList[0].status).toBe('pending_review');

    const interviewList = filterTutorApplications(sampleApplications, '', 'interview');
    expect(interviewList).toHaveLength(1);
    expect(interviewList[0].status).toBe('interview');

    const acceptedList = filterTutorApplications(sampleApplications, '', 'accepted');
    expect(acceptedList).toHaveLength(1);
    expect(acceptedList[0].status).toBe('accepted');
  });

  it('menghasilkan tautan wa.me undangan wawancara & microteaching SOP 70 menit', () => {
    const app = sampleApplications[0];
    const url = generateTutorInterviewWhatsAppUrl(app, {
      date: 'Rabu, 7 Oktober 2026',
      time: '14:00 WIB',
      location: 'Kantor Cabang Bright Future Mertoyudan Magelang',
    });

    expect(url).toContain('https://wa.me/6285173230198?text=');
    expect(url).toContain(encodeURIComponent('Ahmad Faiz, S.Pd.'));
    expect(url).toContain(encodeURIComponent('Wawancara & Microteaching SOP 70 Menit'));
    expect(url).toContain(encodeURIComponent('Rabu, 7 Oktober 2026'));
  });

  it('menghasilkan tautan wa.me konfirmasi penerimaan dan orientasi pengajar resmi', () => {
    const app = sampleApplications[2];
    const url = generateTutorAcceptanceWhatsAppUrl(app);

    expect(url).toContain('https://wa.me/6287765432100?text=');
    expect(url).toContain(encodeURIComponent('Bagas Wicaksono, M.Pd.'));
    expect(url).toContain(encodeURIComponent('Selamat! Anda Diterima'));
    expect(url).toContain(encodeURIComponent('Bright Future'));
  });

  it('menghasilkan tautan wa.me penolakan yang ramah dan apresiatif', () => {
    const app = sampleApplications[1];
    const url = generateTutorRejectionWhatsAppUrl(app);

    expect(url).toContain('https://wa.me/6281234567890?text=');
    expect(url).toContain(encodeURIComponent('Nadia Safitri, S.Si.'));
    expect(url).toContain(encodeURIComponent('Apresiasi'));
    expect(url).toContain(encodeURIComponent('database calon tutor'));
  });
});
