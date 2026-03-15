import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { mockAuthProvider } from '../auth/mock-auth-provider';
import type {
  AuthSession,
  User,
  UserRole,
  Permission,
  IAuthProvider,
} from '../types/auth';

// ── Context Shape Definitions ────────────────────────────────────────────────

export interface AuthState {
  session: AuthSession | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  impersonate: (userId: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  isImpersonating: boolean;
}

// ── Context Instances ────────────────────────────────────────────────────────

const AuthStateContext = createContext<AuthState | null>(null);
const AuthActionsContext = createContext<AuthActions | null>(null);

AuthStateContext.displayName = 'AuthStateContext';
AuthActionsContext.displayName = 'AuthActionsContext';

// ── State Reducer ────────────────────────────────────────────────────────────

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: { session: AuthSession | null; user: User | null } }
  | { type: 'CLEAR_SESSION' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SESSION':
      return {
        ...state,
        session: action.payload.session,
        user: action.payload.user,
        isAuthenticated: action.payload.session !== null,
        isLoading: false,
      };
    case 'CLEAR_SESSION':
      return { ...state, session: null, user: null, isAuthenticated: false, isLoading: false };
    default:
      return state;
  }
}

const INITIAL_STATE: AuthState = {
  session: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function sessionToUser(session: AuthSession): User {
  return {
    id: session.userId,
    email: session.email,
    fullName: session.fullName,
    role: session.role,
    department: '',
    directReportIds: [],
    isActive: true,
    createdAt: session.loginAt,
    updatedAt: session.loginAt,
  };
}

// ── AuthProvider ─────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
  provider?: IAuthProvider;
}

export function AuthProvider({
  children,
  provider = mockAuthProvider,
}: AuthProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);
  const providerRef = useRef(provider);
  const stateRef = useRef(state);
  stateRef.current = state;

  // On mount: check for existing session
  useEffect(() => {
    const session = providerRef.current.getCurrentSession();
    if (session) {
      const users = providerRef.current.getUsers();
      const user = users.find(u => u.id === session.userId) ?? sessionToUser(session);
      dispatch({ type: 'SET_SESSION', payload: { session, user } });
    } else {
      dispatch({ type: 'CLEAR_SESSION' });
    }
  }, []);

  // Cross-tab sync via storage event
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === 'hra_session') {
        const session = providerRef.current.getCurrentSession();
        if (session) {
          const users = providerRef.current.getUsers();
          const user = users.find(u => u.id === session.userId) ?? sessionToUser(session);
          dispatch({ type: 'SET_SESSION', payload: { session, user } });
        } else {
          dispatch({ type: 'CLEAR_SESSION' });
        }
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Visibility change: re-validate session expiry
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && stateRef.current.isAuthenticated) {
        const session = providerRef.current.getCurrentSession();
        if (!session) {
          dispatch({ type: 'CLEAR_SESSION' });
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Stable action references
  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    const session = await providerRef.current.login(email, password, rememberMe);
    const users = providerRef.current.getUsers();
    const user = users.find(u => u.id === session.userId) ?? sessionToUser(session);
    dispatch({ type: 'SET_SESSION', payload: { session, user } });
  }, []);

  const logout = useCallback(async () => {
    await providerRef.current.logout();
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return stateRef.current.session?.permissions.includes(permission) ?? false;
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    const currentRole = stateRef.current.session?.role;
    if (!currentRole) return false;
    return Array.isArray(role) ? role.includes(currentRole) : currentRole === role;
  }, []);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(p => stateRef.current.session?.permissions.includes(p));
  }, []);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(p => stateRef.current.session?.permissions.includes(p));
  }, []);

  const impersonate = useCallback(async (userId: string) => {
    const session = await providerRef.current.impersonate(userId);
    const users = providerRef.current.getUsers();
    const user = users.find(u => u.id === session.userId) ?? sessionToUser(session);
    dispatch({ type: 'SET_SESSION', payload: { session, user } });
  }, []);

  const stopImpersonation = useCallback(async () => {
    const session = await providerRef.current.stopImpersonation();
    const users = providerRef.current.getUsers();
    const user = users.find(u => u.id === session.userId) ?? sessionToUser(session);
    dispatch({ type: 'SET_SESSION', payload: { session, user } });
  }, []);

  const isImpersonating = !!state.session?.impersonating;

  const actions = useMemo<AuthActions>(() => ({
    login,
    logout,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    impersonate,
    stopImpersonation,
    isImpersonating,
  }), [login, logout, hasPermission, hasRole, hasAnyPermission, hasAllPermissions, impersonate, stopImpersonation, isImpersonating]);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionsContext.Provider value={actions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

// ── Hook exports ─────────────────────────────────────────────────────────────

export function useAuthState(): AuthState {
  const ctx = useContext(AuthStateContext);
  if (!ctx) throw new Error('useAuthState must be used within <AuthProvider>');
  return ctx;
}

export function useAuthActions(): AuthActions {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) throw new Error('useAuthActions must be used within <AuthProvider>');
  return ctx;
}
