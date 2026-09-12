import { makeWASocket, Browsers, DisconnectReason, fetchLatestBaileysVersion, jidNormalizedUser, type ConnectionState, type WAMessageUpdate, type WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import type pino from 'pino';
import { EncryptedAuthenticationStateRepository } from '../auth/authentication-state-repository.js';
import type { DeviceContext, DeviceStatus, EngineEventHandler, PairingQr, SendMediaCommand, SendMediaResult, SendTextCommand, SendTextResult, WhatsAppEngine } from './types.js';

const QR_TTL_SECONDS = 20;

type Runtime = { context: DeviceContext; socket: WASocket; status: DeviceStatus; reconnects: number; stopped: boolean; pairingQr: (PairingQr & { expiresAt: number }) | null };

export class BaileysWhatsAppEngine implements WhatsAppEngine {
  readonly name = 'baileys' as const;
  private readonly runtimes = new Map<string, Runtime>();
  private readonly sent = new Map<string, SendTextResult | SendMediaResult>();
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

  async requestPairingCode(deviceId: string, phoneNumber: string): Promise<string> {
    const runtime = this.runtimes.get(deviceId);
    if (!runtime) {
      throw new Error('Device session is not started. Please start the device first.');
    }
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanNumber) {
      throw new Error('Valid phone number is required for pairing code.');
    }
    const code = await runtime.socket.requestPairingCode(cleanNumber);
    return code;
  }

  async checkNumber(deviceId: string, phoneNumber: string): Promise<{ exists: boolean; jid?: string }> {
    const runtime = this.runtimes.get(deviceId);
    if (!runtime || runtime.status !== 'connected') {
      throw new Error('DEVICE_NOT_CONNECTED');
    }
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanNumber || cleanNumber.length < 7) {
      throw new Error('INVALID_PHONE_NUMBER');
    }
    const jid = `${cleanNumber}@s.whatsapp.net`;
    const check = await runtime.socket.onWhatsApp(jid);
    if (Array.isArray(check) && check.length > 0 && check[0]?.exists) {
      return {
        exists: true,
        jid: check[0].jid || jid,
      };
    }
    return {
      exists: false,
    };
  }

  private async open(context: DeviceContext, restoring: boolean): Promise<void> {
    await this.disconnect(context.deviceId);
    const { state, saveCreds } = await this.repository.load(context.tenantId, context.deviceId);
    let version: [number, number, number] | undefined;
    try {
      const latest = await Promise.race([
        fetchLatestBaileysVersion(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('baileys version lookup timed out')), 5_000);
        }),
      ]);
      version = latest.version;
    } catch (error) {
      this.logger.warn({ err: error }, 'Could not fetch latest Baileys version; using library default');
    }
    // Anti-ban: Deterministic browser fingerprint distribution so devices don't share identical signatures
    const browserProfiles = [
      Browsers.macOS('Desktop'),
      Browsers.windows('Desktop'),
      Browsers.ubuntu('Desktop'),
      Browsers.macOS('Chrome'),
      Browsers.windows('Firefox'),
    ];
    const hashNum = context.deviceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const browser = browserProfiles[hashNum % browserProfiles.length];

    const socket = makeWASocket({
      auth: state,
      ...(version ? { version } : {}),
      browser,
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      keepAliveIntervalMs: 25_000,
      logger: this.logger.child({ component: 'baileys', device_ref: this.repository.integrityHash(context.deviceId) }) as never
    });
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
      if (connection === 'connecting' && runtime.status !== 'connected') { runtime.status = 'connecting'; await this.emit('device.connecting', context); }
      const phone = socket.user?.id ? jidNormalizedUser(socket.user.id).split('@')[0] : undefined;
      if ((connection === 'open' || Boolean(phone)) && connection !== 'close' && !qr && runtime.status !== 'connected') {
        runtime.pairingQr = null; runtime.status = 'connected'; runtime.reconnects = 0;
        await this.emit('device.connected', context, { phone_number: phone, display_name: socket.user?.name });
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
    socket.ev.on('messages.upsert', async ({ messages: newMessages, type }) => {
      if (type !== 'notify' && type !== 'append') return;
      for (const msg of newMessages) {
        if (!msg.key || msg.key.fromMe) continue;
        const remoteJid = msg.key.remoteJid;
        if (!remoteJid || remoteJid.endsWith('@g.us')) continue;
        const senderPhone = remoteJid.split('@')[0];
        const bodyText = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || msg.message?.videoMessage?.caption
          || msg.message?.documentMessage?.caption
          || '';
        await this.emit('message.received', context, {
          provider_message_id: msg.key.id,
          sender_phone: `+${senderPhone}`,
          text: bodyText,
          timestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) : Math.floor(Date.now() / 1000),
          push_name: msg.pushName ?? '',
        });
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

    // 1. Anti-ban: Preflight check to verify recipient is registered on WhatsApp
    try {
      const check = await runtime.socket.onWhatsApp(jid);
      if (Array.isArray(check) && (check.length === 0 || !check[0]?.exists)) {
        return {
          providerMessageId: '',
          status: 'failed',
          errorCode: 'RECIPIENT_NOT_ON_WHATSAPP',
        };
      }
    } catch {
      // onWhatsApp query failure is non-blocking (e.g. temporary server timeout)
    }

    // 2. Anti-ban: Auto-register contact with a realistic human name in WhatsApp address book
    try {
      const firstNames = [
        'محمد', 'أحمد', 'محمود', 'علي', 'عمر', 'خالد', 'طارق', 'يوسف', 'كريم', 'سامي',
        'عبدالله', 'حسن', 'إبراهيم', 'بلال', 'نور', 'ياسين', 'رامي', 'حمزة', 'فهد', 'زياد'
      ];
      const tags = ['العميل', 'المشترك', 'المتجر', 'الطلب', 'الزبون', 'VIP'];
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const tag = tags[Math.floor(Math.random() * tags.length)];
      const phoneTail = command.recipient.replace(/\D/g, '').slice(-4);
      const fullName = `${fn} - ${tag} ${phoneTail}`;

      const sockAny = runtime.socket as unknown as { addOrEditContact?: (jid: string, contact: unknown) => Promise<void> };
      if (typeof sockAny.addOrEditContact === 'function') {
        await sockAny.addOrEditContact(jid, {
          fullName,
          firstName: fn,
          saveOnPrimaryAddressbook: true,
        });
      }
    } catch {
      // Contact sync failure should never block message dispatch
    }

    // 3. Anti-ban: Full Human Presence & Dynamic Typing Simulation
    try {
      // A. Open chat thread (fetches status / presence)
      await runtime.socket.presenceSubscribe(jid);

      // B. Mark presence as available (online)
      await runtime.socket.sendPresenceUpdate('available');

      // C. Reading delay before typing (human reaction time: 300ms - 650ms)
      await new Promise((resolve) => setTimeout(resolve, 300 + Math.floor(Math.random() * 350)));

      // D. Dynamic typing duration based on message length (1000ms base + 25ms/char, clamped to 1200ms - 4500ms)
      const textLen = command.text ? command.text.length : 10;
      const baseDelay = Math.min(4500, Math.max(1200, 1000 + textLen * 25));
      const jitter = Math.floor(Math.random() * 500) - 200;
      const totalTypingDelay = Math.max(1000, baseDelay + jitter);

      await runtime.socket.sendPresenceUpdate('composing', jid);
      await new Promise((resolve) => setTimeout(resolve, totalTypingDelay));
      await runtime.socket.sendPresenceUpdate('paused', jid);

      // E. Brief pause before pressing send (200ms - 400ms)
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.floor(Math.random() * 200)));
    } catch {
      // Presence simulation failure should not block message sending
    }

    const result = await runtime.socket.sendMessage(jid, { text: command.text });
    const response: SendTextResult = { providerMessageId: result?.key.id ?? '', status: 'sent' };
    this.sent.set(command.commandId, response); await this.emit('message.sent', runtime.context, { message_id: command.messageId, provider_message_id: response.providerMessageId }); return response;
  }

  async sendMedia(command: SendMediaCommand): Promise<SendMediaResult> {
    const cached = this.sent.get(command.commandId); if (cached) return cached;
    const runtime = this.runtimes.get(command.deviceId);
    if (!runtime || runtime.status !== 'connected') return { providerMessageId: '', status: 'failed', errorCode: 'DEVICE_NOT_CONNECTED' };
    if (runtime.context.leaseGeneration !== command.leaseGeneration || runtime.context.tenantId !== command.tenantId) return { providerMessageId: '', status: 'failed', errorCode: 'LEASE_LOST' };
    const jid = `${command.recipient.replace(/^\+/, '')}@s.whatsapp.net`;

    try {
      const check = await runtime.socket.onWhatsApp(jid);
      if (Array.isArray(check) && (check.length === 0 || !check[0]?.exists)) {
        return { providerMessageId: '', status: 'failed', errorCode: 'RECIPIENT_NOT_ON_WHATSAPP' };
      }
    } catch {
      // Non-blocking preflight check
    }

    // Dynamic presence simulation for media
    try {
      await runtime.socket.presenceSubscribe(jid);
      await runtime.socket.sendPresenceUpdate('available');
      await runtime.socket.sendPresenceUpdate('composing', jid);
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.floor(Math.random() * 500)));
      await runtime.socket.sendPresenceUpdate('paused', jid);
    } catch {
      // Non-blocking
    }

    let mediaContent: Record<string, unknown> = {};
    if (command.mediaType === 'image') {
      mediaContent = { image: { url: command.mediaUrl }, caption: command.caption };
    } else if (command.mediaType === 'document') {
      mediaContent = {
        document: { url: command.mediaUrl },
        mimetype: command.mimetype ?? 'application/pdf',
        fileName: command.fileName ?? 'document.pdf',
        caption: command.caption,
      };
    } else if (command.mediaType === 'audio') {
      mediaContent = { audio: { url: command.mediaUrl }, mimetype: command.mimetype ?? 'audio/mp4', ptt: true };
    } else if (command.mediaType === 'video') {
      mediaContent = { video: { url: command.mediaUrl }, caption: command.caption };
    }

    const result = await runtime.socket.sendMessage(jid, mediaContent as never);
    const response: SendMediaResult = { providerMessageId: result?.key.id ?? '', status: 'sent' };
    this.sent.set(command.commandId, response);
    await this.emit('message.sent', runtime.context, { message_id: command.messageId, provider_message_id: response.providerMessageId });
    return response;
  }

  async disconnect(deviceId: string): Promise<void> { const runtime = this.runtimes.get(deviceId); if (!runtime) return; runtime.stopped = true; runtime.socket.end(undefined); this.runtimes.delete(deviceId); }
  async logout(deviceId: string): Promise<void> { const runtime = this.runtimes.get(deviceId); if (runtime) { runtime.stopped = true; await runtime.socket.logout(); this.runtimes.delete(deviceId); } await this.repository.delete(deviceId); }
  async deleteSession(deviceId: string): Promise<void> { await this.disconnect(deviceId); await this.repository.delete(deviceId); }
  async shutdown(): Promise<void> { await Promise.all([...this.runtimes.keys()].map((id) => this.disconnect(id))); }
  private async emit(type: string, context: DeviceContext, payload: Record<string, unknown> = {}): Promise<void> { await this.handler({ type, context, payload }); }
}
