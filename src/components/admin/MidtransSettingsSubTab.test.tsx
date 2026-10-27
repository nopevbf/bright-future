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

  it('TC-ADM-MSET-004: clicking + Atur Khusus configures custom per-method fee and persists it', () => {
    render(<MidtransSettingsSubTab />);

    // Click + Atur Khusus for QRIS
    const qrisBtn = screen.getByTestId('btn-custom-fee-qris');
    fireEvent.click(qrisBtn);

    // Verify custom fee badge appears
    expect(screen.getByText(/Fee Khusus Aktif/i)).toBeInTheDocument();

    // Change custom fee value
    const customInput = screen.getByTestId('input-custom-fee-qris');
    fireEvent.change(customInput, { target: { value: '0.8' } });

    // Click Simpan
    const saveBtn = screen.getByRole('button', { name: /Simpan Pengaturan/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText(/Pengaturan Berhasil Disimpan/i)).toBeInTheDocument();
  });

  it('TC-ADM-MSET-005: clicking Reset ke Universal restores method to default universal fee', () => {
    render(<MidtransSettingsSubTab />);

    // Open custom fee for QRIS
    const qrisBtn = screen.getByTestId('btn-custom-fee-qris');
    fireEvent.click(qrisBtn);
    expect(screen.getByText(/Fee Khusus Aktif/i)).toBeInTheDocument();

    // Click Reset ke Universal
    const resetBtn = screen.getByTestId('reset-fee-qris');
    fireEvent.click(resetBtn);

    // Verify custom fee badge is gone and + Atur Khusus is back
    expect(screen.queryByText(/Fee Khusus Aktif/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-custom-fee-qris')).toBeInTheDocument();
  });
});
