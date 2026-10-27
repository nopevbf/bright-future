/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateSessionToken,
  validateSessionToken,
  saveAuthSession,
  getActiveSession,
  clearActiveSession,
  SESSION_STORAGE_KEY,
  AuthRole,
} from '../utils/sessionToken';

describe('Session Token & Security Guard (ISTQB Grounded & TDD)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Token Generation & Validation (EP & BVA)', () => {
    it('TC-AUTH-001: Should generate a well-formed session token with role, identifier, and expiry', () => {
      const token = generateSessionToken('admin', {
        name: 'Super Admin',
        identifier: 'admin@brightfuture.id',
        role: 'super_admin',
      });

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
      expect(token.split('.').length).toBe(3); // header.payload.signature

      const validation = validateSessionToken(token, 'admin');
      expect(validation.valid).toBe(true);
      expect(validation.payload).toBeDefined();
      expect(validation.payload?.role).toBe('admin');
      expect(validation.payload?.name).toBe('Super Admin');
      expect(validation.payload?.identifier).toBe('admin@brightfuture.id');
    });

    it('TC-AUTH-002: Should reject expired session token (BVA: now > exp)', () => {
      const fixedTime = 1775640000000;
      vi.spyOn(Date, 'now').mockReturnValue(fixedTime);

      // Generate token with 1 hour duration
      const token = generateSessionToken(
        'tutor',
        {
          name: 'Kak Anindya, S.Pd.',
          identifier: 'anindya.tutor@brightfuture.id',
        },
        1 // 1 hour TTL
      );

      // Advance time by 2 hours
      vi.spyOn(Date, 'now').mockReturnValue(fixedTime + 2 * 60 * 60 * 1000);

      const validation = validateSessionToken(token, 'tutor');
      expect(validation.valid).toBe(false);
      expect(validation.reason).toMatch(/kedaluwarsa|expired/i);
    });

    it('TC-AUTH-003: Should reject session token when role does not match expected role', () => {
      const token = generateSessionToken('siswa', {
        name: 'Rayhan Kusuma',
        identifier: 'BF-2026-09-8812',
      });

      // Attempt to validate student token as admin
      const validation = validateSessionToken(token, 'admin');
      expect(validation.valid).toBe(false);
      expect(validation.reason).toMatch(/peran tidak cocok|role mismatch/i);
    });

    it('TC-AUTH-004: Should reject tampered or corrupted token (Security Check)', () => {
      const token = generateSessionToken('admin', {
        name: 'Super Admin',
        identifier: 'admin@brightfuture.id',
      });

      const parts = token.split('.');
      // Tamper payload
      const tamperedToken = `${parts[0]}.${parts[1]}TAMPERED.${parts[2]}`;

      const validation = validateSessionToken(tamperedToken, 'admin');
      expect(validation.valid).toBe(false);
      expect(validation.reason).toMatch(/tidak valid|signature/i);
    });

    it('TC-AUTH-005: Should safely handle null, empty, or undefined tokens (Robustness)', () => {
      expect(validateSessionToken('', 'admin').valid).toBe(false);
      expect(validateSessionToken(null as any, 'admin').valid).toBe(false);
      expect(validateSessionToken(undefined as any, 'admin').valid).toBe(false);
      expect(validateSessionToken('not-a-token', 'admin').valid).toBe(false);
    });
  });

  describe('2. Session Storage Integration', () => {
    it('TC-AUTH-006: Should save active session and retrieve it successfully', () => {
      saveAuthSession('orang_tua', {
        name: 'Bunda Ratna Dewi',
        identifier: '081298765432',
      });

      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();

      const active = getActiveSession('orang_tua');
      expect(active).not.toBeNull();
      expect(active?.role).toBe('orang_tua');
      expect(active?.name).toBe('Bunda Ratna Dewi');
      expect(active?.identifier).toBe('081298765432');
    });

    it('TC-AUTH-007: Should return null and clear storage if active session role does not match', () => {
      saveAuthSession('siswa', {
        name: 'Rayhan Kusuma',
        identifier: 'BF-2026-09-8812',
      });

      // Trying to get admin session when siswa is logged in
      const activeAdmin = getActiveSession('admin');
      expect(activeAdmin).toBeNull();
    });

    it('TC-AUTH-008: Should completely remove session upon clearActiveSession', () => {
      saveAuthSession('admin', {
        name: 'Super Admin',
        identifier: 'admin@brightfuture.id',
      });

      expect(getActiveSession('admin')).not.toBeNull();

      clearActiveSession();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
      expect(getActiveSession('admin')).toBeNull();
    });
  });
});
