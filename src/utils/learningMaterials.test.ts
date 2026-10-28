import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LearningMaterial,
  saveLearningMaterial,
  fetchLearningMaterials,
  approveLearningMaterial,
  rejectLearningMaterial,
  resubmitLearningMaterial,
  filterPublishedMaterials,
  filterTutorMaterials,
  INITIAL_LEARNING_MATERIALS,
} from './learningMaterials';

describe('Learning Materials & Review Lifecycle (SQA-ISTQB & TDD)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // TC-MAT-REV-001: Default status on upload is under_review
  it('TC-MAT-REV-001: newly created material starts with status under_review', async () => {
    const newMaterial = await saveLearningMaterial({
      type: 'modul',
      title: 'Modul Ekosistem Alami & Buatan',
      level: 'SD Kelas 5',
      subject: 'IPAS',
      description: 'Panduan belajar rantai makanan',
      uploadedBy: 'Kak Anindya, S.Pd.',
      uploaderRole: 'tutor',
    });

    expect(newMaterial.id).toBeDefined();
    expect(newMaterial.status).toBe('under_review');
    expect(newMaterial.type).toBe('modul');
    expect(newMaterial.rejectionReason).toBeUndefined();

    const stored = fetchLearningMaterials();
    expect(stored.some((m) => m.id === newMaterial.id)).toBe(true);
  });

  // TC-MAT-SPLIT-001: Supports both modul and lembar_kerja types
  it('TC-MAT-SPLIT-001: supports lembar_kerja type with under_review status', async () => {
    const lkpd = await saveLearningMaterial({
      type: 'lembar_kerja',
      title: 'LKPD Rumus Pythagoras Kontekstual',
      level: 'SMP Kelas 8',
      subject: 'Matematika',
      description: 'Latihan mandiri 10 soal HOTS',
      uploadedBy: 'Kak Anindya, S.Pd.',
      uploaderRole: 'tutor',
    });

    expect(lkpd.type).toBe('lembar_kerja');
    expect(lkpd.status).toBe('under_review');
  });

  // TC-MAT-APPROVE-001: Admin approves material -> status becomes published
  it('TC-MAT-APPROVE-001: approving material sets status to published and makes it universal', async () => {
    const item = await saveLearningMaterial({
      type: 'modul',
      title: 'Modul Fotosintesis Universal',
      level: 'SD Kelas 4',
      subject: 'IPAS',
      description: 'Eksperimen Ingenhousz',
      uploadedBy: 'Kak Budi, S.Pd.',
      uploaderRole: 'tutor',
    });

    const approved = await approveLearningMaterial(item.id, 'Super Admin');
    expect(approved.status).toBe('published');
    expect(approved.reviewedBy).toBe('Super Admin');
    expect(approved.rejectionReason).toBeUndefined();

    // Universal availability
    const universalList = filterPublishedMaterials(fetchLearningMaterials());
    expect(universalList.some((m) => m.id === item.id)).toBe(true);
  });

  // TC-MAT-REJECT-001: Admin rejects material with reason -> status rejected with rejectionReason
  it('TC-MAT-REJECT-001: rejecting material sets status to rejected and stores rejection reason', async () => {
    const item = await saveLearningMaterial({
      type: 'lembar_kerja',
      title: 'LKPD Bilangan Bulat',
      level: 'SMP Kelas 7',
      subject: 'Matematika',
      description: 'Latihan soal garis bilangan',
      uploadedBy: 'Kak Anindya, S.Pd.',
      uploaderRole: 'tutor',
    });

    const rejected = await rejectLearningMaterial(
      item.id,
      'Kunci jawaban soal no 4 belum disertakan pada lampiran.',
      'Super Admin'
    );

    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectionReason).toBe('Kunci jawaban soal no 4 belum disertakan pada lampiran.');
    expect(rejected.reviewedBy).toBe('Super Admin');
  });

  // TC-MAT-RESUBMIT-001: Tutor resubmits rejected material -> status under_review
  it('TC-MAT-RESUBMIT-001: tutor revises rejected material and resubmits, resetting to under_review', async () => {
    const item = await saveLearningMaterial({
      type: 'lembar_kerja',
      title: 'LKPD Bilangan Bulat',
      level: 'SMP Kelas 7',
      subject: 'Matematika',
      description: 'Latihan soal garis bilangan',
      uploadedBy: 'Kak Anindya, S.Pd.',
      uploaderRole: 'tutor',
    });

    await rejectLearningMaterial(
      item.id,
      'Kunci jawaban soal no 4 belum disertakan.',
      'Super Admin'
    );

    const resubmitted = await resubmitLearningMaterial(item.id, {
      description: 'Latihan soal garis bilangan dengan kunci jawaban revisi.',
      fileName: 'LKPD_Bilangan_Bulat_Revisi.pdf',
    });

    expect(resubmitted.status).toBe('under_review');
    expect(resubmitted.rejectionReason).toBeUndefined();
    expect(resubmitted.fileName).toBe('LKPD_Bilangan_Bulat_Revisi.pdf');
  });

  // TC-MAT-FILTER-001: Filters tutor specific vs universal
  it('TC-MAT-FILTER-001: partitions materials correctly between universal published and tutor uploads', () => {
    const all = fetchLearningMaterials();
    const published = filterPublishedMaterials(all);
    const tutorMaterials = filterTutorMaterials(all, 'Kak Anindya, S.Pd.');

    expect(published.every((m) => m.status === 'published')).toBe(true);
    expect(Array.isArray(tutorMaterials)).toBe(true);
  });
});
