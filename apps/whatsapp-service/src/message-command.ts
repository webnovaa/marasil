import { z } from 'zod';

export const MAX_MEDIA_BYTES = 16 * 1024 * 1024;
const base = z.object({
  command_id: z.string().min(8), message_id: z.string().min(8),
  device_id: z.string().min(8), tenant_id: z.string().min(8),
  lease_generation: z.number().int().nonnegative(),
  recipient: z.string().regex(/^\+[1-9]\d{6,14}$/),
});
const media = z.object({
  data: z.string().min(4).max(Math.ceil(MAX_MEDIA_BYTES / 3) * 4)
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)
    .refine((value) => Buffer.from(value, 'base64').length <= MAX_MEDIA_BYTES),
  mimetype: z.string().min(3).max(128),
  filename: z.string().min(1).max(255).regex(/^[^/\\\r\n]+$/),
  caption: z.string().max(1024).optional(),
});

// Existing text callers can omit type. Media bytes travel only over the signed internal API.
export const messageCommandSchema = z.union([
  base.extend({ type: z.literal('text').optional(), text: z.string().trim().min(1).max(4096) }),
  base.extend({ type: z.enum(['image', 'document', 'audio', 'video']), media }),
]);
