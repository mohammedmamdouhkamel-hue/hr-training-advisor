import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Toaster, toast } from 'sonner';
import { useApiKey } from './hooks/useApiKey';
import { useEmployees } from './hooks/useEmployees';
import { useTrainingPlans } from './hooks/useTrainingPlans';
import { useFileUpload } from './hooks/useFileUpload';
import { useTheme } from './hooks/useTheme';
import type { TrainingPlan } from './types/training-plan';
import ErrorBoundary from './components/shared/ErrorBoundary';
import ApiKeyModal from './components/modals/ApiKeyModal';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MainPanel from './components/layout/MainPanel';
import UploadView from './components/upload/UploadView';
import './i18n/config';
import './styles/global.css';

const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));

export default function HRTrainingAdvisor() {
  const { apiKey, setApiKey, clearKey } = useApiKey();
  const { employees, setEmployees, selected, setSelected, uploadedFile, setUploadedFile } = useEmployees();
  const { plans, setPlans, loading, loadingMsg, error, setError, doGenerate, generateAll, autoGenerate, generatingRef } = useTrainingPlans(apiKey);
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<'upload' | 'dashboard' | 'analytics'>(() => employees.length > 0 ? 'dashboard' : 'upload');

  const { handleFile, loadSample } = useFileUpload({
    setEmployees,
    setSelected,
    setPlans: (p) => setPlans(p as Record<string, never>),
    setUploadedFile,
    setError,
    setView: (v) => setView(v as 'upload' | 'dashboard'),
  });

  // Auto-generate when employee is selected and no plan exists
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    autoGenerate(selected);
  }, [selected?.name]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleSelect = (emp: typeof employees[number]) => {
    setError('');
    if (view === 'analytics') setView('dashboard');
    if (selected?.name === emp.name) {
      if (!plans[emp.name] && !generatingRef.current) doGenerate(emp);
      return;
    }
    setSelected(emp);
  };

  const handleUploadNew = () => {
    setView('upload');
    setSelected(null);
  };

  const handleGenerateAll = () => {
    generateAll(employees, setSelected);
    toast.success('Generating training plans for all employees...');
  };

  const handleUpdatePlan = useCallback((employeeName: string, updatedPlan: TrainingPlan) => {
    setPlans(prev => ({ ...prev, [employeeName]: updatedPlan }));
  }, [setPlans]);

  return (
    <ErrorBoundary>
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: 'var(--surface-bg)', minHeight: '100vh', color: 'var(--text-primary)' }}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Toaster position="bottom-right" theme={theme} />
        {!apiKey && <ApiKeyModal onSave={setApiKey} />}

        <Header
          view={view === 'analytics' ? 'dashboard' : view}
          loading={loading}
          onUploadNew={handleUploadNew}
          onGenerateAll={handleGenerateAll}
          onChangeKey={clearKey}
          theme={theme}
          onToggleTheme={toggleTheme}
          onShowAnalytics={view !== 'upload' ? () => setView(view === 'analytics' ? 'dashboard' : 'analytics') : undefined}
        />

        {view === 'upload' && (
          <UploadView
            onFileSelect={handleFile}
            onLoadSample={loadSample}
            error={error}
          />
        )}

        {view === 'analytics' && (
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics...</div>}>
            <AnalyticsDashboard employees={employees} plans={plans} />
          </Suspense>
        )}

        {view === 'dashboard' && (
          <div id="main-content" className="app-dashboard" style={{ display: 'flex', height: 'calc(100vh - 69px)' }}>
            <Sidebar
              employees={employees}
              selected={selected}
              plans={plans}
              uploadedFile={uploadedFile}
              onSelect={handleSelect}
            />
            <MainPanel
              selected={selected}
              loading={loading}
              loadingMsg={loadingMsg}
              error={error}
              plans={plans}
              employees={employees}
              onRetry={() => selected && doGenerate(selected)}
              onUpdatePlan={handleUpdatePlan}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
