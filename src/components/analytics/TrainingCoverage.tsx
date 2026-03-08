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
  generated: '#10B981',
  pending: '#3B82F6',
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
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        padding: 24,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <h3
        style={{
          margin: '0 0 20px 0',
          fontSize: 15,
          fontWeight: 700,
          color: '#0F172A',
          fontFamily: "'DM Sans', system-ui, sans-serif",
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
                background: '#0F172A',
                border: 'none',
                borderRadius: 8,
                color: '#FFFFFF',
                fontSize: 12,
                fontFamily: "'DM Sans', system-ui, sans-serif",
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
                    color: '#64748B',
                    fontSize: 11,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
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
            color: '#0F172A',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {pct}%
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 11,
            color: '#94A3B8',
            marginTop: 2,
          }}
        >
          {generated} of {total} employees covered
        </span>
      </div>
    </div>
  );
}
