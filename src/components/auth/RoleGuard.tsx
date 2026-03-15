// src/components/auth/RoleGuard.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole, Permission } from '../../types/auth';

interface RoleGuardProps {
  /** One or more roles that are allowed to access the wrapped content */
  roles?: UserRole[];
  /** One or more permissions that are required (any match grants access) */
  permissions?: Permission[];
  children: React.ReactNode;
}

/**
 * Fine-grained access control gate.
 *
 * Access logic (OR semantics — any match is sufficient):
 *   1. If `roles` is provided, user's role must appear in the list.
 *   2. If `permissions` is provided, user must hold at least one of them.
 *   3. If neither prop is given, the guard passes through (used as a no-op wrapper).
 *
 * On failure → redirect to /unauthorized (replaces history entry so
 * the browser back-button doesn't loop).
 */
const RoleGuard: React.FC<RoleGuardProps> = ({ roles, permissions, children }) => {
  const { user, hasRole, hasPermission } = useAuth();

  // Not yet loaded — nothing to guard yet; ProtectedRoute handles the loading state
  if (!user) {
    return <Navigate to="/unauthorized" replace />;
  }

  // No constraints provided → pass through
  const hasRoleConstraint = roles && roles.length > 0;
  const hasPermissionConstraint = permissions && permissions.length > 0;

  if (!hasRoleConstraint && !hasPermissionConstraint) {
    return <>{children}</>;
  }

  const roleOk = hasRoleConstraint ? roles!.some((r) => hasRole(r)) : false;
  const permOk = hasPermissionConstraint
    ? permissions!.some((p) => hasPermission(p))
    : false;

  if (!roleOk && !permOk) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
