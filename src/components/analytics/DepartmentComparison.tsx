import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { Employee } from '../../types/employee';

interface DepartmentComparisonProps {
  employees: Employee[];
}

interface DepartmentData {
  department: string;
  avgScore: number;
  color: string;
}

function getBarColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 65) return '#F59E0B';
  return '#EF4444';
}

export default function DepartmentComparison({ employees }: DepartmentComparisonProps) {
  const deptMap = new Map<string, number[]>();

  for (const emp of employees) {
    const scores = deptMap.get(emp.department) ?? [];
    scores.push(emp.score);
    deptMap.set(emp.department, scores);
  }

  const data: DepartmentData[] = Array.from(deptMap.entries())
    .map(([department, scores]) => {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      return {
        department,
        avgScore: Math.round(avg * 10) / 10,
        color: getBarColor(avg),
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);

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
        Department Comparison
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="department"
            width={100}
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
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
            labelStyle={{ color: '#94A3B8', fontWeight: 600 }}
            formatter={(value) => [`${value}`, 'Avg Score']}
          />
          <Bar dataKey="avgScore" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
