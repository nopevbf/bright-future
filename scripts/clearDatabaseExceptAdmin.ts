import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import {
  classifyDocumentForCleanup,
} from '../src/services/databaseCleaner';

async function runDatabasePurge() {
  console.log('====================================================');
  console.log(' BRIGHT FUTURE: DATABASE CLEANUP (EXCEPT ADMIN)     ');
  console.log('====================================================');
  console.log(`Target Project: ${firebaseConfig.projectId}`);
  console.log(`Database ID   : ${firebaseConfig.firestoreDatabaseId}`);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const collections = [
    'invoices',
    'tutor_visits',
    'tutor_registrations',
    'tutor_assignments',
    'managed_students',
    'portal_credentials',
    'registrations',
    'admin_credentials',
  ];

  let totalDeleted = 0;
  let totalRetained = 0;

  for (const colName of collections) {
    console.log(`\n--- Memeriksa Koleksi [${colName}] ---`);
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    console.log(`Ditemukan ${snap.size} dokumen.`);

    for (const d of snap.docs) {
      const data = d.data();
      const docId = d.id;
      const classification = classifyDocumentForCleanup(colName, docId, data);

      if (classification.action === 'delete') {
        if (colName === 'registrations') {
          // Firestore Security Rules melarang delete langsung pada registrations,
          // sehingga kita tandai isPurged: true dan isDeleted: true
          console.log(`  [PURGE/MARK-DELETED] ${docId} -> Alasan: ${classification.reason}`);
          await setDoc(
            doc(db, colName, docId),
            {
              isPurged: true,
              isDeleted: true,
              paymentStatus: 'deleted',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          totalDeleted++;
        } else {
          try {
            console.log(`  [DELETE] ${docId} -> Alasan: ${classification.reason}`);
            await deleteDoc(doc(db, colName, docId));
            totalDeleted++;
          } catch (delErr: any) {
            console.warn(`  [WARN] Tidak dapat menghapus langsung ${docId}: ${delErr.message}`);
          }
        }
      } else {
        console.log(`  [RETAIN] ${docId} -> Alasan: ${classification.reason} (Role: ${data.role || '-'}, Nama: ${data.name || '-'})`);
        totalRetained++;
      }
    }
  }

  console.log('\n====================================================');
  console.log(' HASIL VERIFIKASI AKHIR BASIS DATA                  ');
  console.log('====================================================');
  console.log(`Total Tindakan Pembersihan : ${totalDeleted}`);
  console.log(`Total Dokumen Dipertahankan: ${totalRetained}`);

  for (const colName of collections) {
    const snap = await getDocs(collection(db, colName));
    if (colName === 'registrations') {
      const activeRegs = snap.docs.filter((d) => !d.data().isPurged && !d.data().isDeleted);
      console.log(`Status [${colName}]: ${activeRegs.length} dokumen aktif (${snap.size - activeRegs.length} dokumen di-purge).`);
    } else {
      console.log(`Status [${colName}]: ${snap.size} dokumen aktif tersisa.`);
      snap.forEach((d) => {
        const data = d.data();
        console.log(`  - Dokumen Aktif: ${d.id} (Role: ${data.role || '-'}, Identitas: ${data.email || data.identifier || '-'}, Nama: ${data.name || '-'})`);
      });
    }
  }

  console.log('====================================================');
  console.log(' Pembersihan Selesai: Seluruh Akun Admin Aman.      ');
  console.log('====================================================');
}

runDatabasePurge()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Pembersihan gagal:', err);
    process.exit(1);
  });
