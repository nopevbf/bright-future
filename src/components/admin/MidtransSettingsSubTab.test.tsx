import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MidtransSettingsSubTab } from './MidtransSettingsSubTab';
import { saveMidtransSettings } from '../../utils/midtransSettings';

describe('MidtransSettingsSubTab Component (SQA-ISTQB & TDD)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('TC-ADM-MSET-001: renders fee configuration inputs and official payment methods list', () => {
    render(<MidtransSettingsSubTab />);

    expect(screen.getByText(/Pengaturan Midtrans Payment Gateway/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nominal Biaya Layanan/i)).toBeInTheDocument();
    expect(screen.getByText(/Metode Pembayaran Tersedia/i)).toBeInTheDocument();

    // Check some official methods are listed
    expect(screen.getByText('BCA Virtual Account')).toBeInTheDocument();
    expect(screen.getByText('BRI Virtual Account (BRIVA)')).toBeInTheDocument();
    expect(screen.getByText('Mandiri Bill Payment')).toBeInTheDocument();
    expect(screen.getByText('Indomaret')).toBeInTheDocument();
  });

  it('TC-ADM-MSET-002: updating fee amount and clicking Simpan updates settings', () => {
    render(<MidtransSettingsSubTab />);

    const feeInput = screen.getByLabelText(/Nominal Biaya Layanan/i);
    fireEvent.change(feeInput, { target: { value: '4500' } });

    const saveBtn = screen.getByRole('button', { name: /Simpan Pengaturan/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText(/Pengaturan Berhasil Disimpan/i)).toBeInTheDocument();
  });

  it('TC-ADM-MSET-003: toggling a payment method enables or disables it', () => {
    render(<MidtransSettingsSubTab />);

    // Toggle Indomaret (default is disabled)
    const indomaretToggle = screen.getByTestId('toggle-method-indomaret');
    fireEvent.click(indomaretToggle);

    const saveBtn = screen.getByRole('button', { name: /Simpan Pengaturan/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText(/Pengaturan Berhasil Disimpan/i)).toBeInTheDocument();
  });
});
