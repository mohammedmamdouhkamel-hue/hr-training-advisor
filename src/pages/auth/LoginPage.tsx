import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, Loader2, AlertCircle,
  GraduationCap, Sparkles, Users, BarChart3,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';

interface DemoAccount {
  role: UserRole;
  email: string;
  password: string;
  label: string;
  color: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'admin', email: 'admin@company.com', password: 'admin123', label: 'Admin', color: '#DC2626' },
  { role: 'manager', email: 'eng.manager@company.com', password: 'manager123', label: 'Eng Manager', color: '#059669' },
  { role: 'manager', email: 'mkt.manager@company.com', password: 'manager123', label: 'Mkt Manager', color: '#10B981' },
  { role: 'manager', email: 'ops.manager@company.com', password: 'manager123', label: 'Ops Manager', color: '#06B6D4' },
  { role: 'employee', email: 'alice.wong@company.com', password: 'employee123', label: 'Employee', color: '#2563EB' },
  { role: 'hr_coordinator', email: 'hr@company.com', password: 'hr123', label: 'HR Coordinator', color: '#7C3AED' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password, rememberMe);
      const savedUrl = sessionStorage.getItem('hra:redirect-after-login');
      sessionStorage.removeItem('hra:redirect-after-login');
      navigate(savedUrl || '/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Left branding panel */}
      <div style={{
        flex: '1 1 50%',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #4F46E5 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={28} color="#fff" />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              HR Training Advisor
            </span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Empower Your Team's Growth
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: '440px', margin: '0 0 40px' }}>
            AI-powered training plans, competency analytics, and personalized development paths for every team member.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: Sparkles, text: 'AI-generated training plans' },
              { icon: Users, text: 'Role-based team management' },
              { icon: BarChart3, text: 'Competency analytics & insights' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="#fff" />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        padding: '40px',
      }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 6px' }}>
            Welcome back
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0 0 32px' }}>
            Sign in to your account to continue
          </p>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              aria-live="polite"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', marginBottom: '20px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', color: '#F87171', fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <label style={{ display: 'block', marginBottom: '18px' }}>
              <span style={{ display: 'block', color: '#CBD5E1', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Email Address
              </span>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: '#F8FAFC', fontSize: '0.9rem',
                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </label>

            {/* Password */}
            <label style={{ display: 'block', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ color: '#CBD5E1', fontSize: '0.82rem', fontWeight: 600 }}>Password</span>
                <Link to="/forgot-password" style={{ color: '#6366F1', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '12px 42px 12px 42px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: '#F8FAFC', fontSize: '0.9rem',
                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#475569',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: '#6366F1', width: '16px', height: '16px' }}
              />
              <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Remember me for 7 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                opacity: loading || !email.trim() || !password.trim() ? 0.6 : 1,
                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', transition: 'opacity 0.15s',
              }}
            >
              {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Demo Accounts
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoLogin(account)}
                  style={{
                    padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = account.color + '40'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: account.color, flexShrink: 0,
                    }} />
                    <span style={{ color: '#E2E8F0', fontSize: '0.8rem', fontWeight: 600 }}>
                      {account.label}
                    </span>
                  </div>
                  <div style={{ color: '#64748B', fontSize: '0.72rem' }}>
                    {account.email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
