import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
          background: 'rgba(99,102,241,0.12)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <Search size={32} style={{ color: '#818CF8' }} />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#6366F1', margin: '0 0 4px' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px' }}>
          Page Not Found
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 28px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-block',
            padding: '10px 28px', background: '#6366F1', color: '#fff',
            borderRadius: '10px', textDecoration: 'none', fontSize: '0.9rem',
            fontWeight: 600, fontFamily: 'inherit',
          }}
        >
          Go Home
        </Link>
      </motion.div>
    </div>
  );
}
