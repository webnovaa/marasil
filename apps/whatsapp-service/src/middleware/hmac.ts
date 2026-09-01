import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type RequestWithRawBody = Request & { rawBody?: string };
const seenNonces = new Map<string, number>();

export function computeSignature(
  method: string,
  path: string,
  body: string,
  timestamp: number,
  secret: string,
): string {
  const hashedBody = createHash('sha256').update(body).digest('hex');
  const payload = `${timestamp}.${method.toUpperCase()}.${path}.${hashedBody}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyInternalHmac(req: Request, res: Response, next: NextFunction): void {
  try {
    const secret = process.env.INTERNAL_HMAC_SECRET ?? '';
    if (!secret) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Internal auth is not configured.' },
      });
      return;
    }

    const timestampHeader = req.header('X-Internal-Timestamp');
    const signatureHeader = req.header('X-Internal-Signature');
    const nonceHeader = req.header('X-Internal-Nonce');

    if (!timestampHeader || !signatureHeader || !nonceHeader || !/^[0-9a-f-]{36}$/i.test(nonceHeader) || !/^\d+$/.test(timestampHeader)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Invalid internal signature.' },
      });
      return;
    }

    const timestamp = Number(timestampHeader);
    const maxSkew = Number(process.env.INTERNAL_HMAC_MAX_SKEW ?? 300);
    if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > maxSkew) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Timestamp skew too large.' },
      });
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    for (const [nonce, expires] of seenNonces) if (expires <= now) seenNonces.delete(nonce);
    if (seenNonces.has(nonceHeader)) { res.status(409).json({ success: false, error: { code: 'REPLAY_DETECTED' } }); return; }

    const withRaw = req as RequestWithRawBody;
    const body =
      typeof withRaw.rawBody === 'string'
        ? withRaw.rawBody
        : req.method.toUpperCase() === 'GET' || req.method.toUpperCase() === 'HEAD'
          ? ''
          : JSON.stringify(req.body ?? {});

    const path = (req.originalUrl ?? req.path).split('?')[0] || req.path;
    const expected = computeSignature(req.method, path, body, timestamp, secret);
    const expectedBuf = Buffer.from(expected, 'utf8');
    const providedBuf = Buffer.from(signatureHeader, 'utf8');

    if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Invalid internal signature.' },
      });
      return;
    }

    seenNonces.set(nonceHeader, now + maxSkew);
    next();
  } catch {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Internal auth failed.' },
    });
  }
}
