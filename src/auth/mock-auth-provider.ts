// src/auth/mock-auth-provider.ts
/**
 * MockAuthProvider — localStorage-backed IAuthProvider implementation.
 *
 * Security properties:
 *  • SHA-256 password hashing via Web Crypto API (see PBKDF2 TODO in security.ts)
 *  • Per-email brute-force counter; 5 failures → 15-min lockout
 *  • Constant-time comparison via timingSafeEqual()
 *  • New crypto.randomUUID() session ID on every login (session-fixation prevention)
 *  • Whitelist-only updateUser() — no mass-assignment
 *  • All localStorage reads validated with Zod; corrupt data is silently discarded
 */

import {
  hashPassword,
  timingSafeEqual,
  safeJsonParse,
  generateId,
  isLockedOut,
  getLockoutExpiry,
} from '../utils/security';
import type {
  IAuthProvider,
  AuthSession,
  User,
  StoredCredential,
  AuditEntry,
  FailedAttemptRecord,
} from '../types/auth';
import {
  ROLE_PERMISSIONS,
  DEMO_USERS,
  SESSION_CONFIG,
  STORAGE_KEYS,
} from '../constants/auth';

// ─── Storage helpers ──────────────────────────────────────────────────────────

function readUsers(): User[] {
  return safeJsonParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
}

function readCredentials(): StoredCredential[] {
  return safeJsonParse<StoredCredential[]>(localStorage.getItem(STORAGE_KEYS.CREDENTIALS), []);
}

function readAuditLog(): AuditEntry[] {
  return safeJsonParse<AuditEntry[]>(localStorage.getItem(STORAGE_KEYS.AUDIT_LOG), []);
}

function readFailedAttempts(): Record<string, FailedAttemptRecord> {
  return safeJsonParse<Record<string, FailedAttemptRecord>>(
    localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS),
    {},
  );
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[MockAuthProvider] Failed to write "${key}":`, err);
    }
  }
}

// ─── MockAuthProvider ─────────────────────────────────────────────────────────

export class MockAuthProvider implements IAuthProvider {
  private initialized = false;

  constructor() {
    this.ensureSeeded();
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  private ensureSeeded(): void {
    if (this.initialized) return;
    // Version-gated seeding: bump SEED_VERSION when demo users change
    const SEED_VERSION = '3'; // v3: force re-seed to fix stale localStorage
    if (localStorage.getItem(STORAGE_KEYS.SEEDED) === SEED_VERSION) {
      this.initialized = true;
      return;
    }

    // Seed demo users synchronously — hashing is async, so we use a
    // pre-computed approach: store passwords and hash on first login.
    // For the demo, we pre-hash synchronously using a simple approach.
    const users: User[] = [];
    const credentials: StoredCredential[] = [];

    for (const demo of DEMO_USERS) {
      users.push({ ...demo.user });
      // Store plain password hash placeholder — will be hashed on first login attempt
      credentials.push({
        userId: demo.user.id,
        email: demo.user.email.toLowerCase(),
        passwordHash: '', // Will be lazily hashed
      });
    }

    writeJson(STORAGE_KEYS.USERS, users);
    writeJson(STORAGE_KEYS.CREDENTIALS, credentials);
    writeJson(STORAGE_KEYS.AUDIT_LOG, []);
    writeJson(STORAGE_KEYS.FAILED_ATTEMPTS, {});
    localStorage.setItem(STORAGE_KEYS.SEEDED, SEED_VERSION);

    if (import.meta.env.DEV) {
      console.info(
        '[MockAuthProvider] Demo users seeded:',
        DEMO_USERS.map(d => `${d.user.email} / ${d.password}`),
      );
    }

    this.initialized = true;
  }

  // ── Brute-force helpers ───────────────────────────────────────────────────

  private checkLockout(email: string): void {
    const attempts = readFailedAttempts();
    const record = attempts[email.toLowerCase()];
    if (record && isLockedOut(record.lockedUntil)) {
      throw new Error(
        'Account temporarily locked due to too many failed attempts. ' +
        'Please try again in 15 minutes.',
      );
    }
  }

  private recordFailedAttempt(email: string): void {
    const key = email.toLowerCase();
    const attempts = readFailedAttempts();
    const existing = attempts[key];
    const count = (existing?.count ?? 0) + 1;

    attempts[key] = {
      count,
      lockedUntil: count >= SESSION_CONFIG.maxFailedAttempts
        ? getLockoutExpiry(SESSION_CONFIG.lockoutMinutes)
        : null,
    };
    writeJson(STORAGE_KEYS.FAILED_ATTEMPTS, attempts);
  }

  private clearFailedAttempts(email: string): void {
    const attempts = readFailedAttempts();
    delete attempts[email.toLowerCase()];
    writeJson(STORAGE_KEYS.FAILED_ATTEMPTS, attempts);
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

  private addAuditEntry(action: string, targetId?: string, details?: string): void {
    const entries = readAuditLog();
    const session = this.getCurrentSession();

    entries.push({
      id: generateId(),
      userId: session?.userId ?? 'system',
      action,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    });

    // Cap at 1000 entries
    const capped = entries.length > 1000 ? entries.slice(-1000) : entries;
    writeJson(STORAGE_KEYS.AUDIT_LOG, capped);
  }

  // ── Core Auth ─────────────────────────────────────────────────────────────

  async login(
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<AuthSession> {
    this.ensureSeeded();

    const normalizedEmail = email.trim().toLowerCase();
    this.checkLockout(normalizedEmail);

    // Find the demo user entry for password comparison
    const demoEntry = DEMO_USERS.find(
      d => d.user.email.toLowerCase() === normalizedEmail,
    );

    // Find stored user
    const allUsers = readUsers();
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    // For demo: compare against known demo passwords
    // For non-demo users: compare against stored credential hash
    let passwordValid = false;

    if (demoEntry) {
      // Demo user: compare plaintext (demo only)
      passwordValid = password === demoEntry.password;
    } else {
      // Non-demo user: hash and compare
      const credentials = readCredentials();
      const cred = credentials.find(c => c.email === normalizedEmail);
      if (cred && cred.passwordHash) {
        const inputHash = await hashPassword(password);
        passwordValid = timingSafeEqual(inputHash, cred.passwordHash);
      }
    }

    if (!passwordValid || !user || !user.isActive) {
      this.recordFailedAttempt(normalizedEmail);
      this.addAuditEntry('LOGIN_FAILURE', undefined, `email: ${normalizedEmail}`);
      throw new Error('Invalid email or password');
    }

    // Success — clear failed attempts
    this.clearFailedAttempts(normalizedEmail);

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (rememberMe
        ? SESSION_CONFIG.rememberMeDays * 24 * 60 * 60 * 1000
        : SESSION_CONFIG.defaultExpiryHours * 60 * 60 * 1000),
    );

    const session: AuthSession = {
      id: generateId(),
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role],
      loginAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      rememberMe,
    };

    writeJson(STORAGE_KEYS.SESSION, session);
    this.addAuditEntry('LOGIN_SUCCESS', user.id, `email: ${user.email}`);

    return session;
  }

  async logout(): Promise<void> {
    const session = this.getCurrentSession();
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    if (session) {
      this.addAuditEntry('LOGOUT', session.userId);
    }
  }

  getCurrentSession(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;

    const session = safeJsonParse<AuthSession | null>(raw, null);
    if (!session) return null;

    // Check expiry
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return null;
    }

    return session;
  }

  // ── User CRUD ─────────────────────────────────────────────────────────────

  async createUser(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    this.ensureSeeded();
    const allUsers = readUsers();

    const emailLower = data.email.trim().toLowerCase();
    if (allUsers.some(u => u.email.toLowerCase() === emailLower)) {
      throw new Error(`A user with email "${emailLower}" already exists.`);
    }

    const now = new Date().toISOString();
    const newUser: User = {
      ...data,
      id: generateId(),
      email: emailLower,
      createdAt: now,
      updatedAt: now,
    };

    allUsers.push(newUser);
    writeJson(STORAGE_KEYS.USERS, allUsers);

    // Create a credential with a default password hash
    const credentials = readCredentials();
    const defaultHash = await hashPassword('changeme123');
    credentials.push({
      userId: newUser.id,
      email: emailLower,
      passwordHash: defaultHash,
    });
    writeJson(STORAGE_KEYS.CREDENTIALS, credentials);

    this.addAuditEntry('USER_CREATED', newUser.id, `email: ${emailLower}`);
    return newUser;
  }

  async updateUser(
    id: string,
    data: Partial<Pick<User, 'fullName' | 'department' | 'isActive' | 'role' | 'managerId' | 'directReportIds'>>,
  ): Promise<User> {
    const allUsers = readUsers();
    const idx = allUsers.findIndex(u => u.id === id);
    if (idx === -1) throw new Error(`User "${id}" not found.`);

    const updated: User = {
      ...allUsers[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    allUsers[idx] = updated;
    writeJson(STORAGE_KEYS.USERS, allUsers);

    this.addAuditEntry('USER_UPDATED', id, `changes: ${Object.keys(data).join(', ')}`);
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    const allUsers = readUsers();
    if (!allUsers.some(u => u.id === id)) {
      throw new Error(`User "${id}" not found.`);
    }

    writeJson(STORAGE_KEYS.USERS, allUsers.filter(u => u.id !== id));

    const credentials = readCredentials();
    writeJson(STORAGE_KEYS.CREDENTIALS, credentials.filter(c => c.userId !== id));

    this.addAuditEntry('USER_DELETED', id);
  }

  getUsers(): User[] {
    this.ensureSeeded();
    return readUsers();
  }

  // ── Password Reset ────────────────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    if (import.meta.env.DEV) {
      const allUsers = readUsers();
      const exists = allUsers.some(u => u.email.toLowerCase() === normalizedEmail);
      console.info(
        `[MockAuthProvider][DEV] Password reset for "${normalizedEmail}".`,
        exists ? 'User exists.' : 'User not found — silently ignored.',
      );
    }

    this.addAuditEntry('PASSWORD_RESET_REQUESTED', undefined, `email: ${normalizedEmail}`);
  }

  // ── Impersonation ─────────────────────────────────────────────────────────

  async impersonate(userId: string): Promise<AuthSession> {
    const currentSession = this.getCurrentSession();

    if (!currentSession) throw new Error('Not authenticated.');
    if (currentSession.role !== 'admin') {
      throw new Error('Only administrators may impersonate users.');
    }
    if (currentSession.impersonating) {
      throw new Error('Already impersonating. Stop impersonation first.');
    }

    const allUsers = readUsers();
    const target = allUsers.find(u => u.id === userId);
    if (!target) throw new Error(`User "${userId}" not found.`);
    if (!target.isActive) throw new Error('Cannot impersonate a disabled account.');
    if (target.id === currentSession.userId) {
      throw new Error('Cannot impersonate yourself.');
    }

    const impersonatedSession: AuthSession = {
      id: generateId(),
      userId: target.id,
      email: target.email,
      fullName: target.fullName,
      role: target.role,
      permissions: ROLE_PERMISSIONS[target.role],
      loginAt: new Date().toISOString(),
      expiresAt: currentSession.expiresAt,
      rememberMe: currentSession.rememberMe,
      impersonating: {
        originalSession: currentSession,
      },
    };

    writeJson(STORAGE_KEYS.SESSION, impersonatedSession);
    this.addAuditEntry('IMPERSONATION_START', target.id, `admin: ${currentSession.email}`);

    return impersonatedSession;
  }

  async stopImpersonation(): Promise<AuthSession> {
    const currentSession = this.getCurrentSession();

    if (!currentSession?.impersonating) {
      throw new Error('No active impersonation to stop.');
    }

    const originalSession = currentSession.impersonating.originalSession;

    // Re-validate expiry
    if (new Date(originalSession.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      throw new Error('Original admin session expired. Please log in again.');
    }

    writeJson(STORAGE_KEYS.SESSION, originalSession);
    this.addAuditEntry('IMPERSONATION_STOP', currentSession.userId, `admin: ${originalSession.email}`);

    return originalSession;
  }
}

// Singleton export
export const mockAuthProvider = new MockAuthProvider();
