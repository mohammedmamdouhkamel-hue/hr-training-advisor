// ============================================================
// src/utils/security.ts
// HR Training Advisor — Security utilities
// All functions are pure / side-effect-free.
// ============================================================

// ─── Password hashing ─────────────────────────────────────────
/**
 * Hashes a password using the Web Crypto API (SHA-256).
 *
 * @security TODO [PRODUCTION BLOCKER]:
 * Replace with PBKDF2 before any real-user deployment:
 *
 *   const keyMaterial = await crypto.subtle.importKey(
 *     'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
 *   );
 *   const bits = await crypto.subtle.deriveBits(
 *     { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
 *     keyMaterial, 256
 *   );
 *
 * SHA-256 without key-stretching is NOT safe for password storage:
 * it is fast by design, making brute-force trivially cheap.
 * PBKDF2 with 600k iterations (NIST SP 800-132 2023 guidance) adds
 * the necessary computational cost. Store the salt alongside the hash.
 *
 * For true production use, delegate to a server-side bcrypt/argon2id
 * implementation — never hash passwords in the browser for real auth.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Constant-time comparison ─────────────────────────────────
/**
 * Compares two strings in constant time using an XOR accumulator.
 *
 * Rationale: a simple `a === b` short-circuits on the first differing
 * character, leaking password length/prefix information to an attacker
 * who can measure response timing (timing oracle). This function always
 * iterates max(a.length, b.length) iterations regardless of where the
 * difference occurs.
 *
 * Usage: compare hashes, never raw passwords.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  let result = 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    // charCodeAt returns NaN for out-of-bounds; `|| 0` normalises to 0
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

// ─── Safe redirect ────────────────────────────────────────────
/**
 * Validates a redirect URL against an explicit allowlist of path prefixes.
 *
 * Blocks:
 *   - External origins (open redirect)
 *   - Protocol-relative URLs  (//evil.com/phish)
 *   - javascript: / data: / vbscript: URI schemes (XSS via navigation)
 *   - Bare encoded variants (%6A%61%76%61... etc.) — caught by URL parser
 *
 * Falls back to /dashboard on any violation.
 *
 * @param url          The untrusted redirect target (e.g. from ?redirect= query param)
 * @param allowedPaths Path prefixes that are safe (e.g. ['/dashboard', '/profile'])
 * @returns            A safe, same-origin pathname+search string
 */
export function safeRedirectUrl(
  url: string,
  allowedPaths: string[],
): string {
  const FALLBACK = '/dashboard';

  if (!url || typeof url !== 'string') return FALLBACK;

  const trimmed = url.trim();

  // Block protocol-relative and dangerous URI schemes before URL parsing
  // (some browsers auto-resolve // as https://)
  if (/^(javascript:|data:|vbscript:|\/\/)/i.test(trimmed)) {
    return FALLBACK;
  }

  try {
    // Resolve against current origin so relative paths parse correctly
    const parsed = new URL(trimmed, window.location.origin);

    // Reject anything pointing outside our origin
    if (parsed.origin !== window.location.origin) {
      return FALLBACK;
    }

    const { pathname, search } = parsed;

    // Require an explicit allowlist match (exact or prefix with /)
    const isAllowed = allowedPaths.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

    return isAllowed ? pathname + search : FALLBACK;
  } catch {
    // URL constructor threw — malformed input
    return FALLBACK;
  }
}

// ─── ID generation ────────────────────────────────────────────
/**
 * Generates a cryptographically random UUID v4.
 * Used for session IDs (new ID on every login — session fixation prevention)
 * and audit log entry IDs.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

// ─── Safe localStorage parse ──────────────────────────────────
/**
 * Parses a JSON string from localStorage with a typed fallback.
 * Never throws — always returns fallback on malformed input.
 *
 * Usage:
 *   const users = safeJsonParse<User[]>(localStorage.getItem('hra_users'), []);
 */
export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    // Caller is responsible for runtime validation (Zod) after this
    return parsed as T;
  } catch {
    return fallback;
  }
}

// ─── Lockout helpers ──────────────────────────────────────────
/**
 * Returns the ISO timestamp at which a lockout expires.
 * @param minutes  Lockout duration (from SESSION_CONFIG.lockoutMinutes)
 */
export function getLockoutExpiry(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

/**
 * Returns true if the given lockout expiry ISO string is still in the future.
 */
export function isLockedOut(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > Date.now();
}

/**
 * Returns the remaining lockout seconds (for UI display), or 0 if not locked.
 */
export function lockoutSecondsRemaining(lockedUntil: string | null): number {
  if (!lockedUntil) return 0;
  const remaining = Math.ceil(
    (new Date(lockedUntil).getTime() - Date.now()) / 1000,
  );
  return Math.max(0, remaining);
}
