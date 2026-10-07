import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TutorEvaluationWhatsApp } from '../components/tutor/TutorEvaluationWhatsApp';
import { AssignedStudentSummary } from '../utils/tutorPairingResolver';
import { FirestoreTutorVisitDoc } from '../firebase';

describe('TutorEvaluationWhatsApp Component (SQA-ISTQB & TDD)', () => {
  const mockStudents: AssignedStudentSummary[] = [
    {
      studentId: 'std-rayhan',
      studentName: 'Rayhan Kusuma',
      level: 'SD 5',
      address: 'Mertoyudan Indah No. 12',
      parentName: 'Ibu Rahma',
      parentPhone: '081298764321',
      scheduleDays: ['Rabu', 'Jumat'],
      subject: 'IPAS Bab 4 — Gerak Rotasi & Revolusi Bumi',
    },
    {
      studentId: 'std-kevin',
      studentName: 'Kevin Pratama',
      level: 'SD 4',
      address: 'Jl. Magelang - Yogyakarta Km 5',
      parentName: 'Bapak Hendra',
      parentPhone: '081234567890',
      scheduleDays: ['Rabu'],
      subject: 'Matematika — Pecahan Desimal & Luas',
    },
  ];

  const mockVisits: FirestoreTutorVisitDoc[] = [
    {
      id: 'visit-1',
      studentName: 'Rayhan Kusuma',
      level: 'SD 5',
      address: 'Mertoyudan Indah No. 12',
      parentName: 'Ibu Rahma',
      parentWa: '081298764321',
      subject: 'IPAS Bab 4 — Gerak Rotasi & Revolusi Bumi',
      time: '13:30 - 14:40 WIB',
      status: 'selesai',
      score: 88,
      focusRating: 5.0,
      independenceRating: 4.0,
      notes: 'Rayhan sangat antusias saat praktik rotasi bumi memakai senter dan globe mini.',
    },
    {
      id: 'visit-2',
      studentName: 'Kevin Pratama',
      level: 'SD 4',
      address: 'Jl. Magelang - Yogyakarta Km 5',
      parentName: 'Bapak Hendra',
      parentWa: '081234567890',
      subject: 'Matematika — Pecahan Desimal & Luas',
      time: '14:30 - 15:40 WIB',
      status: 'selesai',
      score: 92,
      focusRating: 4.5,
      independenceRating: 5.0,
      notes: 'Kemampuan konversi pecahan desimal sangat teliti dan mandiri.',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('TC-EWA-001: renders breadcrumb, headline without (70 Menit), and 4 Bento KPI metrics', () => {
    const { container } = render(
      <TutorEvaluationWhatsApp
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockStudents}
        visits={mockVisits}
      />
    );

    // Kepatuhan bebas string (70 Menit)
    const textContent = container.textContent || '';
    expect(textContent).not.toContain('(70 Menit)');
    expect(textContent).not.toContain('(70 Mnt)');
    expect(textContent).not.toContain('(70 menit)');

    // Header & breadcrumb
    expect(screen.getByRole('heading', { name: /Evaluasi Sesi & Draf WhatsApp Ortu/i })).toBeInTheDocument();
    expect(screen.getByText(/Sesi Kunjungan Rumah Magelang/i)).toBeInTheDocument();

    // 4 Bento KPI
    expect(screen.getByText(/Sesi Dinilai Hari Ini/i)).toBeInTheDocument();
    expect(screen.getByText(/Rerata Skor Kognitif/i)).toBeInTheDocument();
    expect(screen.getByText(/Antrean Draf WA/i)).toBeInTheDocument();
    expect(screen.getByText(/Verifikasi Sesi/i)).toBeInTheDocument();
  });

  it('TC-EWA-002: switches active student from session switcher list', () => {
    render(
      <TutorEvaluationWhatsApp
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockStudents}
        visits={mockVisits}
      />
    );

    // Default student is Rayhan
    expect(screen.getByRole('heading', { name: /Rayhan Kusuma/i })).toBeInTheDocument();

    // Click Kevin P. button in switcher
    const kevinBtn = screen.getByRole('button', { name: /Kevin P\./i });
    fireEvent.click(kevinBtn);

    // Heading should change to Kevin Pratama
    expect(screen.getByRole('heading', { name: /Kevin Pratama/i })).toBeInTheDocument();
  });

  it('TC-EWA-003: updates LKPD score input, progress bar, and badge', () => {
    render(
      <TutorEvaluationWhatsApp
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockStudents}
        visits={mockVisits}
      />
    );

    const lkpdInput = screen.getByLabelText(/Nilai LKPD Eksperimen Sains/i);
    expect(lkpdInput).toBeInTheDocument();

    // Change value to 95
    fireEvent.change(lkpdInput, { target: { value: '95' } });
    expect((lkpdInput as HTMLInputElement).value).toBe('95');

    // Badge should show Sangat Baik
    expect(screen.getByText('Sangat Baik')).toBeInTheDocument();
  });

  it('TC-EWA-004: live-syncs tutor narrative notes to authentic WhatsApp chat bubble', () => {
    render(
      <TutorEvaluationWhatsApp
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockStudents}
        visits={mockVisits}
      />
    );

    const textarea = screen.getByLabelText(/Catatan Naratif Tutor Lapangan/i);
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, {
      target: { value: 'Fokus anak sangat prima dan sopan santun luar biasa.' },
    });

    // Check preview in WA bubble via testid
    const waPreview = screen.getByTestId('wa-narrative-preview');
    expect(waPreview).toHaveTextContent(
      'Fokus anak sangat prima dan sopan santun luar biasa.'
    );
  });

  it('TC-EWA-005: toggles quick tags and star ratings for character evaluation', () => {
    render(
      <TutorEvaluationWhatsApp
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockStudents}
        visits={mockVisits}
      />
    );

    // Tag button click
    const tagBtn = screen.getByRole('button', { name: /Paham Konsep Rotasi Bumi/i });
    expect(tagBtn).toBeInTheDocument();
    fireEvent.click(tagBtn);

    // Star rating button exists
    const starButtons = screen.getAllByRole('button', { name: /star-/i });
    expect(starButtons.length).toBeGreaterThan(0);
    fireEvent.click(starButtons[0]);
  });

  it('TC-EWA-006: handles copy draft and toggle sent status to parent', async () => {
    render(
      <TutorEvaluationWhatsApp
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={mockStudents}
        visits={mockVisits}
      />
    );

    // Copy draft button
    const copyBtn = screen.getByRole('button', { name: /Salin Draf Pesan/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);

    // Toggle checkbox mark sent
    const checkSent = screen.getByRole('checkbox', {
      name: /Tandai Sudah Dikirim ke Orang Tua/i,
    });
    fireEvent.click(checkSent);

    expect((checkSent as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText(/Terkirim ke Ortu/i)).toBeInTheDocument();
  });
});
