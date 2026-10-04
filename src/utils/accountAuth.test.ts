import { describe, it, expect } from 'vitest';
import {
  FirestoreRegistrationDoc,
  FirestoreTutorRegistrationDoc,
  verifyPortalCredentialsFromFirestore,
} from '../firebase';

describe('Auto Account Provisioning & Default Password 123456789', () => {
  it('TC-ACC-001: verifies student registration credentials with default password 123456789', async () => {
    // When a student registers and is verified, default password 123456789 is accepted
    const dummyStudentId = 'BF-2026-09-8492';
    const authResult = await verifyPortalCredentialsFromFirestore('siswa', dummyStudentId, '123456789');
    expect(authResult.success).toBe(true);
    expect(authResult.user).toBeDefined();
    expect(authResult.user?.role).toBe('siswa');
  });

  it('TC-ACC-002: verifies tutor credentials with default password 123456789', async () => {
    // Default or accepted tutor can authenticate with default password 123456789
    const tutorId = 'anindya.tutor@brightfuture.id';
    const authResult = await verifyPortalCredentialsFromFirestore('tutor', tutorId, '123456789');
    expect(authResult.success).toBe(true);
    expect(authResult.user).toBeDefined();
    expect(authResult.user?.role).toBe('tutor');
  });

  it('TC-ACC-003: verifies parent credentials via WhatsApp with default password 123456789', async () => {
    const parentWa = '081298765432';
    const authResult = await verifyPortalCredentialsFromFirestore('orang_tua', parentWa, '123456789');
    expect(authResult.success).toBe(true);
    expect(authResult.user).toBeDefined();
    expect(authResult.user?.role).toBe('orang_tua');
  });

  it('TC-ACC-004: rejects invalid password when not matching default 123456789 or saved password', async () => {
    const tutorId = 'anindya.tutor@brightfuture.id';
    const authResult = await verifyPortalCredentialsFromFirestore('tutor', tutorId, 'wrong-password-999');
    expect(authResult.success).toBe(false);
  });
});
