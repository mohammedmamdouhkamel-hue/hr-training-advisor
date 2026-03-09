import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Employee } from '../../types/employee';
import type { TrainingPlan } from '../../types/training-plan';

interface TrainingCoverageProps {
  employees: Employee[];
  plans: Record<string, TrainingPlan>;
}

interface CoverageData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  generated: '#059669',
  pending: '#4F46E5',
};

export default function TrainingCoverage({ employees, plans }: TrainingCoverageProps) {
  const generated = employees.filter((emp) => plans[emp.name] !== undefined).length;
  const pending = employees.length - generated;

  const data: CoverageData[] = [
    { name: 'Plans Generated', value: generated, color: COLORS.generated },
    { name: 'Pending', value: pending, color: COLORS.pending },
  ];

  const total = employees.length;
  const pct = total > 0 ? Math.round((generated / total) * 100) : 0;

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        borderRadius: 10,
        border: '1px solid var(--surface-border)',
        padding: 24,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <h3
        style={{
          margin: '0 0 20px 0',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--color-primary-950)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Training Plan Coverage
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--color-primary-950)',
                border: 'none',
                borderRadius: 8,
                color: '#FFFFFF',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
              }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value, name) => [
                `${value} employees`,
                name ?? '',
              ]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--color-primary-950)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {pct}%
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 2,
          }}
        >
          {generated} of {total} employees covered
        </span>
      </div>
    </div>
  );
}
