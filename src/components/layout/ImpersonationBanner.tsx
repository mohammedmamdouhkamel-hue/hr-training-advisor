import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, UserX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import RoleBadge from '../shared/RoleBadge';

export const ImpersonationBanner: React.FC = () => {
  const { user, isImpersonating, stopImpersonation } = useAuth();

  return (
    <AnimatePresence>
      {isImpersonating && user && (
        <motion.div
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          role="alert"
          aria-live="polite"
          aria-label="Impersonation active"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px 20px',
            background: 'linear-gradient(90deg, #92400e 0%, #b45309 100%)',
            borderBottom: '1px solid rgba(251,191,36,0.4)',
            boxShadow: '0 2px 12px rgba(180,83,9,0.35)',
            minHeight: '48px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <AlertTriangle size={18} style={{ color: '#FCD34D', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ color: '#FEF3C7', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              You are impersonating
            </span>
            <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 700 }}>
              {user.fullName}
            </span>
            <RoleBadge role={user.role} size="sm" />
          </div>
          <button
            onClick={stopImpersonation}
            aria-label="Exit impersonation and return to your account"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(254,243,199,0.15)',
              border: '1px solid rgba(254,243,199,0.4)',
              color: '#FEF3C7',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              whiteSpace: 'nowrap',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(254,243,199,0.28)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(254,243,199,0.15)'; }}
          >
            <UserX size={14} aria-hidden="true" />
            Exit Impersonation
            <X size={12} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImpersonationBanner;
