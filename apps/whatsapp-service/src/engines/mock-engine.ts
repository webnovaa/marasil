import type { DeviceContext, DeviceStatus, EngineEventHandler, SendTextCommand, SendTextResult, WhatsAppEngine } from './types.js';

export class MockWhatsAppEngine implements WhatsAppEngine {
  readonly name = 'mock' as const;
  private readonly sessions = new Map<string, DeviceContext>();
  private handler: EngineEventHandler = () => undefined;
  onEvent(handler: EngineEventHandler): void { this.handler = handler; }
  async createSession(context: DeviceContext): Promise<void> { this.sessions.set(context.deviceId, context); }
  async startPairing(context: DeviceContext): Promise<void> { this.sessions.set(context.deviceId, context); await this.handler({ type: 'device.qr_ready', context, payload: { qr: `mock:${context.deviceId}`, expires_in: 45 } }); }
  async getStatus(deviceId: string): Promise<DeviceStatus> { return this.sessions.has(deviceId) ? 'connected' : 'disconnected'; }
  async sendText(command: SendTextCommand): Promise<SendTextResult> { return this.sessions.has(command.deviceId) ? { providerMessageId: `mock_${command.messageId}`, status: 'sent' } : { providerMessageId: '', status: 'failed', errorCode: 'DEVICE_NOT_CONNECTED' }; }
  async disconnect(deviceId: string): Promise<void> { this.sessions.delete(deviceId); }
  async logout(deviceId: string): Promise<void> { this.sessions.delete(deviceId); }
  async restore(context: DeviceContext): Promise<boolean> { this.sessions.set(context.deviceId, context); return true; }
  async deleteSession(deviceId: string): Promise<void> { this.sessions.delete(deviceId); }
  async shutdown(): Promise<void> { this.sessions.clear(); }
}
