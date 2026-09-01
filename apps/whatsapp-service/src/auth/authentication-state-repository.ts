import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BufferJSON, initAuthCreds, proto, type AuthenticationState, type SignalDataTypeMap } from '@whiskeysockets/baileys';

type StoredState = {
  version: 1;
  keyId: string;
  tenantId: string;
  deviceId: string;
  updatedAt: string;
  credentials: unknown;
  keys: Record<string, Record<string, unknown>>;
};

export interface SessionMetadata { version: number; keyId: string; updatedAt: string; integrity: 'verified' }

export class EncryptedAuthenticationStateRepository {
  private readonly root: string;
  private readonly key: Buffer;
  private readonly keyId: string;
  private readonly locks = new Map<string, Promise<void>>();

  constructor() {
    this.root = path.resolve(process.env.SESSION_STORE_PATH ?? '/data/sessions');
    const encoded = process.env.SESSION_MASTER_KEY ?? '';
    const decoded = Buffer.from(encoded, 'base64');
    if (decoded.length !== 32) throw new Error('SESSION_MASTER_KEY must be a base64 encoded 32-byte key');
    this.key = decoded;
    this.keyId = process.env.SESSION_KEY_ID ?? 'v1';
  }

  private file(deviceId: string): string {
    if (!/^[0-9A-Za-z_-]{8,64}$/.test(deviceId)) throw new Error('Invalid device id');
    return path.join(this.root, `${deviceId}.session`);
  }

  private async serialized(deviceId: string, operation: () => Promise<void>): Promise<void> {
    const previous = this.locks.get(deviceId) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    this.locks.set(deviceId, current);
    try { await current; } finally { if (this.locks.get(deviceId) === current) this.locks.delete(deviceId); }
  }

  private encrypt(value: StoredState): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const plaintext = Buffer.from(JSON.stringify(value, BufferJSON.replacer));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return Buffer.concat([Buffer.from('MRS1'), iv, cipher.getAuthTag(), ciphertext]);
  }

  private decrypt(value: Buffer): StoredState {
    if (value.subarray(0, 4).toString() !== 'MRS1' || value.length < 33) throw new Error('SESSION_CORRUPT');
    const decipher = createDecipheriv('aes-256-gcm', this.key, value.subarray(4, 16));
    decipher.setAuthTag(value.subarray(16, 32));
    const plaintext = Buffer.concat([decipher.update(value.subarray(32)), decipher.final()]);
    return JSON.parse(plaintext.toString('utf8'), BufferJSON.reviver) as StoredState;
  }

  async load(tenantId: string, deviceId: string): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    let stored: StoredState = { version: 1, keyId: this.keyId, tenantId, deviceId, updatedAt: new Date().toISOString(), credentials: initAuthCreds(), keys: {} };
    try {
      stored = this.decrypt(await readFile(this.file(deviceId)));
      if (stored.tenantId !== tenantId || stored.deviceId !== deviceId) throw new Error('SESSION_TENANT_MISMATCH');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    const persist = async (): Promise<void> => {
      stored.updatedAt = new Date().toISOString();
      stored.keyId = this.keyId;
      await this.serialized(deviceId, async () => {
        const target = this.file(deviceId);
        const temporary = `${target}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
        await writeFile(temporary, this.encrypt(stored), { mode: 0o600, flag: 'wx' });
        await rename(temporary, target);
      });
    };

    const state: AuthenticationState = {
      creds: stored.credentials as AuthenticationState['creds'],
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
          const bucket = stored.keys[type] ?? {};
          const result: { [id: string]: SignalDataTypeMap[T] } = {};
          for (const id of ids) {
            let value = bucket[id] as SignalDataTypeMap[T] | undefined;
            if (type === 'app-state-sync-key' && value) value = proto.Message.AppStateSyncKeyData.fromObject(value as object) as unknown as SignalDataTypeMap[T];
            if (value) result[id] = value;
          }
          return result;
        },
        set: async (data) => {
          for (const [type, entries] of Object.entries(data)) {
            const bucket = stored.keys[type] ?? {};
            for (const [id, value] of Object.entries(entries ?? {})) value == null ? delete bucket[id] : bucket[id] = value;
            stored.keys[type] = bucket;
          }
          await persist();
        },
      },
    };
    return { state, saveCreds: persist };
  }

  async exists(deviceId: string): Promise<boolean> { try { await stat(this.file(deviceId)); return true; } catch { return false; } }
  async delete(deviceId: string): Promise<void> { await rm(this.file(deviceId), { force: true }); }
  async metadata(deviceId: string): Promise<SessionMetadata> {
    const stored = this.decrypt(await readFile(this.file(deviceId)));
    return { version: stored.version, keyId: stored.keyId, updatedAt: stored.updatedAt, integrity: 'verified' };
  }
  integrityHash(deviceId: string): string { return createHash('sha256').update(deviceId).digest('hex').slice(0, 12); }
}
