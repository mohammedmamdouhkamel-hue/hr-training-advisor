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
          <Users size={64} color="var(--text-subtle)" strokeWidth={1} style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-subtle)' }}>{t('mainPanel.selectEmployee')}</div>
          <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text-subtle)' }}>{t('mainPanel.selectEmployeeHint')}</div>
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
