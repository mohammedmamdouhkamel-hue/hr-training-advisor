import { describe, it, expect } from 'vitest';
import { getApiErrorMessage, getNetworkErrorMessage } from './error-messages';

describe('getApiErrorMessage', () => {
  it('returns clear message for 401', () => {
    expect(getApiErrorMessage(401)).toContain('Invalid API key');
    expect(getApiErrorMessage(401)).toContain('console.anthropic.com');
  });

  it('returns clear message for 429', () => {
    expect(getApiErrorMessage(429)).toContain('Rate limit');
  });

  it('returns clear message for 500', () => {
    expect(getApiErrorMessage(500)).toContain('temporarily unavailable');
  });

  it('returns clear message for 502', () => {
    expect(getApiErrorMessage(502)).toContain('temporarily unavailable');
  });

  it('returns clear message for 503', () => {
    expect(getApiErrorMessage(503)).toContain('temporarily unavailable');
  });

  it('falls back to custom message for unknown status', () => {
    expect(getApiErrorMessage(418, 'I am a teapot')).toBe('I am a teapot');
  });

  it('falls back to generic message when no custom message', () => {
    expect(getApiErrorMessage(418)).toBe('API error 418');
  });
});

describe('getNetworkErrorMessage', () => {
  it('detects network errors', () => {
    const err = new TypeError('Failed to fetch');
    expect(getNetworkErrorMessage(err)).toContain('internet connection');
  });

  it('detects JSON parse errors', () => {
    const err = new SyntaxError('Unexpected token');
    expect(getNetworkErrorMessage(err)).toContain('unexpected format');
  });

  it('returns Error message for generic errors', () => {
    expect(getNetworkErrorMessage(new Error('Custom error'))).toBe('Custom error');
  });

  it('handles non-Error values', () => {
    expect(getNetworkErrorMessage('string error')).toBe('An unexpected error occurred.');
  });
});
