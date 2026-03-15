import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import AppRouter from './router/AppRouter';
import './i18n/config';
import './styles/global.css';

export default function HRTrainingAdvisor() {
  const { theme } = useTheme();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <div style={{ fontFamily: 'var(--font-sans)', background: 'var(--surface-bg)', minHeight: '100vh', color: 'var(--text-primary)' }}>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <Toaster position="bottom-right" theme={theme} />
          <AppRouter />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
