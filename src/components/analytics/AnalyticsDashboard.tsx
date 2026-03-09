import type { Employee } from '../../types/employee';
import type { TrainingPlan } from '../../types/training-plan';
import ScoreDistribution from './ScoreDistribution';
import DepartmentComparison from './DepartmentComparison';
import CompetencyHeatmap from './CompetencyHeatmap';
import TrainingCoverage from './TrainingCoverage';

interface AnalyticsDashboardProps {
  employees: Employee[];
  plans: Record<string, TrainingPlan>;
}

export default function AnalyticsDashboard({ employees, plans }: AnalyticsDashboardProps) {
  if (employees.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          color: 'var(--text-muted)',
          fontSize: 14,
          fontFamily: 'var(--font-sans)',
        }}
      >
        Upload employee data to view analytics
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--color-primary-950)',
            }}
          >
            Analytics
          </h2>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            Overview of {employees.length} employees across all departments
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          <SummaryBadge
            label="Avg Score"
            value={String(
              Math.round(
                employees.reduce((sum, e) => sum + e.score, 0) / employees.length,
              ),
            )}
          />
          <SummaryBadge
            label="Departments"
            value={String(new Set(employees.map((e) => e.department)).size)}
          />
          <SummaryBadge
            label="Plans Ready"
            value={String(Object.keys(plans).length)}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
        }}
      >
        <ScoreDistribution employees={employees} />
        <DepartmentComparison employees={employees} />
        <CompetencyHeatmap employees={employees} />
        <TrainingCoverage employees={employees} plans={plans} />
      </div>
    </div>
  );
}

function SummaryBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--color-gray-100)',
        borderRadius: 10,
        padding: '8px 16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--color-primary-950)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
    </div>
  );
}
