import { motion } from 'framer-motion';
import { TrendingUp, Target, Award } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { getScoreCategory } from '../../types/employee';

const COLORS = { strong: '#34D399', developing: '#FBBF24', needsFocus: '#F87171' };

export default function MyProgressPage() {
  const { employees } = useEmployees();
  const employee = employees[0] || null;

  if (!employee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <TrendingUp size={48} style={{ color: 'rgba(99,102,241,0.3)' }} />
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>No data available</p>
        <p style={{ fontSize: '0.82rem' }}>Upload results to see your progress.</p>
      </div>
    );
  }

  const category = getScoreCategory(employee.score);
  const color = COLORS[category];
  const competencies = Object.entries(employee.competencies).sort((a, b) => b[1] - a[1]);
  const avgPeers = employees.length > 1
    ? Math.round(employees.reduce((s, e) => s + e.score, 0) / employees.length)
    : employee.score;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 800 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>My Progress</h1>
      <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: '0.88rem' }}>Your performance overview</p>

      {/* Score summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon={Target} label="My Score" value={`${employee.score}%`} color={color} />
        <StatCard icon={TrendingUp} label="Peer Average" value={`${avgPeers}%`} color="#6366F1" />
        <StatCard icon={Award} label="Category" value={category === 'needsFocus' ? 'Needs Focus' : category === 'developing' ? 'Developing' : 'Strong'} color={color} />
      </div>

      {/* Competency breakdown */}
      <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Competency Breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {competencies.map(([name, score]) => {
            const cat = getScoreCategory(score);
            const barColor = COLORS[cat];
            return (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 500 }}>{name}</span>
                  <span style={{ fontSize: '0.85rem', color: barColor, fontWeight: 700 }}>{score}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; value: string; color: string }) {
  return (
    <div style={{ borderRadius: 12, padding: '18px 20px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>{value}</div>
    </div>
  );
}
