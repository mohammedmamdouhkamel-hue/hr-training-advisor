import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, ChevronRight } from 'lucide-react';
import { useTeamEmployees } from '../../hooks/useTeamEmployees';
import { getScoreCategory } from '../../types/employee';
import type { ScoreCategory } from '../../types/employee';
import { loadPlans } from '../../services/storage';

const CATEGORY_COLORS: Record<ScoreCategory, string> = { strong: '#34D399', developing: '#FBBF24', needsFocus: '#F87171' };
const CATEGORY_LABELS: Record<ScoreCategory, string> = { strong: 'Strong', developing: 'Developing', needsFocus: 'Needs Focus' };

export default function TeamPage() {
  const { teamEmployees: employees } = useTeamEmployees();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const plans = useMemo(() => loadPlans() || {}, []);

  const filtered = useMemo(() =>
    employees.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())),
    [employees, search]
  );

  if (employees.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Users size={48} style={{ color: 'rgba(5,150,105,0.3)' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No team data loaded</p>
        <p style={{ fontSize: '0.82rem' }}>Ask your admin to upload results.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 900 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>My Team</h1>
      <p style={{ margin: '0 0 20px', color: '#94A3B8', fontSize: '0.88rem' }}>{employees.length} team members</p>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team..."
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        />
      </div>

      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(emp => {
          const cat = getScoreCategory(emp.score);
          const color = CATEGORY_COLORS[cat];
          return (
            <motion.div key={emp.name}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              onClick={() => navigate(`/employees/${encodeURIComponent(emp.name)}`)}
              whileHover={{ borderColor: 'rgba(5,150,105,0.3)' }}
              style={{ borderRadius: 12, padding: '16px 20px', cursor: 'pointer', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.15s' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: `${color}22`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700, color }}>
                {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#F8FAFC' }}>{emp.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>{emp.role}</div>
              </div>
              {plans[emp.name] && <span style={{ fontSize: '0.68rem', color: '#34D399', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(52,211,153,0.1)' }}>Plan Ready</span>}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color, lineHeight: 1 }}>{emp.score}</div>
                <div style={{ fontSize: '0.6rem', color: '#64748B', marginTop: 2 }}>{CATEGORY_LABELS[cat]}</div>
              </div>
              <ChevronRight size={16} style={{ color: '#475569' }} />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
