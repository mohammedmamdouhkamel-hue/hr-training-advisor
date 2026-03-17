import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target, Search, Filter, Upload, ChevronRight,
  BarChart3, CheckCircle2, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { useTeamGoals } from '../../hooks/useTeamGoals';
import { useGoals } from '../../hooks/useGoals';
import { useAuth } from '../../hooks/useAuth';
import { validateGoalWeights } from '../../utils/goal-transformer';
import type { GoalCategory, GoalRating } from '../../types/goal';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const RATING_COLORS: Record<GoalRating, string> = {
  Outstanding: '#34D399',
  Exceeds: '#6366F1',
  Meets: '#FBBF24',
  Below: '#F87171',
  Unrated: '#64748B',
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  'Personal goals': '#818CF8',
  'Department/Service goals': '#8B5CF6',
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function GoalsListPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { teamGoals } = useTeamGoals();
  const { goalStats } = useGoals();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | ''>('');
  const [ratingFilter, setRatingFilter] = useState<GoalRating | ''>('');

  const canImport = hasPermission('goals:import');

  const weightValidation = useMemo(() => validateGoalWeights(teamGoals), [teamGoals]);
  const invalidWeightCount = weightValidation.invalid.length;

  const filtered = useMemo(() => {
    let result = teamGoals;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        g => g.employeeName.toLowerCase().includes(q) || g.title.toLowerCase().includes(q),
      );
    }
    if (categoryFilter) result = result.filter(g => g.category === categoryFilter);
    if (ratingFilter) result = result.filter(g => g.rating === ratingFilter);
    return result;
  }, [teamGoals, search, categoryFilter, ratingFilter]);

  const stats = [
    { label: 'Total Goals', value: String(goalStats.total), Icon: Target, color: '#6366F1' },
    { label: 'Avg Progress', value: `${goalStats.avgProgress}%`, Icon: TrendingUp, color: '#059669' },
    { label: 'Goals Rated', value: String(goalStats.rated), Icon: CheckCircle2, color: '#8B5CF6' },
    { label: 'Invalid Weights', value: String(invalidWeightCount), Icon: AlertTriangle, color: invalidWeightCount > 0 ? '#F87171' : '#34D399' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 1280 }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Goals
            </span>{' '}
            Management
          </h1>
          <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.88rem' }}>
            Read-only view &mdash; SuccessFactors is the system of record
          </p>
        </div>
        {canImport && (
          <button
            onClick={() => navigate('/goals/upload')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none',
              color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            }}
          >
            <Upload size={16} /> Import Goals
          </button>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
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

      {/* Filters */}
      <motion.div variants={itemVariants} style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search by employee or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, fontSize: '0.84rem',
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: '#64748B' }} />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as GoalCategory | '')}
            style={{
              padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem',
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer',
            }}
          >
            <option value="">All Categories</option>
            <option value="Personal goals">Personal</option>
            <option value="Department/Service goals">Department/Service</option>
          </select>
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value as GoalRating | '')}
            style={{
              padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem',
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer',
            }}
          >
            <option value="">All Ratings</option>
            <option value="Outstanding">Outstanding</option>
            <option value="Exceeds">Exceeds</option>
            <option value="Meets">Meets</option>
            <option value="Below">Below</option>
            <option value="Unrated">Unrated</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} style={{
        borderRadius: 12, overflow: 'hidden',
        background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Employee', 'Goal Title', 'Category', 'Weight', 'Rating', 'Progress', 'Route Step', ''].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600,
                    fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                    No goals found matching your filters.
                  </td>
                </tr>
              )}
              {filtered.map(goal => (
                <tr
                  key={goal.id}
                  onClick={() => navigate(`/goals/${goal.id}`)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(99,102,241,0.06)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px 16px', color: '#CBD5E1', fontWeight: 600, whiteSpace: 'nowrap' }}>{goal.employeeName}</td>
                  <td style={{ padding: '12px 16px', color: '#F8FAFC', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.title}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                      background: `${CATEGORY_COLORS[goal.category]}1A`, color: CATEGORY_COLORS[goal.category],
                      border: `1px solid ${CATEGORY_COLORS[goal.category]}33`, whiteSpace: 'nowrap',
                    }}>
                      {goal.category === 'Personal goals' ? 'Personal' : 'Dept/Service'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#CBD5E1', fontWeight: 600 }}>{goal.weight}%</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                      background: `${RATING_COLORS[goal.rating]}1A`, color: RATING_COLORS[goal.rating],
                      border: `1px solid ${RATING_COLORS[goal.rating]}33`,
                    }}>
                      {goal.rating}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3, width: `${goal.progress}%`,
                          background: goal.progress >= 80 ? 'linear-gradient(90deg, #34D399, #059669)' :
                            goal.progress >= 50 ? 'linear-gradient(90deg, #FBBF24, #F59E0B)' :
                              'linear-gradient(90deg, #F87171, #EF4444)',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, minWidth: 32 }}>{goal.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{goal.routeStep}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <ChevronRight size={14} style={{ color: '#475569' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
