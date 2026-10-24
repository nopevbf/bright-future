import { handleWebhookRequest } from '../../src/server/midtransApiHandlers.ts';
import { db } from '../../src/firebase.ts';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    if (res.setHeader) res.setHeader('Allow', ['POST']);
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

  const result = await handleWebhookRequest(
    req.body,
    serverKey,
    async (orderId, mappedStatus) => {
      try {
        if (!db) return;

        // 1. Update Invoice if exists
        const invRef = doc(db, 'invoices', orderId);
        const invSnap = await getDoc(invRef);
        if (invSnap.exists()) {
          await updateDoc(invRef, {
            status: mappedStatus.invoiceStatus,
            updatedAt: new Date().toISOString(),
          });
        }

        // 2. Update Student Registration with matching invoiceNumber
        const regCol = collection(db, 'registrations');
        const q = query(regCol, where('invoiceNumber', '==', orderId));
        const regSnaps = await getDocs(q);
        for (const rDoc of regSnaps.docs) {
          await updateDoc(doc(db, 'registrations', rDoc.id), {
            paymentStatus: mappedStatus.paymentStatus,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('[Midtrans Webhook] Firestore synchronization error:', err);
      }
    }
  );

  return res.status(result.status).json(result.body);
}
