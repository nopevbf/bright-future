import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminDashboard, getAdminMonogram } from '../components/AdminDashboard';

// Mock subcomponent to isolate header, sidebar, banner, and footer testing
vi.mock('../components/admin/AccountManagementSubTab', () => ({
  AccountManagementSubTab: ({ currentUserRole }: { currentUserRole?: string }) => (
    <div data-testid="mock-account-subtab">
      <span>Role: {currentUserRole}</span>
    </div>
  ),
}));

vi.mock('../firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../firebase')>();
  return {
    ...actual,
    fetchRegistrationsFromFirestore: vi.fn().mockResolvedValue([]),
    fetchAdminCredentialFromFirestore: vi.fn().mockResolvedValue({
      email: 'admin@brightfuture.id',
      name: 'Super Admin',
      role: 'super_admin',
      password: 'superadminpassword123',
    }),
    fetchConnectedDatabaseAccounts: vi.fn().mockResolvedValue({
      admin: { email: 'admin@brightfuture.id', name: 'Super Admin', role: 'super_admin' },
      portalAccounts: [],
      totalRegisteredStudents: 0,
    }),
    fetchAllPortalAccountsFromFirestore: vi.fn().mockResolvedValue([]),
    fetchTutorRegistrationsFromFirestore: vi.fn().mockResolvedValue([]),
    subscribeToRegistrations: vi.fn().mockReturnValue(() => {}),
    subscribeToTutorRegistrations: vi.fn().mockReturnValue(() => {}),
    subscribeToTutorAssignments: vi.fn().mockReturnValue(() => {}),
    subscribeToPortalAccounts: vi.fn().mockReturnValue(() => {}),
    subscribeToInvoices: vi.fn().mockReturnValue(() => {}),
    seedInitialInvoicesIfEmpty: vi.fn().mockResolvedValue([]),
    seedInitialTutorRegistrationsIfEmpty: vi.fn().mockResolvedValue([]),
  };
});

describe('Admin Dynamic Identity Test Suite (ISTQB Grounded & TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-ADI-001: Verifikasi Fungsi getAdminMonogram
  describe('getAdminMonogram Helper', () => {
    it('TC-ADI-001: Should compute correct initials for various name formats', () => {
      expect(getAdminMonogram('Super Admin')).toBe('SA');
      expect(getAdminMonogram('Siti Rahayu')).toBe('SR');
      expect(getAdminMonogram('Siti Rahayu, S.Kom.')).toBe('SR');
      expect(getAdminMonogram('Budi Santoso, M.Pd.')).toBe('BS');
      expect(getAdminMonogram('Budi')).toBe('BU');
      expect(getAdminMonogram('Ibu Fatimah')).toBe('FA');
      expect(getAdminMonogram('')).toBe('SA');
    });
  });

  // TC-ADI-002: Verifikasi Akun Master (Super Admin)
  describe('Master Super Admin Identity Rendering', () => {
    it('TC-ADI-002: Should display "SA", "Super Admin", and "Super Admin Operasional" for master admin', () => {
      render(
        <AdminDashboard
          onLogout={vi.fn()}
          onViewLanding={vi.fn()}
          adminName="Super Admin"
          adminEmail="admin@brightfuture.id"
          adminRole="super_admin"
        />
      );

      // Monogram SA muncul di sidebar dan header
      const monograms = screen.getAllByText('SA');
      expect(monograms.length).toBeGreaterThanOrEqual(2);

      // Nama Super Admin
      const nameElements = screen.getAllByText('Super Admin');
      expect(nameElements.length).toBeGreaterThanOrEqual(2);

      // Subtitle di sidebar
      expect(screen.getByText('Super Admin Operasional')).toBeDefined();

      // Identity badge di header
      expect(screen.getByText(/Super Admin \(admin@brightfuture\.id\)/i)).toBeDefined();

      // Hero greeting banner
      expect(screen.getByText(/Selamat Datang, Super Admin/i)).toBeDefined();

      // Footer status bar
      expect(
        screen.getByText(/Sistem Multi-Role Operasional \(Super Admin: Super Admin\)/i)
      ).toBeDefined();
    });
  });

  // TC-ADI-003: Verifikasi Akun Non-Master (Admin Operasional)
  describe('Non-Master Admin Identity Rendering', () => {
    it('TC-ADI-003: Should display dynamic monogram, user name, and "Admin" role labels for non-master admin', () => {
      render(
        <AdminDashboard
          onLogout={vi.fn()}
          onViewLanding={vi.fn()}
          adminName="Siti Rahayu, S.Kom."
          adminEmail="admin.siti@brightfuture.id"
          adminRole="admin"
        />
      );

      // Monogram SR muncul di sidebar dan header
      const monograms = screen.getAllByText('SR');
      expect(monograms.length).toBeGreaterThanOrEqual(2);

      // Nama Siti Rahayu
      const nameElements = screen.getAllByText('Siti Rahayu, S.Kom.');
      expect(nameElements.length).toBeGreaterThanOrEqual(2);

      // Subtitle di sidebar harus "Admin Operasional" (bukan Super Admin)
      expect(screen.getByText('Admin Operasional')).toBeDefined();

      // Identity badge di header: Admin (admin.siti@brightfuture.id)
      expect(screen.getByText(/Admin \(admin\.siti@brightfuture\.id\)/i)).toBeDefined();

      // Hero greeting banner harus menyapa nama pengguna
      expect(screen.getByText(/Selamat Datang, Siti Rahayu, S\.Kom\./i)).toBeDefined();

      // Footer status bar: (Admin: Siti Rahayu, S.Kom.)
      expect(
        screen.getByText(/Sistem Multi-Role Operasional \(Admin: Siti Rahayu, S\.Kom\.\)/i)
      ).toBeDefined();
    });
  });

  // TC-ADI-004: Fallback Aman saat Props Tidak Diberikan
  describe('Graceful Fallback When Props are Omitted', () => {
    it('TC-ADI-004: Should safely fall back to database credential or default "Super Admin"', () => {
      render(<AdminDashboard onLogout={vi.fn()} onViewLanding={vi.fn()} />);

      // Harus tetap merender tanpa crash dan menampilkan Super Admin sebagai fallback
      expect(screen.getByText(/Selamat Datang, Super Admin/i)).toBeDefined();
    });
  });
});
