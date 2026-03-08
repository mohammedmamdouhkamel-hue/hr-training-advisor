import { Key, Upload, Zap, Loader2, Sun, Moon, BarChart3 } from 'lucide-react';
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

export default function Header({ view, loading, onUploadNew, onGenerateAll, onChangeKey, theme, onToggleTheme, onShowAnalytics }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="app-header" role="banner" style={{ background: 'var(--surface-header)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={18} color="#fff" />
        </div>
        <div>
          <div className="app-header-title" style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{t('header.title')}</div>
          <div className="app-header-subtitle" style={{ color: '#60A5FA', fontSize: 11, fontWeight: 500 }}>{t('header.subtitle')}</div>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }} aria-label="Main actions">
        {view === 'dashboard' && (
          <>
            <button onClick={onUploadNew} aria-label="Upload new file"
              style={{ background: 'transparent', border: '1px solid #334155', color: '#94A3B8', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} /> {t('header.uploadNewLabel')}
            </button>
            {onShowAnalytics && (
              <button onClick={onShowAnalytics} aria-label="View analytics"
                style={{ background: 'transparent', border: '1px solid #334155', color: '#94A3B8', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={14} /> {t('header.analytics')}
              </button>
            )}
            <button onClick={onGenerateAll} disabled={loading} aria-label="Generate all training plans"
              style={{ background: loading ? '#334155' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)', border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('header.generating')}</> : <><Zap size={14} /> {t('header.generateAllLabel')}</>}
            </button>
          </>
        )}
        {onToggleTheme && (
          <button onClick={onToggleTheme} className="theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
        <button onClick={onChangeKey} aria-label={t('header.changeKey')}
          style={{ background: 'transparent', border: '1px solid #334155', color: '#94A3B8', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
          <Key size={14} />
        </button>
      </nav>
    </header>
  );
}
