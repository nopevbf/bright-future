import { handleTransactionStatusRequest } from '../../src/server/midtransApiHandlers.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    if (res.setHeader) res.setHeader('Allow', ['GET']);
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const orderId = (req.query?.order_id || req.query?.orderId || '').toString().trim();
  const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').replace(/['"]/g, '').trim();
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  const result = await handleTransactionStatusRequest(
    orderId,
    serverKey,
    isProduction,
    async (completedOrderId, mappedStatus) => {
      // Sync to Firestore if paid
      const baseOrderId = completedOrderId.includes('_')
        ? completedOrderId.split('_')[0]
        : completedOrderId;

      try {
        const { db } = await import('../../src/firebase.ts');
        const { doc, updateDoc, getDoc, collection, query, where, getDocs } = await import(
          'firebase/firestore'
        );

        if (!db) return;

        // 1. Update Invoice
        let invRef = doc(db, 'invoices', baseOrderId);
        let invSnap = await getDoc(invRef);
        if (!invSnap.exists() && baseOrderId !== completedOrderId) {
          invRef = doc(db, 'invoices', completedOrderId);
          invSnap = await getDoc(invRef);
        }

        if (invSnap.exists()) {
          await updateDoc(invRef, {
            status: mappedStatus.invoiceStatus,
            updatedAt: new Date().toISOString(),
          });
        }

        // 2. Update Student Registration
        const regCol = collection(db, 'registrations');
        const q = query(regCol, where('invoiceNumber', 'in', [baseOrderId, completedOrderId]));
        const regSnaps = await getDocs(q);
        for (const rDoc of regSnaps.docs) {
          await updateDoc(doc(db, 'registrations', rDoc.id), {
            paymentStatus: mappedStatus.paymentStatus,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('[Midtrans Status API] Firestore sync error:', err);
      }
    }
  );

  return res.status(result.status).json(result.body);
}
