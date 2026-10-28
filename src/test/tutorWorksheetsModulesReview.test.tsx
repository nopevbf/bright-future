import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TutorWorksheetsModules } from '../components/tutor/TutorWorksheetsModules';
import { ModuleReviewSubTab } from '../components/admin/ModuleReviewSubTab';
import * as materialsModule from '../utils/learningMaterials';

describe('Tutor Worksheets & Modules Universal Review Flow (SQA-ISTQB & TDD)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // TC-MAT-TUT-001: Renders split types: Modul Ajar (Universal) and Lembar Kerja (LKPD)
  it('TC-MAT-TUT-001: allows tutor to filter by type (Modul vs Lembar Kerja)', async () => {
    render(
      <TutorWorksheetsModules
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={[]}
        visits={[]}
      />
    );

    expect(screen.getByRole('button', { name: /Modul Ajar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lembar Kerja/i })).toBeInTheDocument();
  });

  // TC-MAT-TUT-002: Upload modal allows choosing type and sets status to under_review
  it('TC-MAT-TUT-002: uploading new material lets tutor choose type and saves with status under_review', async () => {
    const saveSpy = vi.spyOn(materialsModule, 'saveLearningMaterial');

    render(
      <TutorWorksheetsModules
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={[]}
        visits={[]}
      />
    );

    // Open upload modal
    const uploadBtn = screen.getByRole('button', { name: /Upload Materi\/LKPD Baru/i });
    fireEvent.click(uploadBtn);

    // Form fields
    const titleInput = screen.getByPlaceholderText(/Contoh: LKPD Matematika/i);
    fireEvent.change(titleInput, { target: { value: 'Modul Magnet & Listrik Tematik' } });

    // Choose Modul Ajar type in modal
    const modulTypeBtns = screen.getAllByRole('button', { name: /Modul Ajar \(Universal\)/i });
    fireEvent.click(modulTypeBtns[modulTypeBtns.length - 1]);

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Unggah Berkas/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'modul',
          title: 'Modul Magnet & Listrik Tematik',
          uploadedBy: 'Kak Anindya, S.Pd.',
        })
      );
    });
  });

  // TC-MAT-REV-FULL: Admin reviews, rejects with reason, tutor sees reason and revises
  it('TC-MAT-REV-FULL: admin rejects with reason; tutor sees reason on card and can revise', async () => {
    // 1. Initial material
    const item = await materialsModule.saveLearningMaterial({
      type: 'lembar_kerja',
      title: 'LKPD Rotasi Bumi HOTS',
      level: 'SD Kelas 5',
      subject: 'IPAS',
      description: 'Latihan soal mandiri',
      uploadedBy: 'Kak Anindya, S.Pd.',
      uploaderRole: 'tutor',
    });

    // 2. Admin renders review tab and rejects it
    const { unmount: unmountAdmin } = render(<ModuleReviewSubTab adminName="Super Admin" />);
    
    // Find reject button for the under_review item
    const rejectButtons = screen.getAllByTestId('btn-reject-material');
    fireEvent.click(rejectButtons[0]);

    // Fill rejection reason
    const reasonInput = screen.getByPlaceholderText(/Contoh: Kunci jawaban/i);
    fireEvent.change(reasonInput, {
      target: { value: 'Kunci jawaban soal nomor 3 belum dicantumkan.' },
    });

    const confirmRejectBtn = screen.getByRole('button', { name: /Kirim Penolakan/i });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      const stored = materialsModule.fetchLearningMaterials().find((m) => m.id === item.id);
      expect(stored?.status).toBe('rejected');
      expect(stored?.rejectionReason).toBe('Kunci jawaban soal nomor 3 belum dicantumkan.');
    });

    unmountAdmin();

    // 3. Tutor renders catalog, sees rejected badge and admin reason
    render(
      <TutorWorksheetsModules
        tutorName="Kak Anindya, S.Pd."
        assignedStudents={[]}
        visits={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Kunci jawaban soal nomor 3 belum dicantumkan/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Revisi & Unggah Ulang/i }).length).toBeGreaterThanOrEqual(1);
    });
  });
});
