import { describe, expect, it, vi } from 'vitest';
import type { WASocket } from '@whiskeysockets/baileys';
import { BaileysWhatsAppEngine } from '../src/engines/baileys-engine.js';
import type { EncryptedAuthenticationStateRepository } from '../src/auth/authentication-state-repository.js';
import pino from 'pino';

const { sendMessage, callbacks } = vi.hoisted(() => ({ sendMessage: vi.fn(), callbacks: new Map<string, (value: unknown) => Promise<void>>() }));
vi.mock('@whiskeysockets/baileys', () => ({
  makeWASocket: () => ({ ev: { on: (name: string, handler: (value: unknown) => Promise<void>) => callbacks.set(name, handler) }, sendMessage, end: vi.fn() } as unknown as WASocket),
  fetchLatestBaileysVersion: async () => ({ version: [2, 3000, 1] }),
  jidNormalizedUser: (id: string) => id,
  DisconnectReason: { loggedOut: 401 },
}));

describe('Baileys media adapter', () => {
  it.each(['image', 'video', 'audio', 'document'] as const)('passes %s bytes to the socket and deduplicates retry', async (type) => {
    sendMessage.mockReset().mockResolvedValue({ key: { id: 'provider-id' } });
    const repository = { load: async () => ({ state: {}, saveCreds: async () => {} }), integrityHash: () => 'test' } as unknown as EncryptedAuthenticationStateRepository;
    const engine = new BaileysWhatsAppEngine(repository, pino({ enabled: false }));
    const context = { deviceId: 'device_123', tenantId: 'tenant_123', leaseGeneration: 1 };
    await engine.startPairing(context);
    await callbacks.get('connection.update')?.({ connection: 'open' });
    const command = { ...context, commandId: 'command_123', messageId: 'message_123', recipient: '+963944123456', type, media: { data: 'aGVsbG8=', mimetype: 'application/pdf', filename: 'receipt.pdf', caption: 'Receipt' } };
    expect((await engine.sendMedia(command)).status).toBe('sent');
    expect(sendMessage.mock.calls[0][0]).toBe('963944123456@s.whatsapp.net');
    expect(sendMessage.mock.calls[0][1][type]).toEqual(Buffer.from('hello'));
    await engine.sendMedia(command);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect((await engine.sendMedia({ ...command, tenantId: 'other_tenant' })).errorCode).toBe('LEASE_LOST');
  });
});
