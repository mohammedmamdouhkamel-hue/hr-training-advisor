import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { getScoreCategory } from '../../types/employee';

export default function RecommendationsPage() {
  const { employees } = useEmployees();

  // For employee role: show first employee; for other roles this would be different
  const employee = employees[0] || null;

  const recommendations = useMemo(() => {
    if (!employee) return [];
    return Object.entries(employee.competencies)
      .filter(([, score]) => score < 70)
      .sort((a, b) => a[1] - b[1])
      .map(([name, score]) => ({
        competency: name,
        score,
        category: getScoreCategory(score),
        suggestion: score < 50
          ? `Foundational training in ${name} is strongly recommended. Consider beginner-level courses.`
          : score < 65
          ? `${name} needs improvement. Intermediate courses would help close the gap.`
          : `${name} is developing well. Advanced focused practice will bring this to target.`,
      }));
  }, [employee]);

  if (!employee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Lightbulb size={48} style={{ color: 'rgba(99,102,241,0.3)' }} />
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>No data available</p>
        <p style={{ fontSize: '0.82rem' }}>Upload results to see recommendations.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 800 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>Recommendations</h1>
      <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: '0.88rem' }}>AI-powered training suggestions based on your scores</p>

      {recommendations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, borderRadius: 12, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <TrendingUp size={32} style={{ color: '#34D399', marginBottom: 8 }} />
          <p style={{ color: '#34D399', fontWeight: 600, margin: '0 0 4px' }}>All competencies are above target!</p>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>Keep up the great work.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recommendations.map(rec => (
            <div key={rec.competency} style={{
              borderRadius: 12, padding: '20px 24px',
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <AlertTriangle size={16} style={{ color: rec.score < 50 ? '#F87171' : '#FBBF24' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>{rec.competency}</span>
                <span style={{
                  marginLeft: 'auto', padding: '2px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                  color: rec.score < 50 ? '#F87171' : '#FBBF24',
                  background: rec.score < 50 ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                }}>{rec.score}%</span>
              </div>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.5 }}>{rec.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
