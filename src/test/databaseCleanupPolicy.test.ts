import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  classifyDocumentForCleanup,
  filterPortalCredentialsForRetention,
  filterAdminCredentialsForRetention,
  CleanupClassificationResult,
} from '../services/databaseCleaner';

describe('SQA-ISTQB & TDD: Database Cleanup Policy & Test Data Lifecycle', () => {
  // TC-PURGE-001: Verifikasi koleksi operasional seluruhnya ditandai untuk dihapus
  it('TC-PURGE-001: Operational collections (registrations, invoices, visits, etc.) should always be marked for deletion', () => {
    const operationalCollections = [
      'registrations',
      'invoices',
      'tutor_visits',
      'tutor_registrations',
      'tutor_assignments',
      'managed_students',
    ];

    operationalCollections.forEach((colName) => {
      const result: CleanupClassificationResult = classifyDocumentForCleanup(colName, 'doc-123', {
        name: 'Sample Doc',
      });
      expect(result.action).toBe('delete');
      expect(result.reason).toContain('Koleksi operasional');
    });
  });

  // TC-PURGE-002: Verifikasi akun admin di portal_credentials selalu dipertahankan
  it('TC-PURGE-002: portal_credentials retention keeps admin roles and marks non-admin for deletion', () => {
    const portalDocs = [
      { id: 'admin_1', role: 'admin', name: 'Firman Jay', identifier: 'admin2@brightfuture.id' },
      { id: 'admin_2', role: 'super_admin', name: 'Super Admin', identifier: 'admin@brightfuture.id' },
      { id: 'tutor_1', role: 'tutor', name: 'Kak Anindya', identifier: 'anindya@brightfuture.id' },
      { id: 'siswa_1', role: 'siswa', name: 'Rayhan', identifier: 'BF-123' },
      { id: 'ortu_1', role: 'orang_tua', name: 'Bunda Ratna', identifier: '081298765432' },
    ];

    const { retain, remove } = filterPortalCredentialsForRetention(portalDocs);

    expect(retain.map((d) => d.id)).toEqual(['admin_1', 'admin_2']);
    expect(remove.map((d) => d.id)).toEqual(['tutor_1', 'siswa_1', 'ortu_1']);
  });

  // TC-PURGE-003: Verifikasi akun sisa uji coba di admin_credentials dihapus, akun resmi dipertahankan
  it('TC-PURGE-003: admin_credentials keeps master and official admins, marks test artifacts for deletion', () => {
    const adminDocs = [
      { id: 'admin', role: 'super_admin', email: 'admin@brightfuture.id', name: 'Super Admin' },
      { id: 'admin_admin2_brightfuture_id_muy3tt0e', role: 'admin', email: 'admin2@brightfuture.id', name: 'Firman Jay' },
      { id: 'admin_test_1791378056622_brightfuture_id_muy48qsu', role: 'admin', email: 'admin_test@brightfuture.id', name: 'Admin Test Operasional' },
      { id: 'temp_test_doc_xyz', role: 'admin', email: 'temp@test.com', name: 'Temp Test' },
    ];

    const { retain, remove } = filterAdminCredentialsForRetention(adminDocs);

    expect(retain.map((d) => d.id)).toEqual(['admin', 'admin_admin2_brightfuture_id_muy3tt0e']);
    expect(remove.map((d) => d.id)).toEqual([
      'admin_test_1791378056622_brightfuture_id_muy48qsu',
      'temp_test_doc_xyz',
    ]);
  });

  // TC-PURGE-004: TDD Lifecycle Test - Data uji yang dibuat saat test harus dibersihkan setelah test selesai
  describe('TC-PURGE-004: Test Data Lifecycle Teardown Guarantee', () => {
    const temporaryMockStore = new Map<string, any>();

    const createTestData = (id: string, data: any) => {
      temporaryMockStore.set(id, data);
      return id;
    };

    const cleanupTestData = (prefix: string) => {
      for (const key of temporaryMockStore.keys()) {
        if (key.startsWith(prefix)) {
          temporaryMockStore.delete(key);
        }
      }
    };

    beforeEach(() => {
      // Pastikan store bersih sebelum test
      temporaryMockStore.clear();
    });

    afterEach(() => {
      // Wajib: Teardown cleanup data uji yang dibuat dalam test
      cleanupTestData('TEST_DATA_');
      expect(temporaryMockStore.size).toBe(0);
    });

    it('should create test data and verify it is completely purged during test teardown', () => {
      // 1. Simulasikan pembuatan test data saat eksekusi test
      const testDocId1 = createTestData('TEST_DATA_REG_001', { studentName: 'Test Student A' });
      const testDocId2 = createTestData('TEST_DATA_INV_001', { amount: 150000 });

      expect(temporaryMockStore.has(testDocId1)).toBe(true);
      expect(temporaryMockStore.has(testDocId2)).toBe(true);
      expect(temporaryMockStore.size).toBe(2);

      // Setelah blok ini selesai, afterEach akan menjalankan cleanupTestData('TEST_DATA_')
      // dan memverifikasi temporaryMockStore.size === 0 (Zero Residue).
    });
  });
});
