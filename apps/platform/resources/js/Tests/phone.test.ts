import { describe, expect, it } from 'vitest';
import { isValidWhatsAppE164, parseWhatsAppPhone, splitE164 } from '@/Lib/phone';

describe('phone utils', () => {
  it('validates a Syrian mobile E.164', () => {
    const result = parseWhatsAppPhone('SY', '944123456');
    expect(result.valid).toBe(true);
    expect(result.e164).toMatch(/^\+963/);
    expect(isValidWhatsAppE164(result.e164)).toBe(true);
  });

  it('rejects incomplete numbers', () => {
    const result = parseWhatsAppPhone('SY', '94');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('splits E.164 back to country + national', () => {
    const split = splitE164('+966501234567');
    expect(split.country).toBe('SA');
    expect(split.national.replace(/\D/g, '')).toContain('501234567');
  });
});
