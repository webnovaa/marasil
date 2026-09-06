import { describe, expect, it } from 'vitest';
import { MockWhatsAppEngine } from '../src/engines/mock-engine.js';
import { messageCommandSchema } from '../src/message-command.js';

const context = { deviceId: 'device_123', tenantId: 'tenant_123', leaseGeneration: 1 };
const command = { ...context, commandId: 'command_123', messageId: 'message_123', recipient: '+963944123456', text: 'Hello' };

describe('WhatsApp engine contract', () => {
  it('sends through a connected session and rejects a disconnected one', async () => {
    const engine = new MockWhatsAppEngine();
    expect((await engine.sendText(command)).errorCode).toBe('DEVICE_NOT_CONNECTED');
    await engine.createSession(context);
    expect((await engine.sendText(command)).status).toBe('sent');
    await engine.disconnect(context.deviceId);
    expect((await engine.sendText(command)).errorCode).toBe('DEVICE_NOT_CONNECTED');
  });
  it('rejects cross-tenant and stale lease commands', async () => {
    const engine = new MockWhatsAppEngine();
    await engine.createSession(context);
    expect((await engine.sendText({ ...command, tenantId: 'another_tenant' })).errorCode).toBe('LEASE_LOST');
    expect((await engine.sendText({ ...command, leaseGeneration: 0 })).errorCode).toBe('LEASE_LOST');
  });
  it.each(['image', 'document', 'audio', 'video'] as const)('supports %s commands', async (type) => {
    const engine = new MockWhatsAppEngine();
    await engine.createSession(context);
    expect((await engine.sendMedia({ ...command, type, media: { data: 'aGVsbG8=', mimetype: 'application/pdf', filename: 'receipt.pdf' } })).status).toBe('sent');
  });
  it('clears pairing codes and sessions on shutdown', async () => {
    const engine = new MockWhatsAppEngine();
    await engine.startPairing(context);
    expect(engine.getPairingQr(context.deviceId)?.qr).toContain(context.deviceId);
    await engine.shutdown();
    expect(engine.getPairingQr(context.deviceId)).toBeNull();
    expect(await engine.getStatus(context.deviceId)).toBe('disconnected');
  });
});

describe('internal message validation', () => {
  const base = { command_id: command.commandId, message_id: command.messageId, device_id: context.deviceId, tenant_id: context.tenantId, lease_generation: 1, recipient: command.recipient };
  it('preserves existing text requests', () => {
    expect(messageCommandSchema.safeParse({ ...base, text: 'Hello' }).success).toBe(true);
  });
  it('rejects missing bytes, invalid base64 and path filenames', () => {
    expect(messageCommandSchema.safeParse({ ...base, type: 'image' }).success).toBe(false);
    for (const media of [
      { data: 'bad!', mimetype: 'image/png', filename: 'image.png' },
      { data: 'aGVsbG8=', mimetype: 'image/png', filename: '../image.png' },
    ]) expect(messageCommandSchema.safeParse({ ...base, type: 'image', media }).success).toBe(false);
  });
});
