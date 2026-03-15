import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      padding: '40px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          textAlign: 'center',
          maxWidth: '400px',
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '48px 40px',
        }}
      >
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'rgba(99,102,241,0.12)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <Icon size={28} style={{ color: '#818CF8' }} />
        </div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px' }}>
          {title}
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px' }}>
          {description}
        </p>
        <span style={{
          display: 'inline-block',
          padding: '4px 14px',
          background: 'rgba(99,102,241,0.15)',
          color: '#818CF8',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          Coming Soon
        </span>
      </motion.div>
    </div>
  );
}
