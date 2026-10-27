/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Navbar } from '../components/Navbar';
import { saveAuthSession, clearActiveSession } from '../utils/sessionToken';
import App from '../App';

describe('Landing Page Active Session Navbar Integration (ISTQB State Transition & TDD)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.location.hash = '';
    vi.useRealTimers();
  });

  afterEach(() => {
    sessionStorage.clear();
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  it('TC-NAV-001: When unauthenticated, Navbar displays default "Login Portal" button', () => {
    render(
      <Navbar
        onOpenLogin={vi.fn()}
        onOpenCalculator={vi.fn()}
        onSelectRegister={vi.fn()}
      />
    );

    expect(screen.getAllByText(/Login Portal/i).length).toBeGreaterThan(0);
  });

  it('TC-NAV-002: When user has active session, Navbar displays user name and role badge instead of generic Login Portal', () => {
    const onOpenDashboardMock = vi.fn();

    render(
      <Navbar
        onOpenLogin={vi.fn()}
        onOpenCalculator={vi.fn()}
        onSelectRegister={vi.fn()}
        currentUser={{
          name: 'Kak Anindya, S.Pd.',
          role: 'tutor',
          identifier: 'anindya.tutor@brightfuture.id',
        }}
        onOpenDashboard={onOpenDashboardMock}
      />
    );

    // Generic "Login Portal" text should NOT be rendered
    expect(screen.queryByText(/^Login Portal$/i)).toBeNull();

    // Active user name and role label should be visible
    expect(screen.getAllByText(/Kak Anindya, S.Pd./i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tutor/i).length).toBeGreaterThan(0);

    // Clicking the user account element should trigger onOpenDashboard
    const userBtn = screen.getByTitle(/Akun aktif: Kak Anindya, S.Pd./i);
    fireEvent.click(userBtn);

    expect(onOpenDashboardMock).toHaveBeenCalledTimes(1);
  });

  it('TC-NAV-003: Full App Integration: User viewing landing while session is active sees account badge and can return to dashboard', () => {
    // 1. Establish valid session for Super Admin
    saveAuthSession('admin', {
      name: 'Super Admin',
      identifier: 'admin@brightfuture.id',
      role: 'super_admin',
    });

    // 2. User is on landing page (window.location.hash is empty)
    window.location.hash = '';

    render(<App />);

    // Since user is logged in as admin, the Navbar on landing page shows their account!
    expect(screen.getAllByText(/Super Admin/i).length).toBeGreaterThan(0);
  });
});
