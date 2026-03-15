import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Users, Upload, ChevronRight } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { getScoreCategory } from '../../types/employee';
import type { Employee, ScoreCategory } from '../../types/employee';
import { loadPlans } from '../../services/storage';

const CATEGORY_COLORS: Record<ScoreCategory, string> = {
  strong: '#34D399',
  developing: '#FBBF24',
  needsFocus: '#F87171',
};
const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  strong: 'Strong',
  developing: 'Developing',
  needsFocus: 'Needs Focus',
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

export default function EmployeesPage() {
  const { employees } = useEmployees();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const plans = useMemo(() => loadPlans() || {}, []);

  const departments = useMemo(() => [...new Set(employees.map(e => e.department))].sort(), [employees]);

  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.role.toLowerCase().includes(search.toLowerCase())) return false;
      if (deptFilter && e.department !== deptFilter) return false;
      if (categoryFilter && getScoreCategory(e.score) !== categoryFilter) return false;
      return true;
    });
  }, [employees, search, deptFilter, categoryFilter]);

  if (employees.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Users size={48} style={{ color: 'rgba(99,102,241,0.3)' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No employees loaded</p>
        <button onClick={() => navigate('/upload')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', color: '#fff',
          fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          <Upload size={16} /> Upload Results
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>All Employees</h1>
        <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.88rem' }}>{employees.length} employees loaded</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or role..."
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
              background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{
          padding: '10px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,255,255,0.08)', color: '#F8FAFC', fontSize: '0.85rem',
          cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{
          padding: '10px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,255,255,0.08)', color: '#F8FAFC', fontSize: '0.85rem',
          cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          <option value="">All Categories</option>
          <option value="strong">Strong (80+)</option>
          <option value="developing">Developing (65-79)</option>
          <option value="needsFocus">Needs Focus (&lt;65)</option>
        </select>
      </div>

      {/* Results count */}
      <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Employee grid */}
      <motion.div
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}
      >
        {filtered.map(emp => (
          <EmployeeRow key={emp.name} emp={emp} hasPlan={!!plans[emp.name]} onClick={() => navigate(`/employees/${encodeURIComponent(emp.name)}`)} />
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
          <Filter size={32} style={{ color: 'rgba(99,102,241,0.3)', marginBottom: 8 }} />
          <p>No employees match your filters</p>
        </div>
      )}
    </div>
  );
}

function EmployeeRow({ emp, hasPlan, onClick }: { emp: Employee; hasPlan: boolean; onClick: () => void }) {
  const category = getScoreCategory(emp.score);
  const color = CATEGORY_COLORS[category];

  return (
    <motion.div
      variants={cardVariants}
      onClick={onClick}
      style={{
        borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
        background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      whileHover={{ borderColor: 'rgba(99,102,241,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
    >
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: `linear-gradient(135deg, ${color}44, ${color}22)`,
        border: `1px solid ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.82rem', fontWeight: 700, color,
      }}>
        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>{emp.role} &middot; {emp.department}</div>
      </div>

      {/* Score + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {hasPlan && <span style={{ fontSize: '0.68rem', color: '#34D399', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(52,211,153,0.1)' }}>Plan Ready</span>}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color, lineHeight: 1 }}>{emp.score}</div>
          <div style={{ fontSize: '0.6rem', color: '#64748B', marginTop: 2 }}>{CATEGORY_LABELS[category]}</div>
        </div>
        <ChevronRight size={16} style={{ color: '#475569' }} />
      </div>
    </motion.div>
  );
}
