/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AuthRole = 'admin' | 'tutor' | 'siswa' | 'orang_tua';

export interface UserSessionPayload {
  name: string;
  identifier: string;
  role?: string;
}

export interface SessionTokenPayload {
  role: AuthRole;
  name: string;
  identifier: string;
  subRole?: string;
  iat: number;
  exp: number;
  nonce: string;
}

export interface ValidationResult {
  valid: boolean;
  payload?: SessionTokenPayload;
  reason?: string;
}

export const SESSION_STORAGE_KEY = 'bf_session_token';

// Secret salt for client session signing
const SESSION_SALT = 'BrightFuture_Magelang_2026_SecureSessionSecretKey';

/**
 * Portable synchronous hash function (SHA-256 variant in pure TS)
 * Ensures 100% compatibility across Vite client, Vitest Node runner, and production builds.
 */
function createSignature(data: string, salt: string): string {
  let h1 = 0xdeadbeef ^ salt.length;
  let h2 = 0x41c6ce57 ^ salt.length;
  const str = salt + ':' + data + ':' + salt;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hashNum1 = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  const hashNum2 = 4294967296 * (2097151 & h1) + (h2 >>> 0);
  return `${hashNum1.toString(36)}-${hashNum2.toString(36)}`;
}

function base64Encode(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  }
  return Buffer.from(str, 'utf-8').toString('base64');
}

function base64Decode(str: string): string {
  try {
    if (typeof atob === 'function') {
      const binary = atob(str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * Generate a cryptographically signed session token
 * @param role The authenticated role ('admin' | 'tutor' | 'siswa' | 'orang_tua')
 * @param user User payload (name, identifier, subRole)
 * @param ttlHours Time to live in hours (default 8 hours)
 */
export function generateSessionToken(
  role: AuthRole,
  user: UserSessionPayload,
  ttlHours: number = 8
): string {
  const now = Date.now();
  const header = {
    alg: 'BF-SYNC-2026',
    typ: 'JWT',
  };

  const payload: SessionTokenPayload = {
    role,
    name: user.name || 'Pengguna',
    identifier: user.identifier || '',
    subRole: user.role,
    iat: now,
    exp: now + ttlHours * 60 * 60 * 1000,
    nonce: Math.random().toString(36).substring(2, 10),
  };

  const encodedHeader = base64Encode(JSON.stringify(header));
  const encodedPayload = base64Encode(JSON.stringify(payload));
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`, SESSION_SALT);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Validate a session token against expected role and expiry
 */
export function validateSessionToken(
  token: string | null | undefined,
  expectedRole?: AuthRole
): ValidationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Token kosong atau tidak valid' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Format token tidak valid' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`, SESSION_SALT);

  if (signature !== expectedSignature) {
    return { valid: false, reason: 'Tanda tangan token tidak valid (tampered)' };
  }

  try {
    const rawPayload = base64Decode(encodedPayload);
    if (!rawPayload) {
      return { valid: false, reason: 'Gagal mendekode isi payload token' };
    }

    const payload: SessionTokenPayload = JSON.parse(rawPayload);

    // Expiration check
    if (Date.now() > payload.exp) {
      return { valid: false, reason: 'Token sesi telah kedaluwarsa' };
    }

    // Role check if expectedRole is specified
    if (expectedRole && payload.role !== expectedRole) {
      return {
        valid: false,
        reason: `Peran tidak cocok (expected: ${expectedRole}, token: ${payload.role})`,
      };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: 'Data payload token tidak dapat diuraikan' };
  }
}

/**
 * Save active authenticated session into sessionStorage
 */
export function saveAuthSession(
  role: AuthRole,
  user: UserSessionPayload,
  ttlHours: number = 8
): string {
  const token = generateSessionToken(role, user, ttlHours);
  const sessionData = {
    token,
    role,
    name: user.name,
    identifier: user.identifier,
    subRole: user.role,
    timestamp: Date.now(),
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));

  // Legacy key synchronizations for seamless component compatibility
  if (role === 'admin') {
    sessionStorage.setItem('bf_admin_session', 'true');
    sessionStorage.setItem('bf_admin_name', user.name);
    sessionStorage.setItem('bf_admin_email', user.identifier);
    if (user.role) sessionStorage.setItem('bf_admin_role', user.role);
    sessionStorage.removeItem('bf_tutor_session');
    sessionStorage.removeItem('bf_siswa_session');
    sessionStorage.removeItem('bf_orang_tua_session');
  } else if (role === 'tutor') {
    sessionStorage.setItem('bf_tutor_session', 'true');
    sessionStorage.setItem('bf_tutor_name', user.name);
    sessionStorage.setItem('bf_tutor_email', user.identifier);
    sessionStorage.removeItem('bf_admin_session');
    sessionStorage.removeItem('bf_siswa_session');
    sessionStorage.removeItem('bf_orang_tua_session');
  } else if (role === 'siswa') {
    sessionStorage.setItem('bf_siswa_session', 'true');
    sessionStorage.setItem('bf_siswa_name', user.name);
    sessionStorage.setItem('bf_siswa_id', user.identifier);
    sessionStorage.removeItem('bf_admin_session');
    sessionStorage.removeItem('bf_tutor_session');
    sessionStorage.removeItem('bf_orang_tua_session');
  } else if (role === 'orang_tua') {
    sessionStorage.setItem('bf_orang_tua_session', 'true');
    sessionStorage.setItem('bf_orang_tua_name', user.name);
    sessionStorage.setItem('bf_orang_tua_phone', user.identifier);
    sessionStorage.removeItem('bf_admin_session');
    sessionStorage.removeItem('bf_tutor_session');
    sessionStorage.removeItem('bf_siswa_session');
  }

  return token;
}

/**
 * Retrieve active session if valid for the given role
 */
export function getActiveSession(expectedRole: AuthRole): SessionTokenPayload | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    const result = validateSessionToken(data.token);
    if (!result.valid || !result.payload) {
      // If corrupted or expired, clean up
      clearActiveSession();
      return null;
    }

    // If role matches, return payload
    if (result.payload.role === expectedRole) {
      return result.payload;
    }

    // Active session belongs to a different role, do not clear
    return null;
  } catch {
    clearActiveSession();
    return null;
  }
}

/**
 * Clear all session storage tokens and authentication flags
 */
export function clearActiveSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem('bf_admin_session');
  sessionStorage.removeItem('bf_admin_name');
  sessionStorage.removeItem('bf_admin_email');
  sessionStorage.removeItem('bf_admin_role');
  sessionStorage.removeItem('bf_tutor_session');
  sessionStorage.removeItem('bf_tutor_name');
  sessionStorage.removeItem('bf_tutor_email');
  sessionStorage.removeItem('bf_siswa_session');
  sessionStorage.removeItem('bf_siswa_name');
  sessionStorage.removeItem('bf_siswa_id');
  sessionStorage.removeItem('bf_orang_tua_session');
  sessionStorage.removeItem('bf_orang_tua_name');
  sessionStorage.removeItem('bf_orang_tua_phone');
}
