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

const AVATAR_COLORS = [
  ['#4F46E5', '#818CF8'], // indigo
  ['#7C3AED', '#A78BFA'], // violet
  ['#059669', '#34D399'], // emerald
  ['#D97706', '#FBBF24'], // amber
  ['#DC2626', '#F87171'], // red
  ['#0891B2', '#22D3EE'], // cyan
  ['#DB2777', '#F472B6'], // pink
  ['#2563EB', '#60A5FA'], // blue
];

function getAvatarColor(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default memo(function EmployeeCard({ emp, onSelect, isSelected, hasPlan }: EmployeeCardProps) {
  const scoreColor = getScoreColor(emp.score);
  const [colorFrom, colorTo] = getAvatarColor(emp.name);
  const initials = getInitials(emp.name);

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelect(emp)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(emp); } }}
      className="employee-card"
      style={{
        background: isSelected ? 'var(--color-primary-bg)' : 'var(--surface-card)',
        border: '1px solid',
        borderColor: isSelected ? 'var(--color-primary)' : 'var(--surface-border)',
        borderLeft: isSelected ? '3px solid var(--color-primary)' : '1px solid var(--surface-border)',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: 8,
        boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 2px 8px ${colorFrom}30`,
        }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>{initials}</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-md)', color: isSelected ? 'var(--color-primary-dark)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.role} · {emp.department}</div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: isSelected ? 'var(--color-primary)' : scoreColor, lineHeight: 1 }}>{emp.score}</div>
          <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>/ 100</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginLeft: 52 }}>
        {!isSelected && <ScoreBadge score={emp.score} />}
        {hasPlan && <span style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle2 size={12} /> Plan Ready</span>}
      </div>
    </div>
  );
});
