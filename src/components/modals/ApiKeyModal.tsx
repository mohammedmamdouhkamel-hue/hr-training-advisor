import { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--surface-card)', borderRadius: 20, padding: '40px 36px', maxWidth: 480, width: '90%', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={24} color="#fff" />
          </div>
        </div>
        <h2 id="api-key-title" style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' }}>{t('apiKeyModal.title')}</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, textAlign: 'center' }}>
          {t('apiKeyModal.description')}
        </p>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && isValid && onSave(key)}
            placeholder={t('apiKeyModal.placeholder')}
            aria-label="Anthropic API key"
            autoFocus
            style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: 10, border: '2px solid var(--surface-border)', fontSize: 14, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)', background: 'var(--surface-input-bg)' }}
          />
          <button onClick={() => setShow(s => !s)} aria-label={show ? t('apiKeyModal.hideKey') : t('apiKeyModal.showKey')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: 4 }}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button
          onClick={() => isValid && onSave(key)}
          disabled={!isValid}
          aria-label="Start session with API key"
          style={{ width: '100%', background: isValid ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : 'var(--surface-border)', color: isValid ? '#fff' : 'var(--text-subtle)', border: 'none', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: isValid ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
          {t('apiKeyModal.startSession')}
        </button>
        <p style={{ margin: '16px 0 0', color: 'var(--text-subtle)', fontSize: 12, textAlign: 'center' }}>
          {t('apiKeyModal.getKeyAt')} <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6' }}>console.anthropic.com</a>
        </p>
      </div>
    </div>
  );
}
