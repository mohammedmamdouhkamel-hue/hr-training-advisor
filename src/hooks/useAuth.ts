import { useAuthState, useAuthActions } from '../contexts/AuthContext';
import type { Permission, UserRole } from '../types/auth';

/**
 * Convenience hook that combines auth state + actions.
 * Use useAuthState() or useAuthActions() individually for better perf.
 */
export function useAuth() {
  const state = useAuthState();
  const actions = useAuthActions();
  return { ...state, ...actions };
}

/** Returns true if the current user has the given permission. */
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuthActions();
  return hasPermission(permission);
}

/**
 * Redirects to /unauthorized if the current user doesn't have the required role.
 * Must be called at the top level of a component rendered inside AuthProvider.
 */
export function useRequireRole(role: UserRole | UserRole[]): void {
  const { hasRole } = useAuthActions();
  const { isAuthenticated, isLoading } = useAuthState();

  if (!isLoading && isAuthenticated && !hasRole(role)) {
    window.location.hash = '#/unauthorized';
  }
}
