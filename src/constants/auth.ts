// ============================================================
// src/constants/auth.ts
// HR Training Advisor — Demo data & role-permission mappings
// ============================================================

import type { User, UserRole, Permission } from '../types/auth';

// ─── Demo users ───────────────────────────────────────────────
/**
 * DEMO_USERS is used by LocalAuthProvider to seed localStorage
 * on first run. Passwords are plain-text here — they are hashed
 * during seeding via hashPassword(). Never store raw passwords
 * anywhere else.
 *
 * @security These credentials are for development/demo only.
 * Remove or replace before any production deployment.
 */
export interface DemoUserEntry {
  user: User;
  password: string;
}

const NOW = new Date().toISOString();

export const DEMO_USERS: DemoUserEntry[] = [
  // ─── Admin ──────────────────────────────────────────────────
  {
    user: {
      id: 'user-admin',
      email: 'admin@company.com',
      fullName: 'Alex Admin',
      role: 'admin',
      department: 'IT',
      directReportIds: [],
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    password: 'admin123',
  },
  // ─── HR Coordinator ─────────────────────────────────────────
  {
    user: {
      id: 'user-hr',
      email: 'hr@company.com',
      fullName: 'Harper HR',
      role: 'hr_coordinator',
      department: 'Human Resources',
      directReportIds: [],
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    password: 'hr123',
  },
  // ─── Engineering Manager ────────────────────────────────────
  {
    user: {
      id: 'mgr-engineering',
      email: 'eng.manager@company.com',
      fullName: 'Morgan Chen',
      role: 'manager',
      department: 'Engineering',
      directReportIds: ['emp-eng-1', 'emp-eng-2', 'emp-eng-3', 'emp-eng-4', 'emp-eng-5'],
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    password: 'manager123',
  },
  // ─── Marketing Manager ─────────────────────────────────────
  {
    user: {
      id: 'mgr-marketing',
      email: 'mkt.manager@company.com',
      fullName: 'Sarah Patel',
      role: 'manager',
      department: 'Marketing',
      directReportIds: ['emp-mkt-1', 'emp-mkt-2', 'emp-mkt-3', 'emp-mkt-4'],
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    password: 'manager123',
  },
  // ─── Operations Manager ─────────────────────────────────────
  {
    user: {
      id: 'mgr-operations',
      email: 'ops.manager@company.com',
      fullName: 'David Kim',
      role: 'manager',
      department: 'Operations',
      directReportIds: ['emp-ops-1', 'emp-ops-2', 'emp-ops-3', 'emp-ops-4', 'emp-ops-5'],
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    password: 'manager123',
  },
  // ─── Engineering Employees ──────────────────────────────────
  {
    user: { id: 'emp-eng-1', email: 'alice.wong@company.com', fullName: 'Alice Wong', role: 'employee', department: 'Engineering', managerId: 'mgr-engineering', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-eng-2', email: 'bob.martinez@company.com', fullName: 'Bob Martinez', role: 'employee', department: 'Engineering', managerId: 'mgr-engineering', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-eng-3', email: 'carol.nguyen@company.com', fullName: 'Carol Nguyen', role: 'employee', department: 'Engineering', managerId: 'mgr-engineering', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-eng-4', email: 'dan.johnson@company.com', fullName: 'Dan Johnson', role: 'employee', department: 'Engineering', managerId: 'mgr-engineering', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-eng-5', email: 'eva.schmidt@company.com', fullName: 'Eva Schmidt', role: 'employee', department: 'Engineering', managerId: 'mgr-engineering', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  // ─── Marketing Employees ───────────────────────────────────
  {
    user: { id: 'emp-mkt-1', email: 'frank.lee@company.com', fullName: 'Frank Lee', role: 'employee', department: 'Marketing', managerId: 'mgr-marketing', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-mkt-2', email: 'grace.taylor@company.com', fullName: 'Grace Taylor', role: 'employee', department: 'Marketing', managerId: 'mgr-marketing', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-mkt-3', email: 'henry.brown@company.com', fullName: 'Henry Brown', role: 'employee', department: 'Marketing', managerId: 'mgr-marketing', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-mkt-4', email: 'iris.davis@company.com', fullName: 'Iris Davis', role: 'employee', department: 'Marketing', managerId: 'mgr-marketing', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  // ─── Operations Employees ──────────────────────────────────
  {
    user: { id: 'emp-ops-1', email: 'jack.wilson@company.com', fullName: 'Jack Wilson', role: 'employee', department: 'Operations', managerId: 'mgr-operations', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-ops-2', email: 'karen.moore@company.com', fullName: 'Karen Moore', role: 'employee', department: 'Operations', managerId: 'mgr-operations', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-ops-3', email: 'leo.garcia@company.com', fullName: 'Leo Garcia', role: 'employee', department: 'Operations', managerId: 'mgr-operations', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-ops-4', email: 'mia.anderson@company.com', fullName: 'Mia Anderson', role: 'employee', department: 'Operations', managerId: 'mgr-operations', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
  {
    user: { id: 'emp-ops-5', email: 'noah.thomas@company.com', fullName: 'Noah Thomas', role: 'employee', department: 'Operations', managerId: 'mgr-operations', directReportIds: [], isActive: true, createdAt: NOW, updatedAt: NOW },
    password: 'employee123',
  },
];

// ─── All 30 permissions (typed tuple for exhaustiveness) ──────
const ALL_PERMISSIONS: Permission[] = [
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
  'goals:read:own', 'goals:read:team', 'goals:read:all', 'goals:import',
];

// ─── Role → Permission matrix ─────────────────────────────────
/**
 * Principle of Least Privilege:
 * - employee  : own-scoped access only
 * - manager   : team-scoped + approval
 * - hr_coordinator: org-wide + bulk + reporting (no admin:*)
 * - admin     : all permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [...ALL_PERMISSIONS],

  manager: [
    'employees:read:team',
    'employees:update:team',
    'plans:read:team',
    'plans:create:team',
    'plans:update:team',
    'plans:approve',
    'analytics:read:team',
    'bulk:generate',
    'goals:read:team',
  ],

  employee: [
    'employees:read:own',
    'employees:update:own',
    'plans:read:own',
    'plans:create:own',
    'plans:update:own',
    'analytics:read:own',
    'goals:read:own',
  ],

  hr_coordinator: [
    'employees:read:all',
    'employees:update:all',
    'plans:read:all',
    'plans:create:all',
    'plans:update:all',
    'analytics:read:all',
    'bulk:upload',
    'bulk:generate',
    'reports:export',
    'goals:read:all',
    'goals:import',
  ],
};

// ─── Session configuration ────────────────────────────────────
export const SESSION_CONFIG = {
  /** Hours before a normal session expires */
  defaultExpiryHours: 24,
  /** Days before a "remember me" session expires */
  rememberMeDays: 7,
  /** Failed login attempts before lockout */
  maxFailedAttempts: 5,
  /** Minutes to lock an account after maxFailedAttempts */
  lockoutMinutes: 15,
} as const;

// ─── localStorage keys (single source of truth) ──────────────
export const STORAGE_KEYS = {
  SESSION: 'hra_session',
  USERS: 'hra_users',
  CREDENTIALS: 'hra_credentials',
  AUDIT_LOG: 'hra_audit_log',
  FAILED_ATTEMPTS: 'hra_failed_attempts',
  SEEDED: 'hra_seeded',
} as const;

// ─── Role UI metadata (design-system colours from spec) ───────
export const ROLE_META: Record<
  UserRole,
  { label: string; color: string; bgColor: string }
> = {
  admin:          { label: 'Admin',          color: '#DC2626', bgColor: '#FEF2F2' },
  manager:        { label: 'Manager',        color: '#059669', bgColor: '#ECFDF5' },
  employee:       { label: 'Employee',       color: '#2563EB', bgColor: '#EFF6FF' },
  hr_coordinator: { label: 'HR Coordinator', color: '#7C3AED', bgColor: '#F5F3FF' },
};
