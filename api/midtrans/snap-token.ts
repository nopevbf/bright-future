import { handleSnapTokenRequest } from '../../src/server/midtransApiHandlers.ts';

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
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  const body = await parseBody(req);
  const result = await handleSnapTokenRequest(body, serverKey, isProduction);

  return res.status(result.status).json(result.body);
}
