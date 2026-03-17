import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target, TrendingUp, CheckCircle2, AlertTriangle, BookOpen,
} from 'lucide-react';
import { useTeamGoals } from '../../hooks/useTeamGoals';
import { useAuth } from '../../hooks/useAuth';
import { validateGoalWeights } from '../../utils/goal-transformer';
import type { GoalRating, GoalCategory } from '../../types/goal';
import { RATING_SCORE_MAP } from '../../types/goal';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const RATING_COLORS: Record<GoalRating, string> = {
  Outstanding: '#34D399', Exceeds: '#6366F1', Meets: '#FBBF24', Below: '#F87171', Unrated: '#64748B',
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  'Personal goals': '#818CF8', 'Department/Service goals': '#8B5CF6',
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

export default function MyGoalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teamGoals } = useTeamGoals(); // Already filtered to employee's own goals

  const weightTotal = useMemo(() => teamGoals.reduce((s, g) => s + g.weight, 0), [teamGoals]);
  const isWeightValid = Math.abs(weightTotal - 100) < 0.5;
  const avgProgress = useMemo(
    () => teamGoals.length > 0 ? Math.round(teamGoals.reduce((s, g) => s + g.progress, 0) / teamGoals.length) : 0,
    [teamGoals],
  );
  const ratedGoals = useMemo(() => teamGoals.filter(g => g.rating !== 'Unrated'), [teamGoals]);
  const avgRatingScore = useMemo(() => {
    if (ratedGoals.length === 0) return 0;
    return Math.round(ratedGoals.reduce((s, g) => s + RATING_SCORE_MAP[g.rating], 0) / ratedGoals.length);
  }, [ratedGoals]);

  const summaryStats = [
    { label: 'My Goals', value: String(teamGoals.length), Icon: Target, color: '#6366F1' },
    { label: 'Avg Progress', value: `${avgProgress}%`, Icon: TrendingUp, color: '#059669' },
    { label: 'Goals Rated', value: `${ratedGoals.length}/${teamGoals.length}`, Icon: CheckCircle2, color: '#8B5CF6' },
    { label: 'Weight Total', value: `${weightTotal}%`, Icon: isWeightValid ? CheckCircle2 : AlertTriangle, color: isWeightValid ? '#34D399' : '#F87171' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 960 }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            My
          </span>{' '}
          Goals
        </h1>
        <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.88rem' }}>
          Your performance goals from SuccessFactors (read-only)
        </p>
      </motion.div>

      {/* Summary stats */}
      <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {summaryStats.map(s => (
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
              <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Performance summary */}
      {ratedGoals.length > 0 && (
        <motion.div
          variants={itemVariants}
          style={{
            borderRadius: 12, padding: '18px 24px', marginBottom: 24,
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}
        >
          <TrendingUp size={20} style={{ color: '#818CF8', flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#CBD5E1', fontWeight: 600 }}>
              Overall Performance Score: <span style={{ color: '#F8FAFC', fontSize: '1rem', fontWeight: 800 }}>{avgRatingScore}%</span>
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748B' }}>
              Based on {ratedGoals.length} rated goal{ratedGoals.length === 1 ? '' : 's'}
            </p>
          </div>
        </motion.div>
      )}

      {/* No goals state */}
      {teamGoals.length === 0 && (
        <motion.div variants={itemVariants} style={{
          borderRadius: 16, padding: '48px 32px', textAlign: 'center',
          background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Target size={48} style={{ color: '#475569', marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px', color: '#F8FAFC', fontWeight: 700 }}>No Goals Found</h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>
            Your goals have not been imported yet. Please contact your HR coordinator.
          </p>
        </motion.div>
      )}

      {/* Goal cards */}
      <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {teamGoals.map(goal => {
          const ratingColor = RATING_COLORS[goal.rating];
          const categoryColor = CATEGORY_COLORS[goal.category];

          return (
            <motion.div
              key={goal.id}
              variants={itemVariants}
              whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(0,0,0,0.25)', transition: { duration: 0.15 } }}
              onClick={() => navigate(`/goals/${goal.id}`)}
              style={{
                borderRadius: 14, padding: '22px 26px', cursor: 'pointer',
                background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.3 }}>{goal.title}</h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 600,
                      background: `${categoryColor}1A`, color: categoryColor, border: `1px solid ${categoryColor}33`,
                    }}>
                      {goal.category === 'Personal goals' ? 'Personal' : 'Dept/Service'}
                    </span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.06)', color: '#94A3B8',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      Weight: {goal.weight}%
                    </span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 600,
                      background: `${ratingColor}1A`, color: ratingColor, border: `1px solid ${ratingColor}33`,
                    }}>
                      {goal.rating}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC' }}>{goal.progress}%</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#64748B' }}>progress</p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    height: '100%', borderRadius: 3,
                    background: goal.progress >= 80 ? 'linear-gradient(90deg, #34D399, #059669)' :
                      goal.progress >= 50 ? 'linear-gradient(90deg, #FBBF24, #F59E0B)' :
                        'linear-gradient(90deg, #F87171, #EF4444)',
                  }}
                />
              </div>

              {/* Training link */}
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={e => { e.stopPropagation(); navigate('/my-plan'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: 0,
                    background: 'none', border: 'none', color: '#818CF8', fontSize: '0.76rem',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <BookOpen size={12} /> View Training Plan
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
