import { getScoreColor, getScoreLabel } from '../../utils/score-helpers';

interface ScoreBadgeProps {
  score: number;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  return (
    <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
      {label}
    </span>
  );
}
