/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';
import { saveAuthSession, clearActiveSession } from '../utils/sessionToken';

describe('URL Hash Bypass Security Guard Test Suite (ISTQB Security & State Transition)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.hash = '';
    vi.useRealTimers();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  it('TC-SEC-001: Should DENY access to Admin Dashboard when entering #admin in URL without valid session token', () => {
    // Attacker or unauthenticated user types #admin directly in URL
    window.location.hash = '#admin';

    render(<App />);

    // Admin Dashboard title or buttons should NOT be in the document
    expect(screen.queryByText(/Super Admin Operasional/i)).toBeNull();
    expect(screen.queryByText(/Data Pendaftaran Siswa/i)).toBeNull();
    // Instead, user remains on Landing Page
    expect(screen.getAllByText(/Digital Learning Center/i).length).toBeGreaterThan(0);
    // URL hash should be sanitized or cleared
    expect(window.location.hash).not.toBe('#admin');
  });

  it('TC-SEC-002: Should DENY access to Tutor Portal when entering #tutor without valid tutor token', () => {
    window.location.hash = '#tutor';

    render(<App />);

    // Tutor dashboard specific text should NOT appear
    expect(screen.queryByText(/Rute Kunjungan Rumah/i)).toBeNull();
    // Landing page remains visible
    expect(screen.getAllByText(/Digital Learning Center/i).length).toBeGreaterThan(0);
    expect(window.location.hash).not.toBe('#tutor');
  });

  it('TC-SEC-003: Should DENY access to Siswa Portal when entering #siswa without valid student token', () => {
    window.location.hash = '#siswa';

    render(<App />);

    expect(screen.queryByText(/Ruang Belajar Siswa/i)).toBeNull();
    expect(screen.getAllByText(/Digital Learning Center/i).length).toBeGreaterThan(0);
    expect(window.location.hash).not.toBe('#siswa');
  });

  it('TC-SEC-004: Should DENY access to Orang Tua Portal when entering #orangtua or #wali without valid parent token', () => {
    window.location.hash = '#orangtua';

    render(<App />);

    expect(screen.queryByText(/Portal Orang Tua & Wali Murid/i)).toBeNull();
    expect(screen.getAllByText(/Digital Learning Center/i).length).toBeGreaterThan(0);
    expect(window.location.hash).not.toBe('#orangtua');
  });

  it('TC-SEC-005: Should ALLOW access to Admin Dashboard when a VALID admin session token exists', () => {
    // Authenticated admin with valid cryptographic token
    saveAuthSession('admin', {
      name: 'Super Admin',
      identifier: 'admin@brightfuture.id',
      role: 'super_admin',
    });
    window.location.hash = '#admin';

    render(<App />);

    // Should successfully render Admin Dashboard
    expect(screen.getByText(/Super Admin Operasional/i)).toBeInTheDocument();
  });

  it('TC-SEC-006: Should PREVENT role escalation (e.g., student token attempting to access #admin)', () => {
    // User is logged in as student
    saveAuthSession('siswa', {
      name: 'Rayhan Kusuma',
      identifier: 'BF-2026-09-8812',
    });

    // Student attempts to switch hash to #admin
    window.location.hash = '#admin';

    render(<App />);

    // Admin dashboard should NOT open
    expect(screen.queryByText(/Super Admin Operasional/i)).toBeNull();
  });
});
