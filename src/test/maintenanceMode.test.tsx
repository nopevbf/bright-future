/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMaintenanceActive,
  enableMaintenanceMode,
  disableMaintenanceMode,
  calculateTimeRemaining,
  MAINTENANCE_STORAGE_KEY,
  MAINTENANCE_TARGET_KEY,
} from '../utils/maintenanceManager';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { AdminDashboard } from '../components/AdminDashboard';
import App from '../App';

describe('Maintenance Mode & Easter Egg Test Suite (ISTQB Grounded & TDD)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('1. Maintenance Storage Manager (Unit Tests)', () => {
    it('TC-MNT-001: Should report maintenance as inactive by default', () => {
      expect(isMaintenanceActive()).toBe(false);
    });

    it('TC-MNT-002: Should enable maintenance mode for 7 days in localStorage', () => {
      const now = 1775640000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      enableMaintenanceMode(7);

      expect(isMaintenanceActive()).toBe(true);
      expect(localStorage.getItem(MAINTENANCE_STORAGE_KEY)).toBe('true');

      const expectedTarget = now + 7 * 24 * 60 * 60 * 1000;
      expect(localStorage.getItem(MAINTENANCE_TARGET_KEY)).toBe(expectedTarget.toString());
    });

    it('TC-MNT-003: Should disable maintenance mode and clean localStorage', () => {
      enableMaintenanceMode(7);
      expect(isMaintenanceActive()).toBe(true);

      disableMaintenanceMode();
      expect(isMaintenanceActive()).toBe(false);
      expect(localStorage.getItem(MAINTENANCE_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(MAINTENANCE_TARGET_KEY)).toBeNull();
    });

    it('TC-MNT-004: Should calculate 7 days countdown remaining time accurately', () => {
      const now = 1775640000000;
      // Exactly 7 days later
      const target = now + 7 * 24 * 60 * 60 * 1000;

      const remaining = calculateTimeRemaining(target, now);
      expect(remaining.days).toBe(7);
      expect(remaining.hours).toBe(0);
      expect(remaining.minutes).toBe(0);
      expect(remaining.seconds).toBe(0);
      expect(remaining.isExpired).toBe(false);

      // 6 days, 23 hours, 59 minutes, 30 seconds
      const halfMinuteLater = now + 30 * 1000;
      const remainingAfterHalfMin = calculateTimeRemaining(target, halfMinuteLater);
      expect(remainingAfterHalfMin.days).toBe(6);
      expect(remainingAfterHalfMin.hours).toBe(23);
      expect(remainingAfterHalfMin.minutes).toBe(59);
      expect(remainingAfterHalfMin.seconds).toBe(30);
    });
  });

  describe('2. MaintenanceModal UI & Behavior (Black-Box & BVA)', () => {
    it('TC-MNT-005: Should render modal with maintenance notification and 7-day countdown', () => {
      const now = 1775640000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      const target = now + 7 * 24 * 60 * 60 * 1000;

      render(
        <MaintenanceModal
          isOpen={true}
          targetTimestamp={target}
          onDeactivate={vi.fn()}
        />
      );

      // Check maintenance heading
      expect(screen.getByText(/Sedang Dalam Pemeliharaan/i)).toBeInTheDocument();
      expect(screen.getByText(/Sistem Sedang Diperbarui/i)).toBeInTheDocument();

      // Check 7 days timer label
      expect(screen.getByTestId('countdown-days')).toHaveTextContent('07');
    });

    it('TC-MNT-006: Should NOT have standard close button and cannot be closed by Escape', () => {
      const onDeactivateMock = vi.fn();
      render(
        <MaintenanceModal
          isOpen={true}
          targetTimestamp={Date.now() + 7 * 24 * 60 * 60 * 1000}
          onDeactivate={onDeactivateMock}
        />
      );

      // Verify no close button or 'X'
      expect(screen.queryByRole('button', { name: /tutup/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/close/i)).not.toBeInTheDocument();

      // Press Escape key
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(onDeactivateMock).not.toHaveBeenCalled();
    });

    it('TC-MNT-007 (BVA): Should NOT show secret override toggle before 7 space key presses', () => {
      render(
        <MaintenanceModal
          isOpen={true}
          targetTimestamp={Date.now() + 7 * 24 * 60 * 60 * 1000}
          onDeactivate={vi.fn()}
        />
      );

      // Press Space 6 times
      for (let i = 0; i < 6; i++) {
        fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      }

      // Secret toggle must still be hidden
      expect(screen.queryByTestId('secret-maintenance-toggle')).not.toBeInTheDocument();
      expect(screen.queryByText(/Bypass Mode Maintenance/i)).not.toBeInTheDocument();
    });

    it('TC-MNT-008 (Cheat Code Activated): Pressing Space 7 times reveals the secret toggle', () => {
      render(
        <MaintenanceModal
          isOpen={true}
          targetTimestamp={Date.now() + 7 * 24 * 60 * 60 * 1000}
          onDeactivate={vi.fn()}
        />
      );

      // Press Space 7 times
      act(() => {
        for (let i = 0; i < 7; i++) {
          fireEvent.keyDown(window, { key: ' ', code: 'Space' });
        }
      });

      // Secret toggle must now be visible
      const toggle = screen.getByTestId('secret-maintenance-toggle');
      expect(toggle).toBeInTheDocument();
      expect(screen.getByText(/Bypass Mode Maintenance/i)).toBeInTheDocument();
    });

    it('TC-MNT-009: Clicking secret toggle triggers onDeactivate to restore normal state', () => {
      const onDeactivateMock = vi.fn();
      render(
        <MaintenanceModal
          isOpen={true}
          targetTimestamp={Date.now() + 7 * 24 * 60 * 60 * 1000}
          onDeactivate={onDeactivateMock}
        />
      );

      // Unlock with 7 space presses
      act(() => {
        for (let i = 0; i < 7; i++) {
          fireEvent.keyDown(window, { key: ' ', code: 'Space' });
        }
      });

      const toggle = screen.getByTestId('secret-maintenance-toggle');
      fireEvent.click(toggle);

      expect(onDeactivateMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Admin Dashboard Maintenance Trigger Integration', () => {
    it('TC-MNT-010: Should render new Maintenance menu in Admin sidebar and trigger auto-logout on activation', () => {
      const onLogoutMock = vi.fn();
      render(
        <AdminDashboard
          onLogout={onLogoutMock}
          onViewLanding={vi.fn()}
        />
      );

      // Find the new sidebar menu for maintenance
      const maintenanceNavButton = screen.getByTestId('nav-maintenance');
      expect(maintenanceNavButton).toBeInTheDocument();

      // Click to open maintenance tab
      fireEvent.click(maintenanceNavButton);

      // Verify maintenance tab content is displayed
      expect(screen.getByText(/Manajemen Mode Pemeliharaan/i)).toBeInTheDocument();

      // Click activate maintenance button
      const activateButton = screen.getByTestId('btn-activate-maintenance');
      expect(activateButton).toBeInTheDocument();
      fireEvent.click(activateButton);

      // Verify maintenance is now active in storage
      expect(isMaintenanceActive()).toBe(true);
      // Verify admin onLogout is triggered
      expect(onLogoutMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Full End-to-End App Integration (Landing Page Barrier & Cheat)', () => {
    it('TC-MNT-011: Renders MaintenanceModal automatically on Landing Page when maintenance is active', () => {
      enableMaintenanceMode(7);
      render(<App />);

      expect(screen.getByText(/Sedang Dalam Pemeliharaan/i)).toBeInTheDocument();
      expect(screen.getByTestId('countdown-days')).toBeInTheDocument();
    });

    it('TC-MNT-012: Full user journey: 7 spaces unlock cheat and clicking deactivates maintenance restoring landing page', () => {
      enableMaintenanceMode(7);
      render(<App />);

      // Verify modal is open
      expect(screen.getByText(/Sedang Dalam Pemeliharaan/i)).toBeInTheDocument();

      // Tap space 7 times
      act(() => {
        for (let i = 0; i < 7; i++) {
          fireEvent.keyDown(window, { key: ' ', code: 'Space' });
        }
      });

      // Secret toggle is revealed
      const toggle = screen.getByTestId('secret-maintenance-toggle');
      expect(toggle).toBeInTheDocument();

      // Click toggle
      act(() => {
        fireEvent.click(toggle);
      });

      // Maintenance deactivated
      expect(isMaintenanceActive()).toBe(false);
      // Modal should be gone
      expect(screen.queryByText(/Sedang Dalam Pemeliharaan/i)).not.toBeInTheDocument();
    });
  });
});

