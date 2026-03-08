import { memo } from 'react';
import { getScoreColor } from '../../utils/score-helpers';

interface CompetencyBarProps {
  name: string;
  score: number;
}

export default memo(function CompetencyBar({ name, score }: CompetencyBarProps) {
  const color = getScoreColor(score);
  return (
    <div style={{ marginBottom: 10 }} role="meter" aria-label={`${name} score`} aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{name}</span>
        <span style={{ color, fontWeight: 700 }}>{score}</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-code-bg)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
});
