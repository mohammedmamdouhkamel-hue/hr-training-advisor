import { useState } from 'react';
import { Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export default function ApiKeyModal({ onSave }: ApiKeyModalProps) {
  const { t } = useTranslation();
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const isValid = key.startsWith('sk-');

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="api-key-title"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-modal" style={{
        background: 'var(--surface-card)',
        borderRadius: 24,
        padding: '48px 40px',
        maxWidth: 480,
        width: '90%',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2), 0 0 0 1px rgba(129, 140, 248, 0.1)',
        animation: 'pulse-glow 3s ease-in-out infinite',
      }}>
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
          }}>
            <Key size={28} color="#fff" />
          </div>
        </div>

        <h2 id="api-key-title" style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '-0.02em' }}>{t('apiKeyModal.title')}</h2>
        <p style={{ margin: '0 0 28px', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, textAlign: 'center' }}>
          {t('apiKeyModal.description')}
        </p>

        {/* Input */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && isValid && onSave(key)}
            placeholder={t('apiKeyModal.placeholder')}
            aria-label="Anthropic API key"
            autoFocus
            style={{
              width: '100%', padding: '14px 44px 14px 16px',
              borderRadius: 12, border: '2px solid var(--surface-border)',
              fontSize: 14, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
              color: 'var(--text-primary)', background: 'var(--surface-input-bg)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--surface-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <button onClick={() => setShow(s => !s)} aria-label={show ? t('apiKeyModal.hideKey') : t('apiKeyModal.showKey')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: 4 }}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Submit button */}
        <button
          onClick={() => isValid && onSave(key)}
          disabled={!isValid}
          aria-label="Start session with API key"
          style={{
            width: '100%',
            background: isValid ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'var(--surface-border)',
            color: isValid ? '#fff' : 'var(--text-subtle)',
            border: 'none', padding: '14px', borderRadius: 12,
            fontWeight: 700, fontSize: 15, cursor: isValid ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: isValid ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
          }}>
          {t('apiKeyModal.startSession')}
        </button>

        {/* Security note */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          <ShieldCheck size={14} color="var(--color-success)" />
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Stored in memory only — never saved to disk</span>
        </div>

        <p style={{ margin: '12px 0 0', color: 'var(--text-subtle)', fontSize: 12, textAlign: 'center' }}>
          {t('apiKeyModal.getKeyAt')} <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>console.anthropic.com</a>
        </p>
      </div>
    </div>
  );
}
