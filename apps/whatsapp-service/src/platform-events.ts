import { computeSignature } from './middleware/hmac.js';

type PlatformEvent = {
  event_id: string;
  event_type: string;
  device_id: string;
  occurred_at: string;
  payload?: Record<string, unknown>;
};

export async function postPlatformEvent(
  event: Omit<PlatformEvent, 'event_id' | 'occurred_at'> & Partial<PlatformEvent>,
): Promise<void> {
  const baseUrl = (process.env.PLATFORM_INTERNAL_URL ?? process.env.LARAVEL_INTERNAL_URL ?? '').replace(
    /\/$/,
    '',
  );
  const secret = process.env.INTERNAL_HMAC_SECRET ?? '';

  if (!baseUrl || !secret) {
    return;
  }

  const bodyObject: PlatformEvent = {
    event_id: event.event_id ?? crypto.randomUUID(),
    event_type: event.event_type,
    device_id: event.device_id,
    occurred_at: event.occurred_at ?? new Date().toISOString(),
    payload: event.payload ?? {},
  };

  const path = '/api/internal/v1/whatsapp/events';
  const body = JSON.stringify(bodyObject);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = computeSignature('POST', path, body, timestamp, secret);

  await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Internal-Timestamp': String(timestamp),
      'X-Internal-Signature': signature,
      'X-Internal-Nonce': crypto.randomUUID(),
      'X-Contract-Version': process.env.CONTRACT_VERSION ?? '1',
    },
    body,
  });
}
