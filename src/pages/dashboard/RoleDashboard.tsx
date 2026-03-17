import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, BarChart3, Activity,
  TrendingUp, CheckCircle2, Zap, Target,
  Upload, FileText, Building2, Bell, Database,
  Star, Flame, Trophy, ArrowUpRight, ArrowDownRight, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { useEmployees } from '../../hooks/useEmployees';
import { useTeamEmployees } from '../../hooks/useTeamEmployees';
import { useTeamGoals } from '../../hooks/useTeamGoals';
import { RoleBadge } from '../../components/shared/RoleBadge';
import type { UserRole } from '../../types/auth';
import type { Employee, UploadMeta } from '../../types/employee';
import { getScoreCategory } from '../../types/employee';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StatCardData {
  label:       string;
  value:       string;
  Icon:        React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false'; style?: React.CSSProperties }>;
  accentColor: string;
  trend?:      number;
  trendLabel?: string;
}

interface QuickAction {
  label:   string;
  Icon:    React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  color:   string;
  onClick: () => void;
}

// ─── Dashboard Configs ─────────────────────────────────────────────────────────

function computeStats(employees: Employee[]): { departments: number; avgScore: number; strong: number; developing: number; needsFocus: number } {
  const departments = new Set(employees.map(e => e.department)).size;
  const avgScore = employees.length ? Math.round(employees.reduce((s, e) => s + e.score, 0) / employees.length) : 0;
  let strong = 0, developing = 0, needsFocus = 0;
  employees.forEach(e => {
    const cat = getScoreCategory(e.score);
    if (cat === 'strong') strong++;
    else if (cat === 'developing') developing++;
    else needsFocus++;
  });
  return { departments, avgScore, strong, developing, needsFocus };
}

function getStatsConfig(employees: Employee[], _meta: UploadMeta | null): Record<UserRole, { stats: StatCardData[]; subtitle: string }> {
  const hasData = employees.length > 0;
  const s = hasData ? computeStats(employees) : null;

  return {
    admin: {
      subtitle: hasData ? 'Real data from uploaded results' : 'Upload employee results to see real metrics',
      stats: hasData && s ? [
        { label: 'Total Employees', value: String(s.departments > 0 ? employees.length : '--'), Icon: Users,          accentColor: '#6366F1', trendLabel: 'from results' },
        { label: 'Departments',     value: String(s.departments),                               Icon: Building2,      accentColor: '#8B5CF6', trendLabel: 'unique' },
        { label: 'Avg Score',       value: `${s.avgScore}%`,                                    Icon: TrendingUp,     accentColor: '#059669', trendLabel: 'across all' },
        { label: 'Needs Focus',     value: String(s.needsFocus),                                Icon: AlertTriangle,  accentColor: '#EF4444', trendLabel: 'score < 65' },
      ] : [
        { label: 'Total Employees', value: '--', Icon: Users,     accentColor: '#6366F1', trendLabel: 'no data yet' },
        { label: 'Departments',     value: '--', Icon: Building2, accentColor: '#8B5CF6', trendLabel: 'no data yet' },
        { label: 'Avg Score',       value: '--', Icon: TrendingUp,accentColor: '#059669', trendLabel: 'no data yet' },
        { label: 'Needs Focus',     value: '--', Icon: AlertTriangle, accentColor: '#EF4444', trendLabel: 'no data yet' },
      ],
    },
    manager: {
      subtitle: hasData ? 'Team performance from uploaded results' : 'Upload employee results to see team metrics',
      stats: hasData && s ? [
        { label: 'Team Size',    value: String(employees.length), Icon: Users,         accentColor: '#059669', trendLabel: 'from results' },
        { label: 'Avg Score',    value: `${s.avgScore}%`,         Icon: Star,          accentColor: '#F59E0B', trendLabel: 'across team' },
        { label: 'Strong',       value: String(s.strong),         Icon: CheckCircle2,  accentColor: '#6366F1', trendLabel: 'score 80+' },
        { label: 'Needs Focus',  value: String(s.needsFocus),     Icon: Bell,          accentColor: '#EF4444', trendLabel: 'score < 65' },
      ] : [
        { label: 'Team Size',   value: '--', Icon: Users,        accentColor: '#059669', trendLabel: 'no data yet' },
        { label: 'Avg Score',   value: '--', Icon: Star,         accentColor: '#F59E0B', trendLabel: 'no data yet' },
        { label: 'Strong',      value: '--', Icon: CheckCircle2, accentColor: '#6366F1', trendLabel: 'no data yet' },
        { label: 'Needs Focus', value: '--', Icon: Bell,         accentColor: '#EF4444', trendLabel: 'no data yet' },
      ],
    },
    employee: {
      subtitle: hasData ? 'Your learning journey from uploaded results' : 'Upload results to track your progress',
      stats: hasData && s ? [
        { label: 'My Progress',       value: `${s.avgScore}%`,       Icon: TrendingUp,   accentColor: '#6366F1', trendLabel: 'avg score' },
        { label: 'Total Peers',       value: String(employees.length),Icon: Users,        accentColor: '#059669', trendLabel: 'in dataset' },
        { label: 'Strong Performers', value: String(s.strong),        Icon: Trophy,       accentColor: '#8B5CF6', trendLabel: 'score 80+' },
        { label: 'Developing',        value: String(s.developing),    Icon: Flame,        accentColor: '#F97316', trendLabel: 'score 65-79' },
      ] : [
        { label: 'My Progress',       value: '--', Icon: TrendingUp, accentColor: '#6366F1', trendLabel: 'no data yet' },
        { label: 'Total Peers',       value: '--', Icon: Users,      accentColor: '#059669', trendLabel: 'no data yet' },
        { label: 'Strong Performers', value: '--', Icon: Trophy,     accentColor: '#8B5CF6', trendLabel: 'no data yet' },
        { label: 'Developing',        value: '--', Icon: Flame,      accentColor: '#F97316', trendLabel: 'no data yet' },
      ],
    },
    hr_coordinator: {
      subtitle: hasData ? 'Company-wide intelligence from uploaded results' : 'Upload employee results to see real metrics',
      stats: hasData && s ? [
        { label: 'Total Employees', value: String(employees.length), Icon: Users,         accentColor: '#7C3AED', trendLabel: 'from results' },
        { label: 'Departments',     value: String(s.departments),    Icon: Building2,     accentColor: '#6366F1', trendLabel: 'unique' },
        { label: 'Avg Score',       value: `${s.avgScore}%`,         Icon: TrendingUp,    accentColor: '#059669', trendLabel: 'across all' },
        { label: 'Needs Focus',     value: String(s.needsFocus),     Icon: AlertTriangle, accentColor: '#F59E0B', trendLabel: 'score < 65' },
      ] : [
        { label: 'Total Employees', value: '--', Icon: Users,         accentColor: '#7C3AED', trendLabel: 'no data yet' },
        { label: 'Departments',     value: '--', Icon: Building2,     accentColor: '#6366F1', trendLabel: 'no data yet' },
        { label: 'Avg Score',       value: '--', Icon: TrendingUp,    accentColor: '#059669', trendLabel: 'no data yet' },
        { label: 'Needs Focus',     value: '--', Icon: AlertTriangle, accentColor: '#F59E0B', trendLabel: 'no data yet' },
      ],
    },
  };
}

function getActions(navigate: (path: string) => void): Record<UserRole, QuickAction[]> {
  return {
    admin: [
      { label: 'Upload Results', Icon: Upload,    color: '#6366F1', onClick: () => navigate('/upload') },
      { label: 'View Goals',     Icon: Target,    color: '#8B5CF6', onClick: () => navigate('/goals') },
      { label: 'View Audit Log', Icon: BarChart3, color: '#059669', onClick: () => navigate('/admin/audit-log') },
      { label: 'System Config',  Icon: Zap,       color: '#0EA5E9', onClick: () => navigate('/admin/config') },
    ],
    manager: [
      { label: 'Team Members',   Icon: Users,        color: '#059669', onClick: () => navigate('/team') },
      { label: 'Team Goals',     Icon: Target,       color: '#8B5CF6', onClick: () => navigate('/goals') },
      { label: 'Team Analytics', Icon: BarChart3,    color: '#6366F1', onClick: () => navigate('/analytics/team') },
    ],
    employee: [
      { label: 'My Goals',             Icon: Target,     color: '#8B5CF6', onClick: () => navigate('/my-goals') },
      { label: 'My Training Plan',     Icon: BookOpen,   color: '#6366F1', onClick: () => navigate('/my-plan') },
      { label: 'View Recommendations', Icon: Lightbulb,  color: '#F59E0B', onClick: () => navigate('/recommendations') },
      { label: 'My Progress',          Icon: TrendingUp, color: '#059669', onClick: () => navigate('/my-progress') },
    ],
    hr_coordinator: [
      { label: 'Upload Results',  Icon: Upload,    color: '#7C3AED', onClick: () => navigate('/upload') },
      { label: 'View Goals',      Icon: Target,    color: '#8B5CF6', onClick: () => navigate('/goals') },
      { label: 'Generate Report', Icon: FileText,  color: '#6366F1', onClick: () => navigate('/reports') },
      { label: 'View Analytics',  Icon: BarChart3, color: '#059669', onClick: () => navigate('/analytics') },
    ],
  };
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

const headerVariants = {
  hidden:  { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.38, ease: 'easeOut' as const } },
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

const StatCard = memo<{ data: StatCardData; index: number }>(({ data }) => {
  const isPositive = (data.trend ?? 0) >= 0;
  const hasTrend   = data.trend !== undefined;

  return (
    <motion.article
      variants={cardVariants}
      aria-label={`${data.label}: ${data.value}`}
      style={{
        borderRadius: '12px',
        padding: '22px 24px',
        background: 'var(--surface-bg, rgba(15,23,42,0.7))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      whileHover={{
        y: -3,
        boxShadow: `0 8px 32px rgba(0,0,0,0.28), 0 0 0 1px ${data.accentColor}33`,
        transition: { duration: 0.18 },
      }}
    >
      {/* Glow orb */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `${data.accentColor}22`,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      {/* Icon + trend row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: `${data.accentColor}1A`,
            border: `1px solid ${data.accentColor}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <data.Icon size={20} aria-hidden="true" style={{ color: data.accentColor } as React.CSSProperties} />
        </div>

        {hasTrend && data.trend !== 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: isPositive ? '#34D399' : '#F87171',
            }}
            aria-label={`${isPositive ? 'Up' : 'Down'} ${Math.abs(data.trend!)}${data.trendLabel ? ', ' + data.trendLabel : ''}`}
          >
            {isPositive
              ? <ArrowUpRight size={14} aria-hidden="true" />
              : <ArrowDownRight size={14} aria-hidden="true" />
            }
            {Math.abs(data.trend!)}
            {typeof data.value === 'string' && data.value.includes('%') ? 'pp' : '%'}
          </div>
        )}
      </div>

      {/* Value + label */}
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '1.9rem',
            fontWeight: 700,
            color: 'var(--text-primary, #F8FAFC)',
            lineHeight: 1.15,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          {data.value}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '0.8rem',
            color: 'var(--text-muted, #94A3B8)',
            fontWeight: 500,
          }}
        >
          {data.label}
        </p>
        {data.trendLabel && (
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '0.7rem',
              color: 'var(--text-muted, #64748B)',
            }}
          >
            {data.trendLabel}
          </p>
        )}
      </div>
    </motion.article>
  );
});
StatCard.displayName = 'StatCard';

// ─── QuickActionButton ────────────────────────────────────────────────────────

const QuickActionButton = memo<{ action: QuickAction; index: number }>(({ action }) => (
  <motion.button
    variants={cardVariants}
    onClick={action.onClick}
    whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
    whileTap={{ scale: 0.97 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 20px',
      borderRadius: '10px',
      background: `${action.color}18`,
      border: `1px solid ${action.color}33`,
      color: action.color,
      fontSize: '0.84rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      transition: 'background 0.15s ease',
      whiteSpace: 'nowrap',
    }}
    aria-label={action.label}
  >
    <action.Icon size={16} aria-hidden="true" />
    {action.label}
  </motion.button>
));
QuickActionButton.displayName = 'QuickActionButton';

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const RoleDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { employees: allEmployees, uploadMeta } = useEmployees();
  const { teamEmployees } = useTeamEmployees();
  const { teamGoals } = useTeamGoals();

  // Managers/employees see scoped data; admin/HR see all
  const employees = user && ['manager', 'employee'].includes(user.role) ? teamEmployees : allEmployees;

  const actions = useMemo(() => getActions(navigate), [navigate]);
  const statsConfig = useMemo(() => getStatsConfig(employees, uploadMeta), [employees, uploadMeta]);

  if (!user) return null;

  const config = { ...statsConfig[user.role], actions: actions[user.role] };
  const firstName = user.fullName.split(' ')[0] ?? user.fullName;
  const hasData = employees.length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        maxWidth: '1280px',
      }}
    >
      {/* ── Welcome Header ── */}
      <motion.header variants={headerVariants}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: 800,
                color: '#FFFFFF',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Welcome back,{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {firstName}
              </span>
              &nbsp;👋
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                color: '#CBD5E1',
                fontSize: '0.9rem',
                fontWeight: 400,
              }}
            >
              {config.subtitle}
            </p>
          </div>
          <RoleBadge role={user.role} size="md" />
        </div>
      </motion.header>

      {/* ── Data Status Banner ── */}
      {hasData && uploadMeta && (
        <motion.div
          variants={cardVariants}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 18px', borderRadius: 10,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.18)',
            fontSize: '0.8rem', color: '#A5B4FC',
          }}
        >
          <Database size={14} style={{ flexShrink: 0, color: '#818CF8' }} />
          <span>
            <strong>{employees.length} employees</strong> loaded from <strong>{uploadMeta.filename}</strong>
          </span>
        </motion.div>
      )}
      {!hasData && (
        <motion.div
          variants={cardVariants}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 18px', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.18)',
            fontSize: '0.8rem', color: '#FCD34D',
          }}
        >
          <Upload size={14} style={{ flexShrink: 0, color: '#FBBF24' }} />
          <span>No results uploaded yet. <strong style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/upload')}>Upload now</strong> to see real metrics.</span>
        </motion.div>
      )}

      {/* ── Stat Cards Grid ── */}
      <section aria-labelledby="stats-heading">
        <h2
          id="stats-heading"
          style={{
            margin: '0 0 16px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-muted, #64748B)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Overview
        </h2>
        <motion.div
          variants={containerVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {config.stats.map((stat, i) => (
            <StatCard key={stat.label} data={stat} index={i} />
          ))}
        </motion.div>
      </section>

      {/* ── Quick Actions ── */}
      <section aria-labelledby="actions-heading">
        <h2
          id="actions-heading"
          style={{
            margin: '0 0 14px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-muted, #64748B)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Quick Actions
        </h2>
        <motion.div
          variants={containerVariants}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {config.actions.map((action, i) => (
            <QuickActionButton key={action.label} action={action} index={i} />
          ))}
        </motion.div>
      </section>

      {/* ── Activity Feed ── */}
      <motion.section variants={cardVariants}>
        <ActivityFeed />
      </motion.section>
    </motion.div>
  );
};

export default RoleDashboard;
