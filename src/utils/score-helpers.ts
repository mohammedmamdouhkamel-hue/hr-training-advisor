export function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 65) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 65) return 'Developing';
  return 'Needs Focus';
}
