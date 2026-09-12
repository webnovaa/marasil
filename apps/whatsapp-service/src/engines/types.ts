export type DeviceStatus =
  | 'pending' | 'starting' | 'waiting_for_qr' | 'qr_expired' | 'pairing'
  | 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  | 'logged_out' | 'failed' | 'suspended' | 'deleting';

export type EngineErrorCode =
  | 'DEVICE_NOT_CONNECTED' | 'DEVICE_LOGGED_OUT' | 'SESSION_CORRUPT'
  | 'LEASE_LOST' | 'NETWORK_FAILURE' | 'RATE_LIMITED' | 'INVALID_RECIPIENT'
  | 'ENGINE_UNAVAILABLE' | 'UNKNOWN_ENGINE_ERROR' | 'RECIPIENT_NOT_ON_WHATSAPP';

export interface DeviceContext {
  deviceId: string;
  tenantId: string;
  leaseGeneration: number;
}

export interface SendTextCommand extends DeviceContext {
  commandId: string;
  messageId: string;
  recipient: string;
  text: string;
}

export interface SendTextResult {
  providerMessageId: string;
  status: 'sent' | 'failed';
  errorCode?: EngineErrorCode;
}

export interface EngineEvent {
  type: string;
  context: DeviceContext;
  payload?: Record<string, unknown>;
}

export type EngineEventHandler = (event: EngineEvent) => Promise<void> | void;

export interface PairingQr {
  qr: string;
  expiresIn: number;
}

export type MediaType = 'image' | 'document' | 'audio' | 'video';

export interface SendMediaCommand extends DeviceContext {
  commandId: string;
  messageId: string;
  recipient: string;
  mediaType: MediaType;
  mediaUrl: string;
  caption?: string;
  fileName?: string;
  mimetype?: string;
}

export interface SendMediaResult {
  providerMessageId: string;
  status: 'sent' | 'failed';
  errorCode?: EngineErrorCode;
}

export interface WhatsAppEngine {
  readonly name: 'mock' | 'baileys';
  createSession(context: DeviceContext): Promise<void>;
  startPairing(context: DeviceContext): Promise<void>;
  getStatus(deviceId: string): Promise<DeviceStatus>;
  getPairingQr(deviceId: string): PairingQr | null;
  requestPairingCode(deviceId: string, phoneNumber: string): Promise<string>;
  checkNumber(deviceId: string, phoneNumber: string): Promise<{ exists: boolean; jid?: string }>;
  sendText(command: SendTextCommand): Promise<SendTextResult>;
  sendMedia(command: SendMediaCommand): Promise<SendMediaResult>;
  disconnect(deviceId: string): Promise<void>;
  logout(deviceId: string): Promise<void>;
  restore(context: DeviceContext): Promise<boolean>;
  deleteSession(deviceId: string): Promise<void>;
  shutdown(): Promise<void>;
  onEvent(handler: EngineEventHandler): void;
}
