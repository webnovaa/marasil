import type { DeviceContext, DeviceStatus, EngineEventHandler, PairingQr, SendTextCommand, SendTextResult, WhatsAppEngine } from './types.js';

export class MockWhatsAppEngine implements WhatsAppEngine {
  readonly name = 'mock' as const;
  private readonly sessions = new Map<string, DeviceContext>();
  private readonly pairingQrs = new Map<string, PairingQr & { expiresAt: number }>();
  private handler: EngineEventHandler = () => undefined;
  onEvent(handler: EngineEventHandler): void { this.handler = handler; }
  async createSession(context: DeviceContext): Promise<void> { this.sessions.set(context.deviceId, context); }
  async startPairing(context: DeviceContext): Promise<void> { const qr = `mock:${context.deviceId}`; this.sessions.set(context.deviceId, context); this.pairingQrs.set(context.deviceId, { qr, expiresIn: 20, expiresAt: Date.now() + 20_000 }); await this.handler({ type: 'device.qr_ready', context, payload: { qr, expires_in: 20 } }); }
  async getStatus(deviceId: string): Promise<DeviceStatus> { return this.sessions.has(deviceId) ? 'connected' : 'disconnected'; }
  getPairingQr(deviceId: string): PairingQr | null { const pairing = this.pairingQrs.get(deviceId); if (!pairing) return null; const expiresIn = Math.ceil((pairing.expiresAt - Date.now()) / 1000); if (expiresIn <= 0) { this.pairingQrs.delete(deviceId); return null; } return { qr: pairing.qr, expiresIn }; }
  async sendText(command: SendTextCommand): Promise<SendTextResult> { return this.sessions.has(command.deviceId) ? { providerMessageId: `mock_${command.messageId}`, status: 'sent' } : { providerMessageId: '', status: 'failed', errorCode: 'DEVICE_NOT_CONNECTED' }; }
  async disconnect(deviceId: string): Promise<void> { this.sessions.delete(deviceId); this.pairingQrs.delete(deviceId); }
  async logout(deviceId: string): Promise<void> { this.sessions.delete(deviceId); this.pairingQrs.delete(deviceId); }
  async restore(context: DeviceContext): Promise<boolean> { this.sessions.set(context.deviceId, context); return true; }
  async deleteSession(deviceId: string): Promise<void> { this.sessions.delete(deviceId); this.pairingQrs.delete(deviceId); }
  async shutdown(): Promise<void> { this.sessions.clear(); this.pairingQrs.clear(); }
}
