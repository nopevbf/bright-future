import { handleSnapTokenRequest } from '../../src/server/midtransApiHandlers.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    if (res.setHeader) res.setHeader('Allow', ['POST']);
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  const result = await handleSnapTokenRequest(req.body, serverKey, isProduction);

  return res.status(result.status).json(result.body);
}
