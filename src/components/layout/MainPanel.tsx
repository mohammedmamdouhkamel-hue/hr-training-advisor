import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Employee } from '../../types/employee';
import type { TrainingPlan } from '../../types/training-plan';
import TrainingPlanView from '../training/TrainingPlanView';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import ExportButton from '../shared/ExportButton';

interface MainPanelProps {
  selected: Employee | null;
  loading: boolean;
  loadingMsg: string;
  error: string;
  plans: Record<string, TrainingPlan>;
  employees: Employee[];
  onRetry: () => void;
  onUpdatePlan?: (employeeName: string, plan: TrainingPlan) => void;
}

export default function MainPanel({ selected, loading, loadingMsg, error, plans, employees, onRetry, onUpdatePlan }: MainPanelProps) {
  const { t } = useTranslation();
  const plan = selected ? plans[selected.name] : undefined;

  const handleUpdatePlan = (updatedPlan: TrainingPlan) => {
    if (selected && onUpdatePlan) {
      onUpdatePlan(selected.name, updatedPlan);
    }
  };

  return (
    <main className="app-main" role="main" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      {!selected && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {/* Workspace image from Unsplash (Photo by Vitaly Gariev) */}
          <div style={{
            width: 200, height: 140, borderRadius: 16, overflow: 'hidden',
            marginBottom: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: '1px solid var(--surface-border)',
          }}>
            <img
              src={`${import.meta.env.BASE_URL}images/workspace.jpg`}
              alt="Professional workspace"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
            />
          </div>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Users size={24} color="var(--color-primary)" strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('mainPanel.selectEmployee')}</div>
          <div style={{ fontSize: 'var(--text-base)', marginTop: 6, color: 'var(--text-muted)' }}>{t('mainPanel.selectEmployeeHint')}</div>
        </div>
      )}
      {selected && loading && (
        <LoadingSpinner message={loadingMsg} />
      )}
      {selected && !loading && error && (
        <ErrorMessage error={error} onRetry={onRetry} />
      )}
      {selected && !loading && !error && plan && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }} className="no-print">
            <ExportButton employee={selected} plan={plan} allEmployees={employees} allPlans={plans} />
          </div>
          <TrainingPlanView
            plan={plan}
            employee={selected}
            onUpdatePlan={onUpdatePlan ? handleUpdatePlan : undefined}
          />
        </div>
      )}
    </main>
  );
}
