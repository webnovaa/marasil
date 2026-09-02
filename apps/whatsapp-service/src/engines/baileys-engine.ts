import { makeWASocket, DisconnectReason, fetchLatestBaileysVersion, jidNormalizedUser, type ConnectionState, type WAMessageUpdate, type WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import type pino from 'pino';
import { EncryptedAuthenticationStateRepository } from '../auth/authentication-state-repository.js';
import type { DeviceContext, DeviceStatus, EngineEventHandler, PairingQr, SendTextCommand, SendTextResult, WhatsAppEngine } from './types.js';

const QR_TTL_SECONDS = 20;

type Runtime = { context: DeviceContext; socket: WASocket; status: DeviceStatus; reconnects: number; stopped: boolean; pairingQr: (PairingQr & { expiresAt: number }) | null };

export class BaileysWhatsAppEngine implements WhatsAppEngine {
  readonly name = 'baileys' as const;
  private readonly runtimes = new Map<string, Runtime>();
  private readonly sent = new Map<string, SendTextResult>();
  private handler: EngineEventHandler = () => undefined;

  constructor(private readonly repository: EncryptedAuthenticationStateRepository, private readonly logger: pino.Logger) {}
  onEvent(handler: EngineEventHandler): void { this.handler = handler; }
  async createSession(context: DeviceContext): Promise<void> { await this.open(context, false); }
  async startPairing(context: DeviceContext): Promise<void> { await this.open(context, false); }
  async restore(context: DeviceContext): Promise<boolean> { if (!await this.repository.exists(context.deviceId)) return false; await this.open(context, true); return true; }
  async getStatus(deviceId: string): Promise<DeviceStatus> { return this.runtimes.get(deviceId)?.status ?? 'disconnected'; }
  getPairingQr(deviceId: string): PairingQr | null {
    const runtime = this.runtimes.get(deviceId);
    const pairing = runtime?.pairingQr;
    if (!runtime || !pairing) return null;
    const expiresIn = Math.ceil((pairing.expiresAt - Date.now()) / 1000);
    if (expiresIn <= 0) { runtime.pairingQr = null; return null; }
    return { qr: pairing.qr, expiresIn };
  }

  private async open(context: DeviceContext, restoring: boolean): Promise<void> {
    await this.disconnect(context.deviceId);
    const { state, saveCreds } = await this.repository.load(context.tenantId, context.deviceId);
    const { version } = await fetchLatestBaileysVersion();
    const socket = makeWASocket({ auth: state, version, printQRInTerminal: false, markOnlineOnConnect: false, syncFullHistory: false, generateHighQualityLinkPreview: false, logger: this.logger.child({ component: 'baileys', device_ref: this.repository.integrityHash(context.deviceId) }) as never });
    const runtime: Runtime = { context, socket, status: restoring ? 'reconnecting' : 'starting', reconnects: 0, stopped: false, pairingQr: null };
    this.runtimes.set(context.deviceId, runtime);
    await this.emit(restoring ? 'device.reconnecting' : 'device.starting', context);
    socket.ev.on('creds.update', async () => { await saveCreds(); await this.emit('device.session_updated', context); });
    socket.ev.on('connection.update', async ({ connection, lastDisconnect, qr }: Partial<ConnectionState>) => {
      if (runtime.stopped || this.runtimes.get(context.deviceId) !== runtime) return;
      if (qr) {
        runtime.pairingQr = { qr, expiresIn: QR_TTL_SECONDS, expiresAt: Date.now() + QR_TTL_SECONDS * 1000 };
        runtime.status = 'waiting_for_qr';
        await this.emit('device.qr_ready', context, { qr, expires_in: QR_TTL_SECONDS });
      }
      if (connection === 'connecting') { runtime.status = 'connecting'; await this.emit('device.connecting', context); }
      if (connection === 'open') {
        runtime.pairingQr = null; runtime.status = 'connected'; runtime.reconnects = 0;
        await this.emit('device.connected', context, { phone_number: socket.user?.id ? jidNormalizedUser(socket.user.id).split('@')[0] : undefined, display_name: socket.user?.name });
      }
      if (connection === 'close') { runtime.pairingQr = null; await this.handleClose(runtime, lastDisconnect?.error); }
    });
    socket.ev.on('messages.update', async (updates: WAMessageUpdate[]) => {
      for (const update of updates) {
        if (!update.key.id || update.update.status == null) continue;
        const status = Number(update.update.status);
        const event = status >= 4 ? 'message.read' : status >= 3 ? 'message.delivered' : status >= 2 ? 'message.sent' : null;
        if (event) await this.emit(event, context, { provider_message_id: update.key.id });
      }
    });
  }

  private async handleClose(runtime: Runtime, error: unknown): Promise<void> {
    const code = error instanceof Boom ? error.output.statusCode : (error as { output?: { statusCode?: number } })?.output?.statusCode;
    if (code === DisconnectReason.loggedOut) {
      runtime.status = 'logged_out'; await this.repository.delete(runtime.context.deviceId); await this.emit('device.logged_out', runtime.context); return;
    }
    runtime.status = 'disconnected'; await this.emit('device.disconnected', runtime.context, { reason_code: 'NETWORK_FAILURE' });
    if (runtime.stopped || runtime.reconnects >= 6) { runtime.status = 'failed'; await this.emit('device.error', runtime.context, { error_code: 'RECONNECT_EXHAUSTED' }); return; }
    const delay = Math.min(30_000, 1_000 * 2 ** runtime.reconnects) + Math.floor(Math.random() * 750);
    runtime.reconnects += 1; runtime.status = 'reconnecting';
    setTimeout(() => { if (!runtime.stopped) void this.open(runtime.context, true).catch(() => this.emit('device.error', runtime.context, { error_code: 'SESSION_RESTORE_FAILED' })); }, delay);
  }

  async sendText(command: SendTextCommand): Promise<SendTextResult> {
    const cached = this.sent.get(command.commandId); if (cached) return cached;
    const runtime = this.runtimes.get(command.deviceId);
    if (!runtime || runtime.status !== 'connected') return { providerMessageId: '', status: 'failed', errorCode: 'DEVICE_NOT_CONNECTED' };
    if (runtime.context.leaseGeneration !== command.leaseGeneration || runtime.context.tenantId !== command.tenantId) return { providerMessageId: '', status: 'failed', errorCode: 'LEASE_LOST' };
    const jid = `${command.recipient.replace(/^\+/, '')}@s.whatsapp.net`;
    const result = await runtime.socket.sendMessage(jid, { text: command.text });
    const response: SendTextResult = { providerMessageId: result?.key.id ?? '', status: 'sent' };
    this.sent.set(command.commandId, response); await this.emit('message.sent', runtime.context, { message_id: command.messageId, provider_message_id: response.providerMessageId }); return response;
  }

  async disconnect(deviceId: string): Promise<void> { const runtime = this.runtimes.get(deviceId); if (!runtime) return; runtime.stopped = true; runtime.socket.end(undefined); this.runtimes.delete(deviceId); }
  async logout(deviceId: string): Promise<void> { const runtime = this.runtimes.get(deviceId); if (runtime) { runtime.stopped = true; await runtime.socket.logout(); this.runtimes.delete(deviceId); } await this.repository.delete(deviceId); }
  async deleteSession(deviceId: string): Promise<void> { await this.disconnect(deviceId); await this.repository.delete(deviceId); }
  async shutdown(): Promise<void> { await Promise.all([...this.runtimes.keys()].map((id) => this.disconnect(id))); }
  private async emit(type: string, context: DeviceContext, payload: Record<string, unknown> = {}): Promise<void> { await this.handler({ type, context, payload }); }
}
