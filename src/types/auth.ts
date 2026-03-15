// ============================================================
// src/types/auth.ts
// HR Training Advisor — Auth Foundation Types
// Security: Strict TypeScript, no any, discriminated unions
// ============================================================

// ─── Role ────────────────────────────────────────────────────
export type UserRole = 'admin' | 'manager' | 'employee' | 'hr_coordinator';

// ─── Permissions (30 string literals) ────────────────────────
export type Permission =
  // User management
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  // Employee records — scoped
  | 'employees:read:own'
  | 'employees:read:team'
  | 'employees:read:all'
  | 'employees:update:own'
  | 'employees:update:team'
  | 'employees:update:all'
  // Training plans — scoped
  | 'plans:read:own'
  | 'plans:read:team'
  | 'plans:read:all'
  | 'plans:create:own'
  | 'plans:create:team'
  | 'plans:create:all'
  | 'plans:update:own'
  | 'plans:update:team'
  | 'plans:update:all'
  | 'plans:approve'
  | 'plans:delete'
  // Analytics — scoped
  | 'analytics:read:own'
  | 'analytics:read:team'
  | 'analytics:read:all'
  // Bulk operations
  | 'bulk:upload'
  | 'bulk:generate'
  // Admin-only
  | 'admin:config'
  | 'admin:audit'
  | 'admin:impersonate'
  // Reporting
  | 'reports:export';

// ─── Core entities ────────────────────────────────────────────
export interface User {
  readonly id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  managerId?: string;
  directReportIds: string[];
  isActive: boolean;
  readonly createdAt: string; // ISO 8601
  updatedAt: string;          // ISO 8601
}

/** Stored separately from User — never serialised into AuthSession */
export interface StoredCredential {
  readonly userId: string;
  readonly email: string;
  passwordHash: string;
}

// ─── Session ──────────────────────────────────────────────────
/**
 * AuthSession is a self-contained JWT-equivalent for localStorage.
 * NOTE: id is regenerated on every login (session-fixation prevention).
 * impersonating nests the original session so stopImpersonation() can
 * restore it without another localStorage round-trip.
 */
export interface AuthSession {
  readonly id: string;           // crypto.randomUUID() — new on each login
  readonly userId: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly permissions: readonly Permission[];
  readonly loginAt: string;      // ISO 8601
  readonly expiresAt: string;    // ISO 8601
  readonly rememberMe: boolean;
  /** Present only during admin impersonation */
  readonly impersonating?: {
    readonly originalSession: AuthSession;
  };
}

// ─── Audit log ────────────────────────────────────────────────
export interface AuditEntry {
  readonly id: string;
  readonly userId: string;
  readonly action: string;
  readonly targetId?: string;
  readonly targetType?: string;
  readonly details?: string;
  readonly timestamp: string;    // ISO 8601
  readonly ip?: string;
}

// ─── Brute-force tracking (in-memory, per email) ─────────────
export interface FailedAttemptRecord {
  count: number;
  lockedUntil: string | null;    // ISO 8601 or null
}

// ─── Provider contract ────────────────────────────────────────
/**
 * IAuthProvider defines the full auth surface area.
 * updateUser uses Pick to whitelist mutable fields — prevents
 * mass-assignment of id, createdAt, passwordHash etc.
 */
export interface IAuthProvider {
  login(email: string, password: string, rememberMe?: boolean): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentSession(): AuthSession | null;

  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  /** Whitelisted fields only — no mass assignment */
  updateUser(
    id: string,
    data: Partial<Pick<User, 'fullName' | 'department' | 'isActive' | 'role' | 'managerId' | 'directReportIds'>>,
  ): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUsers(): User[];

  requestPasswordReset(email: string): Promise<void>;

  /** Requires admin:impersonate permission on the calling session */
  impersonate(userId: string): Promise<AuthSession>;
  stopImpersonation(): Promise<AuthSession>;
}

// ─── Type guards ──────────────────────────────────────────────
export function isUserRole(value: unknown): value is UserRole {
  return (
    value === 'admin' ||
    value === 'manager' ||
    value === 'employee' ||
    value === 'hr_coordinator'
  );
}

export function isPermission(value: unknown): value is Permission {
  const PERMISSIONS: ReadonlySet<string> = new Set<Permission>([
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
  ]);
  return typeof value === 'string' && PERMISSIONS.has(value);
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['id'] === 'string' &&
    typeof v['userId'] === 'string' &&
    typeof v['email'] === 'string' &&
    typeof v['fullName'] === 'string' &&
    isUserRole(v['role']) &&
    Array.isArray(v['permissions']) &&
    typeof v['loginAt'] === 'string' &&
    typeof v['expiresAt'] === 'string' &&
    typeof v['rememberMe'] === 'boolean'
  );
}
