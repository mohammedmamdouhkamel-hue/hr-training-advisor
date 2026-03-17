import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Target, FileText, MessageSquare, Award } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';
import type { GoalRating, GoalCategory, GoalStatus } from '../../types/goal';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const RATING_COLORS: Record<GoalRating, string> = {
  Outstanding: '#34D399', Exceeds: '#6366F1', Meets: '#FBBF24', Below: '#F87171', Unrated: '#64748B',
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  'Personal goals': '#818CF8', 'Department/Service goals': '#8B5CF6',
};

const STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<GoalStatus, string> = {
  not_started: '#64748B', in_progress: '#FBBF24', completed: '#34D399', cancelled: '#F87171',
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { goals } = useGoals();

  const goal = useMemo(() => goals.find(g => g.id === goalId), [goals, goalId]);

  if (!goal) {
    return (
      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 40, textAlign: 'center', color: '#94A3B8' }}>
        <AlertCircle size={48} style={{ color: 'rgba(239,68,68,0.4)', marginBottom: 12 }} />
        <h2 style={{ color: '#F8FAFC', margin: '0 0 8px' }}>Goal not found</h2>
        <p>The goal &quot;{goalId}&quot; was not found.</p>
        <button onClick={() => navigate('/goals')} style={{
          marginTop: 16, padding: '10px 20px', borderRadius: 10,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none',
          color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>Back to Goals</button>
      </div>
    );
  }

  const ratingColor = RATING_COLORS[goal.rating];
  const categoryColor = CATEGORY_COLORS[goal.category];
  const statusColor = STATUS_COLORS[goal.status];

  return (
    <motion.div
      initial="hidden" animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } } }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 860 }}
    >
      {/* Back button */}
      <motion.button
        variants={itemVariants}
        onClick={() => navigate('/goals')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
          background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer',
          fontSize: '0.85rem', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back to Goals
      </motion.button>

      {/* Goal Header Card */}
      <motion.div
        variants={itemVariants}
        style={{
          borderRadius: 16, padding: '28px 32px', marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Target size={22} style={{ color: '#818CF8' }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.3 }}>{goal.title}</h1>
            <button
              onClick={() => navigate(`/employees/${encodeURIComponent(goal.employeeName)}`)}
              style={{
                margin: '6px 0 0', padding: 0, background: 'none', border: 'none',
                color: '#818CF8', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif', textDecoration: 'underline',
                textDecorationColor: 'rgba(129,140,248,0.3)', textUnderlineOffset: 2,
              }}
            >
              {goal.employeeName}
            </button>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                background: `${categoryColor}1A`, color: categoryColor, border: `1px solid ${categoryColor}33`,
              }}>
                {goal.category}
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                background: `${statusColor}1A`, color: statusColor, border: `1px solid ${statusColor}33`,
              }}>
                {STATUS_LABELS[goal.status]}
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                Weight: {goal.weight}%
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {goal.routeStep}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 500 }}>Progress</span>
            <span style={{ fontSize: '0.78rem', color: '#F8FAFC', fontWeight: 700 }}>{goal.progress}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: 4,
                background: goal.progress >= 80 ? 'linear-gradient(90deg, #34D399, #059669)' :
                  goal.progress >= 50 ? 'linear-gradient(90deg, #FBBF24, #F59E0B)' :
                    'linear-gradient(90deg, #F87171, #EF4444)',
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Description */}
      {goal.description && (
        <motion.div
          variants={itemVariants}
          style={{
            borderRadius: 12, padding: '24px 28px', marginBottom: 16,
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <FileText size={16} style={{ color: '#818CF8' }} />
            <h2 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Description
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.7 }}>{goal.description}</p>
        </motion.div>
      )}

      {/* Expected Result */}
      {goal.expectedResult && (
        <motion.div
          variants={itemVariants}
          style={{
            borderRadius: 12, padding: '24px 28px', marginBottom: 16,
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Target size={16} style={{ color: '#059669' }} />
            <h2 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Expected Result
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.7 }}>{goal.expectedResult}</p>
        </motion.div>
      )}

      {/* Mid-Year Feedback */}
      {goal.midYearFeedback && (
        <motion.div
          variants={itemVariants}
          style={{
            borderRadius: 12, padding: '24px 28px', marginBottom: 16,
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <MessageSquare size={16} style={{ color: '#FBBF24' }} />
            <h2 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Mid-Year Feedback
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.7 }}>{goal.midYearFeedback}</p>
          {goal.midYearAdjustment && (
            <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#FCD34D' }}>
                <strong>Adjustment:</strong> {goal.midYearAdjustment}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Rating & Achievement */}
      <motion.div
        variants={itemVariants}
        style={{
          borderRadius: 12, padding: '24px 28px', marginBottom: 16,
          background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Award size={16} style={{ color: ratingColor }} />
          <h2 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Rating &amp; Achievement
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Rating</p>
            <span style={{
              padding: '6px 16px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 700,
              background: `${ratingColor}1A`, color: ratingColor, border: `1px solid ${ratingColor}33`,
              display: 'inline-block',
            }}>
              {goal.rating}
            </span>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Achievement</p>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC' }}>{goal.achievementPercent}%</p>
          </div>
        </div>
        {goal.ratingDescription && (
          <p style={{ margin: '14px 0 0', fontSize: '0.84rem', color: '#94A3B8', lineHeight: 1.6 }}>{goal.ratingDescription}</p>
        )}
      </motion.div>
    </motion.div>
  );
}
