import { execSync } from 'child_process';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

async function purgeAllNonAdminPhysicalDocuments() {
  console.log('====================================================');
  console.log(' GOOGLE CLOUD ADMIN PURGE FOR FIRESTORE (ALL DATA)  ');
  console.log('====================================================');

  const token = execSync('gcloud auth print-access-token').toString().trim();
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;

  const operationalCollections = [
    'registrations',
    'invoices',
    'tutor_visits',
    'tutor_registrations',
    'tutor_assignments',
    'managed_students',
  ];

  // 1. Purge seluruh dokumen di koleksi operasional
  for (const col of operationalCollections) {
    console.log(`\n--- Memeriksa dokumen fisik di [${col}] ---`);
    const listRes = await fetch(`${baseUrl}/${col}?pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json();
    const docIds: string[] = (listData.documents || []).map((doc: any) => {
      const parts = doc.name.split('/');
      return parts[parts.length - 1];
    });

    console.log(`Ditemukan ${docIds.length} dokumen fisik di [${col}].`);
    for (const docId of docIds) {
      console.log(`  [DELETE PHYSICAL] ${col}/${docId} ...`);
      const delRes = await fetch(`${baseUrl}/${col}/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (delRes.ok) {
        console.log(`  -> SUCCESS deleted ${col}/${docId}`);
      } else {
        console.warn(`  -> FAILED deleted ${col}/${docId}:`, delRes.status);
      }
    }
  }

  // 2. Purge akun non-admin di portal_credentials
  console.log('\n--- Memeriksa dokumen di [portal_credentials] ---');
  const portalListRes = await fetch(`${baseUrl}/portal_credentials?pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const portalListData = await portalListRes.json();
  const portalDocs: any[] = portalListData.documents || [];

  for (const docObj of portalDocs) {
    const parts = docObj.name.split('/');
    const docId = parts[parts.length - 1];
    const role = docObj.fields?.role?.stringValue || '';

    if (role === 'admin' || role === 'super_admin') {
      console.log(`  [PRESERVE ADMIN] portal_credentials/${docId} (Role: ${role})`);
    } else {
      console.log(`  [DELETE NON-ADMIN] portal_credentials/${docId} (Role: ${role}) ...`);
      const delRes = await fetch(`${baseUrl}/portal_credentials/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (delRes.ok) {
        console.log(`  -> SUCCESS deleted portal_credentials/${docId}`);
      } else {
        console.warn(`  -> FAILED deleted portal_credentials/${docId}`);
      }
    }
  }

  // 3. Purge sisa dokumen test di admin_credentials
  console.log('\n--- Memeriksa dokumen di [admin_credentials] ---');
  const adminListRes = await fetch(`${baseUrl}/admin_credentials?pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const adminListData = await adminListRes.json();
  const adminDocs: any[] = adminListData.documents || [];

  for (const docObj of adminDocs) {
    const parts = docObj.name.split('/');
    const docId = parts[parts.length - 1];
    if (docId.startsWith('admin_test_') || docId.startsWith('temp_test_') || docId.includes('muy48qsu')) {
      console.log(`  [DELETE TEST ARTIFACT] admin_credentials/${docId} ...`);
      await fetch(`${baseUrl}/admin_credentials/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      console.log(`  [PRESERVE ADMIN] admin_credentials/${docId}`);
    }
  }

  // 4. Verifikasi Akhir
  console.log('\n====================================================');
  console.log(' HASIL VERIFIKASI AKHIR SETELAH PEMBERSIHAN TOTAL   ');
  console.log('====================================================');

  const allCols = [...operationalCollections, 'portal_credentials', 'admin_credentials'];
  for (const col of allCols) {
    const checkRes = await fetch(`${baseUrl}/${col}?pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkData = await checkRes.json();
    const count = (checkData.documents || []).length;
    console.log(`Koleksi [${col}]: ${count} dokumen fisik`);
    if (count > 0) {
      checkData.documents.forEach((d: any) => {
        const id = d.name.split('/').pop();
        const role = d.fields?.role?.stringValue || '-';
        console.log(`   - ID: ${id} | Role: ${role}`);
      });
    }
  }
}

purgeAllNonAdminPhysicalDocuments()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error saat purge total:', err);
    process.exit(1);
  });
