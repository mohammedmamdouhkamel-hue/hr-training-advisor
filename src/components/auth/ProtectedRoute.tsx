// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

// ─── Safe redirect path validator ────────────────────────────────────────────
// Prevents open-redirect attacks: only allow relative paths starting with /
// that do NOT start with // (protocol-relative) or contain colons (protocol).
function isSafeRedirectPath(path: string): boolean {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes(':')
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
const LoadingSpinner: React.FC = () => (
  <div
    role="status"
    aria-label="Verifying authentication…"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      gap: '16px',
      background: 'var(--bg-primary)',
    }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: '3px solid var(--border-subtle)',
        borderTopColor: '#6366F1',
      }}
    />
    <p
      style={{
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      Verifying session…
    </p>
  </div>
);

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
/**
 * Wraps all authenticated routes.
 *  - isLoading  → full-screen spinner (avoids flash-of-redirect)
 *  - !authed    → saves current path to sessionStorage, redirects to /login
 *  - authed     → renders <Outlet /> (child routes / AppShell)
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    const intendedPath = location.pathname + location.search + location.hash;
    // Only persist safe relative paths — guard against XSS via storage
    if (isSafeRedirectPath(location.pathname)) {
      sessionStorage.setItem('hra:redirect-after-login', intendedPath);
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
