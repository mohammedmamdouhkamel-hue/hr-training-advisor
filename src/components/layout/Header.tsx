import { Key, Upload, GraduationCap, Loader2, Sun, Moon, BarChart3, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  view: 'upload' | 'dashboard';
  loading: boolean;
  onUploadNew: () => void;
  onGenerateAll: () => void;
  onChangeKey: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onShowAnalytics?: () => void;
}

const btnSecondary: React.CSSProperties = {
  background: 'rgba(129, 140, 248, 0.08)',
  border: '1px solid rgba(165, 180, 252, 0.2)',
  color: 'rgba(199, 210, 254, 0.9)',
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'var(--font-sans)',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.2s',
};

export default function Header({ view, loading, onUploadNew, onGenerateAll, onChangeKey, theme, onToggleTheme, onShowAnalytics }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="app-header" role="banner" style={{ position: 'relative', overflow: 'hidden', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(165, 180, 252, 0.1)' }}>
      {/* Abstract purple background from Unsplash (Photo by Mirella Callage) */}
      <img
        src={`${import.meta.env.BASE_URL}images/abstract-purple.jpg`}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0, opacity: 0.4,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85), rgba(49, 46, 129, 0.80))' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 2 }}>
        <div style={{
          width: 40, height: 40,
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
        }}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div>
          <div className="app-header-title" style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>{t('header.title')}</div>
          <div className="app-header-subtitle" style={{ color: 'rgba(165, 180, 252, 0.7)', fontSize: 11, fontWeight: 500 }}>{t('header.subtitle')}</div>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative', zIndex: 2 }} aria-label="Main actions">
        {view === 'dashboard' && (
          <>
            <button onClick={onUploadNew} aria-label="Upload new file" style={btnSecondary}>
              <Upload size={14} /> {t('header.uploadNewLabel')}
            </button>
            {onShowAnalytics && (
              <button onClick={onShowAnalytics} aria-label="View analytics" style={btnSecondary}>
                <BarChart3 size={14} /> {t('header.analytics')}
              </button>
            )}
            <button onClick={onGenerateAll} disabled={loading} aria-label="Generate all training plans"
              style={{ background: loading ? 'rgba(165, 180, 252, 0.15)' : 'var(--gradient-brand)', border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6, boxShadow: loading ? 'none' : '0 2px 8px rgba(79, 70, 229, 0.3)', transition: 'all 0.15s' }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('header.generating')}</> : <><Sparkles size={14} /> {t('header.generateAllLabel')}</>}
            </button>
          </>
        )}
        {onToggleTheme && (
          <button onClick={onToggleTheme} className="theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
        <button onClick={onChangeKey} aria-label={t('header.changeKey')}
          style={{ ...btnSecondary, padding: '7px 12px' }}>
          <Key size={14} />
        </button>
      </nav>
    </header>
  );
}
