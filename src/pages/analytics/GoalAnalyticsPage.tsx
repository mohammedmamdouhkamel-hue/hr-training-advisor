import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Target, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';
import { useEmployees } from '../../hooks/useEmployees';
import { validateGoalWeights } from '../../utils/goal-transformer';
import { computeGoalPerformanceScore } from '../../utils/performance-score';
import type { GoalRating } from '../../types/goal';

// ─── Constants ──────────────────────────────────────────────────────────────────

const RATING_COLORS: Record<GoalRating, string> = {
  Outstanding: '#34D399',
  Exceeds: '#6366F1',
  Meets: '#FBBF24',
  Below: '#F87171',
  Unrated: '#64748B',
};

const RATING_ORDER: GoalRating[] = ['Outstanding', 'Exceeds', 'Meets', 'Below', 'Unrated'];

const BAR_COLORS = ['#6366F1', '#818CF8', '#A78BFA', '#8B5CF6', '#C084FC', '#7C3AED', '#DDD6FE'];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

const glassCard: React.CSSProperties = {
  borderRadius: 12,
  padding: '24px 28px',
  background: 'rgba(15,23,42,0.7)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const tooltipStyle = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  fontSize: '0.78rem',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  color: '#F8FAFC',
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function GoalAnalyticsPage() {
  const { goals, goalsByEmployee } = useGoals();
  const { employees } = useEmployees();

  const weightValidation = useMemo(() => validateGoalWeights(goals), [goals]);

  // Summary stats
  const totalGoals = goals.length;
  const employeeCount = Object.keys(goalsByEmployee).length;
  const invalidWeightCount = weightValidation.invalid.length;

  const avgWeightedScore = useMemo(() => {
    const employeeNames = Object.keys(goalsByEmployee);
    if (employeeNames.length === 0) return 0;
    const total = employeeNames.reduce((sum, name) => {
      const result = computeGoalPerformanceScore(goalsByEmployee[name]);
      return sum + result.weightedScore;
    }, 0);
    return Math.round((total / employeeNames.length) * 10) / 10;
  }, [goalsByEmployee]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of RATING_ORDER) counts[r] = 0;
    for (const g of goals) counts[g.rating] = (counts[g.rating] || 0) + 1;
    return RATING_ORDER.map(r => ({ name: r, value: counts[r], color: RATING_COLORS[r] }));
  }, [goals]);

  // Goal completion by department
  const deptData = useMemo(() => {
    const empDeptMap: Record<string, string> = {};
    for (const e of employees) empDeptMap[e.name] = e.department;

    const deptGoals: Record<string, { total: number; rated: number }> = {};
    for (const g of goals) {
      const dept = empDeptMap[g.employeeName] || 'Unknown';
      if (!deptGoals[dept]) deptGoals[dept] = { total: 0, rated: 0 };
      deptGoals[dept].total++;
      if (g.rating !== 'Unrated') deptGoals[dept].rated++;
    }

    return Object.entries(deptGoals)
      .map(([dept, d]) => ({
        department: dept.length > 18 ? dept.slice(0, 16) + '...' : dept,
        fullName: dept,
        completion: d.total > 0 ? Math.round((d.rated / d.total) * 100) : 0,
        total: d.total,
        rated: d.rated,
      }))
      .sort((a, b) => b.completion - a.completion);
  }, [goals, employees]);

  // Weight distribution histogram
  const weightDistribution = useMemo(() => {
    const buckets: Record<string, number> = {
      '0-10%': 0, '11-20%': 0, '21-30%': 0, '31-40%': 0, '41-50%': 0, '51%+': 0,
    };
    for (const g of goals) {
      if (g.weight <= 10) buckets['0-10%']++;
      else if (g.weight <= 20) buckets['11-20%']++;
      else if (g.weight <= 30) buckets['21-30%']++;
      else if (g.weight <= 40) buckets['31-40%']++;
      else if (g.weight <= 50) buckets['41-50%']++;
      else buckets['51%+']++;
    }
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [goals]);

  // Average progress by category
  const categoryProgress = useMemo(() => {
    const cats: Record<string, { sum: number; count: number }> = {};
    for (const g of goals) {
      if (!cats[g.category]) cats[g.category] = { sum: 0, count: 0 };
      cats[g.category].sum += g.progress;
      cats[g.category].count++;
    }
    return Object.entries(cats).map(([cat, d]) => ({
      category: cat === 'Personal goals' ? 'Personal' : 'Dept/Service',
      avgProgress: d.count > 0 ? Math.round(d.sum / d.count) : 0,
      count: d.count,
    }));
  }, [goals]);

  const statCards = [
    { label: 'Total Goals', value: String(totalGoals), Icon: Target, color: '#6366F1' },
    { label: 'Employees with Goals', value: String(employeeCount), Icon: Users, color: '#818CF8' },
    { label: 'Avg Weighted Score', value: String(avgWeightedScore), Icon: TrendingUp, color: '#34D399' },
    { label: 'Invalid Weight Count', value: String(invalidWeightCount), Icon: AlertTriangle, color: invalidWeightCount > 0 ? '#F87171' : '#34D399' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 1280 }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Goal
          </span>{' '}
          Analytics
        </h1>
        <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.88rem' }}>
          Organization-wide goal performance insights
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {statCards.map(s => (
          <motion.div
            key={s.label}
            variants={itemVariants}
            style={{
              borderRadius: 12, padding: '18px 20px',
              background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${s.color}1A`, border: `1px solid ${s.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <s.Icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Rating Distribution Pie */}
        <motion.div variants={itemVariants} style={glassCard}>
          <p style={{ margin: '0 0 16px', color: '#F8FAFC', fontWeight: 700, fontSize: '0.92rem' }}>
            Rating Distribution
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={ratingDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                labelLine={false}
                style={{ fontSize: '0.72rem', fontFamily: 'Plus Jakarta Sans, sans-serif', fill: '#CBD5E1' }}
              >
                {ratingDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#94A3B8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Goal Completion by Department */}
        <motion.div variants={itemVariants} style={glassCard}>
          <p style={{ margin: '0 0 16px', color: '#F8FAFC', fontWeight: 700, fontSize: '0.92rem' }}>
            Goal Completion by Department
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="department" tick={{ fill: '#94A3B8', fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, _name: string, props: { payload?: { fullName?: string; rated?: number; total?: number } }) => [
                  `${value}% (${props.payload?.rated ?? 0}/${props.payload?.total ?? 0})`,
                  props.payload?.fullName ?? 'Completion',
                ]}
              />
              <Bar dataKey="completion" radius={[0, 6, 6, 0]}>
                {deptData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weight Distribution Histogram */}
        <motion.div variants={itemVariants} style={glassCard}>
          <p style={{ margin: '0 0 16px', color: '#F8FAFC', fontWeight: 700, fontSize: '0.92rem' }}>
            Weight Distribution
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weightDistribution} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
              <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#818CF8" radius={[6, 6, 0, 0]} name="Goals" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Average Progress by Category */}
        <motion.div variants={itemVariants} style={glassCard}>
          <p style={{ margin: '0 0 16px', color: '#F8FAFC', fontWeight: 700, fontSize: '0.92rem' }}>
            Average Progress by Category
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryProgress} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
              <XAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value}%`, 'Avg Progress']}
              />
              <Bar dataKey="avgProgress" fill="#6366F1" radius={[6, 6, 0, 0]} name="Avg Progress">
                {categoryProgress.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#818CF8' : '#8B5CF6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
            {categoryProgress.map(c => (
              <span key={c.category} style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {c.category}: {c.count} goals
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
