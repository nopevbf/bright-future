import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountManagementSubTab, AccountManagementSubTabProps } from '../components/admin/AccountManagementSubTab';
import { AdminCredentialDoc, PortalCredentialDoc } from '../firebase';

describe('Admin Account Management RBAC Test Suite (ISTQB Grounded)', () => {
  const mockAdminCredential: AdminCredentialDoc = {
    email: 'admin@brightfuture.id',
    name: 'Super Admin',
    password: 'superadminpassword123',
    role: 'super_admin',
    updatedAt: '2026-10-07T12:00:00Z',
  };

  const mockPortalAccounts: PortalCredentialDoc[] = [
    {
      id: 'portal_tutor_1',
      name: 'Budi Santoso, S.Pd.',
      role: 'tutor',
      identifier: 'tutor.budi@brightfuture.id',
      whatsapp: '081234567890',
      password: '123456789',
      summary: 'Tutor Matematika & Sains',
    },
    {
      id: 'portal_siswa_1',
      name: 'Rian Pratama',
      role: 'siswa',
      identifier: 'SISWA-2026-001',
      whatsapp: '081298765432',
      password: '123456789',
      summary: 'Siswa Kelas 5 SD',
    },
  ];

  let onSyncDatabaseMock: any;
  let onUpdateAdminPasswordMock: any;
  let onUpdatePortalPasswordMock: any;
  let onCreateAccountMock: any;
  let onEditAccountMock: any;
  let onDeleteAccountMock: any;
  let onUpdateRoleMock: any;
  let onLogoutMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    onSyncDatabaseMock = vi.fn().mockResolvedValue(undefined);
    onUpdateAdminPasswordMock = vi.fn().mockResolvedValue({ success: true });
    onUpdatePortalPasswordMock = vi.fn().mockResolvedValue({ success: true });
    onCreateAccountMock = vi.fn().mockResolvedValue({ success: true, id: 'acc_generated_123' });
    onEditAccountMock = vi.fn().mockResolvedValue({ success: true });
    onDeleteAccountMock = vi.fn().mockResolvedValue({ success: true });
    onUpdateRoleMock = vi.fn().mockResolvedValue({ success: true });
    onLogoutMock = vi.fn();
  });

  const renderComponent = (currentUserRole = 'super_admin') => {
    const props: AccountManagementSubTabProps = {
      adminCredential: mockAdminCredential,
      portalAccounts: mockPortalAccounts,
      verifiedRegistrations: [],
      acceptedTutors: [],
      isSyncingDb: false,
      currentUserRole,
      onSyncDatabase: onSyncDatabaseMock,
      onUpdateAdminPassword: onUpdateAdminPasswordMock,
      onUpdatePortalPassword: onUpdatePortalPasswordMock,
      onCreateAccount: onCreateAccountMock,
      onEditAccount: onEditAccountMock,
      onDeleteAccount: onDeleteAccountMock,
      onUpdateRole: onUpdateRoleMock,
      onLogout: onLogoutMock,
    };
    return render(<AccountManagementSubTab {...props} />);
  };

  // TC-RBAC-001: Verifikasi Identitas Super Admin & Initial Monogram
  it('TC-RBAC-001: Should display "Super Admin", monogram "SA", and SUPER ADMIN ACCESS banner', () => {
    renderComponent('super_admin');

    // Cek nama Super Admin di card master
    const superAdminElements = screen.getAllByText(/Super Admin/i);
    expect(superAdminElements.length).toBeGreaterThan(0);

    // Cek inisial SA
    expect(screen.getByText('SA')).toBeDefined();

    // Cek banner Super Admin Access
    expect(screen.getByText('SUPER ADMIN ACCESS')).toBeDefined();
    expect(screen.getByText(/Hak Akses Penuh: Super Admin Aktif/i)).toBeDefined();
  });

  // TC-RBAC-002: Verifikasi Tombol Aksi Mutasi Database Aktif untuk Super Admin
  it('TC-RBAC-002: Should provide active Create, Edit, Quick Role, and Delete actions when role is super_admin', () => {
    renderComponent('super_admin');

    // Tombol Tambah Akun Baru harus ada dan aktif
    const btnTambah = screen.getByTestId('btn-tambah-akun');
    expect(btnTambah).toBeDefined();
    expect(btnTambah.hasAttribute('disabled')).toBe(false);

    // Tombol Edit akun harus ada untuk akun non-master
    const btnEdit = screen.getByTestId('btn-edit-portal_tutor_1');
    expect(btnEdit).toBeDefined();

    // Tombol Delete akun harus ada untuk akun non-master
    const btnDelete = screen.getByTestId('btn-delete-portal_tutor_1');
    expect(btnDelete).toBeDefined();
  });

  // TC-RBAC-003: Verifikasi Mode Read-Only untuk Role Non-Super Admin
  it('TC-RBAC-003: Should restrict Create/Edit/Delete actions and show Read-Only mode for non-super_admin users', () => {
    renderComponent('tutor');

    // Banner harus menampilkan Read-Only Access
    expect(screen.getByText('READ-ONLY ACCESS')).toBeDefined();
    expect(screen.getByText(/Mode Tinjauan Terbatas \(Read-Only\)/i)).toBeDefined();

    // Tombol Tambah Akun Baru harus disabled
    expect(screen.queryByTestId('btn-tambah-akun')).toBeNull();
    const disabledBtn = screen.getByText(/\+ Tambah Akun \(Hanya Super Admin\)/i);
    expect(disabledBtn).toBeDefined();

    // Tombol Edit dan Delete tidak boleh dirender untuk non-super admin
    expect(screen.queryByTestId('btn-edit-portal_tutor_1')).toBeNull();
    expect(screen.queryByTestId('btn-delete-portal_tutor_1')).toBeNull();

    // Menampilkan label Read-Only pada aksi baris
    const readOnlyBadges = screen.getAllByText(/Read-Only/i);
    expect(readOnlyBadges.length).toBeGreaterThan(0);
  });

  // TC-RBAC-004: Verifikasi Alur Pembuatan Akun Baru (Create) ke Database
  it('TC-RBAC-004: Should invoke onCreateAccount and show toast when Super Admin adds a new account', async () => {
    renderComponent('super_admin');

    const btnTambah = screen.getByTestId('btn-tambah-akun');
    fireEvent.click(btnTambah);

    // Modal Create harus muncul
    expect(screen.getByText(/Tambah Akun Pengguna Baru/i)).toBeDefined();

    // Isi form
    const namaInput = screen.getByPlaceholderText(/Contoh: Ahmad Fauzi/i);
    const identifierInput = screen.getByPlaceholderText(/Email, ID Siswa, atau No HP/i);

    fireEvent.change(namaInput, { target: { value: 'Siti Aminah, S.Pd.' } });
    fireEvent.change(identifierInput, { target: { value: 'tutor.siti@brightfuture.id' } });

    // Submit form
    const submitBtn = screen.getByText(/Simpan Akun Baru/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onCreateAccountMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Siti Aminah, S.Pd.',
          identifier: 'tutor.siti@brightfuture.id',
          role: 'siswa', // default select
        })
      );
    });

    // Toast feedback muncul
    expect(await screen.findByText(/berhasil dibuat dan disimpan/i)).toBeDefined();
  });

  // TC-RBAC-005: Verifikasi Alur Edit Akun dan Setting Role ke Database
  it('TC-RBAC-005: Should invoke onEditAccount when Super Admin edits account profile & role', async () => {
    renderComponent('super_admin');

    const btnEdit = screen.getByTestId('btn-edit-portal_tutor_1');
    fireEvent.click(btnEdit);

    // Modal Edit harus muncul
    expect(screen.getByText(/Edit Akun & Atur Peran/i)).toBeDefined();

    const nameInput = screen.getByDisplayValue('Budi Santoso, S.Pd.');
    fireEvent.change(nameInput, { target: { value: 'Budi Santoso, M.Pd.' } });

    const submitBtn = screen.getByText(/Simpan Perubahan/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onEditAccountMock).toHaveBeenCalledWith(
        'portal_tutor_1',
        expect.objectContaining({
          name: 'Budi Santoso, M.Pd.',
        })
      );
    });
  });

  // TC-RBAC-006: Verifikasi Alur Delete Akun dan Proteksi Akun Master
  it('TC-RBAC-006: Should allow deleting non-master accounts and protect master admin account', async () => {
    renderComponent('super_admin');

    // Akun Master harus memiliki badge "Akun Master" dan tidak ada tombol delete
    expect(screen.getByText('Akun Master')).toBeDefined();
    expect(screen.queryByTestId('btn-delete-admin_master')).toBeNull();

    // Klik tombol delete pada akun tutor
    const btnDelete = screen.getByTestId('btn-delete-portal_tutor_1');
    fireEvent.click(btnDelete);

    // Modal konfirmasi delete harus muncul
    expect(screen.getByText(/Konfirmasi Hapus Akun/i)).toBeDefined();

    // Konfirmasi hapus
    const confirmDeleteBtn = screen.getByText(/Ya, Hapus Permanen/i);
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(onDeleteAccountMock).toHaveBeenCalledWith('portal_tutor_1');
    });
  });
});
