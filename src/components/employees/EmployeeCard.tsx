import { memo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Employee } from '../../types/employee';
import { getScoreColor } from '../../utils/score-helpers';
import ScoreBadge from '../shared/ScoreBadge';

interface EmployeeCardProps {
  emp: Employee;
  onSelect: (emp: Employee) => void;
  isSelected: boolean;
  hasPlan: boolean;
}

export default memo(function EmployeeCard({ emp, onSelect, isSelected, hasPlan }: EmployeeCardProps) {
  const scoreColor = getScoreColor(emp.score);
  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelect(emp)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(emp); } }}
      style={{ background: isSelected ? '#0F172A' : 'var(--surface-card)', border: `2px solid ${isSelected ? '#0F172A' : 'var(--surface-border)'}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? '#fff' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
          <div style={{ fontSize: 12, color: isSelected ? '#94A3B8' : 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.role} · {emp.department}</div>
        </div>
        <div style={{ textAlign: 'right', marginLeft: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: isSelected ? '#60A5FA' : scoreColor }}>{emp.score}</div>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>/ 100</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!isSelected && <ScoreBadge score={emp.score} />}
        {hasPlan && <span style={{ fontSize: 10, color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle2 size={12} /> Plan Ready</span>}
      </div>
    </div>
  );
});
