import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RegistrationForm } from './RegistrationForm';

// Mock firebase functions
vi.mock('../firebase', () => ({
  db: {},
  saveRegistrationToFirestore: vi.fn().mockResolvedValue(undefined),
  saveInvoiceToFirestore: vi.fn().mockResolvedValue(undefined),
  fetchRegistrationsFromFirestore: vi.fn().mockResolvedValue([]),
}));

// Mock whatsappValidation
vi.mock('../utils/whatsappValidation', () => ({
  cleanNumericOnly: (val: string) => val.replace(/\D/g, ''),
  validateIndonesianWhatsappFormat: () => ({ isValid: true, errorMessage: null }),
  checkStudentWhatsappDuplicate: vi.fn().mockResolvedValue({ isDuplicate: false, existingStudentName: null }),
}));

describe('RegistrationForm Payment Method Selection (ISTQB & TDD)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TC-REG-PAY-001: should render both Midtrans and Transfer Manual payment options', () => {
    render(
      <RegistrationForm
        onOpenMidtransDemo={vi.fn()}
      />
    );

    expect(screen.getByText(/Midtrans \(Real-time\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Transfer Manual/i)).toBeInTheDocument();
  });

  it('TC-REG-PAY-002: selecting Transfer Manual should display Bank Jateng account details guide', () => {
    render(
      <RegistrationForm
        onOpenMidtransDemo={vi.fn()}
      />
    );

    const manualOption = screen.getByText(/Transfer Manual/i);
    fireEvent.click(manualOption);

    expect(screen.getByText(/Bank Jateng \(Rekening Resmi Bimbel\)/i)).toBeInTheDocument();
    expect(screen.getByText('3014266266')).toBeInTheDocument();
    expect(screen.getByText('Monica Yuliana')).toBeInTheDocument();
  });

  it('TC-REG-PAY-003: successful submission with Midtrans should render Bayar via Midtrans Snap button', async () => {
    const mockOpenMidtrans = vi.fn();
    render(
      <RegistrationForm
        onOpenMidtransDemo={mockOpenMidtrans}
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/Misal: Budi Santoso/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Misal: Bapak Santoso \/ Ibu Siti/i), {
      target: { value: 'Bapak Santoso' },
    });
    fireEvent.change(screen.getByPlaceholderText(/081234567890/i), {
      target: { value: '081234567890' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Nama jalan, nomor rumah, RT\/RW, kelurahan/i), {
      target: { value: 'Jl. Pemuda No. 10 Magelang' },
    });

    // Select schedule
    const scheduleOption = screen.getByText(/Senin - Rabu/i);
    fireEvent.click(scheduleOption);

    // Wait for WhatsApp check to settle
    const submitBtn = await screen.findByRole('button', { name: /Kirim Pendaftaran/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Selamat Datang di Bright Future/i)).toBeInTheDocument();
    });

    const payBtn = screen.getByRole('button', { name: /Bayar Sekarang via Midtrans Snap/i });
    expect(payBtn).toBeInTheDocument();

    fireEvent.click(payBtn);
    expect(mockOpenMidtrans).toHaveBeenCalled();
  });

  it('TC-REG-PAY-004: successful submission with Manual Transfer should render Bank Jateng payment instructions card', async () => {
    render(
      <RegistrationForm
        onOpenMidtransDemo={vi.fn()}
      />
    );

    // Select manual transfer
    const manualRadio = screen.getByText(/Transfer Manual/i);
    fireEvent.click(manualRadio);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Misal: Budi Santoso/i), {
      target: { value: 'Siti Aminah' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Misal: Bapak Santoso \/ Ibu Siti/i), {
      target: { value: 'Ibu Aminah' },
    });
    fireEvent.change(screen.getByPlaceholderText(/081234567890/i), {
      target: { value: '081234567891' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Nama jalan, nomor rumah, RT\/RW, kelurahan/i), {
      target: { value: 'Jl. Tidar No. 5 Magelang' },
    });

    const scheduleOption = screen.getByText(/Senin - Rabu/i);
    fireEvent.click(scheduleOption);

    const submitBtn = await screen.findByRole('button', { name: /Kirim Pendaftaran/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Panduan Transfer Bank Jateng/i)).toBeInTheDocument();
      expect(screen.getByText('3014266266')).toBeInTheDocument();
      expect(screen.getByText('Monica Yuliana')).toBeInTheDocument();
    });
  });

  it('TC-REG-VAL-001: submit button should be disabled and styled grey when required fields are empty', () => {
    render(
      <RegistrationForm
        onOpenMidtransDemo={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Kirim Pendaftaran/i });
    expect(submitBtn).toBeDisabled();
    expect(submitBtn.className).toContain('bg-gray-300');
  });

  it('TC-REG-VAL-002: submit button enables and styles active when all required fields are filled', async () => {
    render(
      <RegistrationForm
        onOpenMidtransDemo={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Kirim Pendaftaran/i });
    expect(submitBtn).toBeDisabled();

    // Fill all required fields
    fireEvent.change(screen.getByPlaceholderText(/Misal: Budi Santoso/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Misal: Bapak Santoso \/ Ibu Siti/i), {
      target: { value: 'Bapak Santoso' },
    });
    fireEvent.change(screen.getByPlaceholderText(/081234567890/i), {
      target: { value: '081234567890' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Nama jalan, nomor rumah, RT\/RW, kelurahan/i), {
      target: { value: 'Jl. Magelang No. 12' },
    });

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
      expect(submitBtn.className).toContain('bg-[#C1683F]');
    });
  });

  it('TC-REG-NAV-001: success screen provides button to return to registration form and clicking it restores form view', async () => {
    render(
      <RegistrationForm
        onOpenMidtransDemo={vi.fn()}
      />
    );

    // Fill form and submit
    fireEvent.change(screen.getByPlaceholderText(/Misal: Budi Santoso/i), {
      target: { value: 'Ahmad Dahlan' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Misal: Bapak Santoso \/ Ibu Siti/i), {
      target: { value: 'Bapak Dahlan' },
    });
    fireEvent.change(screen.getByPlaceholderText(/081234567890/i), {
      target: { value: '081234567899' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Nama jalan, nomor rumah, RT\/RW, kelurahan/i), {
      target: { value: 'Jl. Pahlawan No. 10' },
    });

    const submitBtn = await screen.findByRole('button', { name: /Kirim Pendaftaran/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Selamat Datang di Bright Future/i)).toBeInTheDocument();
    });

    // Button to return to form
    const returnBtn = screen.getByRole('button', { name: /Kembali ke Form Pendaftaran Siswa/i });
    expect(returnBtn).toBeInTheDocument();

    fireEvent.click(returnBtn);

    // Form is restored
    expect(screen.getByPlaceholderText(/Misal: Budi Santoso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kirim Pendaftaran/i })).toBeInTheDocument();
  });
});
