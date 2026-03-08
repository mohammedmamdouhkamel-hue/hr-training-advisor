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

interface ScoreDistributionProps {
  employees: Employee[];
}

interface BucketData {
  range: string;
  count: number;
  color: string;
}

const RANGES: { label: string; min: number; max: number }[] = [
  { label: '0-49', min: 0, max: 49 },
  { label: '50-59', min: 50, max: 59 },
  { label: '60-69', min: 60, max: 69 },
  { label: '70-79', min: 70, max: 79 },
  { label: '80-89', min: 80, max: 89 },
  { label: '90-100', min: 90, max: 100 },
];

function getBucketColor(min: number): string {
  if (min >= 80) return '#10B981';
  if (min >= 65) return '#F59E0B';
  return '#EF4444';
}

export default function ScoreDistribution({ employees }: ScoreDistributionProps) {
  const data: BucketData[] = RANGES.map(({ label, min, max }) => ({
    range: label,
    count: employees.filter((e) => e.score >= min && e.score <= max).length,
    color: getBucketColor(min),
  }));

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
        Score Distribution
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
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
            formatter={(value) => [`${value} employees`, 'Count']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
