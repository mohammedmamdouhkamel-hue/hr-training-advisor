import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Goal } from '../../types/goal';
import { computeGoalPerformanceScore } from '../../utils/performance-score';

interface PerformanceReviewProps {
  goals: Goal[];
  competencyScore?: number;
}

const scoreColor = (score: number) =>
  score >= 70 ? '#34D399' : score >= 40 ? '#FBBF24' : '#F87171';

const ratingBadgeColor: Record<string, string> = {
  Outstanding: '#34D399',
  Exceeds: '#6366F1',
  Meets: '#FBBF24',
  Below: '#F87171',
  Unrated: '#64748B',
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

export default function PerformanceReview({ goals, competencyScore }: PerformanceReviewProps) {
  const result = useMemo(() => computeGoalPerformanceScore(goals), [goals]);
  const color = scoreColor(result.weightedScore);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (circumference * Math.min(result.weightedScore, 100)) / 100;

  const diff = competencyScore !== undefined
    ? Math.round((result.weightedScore - competencyScore) * 10) / 10
    : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* Score + Comparison row */}
      <motion.div variants={itemVariants} style={{
        display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24,
      }}>
        {/* Circular score */}
        <div style={{
          borderRadius: 16, padding: 28,
          background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 180,
        }}>
          <svg width={128} height={128} viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
              cx="64" cy="64" r="54" fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 64 64)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x="64" y="58" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
              {result.weightedScore}
            </text>
            <text x="64" y="78" textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="500" fontFamily="Plus Jakarta Sans, sans-serif">
              / 100
            </text>
          </svg>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#F8FAFC', fontWeight: 700, fontSize: '0.92rem' }}>
              Goal Performance
            </p>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.78rem' }}>
              {result.completionRate}% goals rated
            </p>
          </div>
        </div>

        {/* Comparison badge */}
        {competencyScore !== undefined && diff !== null && (
          <div style={{
            borderRadius: 16, padding: 28, flex: '1 1 200px',
            background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Award size={18} style={{ color: '#818CF8' }} />
              <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.92rem' }}>
                Score Comparison
              </span>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Competency Score
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 700, color: '#818CF8' }}>
                  {competencyScore}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Goal Score
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 700, color }}>
                  {result.weightedScore}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Difference
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  {diff > 0 ? <TrendingUp size={16} style={{ color: '#34D399' }} /> :
                   diff < 0 ? <TrendingDown size={16} style={{ color: '#F87171' }} /> :
                   <Minus size={16} style={{ color: '#94A3B8' }} />}
                  <p style={{
                    margin: 0, fontSize: '1.3rem', fontWeight: 700,
                    color: diff > 0 ? '#34D399' : diff < 0 ? '#F87171' : '#94A3B8',
                  }}>
                    {diff > 0 ? '+' : ''}{diff}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Breakdown table */}
      <motion.div variants={itemVariants} style={{
        borderRadius: 12, overflow: 'hidden',
        background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: 0, color: '#F8FAFC', fontWeight: 700, fontSize: '0.92rem' }}>
            Goal Breakdown
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Goal Title', 'Weight %', 'Rating', 'Weighted Score'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600,
                    fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.breakdown.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
                    No goals available
                  </td>
                </tr>
              )}
              {result.breakdown.map((row, idx) => {
                const rating = goals[idx]?.rating || 'Unrated';
                const badgeColor = ratingBadgeColor[rating] || '#64748B';
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', color: '#F8FAFC', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.goalTitle}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#CBD5E1', fontWeight: 600 }}>
                      {row.weight}%
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                        background: `${badgeColor}1A`, color: badgeColor,
                        border: `1px solid ${badgeColor}33`,
                      }}>
                        {rating}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: scoreColor(row.weightedContribution * (100 / Math.max(row.weight, 1))) }}>
                      {row.weightedContribution.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
              {/* Total row */}
              {result.breakdown.length > 0 && (
                <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '14px 16px', color: '#F8FAFC', fontWeight: 800 }}>Total</td>
                  <td style={{ padding: '14px 16px', color: '#CBD5E1', fontWeight: 700 }}>
                    {result.breakdown.reduce((s, b) => s + b.weight, 0)}%
                  </td>
                  <td style={{ padding: '14px 16px' }} />
                  <td style={{ padding: '14px 16px', fontWeight: 800, color, fontSize: '0.92rem' }}>
                    {result.weightedScore}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
