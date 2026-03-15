import { motion } from 'framer-motion';
import { Clock, Shield, Target } from 'lucide-react';
import { SESSION_CONFIG } from '../../constants/auth';

export default function SystemConfigPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 800 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>System Configuration</h1>
      <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: '0.88rem' }}>Current system settings and thresholds</p>

      {/* Session Config */}
      <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Clock size={18} style={{ color: '#818CF8' }} />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>Session Settings</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ConfigItem label="Session Timeout" value={`${SESSION_CONFIG.defaultExpiryHours} hours`} />
          <ConfigItem label="Remember Me Duration" value={`${SESSION_CONFIG.rememberMeDays} days`} />
          <ConfigItem label="Max Failed Attempts" value={String(SESSION_CONFIG.maxFailedAttempts)} />
          <ConfigItem label="Lockout Duration" value={`${SESSION_CONFIG.lockoutMinutes} minutes`} />
        </div>
      </div>

      {/* Score Thresholds */}
      <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Target size={18} style={{ color: '#818CF8' }} />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>Score Thresholds</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={{ borderRadius: 8, padding: 14, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Strong</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34D399' }}>80+</div>
          </div>
          <div style={{ borderRadius: 8, padding: 14, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Developing</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FBBF24' }}>65-79</div>
          </div>
          <div style={{ borderRadius: 8, padding: 14, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Needs Focus</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F87171' }}>&lt;65</div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Shield size={18} style={{ color: '#818CF8' }} />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>Security</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ConfigItem label="Auth Provider" value="Local (Demo)" />
          <ConfigItem label="Password Hashing" value="SHA-256" />
          <ConfigItem label="Storage" value="localStorage" />
          <ConfigItem label="Cross-Tab Sync" value="Enabled" />
        </div>
      </div>
    </motion.div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#CBD5E1' }}>{value}</div>
    </div>
  );
}
