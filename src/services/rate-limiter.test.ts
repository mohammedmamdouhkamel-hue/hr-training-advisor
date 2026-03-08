import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, resetRateLimit } from './rate-limiter';

beforeEach(() => {
  resetRateLimit();
  vi.restoreAllMocks();
});

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const result = checkRateLimit();
    expect(result.allowed).toBe(true);
    expect(result.waitSeconds).toBe(0);
  });

  it('allows up to 5 requests', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit().allowed).toBe(true);
    }
  });

  it('blocks 6th request within window', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit();
    }
    const result = checkRateLimit();
    expect(result.allowed).toBe(false);
    expect(result.waitSeconds).toBeGreaterThan(0);
  });

  it('allows requests after window expires', () => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1001)
      .mockReturnValueOnce(1002)
      .mockReturnValueOnce(1003)
      .mockReturnValueOnce(1004)
      // 6th call: 61 seconds later, outside window
      .mockReturnValue(62000);

    for (let i = 0; i < 5; i++) {
      checkRateLimit();
    }
    const result = checkRateLimit();
    expect(result.allowed).toBe(true);
  });

  it('returns correct wait time', () => {
    const now = 100000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    for (let i = 0; i < 5; i++) {
      checkRateLimit();
    }

    // Still within window
    vi.spyOn(Date, 'now').mockReturnValue(now + 30000); // 30s later
    const result = checkRateLimit();
    expect(result.allowed).toBe(false);
    expect(result.waitSeconds).toBe(30); // 60 - 30 = 30s left
  });

  it('resets properly', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit();
    }
    expect(checkRateLimit().allowed).toBe(false);
    resetRateLimit();
    expect(checkRateLimit().allowed).toBe(true);
  });
});
