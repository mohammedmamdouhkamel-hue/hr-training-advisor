import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-bg, #0F172A)',
      padding: '24px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          textAlign: 'center',
          maxWidth: '400px',
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '48px 40px',
        }}
      >
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: 'rgba(239,68,68,0.12)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <ShieldX size={32} style={{ color: '#EF4444' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px' }}>
          Access Denied
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 28px' }}>
          You don't have permission to access this page. Contact your administrator if you believe this is an error.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link
            to="/dashboard"
            style={{
              padding: '10px 24px', background: '#6366F1', color: '#fff',
              borderRadius: '10px', textDecoration: 'none', fontSize: '0.9rem',
              fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            Go to Dashboard
          </Link>
          <Link
            to="/login"
            style={{
              padding: '10px 24px', background: 'rgba(255,255,255,0.06)',
              color: '#CBD5E1', borderRadius: '10px', textDecoration: 'none',
              fontSize: '0.9rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'inherit',
            }}
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
