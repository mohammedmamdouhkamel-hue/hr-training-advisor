import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { getScoreCategory } from '../../types/employee';

const COLORS = { strong: '#34D399', developing: '#FBBF24', needsFocus: '#F87171' };

export default function PersonalAnalyticsPage() {
  const { employees } = useEmployees();
  const employee = employees[0] || null;

  const peerComparison = useMemo(() => {
    if (!employee || employees.length <= 1) return null;
    const sorted = [...employees].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex(e => e.name === employee.name) + 1;
    const percentile = Math.round(((employees.length - rank) / employees.length) * 100);
    return { rank, total: employees.length, percentile };
  }, [employees, employee]);

  if (!employee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <BarChart3 size={48} style={{ color: 'rgba(99,102,241,0.3)' }} />
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>No data available</p>
      </div>
    );
  }

  const competencies = Object.entries(employee.competencies).sort((a, b) => b[1] - a[1]);
  const strongest = competencies[0];
  const weakest = competencies[competencies.length - 1];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 800 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>Personal Analytics</h1>
      <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: '0.88rem' }}>Your individual performance analysis</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {strongest && (
          <div style={{ borderRadius: 12, padding: '18px 20px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Strongest Skill</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34D399' }}>{strongest[0]}</div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{strongest[1]}%</div>
          </div>
        )}
        {weakest && (
          <div style={{ borderRadius: 12, padding: '18px 20px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Area to Improve</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F87171' }}>{weakest[0]}</div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{weakest[1]}%</div>
          </div>
        )}
        {peerComparison && (
          <div style={{ borderRadius: 12, padding: '18px 20px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Peer Ranking</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#818CF8' }}>#{peerComparison.rank} of {peerComparison.total}</div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{peerComparison.percentile}th percentile</div>
          </div>
        )}
      </div>

      {/* All competencies */}
      <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>All Competencies</h2>
        {competencies.map(([name, score]) => {
          const cat = getScoreCategory(score);
          return (
            <div key={name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>{name}</span>
                <span style={{ fontSize: '0.85rem', color: COLORS[cat], fontWeight: 700 }}>{score}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score}%`, borderRadius: 3, background: COLORS[cat], transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
