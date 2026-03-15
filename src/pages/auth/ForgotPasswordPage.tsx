import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Simulated delay
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #6366F1 100%)',
      padding: '24px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '40px',
        }}
      >
        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: '#34D399', marginBottom: '16px' }} />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>
              Check Your Email
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 24px' }}>
              If an account exists with <strong style={{ color: '#E2E8F0' }}>{email}</strong>, a password reset link has been sent.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#818CF8',
                fontSize: '0.9rem',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px' }}>
              Forgot Password
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '0 0 28px' }}>
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', marginBottom: '20px' }}>
                <span style={{ display: 'block', color: '#CBD5E1', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Email Address
                </span>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#F8FAFC',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? '#4F46E5' : '#6366F1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading || !email.trim() ? 0.7 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#818CF8',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
