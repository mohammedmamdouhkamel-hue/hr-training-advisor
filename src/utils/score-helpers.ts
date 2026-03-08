export function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 65) return '#F59E0B';
  return '#EF4444';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 65) return 'Developing';
  return 'Needs Focus';
}
