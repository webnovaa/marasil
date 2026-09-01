import { describe, expect, it } from 'vitest';
import { MockMessagingProvider } from '../src/providers/mock-provider.js';

describe('MockMessagingProvider', () => {
  it('creates a session and sends a text message', async () => {
    const provider = new MockMessagingProvider();
    await provider.createSession('device_1');

    const result = await provider.sendMessage({
      commandId: 'cmd_1',
      contractVersion: '1',
      deviceId: 'device_1',
      messageId: 'msg_1',
      type: 'text',
      to: '+963900000000',
      body: 'hello',
    });

    expect(result.status).toBe('sent');
    expect(result.providerMessageId).toBe('mock_msg_1');
  });

  it('fails send when session is missing', async () => {
    const provider = new MockMessagingProvider();
    const result = await provider.sendMessage({
      commandId: 'cmd_2',
      contractVersion: '1',
      deviceId: 'missing',
      messageId: 'msg_2',
      type: 'text',
      to: '+963900000000',
      body: 'hello',
    });

    expect(result.status).toBe('failed');
    expect(result.errorCode).toBe('DEVICE_NOT_CONNECTED');
  });
});
