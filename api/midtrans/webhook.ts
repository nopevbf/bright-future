import { handleWebhookRequest } from '../../src/server/midtransApiHandlers.ts';

async function parseBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return req.body;
      }
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf-8'));
      } catch {
        return {};
      }
    }
    return req.body;
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    if (res.setHeader) res.setHeader('Allow', ['POST']);
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').replace(/['"]/g, '').trim();
  const body = await parseBody(req);

  const result = await handleWebhookRequest(
    body,
    serverKey,
    async (orderId, mappedStatus) => {
      // Midtrans test notification ping from dashboard
      if (orderId && orderId.startsWith('payment_notif_test_')) {
        return;
      }

      // Extract base invoice ID if orderId contains method/timestamp suffix (e.g. INV-001_bca_1729760000)
      const baseOrderId = orderId && orderId.includes('_') ? orderId.split('_')[0] : orderId;

      try {
        // Dynamic import to avoid cold-start crashes in serverless runtime
        const { db } = await import('../../src/firebase.ts');
        const { doc, updateDoc, getDoc, collection, query, where, getDocs } = await import(
          'firebase/firestore'
        );

        if (!db) return;

        // 1. Update Invoice if exists (check baseOrderId first, then orderId)
        let invRef = doc(db, 'invoices', baseOrderId);
        let invSnap = await getDoc(invRef);
        if (!invSnap.exists() && baseOrderId !== orderId) {
          invRef = doc(db, 'invoices', orderId);
          invSnap = await getDoc(invRef);
        }

        if (invSnap.exists()) {
          await updateDoc(invRef, {
            status: mappedStatus.invoiceStatus,
            updatedAt: new Date().toISOString(),
          });
        }

        // 2. Update Student Registration with matching invoiceNumber
        const regCol = collection(db, 'registrations');
        const q = query(regCol, where('invoiceNumber', 'in', [baseOrderId, orderId]));
        const regSnaps = await getDocs(q);
        for (const rDoc of regSnaps.docs) {
          await updateDoc(doc(db, 'registrations', rDoc.id), {
            paymentStatus: mappedStatus.paymentStatus,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('[Midtrans Webhook] Firestore synchronization error (safe):', err);
      }
    }
  );

  return res.status(result.status).json(result.body);
}
