// ============================================================
// src/schemas/auth.schemas.ts
// HR Training Advisor — Zod validation schemas
// All schemas used for: form validation, localStorage parsing,
// and runtime type-narrowing of untrusted data.
// ============================================================

import { z } from 'zod';
import type { AuthSession, Permission, UserRole } from '../types/auth';

// ─── Primitive enums ─────────────────────────────────────────

export const userRoleSchema = z.enum([
  'admin',
  'manager',
  'employee',
  'hr_coordinator',
] as const satisfies readonly [UserRole, ...UserRole[]]);

/**
 * Full Permission enum — Zod validates every string against
 * the authoritative 30-value union at runtime.
 */
export const permissionSchema = z.enum([
  'users:create', 'users:read', 'users:update', 'users:delete',
  'employees:read:own', 'employees:read:team', 'employees:read:all',
  'employees:update:own', 'employees:update:team', 'employees:update:all',
  'plans:read:own', 'plans:read:team', 'plans:read:all',
  'plans:create:own', 'plans:create:team', 'plans:create:all',
  'plans:update:own', 'plans:update:team', 'plans:update:all',
  'plans:approve', 'plans:delete',
  'analytics:read:own', 'analytics:read:team', 'analytics:read:all',
  'bulk:upload', 'bulk:generate',
  'admin:config', 'admin:audit', 'admin:impersonate',
  'reports:export',
] as const satisfies readonly [Permission, ...Permission[]]);

// ─── Login form ──────────────────────────────────────────────
/**
 * Used by React Hook Form on the LoginPage component.
 * - email: normalised to lowercase to prevent duplicate-account issues
 * - password: min(1) — detailed length/strength rules are intentionally
 *   omitted on login (authenticate first, then enforce on change)
 * - rememberMe: optional, defaults to false in the auth provider
 */
export const loginFormSchema = z.object({
  email: z
    .string({ error:'Email is required' })
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long') // RFC 5321
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ error:'Password is required' })
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

// ─── User form (create / edit) ────────────────────────────────
/**
 * Used by the Admin user-management forms.
 * Validates the fields that are user-editable; id/createdAt/updatedAt
 * are server-set and excluded.
 */
export const userFormSchema = z.object({
  email: z
    .string({ error:'Email is required' })
    .email('Invalid email address')
    .max(254, 'Email address is too long')
    .transform((v) => v.toLowerCase().trim()),
  fullName: z
    .string({ error:'Full name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .trim(),
  role: userRoleSchema,
  department: z
    .string({ error:'Department is required' })
    .min(1, 'Department is required')
    .max(100, 'Department must be under 100 characters')
    .trim(),
  isActive: z.boolean().default(true),
  managerId: z.string().optional(),
  directReportIds: z.array(z.string()).default([]),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

/** Partial variant for PATCH-style update forms */
export const userUpdateFormSchema = userFormSchema
  .pick({ fullName: true, department: true, isActive: true, role: true })
  .partial();

export type UserUpdateFormValues = z.infer<typeof userUpdateFormSchema>;

// ─── AuthSession (localStorage read validation) ───────────────
/**
 * Validates data read from localStorage before trusting it as AuthSession.
 * This is the critical defence against:
 *   - Corrupted / tampered localStorage values
 *   - XSS-injected session objects with forged permissions
 *   - Schema drift across app versions
 *
 * NOTE: impersonating is validated recursively (lazy ref) via z.lazy().
 * We cap recursion depth at 1 — a session inside impersonating must NOT
 * itself have an impersonating field (no nested impersonation).
 */

// Base (non-recursive) session shape — used for the inner originalSession
const baseSessionSchema = z.object({
  id: z.string().uuid('Session ID must be a valid UUID'),
  userId: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1).max(100),
  role: userRoleSchema,
  permissions: z
    .array(permissionSchema)
    .min(0)
    .max(30, 'Permissions array exceeds maximum length'),
  loginAt: z.string().datetime({ message: 'loginAt must be an ISO datetime' }),
  expiresAt: z.string().datetime({ message: 'expiresAt must be an ISO datetime' }),
  rememberMe: z.boolean(),
});

// Full session adds optional impersonating wrapper (non-recursive here)
export const sessionSchema: z.ZodType<AuthSession> = baseSessionSchema
  .extend({
    impersonating: z
      .object({
        originalSession: baseSessionSchema,
      })
      .optional(),
  })
  .strict(); // Reject unknown fields — prevents prototype pollution via extra keys

export type SessionSchemaOutput = z.infer<typeof sessionSchema>;

// ─── StoredCredential schema ──────────────────────────────────
export const storedCredentialSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().transform((v) => v.toLowerCase()),
  passwordHash: z
    .string()
    .length(64, 'Password hash must be 64 hex characters (SHA-256)'),
}).strict();

// ─── AuditEntry schema ────────────────────────────────────────
export const auditEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  action: z.string().min(1).max(100),
  targetId: z.string().optional(),
  targetType: z.string().max(50).optional(),
  details: z.string().max(500).optional(),
  timestamp: z.string().datetime(),
  ip: z
    .string()
    .max(45) // IPv6 max
    .optional(),
}).strict();

// ─── FailedAttemptRecord schema ───────────────────────────────
export const failedAttemptRecordSchema = z.object({
  count: z.number().int().min(0).max(100),
  lockedUntil: z.string().datetime().nullable(),
}).strict();

export const failedAttemptsMapSchema = z.record(
  z.string().email(),
  failedAttemptRecordSchema,
);

// ─── Utility: safe schema parse with fallback ─────────────────
/**
 * Wraps z.safeParse and returns the data or fallback — never throws.
 * Use for all localStorage reads.
 *
 * @example
 *   const session = safeParse(sessionSchema, rawJson, null);
 */
export function safeParse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fallback: T,
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  if (import.meta.env.DEV) {
    console.warn('[Auth] Schema parse failed:', result.error.flatten());
  }
  return fallback;
}
