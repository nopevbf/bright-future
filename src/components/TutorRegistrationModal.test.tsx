import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TutorRegistrationModal } from './TutorRegistrationModal';
import { COVERAGE_AREAS } from '../data';
import * as firebaseModule from '../firebase';

// Mock saveTutorRegistrationToFirestore
vi.mock('../firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../firebase')>();
  return {
    ...actual,
    saveTutorRegistrationToFirestore: vi.fn().mockResolvedValue('TUTOR-REG-TEST-123'),
  };
});

describe('TutorRegistrationModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-TR-001: renders modal form fields and close button', () => {
    const handleClose = vi.fn();
    render(<TutorRegistrationModal onClose={handleClose} />);

    expect(screen.getByText(/pendaftaran mitra tutor baru/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nama lengkap/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nomor whatsapp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pendidikan terakhir/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/jenjang & mata pelajaran/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/domisili kecamatan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kirim pendaftaran mitra/i })).toBeInTheDocument();
  });

  it('TC-TR-002: displays validation error when submitting with empty required fields (EP/BVA)', async () => {
    const handleClose = vi.fn();
    render(<TutorRegistrationModal onClose={handleClose} />);

    const submitBtn = screen.getByRole('button', { name: /kirim pendaftaran mitra/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/mohon lengkapi nama lengkap dan nomor whatsapp/i)).toBeInTheDocument();
    expect(firebaseModule.saveTutorRegistrationToFirestore).not.toHaveBeenCalled();
  });

  it('TC-TR-003: successfully saves registration and provides WhatsApp dispatch link', async () => {
    const handleClose = vi.fn();
    render(<TutorRegistrationModal onClose={handleClose} />);

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
      target: { value: 'Kak Budi Pratama, S.Pd.' },
    });
    fireEvent.change(screen.getByLabelText(/nomor whatsapp/i), {
      target: { value: '081234567890' },
    });
    fireEvent.change(screen.getByLabelText(/pendidikan terakhir/i), {
      target: { value: 'S1 Pendidikan Matematika UNY' },
    });
    fireEvent.change(screen.getByLabelText(/jenjang & mata pelajaran/i), {
      target: { value: 'SD & SMP Matematika / Sains' },
    });
    fireEvent.change(screen.getByLabelText(/domisili kecamatan/i), {
      target: { value: COVERAGE_AREAS[0] },
    });

    const submitBtn = screen.getByRole('button', { name: /kirim pendaftaran mitra/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(firebaseModule.saveTutorRegistrationToFirestore).toHaveBeenCalledTimes(1);
      expect(firebaseModule.saveTutorRegistrationToFirestore).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Kak Budi Pratama, S.Pd.',
          whatsapp: '081234567890',
          education: 'S1 Pendidikan Matematika UNY',
          subjects: 'SD & SMP Matematika / Sains',
          district: COVERAGE_AREAS[0],
        })
      );
    });

    expect(await screen.findByText(/pendaftaran berhasil dikirim/i)).toBeInTheDocument();
  });

  it('TC-TR-004: calls onClose when close or batal button is clicked', () => {
    const handleClose = vi.fn();
    render(<TutorRegistrationModal onClose={handleClose} />);

    const closeBtn = screen.getByLabelText(/tutup modal/i);
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
