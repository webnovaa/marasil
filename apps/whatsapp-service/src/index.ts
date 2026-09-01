import { createHmac, timingSafeEqual } from 'node:crypto';
import http from 'node:http';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { z } from 'zod';
import { EncryptedAuthenticationStateRepository } from './auth/authentication-state-repository.js';
import { BaileysWhatsAppEngine } from './engines/baileys-engine.js';
import { MockWhatsAppEngine } from './engines/mock-engine.js';
import type { DeviceContext, WhatsAppEngine } from './engines/types.js';
import { verifyInternalHmac, type RequestWithRawBody } from './middleware/hmac.js';
import { postPlatformEvent } from './platform-events.js';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info', redact: { paths: ['req.headers.authorization', 'req.headers.x-socket-token', 'body.qr', '*.qr', '*.credentials', '*.session'], censor: '[REDACTED]' } });
const engineName = process.env.WHATSAPP_ENGINE ?? (process.env.NODE_ENV === 'production' ? 'baileys' : 'mock');
if (process.env.NODE_ENV === 'production' && engineName === 'mock') throw new Error('Mock WhatsApp engine is forbidden in production');
const engine: WhatsAppEngine = engineName === 'baileys' ? new BaileysWhatsAppEngine(new EncryptedAuthenticationStateRepository(), logger) : new MockWhatsAppEngine();
const app = express();
const port = Number(process.env.PORT ?? 3100);
const workerId = process.env.WORKER_ID ?? 'wa-worker-1';
let acceptingTraffic = true;
let shuttingDown = false;

app.use(express.json({ limit: '256kb', verify: (req, _res, buf) => { (req as RequestWithRawBody).rawBody = buf.toString('utf8'); } }));
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url?.startsWith('/health') === true } }));
app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
app.get('/health/ready', (_req, res) => {
  const configured = Boolean(process.env.INTERNAL_HMAC_SECRET) && (engine.name !== 'baileys' || Boolean(process.env.SESSION_MASTER_KEY));
  const ready = acceptingTraffic && !shuttingDown && configured && !(process.env.NODE_ENV === 'production' && engine.name === 'mock');
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', engine: engine.name, worker_id: workerId, session_store: engine.name === 'baileys' ? 'encrypted-persistent' : 'memory' });
});

app.use('/internal/v1', verifyInternalHmac);
const contextSchema = z.object({ tenant_id: z.string().min(8).max(64), lease_generation: z.number().int().nonnegative() });
const deviceParam = (value: string | string[]): string => Array.isArray(value) ? value[0] ?? '' : value;
const context = (deviceId: string, body: unknown): DeviceContext => { const parsed = contextSchema.parse(body); return { deviceId, tenantId: parsed.tenant_id, leaseGeneration: parsed.lease_generation }; };
const route = (operation: (req: express.Request) => Promise<unknown>) => async (req: express.Request, res: express.Response) => { try { res.status(202).json({ success: true, data: await operation(req) }); } catch (error) { if (error instanceof z.ZodError) { res.status(422).json({ success: false, error: { code: 'INVALID_COMMAND' } }); return; } logger.error({ err: error, request_id: req.header('X-Request-ID') }, 'Internal command failed'); res.status(503).json({ success: false, error: { code: 'ENGINE_UNAVAILABLE' } }); } };

app.post('/internal/v1/devices/:deviceId/start', route(async (req) => { const ctx = context(deviceParam(req.params.deviceId), req.body); await engine.createSession(ctx); await engine.startPairing(ctx); return { device_id: ctx.deviceId, status: 'starting' }; }));
app.post('/internal/v1/devices/:deviceId/reconnect', route(async (req) => { const ctx = context(deviceParam(req.params.deviceId), req.body); const restored = await engine.restore(ctx); if (!restored) await engine.startPairing(ctx); return { device_id: ctx.deviceId, restored }; }));
app.post('/internal/v1/devices/:deviceId/disconnect', route(async (req) => { await engine.disconnect(deviceParam(req.params.deviceId)); return { status: 'disconnected' }; }));
app.post('/internal/v1/devices/:deviceId/logout', route(async (req) => { await engine.logout(deviceParam(req.params.deviceId)); return { status: 'logged_out' }; }));
app.delete('/internal/v1/devices/:deviceId/session', route(async (req) => { await engine.deleteSession(deviceParam(req.params.deviceId)); return { deleted: true }; }));
app.get('/internal/v1/devices/:deviceId/status', route(async (req) => ({ status: await engine.getStatus(deviceParam(req.params.deviceId)) })));
app.post('/internal/v1/messages/send', route(async (req) => {
  const body = z.object({ command_id: z.string().min(8), message_id: z.string().min(8), device_id: z.string().min(8), tenant_id: z.string().min(8), lease_generation: z.number().int().nonnegative(), recipient: z.string().regex(/^\+[1-9]\d{7,14}$/), text: z.string().trim().min(1).max(4096) }).parse(req.body);
  const result = await engine.sendText({ commandId: body.command_id, messageId: body.message_id, deviceId: body.device_id, tenantId: body.tenant_id, leaseGeneration: body.lease_generation, recipient: body.recipient, text: body.text });
  return { provider_message_id: result.providerMessageId, status: result.status, error_code: result.errorCode };
}));

const server = http.createServer(app);
const io = new SocketServer(server, { path: '/socket.io', cors: { origin: false }, maxHttpBufferSize: 64_000, transports: ['websocket'] });
type SocketClaims = { tenant_id: string; user_id: string; device_id: string; purpose: 'device-realtime'; exp: number };
function verifySocketToken(token: unknown): SocketClaims {
  if (typeof token !== 'string') throw new Error('missing token');
  const [payload, signature] = token.split('.'); const secret = process.env.SOCKET_TOKEN_SECRET ?? '';
  if (!payload || !signature || !secret) throw new Error('invalid token');
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(expected); const b = Buffer.from(signature); if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('invalid token');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SocketClaims;
  if (claims.purpose !== 'device-realtime' || claims.exp <= Math.floor(Date.now() / 1000)) throw new Error('expired token');
  return claims;
}
io.use((socket, next) => { try { socket.data.claims = verifySocketToken(socket.handshake.auth.token); next(); } catch { next(new Error('unauthorized')); } });
io.on('connection', (socket) => { const claims = socket.data.claims as SocketClaims; void socket.join(`tenant:${claims.tenant_id}:device:${claims.device_id}`); });

engine.onEvent(async ({ type, context: ctx, payload = {} }) => {
  io.to(`tenant:${ctx.tenantId}:device:${ctx.deviceId}`).emit(type, { device_id: ctx.deviceId, ...payload, occurred_at: new Date().toISOString() });
  const safePayload = { ...payload }; delete safePayload.qr;
  await postPlatformEvent({ event_type: type, device_id: ctx.deviceId, payload: { ...safePayload, tenant_id: ctx.tenantId, lease_generation: ctx.leaseGeneration } });
});

async function shutdown(signal: string): Promise<void> { if (shuttingDown) return; shuttingDown = true; acceptingTraffic = false; logger.info({ signal }, 'Graceful shutdown started'); await engine.shutdown(); io.close(); server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 10_000).unref(); }
process.on('SIGTERM', () => void shutdown('SIGTERM')); process.on('SIGINT', () => void shutdown('SIGINT'));
server.listen(port, '0.0.0.0', () => logger.info({ port, workerId, engine: engine.name }, 'WhatsApp service listening'));
export { app, engine, io, server };
