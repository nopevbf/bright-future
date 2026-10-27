import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CostCalculator } from './CostCalculator';

describe('CostCalculator Component (SQA-ISTQB & TDD)', () => {
  it('TC-CALC-001: renders default plan (SD, 2x/week = 8 sessions, Rp 280.000)', () => {
    render(<CostCalculator />);

    expect(screen.getByText(/Hitung Estimasi Biaya Les Privat/i)).toBeInTheDocument();
    expect(screen.getByText(/8 Pertemuan \/ Bln/i)).toBeInTheDocument();
    expect(screen.getByText(/Rp 280\.000/)).toBeInTheDocument();
  });

  it('TC-CALC-002 (EP-1): selecting 1x/week (< 2 sessions) calculates 4 sessions and Rp 140.000 for SD', () => {
    render(<CostCalculator />);

    const oncePerWeekBtn = screen.getByRole('button', { name: /1x \/ Mgg/i });
    fireEvent.click(oncePerWeekBtn);

    expect(screen.getByText(/4 Pertemuan \/ Bln/i)).toBeInTheDocument();
    expect(screen.getByText(/Rp 140\.000/)).toBeInTheDocument();
  });

  it('TC-CALC-003 (EP-3): selecting 3x/week and 4x/week (> 2 sessions) updates totals accurately', () => {
    render(<CostCalculator />);

    // Select SMP (Rp 45.000 / session)
    const smpBtn = screen.getByRole('button', { name: /SMP \(7-9\)/i });
    fireEvent.click(smpBtn);

    // 3x / week = 12 sessions = 12 * 45.000 = Rp 540.000
    const thricePerWeekBtn = screen.getByRole('button', { name: /3x \/ Mgg/i });
    fireEvent.click(thricePerWeekBtn);

    expect(screen.getByText(/12 Pertemuan \/ Bln/i)).toBeInTheDocument();
    expect(screen.getByText(/Rp 540\.000/)).toBeInTheDocument();

    // 4x / week = 16 sessions = 16 * 45.000 = Rp 720.000
    const fourTimesBtn = screen.getByRole('button', { name: /4x \/ Mgg/i });
    fireEvent.click(fourTimesBtn);

    expect(screen.getByText(/16 Pertemuan \/ Bln/i)).toBeInTheDocument();
    expect(screen.getByText(/Rp 720\.000/)).toBeInTheDocument();
  });

  it('TC-CALC-004: applies 10% sibling discount when checked', () => {
    render(<CostCalculator />);

    // SD 2x/week = 280.000. Diskon 10% = 28.000. Total = 252.000
    const discountCheckbox = screen.getByLabelText(/Punya 2 anak \/ saudara yang les bersamaan/i);
    fireEvent.click(discountCheckbox);

    expect(screen.getByText(/Diskon Saudara \(10%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/- Rp 28\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/Rp 252\.000/)).toBeInTheDocument();
  });

  it('TC-CALC-005: calls onApplyPlan with selected level, sessionsPerWeek, and discount status', () => {
    const handleApplyPlan = vi.fn();
    render(<CostCalculator onApplyPlan={handleApplyPlan} />);

    // Select SMA (55k), 3x/week (12 sessions), and sibling discount
    const smaBtn = screen.getByRole('button', { name: /SMA\/SMK/i });
    fireEvent.click(smaBtn);

    const thriceBtn = screen.getByRole('button', { name: /3x \/ Mgg/i });
    fireEvent.click(thriceBtn);

    const discountCheckbox = screen.getByLabelText(/Punya 2 anak \/ saudara yang les bersamaan/i);
    fireEvent.click(discountCheckbox);

    const applyBtn = screen.getByRole('button', { name: /Pilih Paket Ini untuk Mendaftar/i });
    fireEvent.click(applyBtn);

    expect(handleApplyPlan).toHaveBeenCalledWith('sma', 3, true);
  });

  it('TC-CALC-MODAL-001: handles modal render and close callback on X click or Escape key', () => {
    const handleClose = vi.fn();
    const { unmount } = render(<CostCalculator isModal onClose={handleClose} />);

    expect(screen.getByText(/Simulasi Biaya Les Privat/i)).toBeInTheDocument();

    const closeBtn = screen.getByLabelText(/Tutup kalkulator/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);

    unmount();
  });
});
